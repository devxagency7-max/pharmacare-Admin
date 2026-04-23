// Audit Logs API
const AUDIT_ENDPOINTS = {
    LATEST: '/admin/activity/logs',
    EXPORT: '/admin/activity/logs/export'
};

/**
 * Fetch latest activity logs with pagination
 */
async function fetchAuditLogs(page = 1, pageSize = 20) {
    return apiClient.get(`${AUDIT_ENDPOINTS.LATEST}?page=${page}&pageSize=${pageSize}`);
}

/**
 * Export logs as CSV
 */
async function exportAuditLogsApi(filters = {}) {
    // In production this might be a direct link or a blob response
    const token = await apiClient.getAuthToken();
    window.open(`${apiClient.baseUrl}${AUDIT_ENDPOINTS.EXPORT}?token=${token}`, '_blank');
}
