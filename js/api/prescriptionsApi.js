const API_BASE_URL = '/api/admin';

async function fetchPrescriptions() {
    console.log(`GET ${API_BASE_URL}/prescriptions`);
    return [];
}
async function approvePrescription(id) {
    console.log(`POST ${API_BASE_URL}/prescriptions/${id}/approve`);
}
async function rejectPrescription(id) {
    console.log(`POST ${API_BASE_URL}/prescriptions/${id}/reject`);
}
