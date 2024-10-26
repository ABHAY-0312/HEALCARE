require('dotenv').config();

console.log("API_KEY:", process.env.API_KEY);
console.log("GEMINI_API_KEY:", process.env.GEMINI_API_KEY);

if (!process.env.API_KEY || !process.env.GEMINI_API_KEY) {
    console.error("Missing API keys in .env file.");
    process.exit(1); // Exit the application if keys are missing
}

const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session configuration
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true
}));

// Static file serving
app.use(express.static(path.join(__dirname, 'frontend'))); // Ensure this is pointing to the right directory

// Initialize Google Generative AI with Gemini API Key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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

// Temporary in-memory storage for users and health records
const users = {}; 
const healthRecords = {}; 

// Register route
app.post('/register', (req, res) => {
    const { email, password, confirmPassword } = req.body;

    // Validate input and check password confirmation
    if (!email || !password || password !== confirmPassword) {
        return res.status(400).json({ message: 'Invalid input or passwords do not match' });
    }

    // Check if user already exists
    if (users[email]) {
        return res.status(400).json({ message: 'User already exists' });
    }

    // Store the user details
    users[email] = { email, password };
    res.status(200).json({ message: 'Registration successful!' });
});

// Login route
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    // Check if user exists and password is correct
    if (users[email] && users[email].password === password) {
        req.session.user = email; // Save user session
        res.status(200).json({ message: 'Login successful!' });
    } else {
        res.status(400).json({ message: 'Invalid email or password' });
    }
});

// Add health records route
app.post('/api/health-records', (req, res) => {
    const { name, age, gender, medicalHistory } = req.body;
    const userEmail = req.session.user; // Get the email of the logged-in user

    // Validate input
    if (!name || !age || !gender || !medicalHistory) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    // Ensure there's a place to store health records for this user
    if (!healthRecords[userEmail]) {
        healthRecords[userEmail] = []; // Initialize if it doesn't exist
    }

    // Store the health record
    const newRecord = { name, age, gender, medicalHistory };
    healthRecords[userEmail].push(newRecord); // Save the record for the specific user
    console.log('Health Record Received:', newRecord); // Log the record to console

    // Send a response
    res.status(201).json({ message: 'Health record saved successfully!' });
});

// View health records route
app.get('/api/health-records', (req, res) => {
    const userEmail = req.session.user; // Get the email of the logged-in user
    console.log("Logged-in User Email:", userEmail); // Add this line to debug

    if (healthRecords[userEmail]) {
        res.json(healthRecords[userEmail]); // Return health records for the logged-in user
    } else {
        res.json([]); // Return an empty array if no records found
    }
});

// Clear health records route
app.delete('/api/health-records', (req, res) => {
    const userEmail = req.session.user; // Get the email of the logged-in user
    console.log("Clearing records for user:", userEmail); // Debug line

    // Check if health records exist for the user
    if (healthRecords[userEmail]) {
        delete healthRecords[userEmail]; // Clear the user's records
        res.status(200).json({ message: 'Health records cleared successfully!' });
    } else {
        res.status(404).json({ message: 'No records found to clear.' });
    }
});


// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
