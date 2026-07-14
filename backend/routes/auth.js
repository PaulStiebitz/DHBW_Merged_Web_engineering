const express      = require('express');
const bcrypt       = require('bcrypt');
const db           = require('../config/db');
const tokenService = require('../services/tokenService');
const emailService = require('../services/emailService');
const auth         = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');


// Anlegen von URLs/Endpoints mid Router
const router = express.Router();

// AUTH-1: Registrierung per Mail
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'Name, E-Mail und Passwort erforderlich' });

  try {
    const hashed = await bcrypt.hash(password, 10);
    const { rows: [user] } = await db.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, email',
      [name, email, hashed]
    );

    // Verifizierungstoken erstellen und speichern
    const token = tokenService.generateToken();
    const expires = tokenService.tokenExpiresAt(60 * 24); // 24 Stunden
    await db.query(
      'INSERT INTO auth_tokens (user_id, token, type, expires_at) VALUES ($1, $2, $3, $4)',
      [user.id, token, 'verify', expires]
    );

    await emailService.sendVerificationEmail(user.email, token);

    res.status(201).json({ message: 'Registrierung erfolgreich. Bitte E-Mail bestätigen.' });
  } catch (err) {
    // Unique Violation
    if (err.code === '23505') return res.status(409).json({ error: 'E-Mail bereits registriert' });
    console.error(err);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// AUTH-2: Konto-Verifizierung per Link
router.get('/verify', async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: 'Token fehlt' });

  try {
    /*  
      {
        rows: [
          {
            id: 1,
            user_id: 42,
            token: "abc123...",
            type: "verify",
            expires_at: "2026-06-23T10:00:00.000Z",
            used: false
          }
        ]
      }
    */
    const { rows: [row] } = await db.query(
      'SELECT * FROM auth_tokens WHERE token = $1 AND type = $2 AND used = FALSE',
      [token, 'verify']
    );

    if (!row) return res.status(400).json({ error: 'Ungültiger oder abgelaufener Token' });
    if (new Date(row.expires_at) < new Date())
      return res.status(400).json({ error: 'Token abgelaufen' });

    await db.query('UPDATE users SET is_verified = TRUE WHERE id = $1', [row.user_id]);
    await db.query('UPDATE auth_tokens SET used = TRUE WHERE id = $1', [row.id]);

    // Weiterleitung zur Login-Seite
    res.redirect('/login.html?verified=true');
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// AUTH-3: Anmeldung per Passwort
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'E-Mail und Passwort erforderlich' });

  try {
    const { rows: [user] } = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    if (!user) return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
    if (!user.is_verified) return res.status(403).json({ error: 'E-Mail nicht bestätigt' });
    if (user.is_locked) return res.status(403).json({ error: 'Konto gesperrt' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Ungültige Anmeldedaten' });

    const token = tokenService.signJWT({ id: user.id, email: user.email, role: user.role, name: user.name });
    res.json({ token, role: user.role, name: user.name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// AUTH-5: Magic Link anfordern
router.post('/magic-link', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'E-Mail erforderlich' });

  try {
    const { rows: [user] } = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    // Sicherheit: keine Info ob User existiert
    if (!user || !user.is_verified || user.is_locked) {
      return res.json({ message: 'Falls die E-Mail registriert ist, wurde ein Link gesendet.' });
    }

    const token = tokenService.generateToken();
    const expires = tokenService.tokenExpiresAt(15); // 15 Minuten
    await db.query(
      'INSERT INTO auth_tokens (user_id, token, type, expires_at) VALUES ($1, $2, $3, $4)',
      [user.id, token, 'magic', expires]
    );

    await emailService.sendMagicLink(user.email, token);
    res.json({ message: 'Falls die E-Mail registriert ist, wurde ein Link gesendet.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// AUTH-5: Magic Login per übergebenem Token (POST API)
router.post('/magic-login', async (req, res) => {
  const token = req.body.token || req.query.token;
  if (!token) return res.status(400).json({ error: 'Token fehlt' });

  try {
    const { rows: [row] } = await db.query(
      'SELECT * FROM auth_tokens WHERE token = $1 AND type = $2 AND used = FALSE',
      [token, 'magic']
    );

    if (!row) return res.status(400).json({ error: 'Ungültiger oder abgelaufener Token' });
    if (new Date(row.expires_at) < new Date())
      return res.status(400).json({ error: 'Token abgelaufen' });

    const { rows: [user] } = await db.query('SELECT * FROM users WHERE id = $1', [row.user_id]);
    if (!user || user.is_locked) return res.status(403).json({ error: 'Konto gesperrt' });

    await db.query('UPDATE auth_tokens SET used = TRUE WHERE id = $1', [row.id]);

    const jwt = tokenService.signJWT({ id: user.id, email: user.email, role: user.role, name: user.name });
    res.json({ token: jwt, role: user.role, name: user.name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// GET Magic Login (Link aus E-Mail öffnen → Token → Redirect)
// Link Aufruf ist automatisch ein Get Aufruf
router.get('/magic-login', async (req, res) => {
  const { token } = req.query;
  if (!token) return res.redirect('/login.html?error=token_missing');

  try {
    const { rows: [row] } = await db.query(
      'SELECT * FROM auth_tokens WHERE token = $1 AND type = $2 AND used = FALSE',
      [token, 'magic']
    );

    if (!row || new Date(row.expires_at) < new Date())
      return res.redirect('/login.html?error=invalid_token');

    const { rows: [user] } = await db.query('SELECT * FROM users WHERE id = $1', [row.user_id]);
    if (!user || user.is_locked) return res.redirect('/login.html?error=account_locked');

    await db.query('UPDATE auth_tokens SET used = TRUE WHERE id = $1', [row.id]);

    const jwt = tokenService.signJWT({ id: user.id, email: user.email, role: user.role, name: user.name });
    // Token als Query-Parameter weitergeben, Frontend speichert es
    const target = user.role === 'admin' ? '/admin/login.html' : '/login.html';
    res.redirect(`${target}?magic_token=${jwt}&role=${user.role}`);
  } catch (err) {
    console.error(err);
    res.redirect('/login.html?error=server_error');
  }
});

module.exports = router;
