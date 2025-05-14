document.addEventListener('DOMContentLoaded', function() {
    const loadingOverlay = document.querySelector('.loading-overlay');
    
    // Create error overlay
    const errorOverlay = document.createElement('div');
    errorOverlay.className = 'loading-overlay hidden';
    errorOverlay.innerHTML = `
        <div class="loading-content">
            <p class="loading-text" style="color: var(--error-red);">Error Loading Profile</p>
            <p class="loading-subtext">Unable to load your profile information.</p>
            <button class="primary-button" style="margin-top: 1rem;">OK</button>
        </div>
    `;
    document.body.appendChild(errorOverlay);

    // Add profile picture upload functionality
    const profileImage = document.querySelector('.profile-image');
    const uploadOverlay = document.createElement('div');
    uploadOverlay.className = 'upload-overlay';
    uploadOverlay.innerHTML = `
        <i class="fas fa-camera"></i>
        <span>Update Photo</span>
    `;
    profileImage.parentElement.appendChild(uploadOverlay);

    // Handle profile picture click
    uploadOverlay.addEventListener('click', async function() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        input.onchange = async function() {
            if (input.files && input.files[0]) {
                const file = input.files[0];
                const formData = new FormData();
                formData.append('profilePicture', file);

                try {
                    const response = await fetch('http://helya.pylex.xyz:10209/updatepfp', {
                        method: 'POST',
                        body: formData
                    });

                    if (!response.ok) throw new Error('Failed to upload image');

                    const result = await response.json();
                    
                    // Update profile pictures
                    document.querySelectorAll('.profile-image, .profile-pic').forEach(img => {
                        img.src = result.profileImage;
                    });

                    // Show success message
                    showNotification('Profile picture updated successfully!', 'success');
                } catch (error) {
                    console.error('Error uploading profile picture:', error);
                    showNotification('Failed to update profile picture', 'error');
                }
            }
        };

        input.click();
    });

    // Notification function
    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Fetch profile data
    const userEmail = localStorage.getItem('userEmail');
    const authToken = localStorage.getItem('authToken');

    if (!userEmail || !authToken) {
        loadingOverlay.classList.add('hidden');
        errorOverlay.classList.remove('hidden');
        errorOverlay.querySelector('.loading-text').textContent = 'Authentication Error';
        errorOverlay.querySelector('.loading-subtext').textContent = 'Please log in to view your profile.';
        errorOverlay.querySelector('button').addEventListener('click', function() {
            window.location.href = '../Login and Register/Login.html';
        });
        return;
    }

    fetch(`http://helya.pylex.xyz:10209/profile?email=${userEmail}`, {
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => {
        if (!response.ok) {
             if (response.status === 401) {
                throw new Error('Unauthorized. Please log in again.');
            }
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        document.getElementById('username').value = data.username || 'N/A';
        document.getElementById('email').value = data.email || 'N/A';
        document.getElementById('password').value = '********'; // Keep password masked
        
        if (data.birthdate) {
            document.getElementById('birthdate').value = new Date(data.birthdate).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric'
            });
        } else {
            document.getElementById('birthdate').value = 'N/A';
        }
        
        document.getElementById('credits').value = `${data.credits !== undefined ? data.credits.toLocaleString() : 'N/A'} credits`;
        document.getElementById('profile-page-grade').value = data.grade || 'N/A';


        if (data.profileImage) {
            document.querySelectorAll('.profile-image, .profile-pic').forEach(img => {
                img.src = data.profileImage;
            });
        }

        document.querySelector('.profile-name').textContent = data.fullName || data.username || 'User';
        
        const gradeSpan = document.getElementById('profile-grade');
        if(gradeSpan) gradeSpan.textContent = `Grade: ${data.grade || 'N/A'}`;
        
        const memberSinceSpan = document.getElementById('profile-member-since');
        if(memberSinceSpan && data.createdAt){
            memberSinceSpan.textContent = `Joined: ${new Date(data.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}`;
        } else if (memberSinceSpan) {
            memberSinceSpan.textContent = 'Joined: N/A';
        }


        loadingOverlay.classList.add('hidden');
    })
    .catch(error => {
        console.error('Error fetching profile:', error);
        loadingOverlay.classList.add('hidden');
            errorOverlay.classList.remove('hidden');
            
            errorOverlay.querySelector('button').addEventListener('click', function() {
                window.location.href = '../Home/index.html';
            });
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

    // Button event handlers
    document.querySelector('.change-password-btn').addEventListener('click', function() {
        window.location.href = '/reset-password';
    });

    document.querySelector('.buy-credits-btn').addEventListener('click', function() {
        window.location.href = '../Purchase/index.html';
    });

    document.querySelector('.primary-button').addEventListener('click', function() {
        alert('Edit profile functionality coming soon!');
    });

    document.querySelector('.secondary-button').addEventListener('click', function() {
        alert('Preparing data export...');
    });

    // Hover animations
    document.querySelectorAll('.activity-item, .stat-item').forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'translateX(5px)';
        });
        item.addEventListener('mouseleave', function() {
            this.style.transform = 'translateX(0)';
        });
    });
});
