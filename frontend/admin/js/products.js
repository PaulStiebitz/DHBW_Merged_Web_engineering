// Admin-Guard
if (!localStorage.getItem('token') || localStorage.getItem('role') !== 'admin') {
  window.location.href = '/admin/login.html';
}

document.getElementById('btn-logout').addEventListener('click', () => {
  localStorage.clear();
  window.location.href = '/admin/login.html';
});

const navName = document.getElementById('nav-name');
if (navName) navName.textContent = localStorage.getItem('name') || '';

const alertBox = document.getElementById('alert-box');
function showAlert(msg, type = 'error') {
  alertBox.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
  setTimeout(() => alertBox.innerHTML = '', 3000); // verzögerung, damit Box für Nutzer sichtbar
}

// Produktliste laden
async function loadProducts(name = '', category = '', id = '') {
  const body = document.getElementById('products-body');
  if (!body) return;

  let path = '/inventory/products';
  const params = []; // Array in dem Suchfilter gespeichert werden
  if (id) {
    params.push(`id=${encodeURIComponent(id)}`); // if/else weil nur ein Element mit best. ID
  } else {
    if (name)     params.push(`name=${encodeURIComponent(name)}`);
    if (category) params.push(`category=${encodeURIComponent(category)}`);
  }
  if (params.length) path += '?' + params.join('&'); // Wenn es Filter gibt, wird ? und suchparamenter an path angefügt

  try {
    const products = await API.get(path);
    if (products.length === 0) {
      body.innerHTML = '<tr><td colspan="6" style="color:#94a3b8;text-align:center;">Keine Produkte gefunden.</td></tr>';
      return;
    }
    body.innerHTML = products.map(p => `
      <tr>
        <td>${p.id}</td>
        <td>${p.name}</td>
        <td>${p.category || '-'}</td>
        <td>${parseFloat(p.price).toFixed(2)} €</td>
        <td>
          <span class="badge ${p.quantity > 0 ? 'badge-green' : 'badge-red'}">
            ${p.quantity}
          </span>
        </td>
        <td>
          <a href="/admin/product-form.html?id=${p.id}" class="btn btn-secondary btn-sm">Bearbeiten</a>
          <button class="btn btn-danger btn-sm" onclick="deleteProduct(${p.id})">Löschen</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    body.innerHTML = `<tr><td colspan="6" class="alert-error">${err.error || 'Fehler'}</td></tr>`;
  }
}

async function deleteProduct(id) {
  //Confirm ist eine Standart-Funktion die ein Pop-Up genereriert
  if (!confirm('Produkt wirklich löschen?')) return;
  try {
    await API.delete(`/inventory/products/${id}`);
    loadProducts();
  } catch (err) {
    showAlert(err.error || 'Fehler beim Löschen');
  }
}

// Suche
const searchBtn = document.getElementById('btn-search');
if (searchBtn) {
  function runSearch() {
    const id       = document.getElementById('search-id').value.trim();
    const name     = document.getElementById('search-name').value.trim();
    const category = document.getElementById('search-category').value;
    loadProducts(name, category, id);
  }

  //Button-click, damit Suche startet
  searchBtn.addEventListener('click', runSearch);

  //Damit auch mit Enter in id und name eine Suche gestartet werden kann
  document.getElementById('search-id').addEventListener('keydown',   e => { if (e.key === 'Enter') runSearch(); });
  document.getElementById('search-name').addEventListener('keydown', e => { if (e.key === 'Enter') runSearch(); });

  loadProducts(); // In der Methode, weil nur in Index button ist und Produkte angezeigt werden müssen
}

// Produkt erstellen / bearbeiten (product-form.html)
async function initProductForm() {
  const form = document.getElementById('form-product');
  if (!form) return;

  const id = new URLSearchParams(window.location.search).get('id');
  if (id) {
    document.getElementById('page-title').textContent = 'Produkt bearbeiten';
    document.getElementById('btn-submit').textContent = 'Speichern';
    try {
      const p = await API.get(`/inventory/products/${id}`);
      document.getElementById('p-name').value     = p.name;
      document.getElementById('p-desc').value     = p.description || '';
      document.getElementById('p-price').value    = p.price;
      document.getElementById('p-quantity').value = p.quantity;
      document.getElementById('p-category').value = p.category || '';
    } catch (err) {
      showAlert(err.error || 'Produkt nicht gefunden');
    }
  }

  form.addEventListener('submit', async e => {
    e.preventDefault(); //Default verhindern und damit das Neuladen der Seite
    const payload = {
      name:        document.getElementById('p-name').value,
      description: document.getElementById('p-desc').value,
      price:       parseFloat(document.getElementById('p-price').value),
      quantity:    parseInt(document.getElementById('p-quantity').value),
      category:    document.getElementById('p-category').value || null,
    };

    try {
      if (id) {
        await API.put(`/inventory/products/${id}`, payload);
        showAlert('Produkt gespeichert', 'success');
      } else {
        await API.post('/inventory/products', payload);
        showAlert('Produkt erstellt', 'success');
        form.reset();
      }
      setTimeout(() => window.location.href = '/admin/', 800); // Verzögerung, damit Nutzer den Allert noch lesen kann
    } catch (err) {
      showAlert(err.error || 'Fehler beim Speichern');
    }
  });
}

initProductForm();
