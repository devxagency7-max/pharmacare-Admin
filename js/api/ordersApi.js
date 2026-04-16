const API_BASE_URL = '/api/admin';

async function fetchOrders() {
    console.log(`GET ${API_BASE_URL}/orders`);
    return [];
}
async function updateOrderStatus(id, status) {
    console.log(`PUT ${API_BASE_URL}/orders/${id}/status`, { status });
}
