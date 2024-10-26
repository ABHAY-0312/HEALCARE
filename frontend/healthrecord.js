document.addEventListener('DOMContentLoaded', () => {
    // Load previous health records
    document.getElementById('loadRecords').addEventListener('click', async () => {
        try {
            const response = await fetch('/api/health-records'); // Ensure this matches your server route

            if (response.ok) {
                const records = await response.json();
                const recordList = document.getElementById('recordList');
                recordList.innerHTML = ''; // Clear previous records

                if (records.length === 0) {
                    const listItem = document.createElement('li');
                    listItem.className = 'list-group-item';
                    listItem.innerText = 'No records found.';
                    recordList.appendChild(listItem);
                } else {
                    records.forEach(record => {
                        const listItem = document.createElement('li');
                        listItem.className = 'list-group-item';
                        listItem.innerText = `Name: ${record.name}, Age: ${record.age}, Gender: ${record.gender}, Medical History: ${record.medicalHistory}`;
                        recordList.appendChild(listItem);
                    });
                }
            } else {
                throw new Error('Failed to load health records.');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error loading health records.');
        }
    });

    // Clear Records button functionality
    document.getElementById('clearRecords').addEventListener('click', async () => {
        const confirmClear = confirm("Are you sure you want to clear all records?");
        if (confirmClear) {
            try {
                const response = await fetch('/api/health-records', {
                    method: 'DELETE' // Use DELETE method for clearing records
                });
    
                if (response.ok) {
                    const recordList = document.getElementById('recordList');
                    recordList.innerHTML = ''; // Clear the displayed records
                    alert('All records have been cleared successfully!');
                } else {
                    const errorData = await response.json(); // Get error details from response
                    throw new Error(errorData.message || 'Failed to clear health records.');
                }
            } catch (error) {
                console.error('Error:', error);
                alert(`Error clearing health records: ${error.message}`);
            }
        }
    });
    

    // Handle form submission for adding health records
    const healthRecordForm = document.getElementById('healthRecordForm');
    healthRecordForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent default form submission

        const name = document.getElementById('name').value;
        const age = document.getElementById('age').value;
        const gender = document.querySelector('input[name="gender"]:checked').value;
        const medicalHistory = document.getElementById('medicalHistory').value;

        try {
            const response = await fetch('/api/health-records', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, age, gender, medicalHistory })
            });

            if (response.ok) {
                alert('Health record added successfully!');
                healthRecordForm.reset(); // Reset the form
            } else {
                const errorData = await response.json();
                alert(`Error adding record: ${errorData.message}`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to add health record.');
        }
    });
});
