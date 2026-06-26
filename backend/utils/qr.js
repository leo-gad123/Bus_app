const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

function generateQRSecret() {
  return speakeasy.generateSecret({ length: 20 }).base32;
}

function generateQRToken(secret) {
  return speakeasy.totp({
    secret: secret,
    encoding: 'base32',
    step: 300
  });
}

function verifyQRToken(secret, token) {
  return speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: token,
    step: 300,
    window: 1
  });
}

async function generateQRCode(data) {
  return QRCode.toDataURL(JSON.stringify(data));
}

module.exports = { generateQRSecret, generateQRToken, verifyQRToken, generateQRCode };
