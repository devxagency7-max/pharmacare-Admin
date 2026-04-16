document.addEventListener('DOMContentLoaded', () => {
    loadMedications();
});
async function loadMedications() {
    try {
        const data = await fetchMedications();
        console.log('[Medications] Loaded data.');
    } catch (err) {
        console.error(err);
    }
}
