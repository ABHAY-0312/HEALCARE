// Load environment variables from .env file
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

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'frontend')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve uploads folder statically
app.use(session({ secret: 'secret-key', resave: false, saveUninitialized: true }));

// Initialize Google Generative AI with Gemini API Key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Temporary in-memory storage for users, health records, and appointments
const users = {};
const healthRecords = {};
const appointments = {};

// Configure multer for file uploads
const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, 'uploads'),
        filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
    })
});

// Check Symptoms route
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

// Register route
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

// Login route
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (users[email] && users[email].password === password) {
        req.session.user = email;
        res.status(200).json({ message: 'Login successful!' });
    } else {
        res.status(400).json({ message: 'Invalid email or password' });
    }
});

// Add health records route
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

// View health records route
app.get('/api/health-records', (req, res) => {
    const userEmail = req.session.user;

    if (!userEmail) {
        return res.status(403).json({ message: 'User not logged in' });
    }

    res.json(healthRecords[userEmail] || []);
});

// Clear health records route
app.delete('/api/health-records', (req, res) => {
    const userEmail = req.session.user;

    if (!userEmail) {
        return res.status(403).json({ message: 'User not logged in' });
    }

    healthRecords[userEmail] = [];
    res.status(200).json({ message: 'All records cleared successfully!' });
});

// Feedback submission route
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

// Check availability route
app.post('/check-availability', (req, res) => {
    const { doctorName, date, time } = req.body;
    const userEmail = req.session.user;  // Assuming user email is stored in session

    // Log the inputs for debugging purposes
    console.log(`Checking availability: doctorName=${doctorName}, date=${date}, time=${time}`);

    // Check if the user already has an appointment at the requested time
    const userAlreadyBooked = appointments[userEmail]?.some(
        appointment => appointment.doctorName === doctorName && appointment.date === date && appointment.time === time
    );

    if (userAlreadyBooked) {
        return res.json({
            isAvailable: false,
            message: 'Slot already booked for you on this date and time.'
        });
    }

    // Check if the doctor has any appointments at the requested time
    const isAvailable = !appointments[doctorName] || 
        !appointments[doctorName].some(appointment => 
            appointment.date === date && appointment.time === time);

    if (!isAvailable) {
        // Suggest 30 minutes later for the booking
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

// Function to add 30 minutes to a time string in HH:mm format
function add30Minutes(time) {
    const [hours, minutes] = time.split(":").map(Number);

    // Add 30 minutes
    let newMinutes = minutes + 30;
    let newHours = hours;

    // If minutes exceed 60, adjust the hour
    if (newMinutes >= 60) {
        newMinutes -= 60;
        newHours++;
    }

    // Ensure hour is within 24-hour range
    if (newHours >= 24) {
        newHours = 0;
    }

    // Format hours and minutes as HH:mm
    const formattedHours = newHours.toString().padStart(2, '0');
    const formattedMinutes = newMinutes.toString().padStart(2, '0');

    return `${formattedHours}:${formattedMinutes}`;
}
// Store pending payments for confirmation and timeout
const pendingPayments = {};

// Create readline interface for terminal input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
// Book appointment route with improved error checking
app.post('/book-appointment', upload.single('medicalReports'), (req, res) => {
    const { doctorName, patientName, date, time, phoneNumber } = req.body;
    const userEmail = req.session.user;  // Assuming user email is stored in session

    console.log(`Booking appointment request: userEmail=${userEmail}, doctorName=${doctorName}, date=${date}, time=${time}`);

    // Check if the user is logged in
    if (!userEmail) {
        console.log("User not logged in");
        return res.status(403).json({ message: 'User not logged in' });
    }

    // Validate required fields
    if (!doctorName || !patientName || !date || !time || !phoneNumber) {
        console.log("Missing required fields");
        return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user has already booked with the same doctor on the same date
    const hasBookedWithSameDoctorOnSameDay = appointments[userEmail]?.some(
        appointment => appointment.doctorName === doctorName && appointment.date === date
    );

    if (hasBookedWithSameDoctorOnSameDay) {
        console.log("User already booked with the same doctor on this date");
        return res.status(400).json({ message: 'Only one appointment with the same doctor is allowed on the same date.' });
    }

 // Check if the user has already booked the same slot with the doctor
 const userAlreadyBooked = appointments[userEmail]?.some(
    appointment => appointment.doctorName === doctorName && appointment.date === date && appointment.time === time
);

if (userAlreadyBooked) {
    console.log("User has already booked the slot for the same time");
    return res.status(400).json({ message: 'Slot already booked for you on this date and time.' });
}

    // Check if the doctor already has an appointment at the same time
    const appointmentStart = new Date(`${date}T${time}`);
    const appointmentEnd = new Date(appointmentStart.getTime() + 30 * 60000); // 30 minutes duration

    const isConflict = appointments[doctorName]?.some(appointment => {
        const existingStart = new Date(appointment.date + 'T' + appointment.time);
        const existingEnd = new Date(existingStart.getTime() + 30 * 60000);
        return appointmentStart < existingEnd && existingStart < appointmentEnd;
    });

    if (isConflict) {
        console.log("Time conflict with another appointment");
        // Suggest 30 minutes later for the booking
        const suggestedTime = new Date(appointmentStart.getTime() + 30 * 60000); // Add 30 minutes
    
        const suggestedTimeStr = suggestedTime.toISOString().slice(11, 16); // Format as HH:mm
        return res.status(400).json({ message: `Time slot already booked for this doctor. You can try booking at ${suggestedTimeStr}.` });
    }

    // Ensure the doctor has not exceeded the daily limit (3 appointments per day)
    if (appointments[doctorName]?.filter(appt => appt.date === date).length >= 2) {
        console.log("Doctor reached daily limit");
        return res.status(400).json({ message: 'Doctor has already reached the daily limit for appointments.' });
    }

    // Check if the appointment time is in the future (not in the past)
    if (appointmentStart < new Date()) {
        console.log("Appointment time is in the past");
        return res.status(400).json({ message: 'Cannot book appointments in the past.' });
    }

    // Assign a unique appointment ID and prepare the new appointment object
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

    // Add the new appointment to the pending payments list
    pendingPayments[appointmentId] = { confirmed: false, expired: false };

    // Respond with payment pending message
    res.status(201).json({ message: 'Please proceed with payment.', appointment: newAppointment });

    // Log the new appointment
    console.log('Appointment booked (pending):', newAppointment);

    // Ask for payment confirmation in the terminal (y/n)
    rl.question(`Appointment booked! Please confirm payment for appointment ID: ${appointmentId}. Press "y" for payment received or "n" to decline: `, (input) => {
        if (input.toLowerCase() === 'y') {
            // Confirm payment and finalize the appointment
            pendingPayments[appointmentId].confirmed = true;
            newAppointment.status = 'confirmed'; // Mark as confirmed

            // Add appointment to both the user's and doctor's list of confirmed appointments
            if (!appointments[userEmail]) appointments[userEmail] = [];
            if (!appointments[doctorName]) appointments[doctorName] = [];

            appointments[userEmail].push(newAppointment);
            appointments[doctorName].push(newAppointment);

            console.log(`Payment received for appointment: ${appointmentId}`);
        } else if (input.toLowerCase() === 'n') {
            // Decline payment and remove the pending appointment
            pendingPayments[appointmentId].expired = true;
            newAppointment.status = 'expired'; // Mark as expired
            console.log(`Payment declined for appointment: ${appointmentId}`);
        } else {
            console.log('Invalid input. Please press "y" or "n".');
        }
    });

});

// Route to confirm payment (new endpoint)
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

// Route to check payment status
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

// Terminal input for payment confirmation
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

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
