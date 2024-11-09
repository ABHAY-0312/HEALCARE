async function test1() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const result = await response.json();
        if (response.ok) {
            alert(result.message);
            location.href = 'main.html'; // Redirect to main page on successful login
        } else {
            alert(result.message);
        }
    } catch (error) {
        console.error("Error:", error);
        alert("An error occurred. Please try again.");
    }
}
