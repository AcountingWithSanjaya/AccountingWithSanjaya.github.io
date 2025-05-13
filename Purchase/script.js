const PAYHERE_CHECKOUT_URL = 'https://sandbox.payhere.lk/pay/checkout'; // Change to live URL for production

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
            const pkg = button.dataset.package;
            const price = button.dataset.price;
            const credits = button.dataset.credits;

            document.getElementById('summaryPackage').textContent = pkg.charAt(0).toUpperCase() + pkg.slice(1);
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

    // Card fields could be hidden/ignored
    /*const cardNumber = document.getElementById('cardNumber');
    if(cardNumber) {
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
    }
    const expiryDate = document.getElementById('expiryDate');
    if(expiryDate) {
      expiryDate.addEventListener('input', (e) => {
          let value = e.target.value.replace(/\D/g, '');
          if (value.length > 2) {
              value = value.slice(0, 2) + '/' + value.slice(2);
          }
          e.target.value = value;
      });
    }
    const cvv = document.getElementById('cvv');
    if(cvv) {
      cvv.addEventListener('input', (e) => {
          e.target.value = e.target.value.replace(/\D/g, '');
      });
    }*/

    paymentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = e.target.querySelector('.submit-btn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Processing...';

        const userEmail = localStorage.getItem("userEmail");
        const token = localStorage.getItem("authToken");

        if (!userEmail || !token) {
            alert('You must be logged in to make a purchase.');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Complete Purchase';
            return;
        }

        // Get package details from the modal's summary elements
        const packageName = document.getElementById('summaryPackage').textContent;
        const priceText = document.getElementById('summaryPrice').textContent;
        const creditsText = document.getElementById('summaryCredits').textContent;

        const price = priceText.replace('$', '').trim();
        const creditsToAdd = creditsText.split(' ')[0].trim();
        
        const backendUrl = "http://helya.pylex.xyz:10209";

        try {
            const response = await fetch(`${backendUrl}/payhere/checkout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    email: userEmail,
                    packageName: packageName,
                    price: price,
                    creditsToAdd: creditsToAdd
                })
            });

            const data = await response.json();

            if (response.ok && data.success && data.merchant_id) {
                // Create a hidden form and submit it to PayHere
                const payhereForm = document.createElement('form');
                payhereForm.method = 'POST';
                payhereForm.action = PAYHERE_CHECKOUT_URL;

                const fieldsToSubmitToPayhere = [
                    'merchant_id', 'return_url', 'cancel_url', 'notify_url',
                    'order_id', 'items', 'currency', 'amount',
                    'first_name', 'last_name', 'email', 'phone',
                    'address', 'city', 'country', 'hash',
                    'custom_1', 'custom_2'
                ];

                for (const fieldName of fieldsToSubmitToPayhere) {
                    if (data[fieldName] !== undefined) {
                        const input = document.createElement('input');
                        input.type = 'hidden';
                        input.name = fieldName;
                        input.value = data[fieldName];
                        payhereForm.appendChild(input);
                    }
                }
                
                document.body.appendChild(payhereForm);
                payhereForm.submit();
            } else {
                alert(`Error: ${data.message || 'Could not initiate payment. Please try again.'}`);
                submitBtn.disabled = false;
                submitBtn.textContent = 'Complete Purchase';
            }
        } catch (error) {
            console.error('Payment initiation error:', error);
            alert('An error occurred while trying to initiate payment. Check console for details.');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Complete Purchase';
        }
    });
});

