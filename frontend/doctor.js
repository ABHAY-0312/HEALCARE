function openBookingModal(doctorName) {
    const userConfirmed = confirm(`Rs. 50 will be charged for booking with ${doctorName}. Do you wish to continue?`);
    if (userConfirmed) {
        $('#doctorName').val(doctorName);
        $('#appointmentDate').val($('#date').val());
        $('#appointmentTime').val($('#time').val());
        $('#bookingModal').modal('show');
    }
}

async function submitAppointment() {
    // Collect appointment data as before
    const patientName = document.getElementById('patientName').value;
    const doctorName = document.getElementById('doctorName').value;
    const appointmentDate = document.getElementById('appointmentDate').value;
    const appointmentTime = document.getElementById('appointmentTime').value;
       // Run availability check before booking
       const isAvailable = await checkAvailability(doctorName, appointmentDate, appointmentTime);
       if (!isAvailable) {
           alert('Time slot already booked. Please select a different time.');
           return;
       }
    const phoneNumber = document.getElementById('phoneNumber').value;
    const medicalReports = document.getElementById('medicalReports').files[0];
    const appointmentDetails = new FormData();
    
    appointmentDetails.append('patientName', patientName);
    appointmentDetails.append('doctorName', doctorName);
    appointmentDetails.append('date', appointmentDate);
    appointmentDetails.append('time', appointmentTime);
    appointmentDetails.append('phoneNumber', phoneNumber);
    appointmentDetails.append('medicalReports', medicalReports);

    try {
        const response = await fetch('/book-appointment', {
            method: 'POST',
            body: appointmentDetails,
        });

        if (!response.ok) {
            throw new Error('Failed to book appointment.');
        }

        const data = await response.json();
        const appointmentId = data.appointment.appointmentId; // Get appointment ID

        // Show QR code modal
        $('#qrCodeModal').modal('show');
        startPaymentTimer(appointmentId);

    } catch (error) {
        console.error("Error booking appointment:", error);
        alert("An error occurred while booking the appointment: " + error.message);
    }
}

function startPaymentTimer(appointmentId) {
    let timer = 120; // 2 minutes
    const timerDisplay = document.getElementById('timerDisplay'); // This ID needs to match the HTML

    const interval = setInterval(async () => {
        timer -= 1;
        const minutes = Math.floor(timer / 60);
        const seconds = timer % 60;
        timerDisplay.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

        // Check payment status every 5 seconds during the 120-second window
        if (timer % 5 === 0) {
            const paymentStatus = await checkPaymentStatus(appointmentId);
            if (paymentStatus === 'confirmed') {
                clearInterval(interval);
                alert("Payment confirmed! Appointment booked successfully.");
                $('#qrCodeModal').modal('hide');
                return;
            } else if (paymentStatus === 'expired') {
                clearInterval(interval);
                alert("Payment failed. The money has been refunded.");
                $('#qrCodeModal').modal('hide');
                return;
            }
        }

        if (timer <= 0) {
            clearInterval(interval);
            alert("Payment failed. The money has been refunded.");
            $('#qrCodeModal').modal('hide');
        }
    }, 1000);
}


async function checkPaymentStatus(appointmentId) {
    try {
        const response = await fetch(`/check-payment-status/${appointmentId}`);
        const data = await response.json();

        if (data.status === 'confirmed') {
            return 'confirmed';
        } else if (data.status === 'expired') {
            return 'expired';
        }
        return 'pending'; // If payment is still pending
    } catch (error) {
        console.error("Error checking payment status:", error);
        return 'pending'; // Default to pending if there's an issue
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
