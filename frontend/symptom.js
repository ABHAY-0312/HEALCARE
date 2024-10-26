// symptom.js

// Function to check symptoms by sending them to the server
async function checkSymptoms() {
    const symptoms = document.getElementById('symptomsInput').value;

    // Check if the input is empty
    if (!symptoms) {
        alert("Please enter your symptoms.");
        return;
    }

    try {
        const response = await fetch('/check-symptoms', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ symptoms })
        });

        // Check if the response is not OK
        if (!response.ok) {
            const errorMessage = await response.json();
            throw new Error(`Server Error: ${errorMessage.message}`);
        }

        const result = await response.json();
        displayResults(result); // Call display function with the API response
    } catch (error) {
        alert("An error occurred while checking symptoms. Please try again later.");
        console.error("Error:", error);
    }
}

// Function to display results from the Gemini API response
function displayResults(result) {
    const resultsContainer = document.getElementById('possibleConditions');

    // Clear previous results
    resultsContainer.innerHTML = '';

    // Check if there's a response text with conditions and precautions
    if (result.conditionsAndPrecautions) {
        const listItem = document.createElement('li');
        listItem.textContent = result.conditionsAndPrecautions; // Display the full response
        resultsContainer.appendChild(listItem);
    } else {
        resultsContainer.innerHTML = '<li>No conditions or precautions found.</li>';
    }
}

// Event listener to trigger symptom checking when the button is clicked
document.getElementById('checkSymptomsButton').addEventListener('click', checkSymptoms);
