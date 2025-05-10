document.addEventListener('DOMContentLoaded', function() {
    // Show loading overlay
    const loadingOverlay = document.querySelector('.loading-overlay');
    
    // Fetch profile data
    fetch('http://helya.pylex.xyz:10209/profile')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Update profile information
            document.getElementById('username').value = data.username;
            document.getElementById('email').value = data.email;
            document.getElementById('password').value = '********'; // Keep password masked
            document.getElementById('birthdate').value = new Date(data.birthdate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            document.getElementById('credits').value = `${data.credits.toLocaleString()} credits`;

            // Update profile image if available
            if (data.profileImage) {
                document.querySelectorAll('.profile-image, .profile-pic').forEach(img => {
                    img.src = data.profileImage;
                });
            }

            // Update profile name
            if (data.fullName) {
                document.querySelector('.profile-name').textContent = data.fullName;
            }

            // Hide loading overlay
            loadingOverlay.classList.add('hidden');
        })
        .catch(error => {
            console.error('Error fetching profile:', error);
            loadingOverlay.classList.add('hidden');
            alert('Failed to load profile data. Please try again later.');
        });

    // Toggle password visibility
    const togglePassword = document.querySelector('.toggle-password');
    const passwordInput = document.getElementById('password');

    togglePassword.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        const icon = this.querySelector('i');
        icon.classList.toggle('fa-eye');
        icon.classList.toggle('fa-eye-slash');
    });

    // Change password button
    document.querySelector('.change-password-btn').addEventListener('click', function() {
        window.location.href = '/reset-password';
    });

    // Buy credits button
    document.querySelector('.buy-credits-btn').addEventListener('click', function() {
        alert('Redirecting to credits purchase page...');
    });

    // Edit profile button
    document.querySelector('.primary-button').addEventListener('click', function() {
        alert('Edit profile functionality coming soon!');
    });

    // Export data button
    document.querySelector('.secondary-button').addEventListener('click', function() {
        alert('Preparing data export...');
    });

    // Notification button
    document.querySelector('.notifications').addEventListener('click', function() {
        alert('Notifications panel coming soon!');
    });

    // Profile button
    document.querySelector('.profile-button').addEventListener('click', function() {
        alert('Profile menu coming soon!');
    });

    // Add hover animation to activity items
    const activityItems = document.querySelectorAll('.activity-item');
    activityItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'translateX(5px)';
        });
        item.addEventListener('mouseleave', function() {
            this.style.transform = 'translateX(0)';
        });
    });

    // Add hover animation to stat items
    const statItems = document.querySelectorAll('.stat-item');
    statItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'translateX(5px)';
        });
        item.addEventListener('mouseleave', function() {
            this.style.transform = 'translateX(0)';
        });
    });
});