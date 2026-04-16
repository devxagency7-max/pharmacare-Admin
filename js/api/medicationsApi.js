const API_BASE_URL = '/api/admin';

async function fetchMedications() {
    console.log(`GET ${API_BASE_URL}/medications`);
    return [];
}
async function createMedication(data) {
    console.log(`POST ${API_BASE_URL}/medications`, data);
}
async function updateMedication(id, data) {
    console.log(`PUT ${API_BASE_URL}/medications/${id}`, data);
}
async function deleteMedication(id) {
    console.log(`DELETE ${API_BASE_URL}/medications/${id}`);
}
