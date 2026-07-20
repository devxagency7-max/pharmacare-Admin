// ── Nav switching ──────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.settings-nav-item[data-panel]').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.settings-nav-item').forEach(i => i.classList.remove('active'));
            document.querySelectorAll('.settings-panel').forEach(p => p.classList.remove('active'));
            item.classList.add('active');
            const panel = document.getElementById('panel-' + item.dataset.panel);
            if (panel) panel.classList.add('active');
            if (item.dataset.panel === 'storage') loadStorage();
        });
    });

    loadProfile();
    loadSecurity();
    loadNotifications();
    loadRegional();
});

const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3500, timerProgressBar: true });

function showToast(icon, title) { Toast.fire({ icon, title }); }

// ── Helpers ────────────────────────────────────
function setBtnLoading(id, loading, label = 'Save') {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.disabled = loading;
    btn.innerHTML = loading ? '<i class="bx bx-loader-alt bx-spin"></i> Saving...' : `<i class='bx bx-save'></i> ${label}`;
}

// ── Panel 1: Profile ──────────────────────────
async function loadProfile() {
    try {
        const res = await fetchAdminProfile();
        const d = res?.data || res;
        document.getElementById('p-firstName').value = d.firstName || '';
        document.getElementById('p-lastName').value = d.lastName || '';
        document.getElementById('p-email').textContent = d.email || '—';
        document.getElementById('p-phone').value = d.phoneNumber || '';
        const avatarUrl = d.avatarUrl || '';
        document.getElementById('p-avatarUrl').value = avatarUrl;
        previewAvatar(avatarUrl, d.firstName, d.lastName);

        const roles = d.currentRole || d.roles || [];
        const rolesArr = Array.isArray(roles) ? roles : [roles];
        document.getElementById('p-roles').innerHTML = rolesArr.length
            ? rolesArr.map(r => `<span class="role-badge-pill ${r === 'SuperAdmin' ? 'super' : ''}">${r}</span>`).join('')
            : '—';

        document.getElementById('p-createdDate').textContent = d.createdDate
            ? new Date(d.createdDate).toLocaleDateString() : '—';
    } catch (err) {
        showToast('error', 'Failed to load profile');
    }
}

function previewAvatar(url, firstName, lastName) {
    const img = document.getElementById('profile-avatar');
    if (!img) return;
    if (url) {
        img.src = url;
        img.onerror = () => { img.src = fallbackAvatar(firstName, lastName); };
    } else {
        img.src = fallbackAvatar(firstName, lastName);
    }
}

function fallbackAvatar(first, last) {
    const name = [first, last].filter(Boolean).join('+') || 'Admin';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0057d1&color=fff`;
}

async function saveProfile() {
    setBtnLoading('save-profile-btn', true, 'Save Profile');
    try {
        const payload = {
            firstName: document.getElementById('p-firstName').value.trim() || null,
            lastName: document.getElementById('p-lastName').value.trim() || null,
            phoneNumber: document.getElementById('p-phone').value.trim() || null,
            avatarUrl: document.getElementById('p-avatarUrl').value.trim() || null,
        };
        const res = await updateAdminProfile(payload);
        const d = res?.data || res;
        showToast('success', res?.message || 'Profile updated successfully.');

        // Re-render from response (server may trim)
        document.getElementById('p-firstName').value = d.firstName || payload.firstName || '';
        document.getElementById('p-lastName').value = d.lastName || payload.lastName || '';
        const topName = document.querySelector('.topbar .name');
        if (topName) topName.textContent = `${d.firstName || ''} ${d.lastName || ''}`.trim();
        previewAvatar(d.avatarUrl || payload.avatarUrl, d.firstName, d.lastName);
    } catch (err) {
        Swal.fire('Save Failed', err.message || 'Could not update profile.', 'error');
    } finally {
        setBtnLoading('save-profile-btn', false, 'Save Profile');
    }
}

// ── Panel 2: Security ─────────────────────────
async function loadSecurity() {
    try {
        const res = await fetchSecuritySettings();
        const d = res?.data || res;
        document.getElementById('sec-2fa').checked = !!d.twoFactorEnabled;
        document.getElementById('sec-lastLogin').textContent = d.lastLogin
            ? new Date(d.lastLogin).toLocaleString() : '—';
        document.getElementById('sec-passwordChanged').textContent = d.passwordChangedDate
            ? new Date(d.passwordChangedDate).toLocaleString() : 'Never recorded';
        document.getElementById('sec-sessions').textContent = d.activeSessions ?? '—';
    } catch (err) {
        // Non-fatal
    }
}

async function saveSecurity() {
    try {
        await updateSecuritySettings({ twoFactorEnabled: document.getElementById('sec-2fa').checked });
        showToast('success', 'Security settings updated successfully.');
    } catch (err) {
        document.getElementById('sec-2fa').checked = !document.getElementById('sec-2fa').checked;
        showToast('error', err.message || 'Could not update security settings.');
    }
}

// ── Panel 3: Notifications ────────────────────
async function loadNotifications() {
    try {
        const res = await fetchNotificationSettings();
        const d = res?.data || res;
        document.getElementById('notif-email').checked = !!d.emailNotifications;
        document.getElementById('notif-push').checked = !!d.pushNotifications;
        document.getElementById('notif-broadcast').checked = !!d.broadcastNotifications;
        document.getElementById('notif-application').checked = !!d.applicationNotifications;
        document.getElementById('notif-order').checked = !!d.orderNotifications;
        document.getElementById('notif-system').checked = !!d.systemAlerts;
    } catch (err) {
        // Non-fatal
    }
}

async function saveNotifications() {
    setBtnLoading('save-notif-btn', true, 'Save Preferences');
    try {
        await updateNotificationSettings({
            emailNotifications:       document.getElementById('notif-email').checked,
            pushNotifications:        document.getElementById('notif-push').checked,
            broadcastNotifications:   document.getElementById('notif-broadcast').checked,
            applicationNotifications: document.getElementById('notif-application').checked,
            orderNotifications:       document.getElementById('notif-order').checked,
            systemAlerts:             document.getElementById('notif-system').checked,
        });
        showToast('success', 'Notification preferences updated successfully.');
    } catch (err) {
        Swal.fire('Save Failed', err.message || 'Could not update notification settings.', 'error');
    } finally {
        setBtnLoading('save-notif-btn', false, 'Save Preferences');
    }
}

// ── Panel 4: Regional ─────────────────────────
async function loadRegional() {
    try {
        const res = await fetchRegionalSettings();
        const d = res?.data || res;
        setSelect('reg-language', d.language);
        setSelect('reg-currency', d.currency);
        setSelect('reg-timezone', d.timezone);
        setSelect('reg-dateFormat', d.dateFormat);
        setSelect('reg-timeFormat', d.timeFormat);
    } catch (err) {
        // Non-fatal
    }
}

function setSelect(id, val) {
    const el = document.getElementById(id);
    if (el && val) el.value = val;
}

async function saveRegional() {
    setBtnLoading('save-regional-btn', true, 'Save Regional');
    try {
        await updateRegionalSettings({
            language:   document.getElementById('reg-language').value,
            currency:   document.getElementById('reg-currency').value,
            timezone:   document.getElementById('reg-timezone').value,
            dateFormat: document.getElementById('reg-dateFormat').value,
            timeFormat: document.getElementById('reg-timeFormat').value,
        });
        showToast('success', 'Regional settings updated successfully.');
    } catch (err) {
        if (err.status === 400) {
            Swal.fire('Validation Error', err.message, 'warning');
        } else {
            Swal.fire('Save Failed', err.message || 'Could not update regional settings.', 'error');
        }
    } finally {
        setBtnLoading('save-regional-btn', false, 'Save Regional');
    }
}

// ── Panel 5: Storage (SuperAdmin) ─────────────
let storageLoaded = false;

async function loadStorage() {
    if (storageLoaded) return;
    const body = document.getElementById('storage-body');
    body.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted);"><i class="bx bx-loader-alt bx-spin" style="font-size:28px;"></i><p style="margin-top:12px;">Loading storage info...</p></div>';
    try {
        const res = await fetchStorageSettings();
        const d = res?.data || res;
        storageLoaded = true;

        const usageMB = d.currentUsageBytes ? (d.currentUsageBytes / (1024 * 1024)).toFixed(1) : '—';
        const statusClass = (d.r2Status || '').toLowerCase() === 'connected' ? 'success' : 'danger';
        const statusColor = statusClass === 'success' ? 'var(--success)' : 'var(--danger)';
        const allowedExt = Array.isArray(d.allowedExtensions) ? d.allowedExtensions.join(', ') : (d.allowedExtensions || '—');

        body.innerHTML = `
        <div class="storage-stat-grid">
            <div class="storage-stat">
                <div class="lbl">Status</div>
                <div class="val" style="color:${statusColor}; font-size:16px; font-weight:700;">${d.r2Status || '—'}</div>
            </div>
            <div class="storage-stat">
                <div class="lbl">Current Usage</div>
                <div class="val">${usageMB !== '—' ? usageMB + ' MB' : '—'}</div>
                <div class="sub">Lower bound — some legacy files excluded</div>
            </div>
            <div class="storage-stat">
                <div class="lbl">Max File Size</div>
                <div class="val">${d.maxFileSize ? (d.maxFileSize / (1024 * 1024)).toFixed(0) + ' MB' : '—'}</div>
            </div>
            <div class="storage-stat">
                <div class="lbl">Storage Provider</div>
                <div class="val" style="font-size:14px;">${d.storageProvider || '—'}</div>
            </div>
        </div>
        ${d.currentUsageNote ? `<div class="info-note"><i class='bx bx-info-circle'></i><span>${d.currentUsageNote}</span></div>` : ''}
        <div style="display:flex; flex-wrap:wrap; gap:24px; margin-top:8px;">
            <div><span style="font-size:12px; font-weight:700; color:var(--text-muted); text-transform:uppercase; letter-spacing:.5px;">Bucket</span><br><span style="font-size:14px; font-weight:600;">${d.bucket || '—'}</span></div>
            <div><span style="font-size:12px; font-weight:700; color:var(--text-muted); text-transform:uppercase; letter-spacing:.5px;">Region</span><br><span style="font-size:14px; font-weight:600;">${d.region || '—'}</span></div>
            <div><span style="font-size:12px; font-weight:700; color:var(--text-muted); text-transform:uppercase; letter-spacing:.5px;">Allowed Types</span><br><span style="font-size:14px; font-weight:600;">${allowedExt}</span></div>
        </div>`;
    } catch (err) {
        body.innerHTML = `<div style="padding:40px;text-align:center;color:var(--danger);"><i class='bx bx-error-circle' style="font-size:32px;"></i><p style="margin-top:12px;font-weight:600;">Failed to load storage info</p><p style="font-size:13px;color:var(--text-muted);">${err.message}</p><button class="btn btn-outline" style="margin-top:16px;" onclick="storageLoaded=false;loadStorage()">Try Again</button></div>`;
    }
}
