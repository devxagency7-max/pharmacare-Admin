let currentPage = 1;
let currentSearch = '';
const PAGE_SIZE = 12;

document.addEventListener('DOMContentLoaded', () => {
    loadPharmacyStats();
    loadPharmacyRequests();
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

                // Upload logo if selected
                const logoInput = document.getElementById('logo-file-input');
                if (logoInput && logoInput.files[0]) {
                    submitBtn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Uploading Logo...';
                    data.logoUrl = await uploadLogoFile(logoInput.files[0]);
                }

                submitBtn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Registering...';
                const result = await createPharmacy(data);

                // Backend auto-generates owner credentials — display ONCE, never retrievable again
                const creds = result?.data || result;
                closeCreateModal();
                loadPharmacyRequests(1);

                if (creds.generatedEmail || creds.generatedPassword) {
                    showPharmacyCredentials(creds);
                } else {
                    alert('Pharmacy registered successfully!');
                }

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

function handleLogoSelect(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const preview = document.getElementById('logo-preview');
        const placeholder = document.getElementById('upload-placeholder');
        if (preview && placeholder) {
            preview.src = e.target.result;
            preview.style.display = 'block';
            placeholder.style.display = 'none';
        }
    };
    reader.readAsDataURL(file);
}

async function uploadLogoFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    const token = await apiClient.getAuthToken();
    const response = await fetch('/api/files/upload', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    });

    if (!response.ok) throw new Error('Logo upload failed');
    const result = await response.json();
    return result.url || result.data?.url || result.fileUrl; // Handle different API response structures
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



async function loadPharmacyRequests(page = 1) {
    currentPage = page;
    const tableBody = document.getElementById('pharmacy-table-body');
    const paginationContainer = document.getElementById('pagination-container');
    const paginationButtons = document.getElementById('pagination-buttons');
    
    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 40px;"><i class="bx bx-loader-alt bx-spin"></i> Loading pharmacies...</td></tr>';
    if (paginationContainer) paginationContainer.style.opacity = '0.5';

    try {
        const response = await fetchPharmacies(page, PAGE_SIZE, currentSearch, '');
        
        const dataRoot = response?.data || response;
        const pharmacies = Array.isArray(dataRoot) ? dataRoot : (dataRoot.items || dataRoot.pharmacies || dataRoot.content || []);
        const total = dataRoot.totalCount || dataRoot.total || dataRoot.recordsTotal || pharmacies.length;

        if (!pharmacies || pharmacies.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 40px;">No pharmacies found.</td></tr>';
            updatePaginationInfo(0, page);
            if (paginationButtons) paginationButtons.innerHTML = '';
            return;
        }

        tableBody.innerHTML = pharmacies.map(ph => {
            const email = ph.email || (ph.ownerName && ph.ownerName.includes('@') ? ph.ownerName.split('/').pop() : 'N/A');
            const status = ph.status || 'Active';
            const logo = getLogoUrl(ph);
            
            return `
                <tr>
                    <td>
                        <div class="user-info" style="display: flex; align-items: center; gap: 12px;">
                            <img src="${logo}" onerror="this.onerror=null; this.src='${getFallbackSvg(ph.name)}';" alt="Logo" style="width: 36px; height: 36px; border-radius: 8px; object-fit: cover; border: 1px solid rgba(0,0,0,0.05);">
                            <div class="info">
                                <span class="name" style="font-weight: 600; display: block;">${ph.name || 'Unnamed Pharmacy'}</span>
                                <span class="email" style="font-size:12px; opacity:0.7; display: block;">${email}</span>
                            </div>
                        </div>
                    </td>
                    <td><code>${ph.registrationNumber || ph.licenseNumber || 'N/A'}</code></td>
                    <td><span class="status-badge ${getStatusClass(status)}">${status}</span></td>
                    <td>
                        <div class="table-actions">
                            <button class="action-btn" style="background: #EAF2FE; color: #0057d1;" onclick="viewPharmacyDetails('${ph.id}')" title="Details"><i class='bx bx-show'></i></button>
                            ${status.toLowerCase() === 'suspended' ? `
                                <button class="action-btn" style="background: #ccfbf1; color: #0d9488;" onclick="activatePharmacyAction('${ph.id}')" title="Activate Pharmacy"><i class='bx bx-play-circle'></i></button>
                            ` : `
                                <button class="action-btn" style="background: #ffedd5; color: #f97316;" onclick="suspendPharmacyAction('${ph.id}')" title="Suspend Pharmacy"><i class='bx bx-pause-circle'></i></button>
                            `}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        updatePaginationInfo(total, page);
        renderPaginationButtons(total, page);
        if (paginationContainer) paginationContainer.style.opacity = '1';

    } catch (err) {
        console.error('Error loading pharmacies:', err);
        tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 40px; color: var(--danger);">Error: ${err.message}</td></tr>`;
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



async function loadPharmacyStats() {
    const totalEl = document.getElementById('total-pharmacies-stat');

    if (!totalEl) return;

    try {
        const allRes = await fetchPharmacies(1, 1, '', '');

        const getTotal = (res) => {
            const data = res?.data || res;
            return data.totalCount || data.total || data.recordsTotal || 0;
        };

        totalEl.textContent = getTotal(allRes);
    } catch (error) {
        console.error('[Pharmacies] Failed to load stats:', error);
        totalEl.textContent = '-';
    }
}

function viewPharmacyDetails(id) {
    const modal = document.getElementById('view-pharmacy-modal');
    const content = document.getElementById('pharmacy-details-content');
    if (!modal || !content) return;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    content.innerHTML = `
        <div style="text-align: center; padding: 40px;">
            <i class="bx bx-loader-alt bx-spin" style="font-size: 40px; color: var(--primary);"></i>
            <p>Fetching full profile...</p>
        </div>
    `;

    fetchPharmacyById(id).then(response => {
        const ph = response?.data || response;
        const logo = getLogoUrl(ph);
        
        content.innerHTML = `
            <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 25px; padding-bottom: 20px; border-bottom: 1px solid rgba(0,0,0,0.05);">
                <img src="${logo}" onerror="this.onerror=null; this.src='${getFallbackSvg(ph.name)}';" alt="Logo" style="width: 80px; height: 80px; border-radius: 12px; object-fit: cover; border: 1px solid rgba(0,0,0,0.1); box-shadow: var(--shadow-sm);">
                <div>
                    <h3 style="margin: 0; font-size: 20px; color: var(--primary);">${ph.name || 'Unnamed'}</h3>
                    <p style="margin: 5px 0 0; font-size: 14px; color: var(--text-muted);">${ph.governorate || 'Location not specified'}</p>
                </div>
            </div>
            <div class="details-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div class="detail-item">
                    <label style="display: block; font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">ID</label>
                    <div style="font-weight: 500; word-break: break-all;">${ph.id || 'N/A'}</div>
                </div>
                <div class="detail-item">
                    <label style="display: block; font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Pharmacy Name</label>
                    <div style="font-weight: 600; color: var(--primary);">${ph.name || 'Unnamed'}</div>
                </div>
                <div class="detail-item">
                    <label style="display: block; font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">License Number</label>
                    <div style="font-weight: 500;">${ph.registrationNumber || ph.licenseNumber || 'N/A'}</div>
                </div>
                <div class="detail-item">
                    <label style="display: block; font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Status</label>
                    <div><span class="status-badge ${getStatusClass(ph.status)}">${ph.status || 'Active'}</span></div>
                </div>
                <div class="detail-item">
                    <label style="display: block; font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Phone Number</label>
                    <div style="font-weight: 500;">${ph.phone || 'N/A'}</div>
                </div>
                <div class="detail-item">
                    <label style="display: block; font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Email</label>
                    <div style="font-weight: 500;">${ph.email || 'N/A'}</div>
                </div>
                <div class="detail-item">
                    <label style="display: block; font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Governorate</label>
                    <div style="font-weight: 500;">${ph.governorate || 'N/A'}</div>
                </div>
                <div class="detail-item" style="grid-column: span 2;">
                    <label style="display: block; font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Address</label>
                    <div style="font-weight: 500; background: var(--bg-main); padding: 10px; border-radius: 8px;">${ph.address || 'No address provided.'}</div>
                </div>
                <div class="detail-item">
                    <label style="display: block; font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Branches Count</label>
                    <div style="font-weight: 500;">${ph.branchCount || 0}</div>
                </div>
                <div class="detail-item">
                    <label style="display: block; font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Created At</label>
                    <div style="font-weight: 500;">${ph.createdAt ? new Date(ph.createdAt).toLocaleString() : 'N/A'}</div>
                </div>
                <div class="detail-item">
                    <label style="display: block; font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Currently Open</label>
                    <div><span class="status-badge ${ph.isOpen ? 'success' : 'danger'}">${ph.isOpen ? 'Open' : 'Closed'}</span></div>
                </div>
                ${ph.workingHoursDescription ? `
                <div class="detail-item" style="grid-column: span 2;">
                    <label style="display: block; font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Working Hours</label>
                    <div style="font-weight: 500; background: var(--bg-main); padding: 10px; border-radius: 8px;">${ph.workingHoursDescription}</div>
                </div>` : ''}
            </div>
        `;
    }).catch(err => {
        content.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--danger);">
                <i class="bx bx-error-circle" style="font-size: 40px;"></i>
                <p>Failed to load pharmacy details.</p>
                <p style="font-size: 12px; opacity: 0.7;">${err.message}</p>
            </div>
        `;
    });
}

function closeViewModal() {
    const modal = document.getElementById('view-pharmacy-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}


async function activatePharmacyAction(id) {
    if (confirm('Reactivate this pharmacy? it will be visible to patients again.')) {
        try {
            await approvePharmacyApi(id);
            alert('Pharmacy reactivated successfully.');
            loadPharmacyRequests(currentPage);
        } catch (err) {
            alert('Activation failed: ' + err.message);
        }
    }
}

async function suspendPharmacyAction(id) {
    if (confirm('Are you sure you want to SUSPEND this pharmacy? It will be hidden from the platform.')) {
        try {
            await suspendPharmacyApi(id);
            alert('Pharmacy suspended successfully.');
            loadPharmacyRequests(currentPage);
        } catch (err) {
            alert('Suspension failed: ' + err.message);
        }
    }
}

// Shows the auto-generated pharmacy owner credentials.
// These are returned ONCE from the backend and are never stored or re-retrievable.
function showPharmacyCredentials(creds) {
    const existing = document.getElementById('pharmacy-credentials-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'pharmacy-credentials-modal';
    modal.style.cssText = `
        position:fixed; inset:0; background:rgba(0,0,0,0.6);
        display:flex; align-items:center; justify-content:center; z-index:9999;
    `;

    modal.innerHTML = `
        <div style="background:#fff; border-radius:16px; padding:36px; max-width:480px; width:90%; box-shadow:0 20px 60px rgba(0,0,0,0.2);">
            <div style="display:flex; align-items:center; gap:12px; margin-bottom:20px;">
                <div style="width:44px;height:44px;border-radius:12px;background:#FEF3C7;display:flex;align-items:center;justify-content:center;">
                    <i class='bx bx-key' style="font-size:22px;color:#D97706;"></i>
                </div>
                <div>
                    <h3 style="margin:0;font-size:18px;color:#0f172a;">Pharmacy Created Successfully</h3>
                    <p style="margin:4px 0 0;font-size:13px;color:#64748b;">Save these credentials — they will <strong>never</strong> be shown again.</p>
                </div>
            </div>

            <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:20px;margin-bottom:20px;">
                <div style="margin-bottom:14px;">
                    <label style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.5px;font-weight:700;display:block;margin-bottom:6px;">Owner Login Email</label>
                    <div style="display:flex;align-items:center;gap:8px;">
                        <code id="cred-email" style="flex:1;background:#fff;border:1px solid #E2E8F0;border-radius:6px;padding:8px 12px;font-size:13px;color:#0f172a;word-break:break-all;">${creds.generatedEmail || 'N/A'}</code>
                        <button onclick="navigator.clipboard.writeText('${creds.generatedEmail || ''}');this.innerHTML='<i class=\\'bx bx-check\\'></i>';setTimeout(()=>this.innerHTML='<i class=\\'bx bx-copy\\'></i>',1500);"
                            style="padding:8px;border:1px solid #E2E8F0;border-radius:6px;background:#fff;cursor:pointer;color:#64748b;">
                            <i class='bx bx-copy'></i>
                        </button>
                    </div>
                </div>
                <div>
                    <label style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.5px;font-weight:700;display:block;margin-bottom:6px;">Owner Password</label>
                    <div style="display:flex;align-items:center;gap:8px;">
                        <code id="cred-pass" style="flex:1;background:#fff;border:1px solid #E2E8F0;border-radius:6px;padding:8px 12px;font-size:13px;color:#0f172a;word-break:break-all;">${creds.generatedPassword || 'N/A'}</code>
                        <button onclick="navigator.clipboard.writeText('${creds.generatedPassword || ''}');this.innerHTML='<i class=\\'bx bx-check\\'></i>';setTimeout(()=>this.innerHTML='<i class=\\'bx bx-copy\\'></i>',1500);"
                            style="padding:8px;border:1px solid #E2E8F0;border-radius:6px;background:#fff;cursor:pointer;color:#64748b;">
                            <i class='bx bx-copy'></i>
                        </button>
                    </div>
                </div>
            </div>

            <div style="background:#FEF3C7;border-radius:8px;padding:12px 16px;margin-bottom:20px;display:flex;gap:8px;align-items:flex-start;">
                <i class='bx bx-error' style="color:#D97706;font-size:18px;margin-top:1px;"></i>
                <p style="margin:0;font-size:13px;color:#92400E;line-height:1.5;">Share these credentials with the pharmacy owner immediately. Once you close this dialog, <strong>they cannot be recovered</strong>.</p>
            </div>

            <button onclick="document.getElementById('pharmacy-credentials-modal').remove();"
                style="width:100%;padding:12px;background:#0057d1;color:#fff;border:none;border-radius:10px;font-size:15px;font-weight:600;cursor:pointer;">
                I have saved the credentials
            </button>
        </div>
    `;

    document.body.appendChild(modal);
}

function getLogoUrl(ph) {
    const defaultFallback = getFallbackSvg(ph?.name);
    
    if (!ph || !ph.logoUrl) {
        return defaultFallback;
    }
    
    let url = ph.logoUrl.trim();
    if (url === '' || url === 'string') {
        return defaultFallback;
    }
    
    // Replace old server IP with the new one if present
    if (url.includes('148.230.114.124:8080')) {
        url = url.replace('148.230.114.124:8080', '204.168.149.185');
    }
    
    // Convert relative URLs to absolute using new backend server base
    const backendHost = 'http://204.168.149.185';
    if (url.startsWith('/')) {
        url = `${backendHost}${url}`;
    } else if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('data:')) {
        url = `${backendHost}/${url}`;
    }
    
    return url;
}

function getFallbackSvg(name) {
    const char = (name || 'P').charAt(0).toUpperCase();
    return `data:image/svg+xml;utf8,<svg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 width=%27100%27 height=%27100%27><rect width=%27100%25%27 height=%27100%25%27 fill=%27%23EAF2FE%27/><text x=%2750%25%27 y=%2750%25%27 dominant-baseline=%27middle%27 text-anchor=%27middle%27 font-family=%27sans-serif%27 font-size=%2714%27 font-weight=%27bold%27 fill=%27%230057d1%27>${encodeURIComponent(char)}</text></svg>`;
}
