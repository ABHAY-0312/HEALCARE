async function test() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("cpassword").value;
    const termsCheckbox = document.getElementById('termsCheckbox');

    if (!termsCheckbox.checked) {
        alert("You must agree to the terms and conditions to register.");
        return; 
    }

    try {
        const response = await fetch('/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, confirmPassword })
        });

        const result = await response.json();
        if (response.ok) {
            alert(result.message);
            location.href = 'index.html'; 
        } else {
            alert(result.message);
        }
    } catch (error) {
        console.error("Error:", error);
        alert("An error occurred. Please try again.");
    }
}
