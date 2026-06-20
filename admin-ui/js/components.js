/**
 * components.js
 * Loads shared layout partials (sidebar, header, footer) into every page.
 * Pages must have placeholder elements with the right IDs.
 */
(function () {
  'use strict';

  var BASE = (function () {
    // If served by backend at root, partials are at /partials/
    // If opened as a file, use relative path
    var loc = window.location;
    if (loc.protocol === 'file:') return 'partials/';
    return '/partials/';
  })();

  function loadPartial(id, file, callback) {
    var el = document.getElementById(id);
    if (!el) { if (callback) callback(); return; }
    var xhr = new XMLHttpRequest();
    xhr.open('GET', BASE + file, true);
    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 400) {
        el.innerHTML = xhr.responseText;
      }
      if (callback) callback();
    };
    xhr.onerror = function () { if (callback) callback(); };
    xhr.send();
  }

  function markActiveMenu() {
    var page = (document.body && document.body.getAttribute('data-page')) || '';
    if (!page) return;
    var items = document.querySelectorAll('[data-menu]');
    Array.prototype.forEach.call(items, function (li) {
      li.classList.remove('active');
      if (li.getAttribute('data-menu') === page) {
        li.classList.add('active');
        // Open parent submenu if exists
        var sub = li.querySelector('.submenu-angle');
        if (sub) sub.setAttribute('aria-expanded', 'true');
      }
    });
  }

  function initMetisMenu() {
    if (typeof jQuery !== 'undefined' && jQuery.fn.metisMenu) {
      jQuery('#menu1').metisMenu();
    }
  }

  function initSidebarToggle() {
    if (typeof jQuery === 'undefined') return;
    jQuery(document).on('click', '#sidebarCollapse', function () {
      jQuery('#sidebar').toggleClass('active');
    });
  }

  function loadComponents() {
    // Load sidebar first, then header, then footer (order matters for menu init)
    loadPartial('sidebar-placeholder', 'sidebar.html', function () {
      markActiveMenu();
      initMetisMenu();
      initSidebarToggle();

      loadPartial('header-placeholder', 'header.html', function () {
        // Re-bind logout after header is injected
        if (window.SchoolBackend && window.SchoolBackend.bindLogout) {
          window.SchoolBackend.bindLogout();
        }
        loadPartial('footer-placeholder', 'footer.html', null);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadComponents);
  } else {
    loadComponents();
  }
})();
