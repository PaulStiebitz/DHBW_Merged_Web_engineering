// Falls bereits als Admin eingeloggt: direkt weiterleiten
if (localStorage.getItem('token') && localStorage.getItem('role') === 'admin') {
  window.location.href = '/admin/';
}

const alertBox = document.getElementById('alert-box');

function showAlert(msg, type = 'error') {
  alertBox.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
}

// Magic-Token aus URL verarbeiten (nach Redirect von Magic-Link)
(function checkMagicRedirect() {
  const params = new URLSearchParams(window.location.search);
  const magic_token = params.get('magic_token');
  const role = params.get('role');
  if (magic_token) {
    if (role !== 'admin') {
      showAlert('Kein Admin-Zugriff');
      return;
    }
    localStorage.setItem('token', magic_token);
    localStorage.setItem('role', role);
    window.location.href = '/admin/';
  }
  if (params.get('error')) {
    showAlert('Fehler: ' + params.get('error'));
  }
})();

// Tab-Wechsel
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('panel-' + tab.dataset.tab).classList.add('active');
    alertBox.innerHTML = '';
  });
});

// Passwort-Login
document.getElementById('form-login').addEventListener('submit', async e => {
  e.preventDefault();
  const email    = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const res  = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      showAlert(data.error);
      return;
    }
    if (data.role !== 'admin') {
      showAlert('Kein Admin-Zugriff');
      return;
    }

    localStorage.setItem('token', data.token);
    localStorage.setItem('role',  data.role);
    localStorage.setItem('name',  data.name);
    window.location.href = '/admin/';
  } catch {
    showAlert('Verbindungsfehler');
  }
});

// Magic-Link anfordern
document.getElementById('form-magic').addEventListener('submit', async e => {
  e.preventDefault();
  const email = document.getElementById('magic-email').value;
  try {
    const res  = await fetch('/api/auth/magic-link', {
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

// Magic-Code einlösen
document.getElementById('form-magic-code').addEventListener('submit', async e => {
  e.preventDefault();
  const token = document.getElementById('magic-code').value.trim();
  try {
    const res  = await fetch('/api/auth/magic-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    const data = await res.json();

    if (!res.ok) return showAlert(data.error);
    if (data.role !== 'admin') return showAlert('Kein Admin-Zugriff');

    localStorage.setItem('token', data.token);
    localStorage.setItem('role',  data.role);
    localStorage.setItem('name',  data.name);
    window.location.href = '/admin/';
  } catch {
    showAlert('Verbindungsfehler');
  }
});
