// ============================================================
// upload-image  — Netlify serverless function
// Validates the edit password then pushes a base64 image to
// public/samples/ in the GitHub repo via the GitHub API.
// ============================================================

const REPO = 'zediiiii/secondary-math-galaxy';

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

  if (!process.env.EDIT_PASSWORD || body.password !== process.env.EDIT_PASSWORD) {
    return { statusCode: 401, headers: cors, body: 'Unauthorized' };
  }

  const { filename, base64 } = body;
  if (!filename || !base64) return { statusCode: 400, headers: cors, body: 'Missing filename or base64' };

  // Sanitise filename — letters, numbers, dots, dashes, underscores only
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const apiUrl   = `https://api.github.com/repos/${REPO}/contents/public/samples/${safeName}`;
  const ghHeaders = {
    Authorization:  `token ${process.env.GITHUB_TOKEN}`,
    Accept:         'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
    'User-Agent':   'secondary-math-galaxy',
  };

  try {
    // Check if the file already exists (need its SHA to update)
    let sha;
    const check = await fetch(apiUrl, { headers: ghHeaders });
    if (check.ok) {
      const existing = await check.json();
      sha = existing.sha;
    }

    const putRes = await fetch(apiUrl, {
      method:  'PUT',
      headers: ghHeaders,
      body: JSON.stringify({
        message: `Upload sample: ${safeName}`,
        content: base64,
        ...(sha ? { sha } : {}),
      }),
    });

    if (!putRes.ok) {
      const text = await putRes.text();
      console.error('[upload-image] GitHub PUT failed', putRes.status, text);
      return { statusCode: 500, headers: cors, body: `GitHub error ${putRes.status}: ${text}` };
    }

    return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true, filename: safeName }) };

  } catch (err) {
    console.error('[upload-image]', err);
    return { statusCode: 500, headers: cors, body: err.message };
  }
};
