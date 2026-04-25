let currentPage = 1;
let currentSearch = '';
let currentStatus = '';
let currentTab = 'all'; // 'all' or 'requests'
const PAGE_SIZE = 20;
let currentInternPharmacistsData = [];

document.addEventListener('DOMContentLoaded', () => {
    loadInternPharmacists();
    initSearchAndFilters();
    updateRequestsBadge();
});

function switchTab(tab) {
    currentTab = tab;
    const tabAll = document.getElementById('tab-all');
    const tabReq = document.getElementById('tab-requests');

    if (tabAll) {
        tabAll.style.fontWeight = tab === 'all' ? '600' : '500';
        tabAll.style.color = tab === 'all' ? '#0f172a' : '#64748b';
        tabAll.style.borderBottomColor = tab === 'all' ? '#0057d1' : 'transparent';
    }

    if (tabReq) {
        tabReq.style.fontWeight = tab === 'requests' ? '600' : '500';
        tabReq.style.color = tab === 'requests' ? '#0f172a' : '#64748b';
        tabReq.style.borderBottomColor = tab === 'requests' ? '#0057d1' : 'transparent';
    }

    loadInternPharmacists(1);
}

function initSearchAndFilters() {
    const searchInput = document.querySelector('.action-bar .search-box input');
    if (searchInput) {
        let debounceTimer;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                currentSearch = e.target.value.trim();
                loadInternPharmacists(1);
            }, 500);
        });
    }
}

async function loadInternPharmacists(page = 1) {
    currentPage = page;
    const tableBody = document.getElementById('interns-table-body');
    const paginationContainer = document.getElementById('pagination-container');
    const paginationButtons = document.getElementById('pagination-buttons');

    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 40px;"><i class="bx bx-loader-alt bx-spin"></i> Loading interns...</td></tr>';
    if (paginationContainer) paginationContainer.style.opacity = '0.5';

    try {
        let response;
        if (currentTab === 'requests') {
            // Fetch both and merge to ensure we see everything without duplicates
            const [internRes, appRes] = await Promise.all([
                fetchInternPharmacists(1, 100, currentSearch, 'Pending'),
                fetchInternPharmacistApplications(1, 100)
            ]);

            const list1 = Array.isArray(internRes?.data || internRes) ? (internRes?.data || internRes) : (internRes?.data?.items || []);
            const list2 = Array.isArray(appRes?.data || appRes) ? (appRes?.data || appRes) : (appRes?.data?.items || []);

            const merged = [];
            const seen = new Set();

            [...list1, ...list2].forEach(item => {
                const key = (item.userEmail || item.email || item.userId || item.id || '').toLowerCase();
                if (key && !seen.has(key)) {
                    seen.add(key);
                    merged.push(item);
                }
            });

            interns = merged;
            total = merged.length;
        } else {
            const response = await fetchInternPharmacists(page, PAGE_SIZE, currentSearch, currentStatus);
            const dataRoot = response?.data || response;
            let rawInterns = Array.isArray(dataRoot) ? dataRoot : (dataRoot.items || dataRoot.users || dataRoot.content || dataRoot.data || []);

            // STRICT FILTER: In the "All" tab, hide anyone with a Pending status
            interns = rawInterns.filter(i => {
                const s = String(i.status || '').toLowerCase().trim();
                return s !== 'pending';
            });

            total = dataRoot.totalCount || dataRoot.total || interns.length;
            if (rawInterns.length !== interns.length) {
                total = interns.length;
            }
        }

        if (!interns || interns.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 40px;">No ${currentTab === 'requests' ? 'applications' : 'intern pharmacists'} found.</td></tr>`;
            updatePaginationInfo(0, page);
            if (paginationButtons) paginationButtons.innerHTML = '';
            return;
        }

        currentInternPharmacistsData = interns;

        tableBody.innerHTML = interns.map(intern => {
            let displayName = intern.fullName || intern.name || intern.displayName || intern.userName || '';
            const email = intern.email || intern.userEmail || '';

            if (!displayName && email) {
                displayName = email.split('@')[0];
            }
            if (!displayName) displayName = 'Unknown Intern';

            const status = (intern.isActive === false || (intern.status && intern.status.toLowerCase() === 'suspended'))
                ? 'Suspended' : (intern.status || (currentTab === 'requests' ? 'Pending' : 'Active'));

            const showApproval = currentTab === 'requests' || status.toLowerCase() === 'pending';
            const initials = displayName.substring(0, 2).toUpperCase();

            return `
                <tr data-id="${intern.id || intern.userId}">
                    <td>
                        <div class="user-info" style="display: flex; align-items: center; gap: 12px;">
                            <div class="avatar-letter" style="width: 40px; height: 40px; border-radius: 50%; background: #EAF2FE; color: #0057d1; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 14px; border: 1px solid rgba(0,87,209,0.1);">
                                ${initials}
                            </div>
                            <div class="info">
                                <span class="name" style="font-weight: 600; display: block; color: #0f172a;">${displayName}</span>
                                <span class="email" style="font-size:12px; opacity:0.7; display: block; color: #64748b;">${email}</span>
                            </div>
                        </div>
                    </td>
                    <td style="color: #64748b; font-weight: 500;">${intern.university || intern.universityName || 'Pharmacy Faculty'}</td>
                    <td><code style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px; color: #475569;">${intern.membershipNumber || intern.licenseNumber || 'N/A'}</code></td>
                    <td><span class="status-badge ${getStatusClass(status)}">${status}</span></td>
                    <td style="font-size: 13px; color: #64748b;">${intern.submittedAt || intern.createdAt ? new Date(intern.submittedAt || intern.createdAt).toLocaleDateString() : 'N/A'}</td>
                    <td>
                        <div class="table-actions">
                            <button class="action-btn" style="background: #EAF2FE; color: #0057d1;" onclick="viewInternDetails('${intern.id || intern.userId}')" title="View Profile"><i class='bx bx-show'></i></button>
                            ${showApproval ? `
                                <button class="action-btn" style="background:#ccfbf1;color:#0d9488;" onclick="approveInternAction('${intern.id || intern.userId}')" title="Approve"><i class='bx bx-check-shield'></i></button>
                                <button class="action-btn" style="background:#fee2e2;color:#e11d48;" onclick="rejectInternAction('${intern.id || intern.userId}')" title="Reject"><i class='bx bx-x-circle'></i></button>
                            ` : (status.toLowerCase() === 'suspended' ? `
                                <button class="action-btn" style="background: #ccfbf1; color: #0d9488;" onclick="activateInternAction('${intern.id || intern.userId}')" title="Activate"><i class='bx bx-play-circle'></i></button>
                            ` : `
                                <button class="action-btn" style="background: #ffedd5; color: #f97316;" onclick="suspendInternAction('${intern.id || intern.userId}')" title="Suspend"><i class='bx bx-pause-circle'></i></button>
                            `)}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        updatePaginationInfo(total, page);
        renderPaginationButtons(total, page);
        if (paginationContainer) paginationContainer.style.opacity = '1';

    } catch (error) {
        console.error('[Interns] Load Error:', error);
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 40px; color: var(--danger);">Error: ${error.message}</td></tr>`;
    }
}

function getStatusClass(status) {
    status = status ? status.toLowerCase() : 'pending';
    if (status === 'approved' || status === 'active' || status === 'verified') return 'success';
    if (status === 'rejected' || status === 'suspended' || status === 'banned') return 'danger';
    return 'warning';
}

async function updateRequestsBadge() {
    const badge = document.getElementById('requests-badge');
    if (!badge) return;

    try {
        // Fetch both to deduplicate
        const [appRes, internRes] = await Promise.all([
            fetchInternPharmacistApplications(1, 50),
            fetchInternPharmacists(1, 50, '', 'Pending')
        ]);

        const apps = Array.isArray(appRes?.data || appRes) ? (appRes?.data || appRes) : (appRes?.data?.items || []);
        const interns = Array.isArray(internRes?.data || internRes) ? (internRes?.data || internRes) : (internRes?.data?.items || []);

        // Use Set for deduplication by Email or ID
        const seen = new Set();
        let total = 0;

        [...interns, ...apps].forEach(item => {
            const key = (item.userEmail || item.email || item.userId || item.id || '').toLowerCase();
            if (key && !seen.has(key)) {
                seen.add(key);
                total++;
            }
        });

        if (total > 0) {
            badge.textContent = total;
            badge.style.display = 'inline-block';
            badge.classList.add('pulse-animation'); // Ensure CSS has .pulse-animation { animation: pulse 2s infinite; }
            badge.style.animation = 'pulse 2s infinite';
        } else {
            badge.style.display = 'none';
        }
    } catch (error) {
        console.error('[Interns] Badge error:', error);
    }
}

function updatePaginationInfo(total, page) {
    const pageInfo = document.querySelector('.page-info');
    if (pageInfo) {
        const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
        const to = Math.min(page * PAGE_SIZE, total);
        pageInfo.innerHTML = `Showing <span style="font-weight: 600; color: var(--primary);">${from}</span> to <span style="font-weight: 600; color: var(--primary);">${to}</span> of <span style="font-weight: 600;">${total.toLocaleString()}</span> interns`;
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

    let html = `<button class="page-btn ${currentPage === 1 ? 'disabled' : ''}" onclick="${currentPage === 1 ? '' : 'loadInternPharmacists(' + (currentPage - 1) + ')'}"><i class='bx bx-chevron-left'></i></button>`;
    const range = 2;
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - range && i <= currentPage + range)) {
            html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="loadInternPharmacists(${i})">${i}</button>`;
        } else if (i === currentPage - range - 1 || i === currentPage + range + 1) {
            html += `<span>...</span>`;
        }
    }
    html += `<button class="page-btn ${currentPage === totalPages ? 'disabled' : ''}" onclick="${currentPage === totalPages ? '' : 'loadInternPharmacists(' + (currentPage + 1) + ')'}"><i class='bx bx-chevron-right'></i></button>`;

    container.innerHTML = html;
}

async function viewInternDetails(id) {
    const modal = document.getElementById('view-intern-modal');
    const content = document.getElementById('intern-details-content');
    if (!modal || !content) return;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    content.innerHTML = `
        <div style="text-align: center; padding: 40px;">
            <i class="bx bx-loader-alt bx-spin" style="font-size: 40px; color: var(--primary);"></i>
            <p>Fetching full profile...</p>
        </div>
    `;

    try {
        const intern = currentInternPharmacistsData.find(x => String(x.id || x.userId) === String(id));
        if (!intern) throw new Error('Intern not found.');

        // Priority: userName from API, then other fields, no email fallback
        let displayName = intern.userName || intern.fullName || intern.name || intern.displayName || 'Unnamed Intern';

        const initials = displayName.substring(0, 2).toUpperCase();
        const status = (intern.isActive === false || (intern.status && intern.status.toLowerCase() === 'suspended')) ? 'Suspended' : (intern.status || 'Active');

        content.innerHTML = `
            <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 25px; padding-bottom: 20px; border-bottom: 1px solid rgba(0,0,0,0.05);">
                <div style="width: 80px; height: 80px; border-radius: 12px; background: #EAF2FE; color: #0057d1; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 28px; border: 1px solid rgba(0,87,209,0.1);">
                    ${initials}
                </div>
                <div>
                    <h3 style="margin: 0; font-size: 22px; color: var(--primary);">${displayName}</h3>
                    <p style="margin: 5px 0 0; font-size: 14px; color: var(--text-muted);">${intern.university || intern.universityName || 'Pharmacy Student'}</p>
                </div>
            </div>
            <div class="details-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div class="detail-item">
                    <label style="display: block; font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">User ID</label>
                    <div style="font-weight: 500; font-size: 13px; word-break: break-all;">${intern.id || intern.userId}</div>
                </div>
                <div class="detail-item">
                    <label style="display: block; font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Status</label>
                    <div><span class="status-badge ${getStatusClass(status)}">${status}</span></div>
                </div>
                <div class="detail-item">
                    <label style="display: block; font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Email Address</label>
                    <div style="font-weight: 500;">${intern.email || intern.userEmail || 'N/A'}</div>
                </div>
                <div class="detail-item">
                    <label style="display: block; font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Student/Member ID</label>
                    <div style="font-weight: 600; color: var(--primary);">${intern.membershipNumber || intern.licenseNumber || 'N/A'}</div>
                </div>
                <div class="detail-item">
                    <label style="display: block; font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">University</label>
                    <div style="font-weight: 500;">${intern.university || intern.universityName || 'N/A'}</div>
                </div>
                <div class="detail-item">
                    <label style="display: block; font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Joined Date</label>
                    <div style="font-weight: 500;">${intern.submittedAt || intern.createdAt ? new Date(intern.submittedAt || intern.createdAt).toLocaleDateString() : 'N/A'}</div>
                </div>
            </div>
            
            ${intern.documents && intern.documents.length > 0 ? `
                <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid rgba(0,0,0,0.05);">
                    <h4 style="font-size: 14px; margin-bottom: 12px; color: var(--text-main);"><i class='bx bx-file-find'></i> Verification Documents</h4>
                    <div style="display: grid; grid-template-columns: 1fr; gap: 10px;">
                        ${intern.documents.map(doc => {
            const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(doc.fileUrl || '');
            const docLabel = doc.documentType || 'Identity Document';
            return `
                                <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px; background: #F8FAFD; border-radius: 12px; border: 1px solid #E2E8F0;">
                                    <div style="display: flex; align-items: center; gap: 12px;">
                                        <div style="width: 40px; height: 40px; border-radius: 8px; background: ${isImage ? '#FEF3C7' : '#E0F2FE'}; color: ${isImage ? '#D97706' : '#0369A1'}; display: flex; align-items: center; justify-content: center; font-size: 20px;">
                                            <i class='bx ${isImage ? 'bx-image' : 'bx-file-blank'}'></i>
                                        </div>
                                        <div>
                                            <div style="font-weight: 600; font-size: 13px;">${docLabel}</div>
                                            <div style="font-size: 11px; color: var(--text-muted);">Uploaded on ${doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : 'N/A'}</div>
                                        </div>
                                    </div>
                                    <a href="${doc.fileUrl || '#'}" target="_blank" class="btn btn-sm" style="background: white; border: 1px solid #E2E8F0; padding: 6px 12px; font-size: 12px; color: var(--primary);">
                                        <i class='bx bx-link-external'></i> View File
                                    </a>
                                </div>
                            `;
        }).join('')}
                    </div>
                </div>
            ` : `
                <div style="margin-top: 25px; padding: 20px; background: #FFFBEB; border-radius: 12px; border: 1px solid #FEF3C7; text-align: center;">
                    <i class='bx bx-error-circle' style="font-size: 24px; color: #D97706; margin-bottom: 8px;"></i>
                    <p style="font-size: 13px; color: #92400E; margin: 0;">No verification documents have been uploaded yet.</p>
                </div>
            `}
        `;
    } catch (err) {
        console.error('[Interns] Failed to load profile:', err);
        content.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--danger);"><i class="bx bx-error-circle" style="font-size: 40px;"></i><p>Failed to load profile details.</p></div>`;
    }
}

function closeViewModal() {
    const modal = document.getElementById('view-intern-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

async function approveInternAction(id) {
    const result = await Swal.fire({
        title: 'Approve Intern?',
        text: "This student will be granted access to the platform.",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#0057d1',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Yes, Approve'
    });

    if (result.isConfirmed) {
        try {
            Swal.showLoading();
            await approveIntern(id);
            Swal.fire('Approved!', 'Intern has been approved successfully.', 'success');
            loadInternPharmacists(currentPage);
            updateRequestsBadge();
        } catch (err) {
            Swal.fire('Failed', err.message, 'error');
        }
    }
}

async function rejectInternAction(id) {
    const { value: reason } = await Swal.fire({
        title: 'Reject Application',
        input: 'textarea',
        inputLabel: 'Reason for rejection',
        inputPlaceholder: 'Enter reason...',
        showCancelButton: true,
        confirmButtonColor: '#ef4444'
    });

    if (reason !== undefined) {
        try {
            Swal.showLoading();
            await rejectIntern(id, reason || 'Did not meet requirements.');
            Swal.fire('Rejected', 'Application has been rejected.', 'success');
            loadInternPharmacists(currentPage);
            updateRequestsBadge();
        } catch (err) {
            Swal.fire('Failed', err.message, 'error');
        }
    }
}

async function suspendInternAction(id) {
    const result = await Swal.fire({
        title: 'Suspend Intern?',
        text: "They will be unable to use the platform until reactivated.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#f97316',
        confirmButtonText: 'Yes, Suspend'
    });

    if (result.isConfirmed) {
        try {
            Swal.showLoading();
            await suspendInternPharmacistApi(id);
            Swal.fire('Suspended', 'Intern has been suspended.', 'success');
            loadInternPharmacists(currentPage);
        } catch (err) {
            Swal.fire('Failed', err.message, 'error');
        }
    }
}

async function activateInternAction(id) {
    const result = await Swal.fire({
        title: 'Reactivate Intern?',
        icon: 'info',
        showCancelButton: true,
        confirmButtonColor: '#0d9488',
        confirmButtonText: 'Yes, Activate'
    });

    if (result.isConfirmed) {
        try {
            Swal.showLoading();
            await activateInternPharmacistApi(id);
            Swal.fire('Activated', 'Intern has been reactivated.', 'success');
            loadInternPharmacists(currentPage);
        } catch (err) {
            Swal.fire('Failed', err.message, 'error');
        }
    }
}
