document.addEventListener('DOMContentLoaded', () => {
    loadReports();
    initExportPDF();
});

async function loadReports() {
    try {
        console.log('[Reports] Fetching admin analytics...');
        
        // Fetch all analytics in parallel (excluding revenue as per request)
        const [usersRes, ordersRes, topPharmaciesRes] = await Promise.all([
            fetchUserAnalytics().catch(() => ({ data: {} })),
            fetchOrderAnalytics().catch(() => ({ data: {} })),
            fetchTopPharmaciesAnalytics().catch(() => ({ data: [] }))
        ]);

        const users = usersRes?.data || usersRes || {};
        const orders = ordersRes?.data || ordersRes || {};
        const topPharmacies = topPharmaciesRes?.data || topPharmaciesRes || [];

        updateReportsSummary(orders, topPharmacies);
        
        // Mock data mapping for visual charts if real data not available
        updateBarChart(users?.monthlyEnrollment || [20, 35, 50, 40, 65, 80, 95]);
        
        updateLineCharts(users?.monthlyGrowth || [150, 130, 140, 90, 110, 50, 20]);
        
        updatePieCharts(users?.specializations || [50, 30, 20]);
        
        // Doughnut chart for orders breakdown
        updateOrdersDoughnut(orders.ordersByStatus || {});
        
        // Map Top Pharmacies horizontal bars
        updateHorizontalBars(topPharmacies || []);
        
        console.log('[Reports] All analytics charts updated.');
    } catch (err) {
        console.error('[Reports] Error loading analytics:', err);
    }
}

function updateReportsSummary(orders, topPharmacies) {
    const totalOrdersEl = document.getElementById('rep-total-orders');
    const topPharmacyEl = document.getElementById('rep-top-pharmacy');

    // Orders
    const ordersPerDay = orders.ordersPerDay || [];
    const totalOrders = ordersPerDay.reduce((sum, item) => sum + (item.count || 0), 0);
    if (totalOrdersEl) totalOrdersEl.textContent = totalOrders.toLocaleString();

    // Top Pharmacy
    if (topPharmacyEl) {
        if (topPharmacies && topPharmacies.length > 0) {
            topPharmacyEl.textContent = topPharmacies[0].name || 'N/A';
        } else {
            topPharmacyEl.textContent = 'N/A';
        }
    }
}

function updateOrdersDoughnut(statusData) {
    const doughnut = document.getElementById('rep-orders-doughnut');
    const successLabel = document.getElementById('rep-orders-success');
    if (!doughnut) return;

    let total = 0;
    let completed = 0;
    let pending = 0;
    let cancelled = 0;

    if (Object.keys(statusData).length > 0) {
        for (const [key, val] of Object.entries(statusData)) {
            total += val;
            if (key.toLowerCase().includes('complet')) completed += val;
            else if (key.toLowerCase().includes('pend')) pending += val;
            else if (key.toLowerCase().includes('cancel')) cancelled += val;
        }
    } else {
        completed = 65; pending = 25; cancelled = 10; total = 100;
    }

    const completedPct = total > 0 ? (completed / total) * 100 : 0;
    const pendingPct = total > 0 ? (pending / total) * 100 : 0;

    if (successLabel) successLabel.textContent = `${completedPct.toFixed(0)}%`;
    
    // CSS Conic Gradient
    doughnut.style.background = `conic-gradient(var(--success) 0% ${completedPct}%, var(--warning) ${completedPct}% ${completedPct + pendingPct}%, var(--danger) ${completedPct + pendingPct}% 100%)`;
}

function updateBarChart(data) {
    const bars = document.querySelectorAll('.bar-chart .bar');
    bars.forEach((bar, index) => {
        if (data[index] !== undefined) {
            bar.style.height = `${data[index]}%`;
        }
    });
}

function updateLineCharts(growthData) {
    // Growth Chart (Patients Growth)
    const growthPolyline = document.querySelector('.line-chart-container polyline[stroke="#0057d1"]');
    const growthFill = document.querySelector('.line-chart-container polyline[fill="url(#lineGrad)"]');
    if (growthPolyline) {
        const points = growthData.map((val, i) => `${i * 66},${200 - val}`).join(' ');
        growthPolyline.setAttribute('points', points);
        if (growthFill) growthFill.setAttribute('points', `0,200 ${points} 400,200`);
    }
}

function updatePieCharts(specializations) {
    const pie = document.querySelector('.pie-chart');
    if (pie && specializations.length >= 3) {
        const [c1, c2, c3] = specializations;
        pie.style.background = `conic-gradient(#0057d1 0% ${c1}%, #6CB5FF ${c1}% ${c1+c2}%, #E2E8F0 ${c1+c2}% 100%)`;
    }
}

function updateHorizontalBars(pharmacies) {
    const container = document.querySelector('.horizontal-bars');
    if (!container || !pharmacies.length) return;

    const bars = container.querySelectorAll('.h-bar-item');
    const maxRev = Math.max(...pharmacies.map(p => p.revenue || 0), 1);
    
    pharmacies.slice(0, 5).forEach((pharmacy, index) => {
        if (bars[index]) {
            const rev = pharmacy.revenue || 0;
            const pct = Math.round((rev / maxRev) * 100);
            
            bars[index].querySelector('.h-bar-label span:first-child').textContent = pharmacy.name || 'Pharmacy';
            bars[index].querySelector('.h-bar-label span:last-child').textContent = `${(pharmacy.orderCount || 0).toLocaleString()} Orders`;
            bars[index].querySelector('.h-bar-fill').style.width = `${pct}%`;
        }
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

            content.classList.add('pdf-mode');

            const opt = {
                margin: [10, 10], 
                filename: 'Pharmacy_Care_Admin_Report.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, logging: false },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
            };

            html2pdf().set(opt).from(content).save().then(() => {
                content.classList.remove('pdf-mode');
                exportBtn.innerHTML = originalText;
                exportBtn.disabled = false;
            }).catch(err => {
                console.error('[Reports] Export error:', err);
                content.classList.remove('pdf-mode');
                exportBtn.innerHTML = originalText;
                exportBtn.disabled = false;
                alert('Failed to export PDF.');
            });
        });
    }
}
