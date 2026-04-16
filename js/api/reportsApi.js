const API_BASE_URL = '/api/admin';

async function fetchReportData() {
    console.log(`GET ${API_BASE_URL}/reports/overview`);
    return {};
}
async function exportReport(format) {
    console.log(`GET ${API_BASE_URL}/reports/export?format=${format}`);
}
