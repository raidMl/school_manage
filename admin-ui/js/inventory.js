/**
 * inventory.js — School Inventory Management (العتاد والجرد)
 * Handles CRUD for school materials & equipment.
 */
(function () {
  'use strict';

  /* ─── API helpers ────────────────────────────────────────────────────────── */
  var TOKEN_KEY = 'school_system_token';
  function getToken() { return localStorage.getItem(TOKEN_KEY); }
  function apiBase() {
    var l = window.location;
    return (l.hostname === 'localhost' || l.hostname === '127.0.0.1')
      ? l.protocol + '//' + l.hostname + ':5000' : '';
  }
  function request(path, opts) {
    opts = Object.assign({ headers: {} }, opts || {});
    if (getToken()) opts.headers['Authorization'] = 'Bearer ' + getToken();
    if (opts.body && typeof opts.body === 'string') opts.headers['Content-Type'] = 'application/json';
    return fetch(apiBase() + path, opts).then(function (res) {
      if (!res.ok) return res.json().catch(function () { return { message: 'Request failed' }; })
        .then(function (p) { throw new Error(p.message || 'Request failed'); });
      if (res.status === 204) return null;
      return res.json();
    });
  }

  /* ─── i18n helper ────────────────────────────────────────────────────────── */
  function t(key) {
    if (window.AppI18n && typeof window.AppI18n.t === 'function') return window.AppI18n.t(key);
    return key;
  }
  function tr(el) {
    if (window.AppI18n && el) window.AppI18n.translateAll(el);
  }

  /* ─── DOM helpers ────────────────────────────────────────────────────────── */
  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function fmtDate(val) {
    if (!val) return '—';
    return String(val).split('T')[0].split(' ')[0] || '—';
  }
  function setText(id, val) { var el = document.getElementById(id); if (el) el.textContent = val; }
  function showAlert(id, msg, type) {
    var el = document.getElementById(id);
    if (!el) return;
    el.className = 'alert alert-' + (type || 'danger');
    el.textContent = t(msg);
    el.style.display = 'block';
  }
  function hideAlert(id) {
    var el = document.getElementById(id);
    if (el) el.style.display = 'none';
  }
  function setVal(id, val) { var el = document.getElementById(id); if (el) el.value = val == null ? '' : val; }
  function getVal(id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; }

  /* ─── State ──────────────────────────────────────────────────────────────── */
  var allItems = [];
  var pendingDeleteId = null;

  /* ─── Status badge helper ────────────────────────────────────────────────── */
  function statusBadge(status) {
    if (!status) return '<span class="status-badge default">—</span>';
    var s = status.toLowerCase();
    var cls = 'default';
    if (s === 'good' || s === 'جيد') cls = 'good';
    else if (s === 'bad' || s === 'سيء' || s.indexOf('تالف') !== -1) cls = 'bad';
    else if (s.indexOf('maint') !== -1 || s.indexOf('صيانة') !== -1) cls = 'maint';
    return '<span class="status-badge ' + cls + '">' + esc(status) + '</span>';
  }

  /* ─── Load & render ──────────────────────────────────────────────────────── */
  function loadInventory(filters) {
    filters = filters || {};
    var params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.type)   params.append('type',   filters.type);
    if (filters.status) params.append('status', filters.status);

    var url = '/api/inventory' + (params.toString() ? '?' + params.toString() : '');

    var tbody = document.getElementById('inv-tbody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="8" class="text-center" style="padding:40px;color:#94a3b8">Loading...</td></tr>';

    request(url)
      .then(function (data) {
        allItems = data.data || [];
        renderTable(allItems);
        updateStats(allItems);
        populateFilterDropdowns(allItems);
      })
      .catch(function (err) {
        if (tbody) tbody.innerHTML = '<tr><td colspan="8" class="text-center text-danger" style="padding:30px;">' + esc(err.message) + '</td></tr>';
      });
  }

  function renderTable(items) {
    var tbody = document.getElementById('inv-tbody');
    var countBadge = document.getElementById('inv-count');
    if (!tbody) return;
    if (countBadge) countBadge.textContent = items.length;

    if (!items.length) {
      tbody.innerHTML = '<tr><td colspan="8"><div class="inv-empty">' +
        '<i class="fa fa-archive"></i>' +
        '<p>' + t('No inventory items found. Add your first item.') + '</p>' +
        '</div></td></tr>';
      return;
    }

    var rows = items.map(function (item, idx) {
      var addedBy = item.added_by_name ? esc(item.added_by_name + ' ' + (item.added_by_last || '')) : '—';
      return '<tr>' +
        '<td style="color:#94a3b8;font-size:12px;font-weight:600;">' + (idx + 1) + '</td>' +
        '<td style="font-weight:600;">' + esc(item.name) + '</td>' +
        '<td><span style="background:#f1f5f9;border-radius:7px;padding:3px 10px;font-size:12px;font-weight:600;color:#475569;">' + esc(item.type || '—') + '</span></td>' +
        '<td><span class="qty-chip">' + esc(item.quantity) + '</span></td>' +
        '<td>' + esc(item.emplacement || '—') + '</td>' +
        '<td>' + statusBadge(item.status) + '</td>' +
        '<td style="color:#64748b;font-size:12.5px;">' + fmtDate(item.added_date) + '</td>' +
        '<td><div class="tbl-actions">' +
          '<button class="tbl-btn edit" title="' + t('Edit Item') + '" onclick="InvPage.editItem(' + item.id + ')">' +
            '<i class="fa fa-pencil"></i>' +
          '</button>' +
          '<button class="tbl-btn del" title="' + t('Delete Item') + '" onclick="InvPage.deleteItem(' + item.id + ')">' +
            '<i class="fa fa-trash"></i>' +
          '</button>' +
        '</div></td>' +
        '</tr>';
    });

    tbody.innerHTML = rows.join('');
    tr(tbody);
  }

  function updateStats(items) {
    var totalQty = 0;
    var goodCount = 0;
    var attentionCount = 0;

    items.forEach(function (item) {
      totalQty += parseInt(item.quantity) || 0;
      var s = (item.status || '').toLowerCase();
      if (s === 'good' || s === 'جيد') { goodCount++; }
      else if (s) { attentionCount++; }
    });

    setText('stat-total-items', items.length);
    setText('stat-total-qty', totalQty);
    setText('stat-good', goodCount);
    setText('stat-attention', attentionCount);
  }

  function populateFilterDropdowns(items) {
    // Collect unique types
    var types   = [];
    var statuses = [];
    items.forEach(function (item) {
      if (item.type && types.indexOf(item.type) === -1) types.push(item.type);
      if (item.status && statuses.indexOf(item.status) === -1) statuses.push(item.status);
    });

    var typeEl   = document.getElementById('inv-filter-type');
    var statusEl = document.getElementById('inv-filter-status');
    var typeDatalist = document.getElementById('inv-type-datalist');

    if (typeEl) {
      var curType = typeEl.value;
      typeEl.innerHTML = '<option value="" data-i18n="All Types">' + t('All Types') + '</option>' +
        types.map(function (tp) { return '<option value="' + esc(tp) + '">' + esc(tp) + '</option>'; }).join('');
      typeEl.value = curType;
    }
    if (statusEl) {
      var curStatus = statusEl.value;
      statusEl.innerHTML = '<option value="" data-i18n="All Statuses">' + t('All Statuses') + '</option>' +
        statuses.map(function (st) { return '<option value="' + esc(st) + '">' + esc(st) + '</option>'; }).join('');
      statusEl.value = curStatus;
    }
    if (typeDatalist) {
      typeDatalist.innerHTML = types.map(function (tp) { return '<option value="' + esc(tp) + '">'; }).join('');
    }
  }

  /* ─── Add / Edit Modal ───────────────────────────────────────────────────── */
  function openAddModal() {
    document.getElementById('inv-edit-id').value = '';
    document.getElementById('inv-modal-title').innerHTML =
      '<i class="fa fa-plus-circle" style="margin-inline-end:8px;"></i>' + t('Add Item');
    document.getElementById('inv-form').reset();
    setVal('inv-date', new Date().toISOString().split('T')[0]);
    hideAlert('inv-form-status');
    $('#inv-modal').modal('show');
  }

  function openEditModal(id) {
    var item = allItems.find(function (i) { return i.id == id; });
    if (!item) return;

    document.getElementById('inv-edit-id').value = id;
    document.getElementById('inv-modal-title').innerHTML =
      '<i class="fa fa-pencil" style="margin-inline-end:8px;"></i>' + t('Edit Item');

    setVal('inv-name', item.name);
    setVal('inv-type', item.type || '');
    setVal('inv-qty', item.quantity);
    setVal('inv-emplacement', item.emplacement || '');
    setVal('inv-status', item.status || '');
    setVal('inv-date', fmtDate(item.added_date));
    hideAlert('inv-form-status');
    $('#inv-modal').modal('show');
  }

  function saveItem(e) {
    e.preventDefault();
    var id = document.getElementById('inv-edit-id').value;
    var name = getVal('inv-name');
    var qty  = document.getElementById('inv-qty').value;

    if (!name) { showAlert('inv-form-status', 'Item Name is required', 'danger'); return; }
    if (qty === '' || isNaN(qty) || parseInt(qty) < 0) { showAlert('inv-form-status', 'Valid quantity is required', 'danger'); return; }

    var payload = {
      name:        name,
      type:        getVal('inv-type') || null,
      quantity:    parseInt(qty),
      emplacement: getVal('inv-emplacement') || null,
      status:      getVal('inv-status') || null,
      added_date:  getVal('inv-date') || null
    };

    var isEdit = !!id;
    var url    = isEdit ? '/api/inventory/' + id : '/api/inventory';
    var method = isEdit ? 'PUT' : 'POST';

    var btn = document.getElementById('btn-inv-save');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa fa-spin fa-spinner"></i>'; }
    hideAlert('inv-form-status');

    request(url, { method: method, body: JSON.stringify(payload) })
      .then(function () {
        $('#inv-modal').modal('hide');
        loadInventory();
        if (window.SchoolBackend && typeof window.SchoolBackend.showToast === 'function') {
          window.SchoolBackend.showToast(t(isEdit ? 'Item updated successfully!' : 'Item added successfully!'), 'success');
        }
      })
      .catch(function (err) {
        showAlert('inv-form-status', err.message, 'danger');
      })
      .finally(function () {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa fa-save"></i> ' + t('Save Item'); }
      });
  }

  /* ─── Delete ─────────────────────────────────────────────────────────────── */
  function openDeleteModal(id) {
    pendingDeleteId = id;
    $('#inv-del-modal').modal('show');
  }

  function confirmDelete() {
    if (!pendingDeleteId) return;
    var id = pendingDeleteId;
    pendingDeleteId = null;
    $('#inv-del-modal').modal('hide');

    request('/api/inventory/' + id, { method: 'DELETE' })
      .then(function () {
        loadInventory();
        if (window.SchoolBackend && typeof window.SchoolBackend.showToast === 'function') {
          window.SchoolBackend.showToast(t('Item deleted successfully!'), 'success');
        }
      })
      .catch(function (err) {
        alert(err.message);
      });
  }

  /* ─── Filters ────────────────────────────────────────────────────────────── */
  function applyFilters() {
    loadInventory({
      search: document.getElementById('inv-search') ? document.getElementById('inv-search').value.trim() : '',
      type:   document.getElementById('inv-filter-type') ? document.getElementById('inv-filter-type').value : '',
      status: document.getElementById('inv-filter-status') ? document.getElementById('inv-filter-status').value : ''
    });
  }

  function resetFilters() {
    setVal('inv-search', '');
    setVal('inv-filter-type', '');
    setVal('inv-filter-status', '');
    loadInventory();
  }

  /* ─── Init ───────────────────────────────────────────────────────────────── */
  function init() {
    // Add item button
    var btnAdd = document.getElementById('btn-add-item');
    if (btnAdd) btnAdd.addEventListener('click', openAddModal);

    // Refresh
    var btnRefresh = document.getElementById('btn-refresh-inv');
    if (btnRefresh) btnRefresh.addEventListener('click', function () { loadInventory(); });

    // Form submit
    var form = document.getElementById('inv-form');
    if (form) form.addEventListener('submit', saveItem);

    // Filter apply
    var btnFilter = document.getElementById('btn-inv-filter');
    if (btnFilter) btnFilter.addEventListener('click', applyFilters);

    // Filter reset
    var btnReset = document.getElementById('btn-inv-reset');
    if (btnReset) btnReset.addEventListener('click', resetFilters);

    // Live search on Enter
    var searchEl = document.getElementById('inv-search');
    if (searchEl) {
      searchEl.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') applyFilters();
      });
    }

    // Delete confirm
    var btnDel = document.getElementById('btn-confirm-del-item');
    if (btnDel) btnDel.addEventListener('click', confirmDelete);

    // Expose for inline onclick handlers
    window.InvPage = {
      editItem:   openEditModal,
      deleteItem: openDeleteModal
    };

    // Initial load
    loadInventory();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
