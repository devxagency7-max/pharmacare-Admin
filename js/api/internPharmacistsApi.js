const API_BASE_URL = '/api/admin';

async function fetchInternPharmacists() {
    console.log(`GET ${API_BASE_URL}/intern-pharmacists`);
    return [];
}
async function createInternPharmacist(data) {
    console.log(`POST ${API_BASE_URL}/intern-pharmacists`, data);
}
async function updateInternPharmacist(id, data) {
    console.log(`PUT ${API_BASE_URL}/intern-pharmacists/${id}`, data);
}
async function deleteInternPharmacist(id) {
    console.log(`DELETE ${API_BASE_URL}/intern-pharmacists/${id}`);
}
