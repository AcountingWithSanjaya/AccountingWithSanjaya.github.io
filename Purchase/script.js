document.addEventListener('DOMContentLoaded', () => {
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

