const API_BASE_URL = '/api/admin';

// Audit Logs API hooks
async function fetchAuditLogs() {
    console.log(`GET ${API_BASE_URL}/audit-logs`);
    return [];
}

async function exportAuditLogsApi(filters) {
    console.log(`GET ${API_BASE_URL}/audit-logs/export`, filters);
    // Usually download a BLOB object directly from response
}
