document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
});
async function loadSettings() {
    try {
        const data = await fetchSettings();
        console.log('[Settings] Loaded data.');
    } catch (err) {
        console.error(err);
    }
}
