let currentPage = 1;
let currentSearch = '';
let currentStatus = '';
let currentTab = 'all'; // 'all' or 'requests'
const PAGE_SIZE = 20;
let currentPharmacistsData = [];

document.addEventListener('DOMContentLoaded', () => {
    loadPharmacists();
    initSearchAndFilters();
    updateRequestsBadge();
    updateRejectedBadge();
});

function switchTab(tab) {
    currentTab = tab;
    const tabs = ['all', 'requests', 'rejected'];
    tabs.forEach(t => {
        const el = document.getElementById(`tab-${t}`);
        if (!el) return;
        const isActive = t === tab;
        el.style.fontWeight = isActive ? '600' : '500';
        el.style.color = isActive ? '#0f172a' : '#64748b';
        el.style.borderBottomColor = isActive ? '#0057d1' : 'transparent';
    });
    loadPharmacists(1);
}

function initSearchAndFilters() {
    const searchInput = document.querySelector('.action-bar .search-box input');
    if (searchInput) {
        let debounceTimer;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                currentSearch = e.target.value.trim();
                loadPharmacists(1);
            }, 500);
        });
    }
}

async function loadPharmacists(page = 1) {
    currentPage = page;
    const tableBody = document.getElementById('pharmacists-table-body');
    const paginationContainer = document.getElementById('pagination-container');
    const paginationButtons = document.getElementById('pagination-buttons');

    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 40px;"><i class="bx bx-loader-alt bx-spin"></i> Loading pharmacists...</td></tr>';
    if (paginationContainer) paginationContainer.style.opacity = '0.5';

    try {
        console.log(`[Pharmacists] Loading ${currentTab} (Page ${page})`);

        let response;
        if (currentTab === 'requests') {
            response = await fetchPharmacistApplications(page, PAGE_SIZE);
        } else if (currentTab === 'rejected') {
            response = await fetchRejectedPharmacistApplications(page, PAGE_SIZE);
        } else {
            response = await fetchPharmacists(page, PAGE_SIZE, currentSearch, '');
        }

        const dataRoot = response?.data || response;
        const pharmacists = Array.isArray(dataRoot) ? dataRoot : (dataRoot.items || dataRoot.users || dataRoot.content || []);
        const total = dataRoot.totalCount || dataRoot.total || dataRoot.recordsTotal || pharmacists.length;

        if (!pharmacists || pharmacists.length === 0) {
            const emptyLabel = currentTab === 'requests' ? 'pending applications' : currentTab === 'rejected' ? 'rejected applications' : 'pharmacists';
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 40px; color:var(--text-muted);">No ${emptyLabel} found.</td></tr>`;
            updatePaginationInfo(0, page);
            if (paginationButtons) paginationButtons.innerHTML = '';
            return;
        }

        currentPharmacistsData = pharmacists;

        tableBody.innerHTML = pharmacists.map(p => {
            // SAFE NAME LOGIC: If name is email, split it.
            // Robust name discovery
            let displayName = p.fullName || p.name || p.displayName || p.userName || '';
            const email = p.email || p.userEmail || '';

            if (!displayName && email) {
                displayName = email.split('@')[0];
            }
            if (!displayName) displayName = 'Unknown Pharmacist';

            const status = (p.isActive === false || (p.status && p.status.toLowerCase() === 'suspended'))
                ? 'Suspended' : (p.status || (currentTab === 'requests' ? 'Pending' : 'Active'));

            // Format roles as "Type"
            const roles = Array.isArray(p.roles) ? p.roles : [];
            const typeText = roles.length > 0 ? roles.join(' / ') : (p.specialization || 'Pharmacist');

            const showApproval = currentTab === 'requests' || status.toLowerCase() === 'pending';
            const initials = displayName.substring(0, 2).toUpperCase();

            return `
                <tr data-id="${p.userId || p.id}">
                    <td>
                        <div class="user-info" style="display: flex; align-items: center; gap: 12px;">
                            <div class="avatar-letter" style="width: 40px; height: 40px; border-radius: 50%; background: #EAF2FE; color: #0057d1; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 14px; border: 1px solid rgba(0,87,209,0.1);">
                                ${initials}
                            </div>
                            <div class="info">
                                <span class="name" style="font-weight: 600; display: block; color: #0f172a;">${displayName}</span>
                                <span class="email" style="font-size:12px; opacity:0.7; display: block; color: #64748b;">${email}</span>
                                <span class="id-badge" style="font-size:10px; opacity:0.5; display: block; margin-top: 2px;">ID: ${p.id}</span>
                            </div>
                        </div>
                    </td>
                    <td style="color: #64748b; font-weight: 500;">${typeText}</td>
                    <td><code style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px; color: #475569;">${p.membershipNumber || p.licenseNumber || 'N/A'}</code></td>
                    <td style="font-size: 13px; color: #64748b;">${p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'N/A'}</td>
                    <td><span class="status-badge ${getStatusClass(status)}">${status}</span></td>
                    <td>
                        <div class="table-actions">
                            <button class="action-btn" style="background: #EAF2FE; color: #0057d1;" onclick="viewPharmacistDetails('${p.id}')" title="View Profile"><i class='bx bx-show'></i></button>
                            ${showApproval ? `
                                <button class="action-btn" style="background:#ccfbf1;color:#0d9488;" onclick="handleApproval('${p.id}')" title="Approve"><i class='bx bx-check-shield'></i></button>
                                <button class="action-btn" style="background:#fee2e2;color:#e11d48;" onclick="handleRejection('${p.id}')" title="Reject"><i class='bx bx-x-circle'></i></button>
                            ` : (status.toLowerCase() === 'suspended' ? `
                                <button class="action-btn" style="background: #ccfbf1; color: #0d9488;" onclick="activatePharmacistAction('${p.id}')" title="Activate"><i class='bx bx-play-circle'></i></button>
                            ` : `
                                <button class="action-btn" style="background: #ffedd5; color: #f97316;" onclick="suspendPharmacistAction('${p.id}')" title="Suspend"><i class='bx bx-pause-circle'></i></button>
                            `)}
                            <button class="action-btn" style="background:#fee2e2;color:#e11d48;" onclick="banUserAction('${p.id}')" title="Ban User"><i class='bx bx-block'></i></button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        updatePaginationInfo(total, page);
        renderPaginationButtons(total, page);
        if (paginationContainer) paginationContainer.style.opacity = '1';

    } catch (error) {
        console.error('[Pharmacists] Load Error:', error);
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 40px; color: var(--danger);">Error: ${error.message}</td></tr>`;
    }
}

function updatePaginationInfo(total, page) {
    const pageInfo = document.querySelector('.page-info');
    if (pageInfo) {
        const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
        const to = Math.min(page * PAGE_SIZE, total);
        pageInfo.textContent = `Showing ${from} to ${to} of ${total.toLocaleString()} entries`;
    }
}

function renderPaginationButtons(total, currentPage) {
    const container = document.getElementById('pagination-buttons');
    if (!container) return;

    const totalPages = Math.ceil(total / PAGE_SIZE);
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = `<button class="page-btn ${currentPage === 1 ? 'disabled' : ''}" onclick="${currentPage === 1 ? '' : 'loadPharmacists(' + (currentPage - 1) + ')'}"><i class='bx bx-chevron-left'></i></button>`;
    const range = 2;
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - range && i <= currentPage + range)) {
            html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="loadPharmacists(${i})">${i}</button>`;
        } else if (i === currentPage - range - 1 || i === currentPage + range + 1) {
            html += `<span>...</span>`;
        }
    }
    html += `<button class="page-btn ${currentPage === totalPages ? 'disabled' : ''}" onclick="${currentPage === totalPages ? '' : 'loadPharmacists(' + (currentPage + 1) + ')'}"><i class='bx bx-chevron-right'></i></button>`;

    container.innerHTML = html;
}

function getStatusClass(status) {
    status = status ? status.toLowerCase() : 'pending';
    if (status === 'approved' || status === 'active' || status === 'verified') return 'success';
    if (status === 'rejected' || status === 'suspended' || status === 'banned') return 'danger';
    return 'warning';
}

async function handleApproval(id) {
    if (confirm('Approve this pharmacist application?')) {
        try {
            await approvePharmacist(id);
            alert('Pharmacist approved successfully');
            updateRequestsBadge();
            loadPharmacists(currentPage);
        } catch (err) {
            alert('Approval failed: ' + err.message);
        }
    }
}

async function handleRejection(id) {
    const reason = prompt('Please enter a reason for rejection:');
    if (reason !== null) {
        try {
            await rejectPharmacist(id, reason || 'Did not meet criteria.');
            alert('Pharmacist application rejected successfully');
            updateRequestsBadge();
            loadPharmacists(currentPage);
        } catch (err) {
            alert('Rejection failed: ' + err.message);
        }
    }
}

async function banUserAction(id) {
    if (confirm('Are you sure you want to BAN this user? they will lose access to the platform.')) {
        try {
            await apiClient.banUser(id);
            alert('User has been banned successfully.');
            loadPharmacists(currentPage);
        } catch (err) {
            alert('Ban failed: ' + err.message);
        }
    }
}


async function viewPharmacistDetails(id) {
    const modal = document.getElementById('view-pharmacist-modal');
    const content = document.getElementById('pharmacist-details-content');
    if (!modal || !content) return;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    content.innerHTML = `<div style="text-align:center;padding:40px;"><i class="bx bx-loader-alt bx-spin" style="font-size:40px;color:var(--primary);"></i><p>Loading...</p></div>`;

    const isAppTab = currentTab === 'requests' || currentTab === 'rejected';

    try {
        if (isAppTab) {
            await viewApplicationDetails(id, content);
        } else {
            await viewPharmacistProfile(id, content);
        }
    } catch (err) {
        content.innerHTML = `<div style="padding:40px;text-align:center;color:var(--danger);"><i class="bx bx-error-circle" style="font-size:40px;"></i><p style="font-weight:bold;margin-top:10px;">Failed to load details.</p><p style="font-size:13px;opacity:0.8;">${err.message}</p></div>`;
    }
}

async function viewApplicationDetails(id, content) {
    const res = await fetchPharmacistApplicationById(id);
    const app = res?.data || res;
    if (!app) throw new Error('Application not found.');

    const name = app.userName || app.fullName || app.userEmail || 'Applicant';
    const initials = name.substring(0, 2).toUpperCase();
    const status = app.status || 'Pending';
    const statusClass = status.toLowerCase() === 'pending' ? 'warning' : status.toLowerCase() === 'approved' ? 'success' : 'danger';
    const docs = Array.isArray(app.documents) ? app.documents : [];

    const docsHtml = docs.length === 0
        ? `<div style="padding:20px;text-align:center;color:#94a3b8;font-size:13px;"><i class='bx bx-folder-open' style="font-size:32px;"></i><p>No documents uploaded.</p></div>`
        : docs.map(doc => {
            const url = doc.url || doc.fileUrl || doc.downloadUrl || '';
            const name = doc.documentType || doc.type || doc.name || 'Document';
            const isImage = url && /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
            return `
            <div style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;background:#fff;">
                ${isImage
                    ? `<a href="${url}" target="_blank"><img src="${url}" alt="${name}" style="width:100%;height:160px;object-fit:cover;display:block;" onerror="this.style.display='none'"></a>`
                    : `<div style="height:100px;background:#f8fafc;display:flex;align-items:center;justify-content:center;"><i class='bx bx-file' style="font-size:40px;color:#94a3b8;"></i></div>`
                }
                <div style="padding:10px 12px;">
                    <div style="font-size:12px;font-weight:600;color:#0f172a;">${name}</div>
                    ${url ? `<a href="${url}" target="_blank" style="font-size:11px;color:#0057d1;text-decoration:none;"><i class='bx bx-link-external'></i> View / Download</a>` : ''}
                </div>
            </div>`;
        }).join('');

    const isPending = status.toLowerCase() === 'pending';

    content.innerHTML = `
        <div style="display:flex;align-items:center;gap:20px;margin-bottom:24px;padding:18px 20px;background:linear-gradient(to right,#f8fafc,#fff);border-radius:14px;border:1px solid #e2e8f0;">
            <div style="width:72px;height:72px;border-radius:14px;background:#eff6ff;color:#3b82f6;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:28px;flex-shrink:0;">${initials}</div>
            <div style="flex:1;">
                <div style="font-size:18px;font-weight:700;color:#0f172a;">${name}</div>
                <div style="font-size:13px;color:#64748b;margin-top:4px;">${app.userEmail || ''}</div>
            </div>
            <span class="status-badge ${statusClass}" style="padding:5px 14px;font-size:12px;">${status}</span>
        </div>

        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-bottom:24px;">
            ${[
                ['Application ID', app.id],
                ['Type', app.applicationType || 'Pharmacist'],
                ['Membership No.', app.membershipNumber || 'N/A'],
                ['University', app.universityName || 'N/A'],
                ['Submitted', app.submittedAt ? new Date(app.submittedAt).toLocaleString() : 'N/A'],
                ['Reviewed By', app.reviewerName || '—'],
            ].map(([label, val]) => `
                <div style="padding:12px 14px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;">
                    <div style="font-size:10px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">${label}</div>
                    <div style="font-size:13px;font-weight:600;color:#0f172a;">${val || '—'}</div>
                </div>`).join('')}
        </div>

        ${app.rejectionReason ? `
        <div style="padding:14px 16px;background:#fef2f2;border-radius:10px;border:1px solid #fecaca;margin-bottom:24px;">
            <div style="font-size:11px;color:#ef4444;font-weight:700;text-transform:uppercase;margin-bottom:4px;">Rejection Reason</div>
            <div style="font-size:13px;color:#7f1d1d;">${app.rejectionReason}</div>
        </div>` : ''}

        <div style="margin-bottom:24px;">
            <div style="font-size:13px;font-weight:700;color:#0f172a;margin-bottom:12px;display:flex;align-items:center;gap:6px;"><i class='bx bx-folder'></i> Uploaded Documents (${docs.length})</div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;">
                ${docsHtml}
            </div>
        </div>

        ${isPending ? `
        <div style="display:flex;gap:12px;padding-top:16px;border-top:1px solid #e2e8f0;">
            <button onclick="handleApproval('${app.id}')" style="flex:1;padding:12px;background:#0057d1;color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;"><i class='bx bx-check-shield'></i> Approve</button>
            <button onclick="handleRejection('${app.id}')" style="flex:1;padding:12px;background:#fef2f2;color:#e11d48;border:1px solid #fecaca;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;"><i class='bx bx-x-circle'></i> Reject</button>
        </div>` : ''}
    `;
}

async function viewPharmacistProfile(id, content) {
    let p;
    try {
        const response = await fetchPharmacistById(id);
        p = response?.data || response;
    } catch {
        p = currentPharmacistsData.find(x => String(x.id) === String(id) || String(x.userId) === String(id));
    }
    if (!p) throw new Error('Pharmacist not found.');

    // Merge cached row data (has name/email) with API response
    const cached = currentPharmacistsData.find(x => String(x.id) === String(id) || String(x.userId) === String(id));
    if (cached) p = { ...cached, ...p };

    // Fetch application by userId/email to get uploaded documents
    if (!p.documents || p.documents.length === 0) {
        try {
            const userEmail = p.email || p.userEmail || '';
            const appData = await fetchPharmacistApplicationByUserId(p.id || p.userId, userEmail);
            if (appData && Array.isArray(appData.documents) && appData.documents.length > 0) {
                p.documents = appData.documents;
            }
        } catch { /* silent */ }
    }

    const pIndex = currentPharmacistsData.findIndex(x => String(x.id) === String(id));
    if (pIndex > -1) currentPharmacistsData[pIndex] = { ...currentPharmacistsData[pIndex], ...p };

    let displayName = p.userName || p.fullName || p.name || p.displayName || '';
    if (!displayName && p.email) displayName = p.email.split('@')[0];
    if (!displayName) displayName = 'Unnamed Pharmacist';

    const initials = displayName.substring(0, 2).toUpperCase();
    const status = (p.isActive === false || (p.status && p.status.toLowerCase() === 'suspended')) ? 'Suspended' : (p.status || 'Active');
    const maxLimit = p.maxPatients ?? p.maxPatientsLimit ?? p.limit ?? null;

    content.innerHTML = `
        <div style="display:flex;align-items:center;gap:24px;margin-bottom:30px;padding:20px;background:linear-gradient(to right,#F8FAFD,#FFFFFF);border-radius:16px;border:1px solid #E2E8F0;">
            <div style="width:90px;height:90px;border-radius:16px;background:#EAF2FE;color:#0057d1;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:32px;">${initials}</div>
            <div>
                <h3 style="margin:0;font-size:22px;color:var(--primary);font-weight:700;">${displayName}</h3>
                <div style="font-size:13px;color:var(--text-muted);margin-top:4px;">${p.email || p.userEmail || ''}</div>
            </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-bottom:24px;">
            ${[
                ['Status', `<span class="status-badge ${getStatusClass(status)}">${status}</span>`],
                ['License No.', p.membershipNumber || p.licenseNumber || 'N/A'],
                ['Phone', p.phone || p.phoneNumber || 'N/A'],
                ['Max Patients', maxLimit !== null ? maxLimit : 'Not Set'],
                ['Member Since', p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'N/A'],
                ['Specialization', p.specialization || 'Pharmacist'],
            ].map(([label, val]) => `
                <div style="padding:12px 14px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;">
                    <div style="font-size:10px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">${label}</div>
                    <div style="font-size:13px;font-weight:600;color:#0f172a;">${val}</div>
                </div>`).join('')}
        </div>

        <div style="margin-bottom:20px;">
            <div style="font-size:13px;font-weight:700;color:#0f172a;margin-bottom:12px;display:flex;align-items:center;gap:6px;"><i class='bx bx-folder'></i> Uploaded Documents (${(p.documents || []).length})</div>
            ${!p.documents || p.documents.length === 0 ? `
            <div style="padding:20px;text-align:center;background:#f8fafc;border-radius:10px;border:1px dashed #e2e8f0;color:#94a3b8;font-size:13px;">
                <i class='bx bx-folder-open' style="font-size:28px;display:block;margin-bottom:6px;"></i>
                No documents uploaded (0)
            </div>` : `
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;">
                ${p.documents.map(doc => {
                    const url = doc.url || doc.fileUrl || doc.downloadUrl || '';
                    const docName = doc.documentType || doc.type || doc.name || 'Document';
                    const isImage = url && (/\.(jpg|jpeg|png|gif|webp)$/i.test(url) || url.includes('r2.') || url.includes('cloudflare') || url.includes('/uploads/'));
                    return `
                    <div style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;background:#fff;">
                        ${isImage && url
                            ? `<a href="${url}" target="_blank"><img src="${url}" alt="${docName}" style="width:100%;height:140px;object-fit:cover;display:block;" onerror="this.parentElement.innerHTML='<div style=\\'height:90px;background:#f8fafc;display:flex;align-items:center;justify-content:center;\\'><i class=\\'bx bx-file\\' style=\\'font-size:36px;color:#94a3b8;\\'></i></div>'"></a>`
                            : `<div style="height:90px;background:#f8fafc;display:flex;align-items:center;justify-content:center;"><i class='bx bx-file' style="font-size:36px;color:#94a3b8;"></i></div>`
                        }
                        <div style="padding:8px 12px;">
                            <div style="font-size:12px;font-weight:600;color:#0f172a;">${docName}</div>
                            ${url ? `<a href="${url}" target="_blank" style="font-size:11px;color:#0057d1;text-decoration:none;"><i class='bx bx-link-external'></i> View / Download</a>` : ''}
                        </div>
                    </div>`;
                }).join('')}
            </div>`}
        </div>

        <div style="padding:18px 20px;background:#F0FDFA;border-radius:12px;border:1px solid #CCFBF1;display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
            <div>
                <div style="font-size:14px;font-weight:600;color:#0f172a;">Update Patient Limit</div>
                <div style="font-size:12px;color:#0d9488;margin-top:2px;">Current limit: ${maxLimit !== null ? maxLimit : 'Not Set'}</div>
            </div>
            <button class="btn btn-primary" onclick="promptMaxPatients('${p.id}')" style="font-size:13px;padding:10px 20px;">
                <i class='bx bx-edit-alt'></i> Update Limit
            </button>
        </div>

        <div style="display:flex;gap:12px;padding-top:16px;border-top:1px solid #e2e8f0;">
            ${status.toLowerCase() === 'suspended' ? `
            <button onclick="activatePharmacistAction('${p.id}')" style="flex:1;padding:12px;background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;">
                <i class='bx bx-play-circle'></i> Activate
            </button>` : `
            <button onclick="suspendPharmacistAction('${p.id}')" style="flex:1;padding:12px;background:#fff7ed;color:#ea580c;border:1px solid #fed7aa;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;">
                <i class='bx bx-pause-circle'></i> Suspend
            </button>`}
            <button onclick="banUserAction('${p.id}')" style="flex:1;padding:12px;background:#fef2f2;color:#e11d48;border:1px solid #fecaca;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;">
                <i class='bx bx-block'></i> Ban User
            </button>
        </div>
    `;
}

function closeViewModal() {
    const modal = document.getElementById('view-pharmacist-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

async function promptMaxPatients(id) {
    const p = currentPharmacistsData.find(x => String(x.id) === String(id));
    const currentLimit = p ? (p.maxPatients || p.maxPatientsLimit || 0) : 0;

    const { value: limit } = await Swal.fire({
        title: 'Update Max Patients Limit',
        input: 'number',
        inputLabel: 'Set the maximum number of patients this pharmacist can manage.',
        inputValue: currentLimit,
        showCancelButton: true,
        confirmButtonText: 'Update Limit',
        confirmButtonColor: '#0057d1',
        inputValidator: (value) => {
            if (!value || isNaN(value) || value < 0) {
                return 'Please enter a valid number (0 or more)';
            }
        }
    });

    if (limit) {
        try {
            Swal.fire({
                title: 'Updating...',
                didOpen: () => Swal.showLoading(),
                allowOutsideClick: false
            });

            await updateMaxPatientsLimit(id, parseInt(limit));
            
            // Update local cache
            const pIndex = currentPharmacistsData.findIndex(x => String(x.id) === String(id) || String(x.userId) === String(id));
            if (pIndex > -1) {
                currentPharmacistsData[pIndex].maxPatients = parseInt(limit);
                currentPharmacistsData[pIndex].maxPatientsLimit = parseInt(limit);
            }
            
            await Swal.fire({
                icon: 'success',
                title: 'Limit Updated',
                text: `Max patients limit has been set to ${limit}`,
                timer: 2000,
                showConfirmButton: false
            });

            viewPharmacistDetails(id); // Refresh modal content
            loadPharmacists(currentPage); // Refresh table background
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Update Failed',
                text: err.message || 'Could not update the limit.'
            });
        }
    }
}

async function suspendPharmacistAction(id) {
    if (confirm('Suspend this pharmacist? They will be unable to handle prescriptions.')) {
        try {
            await suspendPharmacistApi(id);
            alert('Pharmacist suspended successfully.');
            loadPharmacists(currentPage);
        } catch (err) { alert('Failed: ' + err.message); }
    }
}

async function activatePharmacistAction(id) {
    if (confirm('Reactivate this pharmacist?')) {
        try {
            await activatePharmacistApi(id);
            alert('Pharmacist reactivated successfully.');
            loadPharmacists(currentPage);
        } catch (err) { alert('Failed: ' + err.message); }
    }
}

async function banUserAction(id) {
    if (confirm('Are you sure you want to BAN this user? they will lose access to the platform.')) {
        try {
            await apiClient.banUser(id);
            alert('User has been banned successfully.');
            loadPharmacists(currentPage);
        } catch (err) {
            alert('Ban failed: ' + err.message);
        }
    }
}

async function updateRequestsBadge() {
    const badge = document.getElementById('requests-badge');
    if (!badge) return;

    try {
        const response = await fetchPharmacistApplications(1, 1);
        const dataRoot = response?.data || response;
        const total = dataRoot.totalCount || dataRoot.total || dataRoot.recordsTotal || 0;

        if (total > 0) {
            badge.textContent = total;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    } catch (error) {
        console.error('[Pharmacists] Failed to update badge:', error);
    }
}

async function updateRejectedBadge() {
    const badge = document.getElementById('rejected-badge');
    if (!badge) return;

    try {
        const response = await fetchRejectedPharmacistApplications(1, 1);
        const dataRoot = response?.data || response;
        const total = dataRoot.totalCount || dataRoot.total || dataRoot.recordsTotal || 0;

        if (total > 0) {
            badge.textContent = total;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    } catch {
        // silent
    }
}

