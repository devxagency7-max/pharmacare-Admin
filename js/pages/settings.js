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

function fmtBytes(b) {
    if (!b && b !== 0) return '—';
    if (b >= 1073741824) return (b / 1073741824).toFixed(2) + ' GB';
    if (b >= 1048576)    return (b / 1048576).toFixed(1) + ' MB';
    if (b >= 1024)       return (b / 1024).toFixed(0) + ' KB';
    return b + ' B';
}

function diskBar(pct) {
    const color = pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#10b981';
    return `<div style="background:var(--border-color,#e2e8f0);border-radius:99px;height:6px;margin-top:8px;overflow:hidden;">
        <div style="width:${Math.min(pct,100)}%;height:100%;background:${color};border-radius:99px;transition:width .4s;"></div>
    </div>`;
}

async function loadStorage() {
    if (storageLoaded) return;
    const body = document.getElementById('storage-body');
    body.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted);"><i class="bx bx-loader-alt bx-spin" style="font-size:28px;"></i><p style="margin-top:12px;">Loading storage info...</p></div>';
    try {
        const [r2Res, diskRes] = await Promise.allSettled([
            fetchStorageSettings(),
            fetchServerDiskUsage()
        ]);

        const r2  = r2Res.status   === 'fulfilled' ? (r2Res.value?.data   || r2Res.value)   : null;
        const disk = diskRes.status === 'fulfilled' ? (diskRes.value?.data || diskRes.value) : null;

        storageLoaded = true;

        const statusColor = (r2?.r2Status || '').toLowerCase() === 'connected' ? 'var(--success)' : 'var(--danger)';
        const allowedExt  = Array.isArray(r2?.allowedExtensions) ? r2.allowedExtensions.join(', ') : (r2?.allowedExtensions || '—');
        const diskPct     = disk?.usagePercent ?? null;

        body.innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;">

            <!-- R2 card -->
            <div style="background:var(--bg-card-2,#f8fafc);border:1px solid var(--border-color,#e2e8f0);border-radius:12px;padding:18px;">
                <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--text-muted);margin-bottom:12px;">
                    <i class='bx bx-cloud' style="vertical-align:middle;margin-right:4px;"></i>Cloudflare R2
                </div>
                <div class="storage-stat-grid" style="grid-template-columns:1fr 1fr;gap:12px;">
                    <div class="storage-stat">
                        <div class="lbl">Status</div>
                        <div class="val" style="color:${statusColor};font-size:15px;">${r2?.r2Status || '—'}</div>
                    </div>
                    <div class="storage-stat">
                        <div class="lbl">R2 Usage (est.)</div>
                        <div class="val">${fmtBytes(r2?.currentUsageBytes)}</div>
                        <div class="sub">lower bound</div>
                    </div>
                    <div class="storage-stat">
                        <div class="lbl">Max File Size</div>
                        <div class="val">${r2?.maxFileSize ? fmtBytes(r2.maxFileSize) : '—'}</div>
                    </div>
                    <div class="storage-stat">
                        <div class="lbl">Provider</div>
                        <div class="val" style="font-size:13px;">${r2?.storageProvider || '—'}</div>
                    </div>
                </div>
                ${r2?.currentUsageNote ? `<div class="info-note" style="margin-top:12px;font-size:11px;"><i class='bx bx-info-circle'></i><span>${r2.currentUsageNote}</span></div>` : ''}
                <div style="margin-top:14px;display:flex;gap:16px;flex-wrap:wrap;">
                    <span style="font-size:12px;color:var(--text-muted);">Bucket: <strong>${r2?.bucket || '—'}</strong></span>
                    <span style="font-size:12px;color:var(--text-muted);">Region: <strong>${r2?.region || '—'}</strong></span>
                    <span style="font-size:12px;color:var(--text-muted);">Types: <strong>${allowedExt}</strong></span>
                </div>
                <div style="margin-top:14px;">
                    <button id="exact-r2-btn" onclick="loadExactR2()" class="btn btn-outline" style="font-size:12px;padding:6px 14px;gap:6px;">
                        <i class='bx bx-refresh'></i> Show Exact Usage
                    </button>
                    <span id="exact-r2-result" style="font-size:13px;margin-left:10px;color:var(--text-muted);"></span>
                </div>
            </div>

            <!-- Server Disk card -->
            <div style="background:var(--bg-card-2,#f8fafc);border:1px solid var(--border-color,#e2e8f0);border-radius:12px;padding:18px;">
                <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--text-muted);margin-bottom:12px;">
                    <i class='bx bx-server' style="vertical-align:middle;margin-right:4px;"></i>Hetzner Server Disk
                </div>
                ${disk ? `
                <div class="storage-stat-grid" style="grid-template-columns:1fr 1fr;gap:12px;">
                    <div class="storage-stat">
                        <div class="lbl">Used</div>
                        <div class="val">${fmtBytes(disk.usedBytes)}</div>
                        <div class="sub">of ${fmtBytes(disk.totalBytes)}</div>
                    </div>
                    <div class="storage-stat">
                        <div class="lbl">Free</div>
                        <div class="val" style="color:var(--success);">${fmtBytes(disk.freeBytes)}</div>
                    </div>
                </div>
                <div style="margin-top:12px;">
                    <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-muted);">
                        <span>Disk usage</span><span style="font-weight:700;color:var(--text-main);">${diskPct}%</span>
                    </div>
                    ${diskBar(diskPct)}
                </div>
                <div style="font-size:11px;color:var(--text-muted);margin-top:10px;">
                    OS + Docker + Postgres + logs &mdash; not just uploaded files.<br>
                    Measured: ${new Date(disk.measuredAt).toLocaleString()}
                </div>` : `<div style="color:var(--text-muted);font-size:13px;padding:20px 0;">Could not load server disk info.</div>`}
            </div>

        </div>`;
    } catch (err) {
        body.innerHTML = `<div style="padding:40px;text-align:center;color:var(--danger);"><i class='bx bx-error-circle' style="font-size:32px;"></i><p style="margin-top:12px;font-weight:600;">Failed to load storage info</p><p style="font-size:13px;color:var(--text-muted);">${err.message}</p><button class="btn btn-outline" style="margin-top:16px;" onclick="storageLoaded=false;loadStorage()">Try Again</button></div>`;
    }
}

async function loadExactR2() {
    const btn = document.getElementById('exact-r2-btn');
    const result = document.getElementById('exact-r2-result');
    if (!btn) return;
    btn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Measuring...';
    btn.disabled = true;
    try {
        const res = await fetchExactR2Usage();
        const d = res?.data || res;
        result.innerHTML = `<strong>${fmtBytes(d.totalBytes)}</strong> exact &mdash; ${d.objectCount} objects (excl. backups)`;
        btn.innerHTML = '<i class="bx bx-check"></i> Done';
        setTimeout(() => {
            btn.innerHTML = '<i class="bx bx-refresh"></i> Show Exact Usage';
            btn.disabled = false;
        }, 4000);
    } catch (err) {
        result.innerHTML = `<span style="color:var(--danger);">Failed: ${err.message}</span>`;
        btn.innerHTML = '<i class="bx bx-refresh"></i> Show Exact Usage';
        btn.disabled = false;
    }
}
