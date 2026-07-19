// Sidebar Toggle Logic
document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('sidebar-toggle');
    const searchBtn = document.querySelector('.search-box i'); // Sometimes used as toggle on mobile

    // Toggle sidebar collapse state
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            if (window.innerWidth > 768) {
                // Desktop behavior: collapse horizontally
                sidebar.classList.toggle('close');
            } else {
                // Mobile behavior: slide in/out
                sidebar.classList.toggle('mobile-active');
            }
        });
    }

    // Handle responsive behavior on load and resize
    const handleResize = () => {
        if (window.innerWidth <= 768) {
            sidebar.classList.remove('close'); // Remove desktop collapse class
        } else {
            sidebar.classList.remove('mobile-active'); // Remove mobile overlay class

            // Auto close on smallish desktops (optional, tablet size)
            if (window.innerWidth <= 1024) {
                sidebar.classList.add('close');
            } else {
                sidebar.classList.remove('close');
            }
        }
    };

    // Initial check
    handleResize();

    // Listen for window resize
    window.addEventListener('resize', handleResize);

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            if (!sidebar.contains(e.target) && e.target !== toggleBtn && !toggleBtn.contains(e.target)) {
                sidebar.classList.remove('mobile-active');
            }
        }
    });

    // Handle active link state based on current URL
    const currentLocation = window.location.pathname.split("/").pop();
    const navLinks = document.querySelectorAll('.nav-links li a');

    navLinks.forEach(link => {
        const linkHref = link.getAttribute('href').split("/").pop();

        // If it's the index or matches the href
        if (currentLocation === linkHref || (currentLocation === "" && linkHref === "index.html")) {
            // Remove active from all
            navLinks.forEach(l => l.classList.remove('active'));
            // Add active to current
            link.classList.add('active');
        }
    });

    // Clean local token on logout button click
    const logoutBtns = document.querySelectorAll('.logout-btn');
    logoutBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            localStorage.removeItem('idToken');
        });
    });

    // Notification Bell
    initNotificationBell();

});

// ─── Notification Bell ────────────────────────────────────────────────────────

function initNotificationBell() {
    const bellWrapper = document.querySelector('.notification-icon');
    if (!bellWrapper || !window.apiClient) return;

    // Inject dropdown markup once
    bellWrapper.style.position = 'relative';
    bellWrapper.style.cursor = 'pointer';

    const dropdown = document.createElement('div');
    dropdown.id = 'notif-dropdown';
    dropdown.style.cssText = `
        display: none;
        position: absolute;
        top: calc(100% + 10px);
        right: 0;
        width: 340px;
        background: #fff;
        border-radius: 14px;
        box-shadow: 0 8px 40px rgba(0,0,0,0.13);
        border: 1px solid #e8edf5;
        z-index: 9999;
        overflow: hidden;
    `;
    dropdown.innerHTML = `
        <div style="padding: 16px 20px; border-bottom: 1px solid #f1f5f9; display:flex; justify-content:space-between; align-items:center;">
            <span style="font-weight:700; font-size:15px; color:#0f172a;">Notifications</span>
            <a href="${getNotifPagePath()}" style="font-size:12px; color:#0057d1; text-decoration:none; font-weight:600;">View All</a>
        </div>
        <div id="notif-dropdown-list" style="max-height: 320px; overflow-y: auto;"></div>
    `;
    bellWrapper.appendChild(dropdown);

    // Toggle dropdown on click
    bellWrapper.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = dropdown.style.display === 'block';
        dropdown.style.display = isOpen ? 'none' : 'block';
        if (!isOpen) loadBellNotifications();
    });

    // Close when clicking outside
    document.addEventListener('click', () => {
        dropdown.style.display = 'none';
    });

    // Load badge count on page load
    loadBellBadge();
}

function getNotifPagePath() {
    const inPages = window.location.pathname.toLowerCase().includes('/pages/');
    return inPages ? 'notifications.html' : 'pages/notifications.html';
}

async function loadBellBadge() {
    const badge = document.querySelector('.notification-icon .badge');
    if (!badge) return;
    try {
        const res = await apiClient.get('/admin/notifications/campaigns?status=Scheduled&pageSize=1');
        const scheduledCount = res?.data?.totalCount || 0;
        const draftRes = await apiClient.get('/admin/notifications/campaigns?status=Draft&pageSize=1');
        const draftCount = draftRes?.data?.totalCount || 0;
        const total = scheduledCount + draftCount;
        badge.textContent = total > 99 ? '99+' : String(total);
        badge.style.display = total === 0 ? 'none' : '';
    } catch {
        badge.style.display = 'none';
    }
}

async function loadBellNotifications() {
    const list = document.getElementById('notif-dropdown-list');
    if (!list) return;

    list.innerHTML = '<div style="padding:24px; text-align:center; color:#94a3b8;"><i class="bx bx-loader-alt bx-spin" style="font-size:22px;"></i></div>';

    try {
        const res = await apiClient.get('/admin/notifications/campaigns?pageSize=5');
        const items = res?.data?.items || [];

        if (items.length === 0) {
            list.innerHTML = '<div style="padding:32px; text-align:center; color:#94a3b8; font-size:13px;">No campaigns yet.</div>';
            return;
        }

        const statusColors = {
            sent:      { bg: '#ecfdf5', color: '#059669' },
            scheduled: { bg: '#fffbeb', color: '#d97706' },
            draft:     { bg: '#eff6ff', color: '#3b82f6' },
            cancelled: { bg: '#f1f5f9', color: '#64748b' },
            failed:    { bg: '#fef2f2', color: '#ef4444' },
        };

        list.innerHTML = items.map(item => {
            const s = (item.status || '').toLowerCase();
            const sc = statusColors[s] || { bg: '#f1f5f9', color: '#64748b' };
            const time = item.createdAt ? new Date(item.createdAt).toLocaleString('en-US', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }) : '';
            return `
            <div style="padding: 14px 20px; border-bottom: 1px solid #f8fafc; display:flex; gap:12px; align-items:flex-start;">
                <div style="width:36px;height:36px;border-radius:10px;background:${sc.bg};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                    <i class='bx bx-bell' style="color:${sc.color};font-size:18px;"></i>
                </div>
                <div style="flex:1;min-width:0;">
                    <div style="font-size:13px;font-weight:600;color:#0f172a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtmlBell(item.title)}</div>
                    <div style="font-size:11px;color:#94a3b8;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtmlBell(item.audience || item.targetType || '')}</div>
                </div>
                <div style="text-align:right;flex-shrink:0;">
                    <span style="display:inline-block;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700;background:${sc.bg};color:${sc.color};">${item.status}</span>
                    <div style="font-size:10px;color:#cbd5e1;margin-top:4px;">${time}</div>
                </div>
            </div>`;
        }).join('');
    } catch {
        list.innerHTML = '<div style="padding:24px; text-align:center; color:#ef4444; font-size:13px;">Failed to load.</div>';
    }
}

function escapeHtmlBell(str) {
    if (!str) return '';
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
