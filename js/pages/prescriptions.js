document.addEventListener('DOMContentLoaded', () => {
    loadPrescriptions();
});
async function loadPrescriptions() {
    try {
        const data = await fetchPrescriptions();
        console.log('[Prescriptions] Loaded data.');
    } catch (err) {
        console.error(err);
    }
}
