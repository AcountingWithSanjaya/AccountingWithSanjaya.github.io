document.addEventListener("DOMContentLoaded", async function () {
  const loadingOverlay = document.getElementById("loading-overlay");
  
  // Show loading overlay
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
  
  // Hide loading overlay after a short delay
  setTimeout(() => {
    loadingOverlay.classList.add("hidden");
  }, 300);

    const modal = document.getElementById('purchaseModal');
    const purchaseButtons = document.querySelectorAll('.purchase-btn');
    const closeBtn = document.querySelector('.close');
    const paymentForm = document.getElementById('paymentForm');

    purchaseButtons.forEach(button => {
        button.addEventListener('click', () => {
            const package = button.dataset.package;
            const price = button.dataset.price;
            const credits = button.dataset.credits;

            document.getElementById('summaryPackage').textContent = package.charAt(0).toUpperCase() + package.slice(1);
            document.getElementById('summaryCredits').textContent = credits + ' Credits';
            document.getElementById('summaryPrice').textContent = '$' + price;

            modal.style.display = 'block';
        });
    });

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    const cardNumber = document.getElementById('cardNumber');
    cardNumber.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        let formattedValue = '';
        for (let i = 0; i < value.length; i++) {
            if (i > 0 && i % 4 === 0) {
                formattedValue += ' ';
            }
            formattedValue += value[i];
        }
        e.target.value = formattedValue;
    });

    const expiryDate = document.getElementById('expiryDate');
    expiryDate.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 2) {
            value = value.slice(0, 2) + '/' + value.slice(2);
        }
        e.target.value = value;
    });

    const cvv = document.getElementById('cvv');
    cvv.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '');
    });

    paymentForm.addEventListener('submit', (e) => {
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
});

