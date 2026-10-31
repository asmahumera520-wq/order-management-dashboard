// ── dashboard.js ──────────────────────────────────────────────────────────────
// Loads dashboard stats and recent orders from the backend API.

// ── AUTH GUARD ────────────────────────────────────────────────────────────────
const token = localStorage.getItem('token');
if (!token) { window.location.href = '/'; }

// ── INIT SIDEBAR ──────────────────────────────────────────────────────────────
const adminUser = localStorage.getItem('adminUser') || 'Admin';
document.getElementById('adminName').textContent   = adminUser;
document.getElementById('adminAvatar').textContent = adminUser.charAt(0).toUpperCase();

document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('adminUser');
  window.location.href = '/';
});

// ── DATE DISPLAY ──────────────────────────────────────────────────────────────
const now = new Date();
document.getElementById('currentDate').textContent = now.toLocaleDateString('en-IN', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

// ── TOAST ─────────────────────────────────────────────────────────────────────
function showToast(msg, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  toast.innerHTML = `<span>${icon}</span><span class="toast-msg">${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// ── FORMAT CURRENCY ───────────────────────────────────────────────────────────
function formatCurrency(amount) {
  if (amount >= 100000) {
    return '₹' + (amount / 100000).toFixed(1) + 'L';
  } else if (amount >= 1000) {
    return '₹' + (amount / 1000).toFixed(1) + 'K';
  }
  return '₹' + amount.toLocaleString('en-IN');
}

// ── FORMAT DATE ───────────────────────────────────────────────────────────────
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── STATUS BADGE ──────────────────────────────────────────────────────────────
function getBadge(status) {
  const cls = status.toLowerCase();
  return `<span class="badge badge-${cls}">${status}</span>`;
}

// ── LOAD DASHBOARD STATS ──────────────────────────────────────────────────────
async function loadStats() {
  try {
    const res  = await fetch('/api/orders/stats', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await res.json();

    if (!data.success) {
      showToast('Failed to load stats', 'error');
      return;
    }

    const s = data.data;

    // Animate number counting
    animateCount('statTotal',      s.total);
    animateCount('statPending',    s.pending);
    animateCount('statProcessing', s.processing);
    animateCount('statDelivered',  s.delivered);
    animateCount('statCancelled',  s.cancelled);

    // Revenue display
    document.getElementById('statRevenue').textContent = formatCurrency(s.totalRevenue);

    // Recent Orders Table
    renderRecentOrders(s.recentOrders);

  } catch (err) {
    showToast('Cannot reach server. Make sure backend is running.', 'error');
  }
}

// ── ANIMATE COUNTER ───────────────────────────────────────────────────────────
function animateCount(elemId, target) {
  const el   = document.getElementById(elemId);
  let current = 0;
  const step  = Math.max(1, Math.floor(target / 20));
  const timer = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = current;
    if (current >= target) clearInterval(timer);
  }, 40);
}

// ── RENDER RECENT ORDERS ──────────────────────────────────────────────────────
function renderRecentOrders(orders) {
  const tbody = document.getElementById('recentOrdersBody');

  if (!orders || orders.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="empty-state">
            <div class="empty-icon">📭</div>
            <p>No orders found. <a href="/addOrder" style="color:var(--primary-light)">Add the first one!</a></p>
          </div>
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = orders.map(order => `
    <tr>
      <td><span class="order-id">${order.orderId}</span></td>
      <td class="customer-name">${order.customerName}</td>
      <td class="product-cell">${order.productName}</td>
      <td>${order.quantity}</td>
      <td class="total-price-cell">${formatCurrency(order.price * order.quantity)}</td>
      <td>${getBadge(order.status)}</td>
      <td>${formatDate(order.orderDate)}</td>
    </tr>
  `).join('');
}

// ── SEED + LOAD ───────────────────────────────────────────────────────────────
async function init() {
  // Seed sample data if DB is empty
  try {
    await fetch('/api/orders/seed', { method: 'POST' });
  } catch (e) { /* ignore */ }

  loadStats();
}

init();
// Monthly Orders Chart
new Chart(document.getElementById("ordersChart"), {
    type: "bar",
    data: {
        labels: ["Jan","Feb","Mar","Apr","May","Jun"],
        datasets: [{
            label: "Orders",
            data: [12,19,9,15,21,17],
            borderWidth: 1
        }]
    },
    options: {
        responsive: true
    }
});

// Order Status Pie Chart
new Chart(document.getElementById("statusChart"), {
    type: "pie",
    data: {
        labels: ["Pending","Processing","Delivered","Cancelled"],
        datasets: [{
            data: [5,4,12,2]
        }]
    },
    options: {
        responsive: true
    }
});
