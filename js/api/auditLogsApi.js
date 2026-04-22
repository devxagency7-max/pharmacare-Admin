// Audit Logs API hooks using centralized apiClient
async function fetchAuditLogs(page = 1, pageSize = 20) {
    return await apiClient.get(apiClient.paginate('/admin/activity', page, pageSize));
}

async function exportAuditLogsApi(filters = {}) {
    console.log('[Audit Logs] Exporting with filters:', filters);
    return await apiClient.get(apiClient.paginate('/admin/activity', 1, 1000, filters));
}
