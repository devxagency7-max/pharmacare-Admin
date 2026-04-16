document.addEventListener('DOMContentLoaded', () => {
    loadDashboardData();
});

async function loadDashboardData() {
    console.log('[Dashboard] Loading dashboard data...');
    try {
        const stats = await fetchDashboardStats();
        const chartsData = await fetchDashboardCharts();
        const activity = await fetchRecentActivity();
        const topPharmacies = await fetchTopPharmacies();

        // Initialize Charts with default or API data
        initDashboardCharts(chartsData);

        console.log('[Dashboard] Data loaded successfully.');
    } catch (err) {
        console.error('Error loading dashboard data:', err);
        // Still init charts with placeholders if API fails
        initDashboardCharts({});
    }
}

function initDashboardCharts(data) {
    // Orders Trend Chart
    const ordersCtx = document.getElementById('ordersChart');
    if (ordersCtx) {
        new Chart(ordersCtx, {
            type: 'bar',
            data: {
                labels: data.ordersLabels || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Orders Processed',
                    data: data.ordersData || [120, 190, 140, 210, 160, 95, 230],
                    backgroundColor: '#0057d1',
                    borderRadius: 4,
                    barPercentage: 0.6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { borderDash: [5, 5], color: '#E2E8F0' } },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    // Patients Growth Chart
    const patientsCtx = document.getElementById('patientsChart');
    if (patientsCtx) {
        const gradient = patientsCtx.getContext('2d').createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(108, 181, 255, 0.4)');
        gradient.addColorStop(1, 'rgba(108, 181, 255, 0)');

        new Chart(patientsCtx, {
            type: 'line',
            data: {
                labels: data.patientsLabels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Patient Registrations',
                    data: data.patientsData || [420, 580, 810, 750, 980, 1250],
                    borderColor: '#6CB5FF',
                    backgroundColor: gradient,
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#FFFFFF',
                    pointBorderColor: '#6CB5FF',
                    pointBorderWidth: 2,
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { borderDash: [5, 5], color: '#E2E8F0' } },
                    x: { grid: { display: false } }
                }
            }
        });
    }
}
