// Settings API hooks using centralized apiClient

// Admin profile uses the shared /users/me endpoint (no separate /admin/profile exists)
async function fetchAdminProfile() {
    return await apiClient.get('/users/me');
}

async function updateAdminProfile(data) {
    return await apiClient.put('/users/me', data);
}

async function fetchSettings() {
    return await apiClient.get('/admin/settings');
}

async function updateSettings(data) {
    return await apiClient.put('/admin/settings', data);
}
