

async function checkSymptoms() {
    const symptoms = document.getElementById('symptomsInput').value;

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

        if (!response.ok) {
            const errorMessage = await response.json();
            throw new Error(`Server Error: ${errorMessage.message}`);
        }

        const result = await response.json();
        displayResults(result);
    } catch (error) {
        alert("An error occurred while checking symptoms. Please try again later.");
        console.error("Error:", error);
    }
}

function displayResults(result) {
    const resultsContainer = document.getElementById('possibleConditions');
    resultsContainer.innerHTML = '';

    if (result.conditionsAndPrecautions) {
        const listItem = document.createElement('li');
        listItem.textContent = result.conditionsAndPrecautions;
        resultsContainer.appendChild(listItem);
    } else {
        resultsContainer.innerHTML = '<li>No conditions or precautions found.</li>';
    }
}

document.getElementById('checkSymptomsButton').addEventListener('click', checkSymptoms);
