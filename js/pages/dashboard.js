document.addEventListener('DOMContentLoaded', () => {
    loadDashboardData();
});

async function loadDashboardData() {
    console.log('[Dashboard] Loading Analytics Data Concurrently...');
    
    // UI Elements
    const statPatients = document.getElementById('stat-total-patients');
    const statPharmacists = document.getElementById('stat-total-pharmacists');
    const statInterns = document.getElementById('stat-total-interns');
    const statPharmacies = document.getElementById('stat-total-pharmacies');
    const statOrders = document.getElementById('stat-total-orders');
    const statAvgOrder = document.getElementById('stat-avg-order-value');
    const statRevenue = document.getElementById('stat-total-revenue');

    // 1. Fetch Users & Pharmacies
    fetchDashboardStats().then(stats => {
        const data = stats?.data || stats || {};
        if (statPatients) statPatients.textContent = (data.totalPatients || 0).toLocaleString();
        if (statPharmacists) statPharmacists.textContent = (data.totalPharmacists || 0).toLocaleString();
        if (statInterns) statInterns.textContent = (data.totalInterns || 0).toLocaleString();
        if (statPharmacies) statPharmacies.textContent = (data.totalPharmacies || 0).toLocaleString();

        // Self-Healing Logic
        if (!data.totalPatients && !data.totalPharmacists && statPatients) {
            console.log('[Dashboard] Self-healing: Scanning users...');
            apiClient.get('/admin/users?pageSize=1000').then(usersRes => {
                const users = usersRes?.data?.items || usersRes?.data || [];
                if (statPatients) statPatients.textContent = users.filter(u => (u.roles || u.role || u.type || '').toString().toLowerCase().includes('patient')).length.toLocaleString();
                if (statPharmacists) statPharmacists.textContent = users.filter(u => (u.roles || u.role || u.type || '').toString().toLowerCase().includes('pharmacist')).length.toLocaleString();
                if (statInterns) statInterns.textContent = users.filter(u => (u.roles || u.role || u.type || '').toString().toLowerCase().includes('intern')).length.toLocaleString();
            }).catch(e => console.warn('Discovery failed', e));

            apiClient.get('/admin/pharmacies?pageSize=1').then(pharmRes => {
                const total = pharmRes?.data?.totalCount || pharmRes?.data?.items?.length || 0;
                if (statPharmacies) statPharmacies.textContent = total.toLocaleString();
            }).catch(() => {
                if (statPharmacies) statPharmacies.textContent = '0';
            });
        }
    }).catch(err => {
        console.warn('Failed to load users stats:', err);
        // Fallback to discovery
        apiClient.get('/admin/users?pageSize=1000').then(usersRes => {
            const users = usersRes?.data?.items || usersRes?.data || [];
            if (statPatients) statPatients.textContent = users.filter(u => (u.roles || u.role || u.type || '').toString().toLowerCase().includes('patient')).length.toLocaleString();
            if (statPharmacists) statPharmacists.textContent = users.filter(u => (u.roles || u.role || u.type || '').toString().toLowerCase().includes('pharmacist')).length.toLocaleString();
            if (statInterns) statInterns.textContent = users.filter(u => (u.roles || u.role || u.type || '').toString().toLowerCase().includes('intern')).length.toLocaleString();
        }).catch(e => console.warn('Discovery fallback failed', e));

        apiClient.get('/admin/pharmacies?pageSize=1').then(pharmRes => {
            const total = pharmRes?.data?.totalCount || pharmRes?.data?.items?.length || 0;
            if (statPharmacies) statPharmacies.textContent = total.toLocaleString();
        }).catch(() => {
            if (statPharmacies) statPharmacies.textContent = '0';
        });
    });

    // 2. Fetch Orders Analytics
    fetchAnalyticsOrders().then(ordersData => {
        const orders = ordersData?.data || {};
        const ordersPerDay = orders.ordersPerDay || [];
        const totalOrdersCount = ordersPerDay.reduce((sum, item) => sum + (item.count || 0), 0);
        
        if (statOrders) statOrders.textContent = totalOrdersCount.toLocaleString();
        
        initOrdersChart(orders.ordersByStatus || { 'Approved': 65, 'Pending': 25, 'Rejected': 10 });
    }).catch(err => {
        console.warn('Failed to load orders analytics:', err);
        if (statOrders) statOrders.textContent = '0';
        initOrdersChart({ 'Approved': 65, 'Pending': 25, 'Rejected': 10 });
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
    fetchRecentOrders().then(res => {
        const ordersList = Array.isArray(res) ? res : (res?.data?.items || res?.data || []);
        updateRecentOrdersUI(ordersList);
    }).catch(err => {
        console.warn('Failed to load recent orders:', err);
        updateRecentOrdersUI([]);
    });
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

    // Mapping API status structure to arrays, fallback to dummies
    // Ensure we map standard terms to the pharmacy workflow: Approved, Pending, Rejected
    let approved = 0, pending = 0, rejected = 0;
    
    if (Object.keys(statusData).length) {
        for (const [k, v] of Object.entries(statusData)) {
            const key = k.toLowerCase();
            if (key.includes('complet') || key.includes('approv')) approved += v;
            else if (key.includes('pend')) pending += v;
            else if (key.includes('cancel') || key.includes('reject')) rejected += v;
        }
    } else {
        approved = 65; pending = 25; rejected = 10;
    }

    const labels = ['Approved', 'Pending', 'Rejected'];
    const values = [approved, pending, rejected];
    
    const colors = ['#10b981', '#f59e0b', '#ef4444']; // Success, Warning, Danger

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
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

    list.innerHTML = activity.slice(0, 5).map(item => `
        <div class="activity-item">
            <div class="activity-icon primary">
                <i class='bx bx-info-circle'></i>
            </div>
            <div class="activity-content">
                <h4>${item.title || 'Action Taken'}</h4>
                <p>${item.description || item.message}</p>
            </div>
            <span class="activity-time">${item.time || 'recent'}</span>
        </div>
    `).join('');
}
