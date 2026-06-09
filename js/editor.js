// ============================================================
// Editor — password-gated in-context editing
//
// Features:
//   • 🔒 button in top bar → password prompt → edit mode
//   • "+ Add Task" in sidebar → task form with visual MA picker
//     (click MA squares on the galaxy to add them to the task)
//   • "📷 Upload Sample" in MA detail cards → image uploader
//
// Writes via Netlify functions:
//   /.netlify/functions/sheets-write
//   /.netlify/functions/upload-image
// ============================================================

const EDITOR_FN_SHEETS = '/.netlify/functions/sheets-write';
const EDITOR_FN_IMAGE  = '/.netlify/functions/upload-image';

let editorActive   = false;
let editorPassword = sessionStorage.getItem('galaxy_edit_pwd') || '';
let taskFormOpen   = false;
let taskFormMAs    = [];
let uploadNodeId   = null;
let pendingFile    = null;
let ctxRowCounter  = 0;

// ── Bootstrap ────────────────────────────────────────────────

function initEditor() {
  buildEditButton();
  buildPasswordModal();
  buildTaskFormPanel();
  buildUploadPanel();

  // If password was cached from a previous session tab, silently verify
  if (editorPassword) {
    verifyPassword(editorPassword).then(ok => {
      if (!ok) { editorPassword = ''; sessionStorage.removeItem('galaxy_edit_pwd'); }
    });
  }
}

// ── Top-bar lock/edit button ──────────────────────────────────

function buildEditButton() {
  const btn = document.createElement('button');
  btn.id        = 'edit-mode-btn';
  btn.title     = 'Enable Edit Mode';
  btn.textContent = '🔒';
  btn.addEventListener('click', onEditButtonClick);
  document.getElementById('top-bar').appendChild(btn);
}

async function onEditButtonClick() {
  if (editorActive) { deactivateEditMode(); return; }
  if (editorPassword) {
    const ok = await verifyPassword(editorPassword);
    if (ok) { activateEditMode(); return; }
    editorPassword = ''; sessionStorage.removeItem('galaxy_edit_pwd');
  }
  showPasswordModal();
}

// ── Activate / deactivate ─────────────────────────────────────

function activateEditMode() {
  editorActive = true;
  document.getElementById('edit-mode-btn').textContent = '✏️';
  document.getElementById('edit-mode-btn').title = 'Exit Edit Mode';
  document.body.classList.add('edit-mode');
  document.getElementById('add-task-btn').style.display = '';
}

function deactivateEditMode() {
  editorActive = false;
  document.getElementById('edit-mode-btn').textContent = '🔒';
  document.getElementById('edit-mode-btn').title = 'Enable Edit Mode';
  document.body.classList.remove('edit-mode');
  document.getElementById('add-task-btn').style.display = 'none';
  closeTaskForm();
  closeUploadPanel();
}

// ── Password modal ────────────────────────────────────────────

function buildPasswordModal() {
  const el = document.createElement('div');
  el.id = 'pwd-modal';
  el.innerHTML = `
    <div id="pwd-modal-box">
      <h2>✏️ Edit Mode</h2>
      <p>Enter the edit password to unlock in-app editing.</p>
      <input id="pwd-input" type="password" placeholder="Password…" autocomplete="current-password" />
      <div id="pwd-error" aria-live="polite"></div>
      <div class="pwd-btns">
        <button id="pwd-cancel-btn">Cancel</button>
        <button id="pwd-unlock-btn">Unlock</button>
      </div>
    </div>`;
  document.body.appendChild(el);

  document.getElementById('pwd-unlock-btn').addEventListener('click', submitPassword);
  document.getElementById('pwd-cancel-btn').addEventListener('click', hidePasswordModal);
  document.getElementById('pwd-input').addEventListener('keydown', e => {
    if (e.key === 'Enter')  submitPassword();
    if (e.key === 'Escape') hidePasswordModal();
  });
  el.addEventListener('click', e => { if (e.target === el) hidePasswordModal(); });
}

function showPasswordModal() {
  document.getElementById('pwd-modal').classList.add('open');
  document.getElementById('pwd-error').textContent = '';
  document.getElementById('pwd-input').value = '';
  setTimeout(() => document.getElementById('pwd-input').focus(), 60);
}

function hidePasswordModal() {
  document.getElementById('pwd-modal').classList.remove('open');
}

async function submitPassword() {
  const input = document.getElementById('pwd-input');
  const pwd   = input.value.trim();
  if (!pwd) return;

  const btn = document.getElementById('pwd-unlock-btn');
  btn.textContent = 'Checking…';
  btn.disabled    = true;

  const ok = await verifyPassword(pwd);

  btn.textContent = 'Unlock';
  btn.disabled    = false;

  if (ok) {
    editorPassword = pwd;
    sessionStorage.setItem('galaxy_edit_pwd', pwd);
    hidePasswordModal();
    activateEditMode();
  } else {
    document.getElementById('pwd-error').textContent = 'Incorrect password — try again.';
    input.value = '';
    input.focus();
  }
}

async function verifyPassword(pwd) {
  try {
    const res = await fetch(EDITOR_FN_SHEETS, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ password: pwd, op: 'ping' }),
    });
    return res.status !== 401;
  } catch {
    // Functions not available (e.g. local dev without Netlify CLI)
    return false;
  }
}

// ── Task Form ─────────────────────────────────────────────────

function buildTaskFormPanel() {
  // "Add Task" button in sidebar (hidden until edit mode)
  const addBtn = document.createElement('button');
  addBtn.id        = 'add-task-btn';
  addBtn.innerHTML = '＋ Add Task';
  addBtn.style.display = 'none';
  addBtn.addEventListener('click', openTaskForm);
  const tl = document.getElementById('task-list');
  tl.parentNode.insertBefore(addBtn, tl);

  // The form panel
  const panel = document.createElement('div');
  panel.id = 'task-form-panel';
  panel.innerHTML = `
    <div class="ef-header">
      <span>✏️ New Task</span>
      <button class="ef-close" title="Close">✕</button>
    </div>
    <div class="ef-body">

      <label class="ef-label">Task Name <span class="ef-req">*</span></label>
      <input id="tf-label" type="text" class="ef-input" placeholder="e.g. The Walking Rate" />

      <label class="ef-label">Category <span class="ef-req">*</span></label>
      <input id="tf-category" type="text" class="ef-input" placeholder="e.g. Linear"
             list="tf-categories-list" />
      <datalist id="tf-categories-list"></datalist>

      <label class="ef-label">PDF Link <span class="ef-opt">(optional)</span></label>
      <input id="tf-pdf" type="url" class="ef-input"
             placeholder="https://drive.google.com/file/d/…/preview" />

      <label class="ef-label">
        Target Mental Actions <span class="ef-req">*</span>
        <span class="ef-hint-inline">— click squares on the galaxy</span>
      </label>
      <div id="tf-ma-chips" class="ef-chip-row"></div>

      <div class="ef-section">📋 Planning Context <span class="ef-opt">(optional)</span></div>
      <div id="tf-before-rows"></div>
      <button class="ef-add-row-btn" id="tf-add-before">＋ Add planning note</button>

      <div class="ef-section">🔄 Reflecting Context <span class="ef-opt">(optional)</span></div>
      <div id="tf-after-rows"></div>
      <button class="ef-add-row-btn" id="tf-add-after">＋ Add reflection note</button>

      <div id="tf-status" class="ef-status" aria-live="polite"></div>
      <button id="tf-save-btn" class="ef-save-btn">💾 Save Task</button>
    </div>`;
  document.getElementById('cy-container').appendChild(panel);

  panel.querySelector('.ef-close').addEventListener('click', closeTaskForm);
  document.getElementById('tf-add-before').addEventListener('click', () => addContextRow('before'));
  document.getElementById('tf-add-after').addEventListener('click',  () => addContextRow('after'));
  document.getElementById('tf-save-btn').addEventListener('click',   saveTask);
}

function openTaskForm() {
  if (!editorActive) return;
  taskFormOpen = true;
  taskFormMAs  = [];
  ctxRowCounter = 0;
  document.getElementById('tf-label').value    = '';
  document.getElementById('tf-category').value = '';
  document.getElementById('tf-pdf').value      = '';
  document.getElementById('tf-before-rows').innerHTML = '';
  document.getElementById('tf-after-rows').innerHTML  = '';
  document.getElementById('tf-status').textContent    = '';
  document.getElementById('tf-status').className      = 'ef-status';

  // Populate category suggestions from existing tasks
  const dl = document.getElementById('tf-categories-list');
  dl.innerHTML = '';
  [...new Set(TASKS.map(t => t.category))].forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    dl.appendChild(opt);
  });

  renderMAChips();
  document.getElementById('task-form-panel').classList.add('open');
  document.getElementById('tf-label').focus();
}

function closeTaskForm() {
  taskFormOpen = false;
  document.getElementById('task-form-panel').classList.remove('open');
}

// Called from graph.js tap handler — returns true if the tap was consumed
function handleEditorNodeTap(node) {
  if (!taskFormOpen || node.data('tier') !== 3) return false;
  const id  = node.id();
  const idx = taskFormMAs.indexOf(id);
  if (idx === -1) taskFormMAs.push(id);
  else            taskFormMAs.splice(idx, 1);
  renderMAChips();
  // Highlight selected MAs visually
  cy.nodes('[tier=3]').forEach(n => {
    if (taskFormMAs.includes(n.id())) n.addClass('editor-selected');
    else                               n.removeClass('editor-selected');
  });
  return true;
}

function renderMAChips() {
  const container = document.getElementById('tf-ma-chips');
  if (!container) return;
  if (!taskFormMAs.length) {
    container.innerHTML = '<span class="ef-chip-empty">No MAs selected yet — click squares on the galaxy</span>';
    return;
  }
  container.innerHTML = taskFormMAs.map(id => `
    <span class="ef-chip">
      ${id}
      <button class="ef-chip-rm" data-id="${id}" title="Remove">×</button>
    </span>`).join('');
  container.querySelectorAll('.ef-chip-rm').forEach(btn =>
    btn.addEventListener('click', () => {
      taskFormMAs = taskFormMAs.filter(m => m !== btn.dataset.id);
      cy.getElementById(btn.dataset.id).removeClass('editor-selected');
      renderMAChips();
    })
  );
}

function addContextRow(stage) {
  const container = document.getElementById(`tf-${stage}-rows`);
  const idx = ctxRowCounter++;
  const div = document.createElement('div');
  div.className = 'ef-ctx-row';

  const maOptions = taskFormMAs.length
    ? taskFormMAs.map(id => `<option value="${id}">${id}</option>`).join('')
    : '<option value="">— select MAs first —</option>';

  div.innerHTML = `
    <div class="ef-ctx-row-top">
      <select class="ef-ctx-type">
        <option>Purposeful Question</option>
        <option>Anticipated Model</option>
        <option>Scaffolding</option>
        <option>Intervention</option>
        <option>Note</option>
      </select>
      <select class="ef-ctx-ma">${maOptions}</select>
      <button class="ef-ctx-rm" title="Remove row">✕</button>
    </div>
    <textarea class="ef-ctx-content" placeholder="Guidance text…" rows="2"></textarea>`;

  div.querySelector('.ef-ctx-rm').addEventListener('click', () => div.remove());
  container.appendChild(div);
  div.querySelector('.ef-ctx-content').focus();
}

async function saveTask() {
  const label    = document.getElementById('tf-label').value.trim();
  const category = document.getElementById('tf-category').value.trim();
  const pdf      = document.getElementById('tf-pdf').value.trim();

  if (!label)              return taskStatus('⚠️ Task name is required.', 'warn');
  if (!category)           return taskStatus('⚠️ Category is required.', 'warn');
  if (!taskFormMAs.length) return taskStatus('⚠️ Select at least one mental action.', 'warn');

  // Generate a unique ID from the label
  const slug = label.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 24);
  const id   = `Task_${slug}`;

  taskStatus('Saving…', 'info');
  document.getElementById('tf-save-btn').disabled = true;

  const taskRow = [id, label, category, '', pdf, taskFormMAs.join('|')];

  const ctxRows = [];
  ['before', 'after'].forEach(stage => {
    document.querySelectorAll(`#tf-${stage}-rows .ef-ctx-row`).forEach(row => {
      const content = row.querySelector('.ef-ctx-content').value.trim();
      const maId    = row.querySelector('.ef-ctx-ma').value;
      const type    = row.querySelector('.ef-ctx-type').value;
      if (content && maId) ctxRows.push([id, stage, maId, type, content]);
    });
  });

  // ── Optimistic update: add task to in-memory data immediately ──
  const newTask = {
    id, label, category, domain: '', pdfLink: pdf,
    targetMAs: [...taskFormMAs],
    beforeContext: ctxRows.filter(r => r[1]==='before').map(r => ({ maId:r[2], type:r[3], content:r[4] })),
    afterContext:  ctxRows.filter(r => r[1]==='after' ).map(r => ({ maId:r[2], type:r[3], content:r[4] })),
  };
  if (typeof TASKS !== 'undefined') TASKS.push(newTask);
  if (typeof buildTaskSidebar === 'function') buildTaskSidebar();
  if (typeof galaxyCache !== 'undefined') galaxyCache.save();
  taskStatus('✅ Added! Syncing to Sheet…', 'ok');

  // ── Background Sheets write ──────────────────────────────────
  apiPost({ op: 'append', tab: 'tasks', row: taskRow })
    .then(() => Promise.all(ctxRows.map(row => apiPost({ op: 'append', tab: 'teacher_context', row }))))
    .then(() => { taskStatus('✅ Saved & synced.', 'ok'); setTimeout(closeTaskForm, 2000); })
    .catch(err => taskStatus('⚠️ Added locally — Sheet sync failed: ' + err.message, 'warn'));

  cy.nodes('[tier=3]').removeClass('editor-selected');
  document.getElementById('tf-save-btn').disabled = false;
}

function taskStatus(msg, type) {
  const el = document.getElementById('tf-status');
  el.textContent = msg;
  el.className   = `ef-status ef-${type}`;
}

// ── Sample Upload Panel ───────────────────────────────────────

function buildUploadPanel() {
  const panel = document.createElement('div');
  panel.id = 'upload-panel';
  panel.innerHTML = `
    <div class="ef-header">
      <span>📷 Upload Sample Image</span>
      <button class="ef-close" title="Close">✕</button>
    </div>
    <div class="ef-body">
      <p class="ef-hint">Adding sample for: <strong id="uf-node-label">—</strong></p>

      <label class="ef-label">Description <span class="ef-req">*</span></label>
      <textarea id="uf-description" class="ef-input" rows="3"
        placeholder="What does this student work show? (e.g. 'Student uses ratio table to extend pattern')"></textarea>

      <label class="ef-label">Image <span class="ef-req">*</span></label>
      <div id="uf-dropzone" class="ef-dropzone" tabindex="0" role="button"
           aria-label="Upload image area">
        <div id="uf-drop-text">
          <span style="font-size:2rem">📎</span><br>
          Drag &amp; drop an image here,<br>or click to browse
        </div>
        <input id="uf-file-input" type="file" accept="image/*" style="display:none" />
      </div>
      <img id="uf-preview" alt="Preview" style="display:none" />
      <div id="uf-status" class="ef-status" aria-live="polite"></div>
      <button id="uf-save-btn" class="ef-save-btn" style="display:none">📤 Upload &amp; Save Sample</button>
    </div>`;
  document.getElementById('cy-container').appendChild(panel);

  panel.querySelector('.ef-close').addEventListener('click', closeUploadPanel);

  const dz   = document.getElementById('uf-dropzone');
  const fi   = document.getElementById('uf-file-input');
  dz.addEventListener('click',     () => fi.click());
  dz.addEventListener('keydown',   e => { if (e.key === 'Enter' || e.key === ' ') fi.click(); });
  dz.addEventListener('dragover',  e => { e.preventDefault(); dz.classList.add('drag-over'); });
  dz.addEventListener('dragleave', () => dz.classList.remove('drag-over'));
  dz.addEventListener('drop', e => {
    e.preventDefault();
    dz.classList.remove('drag-over');
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  });
  fi.addEventListener('change', () => { if (fi.files[0]) handleFile(fi.files[0]); });
  document.getElementById('uf-save-btn').addEventListener('click', saveImage);
}

// Called from ui.js detail cards
function openUploadPanel(nodeId) {
  if (!editorActive) return;
  uploadNodeId = nodeId;
  pendingFile  = null;
  document.getElementById('uf-node-label').textContent    = nodeId;
  document.getElementById('uf-description').value         = '';
  document.getElementById('uf-preview').style.display     = 'none';
  document.getElementById('uf-preview').src               = '';
  document.getElementById('uf-save-btn').style.display    = 'none';
  document.getElementById('uf-status').textContent        = '';
  document.getElementById('uf-status').className          = 'ef-status';
  document.getElementById('uf-file-input').value          = '';
  document.getElementById('uf-drop-text').innerHTML       =
    '<span style="font-size:2rem">📎</span><br>Drag &amp; drop an image here,<br>or click to browse';
  document.getElementById('upload-panel').classList.add('open');
}

function closeUploadPanel() {
  document.getElementById('upload-panel').classList.remove('open');
  uploadNodeId = null;
  pendingFile  = null;
}

function handleFile(file) {
  pendingFile = file;
  const reader = new FileReader();
  reader.onload = e => {
    const prev = document.getElementById('uf-preview');
    prev.src          = e.target.result;
    prev.style.display = 'block';
    document.getElementById('uf-drop-text').innerHTML =
      `<strong>${file.name}</strong><br><small>Click to choose a different file</small>`;
    document.getElementById('uf-save-btn').style.display = '';
  };
  reader.readAsDataURL(file);
}

async function saveImage() {
  if (!pendingFile || !uploadNodeId) return;

  const description = document.getElementById('uf-description').value.trim();
  if (!description) {
    document.getElementById('uf-status').textContent = '⚠️ Please add a description first.';
    document.getElementById('uf-status').className   = 'ef-status ef-warn';
    document.getElementById('uf-description').focus();
    return;
  }

  document.getElementById('uf-save-btn').disabled = true;
  document.getElementById('uf-status').textContent = 'Uploading image…';
  document.getElementById('uf-status').className   = 'ef-status ef-info';

  const reader = new FileReader();
  reader.onload = async e => {
    const dataUrl  = e.target.result;
    const base64   = dataUrl.split(',')[1];
    const ext      = (pendingFile.name.split('.').pop() || 'jpg').toLowerCase();
    const ts       = Date.now().toString(36).toUpperCase();
    const filename = `${uploadNodeId.replace(/\./g, '-').toLowerCase()}-${ts}.${ext}`;

    // Derive the MA's domain for the new sample row
    const ma     = (typeof MENTAL_ACTIONS !== 'undefined' ? MENTAL_ACTIONS : []).find(m => m.id === uploadNodeId);
    const domain = ma ? ma.domain : '';
    const sampleId = `${uploadNodeId}.S${ts}`;

    try {
      // 1 — upload image to GitHub
      const upRes = await fetch(EDITOR_FN_IMAGE, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ password: editorPassword, filename, base64 }),
      });
      if (!upRes.ok) throw new Error(`Upload failed (${upRes.status})`);

      // 2 — append new Sample node row to the nodes sheet
      // columns: id, tier, domain, parent, label, description, mediaLink
      await apiPost({
        op:  'append',
        tab: 'nodes',
        row: [sampleId, 4, domain, uploadNodeId, 'Sample', description, filename],
      });

      // 3 — add to in-memory data + graph immediately; save cache
      const newSample = { id: sampleId, tier: 4, domain, parent: uploadNodeId, label: 'Sample', description, mediaLink: filename };
      if (typeof SAMPLES !== 'undefined') SAMPLES.push(newSample);
      if (typeof cy !== 'undefined' && typeof LAYOUT !== 'undefined' && typeof DOMAIN_COLORS !== 'undefined') {
        const maPos  = LAYOUT.positions[uploadNodeId] || { x: 0, y: 0 };
        const angle  = Math.atan2(maPos.y, maPos.x);
        const r      = 820;
        const pos    = { x: r * Math.cos(angle), y: r * Math.sin(angle) };
        cy.add({
          group: 'nodes',
          data: { id: sampleId, label: '', tier: 4, domain, parent_node: uploadNodeId, description, mediaLink: filename },
          position: pos,
          style: { 'background-color': DOMAIN_COLORS[domain] || '#4fc3f7' },
        });
        cy.add({ group: 'edges', data: { id: `e_${sampleId}`, source: uploadNodeId, target: sampleId, type: 'hierarchy' } });
      }

      if (typeof galaxyCache !== 'undefined') galaxyCache.save();
      document.getElementById('uf-status').textContent = '✅ Sample saved! Syncing to Sheet…';
      document.getElementById('uf-status').className   = 'ef-status ef-ok';
      setTimeout(closeUploadPanel, 2500);
    } catch (err) {
      document.getElementById('uf-status').textContent = '❌ ' + err.message;
      document.getElementById('uf-status').className   = 'ef-status ef-error';
    } finally {
      document.getElementById('uf-save-btn').disabled = false;
    }
  };
  reader.readAsDataURL(pendingFile);
}

// ── Shared API helper ─────────────────────────────────────────

async function apiPost(payload) {
  const res = await fetch(EDITOR_FN_SHEETS, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ password: editorPassword, ...payload }),
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json();
}
