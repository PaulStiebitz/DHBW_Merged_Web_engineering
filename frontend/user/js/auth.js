const alertBox = document.getElementById('alert-box');

function showAlert(msg, type = 'error') {
  alertBox.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
}

// Tabs
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('panel-' + tab.dataset.tab).classList.add('active');
    alertBox.innerHTML = '';
  });
});

// Magic Token aus URL verarbeiten (nach Redirect von Magic-Link)
(function checkMagicRedirect() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('magic_token')) {
    localStorage.setItem('token', params.get('magic_token'));
    localStorage.setItem('role', params.get('role') || 'user');
    window.location.href = '/';
  }
  if (params.get('verified') === 'true') {
    showAlert('E-Mail bestätigt! Du kannst dich jetzt anmelden.', 'success');
  }
  if (params.get('error')) {
    showAlert('Fehler: ' + params.get('error'));
  }
})();

// Bereits eingeloggt?
if (localStorage.getItem('token')) {
  const role = localStorage.getItem('role');
  window.location.href = role === 'admin' ? '/admin/' : '/';
}

// Login
document.getElementById('form-login').addEventListener('submit', async e => {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) return showAlert(data.error);
    localStorage.setItem('token', data.token);
    localStorage.setItem('role', data.role);
    localStorage.setItem('name', data.name);
    window.location.href = data.role === 'admin' ? '/admin/' : '/';
  } catch {
    showAlert('Verbindungsfehler');
  }
});

// Registrierung
document.getElementById('form-register').addEventListener('submit', async e => {
  e.preventDefault();
  const name     = document.getElementById('reg-name').value;
  const email    = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) return showAlert(data.error);
    showAlert(data.message, 'success');
    e.target.reset();
  } catch {
    showAlert('Verbindungsfehler');
  }
});

// Magic Link anfordern
document.getElementById('form-magic').addEventListener('submit', async e => {
  e.preventDefault();
  const email = document.getElementById('magic-email').value;
  try {
    const res = await fetch('/api/auth/magic-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    showAlert(data.message, 'success');
  } catch {
    showAlert('Verbindungsfehler');
  }
});

// Magic Code eingeben
document.getElementById('form-magic-code').addEventListener('submit', async e => {
  e.preventDefault();
  const token = document.getElementById('magic-code').value.trim();
  try {
    const res = await fetch('/api/auth/magic-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    const data = await res.json();
    if (!res.ok) return showAlert(data.error);
    localStorage.setItem('token', data.token);
    localStorage.setItem('role', data.role);
    localStorage.setItem('name', data.name);
    window.location.href = data.role === 'admin' ? '/admin/' : '/';
  } catch {
    showAlert('Verbindungsfehler');
  }
});
