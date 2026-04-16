const API_BASE_URL = '/api/admin';

// Dashboard API hooks
async function fetchDashboardStats() {
    console.log(`GET ${API_BASE_URL}/dashboard/stats`);
    return {};
}

async function fetchDashboardCharts() {
    console.log(`GET ${API_BASE_URL}/dashboard/charts`);
    return {};
}

async function fetchRecentActivity() {
    console.log(`GET ${API_BASE_URL}/dashboard/recent-activity`);
    return [];
}

async function fetchTopPharmacies() {
    console.log(`GET ${API_BASE_URL}/dashboard/top-pharmacies`);
    return [];
}
