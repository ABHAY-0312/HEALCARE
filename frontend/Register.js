function test() {
    const termsCheckbox = document.getElementById('termsCheckbox');
    if (!termsCheckbox.checked) {
        alert("You must agree to the terms and conditions to register.");
        return false; // Prevents form submission
    }
    // Proceed with the registration process if the checkbox is checked
    alert("Form submitted successfully!");
}
