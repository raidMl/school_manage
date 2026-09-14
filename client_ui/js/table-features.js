/**
 * table-features.js — Universal Table Enhancer: MUI DataGrid-Style Column Menu
 * Features:
 *   - Material-UI DataGrid column menu on header hover (Sort ASC/DESC, Filter, Hide column, Manage columns)
 *   - Per-column text filter with apply/clear inside the menu panel
 *   - Column visibility (hide/show) management
 *   - Excel (.xlsx) export with RTL, Arabic normalization, clean column extraction
 *   - MutationObserver for dynamic/AJAX data tables
 */
(function () {
  'use strict';

  /* ── CDN ─────────────────────────────────────────────────────────────────── */
  var XLSX_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
  var xlsxLoadingPromise = null;

  /* ── Active menu state ───────────────────────────────────────────────────── */
  var _activeMenu = null;
  var _activeTable = null;
  var _activeColIdx = -1;

  /* ── i18n Helper ─────────────────────────────────────────────────────────── */
  function t(key, fallback) {
    if (window.AppI18n && typeof window.AppI18n.t === 'function') {
      var res = window.AppI18n.t(key);
      if (res && res !== key) return res;
    }
    return fallback != null ? fallback : key;
  }

  function isRtl() {
    return document.documentElement.dir === 'rtl' ||
      document.body.classList.contains('rtl') ||
      (window.AppI18n && typeof window.AppI18n.getLang === 'function' && window.AppI18n.getLang() === 'ar');
  }

  /* ── Arabic & Text Normalization ─────────────────────────────────────────── */
  function normalizeStr(val) {
    if (val == null) return '';
    return String(val)
      .replace(/[\u0660-\u0669]/g, function (d) { return d.charCodeAt(0) - 1632; }) // Arabic-Indic digits ٠-٩ -> 0-9
      .replace(/[\u06F0-\u06F9]/g, function (d) { return d.charCodeAt(0) - 1776; }) // Eastern Arabic-Indic digits
      .toLowerCase()
      .trim()
      .replace(/[\u064B-\u065F\u0670]/g, '')   // remove tashkeel
      .replace(/[أإآٱ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/\s+/g, ' ');
  }

  /* ── Lazy-Load SheetJS ───────────────────────────────────────────────────── */
  function loadXlsx() {
    if (typeof window.XLSX !== 'undefined') return Promise.resolve(window.XLSX);
    if (xlsxLoadingPromise) return xlsxLoadingPromise;
    xlsxLoadingPromise = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = XLSX_CDN; s.async = true;
      s.onload = function () { window.XLSX ? resolve(window.XLSX) : reject(new Error('SheetJS failed')); };
      s.onerror = function () { reject(new Error('Failed to load SheetJS CDN')); };
      document.head.appendChild(s);
    });
    return xlsxLoadingPromise;
  }

  /* ── Check if a column should be ignored ─────────────────────────────────── */
  function isIgnoredCol(th) {
    if (!th) return true;
    var rawText = (th.querySelector('.th-label-text') || th).textContent || '';
    var text = normalizeStr(rawText);
    var dKey = normalizeStr(th.getAttribute('data-i18n') || '');
    var html = th.innerHTML || '';

    if (html.indexOf('type="checkbox"') !== -1 || th.classList.contains('select-all') || th.querySelector('.select-all, .row-checkbox')) return true;

    // Check actions
    if (dKey === 'actions' || dKey === 'action') return true;
    if (text === 'actions' || text === 'action' || text.indexOf('اجراءات') !== -1 || text.indexOf('إجراءات') !== -1 ||
        text === 'حفظ' || th.classList.contains('action-col')) return true;

    // Check photo / image
    if (dKey === 'photo' || dKey === 'avatar' || dKey === 'image' || dKey === 'img') return true;
    if (text === 'photo' || text === 'avatar' || text === 'img' || text === 'image' ||
        text.indexOf('صورة') !== -1 || text.indexOf('صوره') !== -1) return true;

    var w = parseInt(th.getAttribute('width') || (th.style && th.style.width) || 0, 10);
    if (w > 0 && w <= 50 && (!text || text === '#')) return true;
    return false;
  }

  /* ── Per-table state storage ─────────────────────────────────────────────── */
  function getState(table) {
    if (!table._tfState) {
      table._tfState = {
        filters: {},     // colIdx -> string
        sort: null,      // { colIdx, dir }
        hiddenCols: {}   // colIdx -> true
      };
    }
    return table._tfState;
  }

  /* ── Debounce ────────────────────────────────────────────────────────────── */
  function debounce(fn, ms) {
    var t = null;
    return function () {
      var ctx = this, args = arguments;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(ctx, args); }, ms);
    };
  }

  /* ── Close Active Menu ───────────────────────────────────────────────────── */
  function closeMenu() {
    if (_activeMenu && _activeMenu.parentNode) {
      _activeMenu.parentNode.removeChild(_activeMenu);
    }
    _activeMenu = null;
    _activeTable = null;
    _activeColIdx = -1;
  }

  /* ── SVG Icons ───────────────────────────────────────────────────────────── */
  function svg(path) {
    return '<svg class="MuiSvgIcon-root" focusable="false" aria-hidden="true" viewBox="0 0 24 24">' +
           '<path d="' + path + '"></path></svg>';
  }

  var ICON_ASC  = svg('M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z');
  var ICON_DESC = svg('M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8 8-8z');
  var ICON_FLT  = svg('M4.25 5.61C6.27 8.2 10 13 10 13v6c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-6s3.72-4.8 5.74-7.39c.51-.66.04-1.61-.79-1.61H5.04c-.83 0-1.3.95-.79 1.61z');
  var ICON_HIDE = svg('M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z');
  var ICON_MGMT = svg('M14.67,5v14H9.33V5H14.67z M15.67,19H21V5h-5.33V19z M8.33,19V5H3v14H8.33z');
  var ICON_MENU = '<svg class="MuiSvgIcon-root" viewBox="0 0 24 24" fill="currentColor"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>';

  /* ── Build and Show Column Menu ──────────────────────────────────────────── */
  function showColumnMenu(table, th, colIdx, triggerEl) {
    closeMenu();

    var state = getState(table);
    var colTitle = (th.textContent || th.innerText || '').trim().replace(/\s+/g, ' ');
    var curFilter = state.filters[colIdx] || '';
    var curSort   = state.sort;

    var container = document.createElement('div');
    container.className = 'MuiDataGrid-menuContainer';
    container.setAttribute('role', 'presentation');
    if (isRtl()) {
      container.setAttribute('dir', 'rtl');
      container.classList.add('rtl');
    }

    var paper = document.createElement('div');
    paper.className = 'MuiPaper-root MuiDataGrid-paper';

    var ul = document.createElement('ul');
    ul.className = 'MuiList-root MuiDataGrid-menuList';
    ul.setAttribute('role', 'menu');

    /* ── Helper: create menu item ── */
    function mkItem(iconHtml, labelText, onClick, extraClass) {
      var li = document.createElement('li');
      li.className = 'MuiMenuItem-root' + (extraClass ? ' ' + extraClass : '');
      li.setAttribute('role', 'menuitem');
      li.setAttribute('tabindex', '0');
      li.innerHTML =
        '<div class="MuiListItemIcon-root">' + iconHtml + '</div>' +
        '<div class="MuiListItemText-root"><span class="MuiListItemText-primary">' + labelText + '</span></div>';
      li.addEventListener('click', function (e) { e.stopPropagation(); onClick(); });
      li.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') onClick(); });
      return li;
    }

    function mkDivider() {
      var hr = document.createElement('hr');
      hr.className = 'MuiDivider-root';
      return hr;
    }

    /* Sort ASC */
    var sortAscItem = mkItem(ICON_ASC, t('Sort by ASC', 'ترتيب تصاعدي'), function () {
      applySort(table, colIdx, 'asc');
      closeMenu();
    }, curSort && curSort.colIdx === colIdx && curSort.dir === 'asc' ? 'active-item' : '');

    /* Sort DESC */
    var sortDescItem = mkItem(ICON_DESC, t('Sort by DESC', 'ترتيب تنازلي'), function () {
      applySort(table, colIdx, 'desc');
      closeMenu();
    }, curSort && curSort.colIdx === colIdx && curSort.dir === 'desc' ? 'active-item' : '');

    ul.appendChild(sortAscItem);
    ul.appendChild(sortDescItem);
    ul.appendChild(mkDivider());

    /* ── Filter Subpanel ── */
    var filterLi = document.createElement('li');
    filterLi.className = 'MuiMenuItem-root';
    filterLi.setAttribute('role', 'menuitem');
    filterLi.style.cursor = 'default';
    filterLi.style.padding = '0';
    filterLi.style.flexDirection = 'column';
    filterLi.style.alignItems = 'stretch';

    var filterPanel = document.createElement('div');
    filterPanel.className = 'mui-filter-subpanel';

    var filterHeader = document.createElement('div');
    filterHeader.className = 'mui-filter-header';
    filterHeader.innerHTML = '<span class="MuiListItemIcon-root">' + ICON_FLT + '</span> ' + t('Filter', 'تصفية') + ' — <em style="font-weight:400;text-transform:none;">' + colTitle + '</em>';

    var filterWrap = document.createElement('div');
    filterWrap.className = 'mui-filter-input-wrap';

    var filterInput = document.createElement('input');
    filterInput.type = 'text';
    filterInput.className = 'mui-filter-input';
    filterInput.placeholder = t('Filter value...', 'أدخل قيمة للتصفية...');
    filterInput.value = curFilter;
    filterInput.autocomplete = 'off';
    filterInput.addEventListener('click', function (e) { e.stopPropagation(); });
    filterInput.addEventListener('keydown', function (e) {
      e.stopPropagation();
      if (e.key === 'Enter') { applyColFilter(table, colIdx, filterInput.value.trim()); closeMenu(); }
      if (e.key === 'Escape') { closeMenu(); }
    });

    var filterClearBtn = document.createElement('button');
    filterClearBtn.type = 'button';
    filterClearBtn.className = 'mui-filter-clear-btn';
    filterClearBtn.innerHTML = '&times;';
    filterClearBtn.title = t('Clear filter', 'مسح التصفية');
    filterClearBtn.style.display = curFilter ? 'block' : 'none';
    filterClearBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      filterInput.value = '';
      filterClearBtn.style.display = 'none';
    });

    filterInput.addEventListener('input', function () {
      filterClearBtn.style.display = filterInput.value ? 'block' : 'none';
    });

    filterWrap.appendChild(filterInput);
    filterWrap.appendChild(filterClearBtn);

    var filterActions = document.createElement('div');
    filterActions.className = 'mui-filter-actions';

    var btnClear = document.createElement('button');
    btnClear.type = 'button';
    btnClear.className = 'mui-filter-btn mui-filter-btn-clear';
    btnClear.textContent = t('Clear', 'مسح');
    btnClear.addEventListener('click', function (e) {
      e.stopPropagation();
      filterInput.value = '';
      applyColFilter(table, colIdx, '');
      closeMenu();
    });

    var btnApply = document.createElement('button');
    btnApply.type = 'button';
    btnApply.className = 'mui-filter-btn mui-filter-btn-apply';
    btnApply.textContent = t('Apply', 'تطبيق');
    btnApply.addEventListener('click', function (e) {
      e.stopPropagation();
      applyColFilter(table, colIdx, filterInput.value.trim());
      closeMenu();
    });

    filterActions.appendChild(btnClear);
    filterActions.appendChild(btnApply);

    filterPanel.appendChild(filterHeader);
    filterPanel.appendChild(filterWrap);
    filterPanel.appendChild(filterActions);
    filterLi.appendChild(filterPanel);
    filterLi.addEventListener('click', function (e) { e.stopPropagation(); });

    ul.appendChild(filterLi);
    ul.appendChild(mkDivider());

    /* Hide Column */
    var hideItem = mkItem(ICON_HIDE, t('Hide column', 'إخفاء العمود'), function () {
      hideColumn(table, colIdx);
      closeMenu();
    });
    ul.appendChild(hideItem);

    /* Manage Columns */
    var manageItem = mkItem(ICON_MGMT, t('Manage columns', 'إدارة الأعمدة'), function () {
      closeMenu();
      openManageColumns(table);
    });
    ul.appendChild(manageItem);

    paper.appendChild(ul);
    container.appendChild(paper);
    document.body.appendChild(container);

    /* ── Position Menu ── */
    var rect = triggerEl.getBoundingClientRect();
    var menuW = 240;
    var left;
    if (isRtl()) {
      left = rect.left;
      if (left + menuW > window.innerWidth - 8) {
        left = rect.right - menuW;
      }
    } else {
      left = rect.right - menuW;
      if (left < 8) left = rect.left;
    }
    if (left + menuW > window.innerWidth - 8) left = window.innerWidth - menuW - 8;
    if (left < 8) left = 8;

    var menuH = 380;
    var top = rect.bottom + 2;
    if (top + menuH > window.innerHeight - 4) {
      top = rect.top - menuH - 2;
    }
    if (top < 4) top = rect.bottom + 2;

    container.style.top = top + 'px';
    container.style.left = left + 'px';

    _activeMenu = container;
    _activeTable = table;
    _activeColIdx = colIdx;

    /* Focus the filter input */
    setTimeout(function () { filterInput.focus(); }, 50);
  }

  /* ── Apply Column Filter ─────────────────────────────────────────────────── */
  function applyColFilter(table, colIdx, value) {
    var state = getState(table);
    if (value) {
      state.filters[colIdx] = value;
    } else {
      delete state.filters[colIdx];
    }
    applyTableState(table);
    updateHeaderIndicators(table);
    updateToolbarCounter(table);
  }

  /* ── Apply Sort ──────────────────────────────────────────────────────────── */
  function applySort(table, colIdx, dir) {
    var state = getState(table);
    var thead = table.querySelector('thead');
    var headerRow = thead ? thead.querySelector('tr:first-child') : null;
    var ths = headerRow ? Array.prototype.slice.call(headerRow.children) : [];

    // Cache original row order if not done yet
    var tbody = table.querySelector('tbody');
    if (!tbody) return;

    if (!table._originalRows) {
      table._originalRows = Array.prototype.slice.call(tbody.querySelectorAll('tr:not(.col-filter-no-match-row)'));
    }

    // Toggle off if same
    if (state.sort && state.sort.colIdx === colIdx && state.sort.dir === dir) {
      state.sort = null;
      // Restore original order
      var origRows = table._originalRows;
      origRows.forEach(function (row) { tbody.appendChild(row); });
    } else {
      state.sort = { colIdx: colIdx, dir: dir };
      var rows = Array.prototype.slice.call(tbody.querySelectorAll('tr:not(.col-filter-no-match-row)'));
      rows.sort(function (a, b) {
        var cellA = a.children[colIdx];
        var cellB = b.children[colIdx];
        var valA = normalizeStr(cellA ? (cellA.textContent || cellA.innerText || '') : '');
        var valB = normalizeStr(cellB ? (cellB.textContent || cellB.innerText || '') : '');
        // Numeric sort
        var numA = parseFloat(valA.replace(/[^\d.-]/g, ''));
        var numB = parseFloat(valB.replace(/[^\d.-]/g, ''));
        if (!isNaN(numA) && !isNaN(numB) && !isNaN(parseFloat(valA)) && !isNaN(parseFloat(valB))) {
          return dir === 'asc' ? numA - numB : numB - numA;
        }
        return dir === 'asc'
          ? valA.localeCompare(valB, isRtl() ? 'ar' : undefined, { numeric: true, sensitivity: 'base' })
          : valB.localeCompare(valA, isRtl() ? 'ar' : undefined, { numeric: true, sensitivity: 'base' });
      });
      rows.forEach(function (row) { tbody.appendChild(row); });
    }

    applyTableState(table);
    updateHeaderIndicators(table);
    updateToolbarCounter(table);
  }

  /* ── Apply Table State (Filters) ─────────────────────────────────────────── */
  function applyTableState(table) {
    var state = getState(table);
    var tbody = table.querySelector('tbody');
    if (!tbody) return;

    var activeFilters = Object.keys(state.filters).map(function (k) {
      return { colIdx: parseInt(k, 10), val: normalizeStr(state.filters[k]) };
    }).filter(function (f) { return f.val; });

    var rows = tbody.querySelectorAll('tr:not(.col-filter-no-match-row)');
    var total = 0, visible = 0;

    for (var i = 0; i < rows.length; i++) {
      var tr = rows[i];
      var firstTd = tr.querySelector('td');
      if (firstTd && firstTd.colSpan > 3) continue;
      total++;

      var match = true;
      for (var f = 0; f < activeFilters.length; f++) {
        var cell = tr.children[activeFilters[f].colIdx];
        var cellText = cell ? normalizeStr(cell.textContent || cell.innerText || '') : '';
        if (cellText.indexOf(activeFilters[f].val) === -1) { match = false; break; }
      }

      tr.style.display = match ? '' : 'none';
      if (match) visible++;
    }

    // No-match row
    var noMatch = tbody.querySelector('.col-filter-no-match-row');
    if (activeFilters.length > 0 && total > 0 && visible === 0) {
      if (!noMatch) {
        noMatch = document.createElement('tr');
        noMatch.className = 'col-filter-no-match-row';
        var colCount = (table.querySelector('thead tr') || {}).children ?
          table.querySelector('thead tr').children.length : 6;
        noMatch.innerHTML = '<td colspan="' + colCount + '"><i class="fa fa-search"></i> ' +
          t('No matching records found', 'لا توجد نتائج مطابقة') + '</td>';
        tbody.appendChild(noMatch);
      } else { noMatch.style.display = ''; }
    } else if (noMatch) {
      noMatch.style.display = 'none';
    }

    table._visibleCount = visible;
    table._totalCount = total;
  }

  /* ── Hide / Show Column ──────────────────────────────────────────────────── */
  function hideColumn(table, colIdx) {
    var state = getState(table);
    state.hiddenCols[colIdx] = true;
    applyColumnVisibility(table);
  }

  function applyColumnVisibility(table) {
    var state = getState(table);
    var allRows = table.querySelectorAll('thead tr, tbody tr, tfoot tr');
    for (var r = 0; r < allRows.length; r++) {
      var cells = allRows[r].children;
      for (var c = 0; c < cells.length; c++) {
        cells[c].style.display = state.hiddenCols[c] ? 'none' : '';
      }
    }
    // Rebuild column menu buttons on headers
    rebuildHeaderMenuButtons(table);
  }

  /* ── Open Manage Columns ─────────────────────────────────────────────────── */
  function openManageColumns(table) {
    var state = getState(table);
    var thead = table.querySelector('thead');
    if (!thead) return;
    var headerRow = thead.querySelector('tr:first-child');
    if (!headerRow) return;
    var ths = Array.prototype.slice.call(headerRow.children);

    // Backdrop
    var backdrop = document.createElement('div');
    backdrop.className = 'mui-manage-columns-backdrop';

    // Dialog
    var dialog = document.createElement('div');
    dialog.className = 'mui-manage-columns-dialog';

    var header = document.createElement('div');
    header.className = 'mui-manage-columns-header';

    var title = document.createElement('span');
    title.className = 'mui-manage-columns-title';
    title.textContent = t('Manage Columns', 'إدارة الأعمدة');

    var closeBtn = document.createElement('button');
    closeBtn.className = 'mui-manage-columns-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.title = t('Close', 'إغلاق');
    closeBtn.addEventListener('click', function () {
      document.body.removeChild(backdrop);
      document.body.removeChild(dialog);
    });

    header.appendChild(title);
    header.appendChild(closeBtn);

    var colList = document.createElement('div');
    colList.className = 'mui-manage-columns-list';

    ths.forEach(function (th, colIdx) {
      if (isIgnoredCol(th)) return;
      var colTitle = (th.textContent || th.innerText || '').trim().replace(/\s+/g, ' ');
      if (!colTitle) return;

      var item = document.createElement('label');
      item.className = 'mui-manage-column-item';

      var chk = document.createElement('input');
      chk.type = 'checkbox';
      chk.checked = !state.hiddenCols[colIdx];
      chk.addEventListener('change', function () {
        if (chk.checked) {
          delete state.hiddenCols[colIdx];
        } else {
          state.hiddenCols[colIdx] = true;
        }
        applyColumnVisibility(table);
        updateHeaderIndicators(table);
      });

      var label = document.createElement('span');
      label.textContent = colTitle;

      item.appendChild(chk);
      item.appendChild(label);
      colList.appendChild(item);
    });

    var footer = document.createElement('div');
    footer.className = 'mui-manage-columns-footer';

    var showAllBtn = document.createElement('button');
    showAllBtn.className = 'mui-btn-show-all';
    showAllBtn.textContent = t('Show All Columns', 'إظهار جميع الأعمدة');
    showAllBtn.addEventListener('click', function () {
      state.hiddenCols = {};
      applyColumnVisibility(table);
      // Uncheck all checkboxes
      var checks = colList.querySelectorAll('input[type=checkbox]');
      checks.forEach(function (c) { c.checked = true; });
    });

    footer.appendChild(showAllBtn);

    dialog.appendChild(header);
    dialog.appendChild(colList);
    dialog.appendChild(footer);

    backdrop.addEventListener('click', function () {
      document.body.removeChild(backdrop);
      document.body.removeChild(dialog);
    });

    document.body.appendChild(backdrop);
    document.body.appendChild(dialog);
  }

  /* ── Update TH Indicators ────────────────────────────────────────────────── */
  function updateHeaderIndicators(table) {
    var state = getState(table);
    var thead = table.querySelector('thead');
    if (!thead) return;
    var headerRow = thead.querySelector('tr:first-child');
    if (!headerRow) return;
    var ths = Array.prototype.slice.call(headerRow.children);

    ths.forEach(function (th, colIdx) {
      var filterInd = th.querySelector('.th-indicator-filter');
      var sortInd   = th.querySelector('.th-indicator-sort');

      if (filterInd) {
        filterInd.classList.toggle('active', !!state.filters[colIdx]);
      }
      if (sortInd) {
        var isSorted = state.sort && state.sort.colIdx === colIdx;
        sortInd.classList.toggle('active', !!isSorted);
        if (isSorted) {
          sortInd.innerHTML = state.sort.dir === 'asc'
            ? '<i class="fa fa-arrow-up" style="font-size:10px;"></i>'
            : '<i class="fa fa-arrow-down" style="font-size:10px;"></i>';
        }
      }

      // Add is-filtered/is-sorted classes
      th.classList.toggle('is-filtered', !!state.filters[colIdx]);
      th.classList.toggle('is-sorted', !!(state.sort && state.sort.colIdx === colIdx));
    });
  }

  /* ── Update Toolbar Counter ──────────────────────────────────────────────── */
  function updateToolbarCounter(table) {
    var toolbar = table._featuresToolbar;
    if (!toolbar) return;
    var counter = toolbar.querySelector('.table-rows-counter');
    if (!counter) return;

    var total = table._totalCount != null ? table._totalCount : countDataRows(table);
    var state = getState(table);
    var hasFilter = Object.keys(state.filters).some(function (k) { return state.filters[k]; });

    if (hasFilter) {
      var visible = table._visibleCount != null ? table._visibleCount : total;
      counter.innerHTML = '<i class="fa fa-filter"></i> ' +
        t('Showing', 'عرض') + ' <strong>' + visible + '</strong> ' + t('of', 'من') + ' ' + total;
    } else {
      counter.innerHTML = '<i class="fa fa-table"></i> <strong>' + total + '</strong> ' + t('rows', 'صفوف');
    }

    var resetBtn = toolbar.querySelector('.btn-table-reset-filters');
    if (resetBtn) {
      resetBtn.style.display = hasFilter ? 'inline-flex' : 'none';
    }
  }

  function countDataRows(table) {
    var tbody = table.querySelector('tbody');
    if (!tbody) return 0;
    var rows = tbody.querySelectorAll('tr:not(.col-filter-no-match-row)');
    var count = 0;
    for (var i = 0; i < rows.length; i++) {
      var td = rows[i].querySelector('td');
      if (!td || td.colSpan <= 3) count++;
    }
    return count;
  }

  /* ── Build Column Menu Buttons in Headers ────────────────────────────────── */
  function rebuildHeaderMenuButtons(table) {
    var thead = table.querySelector('thead');
    if (!thead) return;
    var headerRow = thead.querySelector('tr:first-child');
    if (!headerRow) return;
    var ths = Array.prototype.slice.call(headerRow.children);

    ths.forEach(function (th, colIdx) {
      if (isIgnoredCol(th)) return;
      // If menu button already present, skip
      if (th.querySelector('.col-menu-btn')) return;

      var existingText = (th.querySelector('.th-label-text') || th).textContent || '';
      existingText = existingText.trim().replace(/\s+/g, ' ');
      th.innerHTML = '';
      th.setAttribute('data-col-menu-built', '1');
      th.classList.add('th-has-menu');

      var wrapper = document.createElement('div');
      wrapper.className = 'th-content-wrapper';

      var labelGroup = document.createElement('div');
      labelGroup.className = 'th-label-group';

      var labelSpan = document.createElement('span');
      labelSpan.className = 'th-label-text';
      labelSpan.textContent = existingText;

      var indicators = document.createElement('span');
      indicators.className = 'th-indicators';
      indicators.innerHTML =
        '<span class="th-indicator-sort"></span>' +
        '<span class="th-indicator-filter"><i class="fa fa-filter" style="font-size:10px;"></i></span>';

      labelGroup.appendChild(labelSpan);
      labelGroup.appendChild(indicators);

      var menuBtn = document.createElement('button');
      menuBtn.type = 'button';
      menuBtn.className = 'col-menu-btn';
      menuBtn.title = t('Column options', 'خيارات العمود');
      menuBtn.innerHTML = ICON_MENU;

      wrapper.appendChild(labelGroup);
      wrapper.appendChild(menuBtn);
      th.appendChild(wrapper);

      menuBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        e.preventDefault();
        if (_activeMenu && _activeColIdx === colIdx && _activeTable === table) {
          closeMenu();
        } else {
          showColumnMenu(table, th, colIdx, menuBtn);
          menuBtn.classList.add('active');
        }
      });

      th.addEventListener('tf-menu-close', function () {
        menuBtn.classList.remove('active');
      });
    });
  }

  /* ── Build Toolbar ───────────────────────────────────────────────────────── */
  function buildToolbar(table) {
    if (table._featuresToolbar && table._featuresToolbar.parentNode) return table._featuresToolbar;

    var toolbar = document.createElement('div');
    toolbar.className = 'table-features-toolbar';

    var leftGroup = document.createElement('div');
    leftGroup.className = 'table-features-toolbar-left';

    var counter = document.createElement('span');
    counter.className = 'table-rows-counter';
    counter.innerHTML = '<i class="fa fa-table"></i> <strong>0</strong> ' + t('rows', 'صفوف');
    leftGroup.appendChild(counter);

    var resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.className = 'btn-table-reset-filters';
    resetBtn.style.display = 'none';
    resetBtn.innerHTML = '<i class="fa fa-times-circle"></i> ' + t('Clear Filters', 'إعادة ضبط الفلاتر');
    resetBtn.addEventListener('click', function () {
      var state = getState(table);
      state.filters = {};
      applyTableState(table);
      updateHeaderIndicators(table);
      updateToolbarCounter(table);
    });
    leftGroup.appendChild(resetBtn);

    var rightGroup = document.createElement('div');
    rightGroup.className = 'table-features-toolbar-right';

    var manageBtn = document.createElement('button');
    manageBtn.type = 'button';
    manageBtn.className = 'btn-table-manage-cols';
    manageBtn.innerHTML = ICON_MGMT.replace('class="MuiSvgIcon-root"', 'class="MuiSvgIcon-root" style="width:15px;height:15px;margin-inline-end:6px;"') +
      t('Columns', 'الأعمدة');
    manageBtn.addEventListener('click', function () {
      openManageColumns(table);
    });
    rightGroup.appendChild(manageBtn);

    var excelBtn = document.createElement('button');
    excelBtn.type = 'button';
    excelBtn.className = 'btn-table-excel';
    excelBtn.innerHTML = '<i class="fa fa-file-excel-o"></i> ' + t('Export Excel', 'تصدير إكسيل');
    excelBtn.title = t('Download Table as Excel (.xlsx)', 'تحميل الجدول كملف إكسيل (.xlsx)');
    excelBtn.addEventListener('click', function (e) {
      e.preventDefault();
      var orig = excelBtn.innerHTML;
      excelBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> ' + t('Exporting...', 'جار التصدير...');
      excelBtn.disabled = true;
      setTimeout(function () {
        try { window.exportTableToExcel(table); } catch (err) { console.error(err); }
        excelBtn.innerHTML = orig;
        excelBtn.disabled = false;
      }, 50);
    });
    rightGroup.appendChild(excelBtn);

    toolbar.appendChild(leftGroup);
    toolbar.appendChild(rightGroup);

    var container = table.closest('.table-responsive') || table;
    if (container.parentNode) container.parentNode.insertBefore(toolbar, container);

    table._featuresToolbar = toolbar;
    return toolbar;
  }

  /* ── Excel Export ────────────────────────────────────────────────────────── */
  window.exportTableToExcel = function (tableOrId, customFileName) {
    var table = typeof tableOrId === 'string' ? document.querySelector(tableOrId) : tableOrId;
    if (!table || table.tagName !== 'TABLE') { console.warn('exportTableToExcel: table not found'); return; }

    var thead = table.querySelector('thead');
    var tbody = table.querySelector('tbody');
    if (!thead || !tbody) return;

    var headerRow = thead.querySelector('tr:first-child');
    if (!headerRow) return;
    var ths = Array.prototype.slice.call(headerRow.children);
    var state = getState(table);

    var exportCols = [];
    ths.forEach(function (th, colIdx) {
      if (isIgnoredCol(th)) return;
      if (state.hiddenCols[colIdx]) return;
      var label = (th.querySelector('.th-label-text') || th).textContent.trim().replace(/\s+/g, ' ');
      exportCols.push({ idx: colIdx, title: label || ('Col ' + (colIdx + 1)) });
    });

    if (!exportCols.length) return;

    var aoa = [exportCols.map(function (c) { return c.title; })];
    var rows = tbody.querySelectorAll('tr');
    var dataCount = 0;

    for (var r = 0; r < rows.length; r++) {
      var tr = rows[r];
      if (tr.style.display === 'none' || tr.classList.contains('col-filter-no-match-row')) continue;
      var td0 = tr.querySelector('td');
      if (td0 && td0.colSpan > 3) continue;

      var rowData = [];
      var hasContent = false;
      exportCols.forEach(function (c) {
        var td = tr.children[c.idx];
        if (!td) { rowData.push(''); return; }
        var clone = td.cloneNode(true);
        var remove = clone.querySelectorAll('.btn, button, [style*="display:none"], .hidden, script');
        for (var i = 0; i < remove.length; i++) remove[i].parentNode.removeChild(remove[i]);
        var text = (clone.textContent || clone.innerText || '').trim().replace(/\s+/g, ' ');
        var num = /^-?\d+(\.\d+)?$/.test(text) && text.length < 14 && !/^0\d/.test(text) ? Number(text) : null;
        if (num !== null && !isNaN(num)) { rowData.push(num); hasContent = true; return; }
        if (text) hasContent = true;
        rowData.push(text);
      });
      if (hasContent) { aoa.push(rowData); dataCount++; }
    }

    if (!dataCount) { alert(t('No data to export', 'لا توجد بيانات للتصدير')); return; }

    loadXlsx().then(function (XLSX) {
      var ws = XLSX.utils.aoa_to_sheet(aoa);
      if (isRtl()) ws['!views'] = [{ rightToLeft: true }];
      ws['!cols'] = exportCols.map(function (c, i) {
        var max = aoa[0][i].length;
        for (var j = 1; j < aoa.length; j++) {
          var l = String(aoa[j][i] || '').length;
          if (l > max) max = l;
        }
        return { wch: Math.min(Math.max(max + 4, 12), 42) };
      });
      var wb = XLSX.utils.book_new();
      var sheetName = (table.id || 'Sheet').substring(0, 31).replace(/[\\/?*[\]]/g, '_');
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      var today = new Date().toISOString().split('T')[0];
      var fname = customFileName || ((table.id || 'export').replace(/[^a-zA-Z0-9_\u0600-\u06FF-]/g, '_') + '_' + today + '.xlsx');
      if (!fname.toLowerCase().endsWith('.xlsx')) fname += '.xlsx';
      XLSX.writeFile(wb, fname);
    }).catch(function (err) {
      console.error(err);
      alert(t('Export failed. Check CDN connection.', 'فشل التصدير. تحقق من الاتصال.'));
    });
  };

  /* ── Enhance Single Table ────────────────────────────────────────────────── */
  function enhanceTable(table) {
    if (!table || table.hasAttribute('data-no-table-features')) return;
    if (table.closest('.note-editor') || table.closest('.datepicker')) return;
    if ((table.classList.contains('p-table') && table.id === 'printTable')) return;

    var thead = table.querySelector('thead');
    var tbody = table.querySelector('tbody');
    if (!thead || !tbody) return;
    var headerRow = thead.querySelector('tr:first-child');
    if (!headerRow || headerRow.children.length === 0) return;

    if (table.getAttribute('data-table-features-init') === 'true') {
      // Re-run on data refresh
      rebuildHeaderMenuButtons(table);
      applyTableState(table);
      updateHeaderIndicators(table);
      updateToolbarCounter(table);
      return;
    }

    table.setAttribute('data-table-features-init', 'true');
    buildToolbar(table);
    rebuildHeaderMenuButtons(table);
    applyTableState(table);
    updateHeaderIndicators(table);
    updateToolbarCounter(table);

    // Watch thead for dynamic header/translation updates
    var theadObs = new MutationObserver(debounce(function () {
      rebuildHeaderMenuButtons(table);
      updateHeaderIndicators(table);
    }, 60));
    theadObs.observe(thead, { childList: true, subtree: true });

    // Watch tbody for AJAX updates
    var tbodyObs = new MutationObserver(debounce(function () {
      table._originalRows = null; // reset sort cache
      applyTableState(table);
      updateHeaderIndicators(table);
      updateToolbarCounter(table);
    }, 80));
    tbodyObs.observe(tbody, { childList: true });
  }

  /* ── Scan and Enhance All Tables ─────────────────────────────────────────── */
  function scanAndEnhanceTables(root) {
    var context = root || document;
    var tables = context.querySelectorAll('table');
    for (var i = 0; i < tables.length; i++) enhanceTable(tables[i]);
  }

  window.initTableFeatures = function (el) { el ? enhanceTable(el) : scanAndEnhanceTables(); };

  /* ── Global Click Handler (close menu on outside click) ──────────────────── */
  document.addEventListener('click', function (e) {
    if (_activeMenu && !_activeMenu.contains(e.target)) {
      closeMenu();
    }
  }, true);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && _activeMenu) closeMenu();
  });

  /* ── Init ────────────────────────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { scanAndEnhanceTables(); });
  } else {
    scanAndEnhanceTables();
  }

  // Watch for new tables inserted via AJAX/JS
  var bodyObs = new MutationObserver(debounce(function (mutations) {
    mutations.forEach(function (m) {
      m.addedNodes.forEach(function (node) {
        if (node.nodeType !== 1) return;
        if (node.tagName === 'TABLE') enhanceTable(node);
        else if (typeof node.querySelectorAll === 'function') {
          node.querySelectorAll('table').forEach(function (t) { enhanceTable(t); });
        }
      });
    });
  }, 200));

  if (document.body) {
    bodyObs.observe(document.body, { childList: true, subtree: true });
  } else {
    document.addEventListener('DOMContentLoaded', function () {
      bodyObs.observe(document.body, { childList: true, subtree: true });
    });
  }

  // Preload SheetJS
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(function () { loadXlsx().catch(function () {}); });
  } else {
    setTimeout(function () { loadXlsx().catch(function () {}); }, 1500);
  }

})();
