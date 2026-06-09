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

      if (btn.dataset.wrap) {
        const m      = btn.dataset.wrap;
        const insert = sel ? `${m}${sel}${m}` : `${m}text${m}`;
        ta.setRangeText(insert, s, end, 'end');
      } else if (btn.dataset.prefix) {
        ta.setRangeText(btn.dataset.prefix + (sel || 'item'), s, end, 'end');
      } else if (btn.dataset.link) {
        // Insert markdown link template and pre-select the URL placeholder
        // so the editor can immediately type or paste their URL — no prompt() needed
        const linkText = sel || 'link text';
        const template = `[${linkText}](url)`;
        ta.setRangeText(template, s, end, 'end');
        const urlStart = s + 1 + linkText.length + 2; // skip past [text](
        ta.setSelectionRange(urlStart, urlStart + 3);  // select 'url'
      }
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

// ---- Sample lightbox -------------------------------------------

function openSampleLightbox(sampleId) {
  const sample = (typeof SAMPLES !== 'undefined' ? SAMPLES : []).find(s => s.id === sampleId);
  if (!sample || !sample.mediaLink) return;

  const SAMPLES_BASE = 'https://raw.githubusercontent.com/zediiiii/secondary-math-galaxy/master/public/samples/';
  const imgSrc = sample.mediaLink.startsWith('data:') ? sample.mediaLink : `${SAMPLES_BASE}${sample.mediaLink}`;

  // Build or reuse overlay
  let overlay = document.getElementById('sample-lightbox');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'sample-lightbox';
    overlay.innerHTML = `
      <div id="sample-lightbox-inner">
        <button id="sample-lightbox-close" title="Close (Esc)">✕</button>
        <img id="sample-lightbox-img" alt="Student work sample" title="Click to download" />
        <p id="sample-lightbox-desc"></p>
        <p class="sample-lightbox-hint">Click image to download</p>
      </div>`;
    document.body.appendChild(overlay);

    document.getElementById('sample-lightbox-close').addEventListener('click', closeSampleLightbox);
    overlay.addEventListener('click', e => { if (e.target === overlay) closeSampleLightbox(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSampleLightbox(); });
  }

  const img  = document.getElementById('sample-lightbox-img');
  const desc = document.getElementById('sample-lightbox-desc');
  img.src    = imgSrc;
  desc.textContent = sample.description || '';

  // Click image → download
  img.onclick = () => {
    const a = Object.assign(document.createElement('a'), {
      href:     imgSrc,
      download: sample.mediaLink.startsWith('data:')
        ? `sample-${sampleId}.jpg`
        : sample.mediaLink.split('/').pop(),
    });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeSampleLightbox() {
  const overlay = document.getElementById('sample-lightbox');
  if (overlay) overlay.classList.remove('open');
  document.body.style.overflow = '';
}

// ---- App init --------------------------------------------------

// ---- Export button (edit mode) ---------------------------------

function initExportBtn() {
  const btn = document.createElement('button');
  btn.id        = 'export-data-btn';
  btn.title     = 'Download all current data as a JSON file';
  btn.textContent = '📥 Export';
  btn.style.display = 'none';
  btn.addEventListener('click', () => {
    if (typeof galaxyCache !== 'undefined') galaxyCache.exportData();
  });
  document.getElementById('top-bar').appendChild(btn);
}

// Export button show/hide is now handled directly in
// activateEditMode() / deactivateEditMode() in editor.js.
function patchEditModeButtons() { /* no-op — kept for safety */ }

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
  Promise.resolve(window.dataReady).then(() => {
    initApp();
    // Dismiss the loading overlay now that data and graph are ready
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.classList.add('fade-out');
      setTimeout(() => overlay.remove(), 450);
    }
  });
});
