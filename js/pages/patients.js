let currentPage = 1;
let currentSearch = '';
let currentStatus = '';
const PAGE_SIZE = 20;

document.addEventListener('DOMContentLoaded', () => {
    loadPatients();
    initSearchAndFilters();
});

function initSearchAndFilters() {
    const searchInput = document.querySelector('.action-bar .search-box input');
    if (searchInput) {
        let debounceTimer;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                currentSearch = e.target.value.trim();
                loadPatients(1);
            }, 500);
        });
    }
}


async function loadPatients(page = 1) {
    currentPage = page;
    const tableBody = document.getElementById('patients-table-body');
    const paginationContainer = document.getElementById('pagination-container');
    const paginationButtons = document.getElementById('pagination-buttons');
    
    if (!tableBody) return;

    // Show loading state
    tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 40px;"><i class="bx bx-loader-alt bx-spin"></i> Loading patients...</td></tr>';
    if (paginationContainer) paginationContainer.style.opacity = '0.5';

    try {
        console.log(`[Patients] Fetching page ${page} with search: "${currentSearch}" and status: "${currentStatus}"`);
        const response = await fetchPatients(page, PAGE_SIZE, currentSearch, currentStatus);
        console.log('[Patients] Raw Server Response:', response);

        // Robust extraction based on Swagger screenshot { data: { items: [], totalCount: N } }
        const dataRoot = response?.data || response;
        let patients = Array.isArray(dataRoot) ? dataRoot : (dataRoot.items || dataRoot.users || dataRoot.content || []);
        
        const total = dataRoot.totalCount || dataRoot.total || dataRoot.recordsTotal || patients.length;
        console.log(`[Patients] Digested results: ${patients.length} items found. Total count from server: ${total}`);

        if (!patients || patients.length === 0) {
            console.log('[Patients] No patients found in response:', response);
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 40px;">No patients found.</td></tr>`;
            updatePaginationInfo(0, page);
            if (paginationButtons) paginationButtons.innerHTML = '';
            return;
        }

        // Sort by registration date descending (Newest first) if the fields are available
        patients.sort((a, b) => {
            const dateA = new Date(a.createdAt || a.registrationDate || 0);
            const dateB = new Date(b.createdAt || b.registrationDate || 0);
            return dateB - dateA;
        });

        tableBody.innerHTML = patients.map(patient => {
            // Robust name discovery (synchronized with modal)
            let displayName = patient.fullName || patient.name || patient.displayName || patient.userName || '';
            if (!displayName && patient.email) {
                displayName = patient.email.split('@')[0];
            }
            if (!displayName) displayName = 'Unknown Patient';

            // Robust status logic: check both status field and isActive flag
            const status = (patient.isActive === false || (patient.status && patient.status.toLowerCase() === 'suspended')) 
                           ? 'Suspended' : (patient.status || 'Active');

            return `
            <tr>
                <td>
                    <div class="table-person">
                        <img src="${patient.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=E1F0F8&color=0D8ABC`}"
                            alt="${displayName}">
                        <div class="info">
                            <span class="name" style="font-weight: 600;">${displayName}</span>
                            <span class="email" style="font-size: 12px; opacity: 0.7;">${patient.email || 'N/A'}</span>
                            <span class="id-badge" style="font-size:10px; opacity:0.5; display: block; margin-top: 2px;">ID: ${patient.id}</span>
                        </div>
                    </div>
                </td>
                <td>#PT-${String(patient.id || '').substring(0, 8)}...</td>
                <td>${patient.phone || patient.phoneNumber || 'N/A'}</td>
                <td>${patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : (patient.joinedDate ? new Date(patient.joinedDate).toLocaleDateString() : 'N/A')}</td>
                <td><span class="status-badge ${getStatusClass(status)}">${status}</span></td>
                <td>
                    <div class="table-actions">
                        <button class="action-btn" style="background: #EAF2FE; color: #0057d1;" onclick="viewPatientDetails('${patient.id}')" title="View Profile"><i class='bx bx-show'></i></button>
                        ${status.toLowerCase() === 'suspended' ? `
                            <button class="action-btn" style="background: #ccfbf1; color: #0d9488;" onclick="activatePatientAction('${patient.id}')" title="Activate"><i class='bx bx-play-circle'></i></button>
                        ` : `
                            <button class="action-btn" style="background: #ffedd5; color: #f97316;" onclick="suspendPatientAction('${patient.id}')" title="Suspend"><i class='bx bx-pause-circle'></i></button>
                        `}
                        <button class="action-btn" style="background:#fee2e2;color:#e11d48;" onclick="banUserAction('${patient.id}')" title="Ban User"><i class='bx bx-block'></i></button>
                    </div>
                </td>
            </tr>
            `;
        }).join('');

        updatePaginationInfo(total, page);
        renderPaginationButtons(total, page);
        if (paginationContainer) paginationContainer.style.opacity = '1';

    } catch (error) {
        console.error('[Patients] Fetch Error:', error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center; padding: 60px;">
                    <div style="color: var(--danger); margin-bottom: 15px;">
                        <i class='bx bx-error-circle' style="font-size: 40px;"></i>
                        <p style="margin-top: 10px; font-weight: 500;">Failed to connect to the server</p>
                        <p style="font-size: 13px; opacity: 0.8;">${error.message || 'Unknown network error'}</p>
                    </div>
                </td>
            </tr>
        `;
        if (paginationContainer) paginationContainer.style.opacity = '0.3';
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

    let html = `
        <button class="page-btn ${currentPage === 1 ? 'disabled' : ''}" onclick="${currentPage === 1 ? '' : `loadPatients(${currentPage - 1})`}">
            <i class='bx bx-chevron-left'></i>
        </button>
    `;

    const range = 2;
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - range && i <= currentPage + range)) {
            html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="loadPatients(${i})">${i}</button>`;
        } else if (i === currentPage - range - 1 || i === currentPage + range + 1) {
            html += `<span>...</span>`;
        }
    }

    html += `
        <button class="page-btn ${currentPage === totalPages ? 'disabled' : ''}" onclick="${currentPage === totalPages ? '' : `loadPatients(${currentPage + 1})`}">
            <i class='bx bx-chevron-right'></i>
        </button>
    `;

    container.innerHTML = html;
}

function getStatusClass(status) {
    status = status ? status.toLowerCase() : 'pending';
    if (status === 'approved' || status === 'active' || status === 'verified') return 'success';
    if (status === 'rejected' || status === 'suspended') return 'danger';
    return 'warning';
}

async function viewPatientDetails(id) {
    const modal = document.getElementById('view-patient-modal');
    const content = document.getElementById('patient-details-content');
    if (!modal || !content) return;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    content.innerHTML = `
        <div style="text-align: center; padding: 40px;">
            <i class="bx bx-loader-alt bx-spin" style="font-size: 40px; color: var(--primary);"></i>
            <p>Loading profile...</p>
        </div>
    `;

    try {
        const response = await fetchPatientById(id);
        const p = response?.data || response;
        
        // Robust name discovery
        let displayName = p.fullName || p.name || p.displayName || p.userName || '';
        if (!displayName && p.email) {
            displayName = p.email.split('@')[0];
        }
        if (!displayName) displayName = 'Unnamed Patient';

        const status = p.status || (p.isActive !== false ? 'Active' : 'Suspended');
        const initials = displayName.substring(0, 2).toUpperCase();
        
        content.innerHTML = `
            <div style="display: flex; align-items: center; gap: 24px; margin-bottom: 30px; padding: 20px; background: linear-gradient(to right, #F8FAFD, #FFFFFF); border-radius: 16px; border: 1px solid #E2E8F0;">
                <div style="width: 90px; height: 90px; border-radius: 50%; background: #EAF2FE; color: #0057d1; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 32px; border: 2px solid white; box-shadow: var(--shadow-sm); overflow: hidden;">
                    <img src="${p.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=EAF2FE&color=0057d1`}" style="width: 100%; height: 100%; object-fit: cover;">
                </div>
                <div>
                    <h3 style="margin: 0; font-size: 24px; color: var(--primary); font-weight: 700;">${displayName}</h3>
                    <div style="display: flex; align-items: center; gap: 8px; margin-top: 6px;">
                        <span style="font-size: 14px; color: var(--text-muted);"><i class='bx bx-time-five'></i> Patient since ${new Date(p.createdAt || Date.now()).toLocaleDateString()}</span>
                        <span style="width: 4px; height: 4px; border-radius: 50%; background: #CBD5E1;"></span>
                        <span style="font-size: 14px; color: var(--text-muted);"><i class='bx bx-id-card'></i> ID: ${p.id.substring(0, 8)}...</span>
                    </div>
                </div>
            </div>

            <div class="details-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-bottom: 20px;">
                <div class="detail-item">
                    <label style="display: block; font-size: 11px; color: var(--text-muted); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700;">Full Name</label>
                    <div style="font-weight: 600; color: var(--text-main); font-size: 14px;">${displayName}</div>
                </div>
                <div class="detail-item">
                    <label style="display: block; font-size: 11px; color: var(--text-muted); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700;">User ID</label>
                    <div style="font-weight: 500; color: #64748b; font-size: 12px; word-break: break-all; background: #f8fafc; padding: 4px 8px; border-radius: 6px; border: 1px solid #e2e8f0;">${p.id}</div>
                </div>
                <div class="detail-item">
                    <label style="display: block; font-size: 11px; color: var(--text-muted); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700;">User Role</label>
                    <div style="font-weight: 600; color: #0057d1; font-size: 13px; background: #EAF2FE; padding: 4px 10px; border-radius: 6px; display: inline-block;">
                        ${Array.isArray(p.roles) ? p.roles.join(', ') : (p.role || 'Patient')}
                    </div>
                </div>
                <div class="detail-item">
                    <label style="display: block; font-size: 11px; color: var(--text-muted); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700;">Status</label>
                    <div><span class="status-badge ${getStatusClass(status)}" style="padding: 4px 12px; font-size: 12px;">${status}</span></div>
                </div>
                <div class="detail-item">
                    <label style="display: block; font-size: 11px; color: var(--text-muted); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700;">Email Address</label>
                    <div style="font-weight: 600; color: var(--text-main); font-size: 13px;">${p.email || 'N/A'}</div>
                </div>
                <div class="detail-item">
                    <label style="display: block; font-size: 11px; color: var(--text-muted); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700;">Phone Number</label>
                    <div style="font-weight: 600; color: var(--text-main); font-size: 13px;">${p.phone || p.phoneNumber || 'N/A'}</div>
                </div>
                <div class="detail-item">
                    <label style="display: block; font-size: 11px; color: var(--text-muted); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700;">Registered On</label>
                    <div style="font-weight: 600; color: var(--text-main); font-size: 13px;">${p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'N/A'}</div>
                </div>
            </div>
        `;
    } catch (err) {
        content.innerHTML = `<p style="color:var(--danger); text-align:center; padding: 20px;">Error: ${err.message}</p>`;
    }
}

function closeViewModal() {
    const modal = document.getElementById('view-patient-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

async function suspendPatientAction(id) {
    if (confirm('Suspend this patient? they will be temporarily unable to use the app.')) {
        try {
            await suspendPatientApi(id);
            alert('Patient suspended successfully.');
            loadPatients(currentPage);
        } catch (err) { alert('Failed: ' + err.message); }
    }
}

async function activatePatientAction(id) {
    if (confirm('Reactivate this patient?')) {
        try {
            await updatePatientStatus(id, 'Active');
            alert('Patient reactivated successfully.');
            loadPatients(currentPage);
        } catch (err) { alert('Failed: ' + err.message); }
    }
}

async function banUserAction(id) {
    if (confirm('Are you sure you want to BAN this patient? they will lose access to the platform.')) {
        try {
            await apiClient.banUser(id);
            alert('User has been banned successfully.');
            loadPatients(currentPage);
        } catch (err) {
            alert('Ban failed: ' + err.message);
        }
    }
}

