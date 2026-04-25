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
        } else {
            response = await fetchPharmacists(page, PAGE_SIZE, currentSearch, '');
        }

        const dataRoot = response?.data || response;
        const pharmacists = Array.isArray(dataRoot) ? dataRoot : (dataRoot.items || dataRoot.users || dataRoot.content || []);
        const total = dataRoot.totalCount || dataRoot.total || dataRoot.recordsTotal || pharmacists.length;

        if (!pharmacists || pharmacists.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 40px;">No ${currentTab === 'requests' ? 'applications' : 'pharmacists'} found.</td></tr>`;
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

    content.innerHTML = `
        <div style="text-align: center; padding: 40px;">
            <i class="bx bx-loader-alt bx-spin" style="font-size: 40px; color: var(--primary);"></i>
            <p>Fetching full profile...</p>
        </div>
    `;

    try {
        let p;
        try {
            // Try fetching latest data from server
            const response = await fetchPharmacistById(id);
            p = response?.data || response;
        } catch (fetchErr) {
            console.warn('[Pharmacists] Detail fetch failed, falling back to cache:', fetchErr);
            // Fallback to cache if server detail endpoint fails
            p = currentPharmacistsData.find(x => String(x.id) === String(id) || String(x.userId) === String(id));
        }
        
        if (!p) throw new Error('Pharmacist not found.');

        // Update local cache as well
        const pIndex = currentPharmacistsData.findIndex(x => String(x.id) === String(id));
        if (pIndex > -1) {
            currentPharmacistsData[pIndex] = { ...currentPharmacistsData[pIndex], ...p };
        }

        // Priority: userName from API as requested
        let displayName = p.userName || p.fullName || p.name || p.displayName || '';
        if (!displayName && p.email) {
            displayName = p.email.split('@')[0];
        }
        if (!displayName) displayName = 'Unnamed Pharmacist';
        
        const initials = displayName.substring(0, 2).toUpperCase();
        const status = (p.isActive === false || (p.status && p.status.toLowerCase() === 'suspended')) ? 'Suspended' : (p.status || 'Active');
        
        // Comprehensive check for any possible field name the backend might use
        const maxLimit = (p.maxPatients !== undefined && p.maxPatients !== null) ? p.maxPatients : 
                         (p.maxPatientsLimit !== undefined && p.maxPatientsLimit !== null) ? p.maxPatientsLimit : 
                         (p.limit !== undefined && p.limit !== null) ? p.limit : null;

        content.innerHTML = `
            <div style="display: flex; align-items: center; gap: 24px; margin-bottom: 30px; padding: 20px; background: linear-gradient(to right, #F8FAFD, #FFFFFF); border-radius: 16px; border: 1px solid #E2E8F0;">
                <div style="width: 90px; height: 90px; border-radius: 16px; background: #EAF2FE; color: #0057d1; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 32px; border: 2px solid white; box-shadow: var(--shadow-sm);">
                    ${initials}
                </div>
                <div>
                    <h3 style="margin: 0; font-size: 24px; color: var(--primary); font-weight: 700;">${displayName}</h3>
                    <div style="display: flex; align-items: center; gap: 8px; margin-top: 6px;">
                        <span style="font-size: 14px; color: var(--text-muted);"><i class='bx bx-user-circle'></i> ${p.userName || 'no-username'}</span>
                        <span style="width: 4px; height: 4px; border-radius: 50%; background: #CBD5E1;"></span>
                        <span style="font-size: 14px; color: var(--text-muted);"><i class='bx bx-check-shield'></i> ${p.specialization || 'Registered Pharmacist'}</span>
                    </div>
                </div>
            </div>

            <div class="details-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-bottom: 30px;">
                <div class="detail-item">
                    <label style="display: block; font-size: 11px; color: var(--text-muted); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700;">Full Name</label>
                    <div style="font-weight: 600; color: var(--text-main); font-size: 14px;">${displayName}</div>
                </div>
                <div class="detail-item">
                    <label style="display: block; font-size: 11px; color: var(--text-muted); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700;">User Name</label>
                    <div style="font-weight: 700; color: #0057d1; font-size: 14px; background: #EAF2FE; padding: 4px 10px; border-radius: 6px; display: inline-block;">${p.userName || 'N/A'}</div>
                </div>
                <div class="detail-item">
                    <label style="display: block; font-size: 11px; color: var(--text-muted); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700;">Status</label>
                    <div><span class="status-badge ${getStatusClass(status)}" style="padding: 4px 12px; font-size: 12px;">${status}</span></div>
                </div>
                <div class="detail-item">
                    <label style="display: block; font-size: 11px; color: var(--text-muted); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700;">Email Address</label>
                    <div style="font-weight: 600; color: var(--text-main); font-size: 13px;">${p.email || p.userEmail || 'N/A'}</div>
                </div>
                <div class="detail-item">
                    <label style="display: block; font-size: 11px; color: var(--text-muted); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700;">License Number</label>
                    <div style="font-weight: 700; color: var(--primary); font-size: 14px;">${p.membershipNumber || p.licenseNumber || 'N/A'}</div>
                </div>
                <div class="detail-item">
                    <label style="display: block; font-size: 11px; color: var(--text-muted); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700;">Phone Number</label>
                    <div style="font-weight: 600; color: var(--text-main); font-size: 13px;">${p.phone || p.phoneNumber || 'N/A'}</div>
                </div>
                <div class="detail-item">
                    <label style="display: block; font-size: 11px; color: var(--text-muted); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700;">Max Patients</label>
                    <div style="font-weight: 700; color: #0d9488; font-size: 15px;">${maxLimit !== null ? maxLimit : 'Not Set'}</div>
                </div>
                <div class="detail-item" style="grid-column: span 2;">
                    <label style="display: block; font-size: 11px; color: var(--text-muted); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700;">Member Since</label>
                    <div style="font-weight: 600; color: var(--text-main); font-size: 13px;">${p.createdAt ? new Date(p.createdAt).toLocaleString() : 'N/A'}</div>
                </div>
            </div>
            
            <div style="margin-top: 10px; padding: 20px; background: #F0FDFA; border-radius: 12px; border: 1px solid #CCFBF1;">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div>
                        <h4 style="font-size: 14px; margin: 0; color: #0f172a;">Admin Quick Actions</h4>
                        <p style="font-size: 12px; color: #0d9488; margin: 4px 0 0;">Update operational limits for this pharmacist.</p>
                    </div>
                    <button class="btn btn-primary" onclick="promptMaxPatients('${p.id}')" style="font-size: 13px; padding: 10px 20px; box-shadow: 0 4px 12px rgba(0, 87, 209, 0.2);">
                        <i class='bx bx-edit-alt'></i> Update Limit
                    </button>
                </div>
            </div>
        `;
    } catch (err) {
        console.error('[Pharmacists] Failed to load profile:', err);
        content.innerHTML = `
            <div style="padding: 40px; text-align: center; color: var(--danger);">
                <i class="bx bx-error-circle" style="font-size: 40px;"></i>
                <p style="font-weight: bold; font-size: 16px; margin-top: 10px;">Failed to load profile details.</p>
                <p style="font-size: 13px; margin-top: 10px; opacity: 0.8; word-break: break-all;">Error: ${err.message}</p>
                <p style="font-size: 10px; margin-top: 10px; opacity: 0.5; word-break: break-all; text-align: left;">${err.stack}</p>
            </div>
        `;
    }
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

