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
let editingTaskId  = null;   // null = new task; string = editing existing task
let uploadNodeId   = null;
let pendingFile    = null;
let ctxRowCounter  = 0;

// ── Pending-ops queue ─────────────────────────────────────────
// All Sheet writes are queued here and executed together on commit.
let pendingOps = [];

function queueOp(op) {
  // updateCell: deduplicate same nodeId+col so re-edits don't double-write
  if (op.op === 'updateCell') {
    const idx = pendingOps.findIndex(p => p.op === 'updateCell' && p.nodeId === op.nodeId && p.col === op.col);
    if (idx >= 0) { pendingOps[idx] = op; }
    else          { pendingOps.push(op); }
  } else {
    pendingOps.push(op);
  }
  updateCommitBar();
}

function updateCommitBar() {
  const countEl  = document.getElementById('ecb-count');
  const btn      = document.getElementById('ecb-commit-btn');
  const dotEl    = document.getElementById('ecb-dot');
  if (countEl) countEl.textContent = pendingOps.length;
  if (btn)     btn.disabled        = pendingOps.length === 0;
  if (dotEl)   dotEl.style.display = pendingOps.length > 0 ? '' : 'none';
}

function updateCommitTimestamps() {
  const loadTs   = +(localStorage.getItem('galaxy_data_cache_ts') || 0);
  const commitTs = localStorage.getItem('galaxy_last_commit_ts');
  const fmt = ts => {
    if (!ts) return 'never';
    const d = new Date(+ts || ts);
    return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };
  const loadEl   = document.getElementById('ecb-load-ts');
  const commitEl = document.getElementById('ecb-commit-ts');
  if (loadEl)   loadEl.textContent   = loadTs   ? fmt(loadTs)   : 'unknown';
  if (commitEl) commitEl.textContent = commitTs ? fmt(commitTs) : 'never';
}

function buildCommitBar() {
  if (document.getElementById('edit-commit-bar')) return;
  const bar = document.createElement('div');
  bar.id = 'edit-commit-bar';
  bar.innerHTML = `
    <div class="ecb-left">
      <span class="ecb-dot" id="ecb-dot" style="display:none">●</span>
      <span class="ecb-mode-label">✏️ Edit Mode</span>
      <span class="ecb-pending"><strong id="ecb-count">0</strong> pending</span>
    </div>
    <div class="ecb-center">
      <span id="ecb-progress" class="ecb-progress-msg"></span>
    </div>
    <div class="ecb-right">
      <span class="ecb-ts-block">
        <span class="ecb-ts-label">Last load</span>
        <time id="ecb-load-ts" class="ecb-ts-val">—</time>
      </span>
      <span class="ecb-ts-block">
        <span class="ecb-ts-label">Last commit</span>
        <time id="ecb-commit-ts" class="ecb-ts-val">—</time>
      </span>
      <button id="ecb-commit-btn" class="ecb-commit" disabled>💾 Commit to Sheets</button>
    </div>`;
  document.body.appendChild(bar);
  document.getElementById('ecb-commit-btn').addEventListener('click', commitPendingOps);
}

async function commitPendingOps() {
  if (pendingOps.length === 0) return;
  const isLocal = ['localhost', '127.0.0.1', ''].includes(window.location.hostname);
  const btn      = document.getElementById('ecb-commit-btn');
  const progress = document.getElementById('ecb-progress');
  const setMsg   = (msg, cls = '') => { if (progress) { progress.textContent = msg; progress.className = 'ecb-progress-msg' + (cls ? ' ' + cls : ''); } };

  if (btn) btn.disabled = true;

  // ── Collision check (production only) ────────────────────────
  if (!isLocal) {
    setMsg('Checking for conflicts…');
    try {
      const res = await fetch('/.netlify/functions/sheets-check');
      if (res.ok) {
        const { modifiedTime } = await res.json();
        const loadTs = +(localStorage.getItem('galaxy_data_cache_ts') || 0);
        if (new Date(modifiedTime).getTime() > loadTs) {
          const proceed = confirm(
            '⚠️ The spreadsheet was modified after you last loaded data.\n\n' +
            'Someone else may have made changes. Committing now could overwrite them.\n\n' +
            'Proceed anyway?'
          );
          if (!proceed) {
            setMsg('Commit cancelled — reload data first to be safe.', 'ecb-warn');
            if (btn) btn.disabled = false;
            return;
          }
        }
      }
    } catch (e) { /* check unavailable — proceed */ }
  }

  // ── Execute ops sequentially ──────────────────────────────────
  const ops = [...pendingOps];
  pendingOps = [];
  updateCommitBar();

  let done = 0;
  for (const op of ops) {
    setMsg(`Committing ${done + 1} / ${ops.length}…`);
    try {
      await apiPost(op);
      done++;
    } catch (err) {
      // Re-queue everything that didn't run
      pendingOps = [...ops.slice(done), ...pendingOps];
      updateCommitBar();
      setMsg(`❌ Failed on step ${done + 1}: ${err.message}`, 'ecb-error');
      if (btn) btn.disabled = false;
      return;
    }
  }

  // ── Success ───────────────────────────────────────────────────
  const now = new Date().toISOString();
  localStorage.setItem('galaxy_last_commit_ts', now);
  updateCommitTimestamps();
  setMsg(`✅ ${done} change${done === 1 ? '' : 's'} committed to Sheets.`, 'ecb-ok');
  setTimeout(() => setMsg(''), 4000);
}

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
  const exportBtn = document.getElementById('export-data-btn');
  if (exportBtn) exportBtn.style.display = '';
  buildCommitBar();
  document.getElementById('edit-commit-bar').classList.add('visible');
  updateCommitBar();
  updateCommitTimestamps();
  if (typeof buildTaskSidebar === 'function') buildTaskSidebar();
}

function deactivateEditMode() {
  if (pendingOps.length > 0) {
    const ok = confirm(
      `You have ${pendingOps.length} uncommitted change${pendingOps.length === 1 ? '' : 's'}.\n\n` +
      'Exit edit mode and discard them? (Your in-app changes will remain until you reload.)'
    );
    if (!ok) return;
    pendingOps = [];
    updateCommitBar();
  }
  editorActive = false;
  document.getElementById('edit-mode-btn').textContent = '🔒';
  document.getElementById('edit-mode-btn').title = 'Enable Edit Mode';
  document.body.classList.remove('edit-mode');
  document.getElementById('add-task-btn').style.display = 'none';
  const exportBtn = document.getElementById('export-data-btn');
  if (exportBtn) exportBtn.style.display = 'none';
  const bar = document.getElementById('edit-commit-bar');
  if (bar) bar.classList.remove('visible');
  if (typeof buildTaskSidebar === 'function') buildTaskSidebar();
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

function openTaskForm(taskId) {
  if (!editorActive) return;
  taskFormOpen   = true;
  editingTaskId  = taskId || null;
  ctxRowCounter  = 0;

  const existingTask = taskId
    ? (typeof TASKS !== 'undefined' ? TASKS : []).find(t => t.id === taskId)
    : null;

  // Update header to reflect mode
  const headerSpan = document.querySelector('#task-form-panel .ef-header span');
  if (headerSpan) headerSpan.textContent = existingTask ? `✏️ Edit Task` : '✏️ New Task';

  // Visual cue: highlight all MA squares
  if (typeof cy !== 'undefined') cy.nodes('[tier=3]').addClass('ma-picker-mode');
  const banner = document.getElementById('ma-picker-banner');
  if (banner) banner.style.display = '';

  // Pre-fill fields
  document.getElementById('tf-label').value    = existingTask?.label    || '';
  document.getElementById('tf-category').value = existingTask?.category || '';
  document.getElementById('tf-pdf').value      = existingTask?.pdfLink  || '';
  document.getElementById('tf-before-rows').innerHTML = '';
  document.getElementById('tf-after-rows').innerHTML  = '';
  document.getElementById('tf-status').textContent    = '';
  document.getElementById('tf-status').className      = 'ef-status';

  // Update save button label
  const saveBtn = document.getElementById('tf-save-btn');
  if (saveBtn) saveBtn.textContent = existingTask ? '💾 Save Changes' : '💾 Save Task';

  // Pre-populate MAs
  taskFormMAs = existingTask ? [...(existingTask.targetMAs || [])] : [];

  // Restore MA selected state on graph
  if (typeof cy !== 'undefined') {
    cy.nodes('[tier=3]').forEach(n => {
      if (taskFormMAs.includes(n.id())) n.addClass('editor-selected');
      else n.removeClass('editor-selected');
    });
  }

  // Populate category suggestions
  const dl = document.getElementById('tf-categories-list');
  dl.innerHTML = '';
  [...new Set((TASKS || []).map(t => t.category))].forEach(cat => {
    const opt = document.createElement('option'); opt.value = cat; dl.appendChild(opt);
  });

  // Pre-populate context rows for existing task
  if (existingTask) {
    (existingTask.beforeContext || []).forEach(c => addContextRow('before', c));
    (existingTask.afterContext  || []).forEach(c => addContextRow('after',  c));
  }

  renderMAChips();
  document.getElementById('task-form-panel').classList.add('open');
  document.getElementById('tf-label').focus();
}

function closeTaskForm() {
  taskFormOpen  = false;
  editingTaskId = null;
  document.getElementById('task-form-panel').classList.remove('open');
  if (typeof cy !== 'undefined') cy.nodes('[tier=3]').removeClass('ma-picker-mode').removeClass('editor-selected');
  const banner = document.getElementById('ma-picker-banner');
  if (banner) banner.style.display = 'none';
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

function _maOptionLabel(id) {
  const ma = (typeof MENTAL_ACTIONS !== 'undefined' ? MENTAL_ACTIONS : []).find(m => m.id === id);
  const lbl = ma ? (ma.label || '').replace(/\n/g, ' ').slice(0, 35) : '';
  return lbl ? `${id} — ${lbl}` : id;
}

function renderMAChips() {
  const container = document.getElementById('tf-ma-chips');
  if (!container) return;

  if (!taskFormMAs.length) {
    container.innerHTML = '<span class="ef-chip-empty">No MAs selected yet — click squares on the galaxy</span>';
  } else {
    container.innerHTML = taskFormMAs.map(id => {
      const ma  = (typeof MENTAL_ACTIONS !== 'undefined' ? MENTAL_ACTIONS : []).find(m => m.id === id);
      const tip = ma ? (ma.label || '').replace(/\n/g, ' ') : '';
      return `<span class="ef-chip" title="${tip}">
        ${id}
        <button class="ef-chip-rm" data-id="${id}" title="Remove">×</button>
      </span>`;
    }).join('');
    container.querySelectorAll('.ef-chip-rm').forEach(btn =>
      btn.addEventListener('click', () => {
        taskFormMAs = taskFormMAs.filter(m => m !== btn.dataset.id);
        cy.getElementById(btn.dataset.id).removeClass('editor-selected');
        renderMAChips();
      })
    );
  }

  // Keep every already-added context-row MA dropdown in sync with current MA list
  document.querySelectorAll('.ef-ctx-ma').forEach(sel => {
    const cur = sel.value;
    if (!taskFormMAs.length) {
      sel.innerHTML = '<option value="">— select MAs first —</option>';
    } else {
      sel.innerHTML = taskFormMAs.map(id =>
        `<option value="${id}"${id === cur ? ' selected' : ''}>${_maOptionLabel(id)}</option>`
      ).join('');
    }
  });
}

function addContextRow(stage, prefill) {
  const container = document.getElementById(`tf-${stage}-rows`);
  const idx = ctxRowCounter++;
  const div = document.createElement('div');
  div.className = 'ef-ctx-row';

  const TYPE_OPTIONS = ['Purposeful Question','Anticipated Model','Scaffolding','Intervention','Reflection Prompt','Extension','Note'];
  const maOptions = taskFormMAs.length
    ? taskFormMAs.map(id => `<option value="${id}"${prefill?.maId===id?' selected':''}>${_maOptionLabel(id)}</option>`).join('')
    : '<option value="">— select MAs first —</option>';

  const typeOpts = TYPE_OPTIONS.map(t =>
    `<option${prefill?.type===t?' selected':''}>${t}</option>`).join('');

  div.innerHTML = `
    <div class="ef-ctx-row-top">
      <select class="ef-ctx-type">${typeOpts}</select>
      <select class="ef-ctx-ma">${maOptions}</select>
      <button class="ef-ctx-rm" title="Remove row">✕</button>
    </div>
    <textarea class="ef-ctx-content" placeholder="Guidance text…" rows="2">${prefill?.content ? prefill.content.replace(/</g,'&lt;') : ''}</textarea>`;

  div.querySelector('.ef-ctx-rm').addEventListener('click', () => div.remove());
  container.appendChild(div);
  if (!prefill) div.querySelector('.ef-ctx-content').focus();
}

function saveTask() {
  const label    = document.getElementById('tf-label').value.trim();
  const category = document.getElementById('tf-category').value.trim();
  const pdf      = document.getElementById('tf-pdf').value.trim();

  if (!label)              return taskStatus('⚠️ Task name is required.', 'warn');
  if (!category)           return taskStatus('⚠️ Category is required.', 'warn');
  if (!taskFormMAs.length) return taskStatus('⚠️ Select at least one mental action.', 'warn');

  // Collect context rows from the form
  const ctxEntries = { before: [], after: [] };
  ['before', 'after'].forEach(stage => {
    document.querySelectorAll(`#tf-${stage}-rows .ef-ctx-row`).forEach(row => {
      const content = row.querySelector('.ef-ctx-content').value.trim();
      const maId    = row.querySelector('.ef-ctx-ma').value;
      const type    = row.querySelector('.ef-ctx-type').value;
      if (content && maId) ctxEntries[stage].push({ maId, type, content });
    });
  });

  if (editingTaskId) {
    // ── UPDATE existing task ────────────────────────────────────
    const task = (TASKS || []).find(t => t.id === editingTaskId);
    if (!task) return taskStatus('⚠️ Task not found in memory.', 'warn');

    task.label         = label;
    task.category      = category;
    task.pdfLink       = pdf;
    task.targetMAs     = [...taskFormMAs];
    task.beforeContext = ctxEntries.before;
    task.afterContext  = ctxEntries.after;

    if (typeof buildTaskSidebar === 'function') buildTaskSidebar();
    if (typeof galaxyCache !== 'undefined') galaxyCache.save();

    const taskRow = [editingTaskId, label, category, task.domain || '', pdf, taskFormMAs.join('|')];
    queueOp({ op: 'updateTaskRow', taskId: editingTaskId, row: taskRow });
    queueOp({ op: 'deleteAllContextForTask', taskId: editingTaskId });
    const id = editingTaskId;
    ctxEntries.before.forEach(c => queueOp({ op: 'append', tab: 'teacher_context', row: [id, 'before', c.maId, c.type, c.content] }));
    ctxEntries.after .forEach(c => queueOp({ op: 'append', tab: 'teacher_context', row: [id, 'after',  c.maId, c.type, c.content] }));

    taskStatus('✅ Updated locally — commit to save to Sheets.', 'ok');

  } else {
    // ── CREATE new task ─────────────────────────────────────────
    const slug = label.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 20);
    const id   = `Task_${slug}_${Date.now().toString(36).toUpperCase().slice(-4)}`;

    const newTask = {
      id, label, category, domain: '', pdfLink: pdf,
      targetMAs:     [...taskFormMAs],
      beforeContext: ctxEntries.before,
      afterContext:  ctxEntries.after,
    };
    (TASKS || []).push(newTask);
    if (typeof buildTaskSidebar === 'function') buildTaskSidebar();
    if (typeof galaxyCache !== 'undefined') galaxyCache.save();

    const taskRow = [id, label, category, '', pdf, taskFormMAs.join('|')];
    queueOp({ op: 'append', tab: 'tasks', row: taskRow });
    ctxEntries.before.forEach(c => queueOp({ op: 'append', tab: 'teacher_context', row: [id, 'before', c.maId, c.type, c.content] }));
    ctxEntries.after .forEach(c => queueOp({ op: 'append', tab: 'teacher_context', row: [id, 'after',  c.maId, c.type, c.content] }));

    taskStatus('✅ Added locally — commit to save to Sheets.', 'ok');
  }

  cy.nodes('[tier=3]').removeClass('editor-selected');
  setTimeout(closeTaskForm, 1800);
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
  const _ma = (typeof MENTAL_ACTIONS !== 'undefined' ? MENTAL_ACTIONS : []).find(m => m.id === nodeId);
  const _maLabel = _ma ? (_ma.label || '').replace(/\n/g, ' ') || nodeId : nodeId;
  document.getElementById('uf-node-label').textContent    = _maLabel;
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
  document.getElementById('uf-status').textContent = 'Saving…';
  document.getElementById('uf-status').className   = 'ef-status ef-info';

  const reader = new FileReader();
  reader.onload = async e => {
    const dataUrl  = e.target.result;
    const base64   = dataUrl.split(',')[1];
    const ext      = (pendingFile.name.split('.').pop() || 'jpg').toLowerCase();
    const ts       = Date.now().toString(36).toUpperCase();
    const filename = `${uploadNodeId.replace(/\./g, '-').toLowerCase()}-${ts}.${ext}`;

    const ma       = (typeof MENTAL_ACTIONS !== 'undefined' ? MENTAL_ACTIONS : []).find(m => m.id === uploadNodeId);
    const domain   = ma ? ma.domain : '';
    const sampleId = `${uploadNodeId}.S${ts}`;

    // ── Detect local dev: skip GitHub upload, store data URL directly ─────
    const isLocal = ['localhost', '127.0.0.1', ''].includes(window.location.hostname);

    try {
      let resolvedMediaLink;

      if (isLocal) {
        // Store the raw data URL — works offline, no Netlify needed.
        // On production deploy the editor will upload to GitHub as normal.
        resolvedMediaLink = dataUrl;
        document.getElementById('uf-status').textContent = 'Saved locally (data URL)';
      } else {
        // 1 — upload image to GitHub via Netlify function
        const upRes = await fetch(EDITOR_FN_IMAGE, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ password: editorPassword, filename, base64 }),
        });
        if (!upRes.ok) throw new Error(`Upload failed (${upRes.status})`);
        resolvedMediaLink = filename;
      }

      // 2 — add to in-memory data + graph immediately (optimistic)
      const newSample = { id: sampleId, tier: 4, domain, parent: uploadNodeId, label: 'Sample', description, mediaLink: resolvedMediaLink };
      if (typeof SAMPLES !== 'undefined') SAMPLES.push(newSample);

      if (typeof cy !== 'undefined' && typeof LAYOUT !== 'undefined' && typeof DOMAIN_COLORS !== 'undefined') {
        const maPos = LAYOUT.positions[uploadNodeId] || { x: 0, y: 0 };
        const angle = Math.atan2(maPos.y, maPos.x);
        const pos   = { x: 820 * Math.cos(angle), y: 820 * Math.sin(angle) };
        cy.add({
          group: 'nodes',
          data: { id: sampleId, label: '', tier: 4, domain, parent_node: uploadNodeId, description, mediaLink: resolvedMediaLink },
          position: pos,
          style: { 'background-color': DOMAIN_COLORS[domain] || '#4fc3f7', opacity: 1 },
        });
        cy.add({ group: 'edges', data: { id: `e_${sampleId}`, source: uploadNodeId, target: sampleId, type: 'hierarchy' } });
      }

      if (typeof galaxyCache !== 'undefined') galaxyCache.save();

      // 3 — close panel and show new sample's detail card
      closeUploadPanel();
      if (typeof clearSelection   === 'function') clearSelection();
      if (typeof addNodeSelection === 'function') addNodeSelection(sampleId);
      const newCyNode = cy.getElementById(sampleId);
      if (newCyNode && newCyNode.length && typeof zoomToNodeCluster === 'function') {
        zoomToNodeCluster(newCyNode);
      }
      setTimeout(() => {
        if (typeof renderSelectionPanels === 'function') renderSelectionPanels();
      }, 420);

      // 4 — Queue Sheet write (skipped locally — data URL can't be stored in Sheets)
      if (!isLocal) {
        queueOp({ op: 'append', tab: 'nodes', row: [sampleId, 4, domain, uploadNodeId, 'Sample', description, filename] });
      }

    } catch (err) {
      document.getElementById('uf-status').textContent = '❌ ' + err.message;
      document.getElementById('uf-status').className   = 'ef-status ef-error';
      document.getElementById('uf-save-btn').disabled  = false;
    }
  };
  reader.readAsDataURL(pendingFile);
}

// ── Delete task ───────────────────────────────────────────────

async function deleteTask(taskId) {
  const task = (typeof TASKS !== 'undefined' ? TASKS : []).find(t => t.id === taskId);
  if (!task) return;
  if (!confirm(`Delete "${task.label}"?\n\nThis removes it from the app immediately. The row will also be cleared from the Tasks sheet.`)) return;

  // Remove from memory
  const idx = TASKS.findIndex(t => t.id === taskId);
  if (idx !== -1) TASKS.splice(idx, 1);

  // If this task was active, clear its highlighting
  if (typeof activeTaskId !== 'undefined' && activeTaskId === taskId) {
    if (typeof resetHighlighting === 'function') resetHighlighting();
  }

  // Rebuild sidebar, save cache
  if (typeof buildTaskSidebar === 'function') buildTaskSidebar();
  if (typeof galaxyCache !== 'undefined') galaxyCache.save();

  // Queue Sheet row clear
  queueOp({ op: 'deleteRow', tab: 'tasks', id: taskId });
}

// ── Delete sample ─────────────────────────────────────────────

async function deleteSample(sampleId) {
  const sample = (typeof SAMPLES !== 'undefined' ? SAMPLES : []).find(s => s.id === sampleId);
  if (!sample) return;
  const preview = sample.description ? `"${sample.description.slice(0, 60)}"` : sampleId;
  if (!confirm(`Remove this sample image?\n${preview}\n\nThe node will be removed from the app and the row cleared from the sheet.`)) return;

  // Remove from memory
  const idx = (typeof SAMPLES !== 'undefined' ? SAMPLES : []).findIndex(s => s.id === sampleId);
  if (idx !== -1) SAMPLES.splice(idx, 1);

  // Remove from graph (node + any connected edges)
  if (typeof cy !== 'undefined') {
    cy.edges(`[source="${sampleId}"], [target="${sampleId}"]`).remove();
    cy.getElementById(sampleId).remove();
  }

  // Deselect if currently shown in detail panel
  if (typeof selectedNodeIds !== 'undefined') {
    const selIdx = selectedNodeIds.indexOf(sampleId);
    if (selIdx !== -1) {
      selectedNodeIds.splice(selIdx, 1);
      if (typeof renderSelectionPanels === 'function') renderSelectionPanels();
    }
  }

  if (typeof galaxyCache !== 'undefined') galaxyCache.save();

  // Queue Sheet row clear
  queueOp({ op: 'deleteRow', tab: 'nodes', id: sampleId });
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
