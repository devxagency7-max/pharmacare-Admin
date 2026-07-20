// Sidebar Toggle Logic
document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('sidebar-toggle');


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

    // Load real admin profile in topbar
    loadTopbarProfile();

    // Show SuperAdmin nav items if the logged-in user is a SuperAdmin
    showSuperAdminNav();

    // Delay sidebar dots + bell badge after all scripts have loaded
    const isDashboard = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/');
    setTimeout(() => {
        if (window.apiClient) {
            loadPendingCounts();
        } else {
            // apiClient not ready yet — wait a bit more
            setTimeout(() => loadPendingCounts(), 1000);
        }
    }, isDashboard ? 3000 : 500);

});

// ─── Notification Bell ────────────────────────────────────────────────────────

function initNotificationBell() {
    const bellWrapper = document.querySelector('.notification-icon');
    if (!bellWrapper || !window.apiClient) return;

    bellWrapper.style.position = 'relative';
    bellWrapper.style.cursor = 'pointer';

    const dropdown = document.createElement('div');
    dropdown.id = 'notif-dropdown';
    dropdown.style.cssText = `
        display: none;
        position: absolute;
        top: calc(100% + 10px);
        right: 0;
        width: 360px;
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
        </div>
        <div id="notif-permission-bar" style="padding:10px 16px; background:#eff6ff; border-bottom:1px solid #dbeafe; font-size:12px; color:#1d4ed8; align-items:center; gap:8px; display:none;">
            <i class='bx bx-bell-plus' style="font-size:16px;"></i>
            <span style="flex:1;">Enable browser notifications to get real-time alerts.</span>
            <button onclick="requestBellPermission()" style="background:#0057d1;color:#fff;border:none;border-radius:6px;padding:4px 10px;font-size:11px;font-weight:700;cursor:pointer;">Allow</button>
        </div>
        <div id="notif-dropdown-list" style="max-height: 380px; overflow-y: auto;"></div>
    `;
    bellWrapper.appendChild(dropdown);

    bellWrapper.addEventListener('click', async (e) => {
        e.stopPropagation();
        const isOpen = dropdown.style.display === 'block';
        dropdown.style.display = isOpen ? 'none' : 'block';
        if (!isOpen) {
            await maybeRequestBrowserPermission();
            loadBellNotifications();
        }
    });

    document.addEventListener('click', () => {
        dropdown.style.display = 'none';
    });
}

async function maybeRequestBrowserPermission() {
    if (!('Notification' in window)) return;
    const bar = document.getElementById('notif-permission-bar');
    if (Notification.permission === 'default') {
        if (bar) bar.style.display = 'flex';
    } else if (Notification.permission === 'granted') {
        if (bar) bar.style.display = 'none';
    } else {
        if (bar) bar.style.display = 'none';
    }
}

async function requestBellPermission() {
    if (!('Notification' in window)) return;
    const permission = await Notification.requestPermission();
    const bar = document.getElementById('notif-permission-bar');
    if (permission === 'granted') {
        if (bar) bar.style.display = 'none';
        new Notification('Notifications enabled', {
            body: 'You will now receive alerts for new orders and applications.',
            icon: '../logo.jpeg',
        });
    } else {
        if (bar) bar.style.display = 'none';
    }
}

function extractCount(settled) {
    if (settled.status !== 'fulfilled') return 0;
    const v = settled.value;
    return v?.data?.totalCount ?? v?.totalCount ?? v?.data?.total ?? v?.total ?? 0;
}

// Single shared fetch — used by both bell badge and sidebar dots
async function loadPendingCounts(retryCount = 0) {
    if (!window.apiClient) return;
    try {
        const [pharmRes, internRes] = await Promise.allSettled([
            apiClient.get('/admin/applications?type=Pharmacist&status=Pending&pageSize=1'),
            apiClient.get('/admin/applications?type=Intern&status=Pending&pageSize=1'),
        ]);

        const pharmCount  = extractCount(pharmRes);
        const internCount = extractCount(internRes);

        console.log('[PendingCounts] pharmRes:', pharmRes);
        console.log('[PendingCounts] internRes:', internRes);
        console.log('[PendingCounts] counts:', pharmCount, internCount);

        // Retry if both failed (e.g. 429), up to 2 times
        if (pharmCount === 0 && internCount === 0 &&
            pharmRes.status === 'rejected' && internRes.status === 'rejected' &&
            retryCount < 2) {
            setTimeout(() => loadPendingCounts(retryCount + 1), 3000);
            return;
        }

        // ── Bell badge ──────────────────────────────────────────────────────
        const badge = document.querySelector('.notification-icon .badge');
        if (badge) {
            const total = pharmCount + internCount;
            badge.textContent = total > 99 ? '99+' : String(total);
            badge.style.display = total === 0 ? 'none' : '';
        }

        // ── Sidebar dots ─────────────────────────────────────────────────────
        const dotMap = [
            { filename: 'intern_pharmacists', count: internCount, label: 'Intern'     },
            { filename: 'pharmacists',         count: pharmCount,  label: 'Pharmacist' },
        ];

        document.querySelectorAll('.nav-links li a').forEach(link => {
            const filename = (link.getAttribute('href') || '').split('/').pop().replace('.html', '');
            link.querySelector('.nav-pending-dot')?.remove();
            for (const { filename: fn, count, label } of dotMap) {
                if (filename !== fn) continue;
                if (count > 0) {
                    link.style.position = 'relative';
                    const dot = document.createElement('span');
                    dot.className = 'nav-pending-dot';
                    dot.textContent = count > 99 ? '99+' : String(count);
                    dot.title = `${count} pending ${label} application${count !== 1 ? 's' : ''}`;
                    link.appendChild(dot);
                }
                break;
            }
        });

        // ── Tab badge (on pharmacists / intern_pharmacists pages) ────────────
        const tabBadge = document.getElementById('requests-badge');
        if (tabBadge) {
            const isInternPage = window.location.pathname.includes('intern_pharmacists');
            const count = isInternPage ? internCount : pharmCount;
            tabBadge.textContent = count > 99 ? '99+' : String(count);
            tabBadge.style.cssText = count > 0
                ? 'display:inline-flex;align-items:center;justify-content:center;background:#ef4444;color:white;font-size:11px;min-width:20px;height:20px;padding:0 5px;border-radius:10px;margin-left:8px;font-weight:700;line-height:1;'
                : 'display:none;';
        }

    } catch {
        // Silent — non-critical UI
    }
}

async function loadBellNotifications() {
    const list = document.getElementById('notif-dropdown-list');
    if (!list) return;

    list.innerHTML = '<div style="padding:28px; text-align:center; color:#94a3b8;"><i class="bx bx-loader-alt bx-spin" style="font-size:22px;"></i></div>';

    try {
        const [pharmRes, internRes, ordersRes] = await Promise.allSettled([
            apiClient.get('/admin/applications?type=Pharmacist&status=Pending&pageSize=10'),
            apiClient.get('/admin/applications?type=Intern&status=Pending&pageSize=10'),
            apiClient.get('/admin/orders?pageSize=10'),
        ]);

        const extractItems = (res) => {
            if (res.status !== 'fulfilled') return [];
            const v = res.value;
            return v?.data?.items ?? v?.items ?? v?.data ?? [];
        };
        const pharmItems  = extractItems(pharmRes);
        const internItems = extractItems(internRes);
        const orderItems  = extractItems(ordersRes);

        const entries = [];

        pharmItems.forEach(app => entries.push({
            type: 'pharmacist',
            icon: 'bx-plus-medical',
            iconBg: '#eff6ff',
            iconColor: '#3b82f6',
            title: `New Pharmacist Application`,
            subtitle: app.fullName || app.name || app.applicantName || 'Applicant',
            time: app.createdAt || app.submittedAt || '',
            href: getRelPath('pharmacists.html'),
        }));

        internItems.forEach(app => entries.push({
            type: 'intern',
            icon: 'bx-book-reader',
            iconBg: '#f0fdf4',
            iconColor: '#16a34a',
            title: `New Intern Application`,
            subtitle: app.fullName || app.name || app.applicantName || 'Applicant',
            time: app.createdAt || app.submittedAt || '',
            href: getRelPath('intern_pharmacists.html'),
        }));

        orderItems.forEach(order => entries.push({
            type: 'order',
            icon: 'bx-cart',
            iconBg: '#fffbeb',
            iconColor: '#d97706',
            title: `New Order`,
            subtitle: order.patientName || order.customerName || (`#${order.id || order.orderId}`),
            time: order.createdAt || order.orderDate || '',
            href: getRelPath('orders.html'),
        }));

        // Sort newest first
        entries.sort((a, b) => (b.time && a.time) ? new Date(b.time) - new Date(a.time) : 0);

        if (entries.length === 0) {
            list.innerHTML = '<div style="padding:36px; text-align:center; color:#94a3b8; font-size:13px;">No new notifications.</div>';
            return;
        }

        list.innerHTML = entries.map(e => {
            const time = e.time ? new Date(e.time).toLocaleString('en-US', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }) : '';
            return `
            <a href="${e.href}" style="padding:14px 18px; border-bottom:1px solid #f8fafc; display:flex; gap:12px; align-items:flex-start; text-decoration:none; background:#fff; transition:background 0.15s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='#fff'">
                <div style="width:38px;height:38px;border-radius:10px;background:${e.iconBg};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                    <i class='bx ${e.icon}' style="color:${e.iconColor};font-size:18px;"></i>
                </div>
                <div style="flex:1;min-width:0;">
                    <div style="font-size:13px;font-weight:600;color:#0f172a;line-height:1.3;">${escapeHtmlBell(e.title)}</div>
                    <div style="font-size:12px;color:#64748b;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtmlBell(e.subtitle)}</div>
                </div>
                ${time ? `<div style="font-size:10px;color:#cbd5e1;flex-shrink:0;text-align:right;padding-top:2px;white-space:nowrap;">${time}</div>` : ''}
            </a>`;
        }).join('');

    } catch {
        list.innerHTML = '<div style="padding:24px; text-align:center; color:#ef4444; font-size:13px;">Failed to load notifications.</div>';
    }
}

function getRelPath(page) {
    const inPages = window.location.pathname.toLowerCase().includes('/pages/');
    return inPages ? page : `pages/${page}`;
}

function getNotifPagePath() {
    return getRelPath('notifications.html');
}

// ─── Topbar Profile ───────────────────────────────────────────────────────────

async function loadTopbarProfile() {
    const nameEl  = document.querySelector('.topbar .profile .name');
    const roleEl  = document.querySelector('.topbar .profile .role');
    const imgEl   = document.querySelector('.topbar .profile img');
    if (!nameEl || !window.apiClient) return;

    try {
        const res  = await apiClient.get('/users/me');
        const user = res?.data || res;

        const fullName = user.fullName || user.name || user.displayName || 'Admin';
        const role     = user.role || user.roles || 'Admin';

        if (nameEl) nameEl.textContent = fullName;
        if (roleEl) roleEl.textContent = role;
        if (imgEl) {
            if (user.profilePhotoUrl || user.photoUrl || user.avatarUrl) {
                imgEl.src = user.profilePhotoUrl || user.photoUrl || user.avatarUrl;
                imgEl.onerror = () => {
                    imgEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=0057d1&color=fff`;
                };
            } else {
                imgEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=0057d1&color=fff`;
            }
        }
    } catch {
        // Silently fail — keep the default placeholder
    }
}

function escapeHtmlBell(str) {
    if (!str) return '';
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ─── SuperAdmin Navigation ────────────────────────────────────────────────────

function showSuperAdminNav() {
    const token = localStorage.getItem('idToken');
    if (!token) return;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const roles = payload.role || payload.roles || [];
        const isSuperAdmin = Array.isArray(roles)
            ? roles.includes('SuperAdmin')
            : roles === 'SuperAdmin';
        if (isSuperAdmin) {
            document.querySelectorAll('.superadmin-section').forEach(el => {
                el.style.display = '';
            });
        }
    } catch (e) {
        // Invalid token — do nothing
    }
}
