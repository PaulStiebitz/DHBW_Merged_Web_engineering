// Prüfen, ob der User eingeloggt ist, ansonsten zum Login schicken
if (!localStorage.getItem('token')) window.location.href = '/login.html';
// Admins dürfen den Shop nicht sehen, direkt ins Admin-Panel umleiten
if (localStorage.getItem('role') === 'admin') window.location.href = '/admin/';

// Logout-Button Funktionalität
document.getElementById('btn-logout').addEventListener('click', () => {
  localStorage.clear();
  window.location.href = '/login.html';
});

// Namen des eingeloggten Users oben in der Navi anzeigen
const navUser = document.getElementById('nav-user');
if (navUser) navUser.textContent = localStorage.getItem('name') || '';

// Produktliste laden
async function loadProducts(name = '', category = '', id = '') {
  let path = '/inventory/products';
  const params = [];
  
  // URL-Parameter zusammenbauen (je nachdem, was gesucht wird)
  if (id)       params.push(`id=${encodeURIComponent(id)}`);
  else {
    if (name)     params.push(`name=${encodeURIComponent(name)}`);
    if (category) params.push(`category=${encodeURIComponent(category)}`);
  }
  
  // Parameter an den Pfad anhängen
  if (params.length) path += '?' + params.join('&');

  const grid = document.getElementById('products-grid');
  // Abbrechen, falls wir z.B. auf der product.html sind und es das Grid hier nicht gibt
  if (!grid) return;

  try {
    // Daten vom Backend holen
    const products = await API.get(path);
    
    // Falls nichts gefunden wurde
    if (products.length === 0) {
      grid.innerHTML = '<p style="color:#94a3b8;">Keine Produkte gefunden.</p>';
      return;
    }
    
    // Für jedes Produkt eine HTML-Karte generieren und ins Grid einfügen
    grid.innerHTML = products.map(p => `
      <div class="card">
        <span style="font-size:0.72rem;color:#94a3b8;font-family:monospace;">ID ${p.id}</span>
        <span class="card-category">${p.category || 'Allgemein'}</span>
        <span class="card-title">${p.name}</span>
        <p style="font-size:0.82rem;color:#64748b;flex:1;">${p.description || ''}</p>
        <span class="card-price">${parseFloat(p.price).toFixed(2)} €</span>
        <span class="card-stock ${p.quantity < 1 ? 'out' : ''}">
          ${p.quantity > 0 ? `Lagerbestand: ${p.quantity}` : 'Nicht verfügbar'}
        </span>
        <div style="display:flex;gap:0.4rem;margin-top:0.4rem;flex-wrap:wrap;">
          <a href="/product.html?id=${p.id}" class="btn btn-secondary btn-sm">Details</a>
          <button class="btn btn-primary btn-sm" onclick="addToCart(${p.id})"
            ${p.quantity < 1 ? 'disabled' : ''}>In Warenkorb</button>
        </div>
      </div>
    `).join(''); // join(''), damit keine Kommas zwischen den divs auftauchen
  } catch (err) {
    grid.innerHTML = `<p style="color:#ef4444;">${err.error || 'Fehler beim Laden'}</p>`;
  }
}

// Suche
const searchBtn = document.getElementById('btn-search');
// Nur ausführen, wenn die Suchleiste auf der aktuellen Seite existiert
// SearchBtn ueberpruefen, da unterschiedliche UI durch /user/index.html und /user/product.html
if (searchBtn) {
  function runSearch() {
    const id       = document.getElementById('search-id').value.trim();
    const name     = document.getElementById('search-name').value.trim();
    const category = document.getElementById('search-category').value;
    loadProducts(name, category, id);
  }

  // Suche bei Klick auf den Button starten
  searchBtn.addEventListener('click', runSearch);

  // Suche auch starten, wenn man im Textfeld Enter drückt
  document.getElementById('search-name').addEventListener('keydown', e => {
    if (e.key === 'Enter') runSearch();
  });
  document.getElementById('search-id').addEventListener('keydown', e => {
    if (e.key === 'Enter') runSearch();
  });

  // Beim ersten Seitenaufruf alle Produkte laden
  loadProducts();
}

// Produktdetail
async function loadProductDetail() {
  // ID aus der URL auslesen (z.B. ?id=5)
  const id = new URLSearchParams(window.location.search).get('id');
  if (!id) return;

  try {
    const p = await API.get(`/inventory/products/${id}`);
    // Tab-Titel dynamisch anpassen
    document.title = p.name + ' - PC Parts Shop';
    
    // Detailkarte ins HTML rendern
    document.getElementById('product-detail').innerHTML = `
      <div class="card" style="max-width:520px;">
        <span class="card-category">${p.category || 'Allgemein'}</span>
        <h1 style="font-size:1.2rem;">${p.name}</h1>
        <p style="color:#475569;font-size:0.88rem;">${p.description || 'Keine Beschreibung'}</p>
        <span class="card-price">${parseFloat(p.price).toFixed(2)} €</span>
        <span class="card-stock ${p.quantity < 1 ? 'out' : ''}">
          ${p.quantity > 0 ? `Lagerbestand: ${p.quantity}` : 'Nicht verfügbar'}
        </span>
        <div style="display:flex;gap:0.5rem;margin-top:0.5rem;">
          <button class="btn btn-primary" onclick="addToCart(${p.id})"
            ${p.quantity < 1 ? 'disabled' : ''}>In Warenkorb</button>
        </div>
      </div>
    `;
  } catch (err) {
    document.getElementById('product-detail').innerHTML =
      `<div class="alert alert-error">${err.error || 'Produkt nicht gefunden'}</div>`;
  }
}

// In Warenkorb legen
async function addToCart(productId) {
  const alertBox = document.getElementById('alert-box');
  try {
    await API.post('/inventory/cart', { product_id: productId, quantity: 1 });
    // Erfolgsmeldung anzeigen
    alertBox.innerHTML = '<div class="alert alert-success">Zum Warenkorb hinzugefügt!</div>';
    // Nach 2 Sekunden wieder ausblenden
    setTimeout(() => alertBox.innerHTML = '', 2000);
  } catch (err) {
    alertBox.innerHTML = `<div class="alert alert-error">${err.error || 'Fehler'}</div>`;
  }
}

// Prüfen, ob wir auf der product.html sind, und dann die Details laden
if (window.location.pathname.includes('product.html')) loadProductDetail();
