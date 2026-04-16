const API_BASE_URL = '/api/admin';

// Notifications API hooks for FCM Backend Integration
async function fetchNotificationsHistory() {
    console.log(`GET ${API_BASE_URL}/notifications`);
    return [];
}

async function createNotificationApi(notificationData) {
    console.log(`POST ${API_BASE_URL}/notifications`, notificationData);
    /*
    const response = await fetch(`${API_BASE_URL}/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notificationData)
    });
    return await response.json();
    */
}

async function updateNotificationApi(id, notificationData) {
    console.log(`PUT ${API_BASE_URL}/notifications/${id}`, notificationData);
}

async function deleteNotificationApi(id) {
    console.log(`DELETE ${API_BASE_URL}/notifications/${id}`);
}
