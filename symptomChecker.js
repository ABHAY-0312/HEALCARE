require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function checkSymptoms(symptoms) {
    try {
        const prompt = `Based on symptoms like ${symptoms}, what are potential conditions and precautions?`;
        const result = await model.generateContent(prompt);

        console.log("Gemini API response:", result.response.text());
        return result.response.text();
    } catch (error) {
        console.error("Gemini API error:", error.message);
        throw new Error("Error with the Gemini API request.");
    }
}

checkSymptoms("fever, cough");
