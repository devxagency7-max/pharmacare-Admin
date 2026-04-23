// Notifications API hooks using centralized apiClient
async function fetchNotificationRequests(page = 1, pageSize = 20) {
    // Try notification requests, fall back gracefully if 404
    try {
        return await apiClient.get(`/admin/notification-requests?page=${page}&pageSize=${pageSize}`);
    } catch (e) {
        console.warn('[Notifications] Endpoint not available:', e.message);
        return { data: { items: [], totalCount: 0 } };
    }
}

async function createBroadcastNotification(notificationData) {
    return await apiClient.post('/admin/notifications/broadcast', notificationData);
}

async function sendDirectNotification(notificationData) {
    return await apiClient.post('/admin/notifications/send', notificationData);
}

async function approveNotificationRequest(id) {
    return await apiClient.put(`/admin/notification-requests/${id}/approve`);
}

async function rejectNotificationRequest(id, reason) {
    return await apiClient.put(`/admin/notification-requests/${id}/reject`, { reason });
}

async function deleteNotificationApi(id) {
    return await apiClient.delete(`/admin/notifications/${id}`);
}
