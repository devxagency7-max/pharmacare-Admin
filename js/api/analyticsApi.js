const ANALYTICS_ENDPOINTS = {
    ORDERS: '/admin/analytics/orders',
    TOP_PHARMACIES: '/admin/analytics/top-pharmacies',
    TOP_MEDICINES: '/admin/analytics/top-medicines',
    USERS: '/admin/analytics/users',
    PHARMACIST_PERF: '/admin/pharmacist-performance',
    REPORTS_HISTORY: '/admin/reports'
};

async function fetchOrderAnalytics() {
    return apiClient.get(ANALYTICS_ENDPOINTS.ORDERS);
}

async function fetchTopPharmaciesAnalytics() {
    return apiClient.get(ANALYTICS_ENDPOINTS.TOP_PHARMACIES);
}

async function fetchTopMedicinesAnalytics() {
    return apiClient.get(ANALYTICS_ENDPOINTS.TOP_MEDICINES);
}

async function fetchUserAnalytics() {
    return apiClient.get(ANALYTICS_ENDPOINTS.USERS);
}

async function fetchPharmacistPerformance() {
    return apiClient.get(ANALYTICS_ENDPOINTS.PHARMACIST_PERF);
}

async function fetchReportsHistory(page = 1, pageSize = 20) {
    return apiClient.get(`${ANALYTICS_ENDPOINTS.REPORTS_HISTORY}?page=${page}&pageSize=${pageSize}`);
}

// Global exports
window.fetchOrderAnalytics = fetchOrderAnalytics;
window.fetchTopPharmaciesAnalytics = fetchTopPharmaciesAnalytics;
window.fetchTopMedicinesAnalytics = fetchTopMedicinesAnalytics;
window.fetchUserAnalytics = fetchUserAnalytics;
window.fetchPharmacistPerformance = fetchPharmacistPerformance;
window.fetchReportsHistory = fetchReportsHistory;

