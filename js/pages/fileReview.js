let currentType = 'Pharmacist';
let activeAppId = null;
let activeAppStatus = null;

const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3500 });

document.addEventListener('DOMContentLoaded', () => {
    loadQueue();
});

// ── Type switch ───────────────────────────────
function switchType(type) {
    currentType = type;
    document.querySelectorAll('.type-tab').forEach(t => t.classList.remove('active'));
    document.getElementById(`tab-${type}`).classList.add('active');
    loadQueue();
}

// ── Queue list ────────────────────────────────
async function loadQueue() {
    const body = document.getElementById('review-body');
    body.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;"><i class="bx bx-loader-alt bx-spin"></i> Loading queue...</td></tr>';

    try {
        const fetchFn = currentType === 'Intern' ? fetchPendingInterns : fetchPendingApplications;
        const res = await fetchFn(currentType);
        const items = res?.data || [];

        if (items.length === 0) {
            body.innerHTML = `
            <tr><td colspan="6" style="text-align:center;padding:60px;color:var(--text-muted);">
                <i class='bx bx-check-shield' style="font-size:40px;color:var(--success);display:block;margin-bottom:12px;"></i>
                <strong>Queue is empty</strong><br>
                <span style="font-size:13px;">No pending ${currentType === 'Intern' ? 'intern pharmacist' : 'pharmacist'} applications.</span>
            </td></tr>`;
            return;
        }

        body.innerHTML = items.map(app => buildRow(app)).join('');
    } catch (err) {
        body.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--danger);">
            <i class='bx bx-error-circle' style="font-size:28px;display:block;margin-bottom:8px;"></i>
            ${err.message || 'Failed to load queue.'}
        </td></tr>`;
    }
}

function buildRow(app) {
    const docs = app.documents || [];
    const submitted = app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : '—';
    const statusClass = app.status === 'Approved' ? 'success' : app.status === 'Rejected' ? 'danger' : 'warning';

    return `<tr>
        <td>
            <div style="font-weight:700;font-size:13px;">${escHtml(app.userName || '—')}</div>
            <div style="font-size:11px;color:var(--text-muted);">${escHtml(app.userEmail || '')}</div>
        </td>
        <td><span style="font-size:12px;font-weight:600;">${escHtml(app.applicationType || currentType)}</span></td>
        <td style="font-size:13px;color:var(--text-muted);">${submitted}</td>
        <td style="font-size:13px;">${docs.length} document${docs.length !== 1 ? 's' : ''}</td>
        <td><span class="status-badge ${statusClass}">${app.status || 'Pending'}</span></td>
        <td>
            <button class="action-btn view" onclick="openDrawer('${app.id}')" title="Review">
                <i class='bx bx-folder-open'></i>
            </button>
        </td>
    </tr>`;
}

// ── Application drawer ────────────────────────
async function openDrawer(appId) {
    activeAppId = appId;
    const overlay = document.getElementById('drawer-overlay');
    const drawer = document.getElementById('app-drawer');
    const body = document.getElementById('drawer-body');
    const bar = document.getElementById('approve-bar');

    overlay.classList.add('active');
    drawer.classList.add('active');
    bar.style.display = 'none';
    body.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted);"><i class="bx bx-loader-alt bx-spin" style="font-size:28px;"></i></div>';

    try {
        const res = await fetchApplicationById(appId);
        const app = res?.data || res;
        activeAppStatus = app.status;
        body.innerHTML = renderAppDetail(app);
        if (app.status === 'Pending') bar.style.display = 'flex';
    } catch (err) {
        body.innerHTML = `<div style="padding:24px;color:var(--danger);">${err.message}</div>`;
    }
}

function closeDrawer() {
    activeAppId = null;
    document.getElementById('drawer-overlay').classList.remove('active');
    document.getElementById('app-drawer').classList.remove('active');
    document.getElementById('approve-bar').style.display = 'none';
}

function renderAppDetail(app) {
    const docs = app.documents || [];
    const submitted = app.submittedAt ? new Date(app.submittedAt).toLocaleString() : '—';
    const reviewed = app.reviewedAt ? new Date(app.reviewedAt).toLocaleString() : null;

    const drawerRow = (label, value) =>
        `<div class="drawer-row"><span class="dl">${label}</span><span class="dv">${value || '—'}</span></div>`;

    let html = `
    <div class="drawer-section">
        <h4>Applicant</h4>
        ${drawerRow('Name', escHtml(app.userName || '—'))}
        ${drawerRow('Email', escHtml(app.userEmail || '—'))}
        ${drawerRow('Membership #', escHtml(app.membershipNumber || 'Not yet assigned'))}
        ${app.universityName ? drawerRow('University', escHtml(app.universityName)) : ''}
    </div>
    <div class="drawer-section">
        <h4>Application</h4>
        ${drawerRow('Type', escHtml(app.applicationType || '—'))}
        ${drawerRow('Status', `<span class="status-badge ${app.status === 'Approved' ? 'success' : app.status === 'Rejected' ? 'danger' : 'warning'}">${app.status || '—'}</span>`)}
        ${drawerRow('Submitted', submitted)}
        ${reviewed ? drawerRow('Reviewed', reviewed) : ''}
        ${app.reviewerName ? drawerRow('Reviewed By', escHtml(app.reviewerName)) : ''}
        ${app.rejectionReason ? drawerRow('Rejection Reason', `<span style="color:var(--danger);">${escHtml(app.rejectionReason)}</span>`) : ''}
    </div>`;

    if (docs.length > 0) {
        html += `<div class="drawer-section">
            <h4>Documents (${docs.length})</h4>
            <div class="doc-grid">
                ${docs.map(doc => {
                    const sizeMB = doc.fileSize ? (doc.fileSize / (1024 * 1024)).toFixed(2) + ' MB' : '';
                    const uploadDate = doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : '';
                    return `<div class="doc-card">
                        <div class="doc-card-info">
                            <div class="doc-type">${escHtml(doc.documentType || 'Document')}</div>
                            <div class="doc-meta">${escHtml(doc.originalFileName || '')} ${sizeMB ? '· ' + sizeMB : ''} ${uploadDate ? '· ' + uploadDate : ''}</div>
                            ${doc.notes ? `<div style="font-size:12px;color:var(--danger);margin-top:4px;">${escHtml(doc.notes)}</div>` : ''}
                        </div>
                        <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end;">
                            <span class="doc-status-badge ${doc.status || 'Pending'}">${doc.status || 'Pending'}</span>
                            ${doc.downloadUrl || doc.previewUrl
                                ? `<a href="${doc.downloadUrl || doc.previewUrl}" target="_blank" class="btn btn-outline" style="font-size:11px;padding:4px 10px;">
                                    <i class='bx bx-link-external'></i> View
                                   </a>`
                                : ''}
                        </div>
                    </div>`;
                }).join('')}
            </div>
        </div>`;
    }

    return html;
}

// ── Approve ───────────────────────────────────
async function doApprove() {
    if (!activeAppId) return;

    const confirm = await Swal.fire({
        title: 'Approve Application?',
        text: 'This will activate the applicant\'s account with the appropriate pharmacist role.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, Approve',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#10b981',
    });
    if (!confirm.isConfirmed) return;

    const btn = document.querySelector('#approve-bar .btn-primary');
    btn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Approving...';
    btn.disabled = true;

    try {
        const approveFn = currentType === 'Intern' ? approveIntern : approveApplication;
        const res = await approveFn(activeAppId);
        Toast.fire({ icon: 'success', title: res?.message || 'Application approved successfully.' });
        closeDrawer();
        loadQueue();
    } catch (err) {
        btn.innerHTML = '<i class="bx bx-check-circle"></i> Approve';
        btn.disabled = false;
        if (err.status === 409) {
            Swal.fire('Already Reviewed', 'This application has already been approved or rejected.', 'warning');
        } else if (err.status === 422) {
            Swal.fire('Missing Documents', err.message || 'Required documents are missing. Check the document list.', 'error');
        } else {
            Swal.fire('Approval Failed', err.message || 'Could not approve application.', 'error');
        }
    }
}

// ── Reject ────────────────────────────────────
function openRejectModal() {
    document.getElementById('reject-reason').value = '';
    document.getElementById('reject-modal').classList.add('active');
}

function closeRejectModal() {
    document.getElementById('reject-modal').classList.remove('active');
}

async function doReject() {
    const reason = document.getElementById('reject-reason').value.trim();
    if (reason.length < 3) {
        document.getElementById('reject-reason').focus();
        return;
    }

    const btn = document.getElementById('reject-confirm-btn');
    btn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Rejecting...';
    btn.disabled = true;

    try {
        const rejectFn = currentType === 'Intern' ? rejectIntern : rejectApplication;
        const res = await rejectFn(activeAppId, reason);
        Toast.fire({ icon: 'success', title: res?.message || 'Application rejected.' });
        closeRejectModal();
        closeDrawer();
        loadQueue();
    } catch (err) {
        btn.innerHTML = '<i class="bx bx-x-circle"></i> Reject Application';
        btn.disabled = false;
        if (err.status === 409) {
            Swal.fire('Already Reviewed', 'This application has already been decided.', 'warning');
        } else {
            Swal.fire('Rejection Failed', err.message || 'Could not reject application.', 'error');
        }
    }
}

// Close reject modal on backdrop
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('reject-modal')?.addEventListener('click', e => {
        if (e.target === document.getElementById('reject-modal')) closeRejectModal();
    });
});

function escHtml(str) {
    return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
