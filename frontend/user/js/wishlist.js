if (!localStorage.getItem('token')) window.location.href = '/login.html';

document.getElementById('btn-logout').addEventListener('click', () => {
  localStorage.clear();
  window.location.href = '/login.html';
});

const alertBox = document.getElementById('alert-box');

function showAlert(msg, type = 'error') {
  alertBox.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
  setTimeout(() => alertBox.innerHTML = '', 3500);
}

// Neue Wunschliste
document.getElementById('btn-new-list').addEventListener('click', () => {
  document.getElementById('form-new-wrap').style.display = 'block';
});

document.getElementById('btn-cancel-new').addEventListener('click', () => {
  document.getElementById('form-new-wrap').style.display = 'none';
});

document.getElementById('form-new-list').addEventListener('submit', async e => {
  e.preventDefault();
  const name        = document.getElementById('new-list-name').value;
  const description = document.getElementById('new-list-desc').value;
  try {
    await API.post('/wishlists', { name, description });
    document.getElementById('form-new-wrap').style.display = 'none';
    e.target.reset();
    loadWishlists();
  } catch (err) {
    showAlert(err.error || 'Fehler beim Erstellen');
  }
});

// Wunschliste per ID löschen (Modal)
document.getElementById('btn-delete-by-id').addEventListener('click', () => {
  document.getElementById('delete-list-id').value = '';
  document.getElementById('delete-alert').innerHTML = '';
  document.getElementById('modal-delete').style.display = 'flex';
});

document.getElementById('btn-close-delete-modal').addEventListener('click', () => {
  document.getElementById('modal-delete').style.display = 'none';
});

document.getElementById('btn-confirm-delete-id').addEventListener('click', async () => {
  const id        = document.getElementById('delete-list-id').value;
  const alertEl   = document.getElementById('delete-alert');
  if (!id) {
    alertEl.innerHTML = '<div class="alert alert-error">Bitte eine ID eingeben</div>';
    return;
  }
  try {
    await API.delete(`/wishlists/${id}`);
    document.getElementById('modal-delete').style.display = 'none';
    showAlert(`Wunschliste #${id} gelöscht`, 'success');
    loadWishlists();
  } catch (err) {
    alertEl.innerHTML = `<div class="alert alert-error">${err.error || 'Fehler - prüfe ob die ID existiert und du Besitzer bist'}</div>`;
  }
});

// Wunschlisten laden
async function loadWishlists() {
  const container = document.getElementById('wishlists-container');

  try {
    const lists = await API.get('/wishlists');

    if (lists.length === 0) {
      container.innerHTML = '<p style="color:#94a3b8;">Noch keine Wunschlisten vorhanden.</p>';
      return;
    }

    container.innerHTML = lists.map(renderWishlist).join('');
  } catch (err) {
    container.innerHTML = `<div class="alert alert-error">${err.error || 'Fehler'}</div>`;
  }
}

function renderWishlist(wl) {
  const isOwner = wl.my_permission === 'owner';
  const canWrite = isOwner || wl.my_permission === 'write';

  return `
    <div class="card wishlist-card">
      <div class="wishlist-header">
        <div>
          <span class="wishlist-id">ID ${wl.id}</span>
          <strong class="wishlist-title">${wl.name}</strong>
          <span class="badge ${isOwner ? 'badge-blue' : 'badge-gray'} wishlist-badge">
            ${isOwner ? 'Besitzer' : wl.my_permission}
          </span>
        </div>
        <div class="wishlist-actions">
          ${renderWishlistActions(wl.id, isOwner, canWrite)}
        </div>
      </div>
      <p class="wishlist-owner">
        Erstellt von <strong class="wishlist-owner-name">${wl.owner_name}</strong>
      </p>
      ${wl.description ? `<p class="wishlist-description">${wl.description}</p>` : ''}
      <div class="wishlist-products">
        ${renderWishlistProducts(wl, canWrite)}
      </div>
      ${renderAddProductSection(wl.id)}
    </div>
  `;
}

function renderWishlistActions(wishlistId, isOwner, canWrite) {
  return `
    ${canWrite ? `<button class="btn btn-secondary btn-sm" onclick="showAddProduct(${wishlistId})">+ Produkt</button>` : ''}
    ${isOwner ? `<button class="btn btn-primary btn-sm" onclick="openPermModal(${wishlistId})">Berechtigung</button>` : ''}
    ${isOwner ? `<button class="btn btn-danger btn-sm" onclick="deleteWishlist(${wishlistId})">Löschen</button>` : ''}
  `;
}

function renderWishlistProducts(wl, canWrite) {
  if (wl.products.length === 0) {
    return '<span class="wishlist-products-empty">Keine Produkte</span>';
  }

  return wl.products.map(p => `
    <span class="wishlist-product-chip">
      ${p.name} - ${parseFloat(p.price).toFixed(2)} €
      ${canWrite ? `<button class="wishlist-product-remove" onclick="removeProduct(${wl.id}, ${p.id})">✕</button>` : ''}
    </span>
  `).join('');
}

function renderAddProductSection(wishlistId) {
  return `
    <!-- Produkt hinzufügen mit Live-Autocomplete -->
    <div id="add-product-${wishlistId}" class="wishlist-add-product">
      <div class="wishlist-add-product-search">
        <input type="text" id="product-search-${wishlistId}"
               class="wishlist-add-product-input"
               placeholder="Produkt suchen (Name oder ID)..."
               autocomplete="off"
               oninput="productLiveSearch(${wishlistId}, this.value)"
               onkeydown="productSearchKeydown(event, ${wishlistId})"
               onfocus="productLiveSearch(${wishlistId}, this.value)">
        <div id="product-autocomplete-${wishlistId}" class="wishlist-add-product-autocomplete"></div>
      </div>
      <!-- Ausgewähltes Produkt (initial versteckt, per JS eingeblendet) -->
      <div id="product-selected-${wishlistId}" class="wishlist-selected-product">
        <div class="wishlist-selected-product-content">
          <span id="product-selected-label-${wishlistId}"></span>
          <button type="button" class="wishlist-selected-clear"
            onclick="clearProductSelection(${wishlistId})">✕</button>
        </div>
      </div>
      <input type="hidden" id="product-id-${wishlistId}">
      <div class="wishlist-add-product-actions">
        <button class="btn btn-success btn-sm" onclick="addProduct(${wishlistId})">Hinzufügen</button>
        <button class="btn btn-secondary btn-sm" onclick="hideAddProduct(${wishlistId})">Abbrechen</button>
      </div>
    </div>
  `;
}

function showAddProduct(id) {
  const wrap = document.getElementById(`add-product-${id}`);
  wrap.style.display = 'block';
  // Suchfeld fokussieren
  setTimeout(() => {
    const input = document.getElementById(`product-search-${id}`);
    if (input) input.focus();
  }, 50);
}

function hideAddProduct(id) {
  document.getElementById(`add-product-${id}`).style.display = 'none';
  clearProductSelection(id);
}

function clearProductSelection(wishlistId) {
  document.getElementById(`product-id-${wishlistId}`).value          = '';
  document.getElementById(`product-search-${wishlistId}`).value      = '';
  document.getElementById(`product-selected-${wishlistId}`).style.display = 'none';
  document.getElementById(`product-autocomplete-${wishlistId}`).style.display = 'none';
}

function selectProduct(wishlistId, productId, name, price) {
  document.getElementById(`product-id-${wishlistId}`).value              = productId;
  document.getElementById(`product-selected-label-${wishlistId}`).textContent = `${name} - ${parseFloat(price).toFixed(2)} €`;
  document.getElementById(`product-selected-${wishlistId}`).style.display  = 'flex';
  document.getElementById(`product-search-${wishlistId}`).value           = '';
  document.getElementById(`product-autocomplete-${wishlistId}`).style.display = 'none';
  document.getElementById(`product-autocomplete-${wishlistId}`).innerHTML  = '';
}

// Debounce-Timer je Wunschliste
const _productDebounce = {};

async function productLiveSearch(wishlistId, value) {
  clearTimeout(_productDebounce[wishlistId]);
  const ac = document.getElementById(`product-autocomplete-${wishlistId}`);
  if (!ac) return;
  const q = value.trim();

  if (q.length < 1) { ac.style.display = 'none'; ac.innerHTML = ''; return; }

  _productDebounce[wishlistId] = setTimeout(async () => {
    try {
      // Suche nach Name oder exakter ID
      const isId = /^\d+$/.test(q);
      const path = isId
        ? `/inventory/products?id=${encodeURIComponent(q)}`
        : `/inventory/products?name=${encodeURIComponent(q)}`;
      const products = await API.get(path);
      const top3 = products.slice(0, 3);

      if (top3.length === 0) {
        ac.innerHTML = `<div style="padding:0.6rem 0.85rem;font-size:0.82rem;color:#94a3b8;">Keine Produkte gefunden</div>`;
        ac.style.display = 'block';
        return;
      }

      ac.innerHTML = top3.map(p => `
        <div data-id="${p.id}"
             data-name="${p.name.replace(/"/g, '&quot;')}"
             data-price="${p.price}"
             style="padding:0.5rem 0.85rem;font-size:0.82rem;cursor:pointer;border-bottom:1px solid #f1f5f9;transition:background 0.15s;"
             onmouseenter="this.style.background='#f0fdf4'"
             onmouseleave="this.style.background=''"
             onmousedown="selectProduct(${wishlistId}, ${p.id}, '${p.name.replace(/\\/g,'\\\\').replace(/'/g,"\\'")}', ${p.price})">
          <strong>${p.name}</strong>
          <span style="color:#2563eb;margin-left:0.4rem;font-weight:600;">${parseFloat(p.price).toFixed(2)} €</span>
          <span style="color:${p.quantity < 1 ? '#ef4444' : '#64748b'};margin-left:0.4rem;font-size:0.75rem;">
            ${p.quantity > 0 ? `Lager: ${p.quantity}` : 'nicht verfügbar'}
          </span>
        </div>
      `).join('');
      ac.style.display = 'block';

    } catch { ac.style.display = 'none'; }
  }, 220);
}

function productSearchKeydown(e, wishlistId) {
  const ac = document.getElementById(`product-autocomplete-${wishlistId}`);
  if (!ac) return;
  if (e.key === 'Escape') { ac.style.display = 'none'; ac.innerHTML = ''; }
  if (e.key === 'Enter') {
    e.preventDefault();
    const first = ac.querySelector('[data-id]');
    if (first) selectProduct(wishlistId, +first.dataset.id, first.dataset.name, first.dataset.price);
  }
}

// Dropdown schließen bei Klick außerhalb eines Produktsuchfelds
document.addEventListener('click', e => {
  // alle offenen Produkt-Dropdowns schließen, deren Wrapper nicht das Ziel enthält
  document.querySelectorAll('[id^="product-autocomplete-"]').forEach(ac => {
    const wishlistId = ac.id.replace('product-autocomplete-', '');
    const input = document.getElementById(`product-search-${wishlistId}`);
    if (input && !input.contains(e.target) && !ac.contains(e.target)) {
      ac.style.display = 'none';
    }
  });
});

async function addProduct(wishlistId) {
  const productId = document.getElementById(`product-id-${wishlistId}`).value;
  if (!productId) { showAlert('Bitte zuerst ein Produkt auswählen'); return; }
  try {
    await API.post(`/wishlists/${wishlistId}/products`, { product_id: parseInt(productId) });
    loadWishlists();
  } catch (err) {
    showAlert(err.error || 'Fehler');
  }
}

async function removeProduct(wishlistId, productId) {
  try {
    await API.delete(`/wishlists/${wishlistId}/products/${productId}`);
    loadWishlists();
  } catch (err) {
    showAlert(err.error || 'Fehler');
  }
}

async function deleteWishlist(id) {
  if (!confirm(`Wunschliste #${id} wirklich löschen?`)) return;
  try {
    await API.delete(`/wishlists/${id}`);
    showAlert(`Wunschliste #${id} gelöscht`, 'success');
    loadWishlists();
  } catch (err) {
    showAlert(err.error || 'Fehler');
  }
}

// Berechtigungsmodal mit Live-Autocomplete
const permSearchInput  = document.getElementById('perm-search-input');
const permAutocomplete = document.getElementById('perm-autocomplete');
const permSelectedDiv  = document.getElementById('perm-selected-user');
const permSelectedLabel= document.getElementById('perm-selected-label');
const permUserIdHidden = document.getElementById('perm-user-id-hidden');

function openPermModal(wishlistId) {
  document.getElementById('perm-wishlist-id').value = wishlistId;
  permSearchInput.value        = '';
  permUserIdHidden.value       = '';
  permSelectedDiv.style.display = 'none';
  permAutocomplete.style.display = 'none';
  permAutocomplete.innerHTML   = '';
  document.getElementById('modal-alert').innerHTML = '';
  document.getElementById('modal-perm').style.display = 'flex';
  setTimeout(() => permSearchInput.focus(), 50);
}

document.getElementById('btn-close-modal').addEventListener('click', () => {
  document.getElementById('modal-perm').style.display = 'none';
});

// User aus Autocomplete auswählen
function selectUser(id, name, email) {
  permUserIdHidden.value        = id;
  permSelectedLabel.textContent = `${name} (${email})`;
  permSelectedDiv.style.display = 'flex';
  permSearchInput.value         = '';
  permAutocomplete.style.display = 'none';
  permAutocomplete.innerHTML    = '';
}

// Auswahl aufheben
document.getElementById('btn-clear-user').addEventListener('click', () => {
  permUserIdHidden.value        = '';
  permSelectedDiv.style.display = 'none';
  permSearchInput.value         = '';
  permSearchInput.focus();
});

// Autocomplete schließen bei Klick außerhalb
document.addEventListener('click', e => {
  if (!permSearchInput.contains(e.target) && !permAutocomplete.contains(e.target)) {
    permAutocomplete.style.display = 'none';
  }
});

// Live-Query: debounced auf jedes Tastaturereignis
let _debounceTimer = null;
permSearchInput.addEventListener('input', () => {
  clearTimeout(_debounceTimer);
  const q = permSearchInput.value.trim();

  if (q.length < 2) {
    permAutocomplete.style.display = 'none';
    permAutocomplete.innerHTML = '';
    return;
  }

  _debounceTimer = setTimeout(async () => {
    try {
      const users = await API.get(`/users/search?q=${encodeURIComponent(q)}`);

      if (users.length === 0) {
        permAutocomplete.innerHTML = `
          <div style="padding:0.6rem 0.85rem;font-size:0.85rem;color:#94a3b8;">
            Keine Benutzer gefunden
          </div>`;
        permAutocomplete.style.display = 'block';
        return;
      }

      permAutocomplete.innerHTML = users.map(u => `
        <div
          data-id="${u.id}" data-name="${u.name}" data-email="${u.email}"
          style="padding:0.55rem 0.85rem;font-size:0.85rem;cursor:pointer;border-bottom:1px solid #f1f5f9;transition:background 0.1s;"
          onmouseenter="this.style.background='#eff6ff'"
          onmouseleave="this.style.background=''"
        >
          <strong>${u.name}</strong>
          <span style="color:#64748b;margin-left:0.4rem;">${u.email}</span>
        </div>
      `).join('');
      permAutocomplete.style.display = 'block';

    } catch {
      permAutocomplete.style.display = 'none';
    }
  }, 250); // 250ms Debounce
});

// Klick auf Autocomplete-Eintrag
permAutocomplete.addEventListener('click', e => {
  const item = e.target.closest('[data-id]');
  if (!item) return;
  selectUser(item.dataset.id, item.dataset.name, item.dataset.email);
});

// Tastaturnavigation: Escape schließt, Enter wählt ersten Eintrag
permSearchInput.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    permAutocomplete.style.display = 'none';
  }
  if (e.key === 'Enter') {
    const first = permAutocomplete.querySelector('[data-id]');
    if (first) selectUser(first.dataset.id, first.dataset.name, first.dataset.email);
  }
});

// Berechtigung speichern
document.getElementById('btn-save-perm').addEventListener('click', async () => {
  const wishlistId = document.getElementById('perm-wishlist-id').value;
  const userId     = permUserIdHidden.value;
  const permission = document.getElementById('perm-type').value;
  const alertEl    = document.getElementById('modal-alert');

  if (!userId) {
    alertEl.innerHTML = '<div class="alert alert-error">Bitte einen Benutzer auswählen</div>';
    return;
  }

  try {
    await API.post(`/wishlists/${wishlistId}/permissions`, { user_id: parseInt(userId), permission });
    document.getElementById('modal-perm').style.display = 'none';
    showAlert('Berechtigung erfolgreich gesetzt', 'success');
  } catch (err) {
    alertEl.innerHTML = `<div class="alert alert-error">${err.error || 'Fehler'}</div>`;
  }
});

loadWishlists();
