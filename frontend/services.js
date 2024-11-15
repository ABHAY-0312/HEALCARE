document.addEventListener('DOMContentLoaded', function() {
    const reviews = document.querySelectorAll('.review-item');
    let currentIndex = 0;

    reviews[currentIndex].classList.add('active');

    function showNextReview() {
        reviews[currentIndex].classList.remove('active');
        currentIndex = (currentIndex + 1) % reviews.length;
        reviews[currentIndex].classList.add('active');
    }

    function showPrevReview() {
        reviews[currentIndex].classList.remove('active');
        currentIndex = (currentIndex - 1 + reviews.length) % reviews.length;
        reviews[currentIndex].classList.add('active');
    }

    document.querySelector('.next-btn').addEventListener('click', showNextReview);
    document.querySelector('.prev-btn').addEventListener('click', showPrevReview);
});
