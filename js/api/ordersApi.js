// API endpoints for Orders
const ORDERS_ENDPOINTS = {
    TOTAL_COUNT: '/admin/orders/total',
    PER_PHARMACY: '/admin/orders/per-pharmacy',
    ANALYTICS: '/admin/analytics/orders',
    GLOBAL_STATS: '/admin/stats'
};

/**
 * Fetch total orders count
 */
async function fetchTotalOrdersCount() {
    return apiClient.get(ORDERS_ENDPOINTS.TOTAL_COUNT);
}

/**
 * Fetch orders statistics (Pending, Approved, Rejected etc.)
 */
async function fetchOrdersStats() {
    // We can get these from global stats or analytics
    return apiClient.get(ORDERS_ENDPOINTS.GLOBAL_STATS);
}

/**
 * Fetch orders per pharmacy for the main table
 */
async function fetchOrdersPerPharmacy() {
    return apiClient.get(ORDERS_ENDPOINTS.PER_PHARMACY);
}

/**
 * Fetch order analytics for breakdown
 */
async function fetchOrderAnalytics() {
    return apiClient.get(ORDERS_ENDPOINTS.ANALYTICS);
}
