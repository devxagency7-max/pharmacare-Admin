document.addEventListener('DOMContentLoaded', () => {
    loadNotificationRequests();
    initBroadcastForm();
});

async function loadNotificationRequests(page = 1) {
    const tableBody = document.getElementById('notifications-requests-body');
    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 40px;"><i class="bx bx-loader-alt bx-spin"></i> Loading requests...</td></tr>';

    try {
        const response = await fetchNotificationRequests(page, 20);
        const requests = Array.isArray(response) ? response : (response?.data?.items || response?.data || response?.requests || response?.content || []);
        
        if (!requests || requests.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 40px;">No pending notification requests.</td></tr>';
            return;
        }

        tableBody.innerHTML = requests.map(req => `
            <tr>
                <td style="max-width:300px;">
                    <div style="font-weight:600; color:var(--text-main);">${req.title || 'Untitled'}</div>
                    <p style="font-size:13px; color:var(--text-muted); margin-top:4px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                        ${req.message || req.body || 'No message content provided.'}
                    </p>
                </td>
                <td><span class="badge-type type-${(req.type || 'info').toLowerCase()}">${req.type || 'Info'}</span></td>
                <td><span style="text-transform: capitalize;">${req.targetAudience || req.target || 'All Users'}</span></td>
                <td>${req.createdAt ? new Date(req.createdAt).toLocaleString() : 'N/A'}</td>
                <td><span class="status-badge ${req.status === 'Approved' ? 'success' : 'warning'}">${req.status || 'Pending'}</span></td>
                <td>
                    <div class="table-actions">
                        ${req.status === 'Pending' ? `
                            <button class="action-btn edit" onclick="approveRequest('${req.id}')" title="Approve"><i class='bx bx-check'></i></button>
                            <button class="action-btn delete" onclick="rejectRequest('${req.id}')" title="Reject"><i class='bx bx-x'></i></button>
                        ` : `
                            <button class="action-btn view" title="Resend"><i class='bx bx-redo'></i></button>
                        `}
                    </div>
                </td>
            </tr>
        `).join('');

        updatePagination(total, page);
        renderPaginationButtons(total, page);

    } catch (error) {
        console.error('[Notifications] Failed to load:', error);
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 40px; color: var(--danger);">Failed to load requests. <button class="btn btn-sm btn-outline" onclick="loadNotificationRequests()">Retry</button></td></tr>`;
    }
}

function renderPaginationButtons(total, currentPage) {
    const container = document.querySelector('.pagination');
    if (!container) return;

    const totalPages = Math.ceil(total / 20);
    if (totalPages <= 1) {
        container.style.display = 'none';
        return;
    }
    container.style.display = 'flex';

    let html = `
        <button class="page-btn ${currentPage === 1 ? 'disabled' : ''}" onclick="${currentPage === 1 ? '' : `loadNotificationRequests(${currentPage - 1})`}">
            <i class='bx bx-chevron-left'></i>
        </button>
    `;

    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="loadNotificationRequests(${i})">${i}</button>`;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            html += `<span>...</span>`;
        }
    }

    html += `
        <button class="page-btn ${currentPage === totalPages ? 'disabled' : ''}" onclick="${currentPage === totalPages ? '' : `loadNotificationRequests(${currentPage + 1})`}">
            <i class='bx bx-chevron-right'></i>
        </button>
    `;
    container.innerHTML = html;
}

function initBroadcastForm() {
    const form = document.getElementById('broadcast-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const title = document.getElementById('notif-title').value;
        const message = document.getElementById('notif-message').value;

        if (!title || !message) {
            Swal.fire('Required Fields', 'Please enter both title and message.', 'warning');
            return;
        }

        const notificationData = {
            title,
            message,
            type: document.getElementById('notif-type').value,
            targetAudience: document.getElementById('notif-audience').value,
            deliveryMethod: document.getElementById('notif-delivery').value,
            scheduleTime: document.getElementById('notif-schedule').value || null
        };

        const confirmResult = await Swal.fire({
            title: 'Send Broadcast?',
            text: `This will send a notification to ${notificationData.targetAudience} via ${notificationData.deliveryMethod}.`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, Send Now'
        });

        if (confirmResult.isConfirmed) {
            try {
                const btn = form.querySelector('button[type="submit"]');
                const originalText = btn.innerHTML;
                btn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Processing...';
                btn.disabled = true;

                await createBroadcastNotification(notificationData);
                
                Swal.fire('Success!', 'Notification has been broadcasted successfully.', 'success');
                form.reset();
                loadNotificationRequests();
                
                btn.innerHTML = originalText;
                btn.disabled = false;
            } catch (err) {
                Swal.fire('Failed', err.message || 'Error occurred while broadcasting.', 'error');
            }
        }
    });
}

async function approveRequest(id) {
    const confirmResult = await Swal.fire({
        title: 'Approve Notification?',
        text: 'This will authorize the delivery of this message.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#10B981',
        confirmButtonText: 'Approve'
    });

    if (confirmResult.isConfirmed) {
        try {
            await approveNotificationRequest(id);
            Swal.fire('Approved!', 'The notification has been sent.', 'success');
            loadNotificationRequests();
        } catch (err) { Swal.fire('Error', 'Approval failed', 'error'); }
    }
}

async function rejectRequest(id) {
    const reason = prompt('Please enter rejection reason:');
    if (reason !== null) {
        try {
            await rejectNotificationRequest(id, reason);
            loadNotificationRequests();
        } catch (err) { alert('Rejection failed'); }
    }
}

async function loadNotificationsHistory() {
    console.log('[Notifications] Loading history via activity endpoint...');
    try {
        const response = await fetchAuditLogs(1, 10);
        const history = Array.isArray(response) ? response : (response?.data || []);
        console.log('[Notifications] History loaded:', history);
    } catch (err) {
        console.error('[Notifications] Error loading history:', err);
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
