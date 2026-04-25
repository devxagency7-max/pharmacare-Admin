document.addEventListener('DOMContentLoaded', () => {
    loadReports();
    initExportPDF();
});

async function loadReports() {
    try {
        console.log('[Reports] Fetching admin analytics...');
        
        const [usersRes, ordersRes, topPharmaciesRes, topMedsRes, perfRes] = await Promise.all([
            fetchUserAnalytics().catch(() => ({ data: {} })),
            fetchOrderAnalytics().catch(() => ({ data: {} })),
            fetchTopPharmaciesAnalytics().catch(() => ({ data: [] })),
            fetchTopMedicinesAnalytics().catch(() => ({ data: [] })),
            fetchPharmacistPerformance().catch(() => ({ data: [] }))
        ]);

        const users = usersRes?.data || usersRes || {};
        const orders = ordersRes?.data || ordersRes || {};
        const topPharmacies = topPharmaciesRes?.data || topPharmaciesRes || [];
        const topMeds = topMedsRes?.data || topMedsRes || [];
        const perfData = perfRes?.data || perfRes || [];

        updateReportsSummary(orders, topPharmacies, users, topMeds, perfData);
        
        // Map User Data
        const newUsers = users.newUsersPerDay || [];
        const activeUsers = users.activeUsersPerDay || [];

        const activeUserValues = activeUsers.map(u => u.value || 0);

        updateBarChart(newUsers.length > 0 ? newUsers : [{date: 'N/A', value: 0}]);
        updateLineCharts(activeUserValues.length > 0 ? activeUserValues : [0, 0, 0, 0, 0]);
        
        // Top Medicines Bars
        updateTopMedsBars(topMeds || []);
        
        // Orders Breakdown
        updateOrdersDoughnut(orders.ordersByStatus || {});
        
        // Top Pharmacies
        updateHorizontalBars(topPharmacies || []);

        // Pharmacist Performance
        updatePharmacistBars(perfData || []);
        
        console.log('[Reports] All analytics charts updated.');
    } catch (err) {
        console.error('[Reports] Error loading analytics:', err);
    }
}

function updateReportsSummary(orders, topPharmacies, users, topMeds, perfData) {
    const totalOrdersEl = document.getElementById('rep-total-orders');
    const pendingOrdersEl = document.getElementById('rep-pending-orders');
    const completedOrdersEl = document.getElementById('rep-completed-orders');
    const cancelledOrdersEl = document.getElementById('rep-cancelled-orders');
    const totalUsersEl = document.getElementById('rep-total-users');
    const newPatientsTodayEl = document.getElementById('rep-new-patients-today');
    const activePatientsTodayEl = document.getElementById('rep-active-patients-today');
    const activePharmEl = document.getElementById('rep-active-pharmacists');
    const avgResponseEl = document.getElementById('rep-avg-response');
    const totalMsgsEl = document.getElementById('rep-total-msgs');
    const topPharmacyEl = document.getElementById('rep-top-pharmacy');
    const topMedicineEl = document.getElementById('rep-top-medicine');

    // Orders
    const ordersPerDay = orders.ordersPerDay || [];
    const totalOrders = ordersPerDay.reduce((sum, item) => sum + (item.count || item.value || 0), 0);
    
    let fallbackTotal = 0;
    let pendingCount = 0;
    let completedCount = 0;
    let cancelledCount = 0;
    if (orders.ordersByStatus) {
        for (const [key, val] of Object.entries(orders.ordersByStatus)) {
            fallbackTotal += val;
            if (key.toLowerCase().includes('pend') || key.toLowerCase().includes('process')) {
                pendingCount += val;
            }
            if (key.toLowerCase().includes('complet') || key.toLowerCase().includes('approv') || key.toLowerCase().includes('deliver')) {
                completedCount += val;
            }
            if (key.toLowerCase().includes('cancel') || key.toLowerCase().includes('reject')) {
                cancelledCount += val;
            }
        }
    }

    if (totalOrdersEl) totalOrdersEl.textContent = (totalOrders > 0 ? totalOrders : fallbackTotal).toLocaleString();
    if (pendingOrdersEl) pendingOrdersEl.textContent = pendingCount.toLocaleString();
    if (completedOrdersEl) completedOrdersEl.textContent = completedCount.toLocaleString();
    if (cancelledOrdersEl) cancelledOrdersEl.textContent = cancelledCount.toLocaleString();

    // Patients (Users)
    let totalUsersCount = users.totalUsers || 0;
    if (!totalUsersCount && users.newUsersPerDay) {
        totalUsersCount = users.newUsersPerDay.reduce((sum, item) => sum + (item.value || 0), 0);
    }
    if (totalUsersEl) totalUsersEl.textContent = totalUsersCount.toLocaleString();

    if (newPatientsTodayEl) {
        const newArr = users.newUsersPerDay || [];
        newPatientsTodayEl.textContent = newArr.length > 0 ? newArr[newArr.length - 1].value.toLocaleString() : '0';
    }
    
    if (activePatientsTodayEl) {
        const actArr = users.activeUsersPerDay || [];
        activePatientsTodayEl.textContent = actArr.length > 0 ? actArr[actArr.length - 1].value.toLocaleString() : '0';
    }

    // Pharmacists & Response Time
    if (activePharmEl) activePharmEl.textContent = perfData && perfData.length > 0 ? perfData.length.toLocaleString() : '0';
    if (avgResponseEl) {
        let avgMins = 0;
        if (perfData && perfData.length > 0) {
            const sumMins = perfData.reduce((sum, p) => sum + (p.averageResponseTimeMinutes || 0), 0);
            avgMins = Math.round(sumMins / perfData.length);
        }
        avgResponseEl.textContent = `${avgMins} min`;
    }
    if (totalMsgsEl) {
        const totalMsgs = perfData ? perfData.reduce((sum, p) => sum + (p.messagesHandled || 0), 0) : 0;
        totalMsgsEl.textContent = totalMsgs.toLocaleString();
    }

    // Top Pharmacy
    if (topPharmacyEl) {
        if (topPharmacies && topPharmacies.length > 0) {
            topPharmacyEl.textContent = topPharmacies[0].name || topPharmacies[0].pharmacyName || 'N/A';
        } else {
            topPharmacyEl.textContent = 'N/A';
        }
    }

    // Top Medicine
    if (topMedicineEl) {
        if (topMeds && topMeds.length > 0) {
            topMedicineEl.textContent = topMeds[0].name || 'N/A';
        } else {
            topMedicineEl.textContent = 'N/A';
        }
    }
}

function updateOrdersDoughnut(statusData) {
    const ctx = document.getElementById('ordersDoughnut');
    if (!ctx) return;

    let total = 0, completed = 0, pending = 0, cancelled = 0;

    if (Object.keys(statusData).length > 0) {
        for (const [key, val] of Object.entries(statusData)) {
            total += val;
            const k = key.toLowerCase();
            if (k.includes('complet') || k.includes('approv') || k.includes('deliver')) completed += val;
            else if (k.includes('pend') || k.includes('process')) pending += val;
            else if (k.includes('cancel') || k.includes('reject')) cancelled += val;
        }
    }

    if (ctx._chartInstance) ctx._chartInstance.destroy();

    const labels = total > 0 ? ['Approved', 'Pending', 'Cancelled'] : ['No Orders'];
    const values = total > 0 ? [completed, pending, cancelled] : [1];
    const colors = total > 0 ? ['#10b981', '#f59e0b', '#ef4444'] : ['#e2e8f0'];

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
                legend: { position: 'bottom', labels: { usePointStyle: true, padding: 15, font: { family: "'Inter', sans-serif" } } },
                tooltip: { callbacks: { label: (c) => total === 0 ? ' 0 Orders' : ` ${c.label}: ${c.raw}` } }
            }
        }
    });
}

function updateBarChart(data) {
    const ctx = document.getElementById('newUsersChart');
    if (!ctx) return;
    
    if (ctx._chartInstance) ctx._chartInstance.destroy();

    const labels = [];
    const values = [];

    data.slice(-7).forEach(item => {
        let dateStr = 'N/A';
        if (item.date && item.date !== 'N/A') {
            const dateObj = new Date(item.date);
            if (!isNaN(dateObj)) dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
        labels.push(dateStr);
        values.push(item.value || 0);
    });

    ctx._chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'New Users',
                data: values,
                backgroundColor: '#0057d1',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false } },
                y: { beginAtZero: true, ticks: { precision: 0 }, grid: { borderDash: [5, 5] } }
            }
        }
    });
}

function updateLineCharts(growthData) {
    const ctx = document.getElementById('activeUsersChart');
    if (!ctx) return;
    
    if (ctx._chartInstance) ctx._chartInstance.destroy();

    const labels = growthData.map((_, i) => `Day ${i+1}`);

    ctx._chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Active Users',
                data: growthData,
                borderColor: '#0057d1',
                backgroundColor: 'rgba(0, 87, 209, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { display: false },
                y: { display: false, beginAtZero: true }
            }
        }
    });
}

function updateTopMedsBars(topMeds) {
    const container = document.getElementById('top-meds-bars');
    if (!container) return;

    container.innerHTML = '';

    if (!topMeds || topMeds.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); font-size: 13px; text-align: center;">No data available.</p>';
        return;
    }

    const medsToUse = topMeds.slice(0, 3);
    const maxVal = Math.max(...medsToUse.map(m => m.orderCount || m.quantity || m.value || 1));
    
    medsToUse.forEach(m => {
        const val = m.orderCount || m.quantity || m.value || 0;
        const pct = Math.round((val / maxVal) * 100) || 0;
        const name = m.name || 'Medicine';

        container.innerHTML += `
            <div class="h-bar-item">
                <div class="h-bar-label"><span>${name}</span><span>${val.toLocaleString()}</span></div>
                <div class="h-bar-bg"><div class="h-bar-fill" style="width: ${pct}%; background: var(--primary);"></div></div>
            </div>
        `;
    });
}

function updateHorizontalBars(pharmacies) {
    const container = document.getElementById('top-pharmacies-bars');
    if (!container) return;

    container.innerHTML = '';
    
    if (!pharmacies.length) {
        container.innerHTML = '<p style="color: var(--text-muted); font-size: 13px; text-align: center;">No pharmacy data available.</p>';
        return;
    }

    const maxRev = Math.max(...pharmacies.map(p => p.totalRevenue || p.revenue || p.orderCount || 1));
    
    pharmacies.slice(0, 5).forEach((pharmacy) => {
        const name = pharmacy.name || pharmacy.pharmacyName || 'Unknown Pharmacy';
        const val = pharmacy.totalRevenue || pharmacy.revenue || pharmacy.orderCount || 0;
        const pct = Math.round((val / maxRev) * 100);
        
        container.innerHTML += `
            <div class="h-bar-item">
                <div class="h-bar-label"><span>${name}</span><span>${val.toLocaleString()}</span></div>
                <div class="h-bar-bg"><div class="h-bar-fill" style="width: ${pct}%"></div></div>
            </div>
        `;
    });
}

function updatePharmacistBars(perfData) {
    const container = document.getElementById('pharmacist-perf-bars');
    if (!container) return;

    container.innerHTML = '';

    if (!perfData || perfData.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); font-size: 13px; text-align: center;">No data available.</p>';
        return;
    }

    const maxMsgs = Math.max(...perfData.map(p => p.messagesHandled || 1), 1);
    
    perfData.slice(0, 5).forEach(p => {
        const msgs = p.messagesHandled || 0;
        const pct = Math.round((msgs / maxMsgs) * 100);
        const name = p.pharmacistName || 'Pharmacist';
        // fallback to average response time if messages is 0 but we want to show some activity
        const subtext = msgs > 0 ? `${msgs} msgs` : `${p.averageResponseTimeMinutes || 0} min avg`;

        container.innerHTML += `
            <div class="h-bar-item">
                <div class="h-bar-label"><span>${name}</span><span>${subtext}</span></div>
                <div class="h-bar-bg"><div class="h-bar-fill" style="width: ${pct}%; background: var(--success);"></div></div>
            </div>
        `;
    });
}



function initExportPDF() {
    const exportBtn = document.getElementById('export-pdf-btn');
    const content = document.getElementById('reports-content');

    if (exportBtn && content) {
        exportBtn.addEventListener('click', () => {
            console.log('[Reports] Exporting PDF...');
            
            const originalText = exportBtn.innerHTML;
            exportBtn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Exporting...';
            exportBtn.disabled = true;
            
            const dateEl = document.getElementById('pdf-report-date');
            if (dateEl) dateEl.textContent = 'Generated on: ' + new Date().toLocaleString();

            document.body.classList.add('exporting-pdf');
            content.classList.add('pdf-mode');

            const opt = {
                margin: [10, 10], 
                filename: 'Pharmacy_Care_Admin_Report.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, logging: false, windowWidth: 1000 },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
            };

            html2pdf().set(opt).from(content).save().then(() => {
                document.body.classList.remove('exporting-pdf');
                content.classList.remove('pdf-mode');
                exportBtn.innerHTML = originalText;
                exportBtn.disabled = false;
            }).catch(err => {
                console.error('[Reports] Export error:', err);
                document.body.classList.remove('exporting-pdf');
                content.classList.remove('pdf-mode');
                exportBtn.innerHTML = originalText;
                exportBtn.disabled = false;
                alert('Failed to export PDF.');
            });
        });
    }
}
