document.addEventListener('DOMContentLoaded', () => {
    // Initialize page logic when DOM is ready
    loadPatients();
});

async function loadPatients() {
    console.log('[Patients Page] Loading patients from API...');
    try {
        const patients = await fetchPatients();
        // TODO: Populate table with patients data
        console.log('[Patients Page] Patients loaded successfully', patients);
    } catch (error) {
        console.error('[Patients Page] failed to load patients:', error);
    }
}
