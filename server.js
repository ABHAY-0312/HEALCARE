require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const readline = require('readline');

const app = express();
const PORT = 3000;
const healthRecordsFilePath = path.join(__dirname, 'healthRecords.json');

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'frontend')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000
    }
  }));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const users = {};
const healthRecords = {};
const appointments = {};

const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, 'uploads'),
        filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
    })
});

app.post('/check-symptoms', async (req, res) => {
    const { symptoms } = req.body;
    const prompt = `Based on symptoms like ${symptoms}, what are potential conditions and precautions?`;

    try {
        const result = await model.generateContent(prompt);
        const conditionsAndPrecautions = result.response.text();

        res.json({ conditionsAndPrecautions });
    } catch (error) {
        console.error("Gemini API error:", error.message);
        res.status(500).json({ message: 'Error fetching data from Gemini API' });
    }
});

app.post('/register', (req, res) => {
    const { email, password, confirmPassword } = req.body;

    if (!email || !password || password !== confirmPassword) {
        return res.status(400).json({ message: 'Invalid input or passwords do not match' });
    }

    if (users[email]) {
        return res.status(400).json({ message: 'User already exists' });
    }

    users[email] = { email, password };
    res.status(200).json({ message: 'Registration successful!' });
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (users[email] && users[email].password === password) {
        req.session.user = email;
        res.status(200).json({ message: 'Login successful!' });
    } else {
        res.status(400).json({ message: 'Invalid email or password' });
    }
});

app.post('/api/health-records', upload.single('file'), (req, res) => {
    const { name, age, gender, medicalHistory } = req.body;
    const userEmail = req.session.user;
    const file = req.file ? req.file.filename : null;

    if (!userEmail) {
        return res.status(403).json({ message: 'User not logged in' });
    }

    if (!name || !age || !gender || !medicalHistory) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    if (!healthRecords[userEmail]) {
        healthRecords[userEmail] = [];
    }

    const newRecord = { name, age, gender, medicalHistory, file };
    healthRecords[userEmail].push(newRecord);

    console.log('Health Record Received:', newRecord);
    res.status(201).json({ message: 'Health record saved successfully!', record: newRecord });
});

app.get('/api/health-records', (req, res) => {
    const userEmail = req.session.user;

    if (!userEmail) {
        return res.status(403).json({ message: 'User not logged in' });
    }

    res.json(healthRecords[userEmail] || []);
});

app.delete('/api/health-records', (req, res) => {
    const userEmail = req.session.user;

    if (!userEmail) {
        return res.status(403).json({ message: 'User not logged in' });
    }

    healthRecords[userEmail] = [];
    res.status(200).json({ message: 'All records cleared successfully!' });
});

app.post('/submit-feedback', upload.single('image'), (req, res) => {
    const { name, phone, email, issue, title, feedback, rating } = req.body;
    const image = req.file;

    console.log("Feedback Received:");
    console.log("Name:", name);
    console.log("Phone:", phone);
    console.log("Email:", email);
    console.log("Title:", title);
    console.log("Issue Description:", feedback);
    console.log("Rating:", rating);
    if (image) console.log("Image file received:", image.filename);

    res.json({ message: "Thank you for your feedback!" });
});

app.post('/check-availability', (req, res) => {
    const { doctorName, date, time } = req.body;
    const userEmail = req.session.user;

    console.log(`Checking availability: doctorName=${doctorName}, date=${date}, time=${time}`);

    const userAlreadyBooked = appointments[userEmail]?.some(
        appointment => appointment.doctorName === doctorName && appointment.date === date && appointment.time === time
    );

    if (userAlreadyBooked) {
        return res.json({
            isAvailable: false,
            message: 'Slot already booked for you on this date and time.'
        });
    }

    const isAvailable = !appointments[doctorName] || 
        !appointments[doctorName].some(appointment => 
            appointment.date === date && appointment.time === time);

    if (!isAvailable) {
        const suggestedTime = add30Minutes(time);

        console.log(`Suggested time: ${suggestedTime}`);

        return res.json({
            isAvailable: false,
            message: `Time slot already booked for this doctor. You can try booking at ${suggestedTime}.`
        });
    }

    return res.json({
        isAvailable: true, 
        message: 'Slot available'
    });
});

function add30Minutes(time) {
    const [hours, minutes] = time.split(":").map(Number);

    let newMinutes = minutes + 30;
    let newHours = hours;

    if (newMinutes >= 60) {
        newMinutes -= 60;
        newHours++;
    }

    if (newHours >= 24) {
        newHours = 0;
    }

    const formattedHours = newHours.toString().padStart(2, '0');
    const formattedMinutes = newMinutes.toString().padStart(2, '0');

    return `${formattedHours}:${formattedMinutes}`;
}

const pendingPayments = {};

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

app.post('/book-appointment', upload.single('medicalReports'), (req, res) => {
    const { doctorName, patientName, date, time, phoneNumber } = req.body;
    const userEmail = req.session.user;

    console.log(`Booking appointment request: userEmail=${userEmail}, doctorName=${doctorName}, date=${date}, time=${time}`);

    if (!userEmail) {
        console.log("User not logged in");
        return res.status(403).json({ message: 'User not logged in' });
    }

    if (!doctorName || !patientName || !date || !time || !phoneNumber) {
        console.log("Missing required fields");
        return res.status(400).json({ message: 'All fields are required' });
    }

   if (!appointments[userEmail]) {
    appointments[userEmail] = [];
}

    const hasBookedWithSameDoctorOnSameDay = appointments[userEmail]?.some(
        appointment => appointment.doctorName === doctorName && appointment.date === date
    );

    if (hasBookedWithSameDoctorOnSameDay) {
        console.log("User already booked with the same doctor on this date");
        return res.status(400).json({ message: 'Only one appointment with the same doctor is allowed on the same date.' });
    }

 const userAlreadyBooked = appointments[userEmail]?.some(
    appointment => appointment.doctorName === doctorName && appointment.date === date && appointment.time === time
);

if (userAlreadyBooked) {
    console.log("User has already booked the slot for the same time");
    return res.status(400).json({ message: 'Slot already booked for you on this date and time.' });
}

    const appointmentStart = new Date(`${date}T${time}`);
    const appointmentEnd = new Date(appointmentStart.getTime() + 30 * 60000);

    const isConflict = appointments[doctorName]?.some(appointment => {
        const existingStart = new Date(appointment.date + 'T' + appointment.time);
        const existingEnd = new Date(existingStart.getTime() + 30 * 60000);
        return appointmentStart < existingEnd && existingStart < appointmentEnd;
    });

    if (isConflict) {
        console.log("Time conflict with another appointment");
        const suggestedTime = new Date(appointmentStart.getTime() + 30 * 60000);
    
        const suggestedTimeStr = suggestedTime.toISOString().slice(11, 16);
        return res.status(400).json({ message: `Time slot already booked for this doctor. You can try booking at ${suggestedTimeStr}.` });
    }

    if (appointments[doctorName]?.filter(appt => appt.date === date).length >= 2) {
        console.log("Doctor reached daily limit");
        return res.status(400).json({ message: 'Doctor has already reached the daily limit for appointments.' });
    }

    if (appointmentStart < new Date()) {
        console.log("Appointment time is in the past");
        return res.status(400).json({ message: 'Cannot book appointments in the past.' });
    }

    const appointmentId = `${userEmail}-${Date.now()}`;
    const newAppointment = {
        appointmentId,
        doctorName,
        patientName,
        date,
        time,
        phoneNumber,
        medicalReport: req.file ? req.file.filename : null,
        
    };
     appointments[userEmail].push(newAppointment);

    pendingPayments[appointmentId] = { confirmed: false, expired: false };

    res.status(201).json({ message: 'Please proceed with payment.', appointment: newAppointment });

    console.log('Appointment booked (pending):', newAppointment);

    rl.question(`Appointment booked! Please confirm payment for appointment ID: ${appointmentId}. Press "y" for payment received or "n" to decline: `, (input) => {
        if (input.toLowerCase() === 'y') {
            pendingPayments[appointmentId].confirmed = true;
            newAppointment.status = 'confirmed';

            if (!appointments[userEmail]) appointments[userEmail] = [];
            if (!appointments[doctorName]) appointments[doctorName] = [];

            appointments[userEmail].push(newAppointment);
            appointments[doctorName].push(newAppointment);

            console.log(`Payment received for appointment: ${appointmentId}`);
        } else if (input.toLowerCase() === 'n') {
            pendingPayments[appointmentId].expired = true;
            newAppointment.status = 'expired';
            console.log(`Payment declined for appointment: ${appointmentId}`);
        } else {
            console.log('Invalid input. Please press "y" or "n".');
        }
    });

});

app.post('/confirm-payment', (req, res) => {
    const { appointmentId, paymentStatus } = req.body;

    if (!appointmentId || !paymentStatus) {
        return res.status(400).json({ message: 'Appointment ID and payment status are required' });
    }

    const paymentStatusObj = pendingPayments[appointmentId];

    if (!paymentStatusObj) {
        return res.status(404).json({ message: 'Appointment not found' });
    }

    if (paymentStatus === 'confirmed') {
        paymentStatusObj.confirmed = true;
        return res.json({ message: `Payment confirmed for appointment: ${appointmentId}` });
    } else if (paymentStatus === 'expired') {
        paymentStatusObj.expired = true;
        return res.json({ message: `Payment expired for appointment: ${appointmentId}` });
    } else {
        return res.status(400).json({ message: 'Invalid payment status' });
    }
});

app.get('/check-payment-status/:appointmentId', (req, res) => {
    const appointmentId = req.params.appointmentId;
    const paymentStatus = pendingPayments[appointmentId];

    if (!paymentStatus) {
        return res.status(404).json({ message: 'No payment found' });
    }

    if (paymentStatus.expired) {
        res.json({ status: 'expired', message: 'Payment expired' });
    } else if (paymentStatus.confirmed) {
        res.json({ status: 'confirmed', message: 'Payment confirmed' });
    } else {
        res.json({ status: 'pending', message: 'Payment pending' });
    }
});

rl.on('line', (input) => {
    const [appointmentId, response] = input.split(" ");
    if (pendingPayments[appointmentId]) {
        if (response === 'y') {
            pendingPayments[appointmentId].confirmed = true;
            console.log(`Payment received for appointment: ${appointmentId}`);
        } else if (response === 'n') {
            pendingPayments[appointmentId].expired = true;
            console.log(`Payment declined for appointment: ${appointmentId}`);
        }
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
