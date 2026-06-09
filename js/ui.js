// ============================================================
// UI — Sidebar, Detail Panel, About Tab, Controls
// ============================================================

// ---- Task Sidebar (Control Panel 1) ----------------------------

function buildTaskSidebar() {
  const taskList = document.getElementById('task-list');
  taskList.innerHTML = '';

  const categories = {};
  for (const task of TASKS) {
    if (!categories[task.category]) categories[task.category] = [];
    categories[task.category].push(task);
  }

  for (const [cat, tasks] of Object.entries(categories)) {
    const header = document.createElement('div');
    header.className = 'task-category';
    header.textContent = cat;
    taskList.appendChild(header);

    for (const task of tasks) {
      const item = document.createElement('div');
      item.className = 'task-item';
      item.dataset.taskId = task.id;
      item.innerHTML = `
        <span class="task-label">${task.label}</span>
        ${task.pdfLink ? `<button class="task-pdf-btn" data-task="${task.id}" title="Open task PDF">📄</button>` : ''}
      `;
      item.addEventListener('click', e => {
        if (e.target.classList.contains('task-pdf-btn')) return;
        selectTask(task.id);
      });
      const pdfBtn = item.querySelector('.task-pdf-btn');
      if (pdfBtn) {
        pdfBtn.addEventListener('click', e => {
          e.stopPropagation();
          openPDFModal(task.pdfLink, task.label);
        });
      }
      taskList.appendChild(item);
    }
  }
}

function selectTask(taskId) {
  if (activeTaskId === taskId) {
    activeTaskId = null;
    resetHighlighting();
    clearSelection();
    renderSelectionPanels();
    document.querySelectorAll('.task-item').forEach(el => el.classList.remove('selected'));
    updateContextPanelForTask(null);
    return;
  }

  document.querySelectorAll('.task-item').forEach(el => el.classList.remove('selected'));
  const taskEl = document.querySelector(`.task-item[data-task-id="${taskId}"]`);
  if (taskEl) taskEl.classList.add('selected');

  const task = TASKS.find(t => t.id === taskId);
  if (!task) return;

  applyTaskHighlighting(task);
  updateContextPanelForTask(task);
}

function updateContextPanelForTask(task) {
  const panel = document.getElementById('context-panel');
  if (!task) { panel.innerHTML = '<p class="hint">Select a task to see teacher context.</p>'; return; }

  const contexts = teachingStage === 'before' ? task.beforeContext : task.afterContext;
  if (!contexts || contexts.length === 0) {
    panel.innerHTML = `<p class="hint">No ${teachingStage === 'before' ? 'planning' : 'reflection'} context yet for this task.</p>`;
    return;
  }

  panel.innerHTML = contexts.map(ctx => `
    <div class="context-card ${teachingStage === 'before' ? 'ctx-green' : 'ctx-orange'}">
      <div class="ctx-type">${ctx.type}</div>
      <div class="ctx-ma">${ctx.maId}</div>
      <div class="ctx-content">${ctx.content}</div>
    </div>
  `).join('');
}

// ---- Multi-select Detail Panels --------------------------------

const TIER_ICONS_PANEL = { 1: '🟠', 2: '🔵', 3: '🟩', 4: '💠' };
const TIER_NAMES_PANEL = { 1: 'Domain', 2: 'Big Idea', 3: 'Mental Action', 4: 'Sample' };

function renderSelectionPanels() {
  const stack = document.getElementById('detail-stack');
  stack.innerHTML = '';

  if (selectedNodeIds.length === 0) return;

  selectedNodeIds.forEach(nodeId => {
    const node = cy.getElementById(nodeId);
    if (!node || !node.length) return;
    const data = node.data();
    const card = document.createElement('div');
    card.className = 'detail-card';
    card.dataset.nodeId = nodeId;
    card.innerHTML = buildDetailCardHTML(data);
    stack.appendChild(card);
  });

  // Wire close buttons
  stack.querySelectorAll('.card-close-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const nodeId = btn.closest('.detail-card').dataset.nodeId;
      toggleNodeSelection(nodeId);
      renderSelectionPanels();
    });
  });

  // Wire clickable XD links
  stack.querySelectorAll('.xd-link').forEach(btn => {
    btn.addEventListener('click', () => navigateToNode(btn.dataset.target));
  });

  // Wire related task tags
  stack.querySelectorAll('.related-task-tag').forEach(tag => {
    tag.addEventListener('click', () => selectTask(tag.dataset.taskId));
  });

  // Wire description edit buttons
  stack.querySelectorAll('.desc-edit-btn').forEach(btn => {
    btn.addEventListener('click', () => openDescEditor(btn.dataset.nodeId, btn));
  });
}

function buildDetailCardHTML(data) {
  const tier = data.tier;
  const color = DOMAIN_COLORS[data.domain] || '#888';

  // Related tasks (for MAs)
  let relatedTasksHtml = '';
  if (tier === 3) {
    const relatedTasks = TASKS.filter(t => t.targetMAs.includes(data.id));
    if (relatedTasks.length > 0) {
      relatedTasksHtml = `
        <div class="detail-section">
          <div class="detail-section-title">Related Tasks</div>
          <div class="tag-row">
            ${relatedTasks.map(t => `<button class="tag related-task-tag" data-task-id="${t.id}">${t.label}</button>`).join('')}
          </div>
        </div>`;
    }
  }

  // Teacher context if a task is active
  let contextHtml = '';
  if (activeTaskId && (tier === 3 || tier === 4)) {
    const task = TASKS.find(t => t.id === activeTaskId);
    if (task) {
      const maId = tier === 4 ? data.parent_node : data.id;
      const contexts = (teachingStage === 'before' ? task.beforeContext : task.afterContext)
        .filter(c => c.maId === maId);
      if (contexts.length > 0) {
        contextHtml = `<div class="detail-section">
          <div class="detail-section-title">${teachingStage === 'before' ? '📋 Planning Context' : '🔄 Reflection Context'}</div>
          ${contexts.map(c => `<div class="context-card ${teachingStage === 'before' ? 'ctx-green' : 'ctx-orange'}">
            <div class="ctx-type">${c.type}</div>
            <div class="ctx-content">${c.content}</div>
          </div>`).join('')}
        </div>`;
      }
    }
  }

  // Cross-domain connections — clickable
  const xdConns = CROSS_DOMAIN.filter(xd => xd.from === data.id || xd.to === data.id);
  let xdHtml = '';
  if (xdConns.length > 0) {
    const connItems = xdConns.map(xd => {
      const otherId  = xd.from === data.id ? xd.to : xd.from;
      const direction = xd.from === data.id ? '→' : '←';
      const otherNode = [...DOMAINS, ...BIG_IDEAS, ...MENTAL_ACTIONS].find(n => n.id === otherId);
      const otherLabel = otherNode ? (otherNode.label || '').replace(/\n/g, ' ') : otherId;
      return `<div class="xd-conn">
        ${direction}
        <button class="xd-link" data-target="${otherId}" title="Navigate to ${otherId}">
          <strong>${otherId}</strong> — ${otherLabel}
        </button>
        <div class="xd-desc">${xd.description}</div>
      </div>`;
    }).join('');
    xdHtml = `<div class="detail-section"><div class="detail-section-title">🌌 Cross-Domain Connections</div>${connItems}</div>`;
  }

  // Sample image — served from GitHub raw URL so new uploads appear without a Netlify redeploy
  const SAMPLES_BASE = 'https://raw.githubusercontent.com/zediiiii/secondary-math-galaxy/master/public/samples/';
  let mediaHtml = '';
  if (tier === 4 && data.mediaLink) {
    mediaHtml = `<div class="detail-section"><img class="sample-img" src="${SAMPLES_BASE}${data.mediaLink}" alt="Student work sample" /></div>`;
  }

  // Upload sample button — visible only in edit mode on MA nodes
  const uploadBtn = (tier === 3 && typeof editorActive !== 'undefined' && editorActive)
    ? `<div class="detail-section"><button class="upload-sample-btn" onclick="openUploadPanel('${data.id}')">📷 Add Sample Image</button></div>`
    : '';

  const descRendered = (typeof marked !== 'undefined' && data.description)
    ? marked.parse(data.description)
    : (data.description || '').replace(/\n/g, '<br>');

  const editDescBtn = (typeof editorActive !== 'undefined' && editorActive)
    ? `<button class="desc-edit-btn" data-node-id="${data.id}" title="Edit description">✏️ edit</button>`
    : '';

  return `
    <div class="detail-card-header">
      <span class="detail-icon">${TIER_ICONS_PANEL[tier] || '•'}</span>
      <span class="detail-tier-badge">${TIER_NAMES_PANEL[tier] || ''}</span>
      <span class="detail-domain-chip" style="background:${color}">${data.domain}</span>
      <button class="card-close-btn" title="Deselect">✕</button>
    </div>
    <div class="detail-id">${data.id}</div>
    <div class="detail-label">${(data.label || '').replace(/\n/g, ' ')}</div>
    <div class="detail-desc" data-node-id="${data.id}">${descRendered}</div>
    ${editDescBtn}
    ${mediaHtml}
    ${uploadBtn}
    ${relatedTasksHtml}
    ${contextHtml}
    ${xdHtml}
  `;
}

// ---- PDF Modal -------------------------------------------------

function openPDFModal(url, title) {
  if (!url) {
    alert('No PDF linked yet for this task. Paste the Google Drive share link into the Tasks data in js/data.js.');
    return;
  }
  document.getElementById('pdf-modal-title').textContent = title;
  document.getElementById('pdf-iframe').src = url;
  document.getElementById('pdf-modal').classList.add('open');
}

function closePDFModal() {
  document.getElementById('pdf-modal').classList.remove('open');
  document.getElementById('pdf-iframe').src = '';
}

// ---- About Tab -------------------------------------------------

function buildAboutTab() {
  const container = document.getElementById('about-content');
  container.innerHTML = `
    <h1>${ABOUT_CONTENT.title}</h1>
    <p class="about-subtitle">${ABOUT_CONTENT.subtitle}</p>
    ${ABOUT_CONTENT.sections.map(s => `
      <h2>${s.heading}</h2>
      <p>${s.body.replace(/\n/g, '<br>')}</p>
    `).join('')}
    <div class="legend">
      <h2>Legend</h2>
      <div class="legend-items">
        <div class="legend-item"><div class="legend-icon star"></div><span>Domain (Solar System)</span></div>
        <div class="legend-item"><div class="legend-icon circle"></div><span>Big Idea (Sun)</span></div>
        <div class="legend-item"><div class="legend-icon square"></div><span>Mental Action (Planet)</span></div>
        <div class="legend-item"><div class="legend-icon diamond"></div><span>Sample (Moon)</span></div>
      </div>
      <div class="domain-legend">
        ${Object.entries(DOMAIN_COLORS).map(([d, c]) => `<span class="domain-chip" style="background:${c}">${d}</span>`).join('')}
      </div>
    </div>
  `;
}

function showAboutTab() { document.getElementById('about-overlay').classList.add('open'); }
function hideAboutTab()  { document.getElementById('about-overlay').classList.remove('open'); }

// ---- Search with dropdown --------------------------------------

const TIER_ICONS = { 1: '🟠', 2: '🔵', 3: '🟩', 4: '💠' };
const TIER_NAMES = { 1: 'Domain', 2: 'Big Idea', 3: 'Mental Action', 4: 'Sample' };

function getExcerpt(text, query, maxLen = 72) {
  if (!text) return '';
  const lower = text.toLowerCase();
  const idx   = lower.indexOf(query.toLowerCase());
  if (idx === -1) return text.slice(0, maxLen) + (text.length > maxLen ? '…' : '');
  const start   = Math.max(0, idx - 20);
  const end     = Math.min(text.length, idx + query.length + 40);
  const excerpt = (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '');
  const re      = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return excerpt.replace(re, '<mark>$1</mark>');
}

function buildSearchResults(query) {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();
  const allNodes = [...DOMAINS, ...BIG_IDEAS, ...MENTAL_ACTIONS, ...SAMPLES];
  const results = [];
  for (const node of allNodes) {
    const labelMatch = (node.label || '').toLowerCase().includes(q);
    const idMatch    = node.id.toLowerCase().includes(q);
    const descMatch  = (node.description || '').toLowerCase().includes(q);
    if (labelMatch || idMatch || descMatch) {
      results.push({ node, excerpt: descMatch ? getExcerpt(node.description, query) : (node.description || '').slice(0, 72) });
    }
    if (results.length >= 12) break;
  }
  return results;
}

function showSearchDropdown(results) {
  const dd = document.getElementById('search-dropdown');
  if (!results.length) { hideSearchDropdown(); return; }

  dd.innerHTML = results.map(r => `
    <div class="search-result" data-node-id="${r.node.id}" tabindex="0">
      <div class="sr-header">
        <span class="sr-icon">${TIER_ICONS[r.node.tier] || '•'}</span>
        <span class="sr-label">${(r.node.label || r.node.id).replace(/\n/g, ' ')}</span>
        <span class="sr-tier">${TIER_NAMES[r.node.tier] || ''}</span>
        <span class="sr-id">${r.node.id}</span>
      </div>
      ${r.excerpt ? `<div class="sr-excerpt">${r.excerpt}</div>` : ''}
    </div>
  `).join('');

  dd.querySelectorAll('.search-result').forEach(el => {
    el.addEventListener('click', () => navigateToNode(el.dataset.nodeId));
    el.addEventListener('keydown', e => { if (e.key === 'Enter') navigateToNode(el.dataset.nodeId); });
  });

  dd.classList.add('open');
}

function hideSearchDropdown() {
  document.getElementById('search-dropdown').classList.remove('open');
}

function navigateToNode(nodeId) {
  hideSearchDropdown();
  document.getElementById('search-input').value = '';
  searchNodes('');
  const node = cy.getElementById(nodeId);
  if (!node || !node.length) return;
  clearSelection();
  addNodeSelection(nodeId);
  zoomToNodeCluster(node);
  setTimeout(() => renderSelectionPanels(), 420);
}

function initSearch() {
  const input = document.getElementById('search-input');
  let debounceTimer;

  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    const q = input.value.trim();
    if (q.length < 2) { hideSearchDropdown(); searchNodes(''); return; }
    debounceTimer = setTimeout(() => {
      showSearchDropdown(buildSearchResults(q));
      searchNodes(q);
    }, 200);
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'Escape') { input.value = ''; searchNodes(''); hideSearchDropdown(); }
    if (e.key === 'ArrowDown') {
      const first = document.querySelector('.search-result');
      if (first) { first.focus(); e.preventDefault(); }
    }
  });

  document.getElementById('search-dropdown').addEventListener('keydown', e => {
    const items = [...document.querySelectorAll('.search-result')];
    const idx   = items.indexOf(document.activeElement);
    if (e.key === 'ArrowDown' && idx < items.length - 1) { items[idx + 1].focus(); e.preventDefault(); }
    if (e.key === 'ArrowUp') { (idx > 0 ? items[idx - 1] : input).focus(); e.preventDefault(); }
    if (e.key === 'Escape')  { input.value = ''; searchNodes(''); hideSearchDropdown(); input.focus(); }
  });

  document.addEventListener('click', e => {
    if (!document.getElementById('search-wrapper').contains(e.target)) hideSearchDropdown();
  });
}

// ---- Teaching Stage Toggle ------------------------------------

function initTeachingStage() {
  document.querySelectorAll('.stage-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.stage-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      setTeachingStage(btn.dataset.stage);
      if (activeTaskId) {
        const task = TASKS.find(t => t.id === activeTaskId);
        if (task) updateContextPanelForTask(task);
      }
      // Refresh open detail cards with new context
      if (selectedNodeIds.length > 0) renderSelectionPanels();
    });
  });
}

// ---- Sidebar toggle (mobile) ----------------------------------

function initSidebarToggle() {
  const btn     = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('sidebar');
  if (btn) {
    btn.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      btn.textContent = sidebar.classList.contains('collapsed') ? '☰' : '✕';
    });
  }
}
