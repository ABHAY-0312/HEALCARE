function test1() {
    var email = document.getElementById("email").value;
    var password = document.getElementById("password").value;

    // Retrieve the stored email and password from localStorage
    var storedEmail = localStorage.getItem("email");
    var storedPassword = localStorage.getItem("password");

    // Check if the input matches the stored values
    if (email === storedEmail && password === storedPassword) {
        alert("Login Successful!");
        // Redirect to the main page after successful login
        location.href = 'index1.html'; // Change this to your main page
    } else {
        alert("Invalid input. Please try again.");
    }
}
function test() {
    var email = document.getElementById("email").value;
    var password = document.getElementById("password").value;
    var cpassword = document.getElementById("cpassword").value;

    // Check if passwords match
    if (password === cpassword) {
        // Store email and password in localStorage
        localStorage.setItem("email", email);
        localStorage.setItem("password", password);
        alert("Registration successful!");
        // Redirect to the login page after registration
        location.href = 'index.html';
    } else {
        alert("Passwords do not match. Please try again.");
    }
}
