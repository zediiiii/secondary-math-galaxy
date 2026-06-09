// ============================================================
// App entry point — waits for dataReady (Sheets loader or
// instant resolve when using hardcoded seed data).
// ============================================================

// ---- Card size toggle ------------------------------------------

const CARD_SIZES  = [null, 'card-md', 'card-lg', 'card-xl'];
const CARD_LABELS = ['S', 'M', 'L', 'XL'];

function initCardSize() {
  const saved = localStorage.getItem('galaxy_card_size') || '';
  applyCardSize(saved);
  document.getElementById('card-size-btn').addEventListener('click', () => {
    const cur = CARD_SIZES.findIndex(s => s && document.body.classList.contains(s));
    const nextIdx = cur === -1 ? 1 : (cur + 1) % CARD_SIZES.length;
    const nextCls = CARD_SIZES[nextIdx] || '';
    applyCardSize(nextCls);
    localStorage.setItem('galaxy_card_size', nextCls);
  });
}

function applyCardSize(cls) {
  CARD_SIZES.forEach(s => { if (s) document.body.classList.remove(s); });
  if (cls) document.body.classList.add(cls);
  const idx = Math.max(0, CARD_SIZES.indexOf(cls || null));
  const btn = document.getElementById('card-size-btn');
  if (btn) btn.textContent = 'A' + CARD_LABELS[idx];
}

// ---- Description inline editor ---------------------------------

function openDescEditor(nodeId, triggerBtn) {
  const card   = triggerBtn.closest('.detail-card');
  const descEl = card.querySelector('.detail-desc');
  if (!descEl) return;

  // Find current raw text from in-memory data
  const allNodes  = [...DOMAINS, ...BIG_IDEAS, ...MENTAL_ACTIONS, ...SAMPLES];
  const nodeData  = allNodes.find(n => n.id === nodeId);
  const currentText = nodeData ? (nodeData.description || '') : '';

  const wrap = document.createElement('div');
  wrap.className = 'desc-editor-wrap';
  wrap.innerHTML = `
    <div class="md-toolbar">
      <button class="md-tool" data-wrap="**"    title="Bold"><strong>B</strong></button>
      <button class="md-tool" data-wrap="_"     title="Italic"><em>I</em></button>
      <button class="md-tool" data-prefix="- "  title="Bullet point">• list</button>
      <button class="md-tool" data-link="1"     title="Insert link">🔗 link</button>
    </div>
    <textarea class="desc-textarea" spellcheck="true">${currentText.replace(/</g,'&lt;')}</textarea>
    <div class="desc-editor-actions">
      <button class="desc-cancel-btn">Cancel</button>
      <button class="desc-save-btn">💾 Save</button>
    </div>
    <div class="desc-save-status ef-status"></div>`;

  descEl.style.display    = 'none';
  triggerBtn.style.display = 'none';
  descEl.parentNode.insertBefore(wrap, descEl.nextSibling);

  const ta = wrap.querySelector('.desc-textarea');

  // Markdown toolbar
  wrap.querySelectorAll('.md-tool').forEach(btn => {
    btn.addEventListener('mousedown', e => {
      e.preventDefault(); // keep focus on textarea
      const s = ta.selectionStart, end = ta.selectionEnd;
      const sel = ta.value.slice(s, end);
      let insert = '';
      if (btn.dataset.wrap) {
        const m = btn.dataset.wrap;
        insert = sel ? `${m}${sel}${m}` : `${m}text${m}`;
      } else if (btn.dataset.prefix) {
        insert = btn.dataset.prefix + (sel || 'item');
      } else if (btn.dataset.link) {
        const url = prompt('Paste URL:') || 'https://';
        insert = `[${sel || 'link text'}](${url})`;
      }
      ta.setRangeText(insert, s, end, 'end');
      ta.focus();
    });
  });

  // Cancel
  wrap.querySelector('.desc-cancel-btn').addEventListener('click', () => {
    wrap.remove();
    descEl.style.display    = '';
    triggerBtn.style.display = '';
  });

  // Save
  const saveBtn  = wrap.querySelector('.desc-save-btn');
  const statusEl = wrap.querySelector('.desc-save-status');

  saveBtn.addEventListener('click', async () => {
    const newText = ta.value.trim();
    saveBtn.disabled       = true;
    statusEl.textContent   = 'Saving…';
    statusEl.className     = 'desc-save-status ef-status ef-info';
    try {
      await apiPost({ op: 'updateCell', nodeId, col: 'description', value: newText });
      // Update in-memory so the re-render picks it up
      if (nodeData) nodeData.description = newText;
      wrap.remove();
      const rendered = (typeof marked !== 'undefined' && newText)
        ? marked.parse(newText)
        : newText.replace(/\n/g, '<br>');
      descEl.innerHTML     = rendered;
      descEl.style.display = '';
      triggerBtn.style.display = '';
    } catch (err) {
      statusEl.textContent = '❌ ' + err.message;
      statusEl.className   = 'desc-save-status ef-status ef-error';
      saveBtn.disabled     = false;
    }
  });

  ta.focus();
  ta.setSelectionRange(ta.value.length, ta.value.length);
}

// ---- App init --------------------------------------------------

// ---- Export button (edit mode) ---------------------------------

function initExportBtn() {
  const btn = document.createElement('button');
  btn.id        = 'export-data-btn';
  btn.title     = 'Download all current data as CSV files';
  btn.textContent = '📥 Export';
  btn.style.display = 'none';
  btn.addEventListener('click', () => {
    if (typeof galaxyCache !== 'undefined') galaxyCache.exportCSVs();
  });
  document.getElementById('top-bar').appendChild(btn);
}

// Show/hide export button with edit mode
const _origActivate   = typeof activateEditMode   !== 'undefined' ? activateEditMode   : null;
const _origDeactivate = typeof deactivateEditMode !== 'undefined' ? deactivateEditMode : null;

function patchEditModeButtons() {
  // Patch happens after editor.js defines activate/deactivate
  const exportBtn = document.getElementById('export-data-btn');
  const origBtn   = document.getElementById('edit-mode-btn');
  if (!exportBtn || !origBtn) return;

  origBtn.addEventListener('click', () => {
    // Delay to read class after editor.js toggles it
    setTimeout(() => {
      exportBtn.style.display = document.body.classList.contains('edit-mode') ? '' : 'none';
    }, 50);
  });
}

function initApp() {
  buildAboutTab();
  buildTaskSidebar();
  initGraph();
  initSearch();
  initTeachingStage();
  initSidebarToggle();
  initEditor();
  initCardSize();
  initExportBtn();
  patchEditModeButtons();

  document.getElementById('about-btn').addEventListener('click', showAboutTab);
  document.getElementById('about-close').addEventListener('click', hideAboutTab);
  document.getElementById('pdf-modal-close').addEventListener('click', closePDFModal);
  document.getElementById('pdf-modal').addEventListener('click', e => {
    if (e.target === document.getElementById('pdf-modal')) closePDFModal();
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
}

document.addEventListener('DOMContentLoaded', () => {
  Promise.resolve(window.dataReady).then(initApp);
});
