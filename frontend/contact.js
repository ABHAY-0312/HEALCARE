document.addEventListener('DOMContentLoaded', function() {
    const hearts = document.querySelectorAll('.rating i');
    let selectedRating = 0;

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

    document.getElementById('feedback-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        formData.append('rating', selectedRating);

        try {
            const response = await fetch('/submit-feedback', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            alert(result.message);
        } catch (error) {
            alert("Error submitting feedback. Please try again.");
            console.error("Submit Feedback Error:", error);
        }
    });
});
