function openBookingModal(doctorName) {
    $('#doctorName').val(doctorName); // Set the doctor name in the hidden input
    $('#appointmentDate').val($('#date').val()); // Set the appointment date
    $('#appointmentTime').val($('#time').val()); // Set the appointment time
    $('#bookingModal').modal('show'); // Show the modal
}

async function submitAppointment() {
    const patientName = document.getElementById('patientName').value;
    const doctorName = document.getElementById('doctorName').value;
    const appointmentDate = document.getElementById('appointmentDate').value;
    const appointmentTime = document.getElementById('appointmentTime').value;
    const phoneNumber = document.getElementById('phoneNumber').value;
    const medicalReports = document.getElementById('medicalReports').files[0];

    const appointmentDetails = new FormData();
    appointmentDetails.append('patientName', patientName);
    appointmentDetails.append('doctorName', doctorName);
    appointmentDetails.append('date', appointmentDate);
    appointmentDetails.append('time', appointmentTime);
    appointmentDetails.append('phoneNumber', phoneNumber);
    appointmentDetails.append('medicalReports', medicalReports);

    console.log("Submitting appointment:", appointmentDetails); // Log appointment details

    try {
        const response = await fetch('/book-appointment', {
            method: 'POST',
            body: appointmentDetails,
        });

        console.log("Response status:", response.status); // Log response status

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to book appointment.");
        }

        const data = await response.json();
        alert("Appointment booked successfully. We will contact you soon!"); // Success message
        $('#bookingModal').modal('hide'); // Hide modal after booking
        clearForm(); // Clear the form after successful submission
    } catch (error) {
        console.error("Error booking appointment:", error);
        alert("An error occurred while booking the appointment: " + error.message);
    }
}

// Function to clear the form fields
function clearForm() {
    document.getElementById('patientName').value = '';
    document.getElementById('phoneNumber').value = '';
    document.getElementById('medicalReports').value = ''; // Reset file input
    $('#appointmentDate').val(''); // Reset date picker
    $('#appointmentTime').val(''); // Reset time picker
}

// Check availability function
async function checkAvailability(doctorName, date, time) {
    try {
        const response = await fetch('/check-availability', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ doctorName, date, time })
        });

        const data = await response.json();
        alert(data.message); // Inform user of availability
        return data.isAvailable; // Return the actual availability status
    } catch (error) {
        alert("Error checking availability: " + error.message);
        return false;
    }
}

// Use this function to trigger opening the modal from your button
function onBookAppointmentClick(doctorName) {
    openBookingModal(doctorName);
}
