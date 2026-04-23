// Dashboard Analytics API
const DASHBOARD_ENDPOINTS = {
    STATS: '/admin/stats',
    ANALYTICS_ORDERS: '/admin/analytics/orders',
    TOP_PHARMACIES: '/admin/analytics/top-pharmacies',
    TOP_MEDICINES: '/admin/analytics/top-medicines',
    RECENT_ACTIVITY: '/admin/activity/logs',
    RECENT_ORDERS: '/admin/orders?pageSize=10'
};

/**
 * Fetch main dashboard stats (Patients, Pharmacists, etc.)
 */
async function fetchDashboardStats() {
    return apiClient.get(DASHBOARD_ENDPOINTS.STATS);
}

/**
 * Fetch orders analytics for the charts
 */
async function fetchAnalyticsOrders() {
    return apiClient.get(DASHBOARD_ENDPOINTS.ANALYTICS_ORDERS);
}

/**
 * Fetch top performing pharmacies
 */
async function fetchAnalyticsTopPharmacies() {
    return apiClient.get(DASHBOARD_ENDPOINTS.TOP_PHARMACIES);
}

/**
 * Fetch most requested medicines
 */
async function fetchAnalyticsTopMedicines() {
    return apiClient.get(DASHBOARD_ENDPOINTS.TOP_MEDICINES);
}

/**
 * Fetch latest system activity
 */
async function fetchRecentActivity() {
    return apiClient.get(DASHBOARD_ENDPOINTS.RECENT_ACTIVITY);
}

/**
 * Fetch latest orders list
 */
async function fetchRecentOrders() {
    return apiClient.get(DASHBOARD_ENDPOINTS.RECENT_ORDERS);
}
