const speakeasy = require('speakeasy');

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
  return Buffer.from(JSON.stringify(data)).toString('base64');
}

function decodeQRCode(value) {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value);
    return parsed;
  } catch {
    try {
      const decoded = Buffer.from(value, 'base64').toString('utf8');
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  }
}

module.exports = { generateQRSecret, generateQRToken, verifyQRToken, generateQRCode, decodeQRCode };
