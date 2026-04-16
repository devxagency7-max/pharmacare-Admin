const API_BASE_URL = '/api/admin';

async function fetchSettings() {
    console.log(`GET ${API_BASE_URL}/settings`);
    return {};
}
async function updateSettings(data) {
    console.log(`PUT ${API_BASE_URL}/settings`, data);
}
