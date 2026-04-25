let currentPage = 1;
const PAGE_SIZE = 20;
let currentStatusFilter = 'all';
let currentSearchQuery = '';
let currentOrdersData = [];

document.addEventListener('DOMContentLoaded', () => {
    initOrdersPage();
    setupFilters();
});

async function initOrdersPage() {
    loadOrdersStats();
    loadOrdersTable(1);
}

function setupFilters() {
    const tabs = document.querySelectorAll('.filter-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            tabs.forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            currentStatusFilter = e.target.getAttribute('data-filter');
            loadOrdersTable(1);
        });
    });

    const searchInput = document.querySelector('.search-wrapper input');
    if (searchInput) {
        let debounceTimer;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                currentSearchQuery = e.target.value.trim();
                loadOrdersTable(1);
            }, 500);
        });
    }
}

async function loadOrdersStats() {
    const statTotal    = document.getElementById('stat-total');
    const statPending  = document.getElementById('stat-pending');
    const statApproved = document.getElementById('stat-approved');
    const statRejected = document.getElementById('stat-rejected');

    if (statTotal) statTotal.textContent = '...';
    
    try {
        const res = await fetchOrderAnalytics();
        const statusData = res?.data?.ordersByStatus || {};

        const pending   = (statusData['Pending'] || 0);
        const accepted  = (statusData['Accepted'] || 0);
        const completed = (statusData['Completed'] || 0);
        const rejected  = (statusData['Rejected'] || 0);
        
        const inProgress = accepted + completed;
        const total = pending + inProgress + rejected;

        if (statTotal)    statTotal.textContent    = total.toLocaleString();
        if (statPending)  statPending.textContent  = pending.toLocaleString();
        if (statApproved) statApproved.textContent = inProgress.toLocaleString();
        if (statRejected) statRejected.textContent = rejected.toLocaleString();
    } catch (err) {
        console.error('[Orders] Failed to load stats:', err);
    }
}

async function loadOrdersTable(page = 1) {
    currentPage = page;
    const tableBody = document.querySelector('.data-table tbody');
    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 24px;"><i class="bx bx-loader-alt bx-spin"></i> Loading orders...</td></tr>';

    try {
        // Capitalize status for API (e.g. 'pending' -> 'Pending')
        const apiStatus = currentStatusFilter === 'all' ? '' : currentStatusFilter.charAt(0).toUpperCase() + currentStatusFilter.slice(1);
        
        const res = await fetchOrders(page, PAGE_SIZE, currentSearchQuery, apiStatus);
        const dataRoot = res?.data || res;
        const orders = Array.isArray(dataRoot) ? dataRoot : (dataRoot.items || dataRoot.orders || []);
        
        currentOrdersData = orders;

        if (orders.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 24px; color: var(--text-muted);">No orders found.</td></tr>';
            return;
        }

        tableBody.innerHTML = orders.map((order) => {
            const status = order.orderStatus || order.status || 'Pending';
            return `
            <tr>
                <td><strong>#ORD-${String(order.id).substring(0,6).toUpperCase()}</strong></td>
                <td>${order.customerName || order.patientName || 'Unknown'}</td>
                <td>${order.branchName || order.pharmacyName || 'N/A'}</td>
                <td>${order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}</td>
                <td><span class="status-badge ${getStatusClass(status)}">${status}</span></td>
                <td>
                    <button class="action-btn edit" onclick="viewOrderDetails('${order.id}')" title="View Details">
                        <i class='bx bx-show'></i>
                    </button>
                </td>
            </tr>`;
        }).join('');

    } catch (err) {
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--danger);">Error: ${err.message}</td></tr>`;
    }
}

function getStatusClass(status) {
    const s = status.toLowerCase();
    if (s === 'pending') return 'warning';
    if (s === 'accepted' || s === 'completed' || s === 'confirmed') return 'success';
    if (s === 'rejected' || s === 'cancelled') return 'danger';
    return 'neutral';
}

function closeOrderModal() {
    const modal = document.getElementById('view-order-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

async function viewOrderDetails(id) {
    const modal = document.getElementById('view-order-modal');
    const content = document.getElementById('order-details-content');
    if (!modal || !content) return;
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    content.innerHTML = '<div style="text-align:center; padding: 40px;"><i class="bx bx-loader-alt bx-spin" style="font-size: 30px;"></i><p>Loading details...</p></div>';

    try {
        const response = await fetchOrderById(id);
        const order = response?.data || response;
        if (!order) throw new Error('Order not found');

        const items = order.items || [];
        const history = order.statusHistory || [];
        const status = order.orderStatus || order.status || 'Pending';

        content.innerHTML = `
            <div class="order-detail-header" style="margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="margin: 0;">Order #${String(order.id).substring(0,6).toUpperCase()}</h3>
                    <span class="status-badge ${getStatusClass(status)}">${status}</span>
                </div>
                <div style="display: flex; gap: 15px; margin-top: 10px; font-size: 13px; color: #666;">
                    <span><i class='bx bx-calendar'></i> ${new Date(order.createdAt).toLocaleString()}</span>
                    <span><i class='bx bx-wallet'></i> ${order.paymentStatus || 'Unpaid'}</span>
                </div>
            </div>

            <div class="order-info-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px;">
                <div class="info-block" style="background: #f8fafc; padding: 12px; border-radius: 10px;">
                    <label style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600;">Customer</label>
                    <p style="margin: 5px 0 0; font-weight: 500;">${order.customerName || 'N/A'}</p>
                </div>
                <div class="info-block" style="background: #f8fafc; padding: 12px; border-radius: 10px;">
                    <label style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600;">Branch</label>
                    <p style="margin: 5px 0 0; font-weight: 500;">${order.branchName || order.pharmacyName || 'N/A'}</p>
                </div>
                <div class="info-block" style="background: #f8fafc; padding: 12px; border-radius: 10px;">
                    <label style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600;">Final Price</label>
                    <p style="margin: 5px 0 0; font-weight: 600; color: #10b981;">${order.finalPrice || 0} EGP</p>
                </div>
            </div>

            <div class="order-items-section" style="margin-bottom: 25px;">
                <h4 style="margin: 0 0 12px; font-size: 15px; border-left: 4px solid var(--primary); padding-left: 10px;">Ordered Items</h4>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    ${items.map(item => `
                        <div style="display: flex; align-items: center; gap: 12px; background: #fff; border: 1px solid #f1f5f9; padding: 10px; border-radius: 8px;">
                            <img src="${item.imageUrl || 'https://via.placeholder.com/40?text=Med'}" style="width: 40px; height: 40px; border-radius: 6px; object-fit: cover;">
                            <div style="flex: 1;">
                                <div style="display: flex; justify-content: space-between;">
                                    <span style="font-weight: 500;">${item.name || 'Medicine'}</span>
                                    <span style="font-weight: 600; color: var(--primary);">x${item.quantity}</span>
                                </div>
                                <div style="font-size: 12px; color: #64748b;">${item.form || ''} ${item.dosage || ''}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            ${history.length > 0 ? `
            <div class="timeline-section">
                <h4 style="margin: 0 0 15px; font-size: 15px;">Order Timeline</h4>
                <div class="timeline" style="border-left: 2px solid #e2e8f0; margin-left: 10px; padding-left: 20px; display: flex; flex-direction: column; gap: 15px;">
                    ${history.map(h => `
                        <div style="position: relative;">
                            <div style="position: absolute; left: -27px; top: 5px; width: 12px; height: 12px; border-radius: 50%; background: #94a3b8; border: 2px solid #fff;"></div>
                            <div style="font-size: 13px; font-weight: 600; color: #1e293b;">${h.status}</div>
                            <div style="font-size: 12px; color: #64748b;">${h.comments || 'Status changed'}</div>
                            <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">${new Date(h.changedAt).toLocaleString()}</div>
                        </div>
                    `).reverse().join('')}
                </div>
            </div>` : ''}
        `;
    } catch (err) {
        content.innerHTML = `<div style="text-align:center; padding: 30px; color: var(--danger);"><i class='bx bx-error-circle' style="font-size: 40px;"></i><p>Error: ${err.message}</p></div>`;
    }
}
