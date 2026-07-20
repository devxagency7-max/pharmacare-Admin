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
    return apiClient.get('/admin/audit-logs/metrics');
}

async function archiveAuditLogs(retentionDays) {
    const qs = retentionDays ? `?retentionDays=${retentionDays}` : '';
    return apiClient.post(`/admin/audit-logs/archive${qs}`, {});
}

// Export — fetches with Authorization header and triggers browser download
async function exportAuditLogs(format = 'csv', filters = {}) {
    const params = new URLSearchParams(buildAuditQuery(filters));
    params.set('format', format);
    const token = localStorage.getItem('idToken');

    const url = `/api/v1/admin/audit-logs/export?${params.toString()}`;
    const headers = { 'Accept': '*/*' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
        const res = await fetch(url, { headers });
        if (!res.ok) throw new Error(`Export failed: ${res.status}`);

        const blob = await res.blob();
        const ext = format === 'excel' ? 'xlsx' : format;
        const filename = `audit-logs-${new Date().toISOString().slice(0,10)}.${ext}`;

        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(a.href);
    } catch (e) {
        alert('Export failed: ' + e.message);
    }
}
