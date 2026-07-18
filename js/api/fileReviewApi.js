// File Review API
// Route: /api/admin/files  (NOT versioned — no /v1 segment, same server as the main API)
// NOTE: This uses a direct fetch (not apiClient) because the path is outside /api/v1

const FILE_REVIEW_BASE = '/api/admin/files';

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

async function fetchPendingFiles() {
    return fileReviewRequest('/pending');
}

async function approveFile(fileId) {
    return fileReviewRequest(`/${fileId}/approve`, { method: 'POST' });
}

// reason: required, min 3 chars, max 1000 chars
async function rejectFile(fileId, reason) {
    return fileReviewRequest(`/${fileId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason })
    });
}
