let currentPage = 1;
let currentSearch = '';
let currentStatus = '';
let currentTab = 'all';
const PAGE_SIZE = 20;

document.addEventListener('DOMContentLoaded', () => {
    loadInternPharmacists();
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

    tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 40px;"><i class="bx bx-loader-alt bx-spin"></i> Discovering intern pharmacists...</td></tr>';

    try {
        console.log(`[Interns] Fetching page ${page} (Tab: ${currentTab})...`);
        
        let response;
        if (currentTab === 'requests') {
            response = await fetchInternPharmacistApplications(page, PAGE_SIZE);
        } else {
            response = await fetchInternPharmacists(page, PAGE_SIZE, currentSearch, currentStatus);
        }
        let dataRoot = response?.data || response;
        let interns = Array.isArray(dataRoot) ? dataRoot : (dataRoot.items || dataRoot.users || dataRoot.content || []);
        let total = dataRoot.totalCount || dataRoot.total || interns.length;

        // 2. SELF-HEALING: If empty, try deep discovery from global users
        if ((!interns || interns.length === 0) && !currentSearch) {
            console.warn('[Interns] Primary endpoint empty. Starting Deep Discovery scan...');
            try {
                const allUsersResponse = await apiClient.get('/admin/users?pageSize=1000');
                const allUsersData = allUsersResponse?.data || allUsersResponse || {};
                // Safely extract the array regardless of nesting
                const allUsers = Array.isArray(allUsersData)
                    ? allUsersData
                    : (allUsersData.items || allUsersData.users || allUsersData.content || []);

                interns = allUsers.filter(u => {
                    const role = String(u.role || '').toLowerCase();
                    const roles = (Array.isArray(u.roles) ? u.roles : []).map(r => String(r).toLowerCase());
                    return role === 'intern' || roles.includes('intern');
                });

                total = interns.length;
                console.log(`[Interns] Discovery found ${total} interns in global list.`);
            } catch (discoveryErr) {
                console.warn('[Interns] Discovery also failed:', discoveryErr.message);
            }
        }

        if (!interns || interns.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 40px;">No intern pharmacists found.</td></tr>';
            updatePaginationInfo(0, page);
            if (paginationButtons) paginationButtons.innerHTML = '';
            return;
        }

        tableBody.innerHTML = interns.map(intern => {
            // SAFE NAME LOGIC: Prefer fullName as entered.
            let displayName = intern.fullName || intern.name || intern.userName || 'Unknown Intern';
            
            // Handle technical UIDs if necessary
            if (displayName.includes('/') && displayName.includes('@')) {
                displayName = displayName.split('/').pop().split('@')[0];
            }

            const status = intern.status || (intern.isApproved ? 'Approved' : 'Pending');

            return `
                <tr>
                    <td>
                        <div class="user-info">
                            <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=EAF2FE&color=0057d1" alt="Avatar">
                            <div class="info">
                                <span class="name" style="font-weight: 600;">${displayName}</span>
                                <span class="email" style="font-size:12px; opacity:0.75;">${intern.email || intern.userEmail || 'N/A'}</span>
                            </div>
                        </div>
                    </td>
                    <td>${intern.university || intern.universityName || 'New Faculty'}</td>
                    <td><code>${intern.licenseNumber || intern.userId || 'Pending ID'}</code></td>
                    <td><span class="status-badge ${getStatusClass(status)}">${status}</span></td>
                    <td>${intern.createdAt ? new Date(intern.createdAt).toLocaleDateString() : 'N/A'}</td>
                    <td>
                        <div class="table-actions">
                            ${(status.toLowerCase() === 'pending' || !intern.isApproved || currentTab === 'requests') ? `
                                <button class="action-btn" style="background:#ccfbf1;color:#0d9488;" onclick="approveInternAction('${intern.id || intern.userId}')" title="Approve"><i class='bx bx-check-shield'></i></button>
                                <button class="action-btn" style="background:#fee2e2;color:#e11d48;" onclick="rejectInternAction('${intern.id || intern.userId}')" title="Reject"><i class='bx bx-x-circle'></i></button>
                            ` : ''}
                            <button class="action-btn delete" onclick="deleteInternAction('${intern.id || intern.userId}')" title="Delete Account"><i class='bx bx-trash'></i></button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        updatePaginationInfo(total, page);
        renderPaginationButtons(total, page);
        if (paginationContainer) paginationContainer.style.opacity = '1';

    } catch (error) {
        console.error('[Interns] Failed to load:', error);
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 40px; color: var(--danger);"><i class='bx bx-error-circle'></i> Error: ${error.message}</td></tr>`;
    }
}

function getStatusClass(status) {
    status = status ? status.toLowerCase() : 'pending';
    if (status === 'approved' || status === 'active' || status === 'verified') return 'success';
    if (status === 'rejected' || status === 'suspended') return 'danger';
    return 'warning';
}

async function deleteInternAction(id) {
    if (confirm('Confirm: Permanently delete this intern account?')) {
        try {
            await deleteInternPharmacist(id);
            loadInternPharmacists(currentPage);
        } catch (err) { alert('Deletion failed: ' + err.message); }
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

    let html = `<button class="page-btn ${currentPage === 1 ? 'disabled' : ''}" onclick="${currentPage === 1 ? '' : `loadInternPharmacists(${currentPage - 1})`}"><i class='bx bx-chevron-left'></i></button>`;
    
    const range = 2;
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - range && i <= currentPage + range)) {
            html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="loadInternPharmacists(${i})">${i}</button>`;
        } else if (i === currentPage - range - 1 || i === currentPage + range + 1) {
            html += `<span>...</span>`;
        }
    }

    html += `<button class="page-btn ${currentPage === totalPages ? 'disabled' : ''}" onclick="${currentPage === totalPages ? '' : `loadInternPharmacists(${currentPage + 1})`}"><i class='bx bx-chevron-right'></i></button>`;
    
    container.innerHTML = html;
}

async function approveInternAction(id) {
    if (confirm('Verify: Approve this intern for platform access?')) {
        try {
            await approveIntern(id);
            loadInternPharmacists(currentPage);
        } catch (err) { alert('Approval failed: ' + err.message); }
    }
}

async function rejectInternAction(id) {
    const reason = prompt('Please enter a reason for rejection:');
    if (reason !== null) {
        try {
            await rejectIntern(id, reason || 'Did not meet criteria.');
            alert('Intern application rejected successfully');
            loadInternPharmacists(currentPage);
        } catch (err) { alert('Rejection failed: ' + err.message); }
    }
}

async function submitSuspendIntern() {
    const id = document.getElementById('suspend-intern-id').value.trim();
    if (!id) { alert('Please enter Intern ID.'); return; }
    if (confirm('Are you sure you want to suspend this intern?')) {
        try {
            await suspendInternPharmacistApi(id);
            alert('Intern suspended successfully.');
            document.getElementById('suspend-intern-id').value = '';
            loadInternPharmacists(currentPage);
        } catch (err) {
            alert('Failed to suspend intern: ' + err.message);
        }
    }
}
