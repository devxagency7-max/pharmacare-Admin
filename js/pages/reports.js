document.addEventListener('DOMContentLoaded', () => {
    loadReports();
});
async function loadReports() {
    try {
        const data = await fetchReportData();
        console.log('[Reports] Loaded data.');
    } catch (err) {
        console.error(err);
    }
}
