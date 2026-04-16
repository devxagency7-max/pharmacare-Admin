document.addEventListener('DOMContentLoaded', () => {
    loadAuditLogs();
});

async function loadAuditLogs() {
    console.log('[Audit Logs Page] Loading audit logs from API...');
    try {
        const logs = await fetchAuditLogs();
        console.log('[Audit Logs Page] Logs loaded', logs);
    } catch (err) {
        console.error('Error loading audit logs:', err);
    }
}

async function exportLogs() {
    console.log('[Audit Logs Page] Triggering server-side CSV export...');
    try {
        await exportAuditLogsApi({ /* optional filters */ });
    } catch (err) {
        console.error('Error exporting logs:', err);
    }
}
