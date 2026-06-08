// ============================================================
// App entry point — waits for dataReady (Sheets loader or
// instant resolve when using hardcoded seed data).
// ============================================================

function initApp() {
  buildAboutTab();
  buildTaskSidebar();
  initGraph();
  initSearch();
  initTeachingStage();
  initSidebarToggle();

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
  // dataReady is set by loader.js (resolves instantly if no Sheets URLs configured)
  Promise.resolve(window.dataReady).then(initApp);
});
