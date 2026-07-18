// Patients API hooks using centralized apiClient

async function fetchPatients(page = 1, pageSize = 20, search = '', status = '') {
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

// NOTE: Admin cannot directly create patients.
// Patients register themselves via the mobile app using Firebase Auth.
// The backend syncs them automatically on first login via POST /users/sync.
