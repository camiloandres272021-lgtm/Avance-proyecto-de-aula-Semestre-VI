const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const rutaClave = path.join(__dirname, '..', 'serviceAccountKey.json');

let firebaseListo = false;

if (fs.existsSync(rutaClave)) {
  admin.initializeApp({
    credential: admin.credential.cert(require(rutaClave)),
  });
  firebaseListo = true;
  console.log('✅ Firebase Admin inicializado');
} else {
  console.warn('⚠️  No se encontro serviceAccountKey.json — el login con Google/telefono no funcionara hasta que lo agregues');
}

module.exports = { admin, firebaseListo };
