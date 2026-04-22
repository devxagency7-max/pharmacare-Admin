// Settings API hooks using centralized apiClient
async function fetchAdminProfile() {
    return await apiClient.get('/admin/profile');
}

async function updateAdminProfile(data) {
    return await apiClient.put('/admin/profile', data);
}

async function fetchSettings() {
    return await apiClient.get('/admin/settings');
}

async function updateSettings(data) {
    return await apiClient.put('/admin/settings', data);
}
