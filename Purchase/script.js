// const PAYHERE_CHECKOUT_URL = 'https://sandbox.payhere.lk/pay/checkout';

async function fetchAndDisplayUserCredits() {
    const creditsBalanceElement = document.querySelector('.credit-balance h2');
    if (!creditsBalanceElement) return;

    const userEmail = localStorage.getItem('userEmail');
    const authToken = localStorage.getItem('authToken');

    if (!userEmail || !authToken) {
        creditsBalanceElement.textContent = 'Log in to see credits';
        return;
    }

    try {
        const response = await fetch(`http://helya.pylex.xyz:10209/api/user/credits?email=${userEmail}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (!response.ok) {
            throw new Error('Failed to fetch credits');
        }
        const data = await response.json();
        creditsBalanceElement.textContent = `Current Balance: ${data.credits} Credits`;
    } catch (error) {
        console.error('Error fetching credits:', error);
        creditsBalanceElement.textContent = 'Current Balance: Error loading credits';
    }
}

document.addEventListener("DOMContentLoaded", async function () {
  const loadingOverlay = document.getElementById("loading-overlay");
  
  if (loadingOverlay) {
    loadingOverlay.classList.remove("hidden");
    setTimeout(() => {
      loadingOverlay.classList.add("hidden");
    }, 300);
  }

  await fetchAndDisplayUserCredits(); // Fetch credits on page load

  const purchaseButtons = document.querySelectorAll('.purchase-btn');
  const backendUrl = "http://helya.pylex.xyz:10209";

  purchaseButtons.forEach(button => {
    button.addEventListener('click', async () => {
      const packageName = button.dataset.package;
      const price = button.dataset.price; // This should be LKR amount. See note above.
      const creditsToAdd = button.dataset.credits;

      const userEmail = localStorage.getItem('userEmail');
      const authToken = localStorage.getItem('authToken');

      if (!userEmail || !authToken) {
        alert('Please log in to make a purchase.');
        // Optionally redirect to login page:
        // window.location.href = '../Login and Register/Login.html';
        return;
      }

      const originalButtonText = button.textContent;
      button.disabled = true;
      button.textContent = 'Processing...';

      try {
        const response = await fetch(`${backendUrl}/payhere/checkout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            email: userEmail,
            packageName: packageName, // The name of the package/item
            price: price,             // The price from data-price
            creditsToAdd: creditsToAdd
          })
        });

        const paymentData = await response.json();

        if (response.ok && paymentData.success && paymentData.merchant_id) {
          // Payment object for PayHere SDK
          const payment = {
            "sandbox": true, // Set to false for live environment (ensure backend PAYHERE_MERCHANT_SECRET also matches)
            "merchant_id": paymentData.merchant_id,
            "return_url": paymentData.return_url,
            "cancel_url": paymentData.cancel_url,
            "notify_url": paymentData.notify_url,
            "order_id": paymentData.order_id,
            "items": paymentData.items, // Should be the package name or description
            "amount": paymentData.amount, // Amount from backend, formatted
            "currency": paymentData.currency,
            "hash": paymentData.hash,
            "first_name": paymentData.first_name,
            "last_name": paymentData.last_name,
            "email": paymentData.email,
            "phone": paymentData.phone,
            "address": paymentData.address,
            "city": paymentData.city,
            "country": paymentData.country,
            "custom_1": paymentData.custom_1, // Used for user_email for notify
            "custom_2": paymentData.custom_2  // Used for credits_to_add for notify
          };
          
          payhere.startPayment(payment);
          // Button state will be reset by PayHere callbacks or if user navigates away
        } else {
          alert(`Error: ${paymentData.message || 'Could not initiate payment. Please try again.'}`);
          button.disabled = false;
          button.textContent = originalButtonText;
        }
      } catch (error) {
        console.error('Purchase initiation error:', error);
        alert('An error occurred while trying to initiate payment. Please try again.');
        button.disabled = false;
        button.textContent = originalButtonText;
      }
    });
  });

  // PayHere Callbacks
  payhere.onCompleted = function onCompleted(orderId) {
    console.log("Payment completed. OrderID:" + orderId);
    // Note: User credit update should happen via PayHere Notify URL on the backend.
    // Redirect to a success page. The backend's return_url should point here.
    // This is a fallback / user experience enhancement.
    // window.location.href = paymentData.return_url || '/Purchase/purchase-success.html?order_id=' + orderId;
    // No need to explicitly redirect here if return_url is set correctly in payment object.
    // Re-enable buttons if user somehow stays on this page (unlikely for onCompleted).
    purchaseButtons.forEach(button => {
        button.disabled = false;
        button.textContent = button.dataset.originalText || 'Purchase Now'; 
    });
  };

  payhere.onDismissed = function onDismissed() {
    console.log("Payment dismissed by user.");
    // Re-enable purchase buttons
    purchaseButtons.forEach(button => {
        button.disabled = false;
        // Store original text if not already done, or use a default
        if(!button.dataset.originalText) button.dataset.originalText = button.textContent;
        button.textContent = button.dataset.originalText || 'Purchase Now';
    });
  };

  payhere.onError = function onError(error) {
    console.log("PayHere Error:" + error);
    alert("Payment Error: " + error + ". Please try again or contact support if the issue persists.");
    // Re-enable purchase buttons
    purchaseButtons.forEach(button => {
        button.disabled = false;
        if(!button.dataset.originalText) button.dataset.originalText = button.textContent;
        button.textContent = button.dataset.originalText || 'Purchase Now';
    });
  };

  // The modal, its related close buttons, and paymentForm are no longer used by these purchase buttons.
  // You can remove the HTML for 'purchaseModal' and its CSS if it's not used for other purposes.
  // const modal = document.getElementById('purchaseModal');
  // const closeBtn = document.querySelector('.close');
  // const paymentForm = document.getElementById('paymentForm');
  // if (closeBtn && modal) {
  //   closeBtn.addEventListener('click', () => modal.style.display = 'none');
  // }
  // if (modal) {
  //   window.addEventListener('click', (event) => {
  //     if (event.target === modal) {
  //       modal.style.display = 'none';
  //     }
  //   });
  // }
  // If paymentForm is not used, its event listener can be removed:
  // if (paymentForm) {
  //    paymentForm.removeEventListener('submit', ...);
  // }
});

