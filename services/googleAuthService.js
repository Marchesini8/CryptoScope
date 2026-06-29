const crypto = require('crypto');

const GOOGLE_CERTS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
const GOOGLE_ISSUERS = new Set(['https://accounts.google.com', 'accounts.google.com']);
let cachedKeys = { expiresAt: 0, keys: [] };

function base64UrlDecode(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(normalized + '='.repeat((4 - normalized.length % 4) % 4), 'base64');
}

function decodeJson(value) {
  return JSON.parse(base64UrlDecode(value).toString('utf8'));
}

async function getGoogleKeys() {
  if (cachedKeys.expiresAt > Date.now() && cachedKeys.keys.length) return cachedKeys.keys;
  const response = await fetch(GOOGLE_CERTS_URL);
  if (!response.ok) throw new Error('Nao foi possivel buscar as chaves do Google.');
  const cacheControl = response.headers.get('cache-control') || '';
  const maxAge = Number((cacheControl.match(/max-age=(\d+)/) || [])[1] || 3600);
  const body = await response.json();
  cachedKeys = { expiresAt: Date.now() + maxAge * 1000, keys: body.keys || [] };
  return cachedKeys.keys;
}

async function verifyGoogleCredential(credential) {
  const clientId = process.env.GOOGLE_CLIENT_ID || '1017587020137-jh25acjsgc7cffgf4c34uod6gl91gnf4.apps.googleusercontent.com';
  const parts = String(credential || '').split('.');
  if (parts.length !== 3) throw new Error('Token do Google invalido.');

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const header = decodeJson(encodedHeader);
  const payload = decodeJson(encodedPayload);
  if (header.alg !== 'RS256') throw new Error('Assinatura do Google invalida.');

  const keys = await getGoogleKeys();
  const key = keys.find(item => item.kid === header.kid);
  if (!key) throw new Error('Chave do Google nao encontrada.');

  const publicKey = crypto.createPublicKey({ key, format: 'jwk' });
  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(encodedHeader + '.' + encodedPayload);
  verifier.end();
  const valid = verifier.verify(publicKey, base64UrlDecode(encodedSignature));
  if (!valid) throw new Error('Assinatura do Google invalida.');

  if (payload.aud !== clientId) throw new Error('Client ID do Google nao confere.');
  if (!GOOGLE_ISSUERS.has(payload.iss)) throw new Error('Emissor do Google invalido.');
  if (Number(payload.exp || 0) * 1000 < Date.now()) throw new Error('Login do Google expirou.');
  if (!payload.email_verified) throw new Error('E-mail do Google nao verificado.');

  return {
    googleId: payload.sub,
    email: payload.email,
    name: payload.name || payload.email,
    avatarUrl: payload.picture || null
  };
}

module.exports = { verifyGoogleCredential };
