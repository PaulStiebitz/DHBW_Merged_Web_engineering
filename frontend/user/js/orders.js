// Guard
if (!localStorage.getItem('token')) window.location.href = '/login.html';

// Logout
document.getElementById('btn-logout').addEventListener('click', () => {
  localStorage.clear();
  window.location.href = '/login.html';
});

// Bestellhistorie laden
async function loadOrders() {
  const container = document.getElementById('orders-list');
  try {
    const orders = await API.get('/inventory/orders');

    // Meldung, falls noch nie etwas bestellt wurde
    if (orders.length === 0) {
      container.innerHTML = '<p style="color:#94a3b8;">Noch keine Bestellungen vorhanden.</p>';
      return;
    }

    // Über alle Bestellungen iterieren und HTML-Karten bauen
    container.innerHTML = orders.map(order => `
      <div class="card" style="max-width:700px;margin-bottom:1rem;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <strong>Bestellung #${order.id}</strong>
          <span style="font-size:0.82rem;color:#64748b;">${new Date(order.created_at).toLocaleString('de-DE')}</span>
        </div>
        
        <table style="margin-top:0.5rem;border:none;">
          <thead>
            <tr>
              <th style="background:none;padding:0.3rem 0.6rem;">Produkt</th>
              <th style="background:none;padding:0.3rem 0.6rem;">Menge</th>
              <th style="background:none;padding:0.3rem 0.6rem;">Preis</th>
            </tr>
          </thead>
          <tbody>
            ${(order.items || []).map(item => `
              <tr>
                <td style="padding:0.3rem 0.6rem;">${item.name}</td>
                <td style="padding:0.3rem 0.6rem;">${item.quantity}</td>
                <td style="padding:0.3rem 0.6rem;">${parseFloat(item.price).toFixed(2)} €</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div style="text-align:right;font-weight:700;margin-top:0.4rem;">
          Gesamt: ${parseFloat(order.total).toFixed(2)} €
        </div>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<div class="alert alert-error">${err.error || 'Fehler beim Laden'}</div>`;
  }
}

// Beim Start direkt ausführen
loadOrders();
