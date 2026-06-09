// ============================================================
// sheets-read — Netlify serverless function
// Returns all 5 tabs as arrays-of-arrays in one batchGet call.
// No password required — data is already public via CSV.
// ============================================================

const crypto = require('crypto');

const SPREADSHEET_ID = '1hD7boPjP8gdAthHwk7g_JrVRY_-0q9dzJM-NbbHlCao';

const TABS = [
  { name: 'nodes',           range: 'nodes!A:G' },
  { name: 'progressions',    range: 'progressions!A:D' },
  { name: 'crossdomain',     range: 'crossdomain!A:E' },
  { name: 'tasks',           range: 'tasks!A:F' },
  { name: 'teacher_context', range: 'teacher_context!A:E' },
];

function b64url(str) {
  return Buffer.from(str).toString('base64url');
}

async function getAccessToken() {
  const key = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
  const now = Math.floor(Date.now() / 1000);
  const header  = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = b64url(JSON.stringify({
    iss:   key.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
    aud:   'https://oauth2.googleapis.com/token',
    exp:   now + 3600,
    iat:   now,
  }));
  const unsigned  = `${header}.${payload}`;
  const signer    = crypto.createSign('RSA-SHA256');
  signer.update(unsigned);
  const signature = signer.sign(key.private_key, 'base64url');
  const jwt       = `${unsigned}.${signature}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion:  jwt,
    }).toString(),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error('Token error: ' + JSON.stringify(data));
  return data.access_token;
}

exports.handler = async (event) => {
  const cors = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors };

  try {
    const token      = await getAccessToken();
    const rangeQuery = TABS.map(t => `ranges=${encodeURIComponent(t.range)}`).join('&');
    const url        = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values:batchGet?${rangeQuery}`;

    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`Sheets ${res.status}: ${await res.text()}`);

    const data   = await res.json();
    const result = {};
    TABS.forEach((tab, i) => {
      result[tab.name] = data.valueRanges[i]?.values || [];
    });

    return {
      statusCode: 200,
      headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      body: JSON.stringify(result),
    };
  } catch (err) {
    console.error('[sheets-read]', err);
    return { statusCode: 500, headers: cors, body: err.message };
  }
};
