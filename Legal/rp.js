document.addEventListener('DOMContentLoaded', () => {
  // Handle FAQ accordion functionality
  const faqQuestions = document.querySelectorAll('.faq-question');
  
  faqQuestions.forEach(question => {
    question.addEventListener('click', () => {
      const faqId = question.getAttribute('data-faq');
      const answer = document.getElementById(`faq-${faqId}`);
      const toggle = question.querySelector('.faq-toggle');
      
      // Close all other FAQs
      document.querySelectorAll('.faq-answer').forEach(item => {
        if (item.id !== `faq-${faqId}`) {
          item.classList.remove('active');
        }
      });
      
      document.querySelectorAll('.faq-toggle').forEach(item => {
        if (item !== toggle) {
          item.classList.remove('active');
        }
      });
      
      // Toggle current FAQ
      answer.classList.toggle('active');
      toggle.classList.toggle('active');
    });
  });

  // Animate sections on scroll
  const animateSections = () => {
    const sections = document.querySelectorAll('.policy-section');
    
    sections.forEach(section => {
      const sectionTop = section.getBoundingClientRect().top;
      const windowHeight = window.innerHeight;
      
      if (sectionTop < windowHeight * 0.75) {
        section.style.opacity = '1';
        section.style.transform = 'translateY(0)';
      }
    });
  };

  // Initial animation check
  animateSections();
  
  // Animate on scroll
  window.addEventListener('scroll', animateSections);
});