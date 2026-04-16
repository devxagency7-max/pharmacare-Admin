document.addEventListener('DOMContentLoaded', () => {
    loadInterns();
});
async function loadInterns() {
    try {
        const data = await fetchInternPharmacists();
        console.log('[Intern Pharmacists] Loaded data.');
    } catch (err) {
        console.error(err);
    }
}
