let currentPage = 1;
let currentSearch = '';
let currentStatus = '';
let currentTab = 'all'; // 'all' or 'requests'
const PAGE_SIZE = 20;

document.addEventListener('DOMContentLoaded', () => {
    loadPharmacists();
    initSearchAndFilters();
});

function switchTab(tab) {
    currentTab = tab;
    document.getElementById('tab-all').style.fontWeight = tab === 'all' ? '600' : '500';
    document.getElementById('tab-all').style.color = tab === 'all' ? '#0f172a' : '#64748b';
    document.getElementById('tab-all').style.borderBottomColor = tab === 'all' ? '#0057d1' : 'transparent';
    
    document.getElementById('tab-requests').style.fontWeight = tab === 'requests' ? '600' : '500';
    document.getElementById('tab-requests').style.color = tab === 'requests' ? '#0f172a' : '#64748b';
    document.getElementById('tab-requests').style.borderBottomColor = tab === 'requests' ? '#0057d1' : 'transparent';
    
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

    tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 40px;"><i class="bx bx-loader-alt bx-spin"></i> Loading pharmacists directory...</td></tr>';
    if (paginationContainer) paginationContainer.style.opacity = '0.5';

    try {
        console.log(`[Pharmacists] Fetching page ${page} with search: "${currentSearch}" (Tab: ${currentTab})`);
        let response;
        if (currentTab === 'requests') {
            response = await fetchPharmacistApplications(page, PAGE_SIZE);
        } else {
            response = await fetchPharmacists(page, PAGE_SIZE, currentSearch, currentStatus);
        }
        console.log('[Pharmacists] Raw Server Response:', response);
        
        // Robust extraction based on Patients successful pattern
        const dataRoot = response?.data || response;
        const pharmacists = Array.isArray(dataRoot) ? dataRoot : (dataRoot.items || dataRoot.users || dataRoot.content || []);
        
        const total = dataRoot.totalCount || dataRoot.total || dataRoot.recordsTotal || pharmacists.length;
        console.log(`[Pharmacists] Digested results: ${pharmacists.length} items found. Total count: ${total}`);

        if (!pharmacists || pharmacists.length === 0) {
            console.log('[Pharmacists] No data in response structure:', response);
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 40px;">No pharmacists found.</td></tr>`;
            updatePaginationInfo(0, page);
            if (paginationButtons) paginationButtons.innerHTML = '';
            return;
        }

        tableBody.innerHTML = pharmacists.map(p => {
            // SAFE NAME LOGIC: Prefer fullName. Only clean if it looks like a technical UID.
            let displayName = p.fullName || p.name || p.userName || 'Unknown User';
            
            // Only split if it's clearly an auto-generated UID (contains slash and the part after it is the email)
            if (displayName.includes('/') && displayName.includes('@')) {
                displayName = displayName.split('/').pop().split('@')[0];
            } else if (displayName.includes('@')) {
                // Also clean up if the name is just the email
                displayName = displayName.split('@')[0];
            }

            const isVerified = p.isVerified === true;
            const status = p.status || (isVerified ? 'Active' : 'Pending');
            
            // Format roles
            const rolesHtml = (p.roles && p.roles.length > 0) 
                ? p.roles.map(r => `<span class="badge-type type-info" style="margin-right: 4px;">${r}</span>`).join('')
                : `<span class="badge-type type-info">${p.specialization || 'Pharmacist'}</span>`;

            return `
                <tr>
                    <td>
                        <div class="user-info">
                            <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=EAF2FE&color=0057d1" alt="Avatar">
                            <div class="info">
                                <span class="name" style="font-weight: 600;">${displayName}</span>
                                <span class="email" style="font-size:12px; opacity:0.7;">${p.email || p.userEmail || ''}</span>
                            </div>
                        </div>
                    </td>
                    <td>${rolesHtml}</td>
                    <td><code>${p.phone || p.licenseNumber || p.licenseNo || 'N/A'}</code></td>
                    <td><span class="status-badge ${status === 'Active' || isVerified ? 'success' : 'warning'}">${status}</span></td>
                    <td>
                        <div class="table-actions">
                            ${(status === 'Pending' || !isVerified || currentTab === 'requests') ? `
                                <button class="action-btn" style="background:#ccfbf1;color:#0d9488;" onclick="handleApproval('${p.id}')" title="Approve"><i class='bx bx-check-shield'></i></button>
                                <button class="action-btn" style="background:#fee2e2;color:#e11d48;" onclick="handleRejection('${p.id}')" title="Reject"><i class='bx bx-x-circle'></i></button>
                            ` : ''}
                            <button class="action-btn edit" onclick="editPharmacist('${p.id}')" title="Edit"><i class='bx bx-edit-alt'></i></button>
                            <button class="action-btn delete" onclick="deletePharmacistConfirmation('${p.id}')" title="Remove"><i class='bx bx-trash'></i></button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        updatePaginationInfo(total, page);
        renderPaginationButtons(total, page);
        if (paginationContainer) paginationContainer.style.opacity = '1';

    } catch (error) {
        console.error('[Pharmacists] Failed to load:', error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center; padding: 40px; color: var(--danger);">
                    <i class='bx bx-error-circle' style="font-size: 32px;"></i>
                    <p>Failed to load pharmacists: ${error.message}</p>
                    <button class="btn btn-sm btn-outline" style="margin-top: 10px;" onclick="loadPharmacists(${page})">Retry</button>
                </td>
            </tr>
        `;
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

    let html = `<button class="page-btn ${currentPage === 1 ? 'disabled' : ''}" onclick="${currentPage === 1 ? '' : `loadPharmacists(${currentPage - 1})`}"><i class='bx bx-chevron-left'></i></button>`;
    
    const range = 2;
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - range && i <= currentPage + range)) {
            html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="loadPharmacists(${i})">${i}</button>`;
        } else if (i === currentPage - range - 1 || i === currentPage + range + 1) {
            html += `<span>...</span>`;
        }
    }

    html += `<button class="page-btn ${currentPage === totalPages ? 'disabled' : ''}" onclick="${currentPage === totalPages ? '' : `loadPharmacists(${currentPage + 1})`}"><i class='bx bx-chevron-right'></i></button>`;
    
    container.innerHTML = html;
}

async function handleApproval(id) {
    if (confirm('Approve this pharmacist application?')) {
        try {
            await approvePharmacist(id);
            alert('Pharmacist approved successfully');
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
            loadPharmacists(currentPage);
        } catch (err) {
            alert('Rejection failed: ' + err.message);
        }
    }
}

function editPharmacist(id) {
    console.log('[Pharmacists] Edit:', id);
}

async function deletePharmacistConfirmation(id) {
    if (confirm('Are you sure you want to remove this pharmacist?')) {
        try {
            await deletePharmacist(id);
            loadPharmacists(currentPage);
        } catch (err) {
            alert('Deletion failed: ' + err.message);
        }
    }
}
