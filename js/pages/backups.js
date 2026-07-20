let pendingRestoreId = null;

document.addEventListener('DOMContentLoaded', () => {
    loadBackups();
});

async function loadBackups() {
    const timeline = document.getElementById('backup-timeline');
    timeline.innerHTML = '<div style="padding:40px; text-align:center; color:var(--text-muted);"><i class="bx bx-loader-alt bx-spin" style="font-size:28px;"></i><p style="margin-top:12px;">Loading...</p></div>';

    try {
        const res = await fetchBackups();
        const data = res?.data || res;
        const backups = Array.isArray(data) ? data : (data.items || data.backups || []);

        if (!backups || backups.length === 0) {
            timeline.innerHTML = `
            <div style="padding:60px; text-align:center; color:var(--text-muted);">
                <i class='bx bx-data' style="font-size:40px;"></i>
                <p style="margin-top:12px; font-weight:600;">No backups yet</p>
                <p style="font-size:13px;">Create your first backup to protect your data.</p>
            </div>`;
            return;
        }

        timeline.innerHTML = backups.map((b, idx) => {
            const status = (b.status || '').toLowerCase().replace(' ', '');
            const dotClass = status === 'completed' ? 'completed' : status === 'inprogress' ? 'inprogress' : 'failed';
            const tagClass = dotClass;
            const isLast = idx === backups.length - 1;

            const createdAt = b.createdAt ? new Date(b.createdAt).toLocaleString() : '—';
            const completedAt = b.completedAt ? new Date(b.completedAt).toLocaleString() : null;
            const restoredAt = b.restoredAt ? new Date(b.restoredAt).toLocaleString() : null;
            const sizeText = b.fileSizeBytes ? formatBytes(b.fileSizeBytes) : (b.size ? formatBytes(b.size) : null);
            const triggeredBy = b.triggeredByName || b.triggeredBy || '—';

            const restoredTag = restoredAt
                ? `<span class="backup-tag restored"><i class='bx bx-history' style="font-size:10px;"></i> Used for restore on ${restoredAt}</span>`
                : '';

            const restoreBtn = (b.status === 'Completed')
                ? `<button class="btn-restore" onclick="openRestoreModal('${b.id || b.backupId}')"><i class='bx bx-shield-x'></i> Restore</button>`
                : '';

            const details = [
                `Created: ${createdAt}`,
                completedAt ? `Completed: ${completedAt}` : null,
                sizeText ? `Size: ${sizeText}` : null,
                `By: ${triggeredBy}`,
            ].filter(Boolean).join(' &nbsp;·&nbsp; ');

            return `
            <div class="backup-entry">
                <div class="timeline-indicator">
                    <div class="timeline-dot ${dotClass}"></div>
                    ${!isLast ? '<div class="timeline-line"></div>' : ''}
                </div>
                <div class="backup-meta">
                    <div class="backup-id">${b.id || b.backupId || 'Unknown ID'}</div>
                    <div class="backup-detail">${details}</div>
                    <div class="backup-tags">
                        <span class="backup-tag ${tagClass}">${b.status || 'Unknown'}</span>
                        ${restoredTag}
                    </div>
                </div>
                <div class="backup-actions">${restoreBtn}</div>
            </div>`;
        }).join('');

    } catch (err) {
        timeline.innerHTML = `
        <div style="padding:40px; text-align:center; color:var(--danger);">
            <i class='bx bx-error-circle' style="font-size:32px;"></i>
            <p style="margin-top:12px; font-weight:600;">Failed to load backups</p>
            <p style="font-size:13px; color:var(--text-muted);">${err.message}</p>
            <button class="btn btn-outline" style="margin-top:16px;" onclick="loadBackups()">Try Again</button>
        </div>`;
    }
}

async function doCreateBackup() {
    const btn = document.getElementById('create-btn');
    btn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Creating...';
    btn.disabled = true;

    try {
        const res = await createBackup();
        const data = res?.data || res;

        const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 4000 });
        Toast.fire({ icon: 'success', title: res.message || 'Backup created successfully.' });

        loadBackups();
    } catch (err) {
        Swal.fire('Backup Failed', err.message || 'Could not create backup.', 'error');
    } finally {
        btn.innerHTML = '<i class="bx bx-plus-circle"></i> Create Backup';
        btn.disabled = false;
    }
}

function openRestoreModal(backupId) {
    pendingRestoreId = backupId;
    document.getElementById('restore-backup-id-display').textContent = backupId;
    document.getElementById('restore-phrase-input').value = '';
    document.getElementById('restore-phrase-input').classList.remove('invalid');
    document.getElementById('restore-modal').classList.add('active');
}

function closeRestoreModal() {
    pendingRestoreId = null;
    document.getElementById('restore-modal').classList.remove('active');
}

async function confirmRestore() {
    const phrase = document.getElementById('restore-phrase-input').value.trim();
    if (phrase !== 'RESTORE') {
        document.getElementById('restore-phrase-input').classList.add('invalid');
        document.getElementById('restore-phrase-input').focus();
        return;
    }

    const confirmBtn = document.getElementById('confirm-restore-btn');
    confirmBtn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Restoring...';
    confirmBtn.disabled = true;

    try {
        await restoreBackup(pendingRestoreId, phrase);
        closeRestoreModal();
        Swal.fire({
            icon: 'success', title: 'Restore Complete',
            text: 'The database has been restored from the selected backup.',
            confirmButtonText: 'OK'
        }).then(() => loadBackups());
    } catch (err) {
        confirmBtn.innerHTML = '<i class="bx bx-shield-x"></i> Restore Database';
        confirmBtn.disabled = false;
        Swal.fire('Restore Failed', err.message || 'Could not restore backup.', 'error');
    }
}

// Close modal on backdrop click
document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('restore-modal');
    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeRestoreModal();
        });
    }
});

function formatBytes(bytes) {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
}
