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
            pollUnreadCount();
            setInterval(pollUnreadCount, 45000);
        } else {
            setTimeout(() => {
                loadPendingCounts();
                pollUnreadCount();
                setInterval(pollUnreadCount, 45000);
            }, 1000);
        }
    }, isDashboard ? 3000 : 500);

    window.addEventListener('focus', () => {
        if (window.apiClient) pollUnreadCount();
    });

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
    // Handle: {data: {totalCount, items}} or {data: [...]} or {totalCount} or {items: [...]}
    if (v?.data?.totalCount != null) return v.data.totalCount;
    if (v?.totalCount != null) return v.totalCount;
    if (v?.data?.total != null) return v.data.total;
    if (v?.total != null) return v.total;
    if (Array.isArray(v?.data)) return v.data.length;
    if (Array.isArray(v?.items)) return v.items.length;
    return 0;
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
        const res = await apiClient.get('/notifications?pageSize=20');
        const d = res?.data || res;
        const items = Array.isArray(d) ? d : (d.items || []);

        if (items.length === 0) {
            list.innerHTML = '<div style="padding:36px; text-align:center; color:#94a3b8; font-size:13px;">No notifications yet.</div>';
            return;
        }

        list.innerHTML = items.map(n => {
            const isRead = !!n.isRead;
            const time = n.createdAt ? new Date(n.createdAt).toLocaleString('en-US', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }) : '';
            const iconMap = {
                'ApplicationApproved': { icon:'bx-check-shield', bg:'#f0fdf4', color:'#16a34a' },
                'ApplicationRejected': { icon:'bx-x-circle',     bg:'#fef2f2', color:'#ef4444' },
                'NewOrder':            { icon:'bx-cart',          bg:'#fffbeb', color:'#d97706' },
                'AdminDirect':         { icon:'bx-bell',          bg:'#eff6ff', color:'#3b82f6' },
                'SystemAlert':         { icon:'bx-error-circle',  bg:'#fdf4ff', color:'#a855f7' },
            };
            const style = iconMap[n.type] || { icon:'bx-bell', bg:'#f1f5f9', color:'#64748b' };

            return `
            <div onclick="markNotifRead('${n.id}', this)" style="padding:14px 18px; border-bottom:1px solid #f8fafc; display:flex; gap:12px; align-items:flex-start; cursor:pointer; background:${isRead ? '#fff' : '#f8faff'}; transition:background 0.15s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='${isRead ? '#fff' : '#f8faff'}'">
                <div style="width:38px;height:38px;border-radius:10px;background:${style.bg};display:flex;align-items:center;justify-content:center;flex-shrink:0;position:relative;">
                    <i class='bx ${style.icon}' style="color:${style.color};font-size:18px;"></i>
                    ${!isRead ? `<span style="position:absolute;top:-3px;right:-3px;width:9px;height:9px;border-radius:50%;background:#ef4444;border:2px solid #fff;"></span>` : ''}
                </div>
                <div style="flex:1;min-width:0;">
                    <div style="font-size:13px;font-weight:${isRead ? '500' : '700'};color:#0f172a;line-height:1.3;">${escapeHtmlBell(n.title || '')}</div>
                    <div style="font-size:12px;color:#64748b;margin-top:2px;line-height:1.4;">${escapeHtmlBell(n.body || '')}</div>
                </div>
                ${time ? `<div style="font-size:10px;color:#cbd5e1;flex-shrink:0;text-align:right;padding-top:2px;white-space:nowrap;">${time}</div>` : ''}
            </div>`;
        }).join('');

    } catch {
        list.innerHTML = '<div style="padding:24px; text-align:center; color:#ef4444; font-size:13px;">Failed to load notifications.</div>';
    }
}

async function markNotifRead(id, el) {
    if (!id) return;
    try {
        await apiClient.put(`/notifications/${id}/read`, {});
        if (el) {
            el.style.background = '#fff';
            const dot = el.querySelector('span[style*="border-radius:50%"]');
            if (dot) dot.remove();
            const title = el.querySelector('div[style*="font-weight"]');
            if (title) title.style.fontWeight = '500';
        }
        // Refresh unread count
        pollUnreadCount();
    } catch { /* silent */ }
}

async function pollUnreadCount() {
    try {
        const res = await apiClient.get('/notifications/unread-count');
        const count = res?.data ?? res?.count ?? 0;
        const badge = document.querySelector('.notification-icon .badge');
        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? '' : 'none';
        }
    } catch { /* silent */ }
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
