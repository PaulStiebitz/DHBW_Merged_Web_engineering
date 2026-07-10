// Falls bereits als Admin eingeloggt: direkt weiterleiten
if (localStorage.getItem('token') && localStorage.getItem('role') === 'admin') {
  window.location.href = '/admin/';
}

document.getElementById('form-login').addEventListener('submit', async e => {
  e.preventDefault();
  const email    = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const alertBox = document.getElementById('alert-box');

  try {
    const res  = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      alertBox.innerHTML = `<div class="alert alert-error">${data.error}</div>`;
      return;
    }
    if (data.role !== 'admin') {
      alertBox.innerHTML = '<div class="alert alert-error">Kein Admin-Zugriff</div>';
      return;
    }

    localStorage.setItem('token', data.token);
    localStorage.setItem('role',  data.role);
    localStorage.setItem('name',  data.name);
    window.location.href = '/admin/';
  } catch {
    alertBox.innerHTML = '<div class="alert alert-error">Verbindungsfehler</div>';
  }
});
