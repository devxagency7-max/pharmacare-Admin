let currentPage = 1;
const pageSize = 10;
const filters = {
    search: '',
    status: '',
    targetType: '',
    category: ''
};

document.addEventListener('DOMContentLoaded', () => {
    loadNotificationHistory();
    initNotificationForm();
    initFilterHandlers();
    initModalHandlers();
});

function toggleTargetFields() {
    const targetType = document.getElementById('notif-target-type').value;
    const audienceGroup = document.getElementById('group-audience');
    const userGroup = document.getElementById('group-userid');

    if (targetType === 'All') {
        audienceGroup.style.display = 'none';
        userGroup.style.display = 'none';
    } else if (targetType === 'Role') {
        audienceGroup.style.display = 'flex';
        userGroup.style.display = 'none';
    } else if (targetType === 'SpecificUser') {
        audienceGroup.style.display = 'none';
        userGroup.style.display = 'flex';
    }
}

// Global export for HTML onchange
window.toggleTargetFields = toggleTargetFields;

function initNotificationForm() {
    const btnDraft = document.getElementById('btn-draft');
    const btnSchedule = document.getElementById('btn-schedule');
    const btnSend = document.getElementById('btn-send');

    if (btnDraft) btnDraft.addEventListener('click', () => submitCampaign('draft'));
    if (btnSchedule) btnSchedule.addEventListener('click', () => submitCampaign('schedule'));
    if (btnSend) btnSend.addEventListener('click', () => submitCampaign('send'));
}

async function submitCampaign(action) {
    const title = document.getElementById('notif-title').value.trim();
    const body = document.getElementById('notif-message').value.trim();
    const targetType = document.getElementById('notif-target-type').value;
    const category = document.getElementById('notif-type').value;
    const deliveryMethod = document.getElementById('notif-delivery').value;
    const scheduledAtInput = document.getElementById('notif-schedule').value;

    if (!title || !body) {
        Swal.fire('Validation Error', 'Please fill in both the title and body fields.', 'error');
        return;
    }

    const payload = {
        title,
        body,
        targetType,
        category,
        deliveryMethod,
        action
    };

    if (targetType === 'Role') {
        payload.targetRole = document.getElementById('notif-audience').value;
        if (!payload.targetRole) {
            Swal.fire('Validation Error', 'Please select a target role.', 'error');
            return;
        }
    } else if (targetType === 'SpecificUser') {
        payload.targetUserId = document.getElementById('notif-userid').value.trim();
        if (!payload.targetUserId) {
            Swal.fire('Validation Error', 'Please enter a target User ID.', 'error');
            return;
        }
        // Basic GUID regex check
        const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!guidRegex.test(payload.targetUserId)) {
            Swal.fire('Validation Error', 'Target User ID must be a valid GUID format.', 'error');
            return;
        }
    }

    if (action === 'schedule') {
        if (!scheduledAtInput) {
            Swal.fire('Validation Error', 'Please specify a schedule time.', 'error');
            return;
        }
        const schedDate = new Date(scheduledAtInput);
        if (schedDate <= new Date()) {
            Swal.fire('Validation Error', 'Scheduled time must be in the future.', 'error');
            return;
        }
        payload.scheduledAt = schedDate.toISOString();
    }

    let btnId = '';
    if (action === 'draft') btnId = 'btn-draft';
    else if (action === 'schedule') btnId = 'btn-schedule';
    else if (action === 'send') btnId = 'btn-send';

    const actionBtn = document.getElementById(btnId);
    const originalHtml = actionBtn ? actionBtn.innerHTML : '';

    try {
        if (actionBtn) {
            actionBtn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Processing...';
            actionBtn.disabled = true;
        }

        await createNotificationCampaign(payload);

        Swal.fire({
            title: 'Success!',
            text: `Campaign successfully ${action === 'draft' ? 'saved as draft' : action === 'schedule' ? 'scheduled' : 'sent'}!`,
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
        });

        // Reset form
        document.getElementById('broadcast-form').reset();
        toggleTargetFields();
        currentPage = 1;
        loadNotificationHistory();

    } catch (err) {
        Swal.fire('Error', 'Failed to process campaign: ' + err.message, 'error');
    } finally {
        if (actionBtn) {
            actionBtn.innerHTML = originalHtml;
            actionBtn.disabled = false;
        }
    }
}

function initFilterHandlers() {
    let searchDebounceTimeout;
    const historySearch = document.getElementById('history-search');
    const filterStatus = document.getElementById('filter-status');
    const filterTargetType = document.getElementById('filter-target-type');
    const filterCategory = document.getElementById('filter-category');

    if (historySearch) {
        historySearch.addEventListener('input', (e) => {
            filters.search = e.target.value.trim();
            clearTimeout(searchDebounceTimeout);
            searchDebounceTimeout = setTimeout(() => {
                currentPage = 1;
                loadNotificationHistory();
            }, 400);
        });
    }

    if (filterStatus) {
        filterStatus.addEventListener('change', (e) => {
            filters.status = e.target.value;
            currentPage = 1;
            loadNotificationHistory();
        });
    }

    if (filterTargetType) {
        filterTargetType.addEventListener('change', (e) => {
            filters.targetType = e.target.value;
            currentPage = 1;
            loadNotificationHistory();
        });
    }

    if (filterCategory) {
        filterCategory.addEventListener('change', (e) => {
            filters.category = e.target.value;
            currentPage = 1;
            loadNotificationHistory();
        });
    }
}

function initModalHandlers() {
    const btnCloseModal = document.getElementById('btn-close-modal');
    if (btnCloseModal) {
        btnCloseModal.addEventListener('click', () => {
            document.getElementById('details-modal').style.display = 'none';
        });
    }

    window.addEventListener('click', (event) => {
        const modal = document.getElementById('details-modal');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Delegated click handler for history list rows
    const tableBody = document.getElementById('notifications-requests-body');
    if (tableBody) {
        tableBody.addEventListener('click', (e) => {
            const btn = e.target.closest('.action-btn');
            if (!btn) return;

            const id = btn.getAttribute('data-id');
            if (btn.classList.contains('view')) {
                showCampaignDetails(id);
            } else if (btn.classList.contains('cancel')) {
                handleCancelCampaign(id);
            } else if (btn.classList.contains('resend')) {
                handleResendCampaign(id);
            } else if (btn.classList.contains('delete')) {
                handleDeleteCampaign(id);
            }
        });
    }
}

async function loadNotificationHistory() {
    const tableBody = document.getElementById('notifications-requests-body');
    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 40px;"><i class="bx bx-loader-alt bx-spin"></i> Loading campaign history...</td></tr>';

    try {
        const res = await fetchNotificationRequests(currentPage, pageSize, filters);
        const items = res.data?.items || res.items || [];
        const totalCount = res.data?.totalCount || res.totalCount || 0;
        const totalPages = res.data?.totalPages || res.totalPages || 0;

        if (items.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 40px; color: var(--text-muted);">No notification history found matching criteria.</td></tr>';
            renderPagination(1, pageSize, 0, 0);
            return;
        }

        tableBody.innerHTML = items.map(item => {
            const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleString() : 'N/A';
            const audienceLabel = item.audience || getAudienceLabel(item);
            
            // Build action buttons inline
            let actionButtons = `<button class="action-btn view" data-id="${item.id}" title="View Details"><i class='bx bx-show'></i></button>`;
            
            if (item.canCancel) {
                actionButtons += `<button class="action-btn cancel" data-id="${item.id}" title="Cancel Scheduled"><i class='bx bx-x-circle'></i></button>`;
            }
            if (item.canResend) {
                actionButtons += `<button class="action-btn resend" data-id="${item.id}" title="Resend Notification"><i class='bx bx-refresh'></i></button>`;
            }
            if (item.canDelete) {
                actionButtons += `<button class="action-btn delete" data-id="${item.id}" title="Delete"><i class='bx bx-trash'></i></button>`;
            }

            return `
            <tr>
                <td>
                    <div style="font-weight:600; color:var(--text-main);">${escapeHtml(item.title)}</div>
                    <div style="font-size:12px; color:var(--text-muted); max-width:300px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(item.body)}</div>
                </td>
                <td><span class="badge-type type-info">${escapeHtml(item.category)}</span></td>
                <td><span style="font-size:13px; font-weight:500; color:var(--primary);">${escapeHtml(audienceLabel)}</span></td>
                <td><span style="font-size:13px; color:var(--text-muted);">${dateStr}</span></td>
                <td><span class="status-badge ${getStatusClass(item.status)}">${escapeHtml(item.status)}</span></td>
                <td>
                    <div class="table-actions">
                        ${actionButtons}
                    </div>
                </td>
            </tr>`;
        }).join('');

        renderPagination(currentPage, pageSize, totalCount, totalPages);

    } catch (error) {
        console.error('[Notifications] Failed to load history:', error);
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 40px; color: var(--danger);"><i class="bx bx-error-circle"></i> Failed to load history: ' + escapeHtml(error.message) + '</td></tr>';
        renderPagination(1, pageSize, 0, 0);
    }
}

function renderPagination(page, pageSize, totalCount, totalPages) {
    const paginationContainer = document.getElementById('history-pagination');
    if (!paginationContainer) return;

    if (totalCount === 0) {
        paginationContainer.innerHTML = '';
        return;
    }

    const startItem = (page - 1) * pageSize + 1;
    const endItem = Math.min(page * pageSize, totalCount);

    let html = `<span class="page-info">Showing ${startItem} to ${endItem} of ${totalCount} entries</span>`;
    
    // Left arrow button
    html += `<button class="page-btn" ${page <= 1 ? 'disabled' : ''} onclick="goToPage(${page - 1})"><i class='bx bx-chevron-left'></i></button>`;

    // Page number buttons
    const maxPageButtons = 5;
    let startPage = Math.max(1, page - Math.floor(maxPageButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxPageButtons - 1);
    if (endPage - startPage + 1 < maxPageButtons) {
        startPage = Math.max(1, endPage - maxPageButtons + 1);
    }

    if (startPage > 1) {
        html += `<button class="page-btn" onclick="goToPage(1)">1</button>`;
        if (startPage > 2) {
            html += `<span>...</span>`;
        }
    }

    for (let p = startPage; p <= endPage; p++) {
        html += `<button class="page-btn ${p === page ? 'active' : ''}" onclick="goToPage(${p})">${p}</button>`;
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            html += `<span>...</span>`;
        }
        html += `<button class="page-btn" onclick="goToPage(${totalPages})">${totalPages}</button>`;
    }

    // Right arrow button
    html += `<button class="page-btn" ${page >= totalPages ? 'disabled' : ''} onclick="goToPage(${page + 1})"><i class='bx bx-chevron-right'></i></button>`;

    paginationContainer.innerHTML = html;
}

function goToPage(page) {
    currentPage = page;
    loadNotificationHistory();
}
window.goToPage = goToPage;

async function showCampaignDetails(id) {
    try {
        Swal.fire({
            title: 'Loading details...',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });

        const res = await getNotificationCampaignDetails(id);
        const item = res.data || res;
        Swal.close();

        document.getElementById('modal-title').textContent = item.title;
        document.getElementById('modal-body').textContent = item.body;
        
        // Category Badge
        const categoryBadge = document.getElementById('modal-badge-category');
        categoryBadge.className = 'badge-type type-info';
        categoryBadge.textContent = item.category;
        
        // Status Badge
        const statusBadge = document.getElementById('modal-badge-status');
        statusBadge.textContent = item.status;
        statusBadge.className = 'status-badge ' + getStatusClass(item.status);
        
        // Delivery Badge
        const deliveryBadge = document.getElementById('modal-badge-delivery');
        deliveryBadge.textContent = item.deliveryMethod;
        
        // Detailed grid
        document.getElementById('modal-audience').textContent = item.audience || getAudienceLabel(item);
        document.getElementById('modal-recipients').textContent = item.recipientCount !== null && item.recipientCount !== undefined ? item.recipientCount : 'N/A';
        document.getElementById('modal-scheduled').textContent = item.scheduledAt ? new Date(item.scheduledAt).toLocaleString() : 'N/A';
        document.getElementById('modal-sent').textContent = item.sentAt ? new Date(item.sentAt).toLocaleString() : 'N/A';
        document.getElementById('modal-created').textContent = item.createdAt ? new Date(item.createdAt).toLocaleString() : 'N/A';
        document.getElementById('modal-created-by').textContent = item.createdByUserId || 'System';
        
        // Action buttons inside modal
        const actionsContainer = document.getElementById('modal-actions');
        let actionsHtml = '';
        if (item.canCancel) {
            actionsHtml += `<button class="btn btn-schedule" onclick="handleCancelCampaign('${item.id}')"><i class='bx bx-x-circle'></i> Cancel Campaign</button>`;
        }
        if (item.canResend) {
            actionsHtml += `<button class="btn btn-primary" onclick="handleResendCampaign('${item.id}')"><i class='bx bx-refresh'></i> Resend Now</button>`;
        }
        if (item.canDelete) {
            actionsHtml += `<button class="btn btn-outline" style="color:var(--danger); border-color:var(--danger-light);" onclick="handleDeleteCampaign('${item.id}')"><i class='bx bx-trash'></i> Delete</button>`;
        }
        actionsContainer.innerHTML = actionsHtml;

        // Open modal
        const modal = document.getElementById('details-modal');
        modal.style.display = 'flex';
    } catch (err) {
        Swal.fire('Error', 'Failed to fetch campaign details: ' + err.message, 'error');
    }
}

async function handleCancelCampaign(id) {
    const result = await Swal.fire({
        title: 'Cancel Scheduled Notification?',
        text: 'This will stop the scheduled campaign from sending.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: 'var(--warning)',
        cancelButtonColor: 'var(--neutral)',
        confirmButtonText: 'Yes, Cancel it'
    });

    if (result.isConfirmed) {
        try {
            Swal.fire({
                title: 'Cancelling...',
                allowOutsideClick: false,
                didOpen: () => { Swal.showLoading(); }
            });

            await cancelNotificationCampaign(id);
            
            Swal.fire('Cancelled', 'Notification campaign has been cancelled successfully.', 'success');
            document.getElementById('details-modal').style.display = 'none';
            loadNotificationHistory();
        } catch (err) {
            Swal.fire('Error', 'Failed to cancel notification: ' + err.message, 'error');
        }
    }
}
window.handleCancelCampaign = handleCancelCampaign;

async function handleResendCampaign(id) {
    const result = await Swal.fire({
        title: 'Resend Notification?',
        text: 'This will copy the settings and send this notification immediately.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: 'var(--primary)',
        cancelButtonColor: 'var(--neutral)',
        confirmButtonText: 'Yes, Resend'
    });

    if (result.isConfirmed) {
        try {
            Swal.fire({
                title: 'Resending...',
                allowOutsideClick: false,
                didOpen: () => { Swal.showLoading(); }
            });

            await resendNotificationCampaign(id);
            
            Swal.fire('Sent!', 'Notification campaign has been resent successfully.', 'success');
            document.getElementById('details-modal').style.display = 'none';
            loadNotificationHistory();
        } catch (err) {
            Swal.fire('Error', 'Failed to resend: ' + err.message, 'error');
        }
    }
}
window.handleResendCampaign = handleResendCampaign;

async function handleDeleteCampaign(id) {
    const result = await Swal.fire({
        title: 'Delete Campaign?',
        text: 'This action is permanent and cannot be undone.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: 'var(--danger)',
        cancelButtonColor: 'var(--neutral)',
        confirmButtonText: 'Yes, Delete'
    });

    if (result.isConfirmed) {
        try {
            Swal.fire({
                title: 'Deleting...',
                allowOutsideClick: false,
                didOpen: () => { Swal.showLoading(); }
            });

            await deleteNotificationCampaign(id);
            
            Swal.fire('Deleted', 'Campaign has been deleted.', 'success');
            document.getElementById('details-modal').style.display = 'none';
            loadNotificationHistory();
        } catch (err) {
            Swal.fire('Error', 'Failed to delete campaign: ' + err.message, 'error');
        }
    }
}
window.handleDeleteCampaign = handleDeleteCampaign;

function getStatusClass(status) {
    const s = (status || '').toLowerCase();
    if (s === 'sent') return 'success';
    if (s === 'scheduled') return 'warning';
    if (s === 'draft') return 'primary';
    if (s === 'cancelled') return 'neutral';
    if (s === 'failed') return 'danger';
    return 'neutral';
}

function getAudienceLabel(item) {
    if (item.targetType === 'All') return 'All Users';
    if (item.targetType === 'Role') return `Role: ${item.targetRole}`;
    if (item.targetType === 'SpecificUser') return `User: ${item.targetUserId}`;
    return item.audience || 'Unknown';
}

function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
