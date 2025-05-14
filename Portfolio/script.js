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

  fetch(`http://127.0.0.1:10209/${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ [url === 'returnconsumer' ? 'returncustomer' : 'newcustomer']: true })
  }).catch(error => console.error('Error:', error));
}

function initPurchaseModal() {
  const modal = document.getElementById('purchaseModal');
  const purchaseButtons = document.querySelectorAll('.purchase-btn');
  const closeBtn = document.querySelector('.close');
  // const paymentForm = document.getElementById('paymentForm'); // Local payment form no longer used by these buttons

  purchaseButtons.forEach(button => {
    button.addEventListener('click', async () => {
      const packageName = button.dataset.package;
      const price = button.dataset.price;
      const creditsToAdd = button.dataset.credits;

      const userEmail = localStorage.getItem('userEmail');
      const authToken = localStorage.getItem('authToken');

      if (!userEmail || !authToken) {
        alert('Please log in to make a purchase.');
        // Optionally redirect to login page: window.location.href = '/path/to/login.html';
        return;
      }

      try {
        // Show some loading indicator here if desired
        button.disabled = true;
        button.textContent = 'Processing...';

        const response = await fetch('http://127.0.0.1:10209/payhere/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            email: userEmail,
            packageName: packageName,
            price: price,
            creditsToAdd: creditsToAdd
          })
        });

        const paymentData = await response.json();

        if (response.ok && paymentData.success) {
          // Hide modal if it was somehow opened, or reset UI
          if(modal) modal.style.display = 'none';
          
          // Payment object for PayHere SDK
          const payment = {
            "sandbox": true, // Set to false for live environment
            "merchant_id": paymentData.merchant_id,
            "return_url": paymentData.return_url,
            "cancel_url": paymentData.cancel_url,
            "notify_url": paymentData.notify_url,
            "order_id": paymentData.order_id,
            "items": paymentData.items,
            "amount": paymentData.amount,
            "currency": paymentData.currency,
            "hash": paymentData.hash,
            "first_name": paymentData.first_name,
            "last_name": paymentData.last_name,
            "email": paymentData.email,
            "phone": paymentData.phone,
            "address": paymentData.address,
            "city": paymentData.city,
            "country": paymentData.country,
            "custom_1": paymentData.custom_1,
            "custom_2": paymentData.custom_2
          };
          
          payhere.startPayment(payment);

        } else {
          alert(`Error: ${paymentData.message || 'Could not initiate payment.'}`);
          button.disabled = false;
          button.textContent = 'Purchase Now';
        }
      } catch (error) {
        console.error('Purchase initiation error:', error);
        alert('An error occurred while trying to initiate payment. Please try again.');
        button.disabled = false;
        button.textContent = 'Purchase Now';
      }
    });
  });

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', event => {
      if (event.target === modal) modal.style.display = 'none';
    });
  }
  
  // Callbacks for PayHere (optional, but good for handling events)
  payhere.onCompleted = function onCompleted(orderId) {
    console.log("Payment completed. OrderID:" + orderId);
    // Note: User credit update should happen via PayHere Notify URL on the backend.
    // You might redirect to a success page or update UI here.
    // e.g., window.location.href = '/Purchase/purchase-success.html?order_id=' + orderId;
  };

  payhere.onDismissed = function onDismissed() {
    console.log("Payment dismissed");
    // Handle when user closes the PayHere payment dialog
  };

  payhere.onError = function onError(error) {
    console.log("Error:" + error);
    // Handle payment errors
    alert("Payment Error: " + error);
  };

  // The local payment form submission logic is removed as PayHere handles the payment.
  // If you still need the modal for other purposes, its related event listeners like
  // for cardNumber, expiryDate, cvv, and the paymentForm submit event would be kept,
  // but they are not used by the "Purchase Now" buttons anymore.
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
      const response = await fetch('http://127.0.0.1:10209/SupportForm', {
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
