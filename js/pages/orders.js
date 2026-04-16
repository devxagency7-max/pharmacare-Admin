document.addEventListener('DOMContentLoaded', () => {
    loadOrders();
});
async function loadOrders() {
    try {
        const data = await fetchOrders();
        console.log('[Orders] Loaded data.');
    } catch (err) {
        console.error(err);
    }
}
