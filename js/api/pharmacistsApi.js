// Pharmacists API hooks using centralized apiClient
async function fetchPharmacists(page = 1, pageSize = 20, search = '', status = '') {
    let query = `page=${page}&pageSize=${pageSize}`;
    if (search) query += `&search=${encodeURIComponent(search)}`;
    if (status) query += `&status=${encodeURIComponent(status)}`;
    
    return await apiClient.get(`/admin/pharmacists?${query}`);
}

async function createPharmacist(data) {
    // Phase 1: Create Account in Firebase Auth
    const firebaseUser = await apiClient.registerFirebaseUser(data.email, data.password);
    
    // Phase 2: Sync with Platform Backend
    return await apiClient.post('/users/sync', {
        email: data.email,
        displayName: data.fullName,
        phoneNumber: data.phone,
        firebaseUid: firebaseUser.localId, // Correct field name
        roles: ['Pharmacist']
    });
}

async function fetchPharmacistApplications(page = 1, pageSize = 20) {
    return await apiClient.get(apiClient.paginate('/admin/pharmacist-applications', page, pageSize));
}

async function approvePharmacist(id) {
    return await apiClient.post(`/admin/pharmacist/${id}/approve`);
}

async function rejectPharmacist(id, reason) {
    return await apiClient.post(`/admin/pharmacist/${id}/reject`, { reason });
}

async function deletePharmacist(id) {
    return await apiClient.delete(`/admin/pharmacists/${id}`);
}
