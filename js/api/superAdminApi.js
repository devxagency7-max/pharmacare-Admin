// ─── Super Admin API ──────────────────────────────────────────────────────────
// All endpoints under /api/v1/super-admin/* (SuperAdmin role required)

// ─── Admin Management ─────────────────────────────────────────────────────────

async function fetchAdmins(page = 1, pageSize = 20, search = '', status = '', role = '', isLocked = '') {
    let query = `page=${page}&pageSize=${pageSize}`;
    if (search) query += `&search=${encodeURIComponent(search)}`;
    if (status) query += `&status=${encodeURIComponent(status)}`;
    if (role) query += `&role=${encodeURIComponent(role)}`;
    if (isLocked !== '') query += `&isLocked=${isLocked}`;
    return await apiClient.get(`/super-admin/admins?${query}`);
}

async function fetchAdminById(id) {
    return await apiClient.get(`/super-admin/admins/${id}`);
}

async function fetchAdminActivity(adminUserId = '', action = '', from = '', to = '', page = 1, pageSize = 20) {
    let query = `page=${page}&pageSize=${pageSize}`;
    if (adminUserId) query += `&adminUserId=${adminUserId}`;
    if (action) query += `&action=${encodeURIComponent(action)}`;
    if (from) query += `&from=${encodeURIComponent(from)}`;
    if (to) query += `&to=${encodeURIComponent(to)}`;
    return await apiClient.get(`/super-admin/admins/activity?${query}`);
}

async function fetchAdminStats() {
    return await apiClient.get('/super-admin/stats');
}

async function promoteToAdmin(email) {
    return await apiClient.post('/super-admin/admins/promote', { email });
}

async function removeAdminRole(email) {
    return await apiClient.post('/super-admin/admins/remove', { email });
}

async function promoteToSuperAdmin(email) {
    return await apiClient.post('/super-admin/admins/promote-super-admin', { email });
}

async function removeSuperAdminRole(email) {
    return await apiClient.post('/super-admin/admins/remove-super-admin', { email });
}

async function lockAdmin(id) {
    return await apiClient.post(`/super-admin/admins/${id}/lock`, {});
}

async function unlockAdmin(id) {
    return await apiClient.post(`/super-admin/admins/${id}/unlock`, {});
}

async function suspendAdmin(id) {
    return await apiClient.post(`/super-admin/admins/${id}/suspend`, {});
}

async function reactivateAdmin(id) {
    return await apiClient.post(`/super-admin/admins/${id}/reactivate`, {});
}

async function resetAdminPassword(id) {
    return await apiClient.post(`/super-admin/admins/${id}/reset-password`, {});
}

// ─── Platform Configuration ───────────────────────────────────────────────────

async function fetchPlatformConfig() {
    return await apiClient.get('/super-admin/settings');
}

async function updatePlatformConfig(data) {
    return await apiClient.put('/super-admin/settings', data);
}

// ─── System Health ────────────────────────────────────────────────────────────

async function fetchSystemHealth() {
    return await apiClient.get('/super-admin/system-health');
}

// ─── Storage ──────────────────────────────────────────────────────────────────

async function fetchStorageStatus() {
    return await apiClient.get('/super-admin/storage');
}

// ─── Backups ──────────────────────────────────────────────────────────────────

async function fetchBackups() {
    return await apiClient.get('/super-admin/backups');
}

async function createBackup() {
    return await apiClient.post('/super-admin/backups/create', {});
}

async function restoreBackup(backupId, confirmationPhrase) {
    return await apiClient.post('/super-admin/backups/restore', { backupId, confirmationPhrase });
}

// ─── Integrations ─────────────────────────────────────────────────────────────

async function fetchIntegrations() {
    return await apiClient.get('/super-admin/integrations');
}
