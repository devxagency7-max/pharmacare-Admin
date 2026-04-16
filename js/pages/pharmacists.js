document.addEventListener('DOMContentLoaded', () => {
    loadPharmacists();
});
async function loadPharmacists() {
    try {
        const data = await fetchPharmacists();
        console.log('[Pharmacists] Loaded data.');
    } catch (err) {
        console.error(err);
    }
}
