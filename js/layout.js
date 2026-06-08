// ============================================================
// Galaxy Layout — fixed-radius-per-tier, proportional BI sectors
//
// Each domain owns 60°. Big Ideas get sectors proportional to
// their MA count (more MAs → more angular room → same arc/MA
// across all BIs in a domain). MA nodes are sized to fill their
// arc with a minimum gap. Samples subdivide their MA's sector.
//
// Exports LAYOUT = { positions, sizes }
//   positions[nodeId] = { x, y }
//   sizes[nodeId]     = pixel size (MA nodes only)
// ============================================================

const LAYOUT = (() => {
  const R1 = 340;   // Domain stars
  const R2 = 490;   // Big Ideas
  const R3 = 720;   // Mental Actions
  const R4 = 820;   // Samples

  const MA_MAX_SIZE = 38;  // cap (px)
  const MA_MIN_SIZE = 12;  // floor (px)
  const MA_MIN_GAP  =  7;  // minimum gap between MA node edges (px)

  const SECTOR_DEG = 60;   // 360° / 6 domains

  const DOMAIN_ANGLES = {
    HF: -90,   // top
    HG: -30,   // top-right
    HS:  30,   // bottom-right
    ME:  90,   // bottom
    MG: 150,   // bottom-left
    MR: 210,   // top-left
  };

  function polar(r, deg) {
    const rad = deg * Math.PI / 180;
    return { x: r * Math.cos(rad), y: r * Math.sin(rad) };
  }

  // Distribute `count` items evenly in [start, start + size].
  // Returns array of center angles.
  function distribute(start, size, count) {
    if (count === 0) return [];
    const step = size / count;
    return Array.from({ length: count }, (_, i) => start + step / 2 + i * step);
  }

  const positions  = {};
  const sectorInfo = {}; // nodeId → { start, size } angles in degrees
  const sizes      = {}; // nodeId → pixel size  (MA nodes only)

  // ── Tier 1: Domains ──────────────────────────────────────────────
  for (const [id, angle] of Object.entries(DOMAIN_ANGLES)) {
    const start = angle - SECTOR_DEG / 2;
    positions[id]  = polar(R1, angle);
    sectorInfo[id] = { start, size: SECTOR_DEG };
  }

  // Pre-compute MA count per BI for proportional sector allocation
  const biMACount = {};
  for (const ma of MENTAL_ACTIONS)
    biMACount[ma.parent] = (biMACount[ma.parent] || 0) + 1;

  // ── Tier 2: Big Ideas — sectors proportional to MA count ─────────
  const bisByDomain = {};
  for (const bi of BIG_IDEAS)
    (bisByDomain[bi.domain] = bisByDomain[bi.domain] || []).push(bi);

  for (const [domId, bis] of Object.entries(bisByDomain)) {
    const { start, size } = sectorInfo[domId];

    // Weight each BI by its MA count (floor 1 to handle 0-MA BIs)
    const maCounts = bis.map(bi => Math.max(1, biMACount[bi.id] || 1));
    const totalMAs = maCounts.reduce((a, b) => a + b, 0);

    let cursor = start;
    bis.forEach((bi, i) => {
      const biSize   = (maCounts[i] / totalMAs) * size;
      const biCenter = cursor + biSize / 2;
      positions[bi.id]  = polar(R2, biCenter);
      sectorInfo[bi.id] = { start: cursor, size: biSize };
      cursor += biSize;
    });
  }

  // ── Tier 3: Mental Actions — evenly spaced within BI's sector ────
  const masByBI = {};
  for (const ma of MENTAL_ACTIONS)
    (masByBI[ma.parent] = masByBI[ma.parent] || []).push(ma);

  for (const [biId, mas] of Object.entries(masByBI)) {
    const { start, size } = sectorInfo[biId];
    const count  = mas.length;
    const angles = distribute(start, size, count);
    const maStep = count > 0 ? size / count : size;

    // Responsive node size: arc spacing between centers minus minimum gap
    const arcPx  = maStep * (R3 * Math.PI / 180);
    const nodePx = Math.round(Math.min(MA_MAX_SIZE, Math.max(MA_MIN_SIZE, arcPx - MA_MIN_GAP)));

    mas.forEach((ma, i) => {
      positions[ma.id]  = polar(R3, angles[i]);
      sectorInfo[ma.id] = { start: start + i * maStep, size: maStep };
      sizes[ma.id]      = nodePx;
    });
  }

  // ── Tier 4: Samples ──────────────────────────────────────────────
  const samplesByMA = {};
  for (const s of SAMPLES)
    (samplesByMA[s.parent] = samplesByMA[s.parent] || []).push(s);

  for (const [maId, samps] of Object.entries(samplesByMA)) {
    const { start, size } = sectorInfo[maId];
    const angles = distribute(start, size, samps.length);
    samps.forEach((s, i) => { positions[s.id] = polar(R4, angles[i]); });
  }

  return { positions, sizes };
})();
