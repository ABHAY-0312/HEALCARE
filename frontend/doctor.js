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

    const appointmentDetails = {
        patientName,
        doctorName,
        date: appointmentDate,
        time: appointmentTime
    };

    console.log("Submitting appointment:", appointmentDetails); // Log appointment details

    try {
        const response = await fetch('/book-appointment', {  // Change to the correct endpoint
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(appointmentDetails),
        });

        console.log("Response status:", response.status); // Log response status

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to book appointment.");
        }

        const data = await response.json();
        alert(data.message); // Show success message
        $('#bookingModal').modal('hide'); // Hide modal after booking
    } catch (error) {
        console.error("Error booking appointment:", error);
        alert("An error occurred while booking the appointment: " + error.message);
    }
}

// Use this function to trigger opening the modal from your button
function onBookAppointmentClick(doctorName) {
    openBookingModal(doctorName);
}
