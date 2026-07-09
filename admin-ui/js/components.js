/**
 * components.js — Loads shared layout partials and initialises sidebar behaviour
 */

// Inject translation script synchronously with cache buster
document.write('<script src="js/i18n.js?v=' + new Date().getTime() + '"></script>');

(function () {
  'use strict';

  var BASE = 'partials/';

  // ── Sidebar state ────────────────────────────────────────────────────────────
  var SB_KEY = 'sb_collapsed';

  // Global toggle called by onclick in sidebar HTML
  window.sbToggleSidebar = function () {
    document.body.classList.toggle('sb-open');
  };

  // Global toggle for submenu items
  window.sbToggle = function (linkEl) {
    var item = linkEl.closest('.sb-item');
    if (!item) return;
    var wasOpen = item.classList.contains('open');
    // Close siblings
    var siblings = item.parentElement.querySelectorAll('.sb-item.open');
    siblings.forEach(function (s) { s.classList.remove('open'); });
    if (!wasOpen) item.classList.add('open');
  };

  // Close sidebar when overlay is clicked (mobile)
  document.addEventListener('click', function (e) {
    if (e.target.id === 'sb-overlay') {
      document.body.classList.remove('sb-open');
    }
    // Close topbar dropdowns on outside click
    if (!e.target.closest('#topbar-user-menu')) {
      var um = document.getElementById('topbar-user-menu');
      if (um) um.classList.remove('open');
    }
    if (!e.target.closest('#lang-wrap') && !e.target.closest('.lang-wrap')) {
      document.querySelectorAll('.lang-wrap').forEach(function (w) { w.classList.remove('open'); });
    }
  });



  // Mark active nav item based on current page's data-page attribute
  function markActiveNav() {
    var page = (document.body && document.body.getAttribute('data-page')) || '';
    if (!page) return;

    var items = document.querySelectorAll('#app-sidebar [data-menu]');
    items.forEach(function (item) {
      var isMatch = item.getAttribute('data-menu') === page;
      var link = item.querySelector('.sb-link');
      var submenuLinks = item.querySelectorAll('.sb-submenu a');

      if (isMatch) {
        if (link) link.classList.add('active');
        item.classList.add('open');
      }
      // Active on submenu link
      submenuLinks.forEach(function (a) {
        var href = a.getAttribute('href') || '';
        var currentFile = window.location.pathname.split('/').pop() || 'index.html';
        if (href === currentFile) {
          a.classList.add('active');
          item.classList.add('open');
          if (link) link.classList.add('active');
        }
      });
    });

    // Update topbar page title
    var activeLink = document.querySelector('#app-sidebar .sb-link.active .sb-label');
    var title = document.getElementById('sb-page-title');
    if (title && activeLink) title.textContent = activeLink.textContent.trim();
  }

  // ── Partial loader ───────────────────────────────────────────────────────────
  function afterLoad(name, el) {
    // Translate the newly-injected partial element only
    if (window.AppI18n && el) {
      window.AppI18n.translateAll(el);
    }
    if (window.SchoolBackend && typeof window.SchoolBackend.afterPartialLoad === 'function') {
      window.SchoolBackend.afterPartialLoad(name);
    }
  }

  function loadPartial(placeholderId, file, name, callback) {
    var el = document.getElementById(placeholderId);
    if (!el) { if (callback) callback(); return; }

    var xhr = new XMLHttpRequest();
    xhr.open('GET', BASE + file, true);
    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 400) {
        el.innerHTML = xhr.responseText;
        
        // Prevent CSS transition flashing on newly inserted elements
        var sb = document.getElementById('app-sidebar');
        if (name === 'sidebar' && sb) {
          sb.style.transition = 'none';
          void sb.offsetHeight; // force reflow
          sb.style.transition = '';
        }

        afterLoad(name, el);
      }
      if (callback) callback();
    };
    xhr.onerror = function () { if (callback) callback(); };
    xhr.send();
  }

  function loadComponents() {
    // Load sidebar → header → footer in sequence
    loadPartial('sidebar-placeholder', 'sidebar.html', 'sidebar', function () {
      markActiveNav();

      loadPartial('header-placeholder', 'header.html', 'header', function () {
        loadPartial('footer-placeholder', 'footer.html', 'footer', function () {
          // Final pass: translate the static page content (non-partial elements)
          if (window.AppI18n) {
            window.AppI18n.translateAll(document.body);
          }
        });
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadComponents);
  } else {
    loadComponents();
  }
})();
