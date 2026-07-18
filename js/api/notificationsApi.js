// Notifications API hooks using centralized apiClient
//
// IMPORTANT — Backend does NOT have a notification approval workflow.
// Notifications are sent immediately. There is no pending/approve/reject queue.
// The functions below that are marked [NOT IMPLEMENTED] will 404 and are kept
// only as placeholders pending a backend decision.

// [NOT IMPLEMENTED] — No notification history endpoint exists yet in the backend.
// Returns an empty list silently so the page doesn't break.
async function fetchNotificationRequests(page = 1, pageSize = 20) {
    try {
        return await apiClient.get(`/admin/notification-requests?page=${page}&pageSize=${pageSize}`);
    } catch (e) {
        console.warn('[Notifications] History endpoint not available yet:', e.message);
        return { data: { items: [], totalCount: 0 } };
    }
}

// Sends to all users of a given role immediately.
// role must be a valid UserRole: Admin | Patient | Pharmacist | PharmacyIntern | PharmacyOwner
// NOTE: "All" is NOT a valid role value — backend will reject it. Ask backend for a broadcast-all option.
async function createBroadcastNotification(notificationData) {
    return await apiClient.post('/admin/notifications/broadcast', notificationData);
}

// Sends to one specific user by userId (Guid).
// Backend does NOT validate that userId exists — validate on the frontend before calling.
async function sendDirectNotification(notificationData) {
    return await apiClient.post('/admin/notifications/send', notificationData);
}

// [NOT IMPLEMENTED] — No notification request approval workflow exists in the backend.
async function approveNotificationRequest(id) {
    console.warn('[Notifications] approveNotificationRequest: endpoint not implemented by backend.');
    return await apiClient.put(`/admin/notification-requests/${id}/approve`);
}

// [NOT IMPLEMENTED] — No notification request rejection workflow exists in the backend.
async function rejectNotificationRequest(id, reason) {
    console.warn('[Notifications] rejectNotificationRequest: endpoint not implemented by backend.');
    return await apiClient.put(`/admin/notification-requests/${id}/reject`, { reason });
}

// [NOT IMPLEMENTED] — No delete notification endpoint exists in the backend.
async function deleteNotificationApi(id) {
    console.warn('[Notifications] deleteNotificationApi: endpoint not implemented by backend.');
    return await apiClient.delete(`/admin/notifications/${id}`);
}
