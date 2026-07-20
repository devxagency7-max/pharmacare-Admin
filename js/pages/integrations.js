document.addEventListener('DOMContentLoaded', () => {
    loadIntegrations();
});

async function loadIntegrations() {
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) { refreshBtn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Refreshing...'; refreshBtn.disabled = true; }

    try {
        const res = await fetchIntegrations();
        const data = res?.data || res;
        renderIntegrations(data);
    } catch (err) {
        document.getElementById('integrations-grid').innerHTML = `
        <div style="grid-column:1/-1; padding:40px; text-align:center; color:var(--danger);">
            <i class='bx bx-error-circle' style="font-size:36px;"></i>
            <p style="margin-top:12px; font-weight:600;">Failed to load integrations</p>
            <p style="font-size:13px; color:var(--text-muted); margin-top:4px;">${err.message}</p>
            <button class="btn btn-outline" style="margin-top:16px;" onclick="loadIntegrations()">Try Again</button>
        </div>`;
    } finally {
        if (refreshBtn) { refreshBtn.innerHTML = '<i class="bx bx-refresh"></i> Refresh'; refreshBtn.disabled = false; }
    }
}

function renderIntegrations(data) {
    const services = [
        {
            key: 'firebaseConnected', label: 'Firebase Auth',
            iconClass: 'firebase', icon: 'bx-shield',
            desc: 'Authentication provider',
        },
        {
            key: 'redisConnected', label: 'Redis Cache',
            iconClass: 'redis', icon: 'bx-server',
            desc: 'In-memory caching layer',
        },
        {
            key: 'cloudflareConnected', label: 'Cloudflare R2',
            iconClass: 'r2', icon: 'bx-cloud',
            desc: 'Object storage for files & backups',
        },
        {
            key: 'smtpConnected', label: 'SMTP Email',
            iconClass: 'smtp', icon: 'bx-envelope',
            desc: 'Outgoing email service',
            note: data.smtpNote || 'No SMTP integration is configured in this deployment.',
            forceNotConfigured: true,
        },
    ];

    const grid = document.getElementById('integrations-grid');
    grid.innerHTML = services.map(svc => {
        const isConnected = !svc.forceNotConfigured && data[svc.key] === true;
        const isNotConfigured = svc.forceNotConfigured;

        let statusClass, statusText;
        if (isNotConfigured) {
            statusClass = 'not-configured';
            statusText = 'Not Configured';
        } else if (isConnected) {
            statusClass = 'connected';
            statusText = 'Connected';
        } else {
            statusClass = 'disconnected';
            statusText = 'Disconnected';
        }

        const noteHtml = svc.note
            ? `<div class="integration-note"><i class='bx bx-info-circle'></i> ${svc.note}</div>`
            : '';

        return `
        <div class="integration-card">
            <div class="integration-header">
                <div class="integration-icon ${svc.iconClass}"><i class='bx ${svc.icon}'></i></div>
                <div>
                    <div class="integration-name">${svc.label}</div>
                    <div class="integration-desc">${svc.desc}</div>
                </div>
            </div>
            <div class="integration-status ${statusClass}">
                <div class="status-dot"></div>
                ${statusText}
            </div>
            ${noteHtml}
        </div>`;
    }).join('');
}
