document.addEventListener('DOMContentLoaded', () => {
    loadPharmacyRequests();
    initFilterTabs();
});

function initFilterTabs() {
    const filterTabs = document.querySelectorAll('.filter-tab');
    const requestCards = document.querySelectorAll('.request-card');

    if (filterTabs.length > 0 && requestCards.length > 0) {
        filterTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                filterTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                const filterValue = tab.getAttribute('data-filter');

                requestCards.forEach(card => {
                    if (filterValue === 'all') {
                        card.style.display = 'block';
                    } else {
                        const cardStatus = card.getAttribute('data-status');
                        if (cardStatus === filterValue) {
                            card.style.display = 'block';
                        } else {
                            card.style.display = 'none';
                        }
                    }
                });
            });
        });
    }
}

async function loadPharmacyRequests() {
    console.log('[Approve Pharmacies] Loading registration requests...');
    try {
        const requests = await fetchPharmacyRequests();
        console.log('[Approve Pharmacies] Requests loaded', requests);
    } catch (err) {
        console.error('Error loading requests:', err);
    }
}

async function approvePharmacy(id) {
    console.log(`[Approve Pharmacies] Approving pharmacy ${id}...`);
    try {
        await approvePharmacyApi(id);
        // Refresh requests after approval
        loadPharmacyRequests();
    } catch (err) {
        console.error('Error approving pharmacy:', err);
    }
}

async function rejectPharmacy(id) {
    console.log(`[Approve Pharmacies] Rejecting pharmacy ${id}...`);
    try {
        await rejectPharmacyApi(id);
        // Refresh requests after rejection
        loadPharmacyRequests();
    } catch (err) {
        console.error('Error rejecting pharmacy:', err);
    }
}
