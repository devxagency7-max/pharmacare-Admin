const API_BASE_URL = '/api/admin';

async function fetchPharmacists() {
    console.log(`GET ${API_BASE_URL}/pharmacists`);
    return [];
}
async function createPharmacist(data) {
    console.log(`POST ${API_BASE_URL}/pharmacists`, data);
}
async function updatePharmacist(id, data) {
    console.log(`PUT ${API_BASE_URL}/pharmacists/${id}`, data);
}
async function deletePharmacist(id) {
    console.log(`DELETE ${API_BASE_URL}/pharmacists/${id}`);
}
