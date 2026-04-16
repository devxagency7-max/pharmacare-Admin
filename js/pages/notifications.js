document.addEventListener('DOMContentLoaded', () => {
    loadNotificationsHistory();

    const form = document.querySelector('form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            sendNotification();
        });
    }
});

async function loadNotificationsHistory() {
    console.log('[Notifications Page] Loading notification history...');
    try {
        const history = await fetchNotificationsHistory();
        console.log('[Notifications Page] History loaded', history);
    } catch (err) {
        console.error('Error loading notification history:', err);
    }
}

async function sendNotification() {
    console.log('[Notifications Page] Validating and sending notification...');
    const title = document.getElementById('notif-title')?.value;
    const message = document.getElementById('notif-message')?.value;
    const type = document.getElementById('notif-type')?.value;
    const audience = document.getElementById('notif-audience')?.value;
    const delivery = document.getElementById('notif-delivery')?.value;
    const schedule = document.getElementById('notif-schedule')?.value;

    const payload = {
        title,
        message,
        type,
        audience,
        deliveryMethod: delivery,
        scheduleTime: schedule || null
    };

    try {
        await createNotificationApi(payload);
        console.log('[Notifications Page] FCM Notification request sent.');
        // Clear form and refresh history
    } catch (err) {
        console.error('Error sending notification:', err);
    }
}
