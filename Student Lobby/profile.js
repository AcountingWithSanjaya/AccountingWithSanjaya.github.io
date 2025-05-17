const API_URL = 'http://127.0.0.1:10209';

let dynamicErrorOverlay; // Will hold the reference to our error display
let originalProfileData = {}; // To store data for cancellation, accessible by edit/save logic

// --- Helper Functions ---
function createDynamicErrorOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay hidden';
    overlay.id = 'dynamic-error-overlay';
    overlay.style.zIndex = '1001';
    overlay.innerHTML = `
        <div class="loading-content" style="background-color: var(--white); border-radius: 8px; padding: 2rem; box-shadow: 0 0 15px rgba(0,0,0,0.2); max-width: 450px;">
            <p class="loading-text" style="color: var(--error-red); font-size: 1.25rem; margin-bottom: 0.5rem;">Error</p>
            <p class="loading-subtext" style="font-size: 0.9rem; margin-bottom: 1.5rem;">An error occurred.</p>
            <button class="primary-button" style="padding: 0.75rem 1.5rem; font-size: 0.9rem;">OK</button>
        </div>
    `;
    document.body.appendChild(overlay);
    return overlay;
}

function redirectToLogin() {
    window.location.href = '../Login and Register/Login.html';
}

function handleInvalidSession(message = 'Your session is invalid or has expired. Please log in again.') {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('username');
    localStorage.removeItem('rememberedEmail');
    localStorage.removeItem('rememberMe');
    localStorage.removeItem('returncustomer');
    
    const mainLoadingOverlay = document.getElementById('loading-overlay'); // The auth check one
    if (mainLoadingOverlay) mainLoadingOverlay.classList.add('hidden');
    
    const initialPageLoader = document.querySelector('body > .loading-overlay:not(#loading-overlay):not(#dynamic-error-overlay):not(#delete-confirm-modal)');
    if (initialPageLoader && !initialPageLoader.classList.contains('hidden')) {
        initialPageLoader.classList.add('hidden');
    }

    if (!dynamicErrorOverlay) dynamicErrorOverlay = createDynamicErrorOverlay();
    dynamicErrorOverlay.classList.remove('hidden');
    dynamicErrorOverlay.querySelector('.loading-text').textContent = 'Authentication Required';
    dynamicErrorOverlay.querySelector('.loading-subtext').textContent = message;
    const button = dynamicErrorOverlay.querySelector('button');
    button.textContent = 'Go to Login'; // Set button text
    button.onclick = redirectToLogin;   // Set button action to redirect
}

function showGeneralError(title, message, buttonText = 'Go to Login', buttonAction = redirectToLogin) {
    const mainLoadingOverlay = document.getElementById('loading-overlay');
    if (mainLoadingOverlay) mainLoadingOverlay.classList.add('hidden');
    
    const initialPageLoader = document.querySelector('body > .loading-overlay:not(#loading-overlay):not(#dynamic-error-overlay):not(#delete-confirm-modal)');
    if (initialPageLoader && !initialPageLoader.classList.contains('hidden')) {
        initialPageLoader.classList.add('hidden');
    }

    if (!dynamicErrorOverlay) dynamicErrorOverlay = createDynamicErrorOverlay();
    dynamicErrorOverlay.classList.remove('hidden');
    dynamicErrorOverlay.querySelector('.loading-text').textContent = title;
    dynamicErrorOverlay.querySelector('.loading-subtext').textContent = message;
    const button = dynamicErrorOverlay.querySelector('button');
    button.textContent = buttonText;
    button.onclick = buttonAction;
}

// Notification function
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.padding = '10px 20px';
    notification.style.borderRadius = '5px';
    notification.style.zIndex = '2000';
    notification.style.color = 'white';
    notification.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
    notification.style.opacity = '0'; 
    notification.style.transform = 'translateY(-20px)'; 

    if (type === 'success') notification.style.backgroundColor = 'var(--success-green, #4CAF50)';
    else if (type === 'error') notification.style.backgroundColor = 'var(--error-red, #ff3333)';
    else if (type === 'warning') notification.style.backgroundColor = 'var(--warning-orange, #ff9800)';
    else notification.style.backgroundColor = 'var(--blue-500, #2196f3)';

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
    }, 50); 

    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}


// --- DOMContentLoaded ---
document.addEventListener('DOMContentLoaded', async function() {
    if (!dynamicErrorOverlay) {
        dynamicErrorOverlay = createDynamicErrorOverlay();
    }

    const authLoadingOverlay = document.getElementById('loading-overlay'); 
    const initialPageLoader = document.querySelector('body > .loading-overlay:not(#loading-overlay):not(#dynamic-error-overlay):not(#delete-confirm-modal)'); 
    
    if (authLoadingOverlay) authLoadingOverlay.classList.remove('hidden');

    const userEmail = localStorage.getItem('userEmail');
    const authToken = localStorage.getItem('authToken');

    if (!userEmail || !authToken) {
        if (authLoadingOverlay) authLoadingOverlay.classList.add('hidden');
        if (initialPageLoader) initialPageLoader.classList.add('hidden');
        handleInvalidSession();
        return;
    }

    try {
        const confirmResponse = await fetch(`${API_URL}/confirmloggedin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userEmail, token: authToken }),
        });

        if (!confirmResponse.ok) {
            const errorData = await confirmResponse.json().catch(() => ({ message: 'Session confirmation failed.' }));
            throw new Error(`AuthConfirmError: ${errorData.message || 'Failed to confirm session.'}`);
        }

        const profileResponse = await fetch(`${API_URL}/profile?email=${userEmail}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (!profileResponse.ok) {
            if (profileResponse.status === 401) {
                throw new Error(`AuthProfileError: Unauthorized. Your session may have expired when fetching profile.`);
            }
            const errorData = await profileResponse.json().catch(() => ({ message: 'Failed to load profile details.' }));
            throw new Error(`ProfileFetchError: ${errorData.message || 'Could not load profile.'}`);
        }
        
        const data = await profileResponse.json();
        populateProfileData(data);
        setupEventListeners();

    } catch (error) {
        console.error('Profile Page Initialization Error:', error.message);
        if (authLoadingOverlay) authLoadingOverlay.classList.add('hidden');
        if (initialPageLoader) initialPageLoader.classList.add('hidden');
        
        if (error.message.startsWith('AuthConfirmError:') || error.message.startsWith('AuthProfileError:')) {
            handleInvalidSession(error.message.substring(error.message.indexOf(':') + 2).trim());
        } else if (error.message.startsWith('ProfileFetchError:')) {
            showGeneralError('Error Loading Profile', error.message.substring(error.message.indexOf(':') + 2).trim());
        } else { 
            handleInvalidSession('An unexpected error occurred. Please try logging in again.');
        }
        return; 
    } finally {
        if (authLoadingOverlay) {
            setTimeout(() => authLoadingOverlay.classList.add('hidden'), 300);
        }
        if (initialPageLoader && !initialPageLoader.classList.contains('hidden')) {
             setTimeout(() => initialPageLoader.classList.add('hidden'), 300);
        }
    }
});


// --- DOM Population ---
function populateProfileData(data) {
    document.getElementById('username').value = data.username || 'N/A';
    document.getElementById('email').value = data.email || 'N/A';
    document.getElementById('password').value = '********';
    
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
            img.src = data.profileImage + '?' + new Date().getTime();
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
}


// --- Event Listeners Setup ---
function setupEventListeners() {
    const profileImage = document.querySelector('.profile-image');
    if (profileImage && profileImage.parentElement) {
        let uploadOverlay = profileImage.parentElement.querySelector('.upload-overlay');
        if (!uploadOverlay) {
            uploadOverlay = document.createElement('div');
            uploadOverlay.className = 'upload-overlay';
            uploadOverlay.innerHTML = `<i class="fas fa-camera"></i><span>Update Photo</span>`;
            profileImage.parentElement.appendChild(uploadOverlay);
        }
        uploadOverlay.onclick = async function() {
            const input = document.createElement('input');
            input.type = 'file'; input.accept = 'image/*';
            input.onchange = async function() {
                if (input.files && input.files[0]) {
                    const file = input.files[0];
                    const userEmailForPfp = localStorage.getItem('userEmail');
                    const authTokenForPfp = localStorage.getItem('authToken');
                    if (!userEmailForPfp || !authTokenForPfp) { showNotification('Authentication details not found. Please log in again.', 'error'); return; }
                    const formData = new FormData();
                    formData.append('profilePicture', file); formData.append('email', userEmailForPfp); formData.append('token', authTokenForPfp);
                    try {
                        const response = await fetch(`${API_URL}/updatepfp`, { method: 'POST', body: formData });
                        if (!response.ok) { const errorResult = await response.json().catch(() => ({ message: 'Server error during PFP upload.' })); throw new Error(errorResult.message || 'Failed to upload image'); }
                        const result = await response.json();
                        document.querySelectorAll('.profile-image, .profile-pic').forEach(img => { img.src = result.profileImage + '?' + new Date().getTime(); });
                        showNotification('Profile picture updated successfully!', 'success');
                    } catch (error) { console.error('Error uploading profile picture:', error); showNotification(error.message || 'Failed to update profile picture', 'error'); }
                }
            };
            input.click();
        };
    }

    const togglePassword = document.querySelector('.toggle-password');
    const passwordInput = document.getElementById('password');
    if (passwordInput && togglePassword) {
        togglePassword.onclick = function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            const icon = this.querySelector('i');
            if (icon) { icon.classList.toggle('fa-eye'); icon.classList.toggle('fa-eye-slash'); }
        };
    }

    const changePwdBtn = document.querySelector('.change-password-btn');
    if (changePwdBtn) changePwdBtn.onclick = function() { window.location.href = '/reset-password'; };
    
    const buyCreditsBtn = document.querySelector('.buy-credits-btn');
    if (buyCreditsBtn) buyCreditsBtn.onclick = function() { window.location.href = '../Purchase/index.html'; };

    const editProfileBtn = document.getElementById('edit-profile-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const exportDataBtn = document.getElementById('export-data-btn');
    const deleteAccountBtn = document.getElementById('delete-account-btn');
    const usernameInput = document.getElementById('username');
    const gradeInput = document.getElementById('profile-page-grade');

    let logoutBtn = document.getElementById('logout-btn');
    if (!logoutBtn) {
        logoutBtn = document.createElement('button');
        logoutBtn.type = 'button'; logoutBtn.className = 'secondary-button'; logoutBtn.id = 'logout-btn';
        logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
        const actionButtonsContainer = document.querySelector('.action-buttons');
        if (actionButtonsContainer) {
            const delBtn = actionButtonsContainer.querySelector('#delete-account-btn');
            if (delBtn) actionButtonsContainer.insertBefore(logoutBtn, delBtn);
            else actionButtonsContainer.appendChild(logoutBtn);
        }
    }
    if(logoutBtn) logoutBtn.style.display = 'inline-flex';

    function toggleEditMode(enable) {
        if (enable) {
            originalProfileData.username = usernameInput.value; originalProfileData.grade = gradeInput.value;
            usernameInput.readOnly = false; gradeInput.readOnly = false;
            usernameInput.classList.remove('bg-gray-50'); gradeInput.classList.remove('bg-gray-50');
            editProfileBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
            editProfileBtn.onclick = handleSaveChangesClick;
            if(cancelEditBtn) cancelEditBtn.style.display = 'inline-flex';
            if(exportDataBtn) exportDataBtn.style.display = 'none';
            if(logoutBtn) logoutBtn.style.display = 'none';
            if(deleteAccountBtn) deleteAccountBtn.style.display = 'none';
        } else {
            usernameInput.readOnly = true; gradeInput.readOnly = true;
            usernameInput.classList.add('bg-gray-50'); gradeInput.classList.add('bg-gray-50');
            if (originalProfileData.username !== undefined) usernameInput.value = originalProfileData.username;
            if (originalProfileData.grade !== undefined) gradeInput.value = originalProfileData.grade;
            editProfileBtn.innerHTML = '<i class="fas fa-edit"></i> Edit Profile';
            editProfileBtn.onclick = handleEditProfileClick;
            if(cancelEditBtn) cancelEditBtn.style.display = 'none';
            if(exportDataBtn) exportDataBtn.style.display = 'inline-flex';
            if(logoutBtn) logoutBtn.style.display = 'inline-flex';
            if(deleteAccountBtn) deleteAccountBtn.style.display = 'inline-flex';
        }
    }

    function handleEditProfileClick() { toggleEditMode(true); }

    async function handleSaveChangesClick() {
        const updatedData = { username: usernameInput.value.trim(), grade: gradeInput.value.trim() };
        if (!updatedData.username || !updatedData.grade) { showNotification('Username and Grade cannot be empty.', 'error'); return; }
        if (!updatedData.grade.toLowerCase().startsWith('grade ') || updatedData.grade.length < 7) { showNotification('Grade format should be "Grade X" (e.g., Grade 10).', 'error'); return; }
        const currentEmail = localStorage.getItem('userEmail'); const currentToken = localStorage.getItem('authToken');
        if (!currentEmail || !currentToken) { handleInvalidSession('Authentication error. Please log in again.'); return; }
        try {
            const response = await fetch(`${API_URL}/update-profile`, {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentToken}`},
                body: JSON.stringify({ email: currentEmail, username: updatedData.username, grade: updatedData.grade })
            });
            const result = await response.json();
            if (!response.ok) { throw new Error(result.message || 'Failed to update profile.'); }
            showNotification('Profile updated successfully!', 'success');
            document.querySelector('.profile-name').textContent = updatedData.username;
            const gradeSpan = document.getElementById('profile-grade');
            if(gradeSpan) gradeSpan.textContent = `Grade: ${updatedData.grade}`;
            originalProfileData.username = updatedData.username; originalProfileData.grade = updatedData.grade;
            toggleEditMode(false);
        } catch (error) { console.error('Error updating profile:', error); showNotification(error.message, 'error'); }
    }
    
    if(editProfileBtn) editProfileBtn.onclick = handleEditProfileClick;
    if(cancelEditBtn) {
        cancelEditBtn.onclick = function() {
            if (originalProfileData.username !== undefined) usernameInput.value = originalProfileData.username;
            if (originalProfileData.grade !== undefined) gradeInput.value = originalProfileData.grade;
            toggleEditMode(false);
        };
    }

    function clearLocalStorageAndRedirect() {
        localStorage.removeItem('authToken'); localStorage.removeItem('userEmail'); localStorage.removeItem('username');
        localStorage.removeItem('rememberedEmail'); localStorage.removeItem('rememberMe'); localStorage.removeItem('returncustomer');
        setTimeout(() => { redirectToLogin(); }, 1500);
    }
    if(logoutBtn) {
        logoutBtn.onclick = async function() {
            const userEmailForLogout = localStorage.getItem('userEmail'); const authTokenForLogout = localStorage.getItem('authToken');
            if (!userEmailForLogout || !authTokenForLogout) { showNotification('Authentication details not found. Cannot log out.', 'error'); clearLocalStorageAndRedirect(); return; }
            try {
                const response = await fetch(`${API_URL}/logout`, { method: 'POST', headers: { 'Content-Type': 'application/json', }, body: JSON.stringify({ email: userEmailForLogout, token: authTokenForLogout }) });
                const result = await response.json();
                if (response.ok) { showNotification('Logged out successfully. Redirecting...', 'success'); }
                else { showNotification(result.message || 'Logout failed on server, clearing local session.', 'warning');}
            } catch (error) { console.error('Error logging out:', error); showNotification('Error during logout, clearing local session.', 'error');
            } finally { clearLocalStorageAndRedirect(); }
        };
    }

    if(exportDataBtn) {
        exportDataBtn.onclick = function() {
            const userEmailForExport = localStorage.getItem('userEmail');
            const profileDataToExport = {
                username: document.getElementById('username').value, email: document.getElementById('email').value,
                birthdate: document.getElementById('birthdate').value, grade: document.getElementById('profile-page-grade').value,
                credits: document.getElementById('credits').value, profileImage: document.querySelector('.profile-image').src.split('?')[0],
            };
            try {
                const jsonData = JSON.stringify(profileDataToExport, null, 4);
                const blob = new Blob([jsonData], { type: 'application/json' });
                const url = URL.createObjectURL(blob); const a = document.createElement('a');
                const filename = userEmailForExport ? `profile_data_${userEmailForExport.split('@')[0]}.json` : 'profile_data.json';
                a.href = url; a.download = filename; document.body.appendChild(a); a.click();
                document.body.removeChild(a); URL.revokeObjectURL(url);
                showNotification('Data exported successfully!', 'success');
            } catch (error) { console.error('Error exporting data:', error); showNotification('Failed to export data.', 'error'); }
        };
    }

    document.querySelectorAll('.activity-item, .stat-item').forEach(item => {
        item.onmouseenter = function() { this.style.transform = 'translateX(5px)'; };
        item.onmouseleave = function() { this.style.transform = 'translateX(0)'; };
    });

    const deleteConfirmModal = document.getElementById('delete-confirm-modal');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
    if (deleteAccountBtn && deleteConfirmModal && confirmDeleteBtn && cancelDeleteBtn) {
        deleteAccountBtn.onclick = () => { deleteConfirmModal.classList.remove('hidden'); };
        cancelDeleteBtn.onclick = () => { deleteConfirmModal.classList.add('hidden'); };
        confirmDeleteBtn.onclick = async () => {
            const userEmailForDelete = localStorage.getItem('userEmail'); const authTokenForDelete = localStorage.getItem('authToken');
            if (!userEmailForDelete || !authTokenForDelete) { showNotification('Authentication details not found. Cannot delete account.', 'error'); deleteConfirmModal.classList.add('hidden'); return; }
            confirmDeleteBtn.disabled = true; confirmDeleteBtn.textContent = 'Deleting...';
            try {
                const response = await fetch(`${API_URL}/delete-account`, { method: 'POST', headers: { 'Content-Type': 'application/json', }, body: JSON.stringify({ email: userEmailForDelete, token: authTokenForDelete }) });
                const result = await response.json();
                if (response.ok) { showNotification('Account deleted successfully. Redirecting...', 'success'); clearLocalStorageAndRedirect();
                } else { throw new Error(result.message || 'Failed to delete account.'); }
            } catch (error) { console.error('Error deleting account:', error); showNotification(error.message, 'error');
            } finally { confirmDeleteBtn.disabled = false; confirmDeleteBtn.textContent = 'Yes, Delete My Account'; deleteConfirmModal.classList.add('hidden'); }
        };
    } else { console.warn('Delete account buttons or modal not found in the DOM.'); }
}
