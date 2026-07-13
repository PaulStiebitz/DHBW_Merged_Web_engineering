const express      = require('express');
const db           = require('../config/db');
const auth         = require('../middleware/auth');

const router = express.Router();

// Hilfsfunktion: Prüft ob User Zugriff auf Wunschliste hat
async function getPermission(wishlistId, userId) {
  const { rows: [wl] } = await db.query('SELECT * FROM wishlists WHERE id = $1', [wishlistId]);
  if (!wl) return null;
  if (wl.owner_id === userId) return 'owner';

  const { rows: [perm] } = await db.query(
    'SELECT permission FROM wishlist_permissions WHERE wishlist_id = $1 AND user_id = $2',
    [wishlistId, userId]
  );
  return perm ? perm.permission : null;
}

// WUN-1: Wunschliste erstellen
router.post('/', auth, async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Name erforderlich' });

  try {
    const { rows: [wl] } = await db.query(
      'INSERT INTO wishlists (name, description, owner_id) VALUES ($1,$2,$3) RETURNING *',
      [name, description || '', req.user.id]
    );
    res.status(201).json(wl);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Alle eigenen + berechtigten Wunschlisten abrufen
router.get('/', auth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT DISTINCT w.*, u.name AS owner_name,
              CASE WHEN w.owner_id = $1 THEN 'owner' ELSE wp.permission END AS my_permission
       FROM wishlists w
       JOIN users u ON u.id = w.owner_id
       LEFT JOIN wishlist_permissions wp ON wp.wishlist_id = w.id AND wp.user_id = $1
       WHERE w.owner_id = $1 OR wp.user_id = $1
       ORDER BY w.id DESC`,
      [req.user.id]
    );

    // Produkte je Liste laden
    for (const wl of rows) {
      const { rows: items } = await db.query(
        `SELECT p.id, p.name, p.price, p.category
         FROM wishlist_items wi JOIN products p ON p.id = wi.product_id
         WHERE wi.wishlist_id = $1`,
        [wl.id]
      );
      wl.products = items;
    }

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// WUN-2: Wunschliste bearbeiten (Name/Beschreibung)
router.put('/:id', auth, async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Name erforderlich' });

  try {
    const perm = await getPermission(req.params.id, req.user.id);
    if (!perm) return res.status(403).json({ error: 'Kein Zugriff' });
    if (perm === 'read') return res.status(403).json({ error: 'Nur Leseberechtigung' });

    const { rows: [wl] } = await db.query(
      'UPDATE wishlists SET name=$1, description=$2 WHERE id=$3 RETURNING *',
      [name, description || '', req.params.id]
    );
    res.json(wl);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// WUN-3: Wunschliste löschen (nur Besitzer)
router.delete('/:id', auth, async (req, res) => {
  try {
    const { rows: [wl] } = await db.query('SELECT * FROM wishlists WHERE id = $1', [req.params.id]);
    if (!wl) return res.status(404).json({ error: 'Nicht gefunden' });
    if (wl.owner_id !== req.user.id) return res.status(403).json({ error: 'Nur der Besitzer darf löschen' });

    await db.query('DELETE FROM wishlists WHERE id = $1', [req.params.id]);
    res.json({ message: 'Wunschliste gelöscht' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// WUN-2: Produkt hinzufügen (Schreibberechtigung)
router.post('/:id/products', auth, async (req, res) => {
  const { product_id } = req.body;
  if (!product_id) return res.status(400).json({ error: 'product_id erforderlich' });

  try {
    const perm = await getPermission(req.params.id, req.user.id);
    if (!perm) return res.status(403).json({ error: 'Kein Zugriff' });
    if (perm === 'read') return res.status(403).json({ error: 'Nur Leseberechtigung' });

    const { rows: [product] } = await db.query('SELECT id FROM products WHERE id = $1', [product_id]);
    if (!product) return res.status(404).json({ error: 'Produkt nicht gefunden' });

    await db.query(
      'INSERT INTO wishlist_items (wishlist_id, product_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
      [req.params.id, product_id]
    );
    res.status(201).json({ message: 'Produkt hinzugefügt' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// WUN-2: Produkt entfernen (Schreibberechtigung)
router.delete('/:id/products/:productId', auth, async (req, res) => {
  try {
    const perm = await getPermission(req.params.id, req.user.id);
    if (!perm) return res.status(403).json({ error: 'Kein Zugriff' });
    if (perm === 'read') return res.status(403).json({ error: 'Nur Leseberechtigung' });

    await db.query(
      'DELETE FROM wishlist_items WHERE wishlist_id = $1 AND product_id = $2',
      [req.params.id, req.params.productId]
    );
    res.json({ message: 'Produkt entfernt' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// WUN-4: Berechtigung vergeben (nur Besitzer)
router.post('/:id/permissions', auth, async (req, res) => {
  const { user_id, permission } = req.body;
  if (!user_id || !permission) return res.status(400).json({ error: 'user_id und permission erforderlich' });
  if (!['read', 'write'].includes(permission))
    return res.status(400).json({ error: 'Erlaubte Werte: read, write' });

  try {
    const { rows: [wl] } = await db.query('SELECT * FROM wishlists WHERE id = $1', [req.params.id]);
    if (!wl) return res.status(404).json({ error: 'Nicht gefunden' });
    if (wl.owner_id !== req.user.id) return res.status(403).json({ error: 'Nur der Besitzer darf Berechtigungen vergeben' });
    if (user_id === req.user.id) return res.status(400).json({ error: 'Keine Selbstberechtigung' });

    await db.query(
      `INSERT INTO wishlist_permissions (wishlist_id, user_id, permission) VALUES ($1,$2,$3)
       ON CONFLICT (wishlist_id, user_id) DO UPDATE SET permission = $3`,
      [req.params.id, user_id, permission]
    );
    res.status(201).json({ message: 'Berechtigung gesetzt' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Berechtigung entziehen (nur Besitzer)
router.delete('/:id/permissions/:userId', auth, async (req, res) => {
  try {
    const { rows: [wl] } = await db.query('SELECT * FROM wishlists WHERE id = $1', [req.params.id]);
    if (!wl) return res.status(404).json({ error: 'Nicht gefunden' });
    if (wl.owner_id !== req.user.id) return res.status(403).json({ error: 'Nur der Besitzer darf Berechtigungen entziehen' });

    await db.query(
      'DELETE FROM wishlist_permissions WHERE wishlist_id = $1 AND user_id = $2',
      [req.params.id, req.params.userId]
    );
    res.json({ message: 'Berechtigung entzogen' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

module.exports = router;
