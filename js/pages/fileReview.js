document.addEventListener('DOMContentLoaded', () => {
    loadPendingFiles();
});

let rejectingFileId = null;

async function loadPendingFiles() {
    const tableBody = document.getElementById('file-review-body');
    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 30px;"><i class="bx bx-loader-alt bx-spin"></i> Loading queue...</td></tr>';

    try {
        const res = await fetchPendingFiles();
        const files = res?.data || [];

        if (files.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 30px;">No pending documents for review.</td></tr>';
            return;
        }

        tableBody.innerHTML = files.map(file => `
            <tr>
                <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <i class='bx bxs-file-pdf' style="font-size: 24px; color: var(--danger);"></i>
                        <strong>${file.type || 'Document'}</strong>
                    </div>
                </td>
                <td>${file.ownerName || 'Unknown Pharmacist'}</td>
                <td>${file.createdAt ? new Date(file.createdAt).toLocaleDateString() : 'N/A'}</td>
                <td>
                    <div class="table-actions">
                        <button class="action-btn edit" onclick="window.open('${file.url}', '_blank')" title="View File">
                            <i class='bx bx-show'></i>
                        </button>
                        <button class="action-btn success" onclick="handleApprove('${file.id}')" title="Approve" style="color: #10b981; background: #ecfdf5;">
                            <i class='bx bx-check'></i>
                        </button>
                        <button class="action-btn delete" onclick="openRejectModal('${file.id}')" title="Reject">
                            <i class='bx bx-x'></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

    } catch (err) {
        console.error('Failed to load files:', err);
        tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color: var(--danger);">Error loading queue.</td></tr>';
    }
}

async function handleApprove(id) {
    if (!confirm('Are you sure you want to approve this document?')) return;
    try {
        await approveFile(id);
        alert('File approved successfully');
        loadPendingFiles();
    } catch (err) {
        alert('Failed to approve file');
    }
}

function openRejectModal(id) {
    rejectingFileId = id;
    document.getElementById('reject-modal').classList.add('active');
}

function closeRejectModal() {
    document.getElementById('reject-modal').classList.remove('active');
    rejectingFileId = null;
}

async function confirmRejection() {
    const reason = document.getElementById('reject-reason').value;
    if (!reason) return alert('Please provide a reason for rejection');

    try {
        await rejectFile(rejectingFileId, reason);
        alert('File rejected');
        closeRejectModal();
        loadPendingFiles();
    } catch (err) {
        alert('Failed to reject file');
    }
}
