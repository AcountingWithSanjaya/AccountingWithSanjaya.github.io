document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initScrollEffects();
  initFormValidation();
  applyAnimations();
  handleCustomerTracking();
  initPurchaseModal();
  initSupportForm();
});

function initMobileMenu() {
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const navLinks = document.querySelector('.nav-links');
  const navItems = document.querySelectorAll('.nav-links a');

  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
      document.body.classList.toggle('mobile-menu-open');
    });

    navItems.forEach(item => {
      item.addEventListener('click', () => {
        document.body.classList.remove('mobile-menu-open');
      });
    });
  }
}

function initScrollEffects() {
  const header = document.querySelector('.header');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    revealElementsOnScroll();
  });

  const anchorLinks = document.querySelectorAll('a[href^="#"]');

  anchorLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      if (this.getAttribute('href') !== '#') {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);

        if (targetElement) {
          const offsetTop = targetElement.offsetTop - 80;

          window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
          });
        }
      }
    });
  });

  updateActiveNavLink();
  window.addEventListener('scroll', updateActiveNavLink);
}

function updateActiveNavLink() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a');
  const scrollPosition = window.scrollY + 100;

  sections.forEach(section => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.offsetHeight;
    const sectionId = section.getAttribute('id');

    if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
      navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${sectionId}`) {
          link.classList.add('active');
        }
      });
    }
  });
}

function revealElementsOnScroll() {
  const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
  revealElements.forEach(element => {
    const elementTop = element.getBoundingClientRect().top;
    const windowHeight = window.innerHeight;
    if (elementTop < windowHeight - 100) {
      element.classList.add('active');
    }
  });
}

function initFormValidation() {
  const contactForm = document.querySelector('.contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();

      const name = this.querySelector('#name').value.trim();
      const email = this.querySelector('#email').value.trim();
      const message = this.querySelector('#message').value.trim();

      let isValid = true;

      this.querySelectorAll('.error').forEach(el => el.remove());

      if (name === '') {
        addError(this.querySelector('#name'), 'Please enter your name');
        isValid = false;
      }

      if (email === '') {
        addError(this.querySelector('#email'), 'Please enter your email');
        isValid = false;
      } else if (!isValidEmail(email)) {
        addError(this.querySelector('#email'), 'Please enter a valid email');
        isValid = false;
      }

      if (message === '') {
        addError(this.querySelector('#message'), 'Please enter your message');
        isValid = false;
      }

      if (isValid) {
        showFormSuccess();
      }
    });
  }
}

function addError(inputElement, message) {
  const errorElement = document.createElement('div');
  errorElement.className = 'error';
  errorElement.style.color = 'var(--error-red)';
  errorElement.style.fontSize = '0.875rem';
  errorElement.style.marginTop = '4px';
  errorElement.textContent = message;

  inputElement.style.borderColor = 'var(--error-red)';
  inputElement.parentNode.appendChild(errorElement);
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function showFormSuccess() {
  const contactForm = document.querySelector('.contact-form');
  const formContent = contactForm.innerHTML;

  contactForm.innerHTML = `
    <div class="success-message" style="text-align: center; padding: 2rem;">
      <div style="color: var(--success-green); font-size: 3rem; margin-bottom: 1rem;">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      </div>
      <h3 style="color: var(--success-green); margin-bottom: 1rem;">Message Sent Successfully!</h3>
      <p style="margin-bottom: 2rem;">Thank you for reaching out. I'll get back to you as soon as possible.</p>
      <button class="btn btn-primary reset-form">Send Another Message</button>
    </div>
  `;

  contactForm.querySelector('.reset-form').addEventListener('click', () => {
    contactForm.innerHTML = formContent;
    initFormValidation();
  });
}

function applyAnimations() {
  document.querySelectorAll('.hero-text h1, .hero-text p').forEach(el => el.classList.add('fade-in'));
  document.querySelectorAll('.hero-actions').forEach(el => el.classList.add('slide-up'));
  document.querySelectorAll('.hero-image').forEach(el => el.classList.add('slide-in'));
  document.querySelectorAll('.about-image').forEach(el => el.classList.add('reveal-left'));
  document.querySelectorAll('.about-text').forEach(el => el.classList.add('reveal-right'));
  document.querySelectorAll('.stats-grid, .testimonial-card, .timeline-item, .contact-card').forEach(el => el.classList.add('reveal'));
  document.querySelectorAll('.stats-grid, .testimonials-container, .contact-info').forEach(el => el.classList.add('stagger-items'));

  setTimeout(() => {
    revealElementsOnScroll();
  }, 100);
}

function handleCustomerTracking() {
  const returncustomer = localStorage.getItem('returncustomer');
  const url = returncustomer ? 'returnconsumer' : 'newconsumer';

  if (!returncustomer) {
    localStorage.setItem('returncustomer', 'true');
  }

  fetch(`http://deka.pylex.software:11219/${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ [url === 'returnconsumer' ? 'returncustomer' : 'newcustomer']: true })
  }).catch(error => console.error('Error:', error));
}

function initPurchaseModal() {
  const modal = document.getElementById('purchaseModal');
  const purchaseButtons = document.querySelectorAll('.purchase-btn');
  const closeBtn = document.querySelector('.close');
  const paymentForm = document.getElementById('paymentForm');

  purchaseButtons.forEach(button => {
    button.addEventListener('click', () => {
      const pkg = button.dataset.package;
      const price = button.dataset.price;
      const credits = button.dataset.credits;

      document.getElementById('summaryPackage').textContent = pkg.charAt(0).toUpperCase() + pkg.slice(1);
      document.getElementById('summaryCredits').textContent = credits + ' Credits';
      document.getElementById('summaryPrice').textContent = '$' + price;

      modal.style.display = 'block';
    });
  });

  closeBtn.addEventListener('click', () => modal.style.display = 'none');
  window.addEventListener('click', event => {
    if (event.target === modal) modal.style.display = 'none';
  });

  document.getElementById('cardNumber').addEventListener('input', e => {
    let value = e.target.value.replace(/\D/g, '');
    e.target.value = value.replace(/(.{4})/g, '$1 ').trim();
  });

  document.getElementById('expiryDate').addEventListener('input', e => {
    let value = e.target.value.replace(/\D/g, '');
    e.target.value = value.length > 2 ? value.slice(0, 2) + '/' + value.slice(2) : value;
  });

  document.getElementById('cvv').addEventListener('input', e => {
    e.target.value = e.target.value.replace(/\D/g, '');
  });

  paymentForm.addEventListener('submit', e => {
    e.preventDefault();
    const submitBtn = e.target.querySelector('.submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing...';
    setTimeout(() => {
      alert('Payment successful! Credits have been added to your account.');
      modal.style.display = 'none';
      paymentForm.reset();
      submitBtn.disabled = false;
      submitBtn.textContent = 'Complete Purchase';
    }, 1500);
  });
}

function initSupportForm() {
  const form = document.getElementById('supportForm');
  const statusMessage = document.getElementById('status-message');
  const userEmail = localStorage.getItem('userEmail');
  if (userEmail) document.getElementById('email').value = userEmail;

  form.addEventListener('submit', async event => {
    event.preventDefault();
    statusMessage.style.display = 'none';
    statusMessage.className = 'status-message';

    const formData = {
      name: document.getElementById('name').value.trim(),
      email: document.getElementById('email').value.trim(),
      subject: document.getElementById('subject').value.trim(),
      message: document.getElementById('message').value.trim()
    };

    try {
      const response = await fetch('http://deka.pylex.software:11219/SupportForm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      statusMessage.style.display = 'block';

      if (response.ok) {
        statusMessage.className = 'status-message success';
        statusMessage.textContent = 'Your message has been sent successfully!';
        form.reset();
        if (userEmail) document.getElementById('email').value = userEmail;
      } else {
        throw new Error(data.message || 'Failed to send message');
      }
    } catch (error) {
      statusMessage.className = 'status-message error';
      statusMessage.textContent = error.message || 'An error occurred. Please try again later.';
      statusMessage.style.display = 'block';
    }
  });
}