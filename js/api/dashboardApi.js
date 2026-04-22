// Dashboard API hooks using centralized apiClient
async function fetchDashboardStats() {
    return await apiClient.get('/admin/stats');
}

async function fetchDashboardCharts() {
    return await apiClient.get('/admin/analytics/users');
}

async function fetchRecentActivity() {
    return await apiClient.get('/admin/activity');
}

async function fetchAnalyticsRevenue() {
    return await apiClient.get('/admin/analytics/revenue');
}

async function fetchAnalyticsOrders() {
    return await apiClient.get('/admin/analytics/orders');
}

async function fetchAnalyticsTopPharmacies() {
    return await apiClient.get('/admin/analytics/top-pharmacies');
}

async function fetchAnalyticsTopMedicines() {
    return await apiClient.get('/admin/analytics/top-medicines');
}

async function fetchRecentOrders() {
    return await apiClient.get('/admin/orders?page=1&pageSize=5');
}

