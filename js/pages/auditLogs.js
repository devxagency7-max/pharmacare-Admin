document.addEventListener('DOMContentLoaded', () => {
    loadAuditLogs();
    initExportBtn();
});

async function loadAuditLogs(page = 1) {
    const tableBody = document.getElementById('audit-logs-body');
    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 40px;"><i class="bx bx-loader-alt bx-spin"></i> Loading activity logs...</td></tr>';

    try {
        const res = await fetchAuditLogs(page, 20);
        const logs = res?.data?.items || res?.data || [];
        
        if (logs.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 40px;">No activity logs found.</td></tr>';
            return;
        }

        const actorColors = {
            'Admin': { color: '#6366f1', bg: '#eef2ff' },
            'Patient': { color: '#10b981', bg: '#ecfdf5' },
            'Pharmacy': { color: '#8b5cf6', bg: '#f5f3ff' },
            'System': { color: '#64748b', bg: '#f1f5f9' }
        };

        tableBody.innerHTML = logs.map(log => {
            const actor = actorColors[log.actorType] || actorColors['System'];
            const timeStr = log.createdAt ? new Date(log.createdAt).toLocaleString() : 'N/A';
            const entityLabel = log.entityType || 'N/A';
            const entityIdShort = log.entityId ? log.entityId.slice(0, 8) + '...' : 'N/A';

            return `
            <tr>
                <td>${timeStr}</td>
                <td>
                    <span style="display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:20px;background:${actor.bg};color:${actor.color};font-size:12px;font-weight:600;">
                        ${log.actorType || 'System'}
                    </span>
                </td>
                <td><span style="font-weight:600; color:var(--primary);">${log.action || 'Action'}</span></td>
                <td><code style="background:#f1f5f9; padding:2px 6px; border-radius:4px;">${entityLabel}</code></td>
                <td><code style="font-size:11px; color:var(--text-muted);">${entityIdShort}</code></td>
                <td><span class="status-badge success">Logged</span></td>
                <td>
                    <div class="table-actions">
                        <button class="action-btn view" onclick="viewLogDetails('${log.id}')" title="View Details">
                            <i class='bx bx-search-alt'></i>
                        </button>
                    </div>
                </td>
            </tr>`;
        }).join('');

    } catch (error) {
        console.error('[Audit Logs] Failed to load:', error);
        tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 40px; color: var(--danger);">Failed to load activity.</td></tr>`;
    }
}

function initExportBtn() {
    const exportBtn = document.getElementById('export-logs-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            exportAuditLogsApi();
        });
    }
}

function viewLogDetails(id) {
    console.log('Viewing details for log:', id);
    // Future expansion: Detailed modal
}
