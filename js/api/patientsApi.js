// Patients API hooks using centralized apiClient
async function fetchPatients(page = 1, pageSize = 20, search = '', status = '') {
    // Verified endpoint from Swagger: GET /admin/patients
    // Supports: status, search, page, pageSize
    let query = `page=${page}&pageSize=${pageSize}`;
    if (search) query += `&search=${encodeURIComponent(search)}`;
    if (status) query += `&status=${encodeURIComponent(status)}`;
    
    return await apiClient.get(`/admin/patients?${query}`);
}

async function fetchPatientById(id) {
    return await apiClient.get(`/admin/patients/${id}`);
}

async function updatePatientStatus(id, status) {
    return await apiClient.put(`/admin/patients/${id}/status`, { status });
}

async function deletePatient(id) {
    return await apiClient.delete(`/admin/patients/${id}`);
}

async function suspendPatientApi(id) {
    return await apiClient.suspendUser(id);
}

async function createPatient(patientData) {
    // Phase 1: Create Account in Firebase Auth
    const firebaseUser = await apiClient.registerFirebaseUser(patientData.email, patientData.password);
    
    // Phase 2: Sync with Platform Backend using multiple role formats for safety
    return await apiClient.post('/users/sync', {
        email: patientData.email,
        displayName: patientData.fullName,
        phoneNumber: patientData.phone,
        firebaseUid: firebaseUser.localId,
        role: 'Patient',      // Singular format
        roles: ['Patient'],   // Array format
        status: 'Active'      // Ensure they aren't created as 'Hidden'
    });
}
