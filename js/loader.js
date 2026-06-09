// ============================================================
// Sheets Loader — 3-tier data loading with localStorage cache
//
// Priority:
//   1. /.netlify/functions/sheets-read  (always-fresh API)
//   2. Published CSV URLs               (fallback if not on Netlify)
//   3. localStorage cache               (offline / fetch failure)
//   4. Hardcoded seed data in data.js   (last resort)
//
// Exports: window.dataReady (Promise<void>)
// ============================================================

const CACHE_KEY     = 'galaxy_data_cache';
const CACHE_TS_KEY  = 'galaxy_data_cache_ts';
const CACHE_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

window.dataReady = (async () => {

  // ── Tier 1: Netlify sheets-read function ───────────────────
  let rawData = null;
  try {
    const res = await fetch('/.netlify/functions/sheets-read', { cache: 'no-store' });
    if (res.ok) {
      rawData = await res.json();
      console.log('[loader] Loaded from Sheets API.');
    }
  } catch (e) {
    console.warn('[loader] sheets-read unavailable:', e.message);
  }

  // ── Tier 2: Published CSV URLs ─────────────────────────────
  if (!rawData) {
    const cfg  = (typeof SHEETS_CONFIG !== 'undefined' && SHEETS_CONFIG) || {};
    const urls = [cfg.nodes, cfg.progressions, cfg.crossdomain, cfg.tasks, cfg.teacherContext];
    if (!urls.every(u => !u)) {
      try {
        const bust = `&_t=${Date.now()}`;
        const texts = await Promise.all(
          urls.map(u => u
            ? fetch(u + bust, { cache: 'no-store' }).then(r => r.ok ? r.text() : null).catch(() => null)
            : null)
        );
        const names  = ['nodes','progressions','crossdomain','tasks','teacher_context'];
        rawData = {};
        texts.forEach((csv, i) => { if (csv) rawData[names[i]] = csvToRows(csv); });
        if (Object.keys(rawData).length) {
          console.log('[loader] Loaded from published CSVs.');
        } else {
          rawData = null;
        }
      } catch (e) {
        console.warn('[loader] CSV fetch failed:', e.message);
      }
    }
  }

  // ── Tier 3: localStorage cache ─────────────────────────────
  if (!rawData) {
    try {
      const ts     = +(localStorage.getItem(CACHE_TS_KEY) || 0);
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached && (Date.now() - ts) < CACHE_MAX_AGE) {
        rawData = JSON.parse(cached);
        console.log('[loader] Loaded from localStorage cache.');
      }
    } catch (e) { /* ignore */ }
  }

  // ── Tier 4: seed data (data.js) — nothing to do ────────────
  if (!rawData) {
    console.log('[loader] Using hardcoded seed data.');
    return;
  }

  // ── Apply data ─────────────────────────────────────────────
  applyRawData(rawData);

  // ── Persist to localStorage (deferred so it doesn't block the render) ─
  const _serialised = JSON.stringify(rawData);
  const _ts         = String(Date.now());
  (window.requestIdleCallback || (cb => setTimeout(cb, 0)))(() => {
    try {
      localStorage.setItem(CACHE_KEY,    _serialised);
      localStorage.setItem(CACHE_TS_KEY, _ts);
    } catch (e) { /* quota exceeded — not critical */ }
  });

})();

// ── CSV → rows (array-of-arrays, same shape as sheets-read) ──

function csvToRows(text) {
  if (!text) return [];
  const lines = text.replace(/\r\n/g,'\n').replace(/\r/g,'\n').split('\n');
  return lines.filter(l => l.trim()).map(line => {
    const fields = [];
    let cur = '', inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (inQ) {
        if (c === '"' && line[i+1] === '"') { cur += '"'; i++; }
        else if (c === '"') inQ = false;
        else cur += c;
      } else if (c === '"') { inQ = true; }
      else if (c === ',') { fields.push(cur); cur = ''; }
      else cur += c;
    }
    fields.push(cur);
    return fields;
  });
}

// ── Apply array-of-arrays data to global variables ───────────
// First row is always the header row from the Sheet.

function applyRawData(raw) {

  // Helper: convert rows to array-of-objects using first row as headers
  function toObjects(rows) {
    if (!rows || rows.length < 2) return [];
    const headers = rows[0].map(h => (h || '').trim());
    return rows.slice(1).filter(r => r.some(v => v)).map(r => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = (r[i] || '').trim(); });
      return obj;
    });
  }

  // ── Nodes ──────────────────────────────────────────────────
  if (raw.nodes && raw.nodes.length > 1) {
    const rows   = toObjects(raw.nodes);
    const byTier = { 1: [], 2: [], 3: [], 4: [] };
    for (const r of rows) {
      const node = {
        id:          r.id,
        label:       r.label || '',
        tier:        +r.tier,
        domain:      r.domain || '',
        parent:      r.parent || undefined,
        description: r.description || '',
        mediaLink:   r.mediaLink   || '',
      };
      if (byTier[node.tier]) byTier[node.tier].push(node);
    }
    if (byTier[1].length) window.DOMAINS       = byTier[1];
    if (byTier[2].length) window.BIG_IDEAS      = byTier[2];
    if (byTier[3].length) window.MENTAL_ACTIONS = byTier[3];
    if (byTier[4].length) window.SAMPLES        = byTier[4];
  }

  // ── Hierarchy edges (always rebuilt from parent fields) ────
  const hierarchyEdges = [
    ...BIG_IDEAS.map(bi => ({ from: bi.parent, to: bi.id,   type: 'hierarchy', weight: 10 })),
    ...MENTAL_ACTIONS.map(ma => ({ from: ma.parent, to: ma.id, type: 'hierarchy', weight: 8 })),
    ...SAMPLES.map(s  => ({ from: s.parent,  to: s.id,   type: 'hierarchy', weight: 5 })),
  ];

  // ── Progressions ───────────────────────────────────────────
  const progressionEdges = (raw.progressions && raw.progressions.length > 1)
    ? toObjects(raw.progressions).map(r => ({
        from: r.from, to: r.to, type: 'progression',
        weight: r.weight ? +r.weight : 7,
        description: r.description || '',
      }))
    : CONNECTIONS.filter(c => c.type === 'progression');

  window.CONNECTIONS = [...hierarchyEdges, ...progressionEdges];

  // ── Cross-domain ───────────────────────────────────────────
  if (raw.crossdomain && raw.crossdomain.length > 1) {
    window.CROSS_DOMAIN = toObjects(raw.crossdomain).map(r => ({
      id:          r.id,
      from:        r.from,
      to:          r.to,
      type:        'conceptual-bridge',
      strength:    r.strength ? +r.strength : 5,
      description: r.description || '',
    }));
  }

  // ── Tasks + teacher context ────────────────────────────────
  if (raw.tasks && raw.tasks.length > 1) {
    const ctxByTask = {};
    if (raw.teacher_context && raw.teacher_context.length > 1) {
      for (const r of toObjects(raw.teacher_context)) {
        if (!ctxByTask[r.taskId]) ctxByTask[r.taskId] = { before: [], after: [] };
        const entry = { maId: r.maId, type: r.type, content: r.content };
        if (r.stage === 'before') ctxByTask[r.taskId].before.push(entry);
        else                      ctxByTask[r.taskId].after.push(entry);
      }
    }
    window.TASKS = toObjects(raw.tasks).map(r => ({
      id:            r.id,
      label:         r.label,
      category:      r.category,
      domain:        r.domain    || '',
      pdfLink:       r.pdfLink   || '',
      targetMAs:     r.targetMAs ? r.targetMAs.split('|').filter(Boolean) : [],
      beforeContext: ctxByTask[r.id]?.before || [],
      afterContext:  ctxByTask[r.id]?.after  || [],
    }));
  }
}

// ── Public helpers used by editor.js for cache updates ───────

window.galaxyCache = {

  // Call after any in-memory edit to persist it to localStorage
  save() {
    try {
      const raw = {
        nodes:           buildRawNodes(),
        progressions:    buildRawProgressions(),
        crossdomain:     buildRawCrossDomain(),
        tasks:           buildRawTasks(),
        teacher_context: buildRawTeacherContext(),
      };
      localStorage.setItem(CACHE_KEY,    JSON.stringify(raw));
      localStorage.setItem(CACHE_TS_KEY, String(Date.now()));
    } catch (e) { /* quota */ }
  },

  // Download all current in-memory data as a single JSON file.
  // Same shape as sheets-read returns, so it can be re-imported or
  // pasted manually into the sheet tabs.
  exportData() {
    const payload = {
      exported: new Date().toISOString(),
      nodes:           buildRawNodes(),
      progressions:    buildRawProgressions(),
      crossdomain:     buildRawCrossDomain(),
      tasks:           buildRawTasks(),
      teacher_context: buildRawTeacherContext(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a    = Object.assign(document.createElement('a'), {
      href:     URL.createObjectURL(blob),
      download: `galaxy-export-${new Date().toISOString().slice(0,10)}.json`,
    });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  },
};

// ── Serialise in-memory data back to rows-of-arrays ──────────

function buildRawNodes() {
  const header = ['id','tier','domain','parent','label','description','mediaLink'];
  const all = [...(DOMAINS||[]), ...(BIG_IDEAS||[]), ...(MENTAL_ACTIONS||[]), ...(SAMPLES||[])];
  return [header, ...all.map(n => [n.id, n.tier, n.domain, n.parent||'', n.label||'', n.description||'', n.mediaLink||''])];
}

function buildRawProgressions() {
  const header = ['from','to','type','weight'];
  const rows   = (CONNECTIONS||[]).filter(c => c.type === 'progression')
    .map(c => [c.from, c.to, c.type, c.weight||7]);
  return [header, ...rows];
}

function buildRawCrossDomain() {
  const header = ['id','from','to','strength','description'];
  return [header, ...(CROSS_DOMAIN||[]).map(x => [x.id, x.from, x.to, x.strength||5, x.description||''])];
}

function buildRawTasks() {
  const header = ['id','label','category','domain','pdfLink','targetMAs'];
  return [header, ...(TASKS||[]).map(t => [t.id, t.label, t.category, t.domain||'', t.pdfLink||'', (t.targetMAs||[]).join('|')])];
}

function buildRawTeacherContext() {
  const header = ['taskId','stage','maId','type','content'];
  const rows   = [];
  for (const t of (TASKS||[])) {
    for (const c of (t.beforeContext||[])) rows.push([t.id,'before',c.maId,c.type,c.content]);
    for (const c of (t.afterContext||[]))  rows.push([t.id,'after', c.maId,c.type,c.content]);
  }
  return [header, ...rows];
}
