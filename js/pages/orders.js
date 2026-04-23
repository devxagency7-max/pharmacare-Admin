document.addEventListener('DOMContentLoaded', () => {
    initOrdersPage();
});

async function initOrdersPage() {
    // UI Elements - stats cards
    const statTotal    = document.getElementById('stat-total');
    const statPending  = document.getElementById('stat-pending');
    const statApproved = document.getElementById('stat-approved');
    const statRejected = document.getElementById('stat-rejected');

    // Set loading state
    [statTotal, statPending, statApproved, statRejected].forEach(el => {
        if (el) el.textContent = '...';
    });

    // Use analytics endpoint — it returns ordersByStatus with real counts
    try {
        const res = await fetchOrderAnalytics();
        const statusData = res?.data?.ordersByStatus || {};

        const pending   = (statusData['Pending']          || 0) + (statusData['PricingResponded'] || 0);
        const confirmed = (statusData['Confirmed']         || 0);
        const completed = (statusData['Completed']         || 0);
        const rejected  = (statusData['Rejected']          || 0) + (statusData['Cancelled']       || 0);
        const total     = pending + confirmed + completed + rejected;

        if (statTotal)    statTotal.textContent    = total.toLocaleString();
        if (statPending)  statPending.textContent  = pending.toLocaleString();
        if (statApproved) statApproved.textContent = (confirmed + completed).toLocaleString();
        if (statRejected) statRejected.textContent = rejected.toLocaleString();

    } catch (err) {
        console.error('[Orders] Failed to load stats:', err);
        [statTotal, statPending, statApproved, statRejected].forEach(el => {
            if (el) el.textContent = '0';
        });
    }

    // Load per-pharmacy table
    loadOrdersTable();
}

async function loadOrdersTable() {
    const tableBody = document.querySelector('.data-table tbody');
    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 24px;"><i class="bx bx-loader-alt bx-spin"></i> Loading pharmacy orders...</td></tr>';

    try {
        const res = await fetchOrdersPerPharmacy();
        const pharmacies = res?.data || [];

        if (pharmacies.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 24px; color: var(--text-muted);">No pharmacy orders found.</td></tr>';
            return;
        }

        tableBody.innerHTML = pharmacies.map((item, index) => {
            const count = item.count || item.orderCount || 0;
            return `
            <tr>
                <td><strong>#PHM-${(index + 1).toString().padStart(3, '0')}</strong></td>
                <td>${item.pharmacyName || item.name || 'Unknown Pharmacy'}</td>
                <td><span style="font-weight:600; color:var(--primary);">${count.toLocaleString()} Orders</span></td>
                <td>${new Date().toLocaleDateString()}</td>
                <td><span class="status-badge success">Active</span></td>
                <td>
                    <button class="action-btn edit" onclick="viewPharmacyOrders('${item.pharmacyId || item.id || ''}')">
                        <i class='bx bx-show'></i>
                    </button>
                </td>
            </tr>`;
        }).join('');

    } catch (err) {
        console.error('[Orders] Table error:', err);
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--danger);">Error loading data. Make sure the proxy is running.</td></tr>';
    }
}

function viewPharmacyOrders(id) {
    console.log('Viewing orders for pharmacy:', id);
}
