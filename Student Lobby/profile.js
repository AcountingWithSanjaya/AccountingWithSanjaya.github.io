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
                const userEmailForPfp = localStorage.getItem('userEmail');
                const authTokenForPfp = localStorage.getItem('authToken');

                if (!userEmailForPfp || !authTokenForPfp) {
                    showNotification('Authentication details not found. Please log in again.', 'error');
                    return;
                }

                const formData = new FormData();
                formData.append('profilePicture', file);
                formData.append('email', userEmailForPfp); // Add email to form data
                formData.append('token', authTokenForPfp); // Add token to form data

                try {
                    // No headers needed for FormData with fetch, browser sets Content-Type
                    const response = await fetch('http://127.0.0.1:10209/updatepfp', {
                        method: 'POST',
                        body: formData
                    });

                    if (!response.ok) {
                        const errorResult = await response.json().catch(() => ({ message: 'Failed to upload image. Server returned an error.' }));
                        throw new Error(errorResult.message || 'Failed to upload image');
                    }

                    const result = await response.json();
                    
                    // Update profile pictures
                    document.querySelectorAll('.profile-image, .profile-pic').forEach(img => {
                        img.src = result.profileImage + '?' + new Date().getTime(); // Added cache buster
                    });

                    // Show success message
                    showNotification('Profile picture updated successfully!', 'success');
                } catch (error) {
                    console.error('Error uploading profile picture:', error);
                    showNotification(error.message || 'Failed to update profile picture', 'error'); // Show specific error
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

    fetch(`http://127.0.0.1:10209/profile?email=${userEmail}`, {
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
                img.src = data.profileImage + '?' + new Date().getTime(); // Added cache buster
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

    // Edit Profile Functionality
    const editProfileBtn = document.getElementById('edit-profile-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const exportDataBtn = document.getElementById('export-data-btn');
    // const deleteAccountBtn is already defined below

    const usernameInput = document.getElementById('username');
    const gradeInput = document.getElementById('profile-page-grade');
    // Add birthdateInput if it becomes editable later
    // const birthdateInput = document.getElementById('birthdate');

    let originalProfileData = {}; // To store data for cancellation

    function toggleEditMode(enable) {
        if (enable) {
            // Store original values
            originalProfileData.username = usernameInput.value;
            originalProfileData.grade = gradeInput.value;

            // Make fields editable
            usernameInput.readOnly = false;
            gradeInput.readOnly = false;
            usernameInput.classList.remove('bg-gray-50');
            gradeInput.classList.remove('bg-gray-50');
            // birthdateInput.readOnly = false; // If making birthdate editable
            // birthdateInput.classList.remove('bg-gray-50');

            editProfileBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
            editProfileBtn.removeEventListener('click', handleEditProfileClick); // Remove old listener
            editProfileBtn.addEventListener('click', handleSaveChangesClick); // Add new listener

            cancelEditBtn.style.display = 'inline-flex';
            exportDataBtn.style.display = 'none';
            if(deleteAccountBtn) deleteAccountBtn.style.display = 'none'; // deleteAccountBtn might not exist if modal elements are missing
        } else {
            // Make fields read-only and restore original values if cancelled
            usernameInput.readOnly = true;
            gradeInput.readOnly = true;
            usernameInput.classList.add('bg-gray-50');
            gradeInput.classList.add('bg-gray-50');
            // birthdateInput.readOnly = true;
            // birthdateInput.classList.add('bg-gray-50');

            // Restore original values if they exist (e.g., after a cancel)
            if (originalProfileData.username) usernameInput.value = originalProfileData.username;
            if (originalProfileData.grade) gradeInput.value = originalProfileData.grade;


            editProfileBtn.innerHTML = '<i class="fas fa-edit"></i> Edit Profile';
            editProfileBtn.removeEventListener('click', handleSaveChangesClick);
            editProfileBtn.addEventListener('click', handleEditProfileClick);
            
            cancelEditBtn.style.display = 'none';
            exportDataBtn.style.display = 'inline-flex';
            if(deleteAccountBtn) deleteAccountBtn.style.display = 'inline-flex';
        }
    }

    function handleEditProfileClick() {
        toggleEditMode(true);
    }

    async function handleSaveChangesClick() {
        const updatedData = {
            username: usernameInput.value.trim(),
            grade: gradeInput.value.trim(),
            // birthdate: birthdateInput.value, // if making birthdate editable
        };

        if (!updatedData.username || !updatedData.grade) {
            showNotification('Username and Grade cannot be empty.', 'error');
            return;
        }

        // Basic validation for grade (example: starts with "Grade ")
        if (!updatedData.grade.startsWith('Grade ') || updatedData.grade.length < 7) {
             showNotification('Grade format should be "Grade X" (e.g., Grade 10).', 'error');
            return;
        }


        const currentEmail = localStorage.getItem('userEmail');
        const currentToken = localStorage.getItem('authToken');

        if (!currentEmail || !currentToken) {
            showNotification('Authentication error. Please log in again.', 'error');
            return;
        }

        try {
            const response = await fetch('http://127.0.0.1:10209/update-profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentToken}`
                },
                body: JSON.stringify({
                    email: currentEmail,
                    username: updatedData.username,
                    grade: updatedData.grade,
                    // birthdate: updatedData.birthdate // if making birthdate editable
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to update profile.');
            }

            showNotification('Profile updated successfully!', 'success');
            // Update the displayed name in the sidebar if username changed
            document.querySelector('.profile-name').textContent = updatedData.username;
            // Update the grade in the sidebar
            const gradeSpan = document.getElementById('profile-grade');
            if(gradeSpan) gradeSpan.textContent = `Grade: ${updatedData.grade}`;
            
            originalProfileData.username = updatedData.username; // Update original data to new saved values
            originalProfileData.grade = updatedData.grade;


            toggleEditMode(false);

        } catch (error) {
            console.error('Error updating profile:', error);
            showNotification(error.message, 'error');
            // Optionally, revert to original values on error or let user correct
            // usernameInput.value = originalProfileData.username;
            // gradeInput.value = originalProfileData.grade;
        }
    }

    cancelEditBtn.addEventListener('click', function() {
        // Restore original values
        usernameInput.value = originalProfileData.username;
        gradeInput.value = originalProfileData.grade;
        // birthdateInput.value = originalProfileData.birthdate; // if making birthdate editable
        toggleEditMode(false);
    });

    // Initial setup for the edit button
    editProfileBtn.addEventListener('click', handleEditProfileClick);


    exportDataBtn.addEventListener('click', function() {
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

    // Delete Account Functionality
    const deleteAccountBtn = document.getElementById('delete-account-btn');
    const deleteConfirmModal = document.getElementById('delete-confirm-modal');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');

    if (deleteAccountBtn && deleteConfirmModal && confirmDeleteBtn && cancelDeleteBtn) {
        deleteAccountBtn.addEventListener('click', () => {
            deleteConfirmModal.classList.remove('hidden');
        });

        cancelDeleteBtn.addEventListener('click', () => {
            deleteConfirmModal.classList.add('hidden');
        });

        confirmDeleteBtn.addEventListener('click', async () => {
            const userEmailForDelete = localStorage.getItem('userEmail');
            const authTokenForDelete = localStorage.getItem('authToken');

            if (!userEmailForDelete || !authTokenForDelete) {
                showNotification('Authentication details not found. Cannot delete account.', 'error');
                deleteConfirmModal.classList.add('hidden');
                return;
            }

            confirmDeleteBtn.disabled = true;
            confirmDeleteBtn.textContent = 'Deleting...';

            try {
                const response = await fetch('http://127.0.0.1:10209/delete-account', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        // Authorization header might not be strictly needed if email+token in body is how verify_token works
                        // 'Authorization': `Bearer ${authTokenForDelete}` 
                    },
                    body: JSON.stringify({
                        email: userEmailForDelete,
                        token: authTokenForDelete
                    })
                });

                const result = await response.json();

                if (response.ok) {
                    showNotification('Account deleted successfully. Redirecting...', 'success');
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('userEmail');
                    localStorage.removeItem('username');
                    localStorage.removeItem('rememberedEmail');
                    localStorage.removeItem('rememberMe');
                    localStorage.removeItem('returncustomer');
                    setTimeout(() => {
                        window.location.href = '../Login and Register/Login.html';
                    }, 2000);
                } else {
                    throw new Error(result.message || 'Failed to delete account.');
                }
            } catch (error) {
                console.error('Error deleting account:', error);
                showNotification(error.message, 'error');
            } finally {
                confirmDeleteBtn.disabled = false;
                confirmDeleteBtn.textContent = 'Yes, Delete My Account';
                deleteConfirmModal.classList.add('hidden');
            }
        });
    } else {
        console.warn('Delete account buttons or modal not found in the DOM.');
    }
});
