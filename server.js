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

// Add health records route with file upload support
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

    if (healthRecords[userEmail]) {
        delete healthRecords[userEmail];
        res.status(200).json({ message: 'Health records cleared successfully!' });
    } else {
        res.status(404).json({ message: 'No records found to clear.' });
    }
});

// Feedback submission route
app.post('/submit-feedback', upload.single('image'), (req, res) => {
    const { name, phone, email, issue, title, feedback, rating } = req.body;
    const image = req.file;

    console.log("Feedback Received:");
    console.log("Name:", name);
    console.log("Phone:", phone);
    console.log("Email:", email);
    console.log("Issue:", issue);
    console.log("Title:", title);
    console.log("Feedback:", feedback);
    console.log("Rating:", rating);
    if (image) console.log("Image file received:", image.filename);

    res.json({ message: "Thank you for your feedback!" });
});

// Appointment booking route
app.post('/book-appointment', upload.single('medicalReports'), (req, res) => {
    const { doctorName, patientName, date, time, phoneNumber } = req.body;
    const userEmail = req.session.user;

    if (!userEmail) {
        return res.status(403).json({ message: 'User not logged in' });
    }

    if (!doctorName || !patientName || !date || !time || !phoneNumber) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    const appointmentId = `${userEmail}-${Date.now()}`;
    const newAppointment = {
        appointmentId,
        doctorName,
        patientName,
        date,
        time,
        phoneNumber,
        medicalReport: req.file ? req.file.filename : null
    };

    if (!appointments[userEmail]) {
        appointments[userEmail] = [];
    }

    appointments[userEmail].push(newAppointment);

    console.log('New Appointment Booked:', newAppointment);
    res.status(201).json({ message: 'Appointment booked successfully!', appointment: newAppointment });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
