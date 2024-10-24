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
            throw new Error('Network response was not ok');
        }

        const result = await response.json();
        displayResults(result);
    } catch (error) {
        alert("An error occurred while checking symptoms. Please try again later.");
        console.error("Error:", error);
    }
}

function displayResults(result) {
    const possibleConditionsList = document.getElementById('possibleConditions');
    const recommendedPrecautionsList = document.getElementById('recommendedPrecautions');

    // Clear previous results
    possibleConditionsList.innerHTML = '';
    recommendedPrecautionsList.innerHTML = '';

    // Example: process and append results (modify according to the actual structure of `result`)
    if (result.conditions) {
        result.conditions.forEach(condition => {
            const li = document.createElement('li');
            li.textContent = condition;
            possibleConditionsList.appendChild(li);
        });
    }

    if (result.precautions) {
        result.precautions.forEach(precaution => {
            const li = document.createElement('li');
            li.textContent = precaution;
            recommendedPrecautionsList.appendChild(li);
        });
    }
}
