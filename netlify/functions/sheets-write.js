// ============================================================
// sheets-write  — Netlify serverless function
// Validates the edit password then writes to Google Sheets
// using a Service Account (zero npm dependencies).
// ============================================================

const crypto = require('crypto');

const SPREADSHEET_ID = '1e3itPWSF2mNft7cQ6N7JpZt_eYs4QAMe6udEIs5pkLw';

const TAB_COLS = {
  nodes:           'nodes!A:G',
  progressions:    'progressions!A:D',
  crossdomain:     'crossdomain!A:E',
  tasks:           'tasks!A:F',
  teacher_context: 'teacher_context!A:E',
};

// ── Google Service Account JWT auth ──────────────────────────

function b64url(str) {
  return Buffer.from(str).toString('base64url');
}

async function getAccessToken() {
  const key = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
  const now = Math.floor(Date.now() / 1000);

  const header  = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = b64url(JSON.stringify({
    iss:   key.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
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

async function sheetsAPI(token, method, path, body) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization:  `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`Sheets ${res.status}: ${await res.text()}`);
  return res.json();
}

// ── Handler ───────────────────────────────────────────────────

exports.handler = async (event) => {
  const cors = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors };
  if (event.httpMethod !== 'POST')    return { statusCode: 405, headers: cors, body: 'Method Not Allowed' };

  let body;
  try   { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, headers: cors, body: 'Invalid JSON' }; }

  // ── Password gate ──
  if (!process.env.EDIT_PASSWORD || body.password !== process.env.EDIT_PASSWORD) {
    return { statusCode: 401, headers: cors, body: 'Unauthorized' };
  }

  // ping — just verifies the password, no Sheet access needed
  if (body.op === 'ping') {
    return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true }) };
  }

  try {
    const token = await getAccessToken();

    // ── append: add a row to any tab ──
    if (body.op === 'append') {
      const range = TAB_COLS[body.tab];
      if (!range) return { statusCode: 400, headers: cors, body: `Unknown tab: ${body.tab}` };

      await sheetsAPI(token, 'POST',
        `/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
        { values: [body.row] }
      );
      return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true }) };
    }

    // ── updateCell: find a node row by id and update one column ──
    if (body.op === 'updateCell') {
      const colMap = { id: 0, tier: 1, domain: 2, parent: 3, label: 4, description: 5, mediaLink: 6 };
      const colIdx = colMap[body.col];
      if (colIdx === undefined) return { statusCode: 400, headers: cors, body: `Unknown col: ${body.col}` };

      // Read column A to find the row number
      const data     = await sheetsAPI(token, 'GET', `/values/nodes!A:A`);
      const rows     = data.values || [];
      const rowIndex = rows.findIndex(r => r[0] === body.nodeId);
      if (rowIndex === -1) return { statusCode: 404, headers: cors, body: 'Node not found' };

      const col   = String.fromCharCode(65 + colIdx);
      const range = `nodes!${col}${rowIndex + 1}`;
      await sheetsAPI(token, 'PUT',
        `/values/${range}?valueInputOption=USER_ENTERED`,
        { values: [[body.value]] }
      );
      return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true }) };
    }

    return { statusCode: 400, headers: cors, body: `Unknown op: ${body.op}` };

  } catch (err) {
    console.error('[sheets-write]', err);
    return { statusCode: 500, headers: cors, body: err.message };
  }
};
