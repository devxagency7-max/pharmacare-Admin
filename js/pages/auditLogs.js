let currentPage = 1;
let totalPages = 1;
let totalCount = 0;
const PAGE_SIZE = 20;
let searchTimer = null;

const getFilters = () => ({
    search:    document.getElementById('f-search')?.value.trim() || '',
    from:      document.getElementById('f-from')?.value || '',
    to:        document.getElementById('f-to')?.value || '',
    severity:  document.getElementById('f-severity')?.value || '',
    category:  document.getElementById('f-category')?.value || '',
    succeeded: document.getElementById('f-succeeded')?.value ?? '',
});

document.addEventListener('DOMContentLoaded', () => {

    loadLogs(1);
});

// ── Metrics ───────────────────────────────────
async function loadMetrics() {
    try {
        const res = await fetchAuditMetrics();
        const d = res?.data || res;
        setText('m-total',    (d.totalLogs ?? 0).toLocaleString());
        setText('m-today',    (d.todaysLogs ?? 0).toLocaleString());
        setText('m-users',    (d.uniqueUsers ?? 0).toLocaleString());
        setText('m-failed',   (d.failedOperations ?? 0).toLocaleString());
        setText('m-critical', (d.criticalEvents ?? 0).toLocaleString());
    } catch (e) {
        // Metrics endpoint not available — show dashes silently
        ['m-total','m-today','m-users','m-failed','m-critical'].forEach(id => setText(id, '—'));
    }
}

function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

// ── Load / render table ───────────────────────
async function loadLogs(page = 1) {
    currentPage = page;
    const body = document.getElementById('audit-body');
    body.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;"><i class="bx bx-loader-alt bx-spin"></i> Loading...</td></tr>';

    try {
        const res = await fetchAuditLogs(page, PAGE_SIZE, getFilters());
        const d = res?.data || res;
        const items = d.items || [];
        totalCount = d.totalCount || 0;
        totalPages = d.totalPages || Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

        if (items.length === 0) {
            body.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:48px;color:var(--text-muted);"><i class="bx bx-search-alt-2" style="font-size:32px;display:block;margin-bottom:8px;"></i>No logs match your filters.</td></tr>';
        } else {
            body.innerHTML = items.map(log => buildRow(log)).join('');
        }

        updatePaginationInfo();
        renderPaginationButtons();
    } catch (err) {
        body.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--danger);"><i class='bx bx-error-circle' style="font-size:28px;display:block;margin-bottom:8px;"></i>${err.message}</td></tr>`;
    }
}

function buildRow(log) {
    const ts = log.timestamp ? new Date(log.timestamp) : null;
    const date = ts ? ts.toLocaleDateString() : '—';
    const time = ts ? ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
    const actor = log.actorName || log.actorEmail || 'System';
    const resource = [log.resourceType, log.resourceName || log.resourceId ? (log.resourceName || log.resourceId?.substring(0,8) + '…') : ''].filter(Boolean).join(': ') || '—';
    const succeeded = log.succeeded;
    const statusHtml = succeeded
        ? '<span class="status-dot ok">OK</span>'
        : `<span class="status-dot fail">${log.statusCode || 'Fail'}</span>`;
    const sev = log.severity || 'Information';
    const isCritical = sev === 'Critical';

    return `<tr${isCritical ? ' class="critical-row"' : ''}>
        <td><div style="font-weight:600;font-size:13px;">${date}</div><div style="font-size:11px;color:var(--text-muted);">${time}</div></td>
        <td>
            <div style="font-weight:600;font-size:13px;">${escHtml(actor)}</div>
            ${log.actorRole ? `<div style="font-size:11px;color:var(--text-muted);">${escHtml(log.actorRole)}</div>` : ''}
        </td>
        <td><span style="font-weight:700;font-size:12px;color:var(--primary);">${escHtml(log.action || '—')}</span></td>
        <td><span style="font-size:12px;font-weight:600;color:#475569;">${escHtml(log.category || '—')}</span></td>
        <td style="font-size:12px;color:var(--text-muted);">${escHtml(resource)}</td>
        <td>${statusHtml}</td>
        <td><span class="severity-badge ${sev}">${sev}</span></td>
        <td>
            <button class="action-btn view" onclick="openDrawer('${log.id}')" title="View Details">
                <i class='bx bx-info-circle'></i>
            </button>
        </td>
    </tr>`;
}

// ── Detail drawer ─────────────────────────────
async function openDrawer(id) {
    const overlay = document.getElementById('drawer-overlay');
    const drawer = document.getElementById('audit-drawer');
    const body = document.getElementById('drawer-body');
    overlay.classList.add('active');
    drawer.classList.add('active');
    body.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted);"><i class="bx bx-loader-alt bx-spin" style="font-size:28px;"></i></div>';

    try {
        const res = await fetchAuditLogById(id);
        const d = res?.data || res;
        body.innerHTML = renderDrawer(d);
    } catch (err) {
        body.innerHTML = `<div style="padding:24px;color:var(--danger);">Failed to load: ${err.message}</div>`;
    }
}

function closeDrawer() {
    document.getElementById('drawer-overlay').classList.remove('active');
    document.getElementById('audit-drawer').classList.remove('active');
}

function renderDrawer(d) {
    const ts = d.timestamp ? new Date(d.timestamp).toLocaleString() : '—';
    const dur = d.durationMs != null ? (d.durationMs >= 1000 ? (d.durationMs / 1000).toFixed(1) + 's' : d.durationMs + 'ms') : '—';

    const drawerRow = (label, value) =>
        `<div class="drawer-row"><span class="dr-l">${label}</span><span class="dr-v">${value || '—'}</span></div>`;

    const jsonBlock = (raw) => {
        if (!raw) return '<span style="color:var(--text-muted)">null</span>';
        try {
            return `<div class="json-block">${escHtml(JSON.stringify(JSON.parse(raw), null, 2))}</div>`;
        } catch {
            return `<div class="json-block">${escHtml(raw)}</div>`;
        }
    };

    let html = `
    <div class="drawer-section">
        <h4>Event</h4>
        ${drawerRow('Action', `<span style="font-weight:800;color:var(--primary);">${escHtml(d.action || '—')}</span>`)}
        ${drawerRow('Module', escHtml(d.category || '—'))}
        ${drawerRow('Timestamp', ts)}
        ${drawerRow('Severity', `<span class="severity-badge ${d.severity}">${d.severity || 'Information'}</span>`)}
        ${drawerRow('Status', d.succeeded ? `<span style="color:var(--success);font-weight:700;">${d.statusCode || 'OK'} ✓</span>` : `<span style="color:var(--danger);font-weight:700;">${d.statusCode || 'Failed'} ✗</span>`)}
        ${drawerRow('Duration', dur)}
    </div>
    <div class="drawer-section">
        <h4>Actor</h4>
        ${drawerRow('Name', escHtml(d.actorName || '—'))}
        ${drawerRow('Email', escHtml(d.actorEmail || '—'))}
        ${drawerRow('Role', escHtml(d.actorRole || '—'))}
    </div>`;

    if (d.targetUserId || d.targetUserName) {
        html += `<div class="drawer-section">
            <h4>Target User</h4>
            ${drawerRow('Name', escHtml(d.targetUserName || '—'))}
            ${drawerRow('ID', `<code style="font-size:11px;">${escHtml(d.targetUserId || '—')}</code>`)}
        </div>`;
    }

    html += `
    <div class="drawer-section">
        <h4>Resource</h4>
        ${drawerRow('Type', escHtml(d.resourceType || '—'))}
        ${drawerRow('Name', escHtml(d.resourceName || '—'))}
        ${drawerRow('ID', d.resourceId ? `<code style="font-size:11px;">${escHtml(d.resourceId)}</code>` : '—')}
    </div>
    <div class="drawer-section">
        <h4>Request</h4>
        ${drawerRow('Method + Endpoint', `<code style="font-size:11px;">${escHtml((d.httpMethod || '') + ' ' + (d.endpoint || ''))}</code>`)}
        ${drawerRow('IP Address', escHtml(d.ipAddress || '—'))}
        ${drawerRow('Browser', escHtml(d.browser || '—'))}
        ${drawerRow('OS', escHtml(d.operatingSystem || '—'))}
        ${drawerRow('Correlation ID', d.correlationId ? `<code style="font-size:11px;">${escHtml(d.correlationId)}</code>` : '—')}
    </div>`;

    if (d.description) {
        html += `<div class="drawer-section"><h4>Description</h4><p style="font-size:13px;color:var(--text-muted);line-height:1.6;">${escHtml(d.description)}</p></div>`;
    }

    if (d.oldValues || d.newValues) {
        html += `<div class="drawer-section">
            <h4>Changes</h4>
            ${d.oldValues ? `<div style="margin-bottom:10px;"><div style="font-size:12px;font-weight:600;color:var(--text-muted);margin-bottom:6px;">Old Values</div>${jsonBlock(d.oldValues)}</div>` : ''}
            ${d.newValues ? `<div><div style="font-size:12px;font-weight:600;color:var(--text-muted);margin-bottom:6px;">New Values</div>${jsonBlock(d.newValues)}</div>` : ''}
        </div>`;
    }

    if (d.metadata) {
        html += `<div class="drawer-section"><h4>Metadata</h4>${jsonBlock(d.metadata)}</div>`;
    }

    return html;
}

// ── Filters & search ──────────────────────────
function applyFilters() {
    currentPage = 1;
    loadLogs(1);
}

function debounceSearch() {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => applyFilters(), 400);
}

function clearFilters() {
    ['f-search','f-from','f-to'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    ['f-severity','f-category','f-succeeded'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    applyFilters();
}

// ── Export ────────────────────────────────────
function toggleExportMenu() {
    document.getElementById('export-menu').classList.toggle('open');
}

function doExport(format) {
    document.getElementById('export-menu').classList.remove('open');
    exportAuditLogs(format, getFilters());
}

document.addEventListener('click', e => {
    if (!e.target.closest('.export-wrap')) {
        document.getElementById('export-menu')?.classList.remove('open');
    }
});

// ── Pagination ────────────────────────────────
function updatePaginationInfo() {
    const start = totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
    const end = Math.min(currentPage * PAGE_SIZE, totalCount);
    const el = document.getElementById('page-info');
    if (el) el.textContent = `Showing ${start}–${end} of ${totalCount.toLocaleString()} entries`;
}

function renderPaginationButtons() {
    const container = document.getElementById('pagination-buttons');
    if (!container) return;
    const pages = [];
    pages.push({ label: '‹', page: currentPage - 1, disabled: currentPage <= 1 });
    const range = buildPageRange(currentPage, totalPages);
    range.forEach(p => pages.push({ label: p === '…' ? '…' : String(p), page: p, disabled: p === '…', active: p === currentPage }));
    pages.push({ label: '›', page: currentPage + 1, disabled: currentPage >= totalPages });
    container.innerHTML = pages.map(p =>
        `<button class="page-btn${p.active ? ' active' : ''}" ${p.disabled ? 'disabled' : ''} onclick="${p.page && p.page !== '…' ? `loadLogs(${p.page})` : ''}">
            ${p.label}
        </button>`
    ).join('');
}

function buildPageRange(cur, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (cur <= 4) return [1, 2, 3, 4, 5, '…', total];
    if (cur >= total - 3) return [1, '…', total - 4, total - 3, total - 2, total - 1, total];
    return [1, '…', cur - 1, cur, cur + 1, '…', total];
}

// ── Utils ─────────────────────────────────────
function escHtml(str) {
    return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
