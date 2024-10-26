document.addEventListener('DOMContentLoaded', function() {
    const hearts = document.querySelectorAll('.rating i');
    let selectedRating = 0;

    // Heart rating selection
    hearts.forEach(heart => {
        heart.addEventListener('click', function() {
            selectedRating = this.getAttribute('data-value');
            hearts.forEach(h => {
                if (h.getAttribute('data-value') <= selectedRating) {
                    h.classList.add('selected');
                } else {
                    h.classList.remove('selected');
                }
            });
        });
    });

    // Form submission
    document.getElementById('feedback-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        formData.append('rating', selectedRating); // Append rating to formData

        try {
            const response = await fetch('/submit-feedback', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            alert(result.message); // Alert message from server response
        } catch (error) {
            alert("Error submitting feedback. Please try again.");
            console.error("Submit Feedback Error:", error);
        }
    });
});
