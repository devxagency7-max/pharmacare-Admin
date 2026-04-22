// Reports API hooks using centralized apiClient
async function fetchRevenueAnalytics() {
    return await apiClient.get('/admin/analytics/revenue');
}

async function fetchUserAnalytics() {
    return await apiClient.get('/admin/analytics/users');
}

async function fetchOrderAnalytics() {
    return await apiClient.get('/admin/analytics/orders');
}

async function fetchTopPharmaciesAnalytics() {
    return await apiClient.get('/admin/analytics/top-pharmacies');
}

async function fetchTopMedicinesAnalytics() {
    return await apiClient.get('/admin/analytics/top-medicines');
}

async function fetchPharmacistPerformance() {
    return await apiClient.get('/admin/pharmacist-performance');
}

async function fetchHighRiskPatients() {
    return await apiClient.get('/admin/high-risk-patients');
}
