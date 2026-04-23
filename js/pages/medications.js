document.addEventListener('DOMContentLoaded', () => {
    loadMedications();
    initMedSearch();
    initMedForm();
});

let medsState = {
    allMeds: [],
    searchQuery: ''
};

async function loadMedications() {
    const tableBody = document.getElementById('medications-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 30px;"><i class="bx bx-loader-alt bx-spin"></i> Loading catalog...</td></tr>';

    try {
        const res = await fetchDrugs();
        medsState.allMeds = res?.data?.items || res?.data || [];
        renderMedsTable(medsState.allMeds);
    } catch (err) {
        console.error('Failed to load meds:', err);
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color: var(--danger);">Failed to load data.</td></tr>';
    }
}

function renderMedsTable(meds) {
    const tableBody = document.getElementById('medications-table-body');
    if (!tableBody) return;

    if (meds.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 30px;">No medications found.</td></tr>';
        return;
    }

    tableBody.innerHTML = meds.map(med => `
        <tr>
            <td>
                <div class="med-img-cell">
                    <img src="${med.imageUrl || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(med.name) + '&background=random'}" alt="${med.name}">
                    <strong>${med.name}</strong>
                </div>
            </td>
            <td>${med.activeIngredient || 'N/A'}</td>
            <td>${med.form || ''} / ${med.dosage || ''}</td>
            <td><span class="status-badge ${med.isActive !== false ? 'success' : 'danger'}">${med.isActive !== false ? 'Active' : 'Inactive'}</span></td>
            <td>
                <div class="table-actions">
                    <button class="action-btn edit" onclick="editMed('${med.id}')"><i class='bx bx-edit-alt'></i></button>
                    <button class="action-btn delete" onclick="toggleMedStatus('${med.id}')"><i class='bx bx-power-off'></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

function initMedSearch() {
    const searchInput = document.getElementById('meds-search');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = medsState.allMeds.filter(m => 
            m.name.toLowerCase().includes(query) || 
            (m.activeIngredient && m.activeIngredient.toLowerCase().includes(query))
        );
        renderMedsTable(filtered);
    });
}

function initMedForm() {
    const form = document.getElementById('medication-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const payload = {
            name: document.getElementById('med-name').value,
            activeIngredient: document.getElementById('med-ingredient').value,
            form: document.getElementById('med-form').value,
            dosage: document.getElementById('med-dosage').value,
            imageUrl: document.getElementById('med-image-url').value,
            requiresPrescription: document.getElementById('med-rx').checked,
            isControlled: document.getElementById('med-controlled').checked
        };

        try {
            await createDrug(payload);
            alert('Medication saved successfully!');
            closeModal();
            loadMedications();
        } catch (err) {
            alert('Failed to save medication: ' + err.message);
        }
    });
}

async function handleImport(input) {
    if (!input.files || !input.files[0]) return;
    
    try {
        await importDrugs(input.files[0]);
        alert('Excel data imported successfully!');
        loadMedications();
    } catch (err) {
        alert('Import failed: ' + err.message);
    }
    input.value = ''; // Reset input
}

function openAddMedModal() {
    document.getElementById('medication-modal').classList.add('active');
}

function closeModal() {
    document.getElementById('medication-modal').classList.remove('active');
}
