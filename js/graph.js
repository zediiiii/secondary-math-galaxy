// ============================================================
// Galaxy Graph — Cytoscape.js initialization & interaction
// ============================================================

let cy = null;
let activeTaskId = null;
let teachingStage = 'before'; // 'before' | 'after'

// Multi-select state: ordered list of selected node IDs
let selectedNodeIds = [];

// ---- Stylesheet ------------------------------------------------

const STYLESHEET = [
  {
    selector: 'node',
    style: {
      'background-color': '#888',
      'label': 'data(label)',
      'color': '#fff',
      'font-family': 'Inter, Arial, sans-serif',
      'text-wrap': 'wrap',
      'text-valign': 'center',
      'text-halign': 'center',
      'font-size': '9px',
      'overlay-padding': '4px',
      'transition-property': 'opacity, border-width, border-color',
      'transition-duration': '200ms',
    }
  },
  {
    selector: 'node[tier=1]',
    style: {
      'shape': 'star',
      'width': 88, 'height': 88,
      'font-size': '13px',
      'font-weight': 'bold',
      'text-max-width': '88px',
      'text-outline-color': '#000',
      'text-outline-width': 2,
      'border-width': 3,
      'border-color': '#ffffff88',
    }
  },
  {
    selector: 'node[tier=2]',
    style: {
      'shape': 'ellipse',
      'width': 50, 'height': 50,
      'font-size': '9px',
      'text-max-width': '48px',
      'text-outline-color': '#000',
      'text-outline-width': 1,
      'border-width': 2,
      'border-color': '#ffffff44',
    }
  },
  {
    selector: 'node[tier=3]',
    style: {
      'shape': 'rectangle',
      'width': 'data(maSize)', 'height': 'data(maSize)',
      'font-size': '7px',
      'text-max-width': '36px',
      'text-outline-color': '#000',
      'text-outline-width': 1,
      'border-width': 1,
      'border-color': '#ffffff33',
    }
  },
  {
    selector: 'node[tier=4]',
    style: {
      'shape': 'diamond',
      'width': 16, 'height': 16,
      'label': '',
      'background-color': '#4fc3f7',
      'border-width': 1,
      'border-color': '#b3e5fc',
      'opacity': 0.25,
    }
  },
  // Edges — more visible baseline
  {
    selector: 'edge',
    style: {
      'width': 1.2,
      'line-color': '#ffffff44',
      'curve-style': 'bezier',
      'opacity': 0.6,
      'transition-property': 'opacity, width, line-color',
      'transition-duration': '200ms',
    }
  },
  {
    selector: 'edge[type="hierarchy"]',
    style: { 'line-style': 'solid', 'line-color': '#ffffff33', 'opacity': 0.45 }
  },
  {
    selector: 'edge[type="progression"]',
    style: {
      'curve-style': 'bezier',
      'control-point-distance': 'data(cpd)',
      'line-style': 'solid',
      'target-arrow-shape': 'triangle',
      'target-arrow-color': '#ffffff88',
      'arrow-scale': 1.2,
      'width': 2,
      'line-color': '#ffffff66',
      'opacity': 0.75,
    }
  },
  {
    selector: 'edge[type="conceptual-bridge"]',
    style: {
      'line-style': 'dashed',
      'line-dash-pattern': [7, 4],
      'line-color': '#ffcc0099',
      'target-arrow-shape': 'triangle',
      'target-arrow-color': '#ffcc0099',
      'arrow-scale': 1,
      'width': 1.8,
      'opacity': 0.65,
    }
  },
  // Highlighting classes
  { selector: '.active-bright', style: { 'opacity': 1, 'border-width': 4, 'border-color': '#ffffff', 'z-index': 10 } },
  { selector: '.active-dim',    style: { 'opacity': 0.55 } },
  { selector: '.inactive',      style: { 'opacity': 0.07 } },
  { selector: '.sample-active', style: { 'opacity': 1, 'width': 22, 'height': 22, 'border-width': 2, 'border-color': '#fff' } },
  { selector: 'edge.edge-bright', style: { 'width': 3, 'line-color': '#ffffffbb', 'opacity': 1 } },
  { selector: 'edge.edge-dim',    style: { 'opacity': 0.18 } },
  { selector: 'edge.inactive',    style: { 'opacity': 0.03 } },
  { selector: '.search-highlight', style: { 'border-width': 4, 'border-color': '#ffeb3b', 'opacity': 1, 'z-index': 20 } },
  { selector: '.editor-selected', style: { 'border-color': '#7c6fff', 'border-width': 4, 'opacity': 1, 'z-index': 20 } },
  { selector: '.ctx-before', style: { 'border-color': '#66bb6a', 'border-width': 4 } },
  { selector: '.ctx-after',  style: { 'border-color': '#ffa726', 'border-width': 4 } },
  // Multi-select ring
  { selector: '.selected-node', style: { 'border-color': '#ffffff', 'border-width': 4, 'z-index': 15 } },
];

// ---- Build elements --------------------------------------------

// Returns signed control-point-distance so a bezier bows AWAY from galaxy center.
// Uses the cross product of (target-source) × (center-source): if center is to the
// right of the directed edge, left side = outward → positive CPD; else negative.
function outwardCPD(src, tgt, magnitude = 32) {
  const dx = tgt.x - src.x, dy = tgt.y - src.y;
  const cx = -src.x,        cy = -src.y; // vector src → center (0,0)
  const cross = dx * cy - dy * cx;       // z of (edge) × (to-center)
  return cross < 0 ? magnitude : -magnitude;
}

function buildElements() {
  const elements = [];
  const allNodes = [...DOMAINS, ...BIG_IDEAS, ...MENTAL_ACTIONS, ...SAMPLES];
  for (const node of allNodes) {
    const pos = LAYOUT.positions[node.id] || { x: 0, y: 0 };
    elements.push({
      group: 'nodes',
      data: {
        id: node.id,
        label: node.label || node.id,
        tier: node.tier,
        domain: node.domain,
        parent_node: node.parent,
        description: node.description || '',
        mediaLink: node.mediaLink || '',
        maSize: LAYOUT.sizes[node.id] || 38,
      },
      position: pos,
      style: { 'background-color': DOMAIN_COLORS[node.domain] || '#888' },
    });
  }

  let edgeIdx = 0;
  for (const conn of CONNECTIONS) {
    const edata = { id: `e_${edgeIdx++}`, source: conn.from, target: conn.to, type: conn.type, weight: conn.weight || 5 };
    if (conn.type === 'progression') {
      const sp = LAYOUT.positions[conn.from], tp = LAYOUT.positions[conn.to];
      if (sp && tp) edata.cpd = outwardCPD(sp, tp);
    }
    elements.push({ group: 'edges', data: edata });
  }
  for (const xd of CROSS_DOMAIN) {
    elements.push({
      group: 'edges',
      data: { id: xd.id, source: xd.from, target: xd.to, type: xd.type, strength: xd.strength, description: xd.description }
    });
  }
  return elements;
}

// ---- Init ------------------------------------------------------

function initGraph() {
  cy = cytoscape({
    container: document.getElementById('cy'),
    elements: buildElements(),
    style: STYLESHEET,
    layout: { name: 'preset' },
    minZoom: 0.12,
    maxZoom: 5,
    wheelSensitivity: 0.3,
    pixelRatio: 'auto',
  });

  cy.fit(cy.nodes('[tier <= 2]'), 60);
  updateZoomStyling();
  cy.on('zoom', updateZoomStyling);

  // Tap node — editor intercepts first when task form is open
  cy.on('tap', 'node', e => {
    const node = e.target;

    if (typeof handleEditorNodeTap === 'function' && handleEditorNodeTap(node)) return;

    const shiftHeld = e.originalEvent && e.originalEvent.shiftKey;
    if (shiftHeld) {
      toggleNodeSelection(node.id());
    } else {
      clearSelection();
      addNodeSelection(node.id());
      zoomToNodeCluster(node);
    }
    renderSelectionPanels();
  });

  // Tap background — clear everything
  cy.on('tap', e => {
    if (e.target === cy) {
      resetHighlighting();
      clearSelection();
      renderSelectionPanels();
    }
  });
}

// ---- Zoom-responsive text --------------------------------------

function updateZoomStyling() {
  const z = cy.zoom();
  // Tier 1: constant ~14px on screen. font_graph = 14/z, clamped [14, 60].
  cy.nodes('[tier=1]').style('font-size', Math.min(60, Math.max(14, 14 / z)) + 'px');

  if (z >= 0.38) {
    const s = Math.min(40, Math.max(10, 11 / z));
    cy.nodes('[tier=2]').forEach(n => n.style({ label: n.data('label'), 'font-size': s + 'px' }));
  } else {
    cy.nodes('[tier=2]').style('label', '');
  }

  if (z >= 0.72) {
    const s = Math.min(18, Math.max(8, 9 / z));
    cy.nodes('[tier=3]').forEach(n => n.style({ label: n.data('label'), 'font-size': s + 'px' }));
  } else {
    cy.nodes('[tier=3]').style('label', '');
  }

  cy.nodes('[tier=4]').style('label', '');
}

// ---- Click-to-zoom ---------------------------------------------

function zoomToNodeCluster(node) {
  const tier = node.data('tier');
  const id   = node.id();
  let eles;

  if (tier === 1) {
    // Zoom to whole solar system: all nodes sharing this domain
    eles = cy.nodes().filter(n => n.data('domain') === id && n.data('tier') <= 3);
  } else if (tier === 2) {
    // Zoom to BI + its MAs + their samples
    eles = cy.nodes().filter(n => n.id() === id || n.data('parent_node') === id ||
      MENTAL_ACTIONS.some(ma => ma.parent === id && ma.id === n.data('parent_node')));
  } else if (tier === 3) {
    eles = cy.nodes().filter(n => n.id() === id || n.data('parent_node') === id);
  } else {
    eles = node;
  }

  cy.animate({ fit: { eles, padding: 70 } }, { duration: 380 });
}

// ---- Selection / multi-select ----------------------------------

function addNodeSelection(nodeId) {
  if (!selectedNodeIds.includes(nodeId)) selectedNodeIds.push(nodeId);
  cy.getElementById(nodeId).addClass('selected-node');
}

function toggleNodeSelection(nodeId) {
  const idx = selectedNodeIds.indexOf(nodeId);
  if (idx === -1) {
    addNodeSelection(nodeId);
  } else {
    selectedNodeIds.splice(idx, 1);
    cy.getElementById(nodeId).removeClass('selected-node');
  }
}

function clearSelection() {
  selectedNodeIds.forEach(id => cy.getElementById(id).removeClass('selected-node'));
  selectedNodeIds = [];
}

// ---- Highlighting ----------------------------------------------

function resetHighlighting() {
  activeTaskId = null;
  cy.elements().removeClass('active-bright active-dim inactive sample-active edge-bright edge-dim ctx-before ctx-after search-highlight');
  cy.nodes('[tier=4]').style({ opacity: 0.25, width: 16, height: 16 });
}

function applyTaskHighlighting(task) {
  resetHighlighting();
  activeTaskId = task.id;

  const targetMAIds  = new Set(task.targetMAs);
  const activeDomains = new Set();
  const activeBIs     = new Set();

  task.targetMAs.forEach(maId => {
    const ma = MENTAL_ACTIONS.find(m => m.id === maId);
    if (!ma) return;
    activeDomains.add(ma.domain);
    activeBIs.add(ma.parent);
  });

  const brightIds = new Set([...activeDomains, ...activeBIs, ...targetMAIds]);
  SAMPLES.forEach(s => { if (targetMAIds.has(s.parent)) brightIds.add(s.id); });

  cy.nodes().forEach(n => {
    if (brightIds.has(n.id())) {
      n.addClass('active-bright');
      if (n.data('tier') === 4) n.addClass('sample-active');
    } else {
      n.addClass('inactive');
    }
  });

  // Cross-domain related nodes — dim (not invisible)
  CROSS_DOMAIN.forEach(xd => {
    if (brightIds.has(xd.from) || brightIds.has(xd.to)) {
      const other = brightIds.has(xd.from) ? xd.to : xd.from;
      const otherNode = cy.getElementById(other);
      if (otherNode.hasClass('inactive')) otherNode.removeClass('inactive').addClass('active-dim');
    }
  });

  cy.edges().forEach(e => {
    const s = e.data('source'), t = e.data('target');
    if (brightIds.has(s) && brightIds.has(t))      e.addClass('edge-bright');
    else if (brightIds.has(s) || brightIds.has(t)) e.addClass('edge-dim');
    else                                            e.addClass('inactive');
  });

  applyContextOverlays(task);
}

function applyContextOverlays(task) {
  const contexts = teachingStage === 'before' ? task.beforeContext : task.afterContext;
  const cls = teachingStage === 'before' ? 'ctx-before' : 'ctx-after';
  cy.nodes().removeClass('ctx-before ctx-after');
  (contexts || []).forEach(ctx => cy.getElementById(ctx.maId).addClass(cls));
}

// ---- Search highlight ------------------------------------------

function searchNodes(query) {
  cy.nodes().removeClass('search-highlight');
  if (!query) return;
  const q = query.toLowerCase();
  cy.nodes().forEach(n => {
    if ((n.data('label') || '').toLowerCase().includes(q) ||
        (n.data('description') || '').toLowerCase().includes(q) ||
        n.id().toLowerCase().includes(q)) {
      n.addClass('search-highlight');
    }
  });
}

// ---- Teaching stage --------------------------------------------

function setTeachingStage(stage) {
  teachingStage = stage;
  if (activeTaskId) {
    const task = TASKS.find(t => t.id === activeTaskId);
    if (task) applyContextOverlays(task);
  }
}

// ---- Navigation controls ---------------------------------------

function zoomHome() {
  cy.animate({ fit: { eles: cy.nodes('[tier <= 2]'), padding: 60 } }, { duration: 380 });
}

function zoomIn()  { cy.animate({ zoom: { level: cy.zoom() * 1.4, renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 } } }, { duration: 200 }); }
function zoomOut() { cy.animate({ zoom: { level: cy.zoom() / 1.4, renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 } } }, { duration: 200 }); }
