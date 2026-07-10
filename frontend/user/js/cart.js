// Guard: Nur eingeloggte User dürfen den Warenkorb sehen
if (!localStorage.getItem('token')) window.location.href = '/login.html';

// Logout
document.getElementById('btn-logout').addEventListener('click', () => {
  localStorage.clear();
  window.location.href = '/login.html';
});

// Warenkorb laden und Tabelle aufbauen
async function loadCart() {
  const body      = document.getElementById('cart-body');
  const totalDiv  = document.getElementById('cart-total');
  const btnCheckout = document.getElementById('btn-checkout');

  try {
    const items = await API.get('/inventory/cart');

    // Fallback, wenn der Warenkorb leer ist
    if (items.length === 0) {
      body.innerHTML = '<tr><td colspan="5" style="color:#94a3b8;text-align:center;">Dein Warenkorb ist leer.</td></tr>';
      totalDiv.textContent = '';
      btnCheckout.style.display = 'none'; // Kauf-Button verstecken
      return;
    }

    let total = 0;
    
    // HTML für die Tabellenzeilen generieren
    body.innerHTML = items.map(item => {
      // Zwischensumme berechnen
      const sub = parseFloat(item.price) * item.quantity;
      total += sub; // Auf Gesamtsumme addieren
      
      return `
        <tr>
          <td>${item.name}</td>
          <td>${parseFloat(item.price).toFixed(2)} €</td>
          <td>${item.quantity}</td>
          <td>${sub.toFixed(2)} €</td>
          <td>
            <button class="btn btn-danger btn-sm" onclick="removeFromCart(${item.product_id})">Entfernen</button>
          </td>
        </tr>
      `;
    }).join('');

    // Gesamtsumme anzeigen und Checkout-Button einblenden
    totalDiv.textContent = `Gesamt: ${total.toFixed(2)} €`;
    btnCheckout.style.display = 'inline-block';
  } catch (err) {
    // Fehler in der Tabelle anzeigen
    body.innerHTML = `<tr><td colspan="5" class="alert-error">${err.error || 'Fehler'}</td></tr>`;
  }
}

// Artikel aus dem Warenkorb löschen
async function removeFromCart(productId) {
  try {
    await API.delete(`/inventory/cart/${productId}`);
    // Nach dem Löschen die Tabelle einfach neu laden
    loadCart();
  } catch (err) {
    document.getElementById('alert-box').innerHTML =
      `<div class="alert alert-error">${err.error || 'Fehler'}</div>`;
  }
}

// Checkout auslösen
document.getElementById('btn-checkout').addEventListener('click', async () => {
  const alertBox = document.getElementById('alert-box');
  
  // Sicherheitsabfrage im Browser
  if (!confirm('Möchtest du alle Artikel im Warenkorb kaufen?')) return;
  
  try {
    const res = await API.post('/inventory/orders', {});
    // Erfolgsmeldung mit Bestellnummer
    alertBox.innerHTML = `<div class="alert alert-success">Bestellung #${res.orderId} erfolgreich! Gesamt: ${res.total} € - Bestätigung per E-Mail.</div>`;
    
    // Warenkorb leeren/neu laden
    loadCart();
  } catch (err) {
    alertBox.innerHTML = `<div class="alert alert-error">${err.error || 'Fehler beim Kaufen'}</div>`;
  }
});

// Direkt beim Start laden
loadCart();
