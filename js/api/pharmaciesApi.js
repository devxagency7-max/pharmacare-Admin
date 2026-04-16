const API_BASE_URL = '/api/admin';

// Pharmacies API hooks for Backend Integration
async function fetchPharmacies() {
    console.log(`GET ${API_BASE_URL}/pharmacies`);
    return [];
}

async function fetchPharmacyRequests() {
    console.log(`GET ${API_BASE_URL}/pharmacies/requests`);
    return [];
}

async function approvePharmacyApi(id) {
    console.log(`POST ${API_BASE_URL}/pharmacies/${id}/approve`);
}

async function rejectPharmacyApi(id) {
    console.log(`POST ${API_BASE_URL}/pharmacies/${id}/reject`);
}
