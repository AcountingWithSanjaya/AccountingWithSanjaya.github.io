export const API_URL = 'http://helya.pylex.xyz:10209/api';

// Mock data for when backend is unavailable
const mockTeacherData = {
  stats: {
    pendingRecordings: 3,
    upcomingClasses: 2,
    papersToGrade: 5,
    totalStudents: 25
  },
  recordings: [
    {
      id: 'rec1',
      title: 'Introduction to Accounting',
      course: 'Accounting 101',
      date: new Date().toISOString().split('T')[0],
      duration: '01:30:00',
      status: 'pending',
      studentsAttended: 23
    }
  ],
  classes: {
    upcoming: [
      {
        id: 'class1',
        title: 'Financial Statements',
        course: 'Accounting 101',
        date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        startTime: '10:00',
        endTime: '11:30',
        duration: 90,
        room: 'Room 101',
        studentsEnrolled: 25,
        description: 'Learn how to prepare basic financial statements.'
      }
    ],
    past: [
      {
        id: 'pastclass1',
        title: 'Basic Accounting Principles',
        course: 'Accounting 101',
        date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        startTime: '10:00',
        endTime: '11:30',
        duration: 90,
        room: 'Room 101',
        studentsAttended: 23,
        description: 'Introduction to fundamental accounting concepts.'
      }
    ]
  },
  papers: [
    {
      id: 'doc1',
      title: 'Accounting Fundamentals',
      type: 'syllabus',
      course: 'Accounting 101',
      uploadDate: new Date(Date.now() - 432000000).toISOString().split('T')[0],
      size: '256 KB',
      format: 'pdf'
    }
  ]
};

export const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken') || 'mock-token';
  const email = localStorage.getItem('userEmail') || 'ssjayasundara@yahoo.com0';
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'X-User-Email': email
  };
};

export const checkTeacherAuth = async () => {
  try {
    const email = localStorage.getItem('userEmail') || 'ssjayasundara@yahoo.com0';
    const token = localStorage.getItem('authToken') || 'mock-token';

    const response = await fetch(`${API_URL}/confirmteacherloggedin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, token })
    });

    return response.ok;
  } catch (error) {
    console.warn('Backend unavailable, using mock auth');
    return true;
  }
};

export const loadTeacherData = async () => {
  try {
    const email = localStorage.getItem('userEmail') || 'ssjayasundara@yahoo.com0';
    const token = localStorage.getItem('authToken') || 'mock-token';

    const response = await fetch(`${API_URL}/loadteacher`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, token })
    });

    if (!response.ok) {
      throw new Error('Failed to load teacher data');
    }

    return await response.json();
  } catch (error) {
    console.warn('Backend unavailable, using mock data');
    return mockTeacherData;
  }
};

export const uploadRecording = async (recordingId, file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('recordingId', recordingId);
    formData.append('email', localStorage.getItem('userEmail') || 'ssjayasundara@yahoo.com0');
    formData.append('token', localStorage.getItem('authToken') || 'mock-token');

    const response = await fetch(`${API_URL}/upload/recording`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Failed to upload recording');
    }

    return response.json();
  } catch (error) {
    console.warn('Backend unavailable, simulating upload');
    return {
      message: 'Recording uploaded successfully (mock)',
      driveLink: 'https://drive.google.com/mock-link'
    };
  }
};

export const uploadPaper = async (paperData, file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('data', JSON.stringify(paperData));
    formData.append('email', localStorage.getItem('userEmail') || 'ssjayasundara@yahoo.com0');
    formData.append('token', localStorage.getItem('authToken') || 'mock-token');

    const response = await fetch(`${API_URL}/upload/paper`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Failed to upload paper');
    }

    return response.json();
  } catch (error) {
    console.warn('Backend unavailable, simulating upload');
    return {
      message: 'Paper uploaded successfully (mock)',
      paper: {
        ...paperData,
        id: `doc${Date.now()}`,
        uploadDate: new Date().toISOString().split('T')[0],
        size: '128 KB',
        driveLink: 'https://drive.google.com/mock-link'
      }
    };
  }
};