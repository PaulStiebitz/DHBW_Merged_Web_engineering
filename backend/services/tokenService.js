const jwt    = require('jsonwebtoken');
const crypto = require('crypto');

function signJWT(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function verifyJWT(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

// Erzeugt einen kryptographisch sicheren, zufälligen Token aus random Bytes in HEX (z.B. für Verifizierung oder Reset-Links)
// Hex, damit es keine Probleme gibt mit encoding oder parsing
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Berechnet ein Ablaufdatum, das eine bestimmte Anzahl Minuten in der Zukunft liegt
function tokenExpiresAt(minutes = 15) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

module.exports = { signJWT, verifyJWT, generateToken, tokenExpiresAt };
