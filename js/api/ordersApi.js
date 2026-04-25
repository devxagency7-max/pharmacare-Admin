// API endpoints for Orders (Admin-specific)
const ORDERS_ENDPOINTS = {
    LIST: '/admin/orders',
    ANALYTICS: '/admin/analytics/orders'
};

async function fetchOrders(page = 1, pageSize = 20, search = '', status = '') {
    let query = `page=${page}&pageSize=${pageSize}`;
    if (search) query += `&search=${encodeURIComponent(search)}`;
    if (status && status !== 'all') query += `&status=${status}`;
    
    return apiClient.get(`${ORDERS_ENDPOINTS.LIST}?${query}`);
}

async function fetchOrderAnalytics() {
    return apiClient.get(ORDERS_ENDPOINTS.ANALYTICS);
}

async function fetchOrderById(id) {
    return apiClient.get(`${ORDERS_ENDPOINTS.LIST}/${id}`);
}

// Keep branch-specific fetch for internal use if needed
async function fetchOrdersByBranch(branchId) {
    return apiClient.get(`/orders/branch/${branchId}`);
}

