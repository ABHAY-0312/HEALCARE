document.addEventListener('DOMContentLoaded', () => {
    const healthRecordForm = document.getElementById('healthRecordForm');

    healthRecordForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const formData = new FormData(healthRecordForm);

        try {
            const response = await fetch('/api/health-records', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                alert('Health record added successfully!');
                healthRecordForm.reset();
            } else {
                const errorData = await response.json();
                alert(`Error adding record: ${errorData.message}`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to add health record.');
        }
    });

    document.getElementById('loadRecords').addEventListener('click', async () => {
        try {
            const response = await fetch('/api/health-records');
            if (response.ok) {
                const records = await response.json();
                const recordList = document.getElementById('recordList');
                recordList.innerHTML = '';

                if (records.length === 0) {
                    recordList.innerHTML = '<li class="list-group-item">No records found.</li>'; // Display message when no records are found
                } else {
                    records.forEach(record => {
                        const listItem = document.createElement('li');
                        listItem.className = 'list-group-item';
                        listItem.innerHTML = `
                            Name: ${record.name}, Age: ${record.age}, Gender: ${record.gender}, 
                            Medical History: ${record.medicalHistory} 
                            ${record.file ? `<br><a href="/uploads/${record.file}" target="_blank">View Document</a>` : ''}
                        `;
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

    document.getElementById('clearRecords').addEventListener('click', async () => {
        const confirmClear = confirm("Are you sure you want to clear all records?");
        if (confirmClear) {
            try {
                const response = await fetch('/api/health-records', { method: 'DELETE' });
                if (response.ok) {
                    document.getElementById('recordList').innerHTML = '';
                    alert('All records have been cleared successfully!');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Failed to clear health records.');
            }
        }
    });
});
