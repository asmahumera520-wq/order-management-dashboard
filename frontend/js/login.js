// ── login.js ─────────────────────────────────────────────────────────────────
// Handles admin login form submission and token storage.

// If already logged in, redirect to dashboard
if (localStorage.getItem('token')) {
  window.location.href = '/dashboard';
}

const loginForm  = document.getElementById('loginForm');
const loginBtn   = document.getElementById('loginBtn');
const loginError = document.getElementById('loginError');

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  if (!username || !password) {
    showError('Please enter both username and password.');
    return;
  }

  loginBtn.disabled    = true;
  loginBtn.textContent = 'Signing in...';
  loginError.classList.remove('show');

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (data.success) {
      // Save token and username
      localStorage.setItem('token', data.token);
      localStorage.setItem('adminUser', data.username);

      loginBtn.textContent = '✅ Success! Redirecting...';
      window.location.href = '/dashboard';
    } else {
      showError(data.message || 'Invalid credentials');
      loginBtn.disabled    = false;
      loginBtn.textContent = 'Sign In to Dashboard';
    }
  } catch (error) {
    showError('Cannot connect to server. Is the backend running?');
    loginBtn.disabled    = false;
    loginBtn.textContent = 'Sign In to Dashboard';
  }
});

function showError(msg) {
  loginError.textContent = '⚠ ' + msg;
  loginError.classList.add('show');
}
