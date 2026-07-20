let currentPage = 1;
let currentSearch = '';
let currentRole = '';
let currentStatus = '';
let currentLocked = '';
const PAGE_SIZE = 20;

document.addEventListener('DOMContentLoaded', () => {
    loadStats();
    loadAdmins();
    initSearch();
});

function initSearch() {
    const input = document.getElementById('admin-search');
    if (!input) return;
    let debounce;
    input.addEventListener('input', (e) => {
        clearTimeout(debounce);
        debounce = setTimeout(() => {
            currentSearch = e.target.value.trim();
            loadAdmins(1);
        }, 400);
    });
}

function applyFilters() {
    currentRole   = document.getElementById('filter-role').value;
    currentStatus = document.getElementById('filter-status').value;
    currentLocked = document.getElementById('filter-locked').value;
    loadAdmins(1);
}

// ─── Stats ───────────────────────────────────────────────────────────────────

async function loadStats() {
    try {
        const res = await fetchAdminStats();
        const d = res?.data || res;
        setText('stat-total-admins', d.totalAdmins ?? '—');
        setText('stat-total-super',  d.totalSuperAdmins ?? '—');
        setText('stat-locked',       d.lockedAdmins ?? '—');
        setText('stat-active',       d.activeAdmins ?? '—');
    } catch { /* Stats are nice-to-have, not critical */ }
}

// ─── Table ───────────────────────────────────────────────────────────────────

async function loadAdmins(page = 1) {
    currentPage = page;
    const body = document.getElementById('admins-table-body');
    body.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:40px;"><i class="bx bx-loader-alt bx-spin"></i> Loading...</td></tr>';

    try {
        const res = await fetchAdmins(page, PAGE_SIZE, currentSearch, currentStatus, currentRole, currentLocked);
        const dataRoot = res?.data || res;
        const admins = Array.isArray(dataRoot) ? dataRoot : (dataRoot.items || []);
        const total  = dataRoot.totalCount || dataRoot.total || admins.length;

        if (!admins.length) {
            body.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:40px; color:var(--text-muted);">No admins found.</td></tr>';
            updatePaginationInfo(0, page);
            document.getElementById('pagination-buttons').innerHTML = '';
            return;
        }

        body.innerHTML = admins.map(a => buildRow(a)).join('');
        updatePaginationInfo(total, page);
        renderPaginationButtons(total, page);
    } catch (err) {
        body.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:40px; color:var(--danger);">Failed to load: ${err.message}</td></tr>`;
    }
}

function buildRow(a) {
    const roles   = Array.isArray(a.roles) ? a.roles : [a.role || 'Admin'];
    const isSA    = roles.includes('SuperAdmin');
    const roleBadges = roles
        .filter(r => r === 'Admin' || r === 'SuperAdmin')
        .map(r => `<span class="role-badge ${r === 'SuperAdmin' ? 'superadmin' : 'admin'}">${r === 'SuperAdmin' ? '★ ' : ''}${r}</span>`)
        .join('');

    const statusBadge = getStatusClass(a.status);
    const lockBadge   = a.isLocked ? `<span class="lock-badge"><i class='bx bx-lock'></i> Locked</span>` : '';

    const lastLogin = a.lastLogin ? timeAgo(a.lastLogin) : '—';
    const name = a.fullName || a.name || a.email || '—';
    const email = a.email || '';
    const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

    return `
    <tr>
        <td>
            <div style="display:flex; align-items:center; gap:12px;">
                <div style="width:36px;height:36px;border-radius:50%;background:#eff6ff;color:#3b82f6;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;flex-shrink:0;">${initials}</div>
                <div>
                    <div style="font-weight:600; font-size:14px; color:var(--text-primary);">${name}</div>
                    <div style="font-size:12px; color:var(--text-muted);">${email}</div>
                </div>
            </div>
        </td>
        <td>${roleBadges}</td>
        <td>
            <span class="status-badge ${statusBadge}">${a.status || '—'}</span>
            ${lockBadge}
        </td>
        <td style="font-size:13px; color:var(--text-muted);">${lastLogin}</td>
        <td>
            <div class="table-actions">
                <button class="action-btn" style="background:#eff6ff; color:#3b82f6;" title="View Details" onclick="openDrawer('${a.id}')">
                    <i class='bx bx-show'></i>
                </button>
                ${isSA
                    ? `<button class="action-btn" style="background:#fef3c7; color:#92400e;" title="Remove SuperAdmin" onclick="doRemoveSuperAdmin('${a.email}', '${name}')"><i class='bx bx-star'></i></button>`
                    : `<button class="action-btn" style="background:#f0fdf4; color:#16a34a;" title="Promote to SuperAdmin" onclick="doPromoteSuperAdmin('${a.email}', '${name}')"><i class='bx bx-star'></i></button>`
                }
                ${a.isLocked
                    ? `<button class="action-btn" style="background:#ecfdf5; color:#059669;" title="Unlock" onclick="doUnlock('${a.id}', '${name}')"><i class='bx bx-lock-open'></i></button>`
                    : `<button class="action-btn" style="background:#fef2f2; color:var(--danger);" title="Lock" onclick="doLock('${a.id}', '${name}')"><i class='bx bx-lock'></i></button>`
                }
                ${a.status === 'Suspended'
                    ? `<button class="action-btn" style="background:#ecfdf5; color:#059669;" title="Reactivate" onclick="doReactivate('${a.id}', '${name}')"><i class='bx bx-check-circle'></i></button>`
                    : `<button class="action-btn" style="background:#fffbeb; color:#d97706;" title="Suspend" onclick="doSuspend('${a.id}', '${name}')"><i class='bx bx-pause-circle'></i></button>`
                }
                <button class="action-btn" style="background:#f8f9fa; color:#64748b;" title="Reset Password" onclick="doResetPassword('${a.id}', '${name}')">
                    <i class='bx bx-key'></i>
                </button>
                <button class="action-btn" style="background:#fef2f2; color:var(--danger);" title="Remove Admin Role" onclick="doRemoveAdmin('${a.email}', '${name}')">
                    <i class='bx bx-user-x'></i>
                </button>
            </div>
        </td>
    </tr>`;
}

// ─── Detail Drawer ────────────────────────────────────────────────────────────

async function openDrawer(id) {
    document.getElementById('drawer-overlay').classList.add('active');
    document.getElementById('admin-drawer').classList.add('active');
    document.getElementById('drawer-body').innerHTML = '<div style="text-align:center; padding:40px; color:var(--text-muted);"><i class="bx bx-loader-alt bx-spin" style="font-size:28px;"></i><p style="margin-top:12px;">Loading details...</p></div>';

    try {
        const res = await fetchAdminById(id);
        const a = res?.data || res;
        renderDrawer(a);
    } catch (err) {
        document.getElementById('drawer-body').innerHTML = `<div style="text-align:center;padding:40px;color:var(--danger);"><i class='bx bx-error-circle' style="font-size:32px;"></i><p style="margin-top:12px;">${err.message}</p></div>`;
    }
}

function renderDrawer(a) {
    const roles = Array.isArray(a.roles) ? a.roles : [a.role || 'Admin'];
    const roleBadges = roles
        .filter(r => r === 'Admin' || r === 'SuperAdmin')
        .map(r => `<span class="role-badge ${r === 'SuperAdmin' ? 'superadmin' : 'admin'}">${r === 'SuperAdmin' ? '★ ' : ''}${r}</span>`)
        .join('');

    const perms = Array.isArray(a.permissions) ? a.permissions : [];
    const permHtml = perms.length
        ? `<div class="perm-grid">${perms.map(p => `<span class="perm-chip"><i class='bx bx-check'></i>${p}</span>`).join('')}</div>`
        : '<p style="font-size:13px;color:var(--text-muted);">No permissions data.</p>';

    const activity = Array.isArray(a.recentActivity) ? a.recentActivity : [];
    const activityHtml = activity.length
        ? activity.map(ev => `<div class="activity-item"><strong>${ev.action || ev.actionType || 'Action'}</strong> — ${ev.description || ''} <span style="color:#cbd5e1;">${ev.createdAt ? new Date(ev.createdAt).toLocaleString() : ''}</span></div>`).join('')
        : '<p style="font-size:13px; color:var(--text-muted);">No recent activity.</p>';

    document.getElementById('drawer-body').innerHTML = `
    <div class="drawer-section">
        <div style="display:flex; align-items:center; gap:16px; margin-bottom:20px;">
            <div style="width:60px;height:60px;border-radius:50%;background:#eff6ff;color:#3b82f6;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800;flex-shrink:0;">
                ${(a.fullName || a.name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <div>
                <div style="font-size:18px; font-weight:700; color:var(--text-primary);">${a.fullName || a.name || '—'}</div>
                <div style="font-size:13px; color:var(--text-muted);">${a.email || ''}</div>
                <div style="margin-top:6px;">${roleBadges}</div>
            </div>
        </div>
        <h4>Profile</h4>
        <div class="drawer-row"><span class="dr-label">Status</span><span class="dr-value"><span class="status-badge ${getStatusClass(a.status)}">${a.status || '—'}</span></span></div>
        <div class="drawer-row"><span class="dr-label">Locked</span><span class="dr-value">${a.isLocked ? '<span class="lock-badge"><i class=\'bx bx-lock\'></i> Yes</span>' : 'No'}</span></div>
        <div class="drawer-row"><span class="dr-label">Last Login</span><span class="dr-value">${a.lastLogin ? new Date(a.lastLogin).toLocaleString() : '—'}</span></div>
        <div class="drawer-row"><span class="dr-label">Created At</span><span class="dr-value">${a.createdAt ? new Date(a.createdAt).toLocaleDateString() : '—'}</span></div>
        <div class="drawer-row"><span class="dr-label">Promoted By</span><span class="dr-value">${a.promotedByName || (a.promotedById ? a.promotedById : '— (self-registered)')}</span></div>
    </div>
    <div class="drawer-section">
        <h4>Permissions</h4>
        ${permHtml}
    </div>
    <div class="drawer-section">
        <h4>Recent Activity</h4>
        ${activityHtml}
    </div>`;
}

function closeDrawer() {
    document.getElementById('drawer-overlay').classList.remove('active');
    document.getElementById('admin-drawer').classList.remove('active');
}

// ─── Promote Modal ────────────────────────────────────────────────────────────

function openPromoteModal() {
    document.getElementById('promote-email-input').value = '';
    document.getElementById('promote-modal').classList.add('active');
    setTimeout(() => document.getElementById('promote-email-input').focus(), 200);
}

function closePromoteModal() {
    document.getElementById('promote-modal').classList.remove('active');
}

async function doPromote() {
    const email = document.getElementById('promote-email-input').value.trim();
    if (!email) { Swal.fire('Required', 'Please enter an email address.', 'warning'); return; }

    const btn = document.getElementById('promote-btn');
    btn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Promoting...';
    btn.disabled = true;

    try {
        const res = await promoteToAdmin(email);
        closePromoteModal();
        showToast('success', res.message || `${email} promoted to Admin.`);
        loadAdmins(1); loadStats();
    } catch (err) {
        Swal.fire('Failed', err.message, 'error');
    } finally {
        btn.innerHTML = '<i class="bx bx-user-check"></i> Promote to Admin';
        btn.disabled = false;
    }
}

// ─── Row Actions ──────────────────────────────────────────────────────────────

async function doPromoteSuperAdmin(email, name) {
    const { isConfirmed } = await Swal.fire({
        title: `Promote ${name} to SuperAdmin?`,
        text: 'This grants full SuperAdmin privileges including managing other Admins.',
        icon: 'warning', showCancelButton: true,
        confirmButtonText: 'Yes, Promote', confirmButtonColor: '#f59e0b',
    });
    if (!isConfirmed) return;
    try {
        const res = await promoteToSuperAdmin(email);
        showToast('success', res.message || 'Promoted to SuperAdmin.');
        loadAdmins(currentPage); loadStats();
    } catch (err) { Swal.fire('Failed', err.message, 'error'); }
}

async function doRemoveSuperAdmin(email, name) {
    const { isConfirmed } = await Swal.fire({
        title: `Remove SuperAdmin from ${name}?`,
        text: 'They will remain a regular Admin.',
        icon: 'warning', showCancelButton: true,
        confirmButtonText: 'Demote', confirmButtonColor: '#64748b',
    });
    if (!isConfirmed) return;
    try {
        const res = await removeSuperAdminRole(email);
        showToast('success', res.message || 'SuperAdmin role removed.');
        loadAdmins(currentPage); loadStats();
    } catch (err) { Swal.fire('Failed', err.message, 'error'); }
}

async function doRemoveAdmin(email, name) {
    const { isConfirmed } = await Swal.fire({
        title: `Remove Admin access from ${name}?`,
        text: 'They will keep their other roles (e.g. Patient). This cannot be undone without re-promoting.',
        icon: 'warning', showCancelButton: true,
        confirmButtonText: 'Remove Admin', confirmButtonColor: '#ef4444',
    });
    if (!isConfirmed) return;
    try {
        const res = await removeAdminRole(email);
        showToast('success', res.message || 'Admin role removed.');
        loadAdmins(currentPage); loadStats();
    } catch (err) { Swal.fire('Failed', err.message, 'error'); }
}

async function doLock(id, name) {
    const { isConfirmed } = await Swal.fire({
        title: `Lock ${name}'s account?`,
        text: 'They will be immediately signed out and unable to sign back in until unlocked.',
        icon: 'warning', showCancelButton: true,
        confirmButtonText: 'Lock Account', confirmButtonColor: '#ef4444',
    });
    if (!isConfirmed) return;
    try {
        const res = await lockAdmin(id);
        showToast('success', res.message || 'Account locked.');
        loadAdmins(currentPage); loadStats();
    } catch (err) { Swal.fire('Failed', err.message, 'error'); }
}

async function doUnlock(id, name) {
    const { isConfirmed } = await Swal.fire({
        title: `Unlock ${name}'s account?`,
        icon: 'question', showCancelButton: true,
        confirmButtonText: 'Unlock', confirmButtonColor: '#10b981',
    });
    if (!isConfirmed) return;
    try {
        const res = await unlockAdmin(id);
        showToast('success', res.message || 'Account unlocked.');
        loadAdmins(currentPage); loadStats();
    } catch (err) { Swal.fire('Failed', err.message, 'error'); }
}

async function doSuspend(id, name) {
    const { isConfirmed } = await Swal.fire({
        title: `Suspend ${name}?`,
        text: 'They will lose platform access until reactivated.',
        icon: 'warning', showCancelButton: true,
        confirmButtonText: 'Suspend', confirmButtonColor: '#f59e0b',
    });
    if (!isConfirmed) return;
    try {
        const res = await suspendAdmin(id);
        showToast('success', res.message || 'Admin suspended.');
        loadAdmins(currentPage); loadStats();
    } catch (err) { Swal.fire('Failed', err.message, 'error'); }
}

async function doReactivate(id, name) {
    const { isConfirmed } = await Swal.fire({
        title: `Reactivate ${name}?`,
        icon: 'question', showCancelButton: true,
        confirmButtonText: 'Reactivate', confirmButtonColor: '#10b981',
    });
    if (!isConfirmed) return;
    try {
        const res = await reactivateAdmin(id);
        showToast('success', res.message || 'Admin reactivated.');
        loadAdmins(currentPage); loadStats();
    } catch (err) { Swal.fire('Failed', err.message, 'error'); }
}

async function doResetPassword(id, name) {
    const { isConfirmed } = await Swal.fire({
        title: `Reset password for ${name}?`,
        text: 'A password reset link will be generated. You must send it to them manually — no email is sent automatically.',
        icon: 'question', showCancelButton: true,
        confirmButtonText: 'Generate Link',
    });
    if (!isConfirmed) return;
    try {
        const res = await resetAdminPassword(id);
        const d = res?.data || res;
        const link = d.resetLink || d.link || '';
        await Swal.fire({
            title: 'Reset Link Generated',
            html: `<p style="font-size:13px; color:#64748b; margin-bottom:12px;">Send this link to <strong>${name}</strong>:</p>
                   <div style="background:#f1f5f9; border-radius:8px; padding:12px; font-family:monospace; font-size:12px; word-break:break-all; text-align:left;">${link}</div>`,
            icon: 'success',
            confirmButtonText: 'Copy & Close',
            showCancelButton: true,
            cancelButtonText: 'Close',
        }).then(r => {
            if (r.isConfirmed && link) navigator.clipboard.writeText(link).catch(() => {});
        });
    } catch (err) { Swal.fire('Failed', err.message, 'error'); }
}

// ─── Pagination (reuse patients.js pattern) ───────────────────────────────────

function updatePaginationInfo(total, page) {
    const info = document.getElementById('page-info');
    if (!info) return;
    const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
    const to   = Math.min(page * PAGE_SIZE, total);
    info.textContent = total > 0 ? `Showing ${from} to ${to} of ${total}` : 'No results';
}

function renderPaginationButtons(total, currentPg) {
    const container = document.getElementById('pagination-buttons');
    if (!container) return;
    const totalPages = Math.ceil(total / PAGE_SIZE);
    if (totalPages <= 1) { container.innerHTML = ''; return; }

    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPg - 2 && i <= currentPg + 2)) {
            pages.push(i);
        } else if (pages[pages.length - 1] !== '...') {
            pages.push('...');
        }
    }

    container.innerHTML = `
        <button ${currentPg === 1 ? 'disabled' : ''} onclick="loadAdmins(${currentPg - 1})">‹ Prev</button>
        ${pages.map(p => p === '...'
            ? `<span style="padding:8px 4px;">…</span>`
            : `<button class="${p === currentPg ? 'active' : ''}" onclick="loadAdmins(${p})">${p}</button>`
        ).join('')}
        <button ${currentPg === totalPages ? 'disabled' : ''} onclick="loadAdmins(${currentPg + 1})">Next ›</button>`;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

function getStatusClass(status) {
    if (!status) return 'warning';
    const s = status.toLowerCase();
    if (s === 'active') return 'success';
    if (s === 'suspended' || s === 'banned') return 'danger';
    return 'warning';
}

function showToast(icon, title) {
    Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 })
        .fire({ icon, title });
}

function timeAgo(dateStr) {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
    return d.toLocaleDateString();
}
