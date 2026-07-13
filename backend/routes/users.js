const express      = require('express');
const bcrypt       = require('bcrypt');
const db           = require('../config/db');
const auth         = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');

const router = express.Router();

// User-Suche per Name oder E-Mail (für alle eingeloggten User wird im Berechtigungs-Dialogfenster gebraucht)
router.get('/search', auth, async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 2)
    return res.status(400).json({ error: 'Mindestens 2 Zeichen eingeben' });

  try {
    const { rows } = await db.query(
      `SELECT id, name, email FROM users
       WHERE (name ILIKE $1 OR email ILIKE $1)
         AND id != $2
         AND is_locked = FALSE
       ORDER BY name ASC
       LIMIT 3`,
      [`%${q.trim()}%`, req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// USER-1: User by ID abrufen (Admin)
router.get('/:id', auth, requireAdmin, async (req, res) => {
  try {
    const { rows: [user] } = await db.query(
      'SELECT id, name, email, role, is_verified, is_locked FROM users WHERE id = $1',
      [req.params.id]
    );
    if (!user) return res.status(404).json({ error: 'User nicht gefunden' });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// USER-2: User löschen (Admin)
router.delete('/:id', auth, requireAdmin, async (req, res) => {
  try {
    const { rowCount } = await db.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'User nicht gefunden' });
    res.json({ message: 'User gelöscht' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// USER-3: Admin-Account erstellen (Admin)
router.post('/admin', auth, requireAdmin, async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'Name, E-Mail und Passwort erforderlich' });

  try {
    const hashed = await bcrypt.hash(password, 10);
    const { rows: [user] } = await db.query(
      `INSERT INTO users (name, email, password, role, is_verified)
       VALUES ($1,$2,$3,'admin', TRUE) RETURNING id, name, email, role`,
      [name, email, hashed]
    );
    res.status(201).json(user);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'E-Mail bereits registriert' });
    console.error(err);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// USER-4: User sperren/entsperren (Admin)
router.patch('/:id/status', auth, requireAdmin, async (req, res) => {
  const { is_locked } = req.body;
  if (is_locked === undefined) return res.status(400).json({ error: 'is_locked (true/false) erforderlich' });

  try {
    const { rows: [user] } = await db.query(
      'UPDATE users SET is_locked = $1 WHERE id = $2 RETURNING id, name, email, is_locked',
      [is_locked, req.params.id]
    );
    if (!user) return res.status(404).json({ error: 'User nicht gefunden' });
    res.json({ message: `User ${is_locked ? 'gesperrt' : 'entsperrt'}`, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Alle User auflisten (Admin) für Admin-Dashboard
router.get('/', auth, requireAdmin, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT id, name, email, role, is_verified, is_locked FROM users ORDER BY id DESC'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

module.exports = router;
