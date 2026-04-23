// File Review API (Handling non-v1 admin endpoints)
const FILE_REVIEW_BASE = 'http://148.230.114.124:8080/api/admin/files';

async function fileReviewRequest(endpoint, options = {}) {
    const token = await apiClient.getAuthToken();
    const url = `${FILE_REVIEW_BASE}${endpoint}`;
    
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
    };

    const res = await fetch(url, { ...options, headers });
    if (!res.ok) throw new Error('File review API error');
    return res.json();
}

/**
 * Fetch all pending pharmacist application files
 */
async function fetchPendingFiles() {
    return fileReviewRequest('/pending');
}

/**
 * Approve a file
 */
async function approveFile(fileId) {
    return fileReviewRequest(`/${fileId}/approve`, { method: 'POST' });
}

/**
 * Reject a file with reason
 */
async function rejectFile(fileId, reason) {
    return fileReviewRequest(`/${fileId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason })
    });
}
