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

    const isAvailable = await checkAvailability(doctorName, appointmentDate, appointmentTime);
    if (!isAvailable) return;  // If slot unavailable, show message and return early
    
    try {
        const response = await fetch('/book-appointment', {
            method: 'POST',
            body: appointmentDetails,
        });

        if (!response.ok) {
            // Log the response status and the response text for debugging
            const errorData = await response.json();
            console.error("Error response from server:", errorData);
            throw new Error(errorData.message || 'Failed to book appointment.');
        }

        const data = await response.json();
        const appointmentId = data.appointment.appointmentId; // Get appointment ID

        $('#qrCodeModal').modal('show');
        startPaymentTimer(appointmentId);
    } catch (error) {
        console.error("Error booking appointment:", error);
        alert("An error occurred while booking the appointment: " + error.message);
    }
}

function startPaymentTimer(appointmentId) {
    let timer = 120; // 2 minutes
    const timerDisplay = document.getElementById('timerDisplay');

    const interval = setInterval(async () => {
        timer -= 1;
        const minutes = Math.floor(timer / 60);
        const seconds = timer % 60;
        timerDisplay.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

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

function clearForm() {
    document.getElementById('patientName').value = '';
    document.getElementById('phoneNumber').value = '';
    document.getElementById('medicalReports').value = ''; // Reset file input
    $('#appointmentDate').val(''); // Reset date picker
    $('#appointmentTime').val(''); // Reset time picker
}

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
function onBookAppointmentClick(doctorName) {
    openBookingModal(doctorName);
}
