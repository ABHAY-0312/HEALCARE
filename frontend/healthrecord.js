document.addEventListener('DOMContentLoaded', () => {
    const healthRecordForm = document.getElementById('healthRecordForm');
    const recordList = document.getElementById('recordList');
    const loadRecordsButton = document.getElementById('loadRecords');
    const clearRecordsButton = document.getElementById('clearRecords');

   
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

  
    loadRecordsButton.addEventListener('click', async () => {
        try {
            const response = await fetch('/api/health-records');
            if (response.ok) {
                const records = await response.json();
                recordList.innerHTML = '';

                if (records.length === 0) {
                    recordList.innerHTML = '<li class="list-group-item">No records found.</li>';
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

   
    clearRecordsButton.addEventListener('click', async () => {
        if (confirm("Are you sure you want to clear all records?")) {
            try {
                const response = await fetch('/api/health-records', { method: 'DELETE' });
                if (response.ok) {
                    recordList.innerHTML = '';
                    alert('All records have been cleared successfully!');
                } else {
                    alert('Failed to clear health records.');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Failed to clear health records.');
            }
        }
    });
});
