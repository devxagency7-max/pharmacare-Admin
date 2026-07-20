// ──────────────────────────────────────────────
// Application Review API
// Route: /api/v1/admin/applications
// ──────────────────────────────────────────────

async function fetchPendingApplications(type = 'Pharmacist') {
    return apiClient.get(`/admin/applications?type=${type}&status=Pending`);
}

async function fetchApplicationById(id) {
    return apiClient.get(`/admin/applications/${id}`);
}

async function approveApplication(id) {
    return apiClient.post(`/admin/applications/${id}/approve`, {});
}

// reason is required (3–500 chars)
async function rejectApplication(id, reason) {
    return apiClient.post(`/admin/applications/${id}/reject`, { reason });
}

// Intern routes (same logic, different path)
async function fetchPendingInterns() {
    return apiClient.get('/admin/applications?type=Intern&status=Pending');
}

async function approveIntern(id) {
    return apiClient.put(`/admin/interns/${id}/approve`, {});
}

async function rejectIntern(id, reason) {
    return apiClient.put(`/admin/interns/${id}/reject`, { reason });
}
