// ──────────────────────────────────────────────
// Section 1 — My Profile
// ──────────────────────────────────────────────
async function fetchAdminProfile() {
    return apiClient.get('/admin/settings/profile');
}

async function updateAdminProfile(data) {
    return apiClient.put('/admin/settings/profile', data);
}

// ──────────────────────────────────────────────
// Section 2 — Security
// ──────────────────────────────────────────────
async function fetchSecuritySettings() {
    return apiClient.get('/admin/settings/security');
}

async function updateSecuritySettings(data) {
    return apiClient.put('/admin/settings/security', data);
}

// ──────────────────────────────────────────────
// Section 3 — Notifications
// ──────────────────────────────────────────────
async function fetchNotificationSettings() {
    return apiClient.get('/admin/settings/notifications');
}

async function updateNotificationSettings(data) {
    return apiClient.put('/admin/settings/notifications', data);
}

// ──────────────────────────────────────────────
// Section 4 — Regional
// ──────────────────────────────────────────────
async function fetchRegionalSettings() {
    return apiClient.get('/admin/settings/regional');
}

async function updateRegionalSettings(data) {
    return apiClient.put('/admin/settings/regional', data);
}

// ──────────────────────────────────────────────
// Section 6 — Storage (SuperAdmin, read-only)
// ──────────────────────────────────────────────
async function fetchStorageSettings() {
    return apiClient.get('/super-admin/storage');
}
