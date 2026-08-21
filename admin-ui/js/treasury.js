/**
 * treasury.js — Treasury Management (تسيير الخزينة)
 * Handles income & expense tracking for the school.
 */
(function () {
  'use strict';

  var TOKEN_KEY = 'school_system_token';
  function getToken() { return localStorage.getItem(TOKEN_KEY); }
  function base() {
    var l = window.location;
    return (l.hostname === 'localhost' || l.hostname === '127.0.0.1')
      ? l.protocol + '//' + l.hostname + ':5000' : '';
  }
  function request(path, opts) {
    opts = Object.assign({ headers: {} }, opts);
    if (getToken()) opts.headers['Authorization'] = 'Bearer ' + getToken();
    if (opts.body && typeof opts.body === 'string') opts.headers['Content-Type'] = 'application/json';
    return fetch(base() + path, opts).then(function (res) {
      if (!res.ok) return res.json().catch(function () { return { message: 'Request failed' }; })
        .then(function (p) { throw new Error(p.message || 'Request failed'); });
      if (res.status === 204) return null;
      return res.json();
    });
  }
  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function fmtDate(val) {
    if (!val) return '-';
    return String(val).split('T')[0].split(' ')[0] || '-';
  }
  function fmtMoney(n) { return Number(n || 0).toFixed(2); }
  function setText(id, val) { var el = document.getElementById(id); if (el) el.textContent = val; }
  function showAlert(sel, msg, type) {
    var el = typeof sel === 'string' ? document.querySelector(sel) : sel;
    if (!el) return;
    el.className = 'alert alert-' + (type || 'danger');
    el.textContent = msg; el.style.display = 'block';
  }
  function hideAlert(sel) {
    var el = typeof sel === 'string' ? document.querySelector(sel) : sel;
    if (el) el.style.display = 'none';
  }
  function tr(elOrId) {
    if (window.AppI18n) {
      var el = typeof elOrId === 'string' ? document.getElementById(elOrId) : elOrId;
      if (el) window.AppI18n.translateAll(el);
    }
  }

  /* ─── state ──────────────────────────────────────────────────────────── */
  var allTransactions = [];
  var activeTab = 'tab-add-transaction';

  /* ═══════════════════════════════════════════════════════════════════════
     LOAD DATA
  ═══════════════════════════════════════════════════════════════════════ */
  function loadTreasury(opts) {
    opts = opts || {};
    var params = new URLSearchParams();
    if (opts.dateStart) params.append('date_start', opts.dateStart);
    if (opts.dateEnd)   params.append('date_end',   opts.dateEnd);
    if (opts.type)      params.append('type',       opts.type);

    var url = '/api/treasury' + (params.toString() ? '?' + params.toString() : '');

    request(url).then(function (p) {
      allTransactions = p.data || [];
      var s = p.summary || {};

      // Update stat cards
      setText('stat-total-income',  fmtMoney(s.total_income));
      setText('stat-total-expense', fmtMoney(s.total_expense));
      setText('stat-balance',       fmtMoney(s.balance));

      // Render history table
      renderHistory(allTransactions);
    }).catch(function (err) {
      console.error('Treasury load error:', err);
    });
  }

  /* ═══════════════════════════════════════════════════════════════════════
     RENDER HISTORY TABLE
  ═══════════════════════════════════════════════════════════════════════ */
  function renderHistory(rows) {
    var tbody = document.querySelector('#treasury-history-table tbody');
    if (!tbody) return;

    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="8"><div style="text-align:center;padding:40px 20px;color:#8a96a8">' +
        '<i class="fa fa-inbox" style="font-size:48px;margin-bottom:12px;opacity:.4;display:block"></i>' +
        '<p style="font-size:14px">No transactions found.</p></div></td></tr>';
      return;
    }

    tbody.innerHTML = rows.map(function (r, i) {
      var by = [r.recorded_by_name, r.recorded_by_last].filter(Boolean).join(' ') || '-';
      var typeBadge = r.type === 'income'
        ? '<span class="badge-income"><i class="fa fa-arrow-down"></i> <span data-i18n="Income">Income</span></span>'
        : '<span class="badge-expense"><i class="fa fa-arrow-up"></i> <span data-i18n="Expense">Expense</span></span>';
      var amountStyle = r.type === 'income' ? 'color:#10b981' : 'color:#ef4444';

      var deleteBtn = r.source_table === 'treasury'
        ? '<button class="btn btn-xs btn-danger" data-del-tx="' + r.id + '" title="Delete"><i class="fa fa-trash"></i></button>'
        : '<span style="font-size:11px;color:#8a96a8;background:#f1f5f9;padding:2px 6px;border-radius:4px" data-i18n="Auto-added">Auto-added</span>';

      var catHtml = r.category ? '<span data-i18n="' + esc(r.category) + '">' + esc(r.category) + '</span>' : '-';

      return '<tr>' +
        '<td>' + (i + 1) + '</td>' +
        '<td>' + typeBadge + '</td>' +
        '<td><strong style="' + amountStyle + '">' + (r.type === 'income' ? '+ ' : '- ') + fmtMoney(r.amount) + '</strong></td>' +
        '<td>' + catHtml + '</td>' +
        '<td>' + esc(fmtDate(r.transaction_date)) + '</td>' +
        '<td style="max-width:160px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(r.notes || '-') + '</td>' +
        '<td>' + esc(by) + '</td>' +
        '<td>' + deleteBtn + '</td>' +
        '</tr>';
    }).join('');

    tr(tbody);

    // Bind delete buttons
    tbody.querySelectorAll('[data-del-tx]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openDeleteConfirm(this.getAttribute('data-del-tx'));
      });
    });
  }

  /* ═══════════════════════════════════════════════════════════════════════
     TABS
  ═══════════════════════════════════════════════════════════════════════ */
  function initTabs() {
    document.querySelectorAll('.pay-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        var id = this.getAttribute('data-tab');
        document.querySelectorAll('.pay-tab').forEach(function (t) { t.classList.remove('active'); });
        document.querySelectorAll('.tab-pane').forEach(function (p) { p.style.display = 'none'; });
        this.classList.add('active');
        var pane = document.getElementById(id);
        if (pane) { pane.style.display = 'block'; pane.classList.add('fade-in'); }
        activeTab = id;
      });
    });
  }

  /* ═══════════════════════════════════════════════════════════════════════
     FORM SUBMIT
  ═══════════════════════════════════════════════════════════════════════ */
  function bindForm() {
    var form = document.getElementById('treasury-form');
    if (!form) return;

    // Default date to today
    var dateInput = document.getElementById('tr-date');
    if (dateInput && !dateInput.value) dateInput.value = new Date().toISOString().slice(0, 10);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      hideAlert('#treasury-entry-status');

      var payload = {
        type:             document.getElementById('tr-type').value,
        amount:           parseFloat(document.getElementById('tr-amount').value),
        transaction_date: document.getElementById('tr-date').value,
        category:         document.getElementById('tr-category').value || null,
        notes:            document.getElementById('tr-notes').value || null
      };

      if (!payload.type) { showAlert('#treasury-entry-status', 'Please select a transaction type.'); return; }
      if (!payload.amount || payload.amount <= 0) { showAlert('#treasury-entry-status', 'Please enter a valid amount.'); return; }

      var btn = document.getElementById('btn-save-transaction');
      if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Saving...'; }

      request('/api/treasury', {
        method: 'POST',
        body: JSON.stringify(payload)
      }).then(function () {
        showAlert('#treasury-entry-status', 'Transaction saved successfully!', 'success');
        form.reset();
        if (dateInput) dateInput.value = new Date().toISOString().slice(0, 10);
        loadTreasury();
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa fa-save"></i> Save Transaction'; }
      }).catch(function (err) {
        showAlert('#treasury-entry-status', err.message);
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa fa-save"></i> Save Transaction'; }
      });
    });
  }

  /* ═══════════════════════════════════════════════════════════════════════
     FILTERS
  ═══════════════════════════════════════════════════════════════════════ */
  function bindFilters() {
    var btnFilter = document.getElementById('btn-hist-filter');
    var btnReset  = document.getElementById('btn-hist-reset');

    if (btnFilter) {
      btnFilter.addEventListener('click', function () {
        loadTreasury({
          type:      document.getElementById('hist-filter-type').value,
          dateStart: document.getElementById('hist-filter-date-start').value,
          dateEnd:   document.getElementById('hist-filter-date-end').value
        });
      });
    }

    if (btnReset) {
      btnReset.addEventListener('click', function () {
        document.getElementById('hist-filter-type').value       = '';
        document.getElementById('hist-filter-date-start').value = '';
        document.getElementById('hist-filter-date-end').value   = '';
        loadTreasury();
      });
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     DELETE MODAL
  ═══════════════════════════════════════════════════════════════════════ */
  var _deleteId = null;

  function openDeleteConfirm(id) {
    _deleteId = id;
    if (window.jQuery) $('#delete-tx-modal').modal('show');
  }

  function bindDeleteModal() {
    var btn = document.getElementById('btn-confirm-delete-tx');
    if (!btn) return;
    btn.addEventListener('click', function () {
      if (!_deleteId) return;
      btn.disabled = true;
      request('/api/treasury/' + _deleteId, { method: 'DELETE' }).then(function () {
        if (window.jQuery) $('#delete-tx-modal').modal('hide');
        _deleteId = null;
        btn.disabled = false;
        loadTreasury();
      }).catch(function (err) {
        alert('Error: ' + err.message);
        btn.disabled = false;
      });
    });
  }

  /* ═══════════════════════════════════════════════════════════════════════
     REFRESH BUTTON
  ═══════════════════════════════════════════════════════════════════════ */
  function bindRefresh() {
    var btn = document.getElementById('btn-refresh-treasury');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var icon = this.querySelector('.fa-refresh');
      if (icon) icon.classList.add('fa-spin');
      loadTreasury();
      setTimeout(function () { if (icon) icon.classList.remove('fa-spin'); }, 600);
    });
  }

  /* ═══════════════════════════════════════════════════════════════════════
     INIT
  ═══════════════════════════════════════════════════════════════════════ */
  document.addEventListener('DOMContentLoaded', function () {
    initTabs();
    bindForm();
    bindFilters();
    bindDeleteModal();
    bindRefresh();
    loadTreasury();
  });

})();
