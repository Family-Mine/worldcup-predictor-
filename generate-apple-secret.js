#!/usr/bin/env node
const { sign } = require('crypto');
const fs = require('fs');

const TEAM_ID    = '8L53FE7L8Z';
const KEY_ID     = '63FHVZ43F7';
const CLIENT_ID  = 'com.wc26predictor.web';
const KEY_PATH   = process.argv[2];

if (!KEY_PATH) {
  console.error('Uso: node generate-apple-secret.js /ruta/a/AuthKey_63FHVZ43F7.p8');
  process.exit(1);
}

function base64url(buf) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

const now = Math.floor(Date.now() / 1000);
const header  = base64url(Buffer.from(JSON.stringify({ alg: 'ES256', kid: KEY_ID })));
const payload = base64url(Buffer.from(JSON.stringify({
  iss: TEAM_ID,
  iat: now,
  exp: now + 86400 * 180,
  aud: 'https://appleid.apple.com',
  sub: CLIENT_ID,
})));

const signingInput = `${header}.${payload}`;
const privateKey   = fs.readFileSync(KEY_PATH, 'utf8');

const rawSig = sign('sha256', Buffer.from(signingInput), {
  key: privateKey,
  dsaEncoding: 'ieee-p1363',
});

console.log(`${signingInput}.${base64url(rawSig)}`);
