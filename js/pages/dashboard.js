document.addEventListener('DOMContentLoaded', () => {
    loadDashboardData();
});

async function loadDashboardData() {
    console.log('[Dashboard] Loading Analytics Data...');
    
    // UI Elements
    const statPatients = document.getElementById('stat-total-patients');
    const statPharmacists = document.getElementById('stat-total-pharmacists');
    const statInterns = document.getElementById('stat-total-interns');
    const statPharmacies = document.getElementById('stat-total-pharmacies');
    const statOrders = document.getElementById('stat-total-orders');

    // Show loading state instead of "..."
    [statPatients, statPharmacists, statInterns, statPharmacies, statOrders].forEach(el => {
        if (el) el.innerHTML = '<span style="font-size: 14px; color: var(--text-muted);">Loading...</span>';
    });

    // Debug: Check token is present
    const token = localStorage.getItem('idToken');
    if (!token) {
        console.warn('[Dashboard] No token in localStorage — redirecting to login');
        window.location.href = 'login.html';
        return;
    }
    console.log('[Dashboard] Token found, length:', token.length);

    // 1. Fetch Main Stats
    try {
        const statsRes = await fetchDashboardStats();
        const data = statsRes?.data || statsRes || {};
        console.log('[Dashboard] Stats response:', data);

        if (statPatients)    statPatients.textContent    = (data.totalPatients    || 0).toLocaleString();
        if (statPharmacists) statPharmacists.textContent = (data.totalPharmacists || 0).toLocaleString();
        if (statInterns)     statInterns.textContent     = (data.totalInterns     || 0).toLocaleString();
        if (statPharmacies)  statPharmacies.textContent  = (data.totalPharmacies  || 0).toLocaleString();
        if (statOrders)      statOrders.textContent      = (data.totalOrders      || 0).toLocaleString();

        if (!data.totalPatients && !data.totalPharmacists) {
            runStatsDiscovery();
        }
    } catch (err) {
        console.warn('[Dashboard] Stats failed:', err.message);
        // Reset Loading... to 0 so UI doesn't stay stuck
        [statPatients, statPharmacists, statInterns, statPharmacies, statOrders].forEach(el => {
            if (el && el.innerHTML.includes('Loading')) el.textContent = '0';
        });
        runStatsDiscovery();
    }

    // 2. Fetch Orders Analytics
    fetchAnalyticsOrders().then(ordersData => {
        const orders = ordersData?.data || {};
        const ordersPerDay = orders.ordersPerDay || [];
        // API returns "value" field (not "count")
        let totalOrdersCount = ordersPerDay.reduce((sum, item) => sum + (item.value || item.count || 0), 0);
        
        // Fallback calculation from status if ordersPerDay is empty
        if (totalOrdersCount === 0 && orders.ordersByStatus) {
            totalOrdersCount = Object.values(orders.ordersByStatus).reduce((a, b) => a + b, 0);
        }
        
        if (statOrders) statOrders.textContent = totalOrdersCount.toLocaleString();
        
        // Map real API status keys
        const statusData = orders.ordersByStatus || {};
        initOrdersChart(statusData);
    }).catch(err => {
        console.warn('Failed to load orders analytics:', err);
        if (statOrders) statOrders.textContent = '0';
        initOrdersChart({});
    });



    // 4. Fetch Top Pharmacies
    fetchAnalyticsTopPharmacies().then(res => {
        updateTopPharmaciesUI(res?.data || []);
    }).catch(err => {
        console.warn('Failed to load top pharmacies:', err);
        updateTopPharmaciesUI([]);
    });

    // 5. Fetch Top Medicines
    fetchAnalyticsTopMedicines().then(res => {
        updateTopMedicinesUI(res?.data || []);
    }).catch(err => {
        console.warn('Failed to load top medicines:', err);
        updateTopMedicinesUI([]);
    });

    // 6. Fetch Recent Activity
    fetchRecentActivity().then(res => {
        const activity = Array.isArray(res) ? res : (res?.data?.items || res?.data || res?.activity || []);
        updateActivityUI(activity);
    }).catch(err => {
        console.warn('Failed to load recent activity:', err);
        updateActivityUI([]);
    });

    // 7. Fetch Recent Orders Table
    // 7. Fetch Recent Orders Table
    fetchRecentOrders().then(res => {
        const ordersList = Array.isArray(res) ? res : (res?.data?.items || res?.data || []);
        updateRecentOrdersUI(ordersList);
    }).catch(err => {
        console.warn('Failed to load recent orders:', err);
        updateRecentOrdersUI([]);
    });

    // 8. Fetch Active Users Trend
    fetchAnalyticsUsers().then(usersData => {
        const users = usersData?.data || {};
        const activeUsers = users.activeUsersPerDay || [];
        initActiveUsersChart(activeUsers);
    }).catch(err => {
        console.warn('Failed to load user analytics:', err);
        initActiveUsersChart([]);
    });
}

/**
 * Fallback discovery logic to count users and pharmacies manually if stats endpoint fails
 */
async function runStatsDiscovery() {
    const statPatients    = document.getElementById('stat-total-patients');
    const statPharmacists = document.getElementById('stat-total-pharmacists');
    const statInterns     = document.getElementById('stat-total-interns');
    const statPharmacies  = document.getElementById('stat-total-pharmacies');

    // Helper to safely set text
    const set = (el, val) => { if (el) el.textContent = val; };

    try {
        const usersRes = await apiClient.get('/admin/users?pageSize=1000');
        const users = usersRes?.data?.items || usersRes?.data || [];
        console.log('[Discovery] Users found:', users.length);

        set(statPatients,    users.filter(u => String(u.roles || u.role || u.type || '').toLowerCase().includes('patient')).length.toLocaleString());
        set(statPharmacists, users.filter(u => String(u.roles || u.role || u.type || '').toLowerCase().includes('pharmacist')).length.toLocaleString());
        set(statInterns,     users.filter(u => String(u.roles || u.role || u.type || '').toLowerCase().includes('intern')).length.toLocaleString());
    } catch (e) {
        console.warn('[Discovery] Users failed:', e.message);
        set(statPatients, '0');
        set(statPharmacists, '0');
        set(statInterns, '0');
    }

    try {
        const pharmRes = await apiClient.get('/admin/pharmacies?pageSize=1');
        const total = pharmRes?.data?.totalCount || pharmRes?.data?.items?.length || 0;
        set(statPharmacies, total.toLocaleString());
    } catch (e) {
        console.warn('[Discovery] Pharmacies failed:', e.message);
        set(statPharmacies, '0');
    }
}

function updateRecentOrdersUI(orders) {
    const list = document.getElementById('recent-orders-list');
    if (!list) return;

    if (!orders || orders.length === 0) {
        list.innerHTML = '<tr><td colspan="4" class="text-muted" style="padding: 24px; text-align: center;">No recent orders found.</td></tr>';
        return;
    }

    list.innerHTML = orders.slice(0, 5).map(o => {
        let statusColor = '#0057d1'; // default primary
        let statusBg = '#eff6ff';
        const st = (o.status || 'pending').toLowerCase();
        
        if (st.includes('approv') || st.includes('complet')) {
            statusColor = '#10b981'; statusBg = '#ecfdf5';
        } else if (st.includes('reject') || st.includes('cancel')) {
            statusColor = '#ef4444'; statusBg = '#fef2f2';
        } else if (st.includes('pend')) {
            statusColor = '#f59e0b'; statusBg = '#fffbeb';
        }

        const patientName = o.patient?.name || o.patientName || o.patient || 'Unknown Patient';
        const pharmacyName = o.pharmacy?.name || o.pharmacyName || o.pharmacy || 'Any Pharmacy';
        const orderId = o.id ? `#ORD-${o.id.toString().slice(0,6)}` : '#ORD----';

        return `
            <tr style="border-bottom: 1px solid #f1f5f9; transition: background 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
                <td style="padding: 16px 12px; font-weight: 600; color: #0f172a;">${orderId}</td>
                <td style="padding: 16px 12px; color: #475569;">${patientName}</td>
                <td style="padding: 16px 12px; color: #475569;">${pharmacyName}</td>
                <td style="padding: 16px 12px;">
                    <span style="display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; color: ${statusColor}; background: ${statusBg};">
                        ${(o.status || 'Pending').charAt(0).toUpperCase() + (o.status || 'pending').slice(1)}
                    </span>
                </td>
            </tr>
        `;
    }).join('');
}
// Removed initRevenueChart as revenue metrics are no longer tracked in the dashboard.

function initOrdersChart(statusData) {
    const ctx = document.getElementById('ordersChart');
    if (!ctx) return;

    let pending = 0, confirmed = 0, completed = 0, rejected = 0;

    if (statusData && Object.keys(statusData).length > 0) {
        for (const [key, val] of Object.entries(statusData)) {
            const k = key.toLowerCase();
            if (k.includes('complet') || k.includes('approv') || k.includes('deliver')) completed += val;
            else if (k.includes('confirm')) confirmed += val;
            else if (k.includes('pend') || k.includes('process')) pending += val;
            else if (k.includes('cancel') || k.includes('reject')) rejected += val;
        }
    }

    const total = pending + confirmed + completed + rejected;
    
    let labels, values, colors;
    if (total > 0) {
        labels = ['Pending', 'Confirmed', 'Completed', 'Rejected/Cancelled'];
        values = [pending, confirmed, completed, rejected];
        colors = ['#f59e0b', '#6366f1', '#10b981', '#ef4444'];
    } else {
        labels = ['No Orders'];
        values = [1];
        colors = ['#e2e8f0'];
    }

    // Destroy existing chart if re-rendering
    if (ctx._chartInstance) ctx._chartInstance.destroy();

    ctx._chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data: values,
                backgroundColor: colors,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '75%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: { family: "'Inter', sans-serif" }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            if (total === 0) return ' 0 Orders';
                            return ` ${context.label}: ${context.raw}`;
                        }
                    }
                }
            }
        }
    });
}

function updateTopPharmaciesUI(pharmacies) {
    const list = document.getElementById('top-pharmacies-list');
    if (!list) return;

    if (!pharmacies || pharmacies.length === 0) {
        list.innerHTML = '<p class="text-muted" style="padding: 24px;">No top pharmacies available.</p>';
        return;
    }

    list.innerHTML = pharmacies.slice(0, 5).map((p, index) => `
        <div class="pharmacy-item" style="display: flex; align-items: center; padding: 12px 16px; border-bottom: 1px solid #f1f5f9;">
            <div style="font-size: 18px; font-weight: 700; color: #94a3b8; width: 30px;">#${index + 1}</div>
            <div class="pharmacy-info" style="flex: 1;">
                <h4 style="margin: 0; font-size: 14px; color: #0f172a;">${p.name || 'Unknown Pharmacy'}</h4>
                <p style="margin: 4px 0 0; font-size: 12px; color: #64748b;">Ranked by activity</p>
            </div>
            <div class="pharmacy-revenue" style="font-weight: 600; color: #10b981; font-size: 14px;">
                ${(p.orderCount || p.logs || p.revenue || 0).toLocaleString()} Requests
            </div>
        </div>
    `).join('');
}

function updateTopMedicinesUI(medicines) {
    const list = document.getElementById('top-medicines-list');
    if (!list) return;

    if (!medicines || medicines.length === 0) {
        list.innerHTML = '<p class="text-muted" style="padding: 24px;">No medicine data available.</p>';
        return;
    }

    list.innerHTML = medicines.slice(0, 5).map(m => `
        <div class="activity-item" style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9;">
            <div class="activity-icon warning">
                <i class='bx bx-capsule'></i>
            </div>
            <div class="activity-content" style="flex: 1;">
                <h4 style="margin: 0; font-size: 14px;">${m.name || 'Medicine'}</h4>
                <p style="margin: 4px 0 0; font-size: 12px; color: #64748b;">${m.category || 'Pharmaceuticals'}</p>
            </div>
            <span class="activity-time" style="font-weight: 600; color: #0f172a;">${(m.soldCount || m.quantity || 0)} Units</span>
        </div>
    `).join('');
}

function updateActivityUI(activity) {
    const list = document.getElementById('recent-activity-list');
    if (!list) return;

    if (!activity || activity.length === 0) {
        list.innerHTML = '<p class="text-muted" style="padding: 24px;">No recent activity.</p>';
        return;
    }

    list.innerHTML = activity.slice(0, 5).map(item => {
        const title = item.action || item.title || 'Action Taken';
        
        let desc = item.description || item.message;
        if (!desc) {
            desc = item.entityType ? `Action on ${item.entityType} by ${item.actorType || 'System'}` : 'System Activity';
        }
        
        let timeStr = item.time || 'recent';
        if (item.createdAt) {
            const d = new Date(item.createdAt);
            timeStr = isNaN(d) ? 'recent' : d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        }

        return `
        <div class="activity-item">
            <div class="activity-icon primary">
                <i class='bx bx-info-circle'></i>
            </div>
            <div class="activity-content">
                <h4>${title}</h4>
                <p>${desc}</p>
            </div>
            <span class="activity-time">${timeStr}</span>
        </div>
        `;
    }).join('');
}

function initActiveUsersChart(data) {
    const ctx = document.getElementById('activeUsersChart');
    if (!ctx) return;

    let labels = [];
    let values = [];

    if (data && data.length > 0) {
        data.slice(-7).forEach(item => {
            let dateStr = 'N/A';
            if (item.date && item.date !== 'N/A') {
                const dateObj = new Date(item.date);
                if (!isNaN(dateObj)) {
                    dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }
            }
            labels.push(dateStr);
            values.push(item.value || 0);
        });
    } else {
        labels = ['N/A'];
        values = [0];
    }

    if (ctx._chartInstance) ctx._chartInstance.destroy();

    ctx._chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Active Users',
                data: values,
                borderColor: '#0057d1',
                backgroundColor: 'rgba(0, 87, 209, 0.1)',
                borderWidth: 2,
                pointBackgroundColor: '#0057d1',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return ` ${context.raw} users`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false }
                },
                y: {
                    beginAtZero: true,
                    ticks: { precision: 0 },
                    grid: { borderDash: [5, 5] }
                }
            }
        }
    });
}
