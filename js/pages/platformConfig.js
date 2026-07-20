const ALLOWED_FILE_TYPES = ['jpg', 'jpeg', 'png', 'pdf', 'gif', 'webp'];
let currentConfig = {};

document.addEventListener('DOMContentLoaded', () => {
    renderFileTypeChips();
    loadConfig();
});

function renderFileTypeChips() {
    const row = document.getElementById('file-types-row');
    row.innerHTML = ALLOWED_FILE_TYPES.map(type => `
        <label class="file-type-chip" id="chip-${type}">
            <input type="checkbox" value="${type}" onchange="updateChipStyle('${type}')">
            .${type}
        </label>`).join('');
}

function updateChipStyle(type) {
    const chip = document.getElementById(`chip-${type}`);
    const cb = chip.querySelector('input');
    chip.classList.toggle('active', cb.checked);
}

async function loadConfig() {
    document.getElementById('config-loading').style.display = '';
    document.getElementById('config-form').style.display = 'none';
    document.getElementById('save-bar').style.display = 'none';

    try {
        const res = await fetchPlatformConfig();
        currentConfig = res?.data || res;
        populateForm(currentConfig);
        document.getElementById('config-loading').style.display = 'none';
        document.getElementById('config-form').style.display = '';
        document.getElementById('save-bar').style.display = '';
    } catch (err) {
        document.getElementById('config-loading').innerHTML = `
        <i class='bx bx-error-circle' style="font-size:36px; color:var(--danger);"></i>
        <p style="color:var(--danger); font-weight:600; margin-top:12px;">Failed to load configuration</p>
        <p style="color:var(--text-muted); font-size:13px;">${err.message}</p>
        <button class="btn btn-outline" style="margin-top:16px;" onclick="loadConfig()">Try Again</button>`;
    }
}

function populateForm(cfg) {
    setToggle('cfg-requireAdminApproval', cfg.requireAdminApprovalForPharmacists);
    setToggle('cfg-allowPatientRegistration', cfg.allowPatientRegistration);
    setToggle('cfg-allowPharmacyRegistration', cfg.allowPharmacyRegistration);
    setToggle('cfg-maintenanceMode', cfg.maintenanceMode);
    setToggle('cfg-enableNotifications', cfg.enableNotifications);
    setToggle('cfg-enableAuditLogs', cfg.enableAuditLogs);

    setVal('cfg-maintenanceMessage', cfg.maintenanceMessage || '');
    setVal('cfg-defaultPaginationSize', cfg.defaultPaginationSize || 20);
    setVal('cfg-maximumUploadSize', cfg.maximumUploadSize || 5242880);
    setVal('cfg-maximumImageSize', cfg.maximumImageSize || 5242880);

    const allowedTypes = Array.isArray(cfg.allowedFileTypes) ? cfg.allowedFileTypes : [];
    ALLOWED_FILE_TYPES.forEach(type => {
        const chip = document.getElementById(`chip-${type}`);
        if (!chip) return;
        const cb = chip.querySelector('input');
        cb.checked = allowedTypes.includes(type);
        chip.classList.toggle('active', cb.checked);
    });
}

function setToggle(id, val) {
    const el = document.getElementById(id);
    if (el) el.checked = !!val;
}

function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val;
}

function buildPayload() {
    const selectedTypes = ALLOWED_FILE_TYPES.filter(type => {
        const chip = document.getElementById(`chip-${type}`);
        return chip && chip.querySelector('input').checked;
    });

    return {
        requireAdminApprovalForPharmacists: document.getElementById('cfg-requireAdminApproval').checked,
        allowPatientRegistration: document.getElementById('cfg-allowPatientRegistration').checked,
        allowPharmacyRegistration: document.getElementById('cfg-allowPharmacyRegistration').checked,
        maintenanceMode: document.getElementById('cfg-maintenanceMode').checked,
        maintenanceMessage: document.getElementById('cfg-maintenanceMessage').value.trim() || null,
        enableNotifications: document.getElementById('cfg-enableNotifications').checked,
        enableAuditLogs: document.getElementById('cfg-enableAuditLogs').checked,
        defaultPaginationSize: parseInt(document.getElementById('cfg-defaultPaginationSize').value) || 20,
        maximumUploadSize: parseInt(document.getElementById('cfg-maximumUploadSize').value) || 5242880,
        maximumImageSize: parseInt(document.getElementById('cfg-maximumImageSize').value) || 5242880,
        allowedFileTypes: selectedTypes,
    };
}

async function saveConfig() {
    const payload = buildPayload();

    if (payload.allowedFileTypes.length === 0) {
        Swal.fire('Validation Error', 'At least one file type must be allowed.', 'warning');
        return;
    }

    const saveBtn = document.getElementById('save-btn');
    saveBtn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Saving...';
    saveBtn.disabled = true;

    try {
        await updatePlatformConfig(payload);
        currentConfig = payload;

        const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
        Toast.fire({ icon: 'success', title: 'Configuration saved successfully.' });
    } catch (err) {
        Swal.fire('Save Failed', err.message || 'Could not save configuration.', 'error');
    } finally {
        saveBtn.innerHTML = '<i class="bx bx-save"></i> Save Configuration';
        saveBtn.disabled = false;
    }
}
