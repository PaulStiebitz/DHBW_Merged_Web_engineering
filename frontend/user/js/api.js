// Zentrales Objekt für alle API-Anfragen, damit wir fetch() nicht immer neu schreiben müssen
const API = {
  // Hilfsfunktion, die die eigentliche Anfrage macht
  _fetch(path, options = {}) {
    // Token aus dem LocalStorage holen, falls der User eingeloggt ist
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Wenn ein Token da ist, fügen wir es als Bearer Token in den Header ein
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return fetch('/api' + path, { ...options, headers }).then(async (response) => {
      // Wenn das Token ungültig oder abgelaufen ist (HTTP 401), User ausloggen
      if (response.status === 401) {
        localStorage.clear();
        window.location.href = '/login.html';
        return;
      }

      // Antwort als JSON parsen
      const data = await response.json();
      
      // Bei anderen Fehlern (z.B. 400 oder 500) einen Fehler werfen, damit der catch-Block auslöst
      if (!response.ok) {
        throw data;
      }

      return data;
    });
  },
  
  // Abkürzungen für die verschiedenen HTTP-Methoden
  get(path) {
    return API._fetch(path);
  },
  post(path, body) {
    return API._fetch(path, { method: 'POST', body: JSON.stringify(body) });
  },
  put(path, body) {
    return API._fetch(path, { method: 'PUT', body: JSON.stringify(body) });
  },
  patch(path, body) {
    return API._fetch(path, { method: 'PATCH', body: JSON.stringify(body) });
  },
  delete(path) {
    return API._fetch(path, { method: 'DELETE' });
  },
};
