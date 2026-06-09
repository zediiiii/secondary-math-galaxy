// ============================================================
// Sheets Loader — fetches Google Sheets CSV URLs from
// SHEETS_CONFIG and overwrites the global data arrays.
// Falls back to hardcoded data.js when URLs are empty.
//
// Exports: window.dataReady  (Promise<void>)
// app.js must call dataReady.then(() => initApp())
// ============================================================

window.dataReady = (async () => {
  const cfg = (typeof SHEETS_CONFIG !== 'undefined' && SHEETS_CONFIG) || {};
  const urls = [cfg.nodes, cfg.progressions, cfg.crossdomain, cfg.tasks, cfg.teacherContext];

  // If no URLs are configured, use hardcoded data as-is.
  if (urls.every(u => !u)) return;

  let csvTexts;
  try {
    const bust = `&_t=${Date.now()}`;
    csvTexts = await Promise.all(urls.map(u => u ? fetch(u + bust, { cache: 'no-store' }).then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status} fetching ${u}`);
      return r.text();
    }) : Promise.resolve(null)));
  } catch (err) {
    console.warn('[loader] Sheets fetch failed, using seed data:', err.message);
    return;
  }

  const [nodesCsv, progCsv, xdCsv, tasksCsv, ctxCsv] = csvTexts;

  // ── CSV parser (RFC-4180 subset) ────────────────────────────────
  function parseCSV(text) {
    if (!text) return [];
    const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    const headers = splitRow(lines[0]);
    return lines.slice(1).filter(l => l.trim()).map(line => {
      const vals = splitRow(line);
      const obj = {};
      headers.forEach((h, i) => { obj[h.trim()] = (vals[i] || '').trim(); });
      return obj;
    });
  }

  function splitRow(line) {
    const fields = [];
    let cur = '', inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (inQ) {
        if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (c === '"') inQ = false;
        else cur += c;
      } else if (c === '"') { inQ = true; }
      else if (c === ',') { fields.push(cur); cur = ''; }
      else cur += c;
    }
    fields.push(cur);
    return fields;
  }

  // ── Build DOMAINS, BIG_IDEAS, MENTAL_ACTIONS, SAMPLES ───────────
  if (nodesCsv) {
    const rows = parseCSV(nodesCsv);
    const byTier = { 1: [], 2: [], 3: [], 4: [] };
    for (const r of rows) {
      const node = {
        id:          r.id,
        label:       r.label,
        tier:        +r.tier,
        domain:      r.domain,
        parent:      r.parent || undefined,
        description: r.description || '',
        mediaLink:   r.mediaLink  || '',
      };
      if (byTier[node.tier]) byTier[node.tier].push(node);
    }
    if (byTier[1].length) window.DOMAINS        = byTier[1];
    if (byTier[2].length) window.BIG_IDEAS       = byTier[2];
    if (byTier[3].length) window.MENTAL_ACTIONS  = byTier[3];
    if (byTier[4].length) window.SAMPLES         = byTier[4];
  }

  // ── Rebuild hierarchy CONNECTIONS from parent fields ───────────
  // (Always regenerate so layout.js and graph.js get fresh edges)
  const hierarchyEdges = [
    ...BIG_IDEAS.map(bi => ({ from: bi.parent, to: bi.id, type: 'hierarchy', weight: 10 })),
    ...MENTAL_ACTIONS.map(ma => ({ from: ma.parent, to: ma.id, type: 'hierarchy', weight: 8 })),
    ...SAMPLES.map(s => ({ from: s.parent, to: s.id, type: 'hierarchy', weight: 5 })),
  ];

  // ── Append progression edges from Sheets ────────────────────────
  const progressionEdges = progCsv ? parseCSV(progCsv).map(r => ({
    from: r.from, to: r.to, type: 'progression',
    weight: r.weight ? +r.weight : 7,
    description: r.description || '',
  })) : CONNECTIONS.filter(c => c.type === 'progression');

  window.CONNECTIONS = [...hierarchyEdges, ...progressionEdges];

  // ── Cross-domain connections ────────────────────────────────────
  if (xdCsv) {
    window.CROSS_DOMAIN = parseCSV(xdCsv).map(r => ({
      id:          r.id,
      from:        r.from,
      to:          r.to,
      type:        'conceptual-bridge',
      strength:    r.strength ? +r.strength : 5,
      description: r.description || '',
    }));
  }

  // ── Tasks ────────────────────────────────────────────────────────
  if (tasksCsv) {
    const taskRows = parseCSV(tasksCsv);
    // Build context lookup from teacher_context tab
    const ctxByTask = {};
    if (ctxCsv) {
      for (const r of parseCSV(ctxCsv)) {
        if (!ctxByTask[r.taskId]) ctxByTask[r.taskId] = { before: [], after: [] };
        const entry = { maId: r.maId, type: r.type, content: r.content };
        if (r.stage === 'before') ctxByTask[r.taskId].before.push(entry);
        else                      ctxByTask[r.taskId].after.push(entry);
      }
    }

    window.TASKS = taskRows.map(r => ({
      id:            r.id,
      label:         r.label,
      category:      r.category,
      domain:        r.domain || '',
      pdfLink:       r.pdfLink || '',
      targetMAs:     r.targetMAs ? r.targetMAs.split('|').filter(Boolean) : [],
      beforeContext: ctxByTask[r.id]?.before || [],
      afterContext:  ctxByTask[r.id]?.after  || [],
    }));
  }

  console.log('[loader] Data loaded from Google Sheets.');
})();
