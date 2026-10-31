// ── orders.js ─────────────────────────────────────────────────────────────────
// Handles all orders page: listing, searching, filtering, and deleting orders.

// ── AUTH GUARD ────────────────────────────────────────────────────────────────
const token = localStorage.getItem('token');
if (!token) { window.location.href = '/'; }

// ── SIDEBAR INIT ──────────────────────────────────────────────────────────────
const adminUser = localStorage.getItem('adminUser') || 'Admin';
document.getElementById('adminName').textContent   = adminUser;
document.getElementById('adminAvatar').textContent = adminUser.charAt(0).toUpperCase();

document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('adminUser');
  window.location.href = '/';
});

// ── DATE ──────────────────────────────────────────────────────────────────────
const now = new Date();
document.getElementById('currentDate').textContent = now.toLocaleDateString('en-IN', {
  day: '2-digit', month: 'short', year: 'numeric',
});

// ── STATE ─────────────────────────────────────────────────────────────────────
let deleteTargetId = null;

// ── URL PARAMS (for sidebar links with ?status=) ──────────────────────────────
const urlParams = new URLSearchParams(window.location.search);
const urlStatus = urlParams.get('status');
if (urlStatus) {
  document.getElementById('statusFilter').value = urlStatus;
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
function formatCurrency(amount) {
  return '₹' + Number(amount).toLocaleString('en-IN');
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getBadge(status) {
  const cls = status.toLowerCase();
  return `<span class="badge badge-${cls}">${status}</span>`;
}

function showToast(msg, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  toast.innerHTML = `<span>${icon}</span><span class="toast-msg">${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// ── FETCH & RENDER ORDERS ─────────────────────────────────────────────────────
async function loadOrders() {
  const search = document.getElementById('searchInput').value.trim();
  const status = document.getElementById('statusFilter').value;

  let url = '/api/orders?';
  if (search) url += `search=${encodeURIComponent(search)}&`;
  if (status && status !== 'All') url += `status=${encodeURIComponent(status)}&`;

  const tbody = document.getElementById('ordersTableBody');
  tbody.innerHTML = `<tr><td colspan="9"><div class="loading-state"><div class="spinner"></div></div></td></tr>`;

  try {
    const res  = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await res.json();

    if (!data.success) {
      tbody.innerHTML = `<tr><td colspan="9"><div class="empty-state"><div class="empty-icon">⚠️</div><p>Failed to load orders.</p></div></td></tr>`;
      return;
    }

    const orders = data.data;
    document.getElementById('orderCount').textContent = `${orders.length} order${orders.length !== 1 ? 's' : ''}`;

    if (orders.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9">
            <div class="empty-state">
              <div class="empty-icon">📭</div>
              <p>No orders found. <a href="/addOrder" style="color:var(--primary-light)">Create one now!</a></p>
            </div>
          </td>
        </tr>`;
      return;
    }

    tbody.innerHTML = orders.map(order => `
      <tr>
        <td><span class="order-id">${order.orderId || order._id.slice(-6).toUpperCase()}</span></td>
        <td class="customer-name">${escapeHtml(order.customerName)}</td>
        <td class="product-cell">${escapeHtml(order.productName)}</td>
        <td>${order.quantity}</td>
        <td class="price-cell">${formatCurrency(order.price)}</td>
        <td class="total-price-cell">${formatCurrency(order.price * order.quantity)}</td>
        <td>${getBadge(order.status)}</td>
        <td>${formatDate(order.orderDate)}</td>
        <td>
          <div class="action-btns">
            <a
              href="/editOrder?id=${order._id}"
              class="btn btn-success btn-sm"
              title="Edit Order"
            >✏️ Edit</a>
            <button
              class="btn btn-danger btn-sm"
              onclick="openDeleteModal('${order._id}')"
              title="Delete Order"
            >🗑️ Delete</button>
          </div>
        </td>
      </tr>
    `).join('');

  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="9"><div class="empty-state"><div class="empty-icon">🔌</div><p>Cannot reach server. Is the backend running?</p></div></td></tr>`;
  }
}

// ── ESCAPE HTML (security) ────────────────────────────────────────────────────
function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

// ── SEARCH (debounced) ────────────────────────────────────────────────────────
let searchTimer = null;
document.getElementById('searchInput').addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(loadOrders, 400);
});

// ── STATUS FILTER ─────────────────────────────────────────────────────────────
document.getElementById('statusFilter').addEventListener('change', loadOrders);

// ── DELETE MODAL ──────────────────────────────────────────────────────────────
function openDeleteModal(id) {
  deleteTargetId = id;
  document.getElementById('deleteModal').classList.add('show');
}

document.getElementById('cancelDeleteBtn').addEventListener('click', () => {
  deleteTargetId = null;
  document.getElementById('deleteModal').classList.remove('show');
});

document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
  if (!deleteTargetId) return;

  const btn = document.getElementById('confirmDeleteBtn');
  btn.disabled    = true;
  btn.textContent = 'Deleting...';

  try {
    const res  = await fetch(`/api/orders/${deleteTargetId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await res.json();

    if (data.success) {
      showToast('Order deleted successfully', 'success');
      loadOrders();
    } else {
      showToast(data.message || 'Delete failed', 'error');
    }
  } catch (err) {
    showToast('Server error', 'error');
  } finally {
    deleteTargetId = null;
    btn.disabled    = false;
    btn.textContent = 'Delete';
    document.getElementById('deleteModal').classList.remove('show');
  }
});

// Close modal on overlay click
document.getElementById('deleteModal').addEventListener('click', (e) => {
  if (e.target === document.getElementById('deleteModal')) {
    document.getElementById('deleteModal').classList.remove('show');
  }
});

// ── INITIAL LOAD ──────────────────────────────────────────────────────────────
loadOrders();
