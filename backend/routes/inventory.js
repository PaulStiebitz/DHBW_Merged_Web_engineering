const express = require('express');
const db = require('../config/db');
const auth = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');
const emailService = require('../services/emailService');

const router = express.Router();

// INV-1: Produkt by ID
// Lädt ein einzelnes Produkt anhand der ID aus der URL
router.get('/products/:id', auth, async (req, res) => {
  try {
    const { rows: [product] } = await db.query(
      'SELECT * FROM products WHERE id = $1',
      [req.params.id]
    );
    // Fehler, falls das Produkt nicht existiert
    if (!product) return res.status(404).json({ error: 'Produkt nicht gefunden' });
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// INV-2: Produktsuche (Kriterien: name, category, id)
// Sucht Produkte nach Name, Kategorie oder ID
router.get('/products', auth, async (req, res) => {
  const { name, category, id } = req.query;
  try {
    // Suche per ID -> direkt zurückgeben, da ID eindeutig ist
    if (id) {
      const { rows: [product] } = await db.query('SELECT * FROM products WHERE id = $1', [id]);
      return res.json(product ? [product] : []); // Immer als Array zurückgeben
    }

    let query = 'SELECT * FROM products WHERE TRUE';
    const params = [];

    // Wenn nach Name gesucht wird, Wildcards (%) für Teilwortsuche nutzen
    if (name) {
      params.push(`%${name}%`);
      query += ` AND name ILIKE $${params.length}`; // ILIKE ignoriert Groß-/Kleinschreibung
    }
    // Wenn nach Kategorie gesucht wird, exakt filtern
    if (category) {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }

    query += ' ORDER BY name ASC';
    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// INV-3: Produkt erstellen (Admin)
// Legt ein neues Produkt in der Datenbank an
router.post('/products', auth, requireAdmin, async (req, res) => {
  const { name, description, price, quantity, category } = req.body;
  // Pflichtfelder prüfen
  if (!name || price === undefined || quantity === undefined)
    return res.status(400).json({ error: 'Name, Preis und Menge erforderlich' });

  try {
    const { rows: [product] } = await db.query(
      'INSERT INTO products (name, description, price, quantity, category) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [name, description || '', price, quantity, category || null]
    );
    res.status(201).json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// INV-4: Produkt löschen (Admin)
router.delete('/products/:id', auth, requireAdmin, async (req, res) => {
  try {
    const { rowCount } = await db.query('DELETE FROM products WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Produkt nicht gefunden' });
    res.json({ message: 'Produkt gelöscht' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// INV-5: Produkt bearbeiten (Admin)
// Überschreibt ein bestehendes Produkt komplett
router.put('/products/:id', auth, requireAdmin, async (req, res) => {
  const { name, description, price, quantity, category } = req.body;
  if (!name || price === undefined || quantity === undefined)
    return res.status(400).json({ error: 'Name, Preis und Menge erforderlich' });

  try {
    const { rows: [product] } = await db.query(
      `UPDATE products SET name=$1, description=$2, price=$3, quantity=$4, category=$5
       WHERE id=$6 RETURNING *`,
      [name, description || '', price, quantity, category || null, req.params.id]
    );
    if (!product) return res.status(404).json({ error: 'Produkt nicht gefunden' });
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// INV-6: Produkt in Warenkorb legen
router.post('/cart', auth, async (req, res) => {
  const { product_id, quantity = 1 } = req.body;
  if (!product_id) return res.status(400).json({ error: 'product_id erforderlich' });

  try {
    // Zuerst checken, ob das Produkt überhaupt existiert und auf Lager ist
    const { rows: [product] } = await db.query('SELECT * FROM products WHERE id = $1', [product_id]);
    if (!product) return res.status(404).json({ error: 'Produkt nicht gefunden' });
    if (product.quantity < 1) return res.status(400).json({ error: 'Produkt nicht verfügbar' });
    if (product.quantity < quantity) return res.status(400).json({ error: 'Nicht genug auf Lager' });

    // Upsert: falls schon im Warenkorb, Menge einfach erhöhen, ansonsten neu einfügen
    await db.query(
      `INSERT INTO cart_items (user_id, product_id, quantity) VALUES ($1,$2,$3)
       ON CONFLICT (user_id, product_id) DO UPDATE SET quantity = cart_items.quantity + $3`,
      [req.user.id, product_id, quantity]
    );
    res.status(201).json({ message: 'Zum Warenkorb hinzugefügt' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Warenkorb anzeigen
router.get('/cart', auth, async (req, res) => {
  try {
    // JOIN, um die reinen Warenkorb-Einträge mit den echten Namen und Preisen der Produkte zu verknüpfen
    const { rows } = await db.query(
      `SELECT ci.id, ci.quantity, p.id AS product_id, p.name, p.price, p.quantity AS stock
       FROM cart_items ci JOIN products p ON p.id = ci.product_id
       WHERE ci.user_id = $1`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Produkt aus Warenkorb entfernen
router.delete('/cart/:productId', auth, async (req, res) => {
  try {
    await db.query(
      'DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2',
      [req.user.id, req.params.productId]
    );
    res.json({ message: 'Aus Warenkorb entfernt' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// INV-7 + INV-8: Warenkorb kaufen + Bestätigungsmail
router.post('/orders', auth, async (req, res) => {
  try {
    // Aktuellen Warenkorb-Inhalt auslesen
    const { rows: items } = await db.query(
      `SELECT ci.quantity, p.id, p.name, p.price, p.quantity AS stock
       FROM cart_items ci JOIN products p ON p.id = ci.product_id
       WHERE ci.user_id = $1`,
      [req.user.id]
    );

    if (items.length === 0) return res.status(400).json({ error: 'Warenkorb ist leer' });
    
    // Prüfen ob sich der Lagerbestand in der Zwischenzeit geändert hat
    const unavailable = items.filter(i => i.quantity > i.stock);
    if (unavailable.length > 0)
      return res.status(400).json({ error: 'Einige Produkte sind nicht mehr verfügbar', items: unavailable.map(i => i.name) });

    // Gesamtsumme berechnen
    const total = items.reduce((s, i) => s + parseFloat(i.price) * i.quantity, 0);
    
    // Bestellung anlegen
    const { rows: [order] } = await db.query(
      'INSERT INTO orders (user_id, total) VALUES ($1,$2) RETURNING id',
      [req.user.id, total.toFixed(2)]
    );

    // Positionen der Bestellung in die Datenbank schreiben und Lagerbestand abziehen
    for (const item of items) {
      await db.query(
        'INSERT INTO order_items (order_id, product_id, name, price, quantity) VALUES ($1,$2,$3,$4,$5)',
        [order.id, item.id, item.name, item.price, item.quantity]
      );
      await db.query(
        'UPDATE products SET quantity = quantity - $1 WHERE id = $2',
        [item.quantity, item.id]
      );
    }

    // Nach dem Kauf den Warenkorb des Users leeren
    await db.query('DELETE FROM cart_items WHERE user_id = $1', [req.user.id]);

    // Bestätigungsmail (INV-8)
    try {
      const { rows: [user] } = await db.query('SELECT email FROM users WHERE id = $1', [req.user.id]);
      await emailService.sendOrderConfirmation(user.email, order.id, items);
    } catch (mailErr) {
      console.error('E-Mail Fehler:', mailErr); // Wir loggen das nur, damit der Kauf trotzdem gültig bleibt
    }

    res.status(201).json({ orderId: order.id, total: total.toFixed(2) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// INV-7: Kaufhistorie anzeigen
router.get('/orders', auth, async (req, res) => {
  try {
    // Erst alle Bestellungen des Users laden
    const { rows: orders } = await db.query(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );

    // Positionen je Bestellung laden (Schleife baut einen JSON-Baum auf)
    for (const order of orders) {
      const { rows: items } = await db.query(
        'SELECT * FROM order_items WHERE order_id = $1',
        [order.id]
      );
      order.items = items; // Artikel als Liste an die Bestellung anhängen
    }

    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

module.exports = router;
