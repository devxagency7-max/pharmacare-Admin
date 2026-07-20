// Intern Pharmacists API hooks using centralized apiClient

async function fetchInternPharmacists(page = 1, pageSize = 20, search = '', status = '') {
    let query = `page=${page}&pageSize=${pageSize}`;
    if (search) query += `&search=${encodeURIComponent(search)}`;
    if (status) query += `&status=${encodeURIComponent(status)}`;
    return await apiClient.get(`/admin/interns?${query}`);
}

async function fetchInternPharmacistApplications(page = 1, pageSize = 20) {
    return await apiClient.get(`/admin/applications?type=Intern&status=Pending&page=${page}&pageSize=${pageSize}`);
}

async function fetchRejectedInternApplications(page = 1, pageSize = 20) {
    return await apiClient.get(`/admin/applications?type=Intern&status=Rejected&page=${page}&pageSize=${pageSize}`);
}

async function fetchInternPharmacistById(id) {
    return await apiClient.get(`/admin/interns/${id}`);
}

async function fetchInternApplicationById(id) {
    return await apiClient.get(`/admin/applications/${id}`);
}

async function fetchInternApplicationByUserId(userId) {
    for (const status of ['Approved', 'Pending', 'Rejected']) {
        try {
            const res = await apiClient.get(`/admin/applications?type=Intern&status=${status}&pageSize=50`);
            const dataRoot = res?.data || res;
            const items = Array.isArray(dataRoot) ? dataRoot : (dataRoot.items || []);
            const match = items.find(a =>
                String(a.userId || a.applicantId) === String(userId) ||
                String(a.id) === String(userId)
            );
            if (match) return match;
        } catch { /* try next status */ }
    }
    return null;
}

// id here is the APPLICATION ID, not the user ID
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
    return await apiClient.suspendUser(id);
}

async function activateInternPharmacistApi(id) {
    return await apiClient.activateUser(id);
}

// NOTE: Admin cannot directly create intern pharmacists.
// They register via the mobile app and submit an application (ApplicationType.Intern).
// The admin then approves or rejects via the Applications tab.
