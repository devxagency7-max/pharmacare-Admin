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
            // SAFE NAME LOGIC
            let displayName = patient.fullName || patient.name || 'Unknown Patient';
            if (displayName.includes('/') && displayName.includes('@')) {
                displayName = displayName.split('/').pop().split('@')[0];
            }

            return `
            <tr>
                <td>
                    <div class="table-person">
                        <img src="${patient.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=E1F0F8&color=0D8ABC`}"
                            alt="${displayName}">
                        <div class="info">
                            <span class="name" style="font-weight: 600;">${displayName}</span>
                            <span class="email" style="font-size: 12px; opacity: 0.7;">${patient.email || 'N/A'}</span>
                        </div>
                    </div>
                </td>
                <td>#PT-${String(patient.id || '').padStart(5, '0')}</td>
                <td>${patient.phone || patient.phoneNumber || 'N/A'}</td>
                <td>${patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : (patient.joinedDate ? new Date(patient.joinedDate).toLocaleDateString() : 'N/A')}</td>
                <td><span class="status-badge ${patient.isActive !== false ? 'success' : 'warning'}">${patient.isActive !== false ? 'Active' : 'Inactive'}</span></td>
                <td>
                    <div class="table-actions">
                        <button class="action-btn edit" onclick="editPatient('${patient.id}')" title="Edit"><i class='bx bx-edit-alt'></i></button>
                        <button class="action-btn delete" onclick="deletePatientConfirmation('${patient.id}')" title="Delete"><i class='bx bx-trash'></i></button>
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

    // Simple version: only show current, first, last and dots
    const range = 2; // numbers around current page
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

function editPatient(id) {
    console.log('[Patients] Edit action for ID:', id);
    // Modal logic would go here
}

async function deletePatientConfirmation(id) {
    if (confirm('Verify: Are you sure you want to permanently remove this patient from the records?')) {
        try {
            await deletePatient(id);
            loadPatients(currentPage);
        } catch (err) {
            alert('Action Failed: ' + err.message);
        }
    }
}

