// Notifications Campaign API services using centralized apiClient

// Fetch notification campaign history with filters and pagination
async function fetchNotificationRequests(page = 1, pageSize = 20, filters = {}) {
    try {
        const queryParams = new URLSearchParams();
        queryParams.append('page', page);
        queryParams.append('pageSize', pageSize);
        
        if (filters.search) queryParams.append('search', filters.search);
        if (filters.status) queryParams.append('status', filters.status);
        if (filters.targetType) queryParams.append('targetType', filters.targetType);
        if (filters.category) queryParams.append('category', filters.category);

        return await apiClient.get(`/admin/notifications/campaigns?${queryParams.toString()}`);
    } catch (e) {
        console.error('[Notifications] Failed to fetch campaign history:', e.message);
        throw e;
    }
}

// Submit compose form: Save Draft, Schedule, Send Now.
// Action determines behavior: 'draft' | 'schedule' | 'send'
async function createNotificationCampaign(campaignData) {
    try {
        return await apiClient.post('/admin/notifications/campaigns', campaignData);
    } catch (e) {
        console.error('[Notifications] Failed to create campaign:', e.message);
        throw e;
    }
}

// Get details of a specific campaign
async function getNotificationCampaignDetails(id) {
    try {
        return await apiClient.get(`/admin/notifications/campaigns/${id}`);
    } catch (e) {
        console.error(`[Notifications] Failed to fetch details for campaign ${id}:`, e.message);
        throw e;
    }
}

// Cancel a scheduled campaign
async function cancelNotificationCampaign(id) {
    try {
        return await apiClient.post(`/admin/notifications/campaigns/${id}/cancel`, {});
    } catch (e) {
        console.error(`[Notifications] Failed to cancel campaign ${id}:`, e.message);
        throw e;
    }
}

// Resend an existing campaign immediately
async function resendNotificationCampaign(id) {
    try {
        return await apiClient.post(`/admin/notifications/campaigns/${id}/resend`, {});
    } catch (e) {
        console.error(`[Notifications] Failed to resend campaign ${id}:`, e.message);
        throw e;
    }
}

// Delete a campaign (Draft/Cancelled status only)
async function deleteNotificationCampaign(id) {
    try {
        return await apiClient.delete(`/admin/notifications/campaigns/${id}`);
    } catch (e) {
        console.error(`[Notifications] Failed to delete campaign ${id}:`, e.message);
        throw e;
    }
}

// --- LEGACY ENDPOINTS (kept for backward compatibility) ---
async function createBroadcastNotification(notificationData) {
    console.warn('[Notifications] Using legacy broadcast endpoint');
    return await apiClient.post('/admin/notifications/broadcast', notificationData);
}

async function sendDirectNotification(notificationData) {
    console.warn('[Notifications] Using legacy direct send endpoint');
    return await apiClient.post('/admin/notifications/send', notificationData);
}
