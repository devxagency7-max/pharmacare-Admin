document.addEventListener('DOMContentLoaded', () => {
    loadNotificationHistory();
    initNotificationForm();
});

function toggleTargetFields() {
    const targetType = document.getElementById('notif-target-type').value;
    const audienceGroup = document.getElementById('group-audience');
    const userGroup = document.getElementById('group-userid');

    if (targetType === 'broadcast') {
        audienceGroup.style.display = 'flex';
        userGroup.style.display = 'none';
    } else {
        audienceGroup.style.display = 'none';
        userGroup.style.display = 'flex';
    }
}

// Global export for HTML onchange
window.toggleTargetFields = toggleTargetFields;

function initNotificationForm() {
    const form = document.getElementById('broadcast-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        const title = document.getElementById('notif-title').value;
        const body = document.getElementById('notif-message').value;
        const type = document.getElementById('notif-type').value;
        const targetType = document.getElementById('notif-target-type').value;

        if (!title || !body) {
            alert('Please enter both title and message.');
            return;
        }

        try {
            submitBtn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Sending...';
            submitBtn.disabled = true;

            let response;
            if (targetType === 'broadcast') {
                const role = document.getElementById('notif-audience').value;
                response = await createBroadcastNotification({
                    role,
                    title,
                    body,
                    type
                });
            } else {
                const userId = document.getElementById('notif-userid').value;
                if (!userId) {
                    alert('Please enter a Target User ID.');
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                    return;
                }
                response = await sendDirectNotification({
                    userId,
                    title,
                    body,
                    type
                });
            }

            alert('Notification sent successfully!');
            form.reset();
            toggleTargetFields();
            loadNotificationHistory();

        } catch (error) {
            console.error('[Notifications] Failed to send:', error);
            alert('Failed to send notification: ' + error.message);
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

async function loadNotificationHistory() {
    const tableBody = document.getElementById('notifications-requests-body');
    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 40px;"><i class="bx bx-loader-alt bx-spin"></i> Loading history...</td></tr>';

    try {
        const res = await fetchNotificationRequests(1, 10);
        const items = res.data?.items || res.items || [];

        if (items.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 40px; color: var(--text-muted);">No notification history found.</td></tr>';
            return;
        }

        tableBody.innerHTML = items.map(item => {
            const date = new Date(item.createdAt || item.timestamp).toLocaleString();
            const statusClass = (item.status || 'Sent').toLowerCase().includes('fail') ? 'danger' : 'success';
            
            return `
            <tr>
                <td>
                    <div style="font-weight:600; color:var(--text-main);">${item.title}</div>
                    <div style="font-size:12px; color:var(--text-muted); max-width:300px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${item.body}</div>
                </td>
                <td><span class="badge-type type-info">${item.type || 'Standard'}</span></td>
                <td><span style="font-size:13px; font-weight:500; color:var(--primary);">${item.role || item.userId || 'Global'}</span></td>
                <td><span style="font-size:13px; color:var(--text-muted);">${date}</span></td>
                <td><span class="status-badge ${statusClass}">${item.status || 'Delivered'}</span></td>
                <td>
                    <div class="table-actions">
                        <button class="action-btn view" title="View Details"><i class='bx bx-search-alt'></i></button>
                    </div>
                </td>
            </tr>`;
        }).join('');

    } catch (error) {
        console.error('[Notifications] Failed to load history:', error);
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 40px; color: var(--danger);">Failed to load history.</td></tr>';
    }
}
