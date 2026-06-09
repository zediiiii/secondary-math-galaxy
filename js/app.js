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

  saveBtn.addEventListener('click', () => {
    const newText = ta.value.trim();
    // Update in-memory immediately
    if (nodeData) nodeData.description = newText;
    // Queue the Sheet write — committed via the commit bar
    if (typeof queueOp === 'function') {
      queueOp({ op: 'updateCell', nodeId, col: 'description', value: newText });
    }
    if (typeof galaxyCache !== 'undefined') galaxyCache.save();
    wrap.remove();
    const rendered = (typeof marked !== 'undefined' && newText)
      ? marked.parse(newText)
      : newText.replace(/\n/g, '<br>');
    descEl.innerHTML     = rendered;
    descEl.style.display = '';
    triggerBtn.style.display = '';
  });

  ta.focus();
  ta.setSelectionRange(ta.value.length, ta.value.length);
}

// ---- Sample gallery --------------------------------------------
// openSampleGallery(maId, startSampleId?)
//   maId          — the parent MA node whose samples to show
//   startSampleId — optional; which sample to show first (defaults to first)

const GALLERY_SAMPLES_BASE = 'https://raw.githubusercontent.com/zediiiii/secondary-math-galaxy/master/public/samples/';
let _gallerySamples = [];   // current gallery's sample list
let _galleryIdx     = 0;    // index into _gallerySamples

function openSampleGallery(maId, startSampleId) {
  _gallerySamples = (typeof SAMPLES !== 'undefined' ? SAMPLES : []).filter(s => s.parent === maId);
  if (!_gallerySamples.length) return;

  _galleryIdx = startSampleId
    ? Math.max(0, _gallerySamples.findIndex(s => s.id === startSampleId))
    : 0;

  _buildGalleryOverlay();
  _renderGallerySlide();

  const overlay = document.getElementById('sample-gallery');
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function _buildGalleryOverlay() {
  if (document.getElementById('sample-gallery')) return;

  const el = document.createElement('div');
  el.id = 'sample-gallery';
  el.innerHTML = `
    <div id="sg-inner">
      <div id="sg-header">
        <span id="sg-counter"></span>
        <span id="sg-ma-label"></span>
        <button id="sg-close" title="Close (Esc)">✕</button>
      </div>
      <div id="sg-stage">
        <button id="sg-prev" class="sg-nav" title="Previous">‹</button>
        <div id="sg-img-wrap">
          <img id="sg-img" alt="Student work sample" title="Click to download" />
          <div id="sg-no-img">💠 No image uploaded for this sample</div>
        </div>
        <button id="sg-next" class="sg-nav" title="Next">›</button>
      </div>
      <div id="sg-desc"></div>
      <div id="sg-edit-bar" style="display:none">
        <button id="sg-delete-btn" class="sg-edit-btn sg-delete">🗑️ Remove this sample</button>
        <button id="sg-add-btn"    class="sg-edit-btn sg-add">＋ Add another sample</button>
      </div>
      <div id="sg-hint">Click image to download • Use ← → keys to navigate</div>
    </div>`;
  document.body.appendChild(el);

  document.getElementById('sg-close').addEventListener('click', closeSampleGallery);
  el.addEventListener('click', e => { if (e.target === el) closeSampleGallery(); });

  document.getElementById('sg-prev').addEventListener('click', () => _galleryNav(-1));
  document.getElementById('sg-next').addEventListener('click', () => _galleryNav(+1));

  document.addEventListener('keydown', _galleryKeyHandler);
}

function _galleryKeyHandler(e) {
  const overlay = document.getElementById('sample-gallery');
  if (!overlay?.classList.contains('open')) return;
  if (e.key === 'Escape')     closeSampleGallery();
  if (e.key === 'ArrowLeft')  _galleryNav(-1);
  if (e.key === 'ArrowRight') _galleryNav(+1);
}

function _galleryNav(dir) {
  const len = _gallerySamples.length;
  _galleryIdx = (_galleryIdx + dir + len) % len;
  _renderGallerySlide();
}

function _renderGallerySlide() {
  const sample  = _gallerySamples[_galleryIdx];
  if (!sample) return;

  const imgEl   = document.getElementById('sg-img');
  const noImgEl = document.getElementById('sg-no-img');
  const descEl  = document.getElementById('sg-desc');
  const counter = document.getElementById('sg-counter');
  const maLabel = document.getElementById('sg-ma-label');
  const editBar = document.getElementById('sg-edit-bar');
  const prevBtn = document.getElementById('sg-prev');
  const nextBtn = document.getElementById('sg-next');

  const total   = _gallerySamples.length;
  counter.textContent = `${_galleryIdx + 1} of ${total}`;

  // MA label
  const ma = (typeof MENTAL_ACTIONS !== 'undefined' ? MENTAL_ACTIONS : []).find(m => m.id === sample.parent);
  maLabel.textContent = ma ? (ma.label || ma.id).replace(/\n/g, ' ') : (sample.parent || '');

  // Show/hide nav arrows
  prevBtn.style.visibility = total > 1 ? '' : 'hidden';
  nextBtn.style.visibility = total > 1 ? '' : 'hidden';

  // Image
  if (sample.mediaLink) {
    const src = sample.mediaLink.startsWith('data:') ? sample.mediaLink : `${GALLERY_SAMPLES_BASE}${sample.mediaLink}`;
    imgEl.src           = src;
    imgEl.style.display = '';
    noImgEl.style.display = 'none';
    imgEl.onclick = () => _downloadGallerySample(sample, src);
  } else {
    imgEl.src           = '';
    imgEl.style.display = 'none';
    noImgEl.style.display = '';
  }

  // Description
  descEl.innerHTML = sample.description
    ? ((typeof marked !== 'undefined') ? marked.parse(sample.description) : sample.description.replace(/\n/g,'<br>'))
    : '<em style="color:var(--text-dim)">No description.</em>';

  // Edit controls
  const isEdit = typeof editorActive !== 'undefined' && editorActive;
  editBar.style.display = isEdit ? '' : 'none';
  if (isEdit) {
    document.getElementById('sg-delete-btn').onclick = () => {
      closeSampleGallery();
      if (typeof deleteSample === 'function') deleteSample(sample.id);
    };
    document.getElementById('sg-add-btn').onclick = () => {
      closeSampleGallery();
      if (typeof openUploadPanel === 'function') openUploadPanel(sample.parent);
    };
  }
}

function _downloadGallerySample(sample, src) {
  const a = Object.assign(document.createElement('a'), {
    href:     src,
    download: sample.mediaLink?.startsWith('data:')
      ? `sample-${sample.id}.jpg`
      : (sample.mediaLink || sample.id),
  });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function closeSampleGallery() {
  const overlay = document.getElementById('sample-gallery');
  if (overlay) overlay.classList.remove('open');
  document.body.style.overflow = '';
}

// Legacy alias so any old onclick="openSampleLightbox(...)" still works
function openSampleLightbox(sampleId) {
  const s = (typeof SAMPLES !== 'undefined' ? SAMPLES : []).find(x => x.id === sampleId);
  if (s) openSampleGallery(s.parent || s.parent_node, sampleId);
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
