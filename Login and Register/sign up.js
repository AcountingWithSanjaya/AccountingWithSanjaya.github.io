document.addEventListener("DOMContentLoaded", async function () {
  if (!document.getElementById("loading-overlay")) {
    const loadingOverlay = document.createElement("div");
    loadingOverlay.id = "loading-overlay";
    loadingOverlay.className = "loading-overlay";
    
    loadingOverlay.innerHTML = `
      <div class="loading-content">
        <div class="spinner"></div>
        <div class="loading-text">Loading...</div>
        <div class="loading-subtext">Please wait</div>
      </div>
    `;
    
    document.body.appendChild(loadingOverlay);
  }
  
  const loadingOverlay = document.getElementById("loading-overlay");
  loadingOverlay.classList.remove("hidden");
  
  const token = localStorage.getItem("authToken");
  const userEmail = localStorage.getItem("userEmail");

  if (token && userEmail) {
    try {
      const response = await fetch(
        "http://helya.pylex.xyz:10209/confirmloggedin",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: userEmail,
            token: token,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        window.location.href = "../Student Lobby/Profile.html";
        return;
      } else {
        localStorage.removeItem("authToken");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("rememberedEmail");
        localStorage.removeItem("rememberMe");
        localStorage.removeItem("returncustomer");
      }
    } catch (error) {
      console.error("Error checking login status:", error);
    }
  }
  
  loadingOverlay.classList.add("hidden");
  
  const form = document.getElementById("signup-form");
  const fullnameError = document.getElementById("fullname-error");
  const emailError = document.getElementById("email-error");
  const birthdateError = document.getElementById("birthdate-error");
  const passwordError = document.getElementById("password-error");
  const confirmPasswordError = document.getElementById("confirm-password-error");
  const gradeError = document.getElementById("grade-error");
  const termsError = document.getElementById("terms-error");
  const successMessage = document.getElementById("success-message");
  const toggleButtons = document.querySelectorAll(".toggle-password");

  class Dropdown {
    constructor(container) {
      this.container = container;
      this.button = container.querySelector('.dropdown-btn');
      this.menu = container.querySelector('.dropdown-menu');
      this.options = container.querySelectorAll('.dropdown-option');
      this.input = container.querySelector('input[type="hidden"]');
      this.errorSpan = container.querySelector('.error-message');
      
      this.init();
    }

    init() {
      this.button.setAttribute('aria-haspopup', 'listbox');
      this.button.setAttribute('aria-expanded', 'false');
      this.menu.setAttribute('role', 'listbox');
      
      this.button.addEventListener('click', () => this.toggle());
      this.options.forEach(option => {
        option.setAttribute('role', 'option');
        option.addEventListener('click', () => this.select(option));
      });
      
      document.addEventListener('click', (e) => {
        if (!this.container.contains(e.target)) {
          this.close();
        }
      });

      this.button.addEventListener('keydown', (e) => this.handleKeydown(e));
    }

    toggle() {
      if (this.menu.classList.contains('show')) {
        this.close();
      } else {
        this.open();
      }
    }

    open() {
      this.menu.classList.add('show');
      this.button.setAttribute('aria-expanded', 'true');
    }

    close() {
      this.menu.classList.remove('show');
      this.button.setAttribute('aria-expanded', 'false');
    }

    select(option) {
      const value = option.textContent;
      this.button.textContent = value;
      this.input.value = value;
      this.close();
      
      if (this.errorSpan) {
        this.errorSpan.textContent = '';
      }
      
      const event = new Event('change', { bubbles: true });
      this.input.dispatchEvent(event);
    }

    handleKeydown(e) {
      const isExpanded = this.button.getAttribute('aria-expanded') === 'true';
      
      switch (e.key) {
        case 'Escape':
          if (isExpanded) {
            this.close();
          }
          break;
        case 'ArrowDown':
          if (!isExpanded) {
            this.open();
          }
          const firstOption = this.options[0];
          if (firstOption) {
            firstOption.focus();
          }
          e.preventDefault();
          break;
        case 'Enter':
        case ' ':
          this.toggle();
          e.preventDefault();
          break;
      }
    }
  }

  const dropdowns = document.querySelectorAll('.dropdown-single');
  dropdowns.forEach(dropdown => new Dropdown(dropdown));

  toggleButtons.forEach(button => {
    button.addEventListener("click", function() {
      const input = this.parentElement.querySelector('input');
      const type = input.getAttribute("type") === "password" ? "text" : "password";
      input.setAttribute("type", type);
    });
  });

  form.addEventListener("submit", async function(event) {
    event.preventDefault();

    fullnameError.textContent = "";
    emailError.textContent = "";
    birthdateError.textContent = "";
    passwordError.textContent = "";
    confirmPasswordError.textContent = "";
    gradeError.textContent = "";
    termsError.textContent = "";
    successMessage.textContent = "";
    successMessage.style.backgroundColor = "";
    successMessage.style.color = "";

    const fullname = document.getElementById("fullname").value.trim();
    const email = document.getElementById("email").value.trim();
    const birthdate = document.getElementById("birthdate").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirm-password").value;
    const grade = document.getElementById("grade").value;
    const acceptTerms = document.getElementById("accept-terms").checked;

    let isValid = true;

    if (!fullname) {
      fullnameError.textContent = "Full name is required";
      isValid = false;
    }

    if (!email) {
      emailError.textContent = "Email is required";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      emailError.textContent = "Please enter a valid email";
      isValid = false;
    }

    if (!birthdate) {
      birthdateError.textContent = "Date of birth is required";
      isValid = false;
    }

    if (!grade) {
      gradeError.textContent = "Please select your grade";
      isValid = false;
    }

    if (!password) {
      passwordError.textContent = "Password is required";
      isValid = false;
    } else if (password.length < 8) {
      passwordError.textContent = "Password must be at least 8 characters long";
      isValid = false;
    }

    if (password !== confirmPassword) {
      confirmPasswordError.textContent = "Passwords do not match";
      isValid = false;
    }

    if (!acceptTerms) {
      termsError.textContent = "You must accept the terms and conditions";
      isValid = false;
    }

    if (!isValid) return;

    try {
      const submitButton = form.querySelector('button[type="submit"]');
      submitButton.disabled = true;
      submitButton.textContent = "Creating Account...";

      loadingOverlay.classList.remove("hidden");

      const response = await fetch("http://helya.pylex.xyz:10209/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: fullname,
          email,
          password,
          birthdate,
          grade
        }),
      });

      const result = await response.json();

      if (response.ok) {
        successMessage.textContent = "Account created successfully! Redirecting to login...";
        successMessage.style.color = "var(--success-green)";
        successMessage.style.backgroundColor = "#e8f5e9";

        setTimeout(() => {
          window.location.href = "login.html";
        }, 2000);
      } else {
        throw new Error(result.message || "Failed to create account");
      }
    } catch (error) {
      console.error("Error:", error);
      successMessage.textContent = error.message;
      successMessage.style.color = "var(--error-red)";
      successMessage.style.backgroundColor = "#ffebee";
    } finally {
      const submitButton = form.querySelector('button[type="submit"]');
      submitButton.disabled = false;
      submitButton.textContent = "Create Account";
      loadingOverlay.classList.add("hidden");
    }
  });
});
