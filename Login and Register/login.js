document.addEventListener("DOMContentLoaded", async function () {
  const loadingOverlay = document.getElementById("loading-overlay");
  loadingOverlay.classList.remove("hidden");
  
  const token = localStorage.getItem("authToken");
  const userEmail = localStorage.getItem("userEmail");

  if (token && userEmail) {
    try {
      const response = await fetch(
        "http://127.0.0.1:10209/confirmloggedin",
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

      if (response.ok) {
        window.location.href = "../Student Lobby/Profile.html";
        return;
      } else {
        localStorage.removeItem("authToken");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("rememberedEmail")
        localStorage.removeItem("rememberMe")
        localStorage.removeItem("returncustomer")
      }
    } catch (error) {
      console.error("Error checking login status:", error);
    }
  }
  
  setTimeout(() => {
    loadingOverlay.classList.add("hidden");
  }, 300);

  const form = document.getElementById("login-form");
  const emailError = document.getElementById("email-error");
  const passwordError = document.getElementById("password-error");
  const termsError = document.getElementById("terms-error");
  const successMessage = document.getElementById("success-message");
  const rememberMeCheckbox = document.getElementById("remember-me");
  const passwordInput = form.querySelector('input[type="password"]');
  const toggleButtons = form.querySelectorAll(".toggle-password");
  const storedEmail = localStorage.getItem("rememberedEmail");
  const storedRememberMe = localStorage.getItem("rememberMe") === "true";

  if (storedEmail && storedRememberMe) {
    form.querySelector('input[type="email"]').value = storedEmail;
    rememberMeCheckbox.checked = true;
  }

  toggleButtons.forEach(button => {
    button.addEventListener("click", function() {
      const input = this.previousElementSibling;
      const type = input.type === "password" ? "text" : "password";
      input.type = type;
      
      // Update icon
      const eyeIcon = this.querySelector('.eye-icon');
      if (type === "text") {
        eyeIcon.innerHTML = `
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
          <line x1="1" y1="1" x2="23" y2="23"></line>
        `;
      } else {
        eyeIcon.innerHTML = `
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        `;
      }
    });
  });

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    emailError.textContent = "";
    passwordError.textContent = "";
    termsError.textContent = "";
    successMessage.textContent = "";

    const email = form.querySelector('input[type="email"]').value.trim();
    const password = passwordInput.value.trim();
    const rememberMe = rememberMeCheckbox.checked;
    const acceptTerms = document.getElementById("accept-terms").checked;

    let isValid = true;

    if (!email) {
      emailError.textContent = "Email is required";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      emailError.textContent = "Please enter a valid email";
      isValid = false;
    }

    if (!password) {
      passwordError.textContent = "Password is required";
      isValid = false;
    }

    if (!acceptTerms) {
      termsError.textContent = "You must accept the terms and conditions";
      isValid = false;
    }

    if (!isValid) return;

    if (rememberMe) {
      localStorage.setItem("rememberedEmail", email);
      localStorage.setItem("rememberMe", "true");
    } else {
      localStorage.removeItem("rememberedEmail");
      localStorage.setItem("rememberMe", "false");
    }

    try {
      const submitButton = form.querySelector('button[type="submit"]');
      submitButton.disabled = true;
      submitButton.textContent = "Signing in...";

      const response = await fetch("http://127.0.0.1:10209/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (response.ok) {
        localStorage.setItem("authToken", result.token);
        localStorage.setItem("userEmail", email);
        localStorage.setItem("username", result.username);

        successMessage.textContent = "Login successful!";
        successMessage.style.color = "var(--success-green)";
        successMessage.style.backgroundColor = "#e8f5e9";

        const verifyResponse = await fetch(
          "http://127.0.0.1:10209/confirmloggedin",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: email,
              token: result.token,
            }),
          }
        );

        if (verifyResponse.ok) {
          setTimeout(() => {
            window.location.href = "../Student Lobby/Profile.html";
          }, 1500);
        } else {
          throw new Error("Token verification failed");
        }
      } else {
        throw new Error(result.message || "Invalid email or password");
      }
    } catch (error) {
      console.error("Error:", error);
      successMessage.textContent = error.message;
      successMessage.style.color = "var(--error-red)";
      successMessage.style.backgroundColor = "#ffebee";
    } finally {
      const submitButton = form.querySelector('button[type="submit"]');
      submitButton.disabled = false;
      submitButton.textContent = "Sign In";
    }
  });
});
