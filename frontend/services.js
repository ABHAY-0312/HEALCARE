document.addEventListener('DOMContentLoaded', function() {
    const reviews = document.querySelectorAll('.review-item');
    let currentIndex = 0;

    // Show the first review by default
    reviews[currentIndex].classList.add('active');

    // Function to show the next review
    function showNextReview() {
        reviews[currentIndex].classList.remove('active');
        currentIndex = (currentIndex + 1) % reviews.length; // Loop back to the first review
        reviews[currentIndex].classList.add('active');
    }

    // Function to show the previous review
    function showPrevReview() {
        reviews[currentIndex].classList.remove('active');
        currentIndex = (currentIndex - 1 + reviews.length) % reviews.length; // Loop back to the last review
        reviews[currentIndex].classList.add('active');
    }

    // Attach event listeners to the buttons
    document.querySelector('.next-btn').addEventListener('click', showNextReview);
    document.querySelector('.prev-btn').addEventListener('click', showPrevReview);
});
