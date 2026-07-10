const express = require('express');
const path    = require('path');
const seed    = require('./db/seed');
const app     = express();

app.use(express.json());

// API-Router (vor static, damit /api/... nicht durch static blockiert wird)
// Auth (Authentication) = Wer bist du?
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/wishlists', require('./routes/wishlist'));
// Authorize = Was darfst du?
app.use('/api/authorize', require('./routes/authorization'));
app.use('/api/users',     require('./routes/users'));

// Statische Frontend-Dateien
// Im Container: server.js liegt in /app, frontend wird nach /app/frontend gemountet
const FRONTEND = path.join(__dirname, 'frontend');

app.use('/admin', express.static(path.join(FRONTEND, 'admin')));
app.use('/',      express.static(path.join(FRONTEND, 'user')));

// Fallback: Admin-Routen admin/index.html
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(FRONTEND, 'admin', 'index.html'));
});

// Fallback: Alle anderen Routen user/index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(FRONTEND, 'user', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Server läuft auf Port ${PORT}`);

  // Fuehrt seed aus, sofern Produkte leer sind
  try {
    await seed();
  } catch (err) {
    console.error('Seed fehlgeschlagen:', err);
  }
});
