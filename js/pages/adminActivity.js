let currentPage = 1;
let totalCount  = 0;
const PAGE_SIZE = 20;
let filterTimer = null;

document.addEventListener('DOMContentLoaded', () => {
    // Support deep-link: ?adminUserId=xxx pre-fills the filter
    const params = new URLSearchParams(window.location.search);
    const preAdminId = params.get('adminUserId');
    if (preAdminId) {
        const el = document.getElementById('f-admin');
        if (el) el.value = preAdminId;
    }
    loadActivity(1);
});

function getFilters() {
    return {
        action:      document.getElementById('f-action')?.value || '',
        from:        document.getElementById('f-from')?.value   || '',
        to:          document.getElementById('f-to')?.value     || '',
        adminUserId: document.getElementById('f-admin')?.value.trim() || '',
    };
}

function applyFilters() {
    currentPage = 1;
    loadActivity(1);
}

function debounceFilter() {
    clearTimeout(filterTimer);
    filterTimer = setTimeout(() => applyFilters(), 400);
}

function clearFilters() {
    ['f-action','f-from','f-to','f-admin'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    applyFilters();
}

// ── Load ──────────────────────────────────────
async function loadActivity(page = 1) {
    currentPage = page;
    const body = document.getElementById('activity-body');
    body.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;">
        <i class="bx bx-loader-alt bx-spin"></i> Loading...
    </td></tr>`;

    const f = getFilters();

    try {
        const res  = await fetchAdminActivity(f.adminUserId, f.action, f.from, f.to, page, PAGE_SIZE);
        const d    = res?.data || res;
        const items = d.items || d.data || (Array.isArray(d) ? d : []);
        totalCount  = d.totalCount || d.total || items.length;

        if (!items.length) {
            body.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:48px;color:var(--text-muted);">
                <i class='bx bx-history' style="font-size:32px;display:block;margin-bottom:8px;"></i>
                No activity found for these filters.
            </td></tr>`;
            updatePagination(0, page);
            return;
        }

        body.innerHTML = items.map(item => buildRow(item)).join('');
        updatePagination(totalCount, page);
    } catch (err) {
        body.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--danger);">
            <i class='bx bx-error-circle' style="font-size:28px;display:block;margin-bottom:8px;"></i>
            ${err.message}
        </td></tr>`;
    }
}

// ── Row builder ───────────────────────────────
function buildRow(item) {
    const ts       = item.timestamp ? new Date(item.timestamp) : null;
    const dateStr  = ts ? ts.toLocaleDateString()  : '—';
    const timeStr  = ts ? ts.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }) : '';

    const actor    = escHtml(item.actorName || '—');
    const target   = escHtml(item.targetUserName || '—');
    const ip       = escHtml(item.ipAddress || '—');
    const desc     = item.description ? escHtml(item.description) : '';

    const actionBadge = buildActionBadge(item.action);
    const roleChange  = buildRoleChange(item.oldRole, item.newRole);

    return `<tr>
        <td>
            <div style="font-weight:600;font-size:13px;">${dateStr}</div>
            <div style="font-size:11px;color:var(--text-muted);">${timeStr}</div>
        </td>
        <td style="font-weight:600;font-size:13px;">${actor}</td>
        <td>${actionBadge}</td>
        <td style="font-weight:600;font-size:13px;">${target}</td>
        <td>${roleChange}</td>
        <td style="font-size:12px;color:var(--text-muted);font-family:monospace;">${ip}</td>
        <td style="font-size:12px;color:var(--text-muted);max-width:220px;">
            ${desc ? `<span title="${desc}" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block;max-width:200px;">${desc}</span>` : '—'}
        </td>
    </tr>`;
}

function buildActionBadge(action) {
    const map = {
        'PromoteAdmin':       { cls: 'promote',    icon: 'bx-user-check', label: 'Promote Admin' },
        'RemoveAdmin':        { cls: 'remove',     icon: 'bx-user-x',     label: 'Remove Admin' },
        'PromoteSuperAdmin':  { cls: 'super',      icon: 'bx-star',       label: 'Promote SuperAdmin' },
        'RemoveSuperAdmin':   { cls: 'remove',     icon: 'bx-star',       label: 'Demote SuperAdmin' },
        'LockAdmin':          { cls: 'lock',       icon: 'bx-lock',       label: 'Lock' },
        'UnlockAdmin':        { cls: 'unlock',     icon: 'bx-lock-open',  label: 'Unlock' },
        'SuspendAdmin':       { cls: 'suspend',    icon: 'bx-pause-circle', label: 'Suspend' },
        'ReactivateAdmin':    { cls: 'reactivate', icon: 'bx-check-circle', label: 'Reactivate' },
        'ResetAdminPassword': { cls: 'reset',      icon: 'bx-key',        label: 'Reset Password' },
    };
    const cfg = map[action] || { cls: 'default', icon: 'bx-info-circle', label: action || '—' };
    return `<span class="action-badge ${cfg.cls}"><i class='bx ${cfg.icon}'></i> ${cfg.label}</span>`;
}

function buildRoleChange(oldRole, newRole) {
    if (!oldRole && !newRole) return '<span style="color:var(--text-muted);">—</span>';
    const from = oldRole ? `<span style="color:#64748b;">${escHtml(oldRole)}</span>` : '<span style="color:#94a3b8;">—</span>';
    const to   = newRole ? `<span class="new-role">${escHtml(newRole)}</span>` : '<span style="color:#94a3b8;">—</span>';
    return `<div class="role-change">${from}<span class="arrow">→</span>${to}</div>`;
}

// ── Pagination ────────────────────────────────
function updatePagination(total, page) {
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
    const to   = Math.min(page * PAGE_SIZE, total);

    const infoEl = document.getElementById('page-info');
    if (infoEl) infoEl.textContent = total > 0 ? `Showing ${from}–${to} of ${total.toLocaleString()}` : 'No results';

    const btnEl = document.getElementById('pagination-buttons');
    if (!btnEl) return;
    if (totalPages <= 1) { btnEl.innerHTML = ''; return; }

    const range = buildPageRange(page, totalPages);
    btnEl.innerHTML = [
        `<button class="page-btn" ${page <= 1 ? 'disabled' : ''} onclick="loadActivity(${page - 1})">‹</button>`,
        ...range.map(p => p === '…'
            ? `<span style="padding:6px 4px;">…</span>`
            : `<button class="page-btn${p === page ? ' active' : ''}" onclick="loadActivity(${p})">${p}</button>`),
        `<button class="page-btn" ${page >= totalPages ? 'disabled' : ''} onclick="loadActivity(${page + 1})">›</button>`,
    ].join('');
}

function buildPageRange(cur, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (cur <= 4)          return [1, 2, 3, 4, 5, '…', total];
    if (cur >= total - 3)  return [1, '…', total-4, total-3, total-2, total-1, total];
    return [1, '…', cur-1, cur, cur+1, '…', total];
}

// ── Utils ─────────────────────────────────────
function escHtml(str) {
    return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
