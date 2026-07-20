// Pharmacists API hooks using centralized apiClient

async function fetchPharmacists(page = 1, pageSize = 20, search = '', status = '') {
    let query = `page=${page}&pageSize=${pageSize}`;
    if (search) query += `&search=${encodeURIComponent(search)}`;
    if (status) query += `&status=${encodeURIComponent(status)}`;
    return await apiClient.get(`/admin/pharmacists?${query}`);
}

async function fetchPharmacistApplications(page = 1, pageSize = 20) {
    return await apiClient.get(`/admin/applications?type=Pharmacist&status=Pending&page=${page}&pageSize=${pageSize}`);
}

async function fetchRejectedPharmacistApplications(page = 1, pageSize = 20) {
    return await apiClient.get(`/admin/applications?type=Pharmacist&status=Rejected&page=${page}&pageSize=${pageSize}`);
}

async function fetchPharmacistById(id) {
    return await apiClient.get(`/admin/pharmacists/${id}`);
}

async function fetchPharmacistApplicationById(id) {
    return await apiClient.get(`/admin/applications/${id}`);
}

// Approve/reject use /admin/applications/:id — NOT /admin/pharmacist/:id
async function approvePharmacist(id) {
    return await apiClient.post(`/admin/applications/${id}/approve`);
}

async function rejectPharmacist(id, reason) {
    return await apiClient.post(`/admin/applications/${id}/reject`, { reason: reason || 'Did not meet requirements.' });
}

async function deletePharmacist(id) {
    return await apiClient.delete(`/admin/pharmacists/${id}`);
}

// Backend field name is maxPatientsLimit (not maxPatients)
async function updateMaxPatientsLimit(id, limit) {
    return await apiClient.put(`/admin/pharmacists/${id}/max-patients`, {
        maxPatientsLimit: parseInt(limit)
    });
}

async function suspendPharmacistApi(id) {
    return await apiClient.suspendUser(id);
}

async function activatePharmacistApi(id) {
    return await apiClient.activateUser(id);
}
