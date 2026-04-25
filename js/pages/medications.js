let medsState = {
    allMeds: [],
    searchQuery: '',
    editingId: null,
    currentPage: 1,
    pageSize: 20,
    totalCount: 0
};

document.addEventListener('DOMContentLoaded', () => {
    loadMedications();
    initMedSearch();
    initMedForm();
});

function resolveImageUrl(url, name) {
    if (!url || typeof url !== 'string' || url.startsWith('data:') || url.length > 2000) {
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=EAF2FE&color=0057d1&bold=true`;
    }
    return url.trim();
}

async function loadMedications(page = 1) {
    medsState.currentPage = page;
    const tableBody = document.getElementById('medications-table-body');
    if (!tableBody) return;
    tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 60px;"><i class="bx bx-loader-alt bx-spin" style="font-size: 32px; color: var(--primary);"></i><p style="margin-top: 10px; color: var(--text-muted);">Syncing catalog...</p></td></tr>';
    try {
        const res = await fetchDrugs(page, medsState.pageSize, medsState.searchQuery);
        const dataRoot = res?.data || res;
        const items = Array.isArray(dataRoot) ? dataRoot : (dataRoot.items || dataRoot.drugs || []);
        medsState.totalCount = dataRoot.totalCount || items.length;
        medsState.allMeds = items;
        renderMedsTable(items);
        updatePaginationInfo(medsState.totalCount, page);
    } catch (err) {
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 60px;">Failed to load.</td></tr>`;
    }
}

function renderMedsTable(meds) {
    const tableBody = document.getElementById('medications-table-body');
    if (!tableBody) return;
    tableBody.innerHTML = meds.map(med => {
        const status = med.isActive !== false ? 'Active' : 'Inactive';
        const statusClass = med.isActive !== false ? 'success' : 'danger';
        const avatarUrl = resolveImageUrl(med.imageUrl || med.imageURL, med.name);
        return `
            <tr>
                <td>
                    <div class="med-img-cell">
                        <img src="${avatarUrl}" onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(med.name)}&background=EAF2FE&color=0057d1&bold=true'" alt="${med.name}" style="width: 40px; height: 40px; border-radius: 8px; object-fit: cover;">
                        <div class="info">
                            <span class="name" style="font-weight: 600;">${med.name}</span>
                            <span class="id" style="font-size: 11px; color: var(--text-muted);">ID: ${med.id.substring(0, 8)}</span>
                        </div>
                    </div>
                </td>
                <td>${med.activeIngredient || 'N/A'}</td>
                <td>${med.dosage || ''} ${med.form || ''}</td>
                <td><span class="status-badge ${statusClass}">${status}</span></td>
                <td>
                    <div class="table-actions">
                        <button class="action-btn" style="background: #EAF2FE; color: #0057d1;" onclick="editMed('${med.id}')" title="Edit Properties"><i class='bx bx-edit-alt'></i></button>
                        <button class="action-btn" style="background: ${med.isActive !== false ? '#fee2e2' : '#ccfbf1'}; color: ${med.isActive !== false ? '#e11d48' : '#0d9488'};" onclick="toggleMedStatus('${med.id}')" title="${med.isActive !== false ? 'Deactivate' : 'Activate'}"><i class='bx ${med.isActive !== false ? 'bx-power-off' : 'bx-play'}'></i></button>
                        <button class="action-btn" style="background: #fee2e2; color: #ef4444;" onclick="deleteMed('${med.id}')" title="Delete Medication"><i class='bx bx-trash'></i></button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function initMedSearch() {
    const searchInput = document.getElementById('meds-search');
    if (!searchInput) return;
    let timer;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            medsState.searchQuery = e.target.value.trim();
            loadMedications(1);
        }, 500);
    });
}

function initMedForm() {
    const form = document.getElementById('medication-form');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const saveBtn = form.querySelector('button[type="submit"]');
        saveBtn.disabled = true;

        try {
            let imageUrl = document.getElementById('med-image-url').value.trim();
            
            // Validate URL if not empty
            if (imageUrl && !imageUrl.startsWith('http')) {
                throw new Error("Image URL must be a valid link starting with http:// or https://");
            }
            if (imageUrl.length > 2000) {
                throw new Error("Image URL is too long (max 2000 characters)");
            }

            const payload = {
                id: medsState.editingId || undefined,
                name: document.getElementById('med-name').value.trim(),
                activeIngredient: document.getElementById('med-ingredient').value.trim() || "",
                form: document.getElementById('med-form').value || "",
                dosage: String(document.getElementById('med-dosage').value).trim() || "",
                imageUrl: imageUrl || null,
                description: document.getElementById('med-description').value.trim() || "N/A",
                warnings: document.getElementById('med-warnings').value.trim() || "N/A",
                requiresPrescription: document.getElementById('med-rx').checked,
                isControlled: document.getElementById('med-controlled').checked,
                isSensitive: document.getElementById('med-sensitive').checked,
                isActive: true,
                synonyms: []
            };

            if (medsState.editingId) {
                const med = medsState.allMeds.find(m => String(m.id) === String(medsState.editingId));
                payload.isActive = med?.isActive ?? true;
                payload.synonyms = med?.synonyms ?? [];
                await updateDrug(medsState.editingId, payload);
            } else {
                await createDrug(payload);
            }
            
            Swal.fire({ icon: 'success', title: 'Saved successfully', timer: 1500, showConfirmButton: false });
            closeModal();
            loadMedications(medsState.currentPage);
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Save Failed', text: err.message });
        } finally {
            saveBtn.disabled = false;
        }
    });
}

async function toggleMedStatus(id) {
    try {
        Swal.fire({ title: 'Toggling...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });
        await toggleDrug(id);
        await loadMedications(medsState.currentPage);
        Swal.close();
    } catch (err) {
        Swal.fire('Error', err.message, 'error');
    }
}

function updateLivePreview() {
    const url = document.getElementById('med-image-url').value.trim();
    const container = document.getElementById('preview-container');
    const previewImg = document.getElementById('med-url-preview');
    
    if (url && url.startsWith('http')) {
        previewImg.src = url;
        container.style.display = 'block';
    } else {
        container.style.display = 'none';
        previewImg.src = '';
    }
}

function editMed(id) {
    const med = medsState.allMeds.find(m => String(m.id) === String(id));
    if (!med) return;
    medsState.editingId = id;
    
    document.getElementById('modal-title').innerText = "Edit Medication";
    document.getElementById('med-name').value = med.name || '';
    document.getElementById('med-ingredient').value = med.activeIngredient || '';
    document.getElementById('med-form').value = med.form || '';
    document.getElementById('med-dosage').value = med.dosage || '';
    
    const url = med.imageUrl || med.imageURL || '';
    // If old Base64 exists, clear it for the user to put a fresh link
    document.getElementById('med-image-url').value = (url.startsWith('http')) ? url : '';
    
    updateLivePreview(); // Update preview area

    document.getElementById('med-description').value = med.description || '';
    document.getElementById('med-warnings').value = med.warnings || '';
    document.getElementById('med-rx').checked = med.requiresPrescription || false;
    document.getElementById('med-controlled').checked = med.isControlled || false;
    document.getElementById('med-sensitive').checked = med.isSensitive || false;

    document.getElementById('medication-modal').classList.add('active');
}

function openAddMedModal() {
    medsState.editingId = null;
    document.getElementById('modal-title').innerText = "Register Medication";
    document.getElementById('medication-form').reset();
    document.getElementById('med-image-url').value = '';
    updateLivePreview(); // Clear preview
    document.getElementById('medication-modal').classList.add('active');
}

function closeModal() {
    document.getElementById('medication-modal').classList.remove('active');
}

function updatePaginationInfo(total, page) {
    const pageInfo = document.querySelector('.page-info');
    if (pageInfo) {
        const from = total === 0 ? 0 : (page - 1) * medsState.pageSize + 1;
        const to = Math.min(page * medsState.pageSize, total);
        pageInfo.textContent = `Showing ${from} to ${to} of ${total} meds`;
    }
    renderPaginationButtons(total, page);
}

function renderPaginationButtons(total, currentPage) {
    const container = document.getElementById('pagination-buttons');
    if (!container) return;
    const totalPages = Math.ceil(total / medsState.pageSize);
    let html = '';
    for (let i = 1; i <= totalPages; i++) {
        html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="loadMedications(${i})">${i}</button>`;
    }
    container.innerHTML = html;
}

async function handleImport(input) {
    if (!input.files?.[0]) return;
    try {
        await importDrugs(input.files[0]);
        loadMedications(1);
    } catch (err) {
        Swal.fire('Import Failed', err.message, 'error');
    }
}

async function deleteMed(id) {
    const med = medsState.allMeds.find(m => String(m.id) === String(id));
    if (!med) return;

    const result = await Swal.fire({
        title: 'Are you sure?',
        text: `You are about to delete "${med.name}". This action cannot be undone!`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
        Swal.fire({ title: 'Deleting...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });
        try {
            await deleteDrug(id);
            await loadMedications(medsState.currentPage);
            Swal.fire({ icon: 'success', title: 'Deleted!', text: 'Medication has been removed.', timer: 1500, showConfirmButton: false });
        } catch (err) {
            Swal.fire('Error', err.message, 'error');
        }
    }
}

window.editMed = editMed;
window.toggleMedStatus = toggleMedStatus;
window.openAddMedModal = openAddMedModal;
window.handleImport = handleImport;
window.loadMedications = loadMedications;
window.closeModal = closeModal;
window.updateLivePreview = updateLivePreview;
window.deleteMed = deleteMed;
