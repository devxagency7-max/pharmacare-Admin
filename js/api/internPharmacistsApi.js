// Intern Pharmacists API hooks using centralized apiClient
async function fetchInternPharmacists(page = 1, pageSize = 20, search = '', status = '') {
    let query = `page=${page}&pageSize=${pageSize}`;
    if (search) query += `&search=${encodeURIComponent(search)}`;
    if (status) query += `&status=${encodeURIComponent(status)}`;
    
    return await apiClient.get(`/admin/interns?${query}`);
}

async function fetchInternPharmacistApplications(page = 1, pageSize = 20) {
    // Correct endpoint per API docs: /admin/applications?type=Intern
    return await apiClient.get(`/admin/applications?type=Intern&page=${page}&pageSize=${pageSize}`);
}

async function createInternPharmacist(data) {
    // Phase 1: Create Account in Firebase Auth
    const firebaseUser = await apiClient.registerFirebaseUser(data.email, data.password);
    
    // Phase 2: Sync with Platform Backend
    return await apiClient.post('/users/sync', {
        email: data.email,
        displayName: data.fullName,
        phoneNumber: data.phone,
        firebaseUid: firebaseUser.localId,
        role: 'Intern',      // Singular format
        roles: ['Intern'],   // Array format
        status: 'Active'     // Ensure visibility
    });
}

async function approveIntern(id) {
    return await apiClient.put(`/admin/interns/${id}/approve`);
}

async function rejectIntern(id) {
    return await apiClient.put(`/admin/interns/${id}/reject`);
}

async function deleteInternPharmacist(id) {
    return await apiClient.delete(`/admin/intern-pharmacists/${id}`);
}

async function suspendInternPharmacistApi(id) {
    return await apiClient.put(`/admin/intern-pharmacists/${id}/suspend`, {});
}
