let currentPage = 1;
let totalPages = 1;
let totalCount = 0;
const PAGE_SIZE = 20;
let allLoadedLogs = [];

document.addEventListener('DOMContentLoaded', () => {
    loadAuditLogs(1);
});

async function loadAuditLogs(page = 1) {
    currentPage = page;
    const tableBody = document.getElementById('audit-logs-body');
    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 40px;"><i class="bx bx-loader-alt bx-spin"></i> Loading activity logs...</td></tr>';

    try {
        const res = await fetchAuditLogs(page, PAGE_SIZE);
        
        let items = [];
        let total = 0;

        if (res && res.success && res.data) {
            items = res.data.items || [];
            total = res.data.totalCount || items.length;
        }

        allLoadedLogs = items;
        totalCount = total;
        totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

        if (items.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 40px; color: var(--text-muted);">No activity logs found.</td></tr>';
        } else {
            renderTable(items);
        }

        updateStats(items, total);
        updatePagination(page, total);

    } catch (error) {
        console.error('[Audit Logs] Error:', error);
        tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 40px; color: var(--danger);">Failed to load data.</td></tr>`;
    }
}

function renderTable(logs) {
    const tableBody = document.getElementById('audit-logs-body');
    if (!tableBody) return;

    const resourceColors = {
        'User': { color: '#6366f1', bg: '#eef2ff' },
        'Pharmacy': { color: '#10b981', bg: '#ecfdf5' },
        'Pharmacist': { color: '#0057d1', bg: '#eff6ff' },
        'System': { color: '#64748b', bg: '#f1f5f9' }
    };

    tableBody.innerHTML = logs.map(log => {
        const type = log.entityType || 'System';
        const colorStyle = resourceColors[type] || resourceColors['System'];
        const date = new Date(log.timestamp);
        
        return `
        <tr>
            <td>
                <div style="display:flex; flex-direction:column;">
                    <span style="font-weight:600; font-size:13px;">${date.toLocaleDateString()}</span>
                    <span style="font-size:11px; color:var(--text-muted);">${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            </td>
            <td><span class="status-badge" style="background:#f1f5f9; color:#475569; font-weight:600;">${log.adminName || 'Admin'}</span></td>
            <td><span style="font-weight:600; color:var(--primary); font-size:12px;">${log.action || 'N/A'}</span></td>
            <td>
                <span style="padding:4px 10px; border-radius:20px; background:${colorStyle.bg}; color:${colorStyle.color}; font-size:11px; font-weight:600;">
                    ${type}
                </span>
            </td>
            <td><code style="font-size:10px; color:#64748b; background:#f8fafc; padding:2px 4px; border-radius:4px;">${log.entityId || '—'}</code></td>
            <td><code style="font-size:10px; color:#94a3b8;">${log.id ? log.id.substring(0,8) + '...' : '—'}</code></td>
            <td>
                <button class="action-btn view" onclick="viewLogDetails('${log.id}')">
                    <i class='bx bx-info-circle'></i>
                </button>
            </td>
        </tr>`;
    }).join('');
}

function updateStats(items, total) {
    // 1. Total Events
    const totalEl = document.getElementById('audit-total');
    if (totalEl) totalEl.textContent = total.toLocaleString();

    // 2. Unique Actors (حساب عدد الأشخاص المختلفين الذين قاموا بعمليات)
    const actorsEl = document.getElementById('audit-actors');
    if (actorsEl) {
        const uniqueActors = new Set(items.map(l => l.adminName || 'Admin')).size;
        actorsEl.textContent = uniqueActors.toLocaleString();
    }

    // 3. Actions Today (العمليات التي تمت اليوم)
    const todayEl = document.getElementById('audit-today');
    if (todayEl) {
        const todayStr = new Date().toDateString();
        const todayCount = items.filter(l => l.timestamp && new Date(l.timestamp).toDateString() === todayStr).length;
        todayEl.textContent = todayCount.toLocaleString();
    }

    // 4. Admin Actions (العمليات التي قام بها الـ Admin)
    const adminEl = document.getElementById('audit-admin');
    if (adminEl) {
        const adminCount = items.filter(l => (l.adminName === 'Admin')).length;
        adminEl.textContent = adminCount.toLocaleString();
    }
}

function updatePagination(page, total) {
    const pageInfo = document.getElementById('audit-page-info');
    if (pageInfo) {
        const start = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
        const end = Math.min(page * PAGE_SIZE, total);
        pageInfo.textContent = `Showing ${start} to ${end} of ${total} entries`;
    }
    const prevBtn = document.getElementById('audit-prev-btn');
    const nextBtn = document.getElementById('audit-next-btn');
    if (prevBtn) prevBtn.disabled = page <= 1;
    if (nextBtn) nextBtn.disabled = page >= totalPages;
}

function viewLogDetails(id) {
    const log = allLoadedLogs.find(l => String(l.id) === String(id));
    if (log) {
        alert(`Log Details:\nLog ID: ${log.id}\nAction: ${log.action}\nEntity: ${log.entityType}\nAdmin: ${log.adminName}`);
    }
}
