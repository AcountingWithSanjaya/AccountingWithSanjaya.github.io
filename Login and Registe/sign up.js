document.addEventListener("DOMContentLoaded", async function () {
  // Check if user is logged in
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

      if (response.ok) {
        window.location.href = "../User/Profile.html";
        return;
      } else {
        // If token is invalid, clear storage
        localStorage.removeItem("authToken");
        localStorage.removeItem("userEmail");
      }
    } catch (error) {
      console.error("Error checking login status:", error);
    }
  }

  const form = document.getElementById("register-form");
  const usernameError = document.getElementById("username-error");
  const emailError = document.getElementById("email-error");
  const birthdateError = document.getElementById("birthdate-error");
  const passwordError = document.getElementById("password-error");
  const confirmPasswordError = document.getElementById(
    "confirm-password-error"
  );
  const successMessage = document.getElementById("success-message");

  const toggleButtons = form.querySelectorAll(".inputForm button");
  toggleButtons.forEach((button) => {
    button.addEventListener("click", function (e) {
      e.preventDefault();
      const input = this.previousElementSibling;
      input.type = input.type === "password" ? "text" : "password";
    });
  });

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    // Clear all error messages
    usernameError.textContent = "";
    emailError.textContent = "";
    birthdateError.textContent = "";
    passwordError.textContent = "";
    confirmPasswordError.textContent = "";
    successMessage.textContent = "";

    const username = form.querySelector('input[type="text"]').value.trim();
    const email = form.querySelector('input[type="email"]').value.trim();
    const birthdate = form.querySelector('input[type="date"]').value;
    const password = form.querySelectorAll('input[type="password"]')[0].value;
    const confirmPassword = form.querySelectorAll('input[type="password"]')[1]
      .value;

    let isValid = true;

    if (!username) {
      usernameError.textContent = "Username is required";
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
      birthdateError.textContent = "Birthdate is required";
      isValid = false;
    }

    if (!password) {
      passwordError.textContent = "Password is required";
      isValid = false;
    }

    if (password !== confirmPassword) {
      confirmPasswordError.textContent = "Passwords do not match";
      isValid = false;
    }

    if (!isValid) return;

    try {
      const submitButton = form.querySelector('button[type="submit"]');
      submitButton.disabled = true;
      submitButton.textContent = "Registering...";

      const response = await fetch("http://helya.pylex.xyz:10209/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          birthdate,
          password,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        successMessage.textContent =
          "Registration successful! Redirecting to login...";
        successMessage.style.color = "green";
        setTimeout(() => {
          window.location.href = "Login.html";
        }, 2000);
      } else {
        throw new Error(result.message || "Registration failed");
      }
    } catch (error) {
      console.error("Error:", error);
      successMessage.textContent = error.message;
      successMessage.style.color = "red";
    } finally {
      const submitButton = form.querySelector('button[type="submit"]');
      submitButton.disabled = false;
      submitButton.textContent = "Register";
    }
  });
});
