document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('supportForm');
    const statusMessage = document.getElementById('status-message');

    // Pre-fill email if user is logged in
    const userEmail = localStorage.getItem('userEmail');
    if (userEmail) {
        document.getElementById('email').value = userEmail;
    }

    form.addEventListener('submit', async function(event) {
        event.preventDefault();

        // Clear previous status
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
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            statusMessage.style.display = 'block';
            
            if (response.ok) {
                statusMessage.className = 'status-message success';
                statusMessage.textContent = 'Your message has been sent successfully!';
                form.reset();
                if (userEmail) {
                    document.getElementById('email').value = userEmail;
                }
            } else {
                throw new Error(data.message || 'Failed to send message');
            }
        } catch (error) {
            statusMessage.className = 'status-message error';
            statusMessage.textContent = error.message || 'An error occurred. Please try again later.';
            statusMessage.style.display = 'block';
        }
    });
});

