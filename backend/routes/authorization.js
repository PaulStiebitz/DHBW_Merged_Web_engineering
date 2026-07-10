const express = require('express');
const db      = require('../config/db');
const auth    = require('../middleware/auth');

const router = express.Router();

// AUTO-1: Entscheidungsinstanz
// Body: { userId, resourceId, action }
// Ressourcen: 'product', 'wishlist', 'user'
// Aktionen:   'read', 'write', 'delete', 'admin'
router.post('/', auth, async (req, res) => {
  const { userId, resourceId, action } = req.body;
  if (!userId || !resourceId || !action)
    return res.status(400).json({ error: 'userId, resourceId und action erforderlich' });

  try {
    const { rows: [user] } = await db.query(
      'SELECT id, role, is_locked FROM users WHERE id = $1',
      [userId]
    );

    if (!user) return res.json({ allowed: false, reason: 'User nicht gefunden' });
    if (user.is_locked) return res.json({ allowed: false, reason: 'Konto gesperrt' });

    // Admins dürfen alles außer Wunschlisten-spezifische Aktionen
    if (user.role === 'admin') {
      return res.json({ allowed: true, reason: 'Admin hat Vollzugriff' });
    }

    // Wunschlisten-Berechtigungen prüfen
    if (resourceId.startsWith('wishlist:')) {
      const wishlistId = resourceId.split(':')[1];
      const { rows: [wl] } = await db.query('SELECT * FROM wishlists WHERE id = $1', [wishlistId]);

      if (!wl) return res.json({ allowed: false, reason: 'Ressource nicht gefunden' });
      if (wl.owner_id === parseInt(userId)) return res.json({ allowed: true, reason: 'Besitzer' });

      const { rows: [perm] } = await db.query(
        'SELECT permission FROM wishlist_permissions WHERE wishlist_id = $1 AND user_id = $2',
        [wishlistId, userId]
      );

      if (!perm) return res.json({ allowed: false, reason: 'Keine Berechtigung' });

      if (action === 'read') return res.json({ allowed: true, reason: `Leseberechtigung` });
      if (action === 'write') {
        return res.json({ allowed: perm.permission === 'write', reason: perm.permission === 'write' ? 'Schreibberechtigung' : 'Nur Leseberechtigung' });
      }
      return res.json({ allowed: false, reason: 'Aktion nicht erlaubt' });
    }

    // Normale User können Produkte lesen
    if (resourceId.startsWith('product:') && action === 'read') {
      return res.json({ allowed: true, reason: 'Alle authentifizierten User können Produkte lesen' });
    }

    // Alle anderen Aktionen auf Produkten/User sind für normale User nicht erlaubt
    return res.json({ allowed: false, reason: 'Unzureichende Berechtigung' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

module.exports = router;
