// Pharmacies API hooks using centralized apiClient
async function fetchPharmacies(page = 1, pageSize = 20, search = '', status = '') {
    let query = `page=${page}&pageSize=${pageSize}`;
    if (search) query += `&search=${encodeURIComponent(search)}`;
    if (status) query += `&status=${encodeURIComponent(status)}`;
    
    return await apiClient.get(`/admin/pharmacies?${query}`);
}

async function createPharmacy(data) {
    // Verified endpoint from latest Swagger screenshot: POST /pharmacies
    // (Note: This is different from the GET /admin/pharmacies endpoint)
    console.log('[Pharmacy] Creating with payload:', data);
    return await apiClient.post('/pharmacies', data);
}

async function fetchPharmacyById(id) {
    return await apiClient.get(`/admin/pharmacies/${id}`);
}

async function approvePharmacyApi(id) {
    return await apiClient.put(`/admin/pharmacies/${id}/approve`);
}

async function rejectPharmacyApi(id) {
    return await apiClient.put(`/admin/pharmacies/${id}/reject`);
}

async function suspendPharmacyApi(id) {
    return await apiClient.put(`/admin/pharmacies/${id}/suspend`);
}
