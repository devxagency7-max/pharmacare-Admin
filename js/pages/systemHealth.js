let autoRefreshEnabled = true;
let countdownTimer = null;
let countdownSeconds = 30;

document.addEventListener('DOMContentLoaded', () => {
    loadHealth();
    initAutoRefresh();
});

function initAutoRefresh() {
    const toggle = document.getElementById('auto-refresh-toggle');
    const countdownEl = document.getElementById('countdown-display');

    toggle.addEventListener('change', () => {
        autoRefreshEnabled = toggle.checked;
        if (autoRefreshEnabled) {
            startCountdown();
            countdownEl.style.display = '';
        } else {
            clearInterval(countdownTimer);
            countdownEl.style.display = 'none';
        }
    });

    // Start immediately
    startCountdown();
    countdownEl.style.display = '';
}

function startCountdown() {
    clearInterval(countdownTimer);
    countdownSeconds = 30;
    updateCountdownDisplay();

    countdownTimer = setInterval(() => {
        countdownSeconds--;
        updateCountdownDisplay();
        if (countdownSeconds <= 0) {
            if (autoRefreshEnabled) {
                loadHealth();
                countdownSeconds = 30;
            }
        }
    }, 1000);
}

function updateCountdownDisplay() {
    const el = document.getElementById('countdown-display');
    if (el) el.textContent = `Next in ${countdownSeconds}s`;
}

async function loadHealth() {
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Refreshing...';
        refreshBtn.disabled = true;
    }

    try {
        const res = await fetchSystemHealth();
        const data = res?.data || res;
        renderHealthCards(data);
        renderInfoPanel(data);

        document.getElementById('info-checked').textContent = new Date().toLocaleTimeString();

        // Reset countdown after manual refresh
        if (autoRefreshEnabled) startCountdown();
    } catch (err) {
        renderError(err.message);
    } finally {
        if (refreshBtn) {
            refreshBtn.innerHTML = '<i class="bx bx-refresh"></i> Refresh Now';
            refreshBtn.disabled = false;
        }
    }
}

function renderHealthCards(data) {
    const services = [
        { key: 'databaseStatus',    label: 'Database',       iconClass: 'db',    icon: 'bx-data' },
        { key: 'redisStatus',       label: 'Redis Cache',    iconClass: 'redis',  icon: 'bx-server' },
        { key: 'firebaseStatus',    label: 'Firebase Auth',  iconClass: 'fb',    icon: 'bx-shield' },
        { key: 'cloudflareR2Status',label: 'Cloudflare R2', iconClass: 'r2',    icon: 'bx-cloud' },
        { key: 'hangfireStatus',    label: 'Hangfire Jobs',  iconClass: 'hf',    icon: 'bx-time' },
    ];

    const grid = document.getElementById('health-grid');
    grid.innerHTML = services.map(svc => {
        const raw = data[svc.key] || 'Unknown';
        const isOk = raw.toLowerCase() === 'connected' || raw.toLowerCase() === 'ok' || raw.toLowerCase() === 'healthy';
        const stateClass = isOk ? 'connected' : 'disconnected';
        const label = isOk ? raw : raw;
        return `
        <div class="health-card">
            <div class="health-icon ${svc.iconClass}"><i class='bx ${svc.icon}'></i></div>
            <div class="health-info">
                <h3>${svc.label}</h3>
                <span class="health-status-text ${stateClass}">${label}</span>
            </div>
            <div class="health-dot ${stateClass}"></div>
        </div>`;
    }).join('');
}

function renderInfoPanel(data) {
    const set = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val || '—';
    };
    set('info-version', data.apiVersion);
    set('info-env', data.environment);
    set('info-time', data.serverTime ? new Date(data.serverTime).toUTCString() : '—');
}

function renderError(msg) {
    const grid = document.getElementById('health-grid');
    grid.innerHTML = `
    <div style="grid-column:1/-1; padding:40px; text-align:center; color:var(--danger);">
        <i class='bx bx-error-circle' style="font-size:36px;"></i>
        <p style="margin-top:12px; font-weight:600;">Failed to load health status</p>
        <p style="font-size:13px; color:var(--text-muted); margin-top:4px;">${msg}</p>
        <button class="btn btn-outline" style="margin-top:16px;" onclick="loadHealth()">Try Again</button>
    </div>`;
}
