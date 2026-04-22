document.addEventListener('DOMContentLoaded', () => {
    loadAuditLogs();
    initExportBtn();
});

async function loadAuditLogs(page = 1) {
    const tableBody = document.getElementById('audit-logs-body');
    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 40px;"><i class="bx bx-loader-alt bx-spin"></i> Loading activity logs...</td></tr>';

    try {
        const response = await fetchAuditLogs(page, 20);
        const logs = Array.isArray(response) ? response : (response?.data?.items || response?.data || response?.logs || response?.content || []);
        
        if (!logs || logs.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 40px;">No activity logs found.</td></tr>';
            return;
        }

        tableBody.innerHTML = logs.map(log => `
            <tr>
                <td>${log.timestamp || log.createdAt ? new Date(log.timestamp || log.createdAt).toLocaleString() : 'N/A'}</td>
                <td>
                    <div class="user-info">
                        <div class="info">
                            <span class="name">${log.userName || log.user?.name || log.performedBy || 'System'}</span>
                            <span class="email">${log.userRole || log.user?.role || 'Admin'}</span>
                        </div>
                    </div>
                </td>
                <td><span style="font-weight:600; color:var(--primary-color);">${log.action || log.event || 'Unknown Action'}</span></td>
                <td><code style="background:#f1f5f9; padding:2px 6px; border-radius:4px;">${log.resource || log.target || 'N/A'}</code></td>
                <td>${log.ipAddress || log.ip || 'N/A'}</td>
                <td><span class="status-badge ${log.status === 'Success' || log.status === 'success' || log.status === 'Active' ? 'success' : 'warning'}">${log.status || 'Success'}</span></td>
                <td>
                    <div class="table-actions">
                        <button class="action-btn view" onclick="viewLogDetails('${log.id}')" title="View Details">
                            <i class='bx bx-search-alt'></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        updatePagination(total, page);
        renderPaginationButtons(total, page);
        updateSummaryStats(response);

    } catch (error) {
        console.error('[Audit Logs] Failed to load:', error);
        tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 40px; color: var(--danger);">Failed to load activity. <button class="btn btn-sm btn-outline" onclick="loadAuditLogs()">Retry</button></td></tr>`;
    }
}

function updateSummaryStats(response) {
    // Attempt to update the numbers at the top if provided by backend
    const stats = response?.stats || response?.summary;
    if (stats) {
        const totalEl = document.querySelector('.stat-card:nth-child(1) h2');
        const successEl = document.querySelector('.stat-card:nth-child(2) h2');
        const failedEl = document.querySelector('.stat-card:nth-child(3) h2');
        
        if (totalEl) totalEl.textContent = (stats.total || 0).toLocaleString();
        if (successEl) successEl.textContent = (stats.success || 0).toLocaleString();
        if (failedEl) failedEl.textContent = (stats.failed || 0).toLocaleString();
    }
}

function updatePagination(total, page) {
    const pageInfo = document.querySelector('.page-info');
    if (pageInfo) {
        const from = total === 0 ? 0 : (page - 1) * 20 + 1;
        const to = Math.min(page * 20, total);
        pageInfo.textContent = `Showing ${from} to ${to} of ${total.toLocaleString()} entries`;
    }
}

function renderPaginationButtons(total, currentPage) {
    const container = document.querySelector('.pagination');
    if (!container) return;

    const totalPages = Math.ceil(total / 20);
    if (totalPages <= 1) {
        container.style.display = 'none';
        return;
    }
    container.style.display = 'flex';

    let html = `
        <span class="page-info">Showing ${(currentPage - 1) * 20 + 1} to ${Math.min(currentPage * 20, total)} of ${total} entries</span>
        <button class="page-btn ${currentPage === 1 ? 'disabled' : ''}" onclick="${currentPage === 1 ? '' : `loadAuditLogs(${currentPage - 1})`}">
            <i class='bx bx-chevron-left'></i>
        </button>
    `;

    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="loadAuditLogs(${i})">${i}</button>`;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            html += `<span>...</span>`;
        }
    }

    html += `
        <button class="page-btn ${currentPage === totalPages ? 'disabled' : ''}" onclick="${currentPage === totalPages ? '' : `loadAuditLogs(${currentPage + 1})`}">
            <i class='bx bx-chevron-right'></i>
        </button>
    `;
    container.innerHTML = html;
}

function initExportBtn() {
    const exportBtn = document.getElementById('export-logs-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', async () => {
            try {
                const btn = exportBtn;
                const originalText = btn.innerHTML;
                btn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Exporting...';
                btn.disabled = true;

                await exportAuditLogsApi({});
                
                alert('Export started. Check your downloads.');
                
                btn.innerHTML = originalText;
                btn.disabled = false;
            } catch (err) {
                alert('Export failed');
            }
        });
    }
}

function viewLogDetails(id) {
    console.log('View Activity Details:', id);
    // TODO: Implement details modal
}

async function exportLogs() {
    console.log('[Audit Logs Page] Triggering server-side CSV export...');
    try {
        await exportAuditLogsApi({ /* optional filters */ });
    } catch (err) {
        console.error('Error exporting logs:', err);
    }
}
