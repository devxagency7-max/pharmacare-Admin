// ──────────────────────────────────────────────
// Audit Logs API  —  /api/v1/admin/audit-logs
// ──────────────────────────────────────────────

function buildAuditQuery(filters = {}, page = 1, pageSize = 20) {
    const params = new URLSearchParams();
    params.set('page', page);
    params.set('pageSize', pageSize);
    if (filters.search)        params.set('search', filters.search);
    if (filters.from)          params.set('from', filters.from);
    if (filters.to)            params.set('to', filters.to);
    if (filters.actorUserId)   params.set('actorUserId', filters.actorUserId);
    if (filters.actorRole)     params.set('actorRole', filters.actorRole);
    if (filters.severity)      params.set('severity', filters.severity);
    if (filters.category)      params.set('category', filters.category);
    if (filters.action)        params.set('action', filters.action);
    if (filters.resourceType)  params.set('resourceType', filters.resourceType);
    if (filters.succeeded !== undefined && filters.succeeded !== '') params.set('succeeded', filters.succeeded);
    if (filters.correlationId) params.set('correlationId', filters.correlationId);
    if (filters.sortBy)        params.set('sortBy', filters.sortBy);
    if (filters.sortDescending !== undefined) params.set('sortDescending', filters.sortDescending);
    return params.toString();
}

async function fetchAuditLogs(page = 1, pageSize = 20, filters = {}) {
    const qs = buildAuditQuery(filters, page, pageSize);
    return apiClient.get(`/admin/audit-logs?${qs}`);
}

async function fetchAuditLogById(id) {
    return apiClient.get(`/admin/audit-logs/${id}`);
}

async function fetchAuditMetrics() {
    const to = new Date().toISOString().split('T')[0];
    const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return apiClient.get(`/admin/audit-logs/metrics?from=${from}&to=${to}`);
}

async function archiveAuditLogs(retentionDays) {
    const qs = retentionDays ? `?retentionDays=${retentionDays}` : '';
    return apiClient.post(`/admin/audit-logs/archive${qs}`, {});
}

// Export — triggers a file download (not a JSON response)
function exportAuditLogs(format = 'csv', filters = {}) {
    const params = new URLSearchParams(buildAuditQuery(filters));
    params.set('format', format);
    const token = localStorage.getItem('idToken');
    if (token) params.set('token', token);
    window.location.href = `/api/v1/admin/audit-logs/export?${params.toString()}`;
}
