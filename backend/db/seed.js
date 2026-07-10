const bcrypt = require('bcrypt');
const db     = require('../config/db');

async function seed() {
  try {
    // Nur seeden wenn products-Tabelle leer ist
    const { rows } = await db.query('SELECT COUNT(*) AS count FROM products');
    if (parseInt(rows[0].count, 10) > 0) {
      console.log('Seed: Datenbank enthält bereits Produkte - übersprungen.');
      return;
    }

    console.log('Seed: Starte Initialisierung...');

    const hash = await bcrypt.hash('password123', 10);

    await db.query(`
      INSERT INTO users (name, email, password, role, is_verified)
      VALUES ($1, $2, $3, 'admin', TRUE)
      ON CONFLICT (email) DO UPDATE
        SET role        = 'admin',
            is_verified = TRUE,
            is_locked   = FALSE,
            password    = $3
    `, ['Shop Admin', 'webshop.dhbw@gmail.com', hash]);

    await db.query(`
      INSERT INTO products (name, description, price, quantity, category) VALUES
        ('AMD Ryzen 9 7950X',              '16-Kern-Prozessor der Zen-4-Architektur. Basistakt 4,5 GHz, Boost bis 5,7 GHz. TDP 170W. Sockel AM5.',                                589.99, 12, 'CPU'),
        ('Intel Core i9-13900K',           '24-Kern-Prozessor (8P + 16E). Boost bis 5,8 GHz. TDP 125W. Sockel LGA1700.',                                                         519.00,  8, 'CPU'),
        ('AMD Ryzen 5 7600X',              '6-Kern-Prozessor Zen 4. Boost bis 5,3 GHz. Hervorragendes Preis-Leistungs-Verhältnis. Sockel AM5.',                                   229.99, 25, 'CPU'),
        ('Intel Core i5-13600K',           '14-Kern-Prozessor (6P + 8E). Boost bis 5,1 GHz. Ideal für Gaming und Content Creation. Sockel LGA1700.',                             289.00, 20, 'CPU'),
        ('Intel Core i9-14900KS',          'Sonderedition mit 6,2 GHz Boost. Aktuell nicht auf Lager.',                                                                           699.00,  0, 'CPU'),
        ('NVIDIA GeForce RTX 4090',        'Flagship-Grafikkarte mit 24 GB GDDR6X. Ada Lovelace Architektur. Ideal für 4K-Gaming und KI-Workloads.',                             1749.00,  5, 'GPU'),
        ('AMD Radeon RX 7900 XTX',         '24 GB GDDR6-Speicher. RDNA 3 Architektur. Hervorragende 4K-Performance. PCIe 4.0.',                                                   949.00,  7, 'GPU'),
        ('NVIDIA GeForce RTX 4070',        '12 GB GDDR6X. Ada Lovelace. Sehr gute 1440p-Performance. DLSS 3 und Frame Generation.',                                               599.00, 15, 'GPU'),
        ('AMD Radeon RX 7600',             '8 GB GDDR6. RDNA 3. Empfehlenswert für 1080p-Gaming. Niedriger Verbrauch.',                                                           269.99, 30, 'GPU'),
        ('Corsair Vengeance DDR5-6000 32GB','2x 16 GB DDR5-6000 CL36. Intel XMP 3.0 und AMD EXPO. Hochleistungs-RAM für AM5 und LGA1700.',                                        139.99, 22, 'RAM'),
        ('G.Skill Trident Z5 DDR5-6400 64GB','2x 32 GB DDR5-6400 CL32. Maximale Kapazität und Geschwindigkeit für Workstations.',                                                 279.00, 10, 'RAM'),
        ('Kingston Fury Beast DDR4-3200 16GB','2x 8 GB DDR4-3200 CL16. Solide Allround-Wahl für DDR4-Plattformen.',                                                                44.99, 40, 'RAM'),
        ('Samsung 990 Pro 2TB NVMe',       'PCIe 4.0 NVMe SSD. Lesen: 7.450 MB/s, Schreiben: 6.900 MB/s. M.2 2280. 5 Jahre Garantie.',                                           179.99, 18, 'SSD'),
        ('WD Black SN850X 1TB NVMe',       'PCIe 4.0 NVMe. Lesen: 7.300 MB/s. Optimiert für PlayStation 5 und PC-Gaming.',                                                        99.00, 25, 'SSD'),
        ('Crucial MX500 1TB SATA',         'SATA-III SSD. Lesen: 560 MB/s. Zuverlässige und günstige Upgrade-Option.',                                                             64.99, 35, 'SSD'),
        ('ASUS ROG Crosshair X670E Hero',  'AM5-Mainboard für Ryzen 7000. PCIe 5.0 x16. WiFi 6E. 4x DDR5-Slots. 10G LAN.',                                                       589.00,  6, 'Mainboard'),
        ('MSI MAG Z790 Tomahawk WiFi',     'LGA1700-Mainboard für Intel 12./13./14. Gen. DDR5. WiFi 6E. PCIe 5.0. ATX-Formfaktor.',                                               249.99, 12, 'Mainboard'),
        ('Gigabyte B650 AORUS Elite AX',   'AM5-Mainboard. PCIe 5.0. WiFi 6E. 4x DDR5. Gutes Preis-Leistungs-Verhältnis.',                                                       199.00, 14, 'Mainboard'),
        ('be quiet! Dark Power 13 1000W',  '80 PLUS Titanium. Vollmodular. Extrem leise. ATX 3.0 und PCIe 5.0 kompatibel.',                                                       239.00,  9, 'Netzteil'),
        ('Corsair RM1000x 1000W',          '80 PLUS Gold. Vollmodular. Lüfter startet erst ab 40% Last. 10 Jahre Garantie.',                                                       169.99, 11, 'Netzteil'),
        ('Seasonic Focus GX-750 750W',     '80 PLUS Gold. Vollmodular. Kompakte Bauweise. Sehr gute Spannungsstabilität.',                                                         109.00, 20, 'Netzteil'),
        ('Fractal Design Torrent',         'Maximaler Airflow durch großen 180-mm-Frontlüfter. E-ATX-Support. Echtglas-Seitenteil.',                                               169.99,  8, 'Gehäuse'),
        ('Lian Li PC-O11 Dynamic EVO',     'Duales Kammer-Layout. Unterstützt 360-mm-Radiatoren auf drei Seiten. Sehr beliebt für Custom-Loops.',                                  149.00, 10, 'Gehäuse'),
        ('be quiet! Pure Base 500DX',      'Schallgedämmtes Midi-Tower-Gehäuse. Inklusive 3x Pure Wings 2 140-mm-Lüfter. ARGB-Front.',                                             99.99, 16, 'Gehäuse'),
        ('Noctua NH-D15',                  'Dual-Tower-CPU-Kühler. 2x 140-mm-Lüfter. Exzellente Kühlleistung bei niedrigem Geräuschpegel.',                                        99.90, 14, 'Kühlung'),
        ('Arctic Liquid Freezer II 360',   '360-mm-AIO-Wasserkühlung. Inklusive Lüfter für den VRM-Bereich. Sehr gutes Preis-Leistungs-Verhältnis.',                               129.99, 11, 'Kühlung'),
        ('be quiet! Dark Rock Pro 4',      'Dual-Tower-CPU-Kühler. 250W TDP. Zwei Silent Wings 3-Lüfter. Nickelbeschichtete Heatpipes.',                                            79.90, 17, 'Kühlung')
    `);

    console.log('Seed: Admin-User und Produkte erfolgreich angelegt.');
    console.log('Seed: Admin: webshop.dhbw@gmail.com / password123');
  } catch (err) {
    console.error('Seed fehlgeschlagen:', err);
    throw err;
  }
}

module.exports = seed;
