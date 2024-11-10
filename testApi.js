const axios = require('axios');

async function testAPI() {
    const symptoms = "fever"; // You can change this to test other symptoms

    try {
        const response = await fetch("https://api.openai.com/v1/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer YOUR_OPENAI_API_KEY` // Replace this with your actual key or use process.env
            },
            body: JSON.stringify({
                model: "text-davinci-003",
                prompt: `Provide possible conditions and recommended precautions for the symptoms: ${symptoms}.`,
                max_tokens: 200,
                temperature: 0.7
            })
        });

        const data = await response.json();
        console.log(data); // Log the API response to the console
    } catch (error) {
        console.error("Error:", error);
    }
}

// Call the test function
testAPI();
