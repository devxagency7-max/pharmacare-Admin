let currentPage = 1;
let currentSearch = '';
const PAGE_SIZE = 12;

document.addEventListener('DOMContentLoaded', () => {
    loadPharmacyStats();
    loadPharmacyRequests();
    initFilterTabs();
    initCreatePharmacyForm();
    initSearchAndFilters();
});

function initSearchAndFilters() {
    const searchInput = document.querySelector('.topbar .search-box input');
    if (searchInput) {
        let debounceTimer;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                currentSearch = e.target.value.trim();
                loadPharmacyRequests(1);
            }, 500);
        });
    }
}

function initCreatePharmacyForm() {
    const createForm = document.getElementById('create-pharmacy-form');
    if (createForm) {
        createForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = createForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            
            try {
                submitBtn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Registering...';
                submitBtn.disabled = true;

                const formData = new FormData(createForm);
                const data = Object.fromEntries(formData.entries());

                await createPharmacy(data);
                
                alert('Pharmacy registered successfully!');
                closeCreateModal();
                loadPharmacyRequests(1);

            } catch (error) {
                console.error('[Create Pharmacy] Failed:', error);
                alert('Registration Failed: ' + (error.message || 'Check connection or data format.'));
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeCreateModal();
    });
}

function openCreateModal() {
    const modal = document.getElementById('create-pharmacy-modal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeCreateModal() {
    const modal = document.getElementById('create-pharmacy-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        document.getElementById('create-pharmacy-form')?.reset();
    }
}

function initFilterTabs() {
    const filterTabs = document.querySelectorAll('.filter-tab');
    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            loadPharmacyRequests(1);
        });
    });
}

async function loadPharmacyRequests(page = 1) {
    currentPage = page;
    const container = document.getElementById('pharmacy-requests-container');
    const paginationContainer = document.getElementById('pagination-container');
    const paginationButtons = document.getElementById('pagination-buttons');
    
    if (!container) return;

    const activeFilter = document.querySelector('.filter-tab.active')?.getAttribute('data-filter') || 'all';
    const statusParam = activeFilter === 'all' ? '' : activeFilter;

    container.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 40px;"><i class="bx bx-loader-alt bx-spin"></i> Loading pharmacy requests...</div>';
    if (paginationContainer) paginationContainer.style.opacity = '0.5';

    try {
        const response = await fetchPharmacies(page, PAGE_SIZE, currentSearch, statusParam);
        
        // Robust extraction pattern
        const dataRoot = response?.data || response;
        const pharmacies = Array.isArray(dataRoot) ? dataRoot : (dataRoot.items || dataRoot.pharmacies || dataRoot.content || []);
        
        const total = dataRoot.totalCount || dataRoot.total || dataRoot.recordsTotal || pharmacies.length;

        if (!pharmacies || pharmacies.length === 0) {
            container.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 40px;">No pharmacy requests found.</div>';
            updatePaginationInfo(0, page);
            if (paginationButtons) paginationButtons.innerHTML = '';
            return;
        }

        if (activeFilter === 'all') {
            // Render Table View
            container.className = 'table-container';
            container.style.display = 'block'; // Ensure it's not a grid
            
            container.innerHTML = `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Pharmacy Name</th>
                            <th>Registration Number</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${pharmacies.map(ph => {
                            const email = ph.email || (ph.ownerName && ph.ownerName.includes('@') ? ph.ownerName.split('/').pop() : 'N/A');
                            return `
                                <tr>
                                    <td>
                                        <div class="table-person">
                                            <div class="info">
                                                <span class="name">${ph.name || 'Unnamed Pharmacy'}</span>
                                                <span class="email">${email}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td><code>${ph.registrationNumber || ph.licenseNumber || 'N/A'}</code></td>
                                    <td><span class="status-badge ${getStatusClass(ph.status)}">${ph.status || 'Pending'}</span></td>
                                    <td>
                                        <div class="table-actions">
                                            <button class="action-btn edit" onclick="viewPharmacyDetails('${ph.id}')" title="Details"><i class='bx bx-show'></i></button>
                                            ${(ph.status === 'Pending' || ph.status === 'pending') ? `
                                                <button class="action-btn" style="background:#ccfbf1;color:#0d9488;" onclick="approvePharmacy('${ph.id}')" title="Approve"><i class='bx bx-check'></i></button>
                                                <button class="action-btn" style="background:#fee2e2;color:#e11d48;" onclick="rejectPharmacy('${ph.id}')" title="Reject"><i class='bx bx-x'></i></button>
                                            ` : ''}
                                        </div>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            `;
        } else {
            // Render Card View
            container.className = 'request-cards-grid';
            container.style.display = 'grid'; // Reset to grid
            
            container.innerHTML = pharmacies.map(ph => `
                <div class="request-card" data-status="${ph.status || 'pending'}">
                    <div class="request-card-header">
                        <div class="request-pharmacy-info">
                            <h3>${ph.name || 'Unnamed Pharmacy'}</h3>
                            <div class="owner"><i class='bx bx-user'></i> ${ph.ownerName || ph.owner || 'N/A'}</div>
                        </div>
                        <span class="status-badge ${getStatusClass(ph.status)}">${ph.status || 'Pending'}</span>
                    </div>
                    <div class="request-details-list">
                        <div class="request-detail-item">
                            <i class='bx bx-envelope'></i>
                            <div><p>${ph.email || (ph.ownerName && ph.ownerName.includes('@') ? ph.ownerName.split('/').pop() : 'N/A')}</p><span>Email Address</span></div>
                        </div>
                        <div class="request-detail-item">
                            <i class='bx bx-phone'></i>
                            <div><p>${ph.phone || 'N/A'}</p><span>Phone Number</span></div>
                        </div>
                        <div class="request-detail-item">
                            <i class='bx bx-map'></i>
                            <div><p>${ph.address || ph.location || 'N/A'}</p><span>Location</span></div>
                        </div>
                        <div class="request-detail-item">
                            <i class='bx bx-id-card'></i>
                            <div><p>${ph.registrationNumber || ph.licenseNumber || 'N/A'}</p><span>Registration Number</span></div>
                        </div>
                    </div>
                    <div class="request-card-actions">
                        <button class="btn-view" onclick="viewPharmacyDetails('${ph.id}')"><i class='bx bx-show'></i> Details</button>
                        ${ph.status === 'Pending' || ph.status === 'pending' ? `
                            <button class="btn-approve" onclick="approvePharmacy('${ph.id}')"><i class='bx bx-check'></i> Approve</button>
                            <button class="btn-reject" onclick="rejectPharmacy('${ph.id}')"><i class='bx bx-x'></i> Reject</button>
                        ` : ''}
                    </div>
                </div>
            `).join('');
        }

        updatePaginationInfo(total, page);
        renderPaginationButtons(total, page);
        if (paginationContainer) paginationContainer.style.opacity = '1';

    } catch (err) {
        console.error('Error loading requests:', err);
        container.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding: 40px; color: var(--danger);">Failed to load requests: ${err.message}</div>`;
    }
}

function getStatusClass(status) {
    status = status ? status.toLowerCase() : 'pending';
    if (status === 'approved' || status === 'active' || status === 'verified') return 'success';
    if (status === 'rejected' || status === 'suspended') return 'danger';
    return 'warning';
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

    let html = `<button class="page-btn ${currentPage === 1 ? 'disabled' : ''}" onclick="${currentPage === 1 ? '' : `loadPharmacyRequests(${currentPage - 1})`}"><i class='bx bx-chevron-left'></i></button>`;
    
    const range = 2;
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - range && i <= currentPage + range)) {
            html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="loadPharmacyRequests(${i})">${i}</button>`;
        } else if (i === currentPage - range - 1 || i === currentPage + range + 1) {
            html += `<span>...</span>`;
        }
    }

    html += `<button class="page-btn ${currentPage === totalPages ? 'disabled' : ''}" onclick="${currentPage === totalPages ? '' : `loadPharmacyRequests(${currentPage + 1})`}"><i class='bx bx-chevron-right'></i></button>`;
    
    container.innerHTML = html;
}

async function approvePharmacy(id) {
    if (confirm('Approve this pharmacy for operation?')) {
        try {
            await approvePharmacyApi(id);
            loadPharmacyRequests(currentPage);
            loadPharmacyStats();
        } catch (err) { alert('Approval failed: ' + err.message); }
    }
}

async function rejectPharmacy(id) {
    if (confirm('Confirm: Reject this pharmacy request?')) {
        try {
            await rejectPharmacyApi(id);
            loadPharmacyRequests(currentPage);
            loadPharmacyStats();
        } catch (err) { alert('Rejection failed: ' + err.message); }
    }
}

async function loadPharmacyStats() {
    const totalEl = document.getElementById('total-pharmacies-stat');
    const pendingEl = document.getElementById('pending-pharmacies-stat');
    const approvedEl = document.getElementById('approved-pharmacies-stat');
    const rejectedEl = document.getElementById('rejected-pharmacies-stat');

    if (!totalEl) return;

    try {
        const [allRes, pendingRes, approvedRes, rejectedRes] = await Promise.all([
            fetchPharmacies(1, 1, '', ''),
            fetchPharmacies(1, 1, '', 'Pending'),
            fetchPharmacies(1, 1, '', 'Active'),
            fetchPharmacies(1, 1, '', 'Rejected')
        ]);

        const getTotal = (res) => {
            const data = res?.data || res;
            return data.totalCount || data.total || data.recordsTotal || 0;
        };

        totalEl.textContent = getTotal(allRes);
        pendingEl.textContent = getTotal(pendingRes);
        approvedEl.textContent = getTotal(approvedRes);
        rejectedEl.textContent = getTotal(rejectedRes);
    } catch (error) {
        console.error('[Pharmacies] Failed to load stats:', error);
        totalEl.textContent = '-';
        pendingEl.textContent = '-';
        approvedEl.textContent = '-';
        rejectedEl.textContent = '-';
    }
}

function viewPharmacyDetails(id) {
    console.log('View details for pharmacy:', id);
}

async function submitSuspendPharmacy() {
    const id = document.getElementById('suspend-pharmacy-id').value.trim();
    if (!id) { alert('Please enter Pharmacy ID.'); return; }
    if (confirm('Are you sure you want to suspend this pharmacy?')) {
        try {
            await suspendPharmacyApi(id);
            alert('Pharmacy suspended successfully.');
            document.getElementById('suspend-pharmacy-id').value = '';
            loadPharmacyRequests(currentPage);
        } catch (err) {
            alert('Failed to suspend pharmacy: ' + err.message);
        }
    }
}
