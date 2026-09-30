// Pharmacies API hooks using centralized apiClient

async function fetchPharmacies(page = 1, pageSize = 20, search = '', status = '') {
    let query = `page=${page}&pageSize=${pageSize}`;
    if (search) query += `&search=${encodeURIComponent(search)}`;
    if (status) query += `&status=${encodeURIComponent(status)}`;
    return await apiClient.get(`/admin/pharmacies?${query}`);
}

// Backend: POST /admin/pharmacies — auto-generates owner email & password
// Returns: { pharmacyId, name, code, generatedEmail, generatedPassword }
// The generatedPassword is shown ONCE — display it immediately to the admin
async function createPharmacy(data) {
    const licenseVal = data.registrationNumber || data.code || data.licenseNumber || '';
    const payload = {
        name:               data.name        || '',
        code:               licenseVal,
        licenseNumber:      licenseVal,
        registrationNumber: licenseVal,
        governorate:        data.governorate || '',
        address:            data.address     || '',
        logoUrl:            typeof data.logoUrl === 'object' ? (data.logoUrl?.url || null) : (data.logoUrl || null),
        logoUploadedFileId: typeof data.logoUrl === 'object' ? (data.logoUrl?.id || null) : (data.logoUploadedFileId || null)
    };
    return await apiClient.post('/admin/pharmacies', payload);
}

async function fetchPharmacyById(id) {
    return await apiClient.get(`/admin/pharmacies/${id}`);
}

// NOTE: approve & reject are deprecated by backend (pharmacies are created Active).
// approve is still used here for "reactivate after suspend" flow.
async function approvePharmacyApi(id) {
    return await apiClient.put(`/admin/pharmacies/${id}/approve`, {});
}

async function rejectPharmacyApi(id) {
    return await apiClient.put(`/admin/pharmacies/${id}/reject`, {});
}

async function suspendPharmacyApi(id) {
    return await apiClient.put(`/admin/pharmacies/${id}/suspend`, {});
}

// Branches are included in GET /admin/pharmacies/:id under branches[]
// No separate branches endpoint exists under /admin — using detail endpoint instead
async function fetchPharmacyBranches(pharmacyId) {
    return await apiClient.get(`/admin/pharmacies/${pharmacyId}`);
}

// Admin reset owner password endpoint
async function resetPharmacyOwnerPassword(pharmacyId) {
    return await apiClient.post(`/admin/pharmacies/${pharmacyId}/reset-owner-password`, {});
}
