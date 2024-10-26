// symptomChecker.js
require('dotenv').config(); // Load .env variables
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini API with the API key from environment variable
const genAI = new GoogleGenerativeAI(process.env.API_KEY);

// Define the model
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function checkSymptoms(symptoms) {
    try {
        const prompt = `Based on symptoms like ${symptoms}, what are potential conditions and precautions?`;
        const result = await model.generateContent(prompt);

        console.log("Gemini API response:", result.response.text()); // Log the response
        return result.response.text(); // Return response text
    } catch (error) {
        console.error("Gemini API error:", error.message); // Log errors
        throw new Error("Error with the Gemini API request.");
    }
}

// Test function to see if everything is working
checkSymptoms("fever, cough");
