// The base URL for your Flask backend API
const API_URL = 'http://127.0.0.1:5000/api';

/**
 * A helper function to create authorization headers.
 */
const getAuthHeaders = (isJson = true) => {
    const token = localStorage.getItem('token');
    const headers = {
        'Authorization': `Bearer ${token}`
    };
    if (isJson) {
        headers['Content-Type'] = 'application/json';
    }
    return headers;
};

/**
 * FIX: A new wrapper for fetch that handles 401 Unauthorized errors automatically.
 * It will log the user out and reload the page to redirect to the login screen.
 */
const fetchWithAuth = async (url, options = {}) => {
    const response = await fetch(url, options);
    if (response.status === 401) {
        // Token is invalid or expired.
        logout();
        // Reload the page. The App's ProtectedRoute will redirect to /login.
        window.location.reload(); 
        // Throw an error to stop further execution in the calling function.
        throw new Error('Session expired. Please log in again.');
    }
    return response;
};


/**
 * Handles user login. Stores the token and role on success.
 */
export const login = async (username, password) => {
    const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });
    const data = await response.json();
    if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.role);
        localStorage.setItem('username', username);
    }
    return data;
};

/**
 * Handles user logout. Clears user data from localStorage.
 */
export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    return Promise.resolve({ success: true });
};

/**
 * Starts the frame extraction process for a locally uploaded video.
 */
export const startFrameExtraction = async (formData, signal) => {
    const response = await fetchWithAuth(`${API_URL}/frame_extraction`, {
        method: 'POST',
        headers: getAuthHeaders(false),
        body: formData,
        signal,
    });
    return response.json();
};

/**
 * Polls the status of a Celery task.
 */
export const getTaskStatus = async (taskId) => {
    const response = await fetchWithAuth(`${API_URL}/task-status/${taskId}`, {
        headers: getAuthHeaders(),
    });
    return response.json();
};

/**
 * Retrieves a list of video folders and files from S3 based on criteria.
 */
export const retrieveVideos = async (formData) => {
    const response = await fetchWithAuth(`${API_URL}/retrieve-videos`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
    });
    return response.json();
};

/**
 * Uploads a video file directly to the S3 bucket.
 */
export const uploadVideoToS3 = async (formData, signal) => {
     const response = await fetchWithAuth(`${API_gURL}/s3-upload`, {
        method: 'POST',
        headers: getAuthHeaders(false),
        body: formData,
        signal,
    });
    return response.json();
}

/**
 * Checks the status of a file on S3.
 */
export const checkS3UploadStatus = async (s3_key) => {
    const response = await fetchWithAuth(`${API_URL}/s3-upload-status`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ s3_key }),
    });
    return response.json();
};


/**
 * Starts the processing of videos that are already on S3.
 */
export const processS3Videos = async (folderData) => {
    const response = await fetchWithAuth(`${API_URL}/process-s3-videos`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(folderData)
    });
    return response.json();
}

/**
 * Fetches system status data for the main dashboard.
 */
export const getSystemStatus = async () => {
    const response = await fetchWithAuth(`${API_URL}/system-status`, {
        headers: getAuthHeaders()
    });
    return response.json();
};

/**
 * Fetches chart data for the main dashboard.
 */
export const getChartData = async () => {
    const response = await fetchWithAuth(`${API_URL}/chart-data`, {
        headers: getAuthHeaders()
    });
    return response.json();
};

/**
 * FIX: Corrected the getVideoUrl function to use the API_URL prefix and the
 * fetchWithAuth wrapper for consistency and proper error handling.
 */
export const getVideoUrl = async (s3_key) => {
    const response = await fetchWithAuth(`${API_URL}/get-video-url`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ s3_key }),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch video URL');
    }
    return response.json();
};