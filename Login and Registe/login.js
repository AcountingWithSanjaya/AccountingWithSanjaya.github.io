document.addEventListener("DOMContentLoaded", async function () {
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
        localStorage.removeItem("authToken");
        localStorage.removeItem("userEmail");
      }
    } catch (error) {
      console.error("Error checking login status:", error);
    }
  }

  const form = document.getElementById("login-form");
  const emailError = document.getElementById("email-error");
  const passwordError = document.getElementById("password-error");
  const successMessage = document.getElementById("success-message");
  const rememberMeCheckbox = document.getElementById("remember-me");
  const passwordInput = form.querySelector('input[type="password"]');
  const toggleButton = form.querySelector(".inputForm button");
  const storedEmail = localStorage.getItem("rememberedEmail");
  const storedRememberMe = localStorage.getItem("rememberMe") === "true";

  if (storedEmail && storedRememberMe) {
    form.querySelector('input[type="email"]').value = storedEmail;
    rememberMeCheckbox.checked = true;
  }

  toggleButton.addEventListener("click", function (e) {
    e.preventDefault();
    const input = this.previousElementSibling;
    input.type = input.type === "password" ? "text" : "password";
  });

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    emailError.textContent = "";
    passwordError.textContent = "";
    successMessage.textContent = "";

    const email = form.querySelector('input[type="email"]').value.trim();
    const password = passwordInput.value.trim();
    const rememberMe = rememberMeCheckbox.checked;

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

      const response = await fetch("http://helya.pylex.xyz:10209/login", {
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
        successMessage.style.color = "green";

        const verifyResponse = await fetch(
          "http://helya.pylex.xyz:10209/confirmloggedin",
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
            window.location.href = "../User/Profile.html";
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
      successMessage.style.color = "red";
    } finally {
      const submitButton = form.querySelector('button[type="submit"]');
      submitButton.disabled = false;
      submitButton.textContent = "Sign In";
    }
  });
});
