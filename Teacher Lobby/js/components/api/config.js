export const API_BASE_URL = 'http://127.0.0.1:10209'; // Base URL for the backend

// Mock data is no longer used.
// const mockTeacherData = { ... };

export const getAuthHeaders = (isFormData = false) => {
  console.log('[API Config] getAuthHeaders called. isFormData:', isFormData);
  const token = localStorage.getItem('authToken');
  const email = localStorage.getItem('userEmail');
  
  if (!token || !email) {
    // Handle missing auth details, perhaps redirect to login or show an error
    console.error("Auth token or email is missing from localStorage.");
    // throw new Error("Authentication details not found."); // Or handle more gracefully
  }

  const headers = {};
  if (!isFormData) { // For JSON, set Content-Type
    headers['Content-Type'] = 'application/json';
  }
  // For FormData, the browser sets Content-Type automatically with boundary.
  
  if (token) headers['Authorization'] = `Bearer ${token}`;
  // Email might be sent in body or as a query param depending on GET/POST
  // Or included if endpoint specifically needs it in header (X-User-Email was an example)
  // For POST requests, it's better to include email in the JSON body.
  // For FormData, include it as a form field.
  console.log('[API Config] Auth headers generated:', headers);
  return headers;
  // Remove extra closing brace here: };
};

export const checkTeacherAuth = async () => {
  console.log('[API Config] checkTeacherAuth called.');
  const email = localStorage.getItem('userEmail');
  const token = localStorage.getItem('authToken');

  if (!email || !token) {
    console.error('[API Config] Auth details missing from localStorage for checkTeacherAuth.');
    throw new Error("Authentication details not found in localStorage. Please log in.");
  }

  try {
    const response = await fetch(`${API_BASE_URL}/confirmteacherloggedin`, { // Corrected endpoint
      method: 'POST',
      headers: getAuthHeaders(), // Use the helper for headers
      body: JSON.stringify({ email, token }) // Send email and token in body
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Unknown error during auth check." }));
        console.error('[API Config] Teacher auth check failed server-side:', errorData.message);
        // If auth fails, throw an error to be handled by main.js
        localStorage.removeItem('authToken'); // Still good to clear invalid tokens
        localStorage.removeItem('userEmail');
        throw new Error(`Authentication failed: ${errorData.message || 'Server validation failed'}. Please log in again.`);
    }
    console.log('[API Config] Teacher authentication successful.');
    return true;
  } catch (error) {
    // Differentiate network/fetch errors from server-side auth failures thrown above
    if (error.message.startsWith("Authentication failed:")) {
        throw error; // Re-throw the specific auth error
    }
    // Catch network errors or other unexpected issues during fetch
    console.error('[API Config] Network or unexpected error during teacher auth check:', error);
    throw new Error(`Error connecting to server for authentication: ${error.message}. Please check your connection or try again later.`);
  }
};

export const loadTeacherData = async () => {
  console.log('[API Config] loadTeacherData called.');
  const email = localStorage.getItem('userEmail');
  const token = localStorage.getItem('authToken');

  if (!email || !token) {
    console.error('[API Config] Auth details missing for loadTeacherData');
    throw new Error("Auth details not found for loading teacher data.");
  }

  try {
    const response = await fetch(`${API_BASE_URL}/loadteacher`, { // Corrected endpoint
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ email, token })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[API Config] Failed to load teacher data:', errorData.message);
      throw new Error(errorData.message || 'Failed to load teacher data');
    }
    const data = await response.json();
    console.log('[API Config] Teacher data loaded successfully:', data);
    return data;
  } catch (error) {
    console.error('[API Config] Error loading teacher data:', error);
    // Handle error, e.g., show message to user, or redirect
    throw error; // Re-throw to be caught by calling function in main.js
  }
};


export const scheduleNewClass = async (classDetails) => {
  console.log('[API Config] scheduleNewClass called with details:', classDetails);
  const email = localStorage.getItem('userEmail');
  const token = localStorage.getItem('authToken');

  if (!email || !token) {
    console.error('[API Config] Authentication details not found for scheduling class.');
    throw new Error("Authentication details not found for scheduling class.");
  }
  
  // Add auth details to the payload for the backend to verify
  const payload = {
    ...classDetails,
    auth_email: email,
    auth_token: token
  };
  console.log('[API Config] Scheduling class with payload:', payload);

  try {
    const response = await fetch(`${API_BASE_URL}/teacher/schedule-class`, {
      method: 'POST',
      headers: getAuthHeaders(), // Content-Type: application/json
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const errorData = await response.json();
      console.error('[API Config] Failed to schedule new class:', errorData.message);
      throw new Error(errorData.message || 'Failed to schedule new class');
    }
    const result = await response.json(); // Should return { message: "...", class: { ... } }
    console.log('[API Config] Class scheduled successfully:', result);
    return result;
  } catch (error) {
    console.error('[API Config] Error scheduling new class:', error);
    throw error;
  }
};

export const uploadRecording = async (recordingId, file, metadata) => {
  console.log('[API Config] uploadRecording called. ID:', recordingId, 'File:', file.name, 'Metadata:', metadata);
  const email = localStorage.getItem('userEmail');
  const token = localStorage.getItem('authToken');

  if (!email || !token) {
    console.error('[API Config] Authentication details not found for uploading recording.');
    throw new Error("Authentication details not found for uploading recording.");
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('recordingId', recordingId); // ID of the recording being updated/uploaded
  formData.append('email', email); // Auth email
  formData.append('token', token); // Auth token
  
  // Append other metadata from the form
  if (metadata.title) formData.append('title', metadata.title);
  // if (metadata.course_id) formData.append('course_id', metadata.course_id); // if using course ID
  if (metadata.courseName) formData.append('course', metadata.courseName); // if using course name
  if (metadata.date) formData.append('date', metadata.date);
  // Add any other metadata fields like description if needed by backend
  console.log('[API Config] Uploading recording with FormData.');

  try {
    const response = await fetch(`${API_BASE_URL}/upload/recording`, { // Corrected endpoint
      method: 'POST',
      headers: getAuthHeaders(true), // Pass true for FormData to omit Content-Type
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[API Config] Failed to upload recording:', errorData.message);
      throw new Error(errorData.message || 'Failed to upload recording');
    }
    const result = await response.json(); // Expects { message, driveLink, recording }
    console.log('[API Config] Recording uploaded successfully:', result);
    return result;
  } catch (error) {
    console.error('[API Config] Error uploading recording:', error);
    throw error;
  }
};

export const updateScheduledClass = async (classId, classDetails) => {
  console.log('[API Config] updateScheduledClass called. ID:', classId, 'Details:', classDetails);
  const email = localStorage.getItem('userEmail');
  const token = localStorage.getItem('authToken');

  if (!email || !token) {
    console.error('[API Config] Authentication details not found for updating class.');
    throw new Error("Authentication details not found for updating class.");
  }

  const payload = {
    ...classDetails,
    classId: classId, // Include the classId in the payload
    auth_email: email,
    auth_token: token
  };
  console.log('[API Config] Updating class with payload:', payload);

  try {
    const response = await fetch(`${API_BASE_URL}/teacher/update-class`, { // New endpoint
      method: 'POST', // Or PUT
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const errorData = await response.json();
      console.error('[API Config] Failed to update class:', errorData.message);
      throw new Error(errorData.message || 'Failed to update class');
    }
    const result = await response.json(); // Should return { message: "...", class: { ... } }
    console.log('[API Config] Class updated successfully:', result);
    return result;
  } catch (error) {
    console.error('[API Config] Error updating class:', error);
    throw error;
  }
};

export const uploadPaper = async (paperData, file) => {
  console.log('[API Config] uploadPaper called. Data:', paperData, 'File:', file.name);
  const email = localStorage.getItem('userEmail');
  const token = localStorage.getItem('authToken');

  if (!email || !token) {
    console.error('[API Config] Authentication details not found for uploading paper.');
    throw new Error("Authentication details not found for uploading paper.");
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('data', JSON.stringify(paperData)); // title, type, course
  formData.append('email', email); // Auth email
  formData.append('token', token); // Auth token
  console.log('[API Config] Uploading paper with FormData.');

  try {
    const response = await fetch(`${API_BASE_URL}/upload/paper`, { // Corrected endpoint
      method: 'POST',
      headers: getAuthHeaders(true), // Pass true for FormData
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[API Config] Failed to upload paper:', errorData.message);
      throw new Error(errorData.message || 'Failed to upload paper');
    }
    const result = await response.json(); // Expects { message, paper }
    console.log('[API Config] Paper uploaded successfully:', result);
    return result;
  } catch (error) {
    console.error('[API Config] Error uploading paper:', error);
    throw error;
  }
};
