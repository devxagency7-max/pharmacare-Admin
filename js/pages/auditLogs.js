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
    loadMetrics();
    loadLogs(1);
    initArchiveButton();
});

function isSuperAdmin() {
    try {
        const token = localStorage.getItem('idToken');
        if (!token) return false;
        const payload = JSON.parse(atob(token.split('.')[1]));
        const roles = payload.role || payload.roles || [];
        return Array.isArray(roles) ? roles.includes('SuperAdmin') : roles === 'SuperAdmin';
    } catch { return false; }
}

function initArchiveButton() {
    if (isSuperAdmin()) {
        const btn = document.getElementById('archive-btn');
        if (btn) btn.style.display = '';
    }
}

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
        const moduleEl = document.getElementById('m-module');
        if (moduleEl) {
            const mod = d.mostActiveModule || '—';
            moduleEl.textContent = mod;
            moduleEl.style.fontSize = mod.length > 10 ? '13px' : mod.length > 7 ? '16px' : '24px';
        }
        setText('m-avg-resp', d.averageResponseTimeMs != null ? d.averageResponseTimeMs.toFixed(1) + ' ms' : '—');

        renderTopActions(d.topActions || []);
        renderTopActors(d.topActors || []);
    } catch (e) {
        ['m-total','m-today','m-users','m-failed','m-critical','m-module','m-avg-resp'].forEach(id => setText(id, '—'));
        setText('top-actions-list', '');
        setText('top-actors-list', '');
    }
}

function renderTopActions(actions) {
    const el = document.getElementById('top-actions-list');
    if (!el) return;
    if (!actions.length) { el.innerHTML = '<li style="color:var(--text-muted)">No data</li>'; return; }
    const max = actions[0].count || 1;
    el.innerHTML = actions.map(a => `
        <li>
            <span class="i-name">${escHtml(a.action)}</span>
            <div class="i-bar-wrap"><div class="i-bar" style="width:${Math.round((a.count/max)*100)}%"></div></div>
            <span class="i-count">${a.count.toLocaleString()}</span>
        </li>`).join('');
}

function renderTopActors(actors) {
    const el = document.getElementById('top-actors-list');
    if (!el) return;
    if (!actors.length) { el.innerHTML = '<li style="color:var(--text-muted)">No data</li>'; return; }
    const max = actors[0].count || 1;
    el.innerHTML = actors.map(a => `
        <li>
            <span class="i-name" style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${escHtml(a.actorName)}">${escHtml(a.actorName)}</span>
            <div class="i-bar-wrap"><div class="i-bar" style="width:${Math.round((a.count/max)*100)}%;background:#8b5cf6;"></div></div>
            <span class="i-count">${a.count.toLocaleString()}</span>
        </li>`).join('');
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

    const descTitle = log.description ? ` title="${escHtml(log.description)}"` : '';
    const ipInfo = [log.ipAddress, log.browser, log.country].filter(Boolean).join(' · ');

    return `<tr${isCritical ? ' class="critical-row"' : ''}${descTitle}>
        <td><div style="font-weight:600;font-size:13px;">${date}</div><div style="font-size:11px;color:var(--text-muted);">${time}</div></td>
        <td>
            <div style="font-weight:600;font-size:13px;">${escHtml(actor)}</div>
            ${log.actorRole ? `<div style="font-size:11px;color:var(--text-muted);">${escHtml(log.actorRole)}</div>` : ''}
            ${ipInfo ? `<div style="font-size:10px;color:var(--text-muted);margin-top:2px;">${escHtml(ipInfo)}</div>` : ''}
        </td>
        <td>
            <span style="font-weight:700;font-size:12px;color:var(--primary);">${escHtml(log.action || '—')}</span>
            ${log.description ? `<div style="font-size:10px;color:var(--text-muted);margin-top:3px;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${escHtml(log.description)}">${escHtml(log.description)}</div>` : ''}
        </td>
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
        ${drawerRow('Country', escHtml(d.country || '—'))}
        ${drawerRow('Browser', escHtml(d.browser || '—'))}
        ${drawerRow('OS', escHtml(d.operatingSystem || '—'))}
        ${drawerRow('Environment', d.environment ? `<span style="font-size:11px;font-weight:700;padding:2px 8px;border-radius:5px;background:${d.environment==='Production'?'#fef2f2':'#eff6ff'};color:${d.environment==='Production'?'#dc2626':'#3b82f6'};">${escHtml(d.environment)}</span>` : '—')}
        ${drawerRow('Correlation ID', d.correlationId ? `<code style="font-size:11px;">${escHtml(d.correlationId)}</code>` : '—')}
    </div>`;

    if (d.description) {
        html += `<div class="drawer-section">
            <h4>Description</h4>
            <p style="font-size:13px;color:var(--text-muted);line-height:1.6;background:#f8fafc;padding:10px 14px;border-radius:8px;border-left:3px solid #d97706;margin:0;">${escHtml(d.description)}</p>
        </div>`;
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

// ── Archive (SuperAdmin only) ─────────────────
function openArchiveModal() {
    document.getElementById('archive-overlay').classList.add('active');
    const input = document.getElementById('archive-days');
    input.value = 90;
    document.getElementById('archive-days-preview').textContent = 90;
    input.oninput = () => {
        document.getElementById('archive-days-preview').textContent = input.value || '?';
    };
}

function closeArchiveModal() {
    document.getElementById('archive-overlay').classList.remove('active');
}

async function doArchive() {
    const days = parseInt(document.getElementById('archive-days').value);
    if (!days || days < 30) {
        Swal.fire('Invalid', 'Minimum retention period is 30 days.', 'warning');
        return;
    }

    const { isConfirmed } = await Swal.fire({
        title: 'Archive logs?',
        html: `Logs older than <strong>${days} days</strong> will be permanently archived.<br>This cannot be undone.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, Archive',
        confirmButtonColor: '#d97706',
    });
    if (!isConfirmed) return;

    const btn = document.getElementById('archive-confirm-btn');
    btn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Archiving...';
    btn.disabled = true;

    try {
        const res = await archiveAuditLogs(days);
        closeArchiveModal();
        Swal.fire('Done', res?.message || `Logs older than ${days} days have been archived.`, 'success');
        loadMetrics();
        loadLogs(1);
    } catch (err) {
        Swal.fire('Failed', err.message, 'error');
    } finally {
        btn.innerHTML = '<i class="bx bx-archive"></i> Archive Now';
        btn.disabled = false;
    }
}
