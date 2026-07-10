// Admin-Guard
if (!localStorage.getItem('token') || localStorage.getItem('role') !== 'admin') {
  window.location.href = '/admin/login.html';
}

document.getElementById('btn-logout').addEventListener('click', () => {
  localStorage.clear();
  window.location.href = '/admin/login.html';
});

const alertBox = document.getElementById('alert-box');
function showAlert(msg, type = 'error') {
  alertBox.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
  setTimeout(() => alertBox.innerHTML = '', 3000);
}

// User-Tabelle rendern
function renderUsers(users) {
  const body = document.getElementById('users-body');
  if (users.length === 0) {
    body.innerHTML = '<tr><td colspan="7" style="color:#94a3b8;text-align:center;">Keine User gefunden.</td></tr>';
    return;
  }
  body.innerHTML = users.map(u => `
    <tr>
      <td>${u.id}</td>
      <td>${u.name}</td>
      <td>${u.email}</td>
      <td>
        <span class="badge ${u.role === 'admin' ? 'badge-yellow' : 'badge-blue'}">
          ${u.role}
        </span>
      </td>
      <td>
        <span class="badge ${u.is_verified ? 'badge-green' : 'badge-red'}">
          ${u.is_verified ? 'Ja' : 'Nein'}
        </span>
      </td>
      <td>
        <span class="badge ${u.is_locked ? 'badge-red' : 'badge-green'}">
          ${u.is_locked ? 'Gesperrt' : 'Aktiv'}
        </span>
      </td>
      <td>
        <button class="btn btn-${u.is_locked ? 'success' : 'warning'} btn-sm"
          onclick="toggleLock(${u.id}, ${u.is_locked})">
          ${u.is_locked ? 'Entsperren' : 'Sperren'}
        </button>
        <button class="btn btn-danger btn-sm" onclick="deleteUser(${u.id})">Löschen</button>
      </td>
    </tr>
  `).join('');
}

// Alle User laden
async function loadAllUsers() {
  try {
    const users = await API.get('/users');
    renderUsers(users);
  } catch (err) {
    showAlert(err.error || 'Fehler beim Laden');
  }
}

// User by ID suchen (USER-1)
document.getElementById('btn-search-user').addEventListener('click', async () => {
  const id = document.getElementById('search-user-id').value;
  if (!id) return loadAllUsers();
  try {
    const user = await API.get(`/users/${id}`);
    renderUsers([user]);
  } catch (err) {
    showAlert(err.error || 'User nicht gefunden');
  }
});

document.getElementById('btn-load-all').addEventListener('click', loadAllUsers);

// User sperren / entsperren (USER-4)
async function toggleLock(userId, currentlyLocked) {
  try {
    await API.patch(`/users/${userId}/status`, { is_locked: !currentlyLocked });
    showAlert(`User ${currentlyLocked ? 'entsperrt' : 'gesperrt'}`, 'success');
    loadAllUsers();
  } catch (err) {
    showAlert(err.error || 'Fehler');
  }
}

// User löschen (USER-2)
async function deleteUser(userId) {
  if (!confirm('User wirklich löschen?')) return;
  try {
    await API.delete(`/users/${userId}`);
    showAlert('User gelöscht', 'success');
    loadAllUsers();
  } catch (err) {
    showAlert(err.error || 'Fehler beim Löschen');
  }
}

// Neuen Admin erstellen (USER-3)
document.getElementById('btn-new-admin').addEventListener('click', () => {
  document.getElementById('form-admin-wrap').style.display = 'block';
});

document.getElementById('btn-cancel-admin').addEventListener('click', () => {
  document.getElementById('form-admin-wrap').style.display = 'none';
});

document.getElementById('form-new-admin').addEventListener('submit', async e => {
  e.preventDefault();
  const name     = document.getElementById('admin-name').value;
  const email    = document.getElementById('admin-email').value;
  const password = document.getElementById('admin-password').value;
  try {
    await API.post('/users/admin', { name, email, password });
    showAlert('Admin erstellt', 'success');
    document.getElementById('form-admin-wrap').style.display = 'none';
    e.target.reset();
    loadAllUsers();
  } catch (err) {
    showAlert(err.error || 'Fehler beim Erstellen');
  }
});

loadAllUsers();
