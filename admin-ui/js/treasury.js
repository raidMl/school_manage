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
    var text = (window.AppI18n && typeof window.AppI18n.t === 'function') ? window.AppI18n.t(msg) : msg;
    el.textContent = text; el.style.display = 'block';
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
    if (typeof getSchoolInfo === 'function') getSchoolInfo();

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
      tbody.innerHTML = '<tr><td colspan="9"><div style="text-align:center;padding:40px 20px;color:#8a96a8">' +
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
        ? '<button class="btn btn-xs btn-danger" style="margin: 0 4px;" data-del-tx="' + r.id + '" title="Delete"><i class="fa fa-trash"></i></button>'
        : '<span style="font-size:11px;color:#8a96a8;background:#f1f5f9;padding:2px 6px;border-radius:4px" data-i18n="Auto-added">Auto-added</span>';

      var editBtn = r.source_table === 'treasury'
        ? '<button class="btn btn-xs btn-primary" style="margin: 0 4px;" data-edit-tx=\'' + JSON.stringify(r).replace(/'/g, "&#39;") + '\' title="Edit"><i class="fa fa-edit"></i></button>'
        : '';

      var catHtml = r.category ? '<span data-i18n="' + esc(r.category) + '">' + esc(r.category) + '</span>' : '-';
      
      var printBtn = '<button class="btn btn-xs btn-info" style="margin: 0 4px;" onclick=\'window.printReceipt(' + JSON.stringify(r).replace(/'/g, "&#39;") + ')\' title="Print Receipt"><i class="fa fa-print"></i></button>';

      return '<tr>' +
        '<td>' + (i + 1) + '</td>' +
        '<td>' + typeBadge + '</td>' +
        '<td><strong style="' + amountStyle + '">' + (r.type === 'income' ? '+ ' : '- ') + fmtMoney(r.amount) + '</strong></td>' +
        '<td>' + catHtml + '</td>' +
        '<td>' + esc(r.person_name || '-') + '</td>' +
        '<td>' + esc(fmtDate(r.transaction_date)) + '</td>' +
        '<td style="max-width:160px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(r.notes || '-') + '</td>' +
        '<td>' + esc(by) + '</td>' +
        '<td>' + printBtn + editBtn + deleteBtn + '</td>' +
        '</tr>';
    }).join('');

    tr(tbody);

    // Bind delete buttons
    tbody.querySelectorAll('[data-del-tx]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openDeleteConfirm(this.getAttribute('data-del-tx'));
      });
    });

    // Bind edit buttons
    tbody.querySelectorAll('[data-edit-tx]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openEditModal(JSON.parse(this.getAttribute('data-edit-tx')));
      });
    });
  }

  /* ═══════════════════════════════════════════════════════════════════════
     EDIT MODAL
  ═══════════════════════════════════════════════════════════════════════ */
  function openEditModal(tx) {
    if (!window.jQuery) return;
    document.getElementById('edit-tr-id').value = tx.id;
    document.getElementById('edit-tr-type').value = tx.type;
    document.getElementById('edit-tr-amount').value = tx.amount;
    
    // Format date for datetime-local
    var dateObj = new Date(tx.transaction_date);
    if (!isNaN(dateObj.getTime())) {
      dateObj.setMinutes(dateObj.getMinutes() - dateObj.getTimezoneOffset());
      document.getElementById('edit-tr-date').value = dateObj.toISOString().slice(0, 16);
    } else {
      document.getElementById('edit-tr-date').value = tx.transaction_date;
    }
    
    document.getElementById('edit-tr-category').value = tx.category || '';
    document.getElementById('edit-tr-person-name').value = tx.person_name || '';
    document.getElementById('edit-tr-notes').value = tx.notes || '';
    
    hideAlert('#edit-treasury-entry-status');
    $('#edit-tx-modal').modal('show');
  }

  function bindEditForm() {
    var form = document.getElementById('edit-treasury-form');
    if (!form) return;
    
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      hideAlert('#edit-treasury-entry-status');

      var txId = document.getElementById('edit-tr-id').value;
      var payload = {
        type:             document.getElementById('edit-tr-type').value,
        amount:           parseFloat(document.getElementById('edit-tr-amount').value),
        transaction_date: document.getElementById('edit-tr-date').value,
        category:         document.getElementById('edit-tr-category').value || null,
        notes:            document.getElementById('edit-tr-notes').value || null,
        person_name:      document.getElementById('edit-tr-person-name').value || null
      };

      if (!payload.type) { showAlert('#edit-treasury-entry-status', 'Please select a transaction type.'); return; }
      if (!payload.amount || payload.amount <= 0) { showAlert('#edit-treasury-entry-status', 'Please enter a valid amount.'); return; }

      var btn = document.getElementById('btn-save-edit-tx');
      if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Saving...'; }

      request('/api/treasury/' + txId, {
        method: 'PUT',
        body: JSON.stringify(payload)
      }).then(function (resp) {
        if (window.jQuery) $('#edit-tx-modal').modal('hide');
        loadTreasury();
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa fa-save"></i> Save'; }
      }).catch(function (err) {
        showAlert('#edit-treasury-entry-status', err.message);
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa fa-save"></i> Save'; }
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
        notes:            document.getElementById('tr-notes').value || null,
        person_name:      document.getElementById('tr-person-name') ? document.getElementById('tr-person-name').value || null : null
      };

      if (!payload.type) { showAlert('#treasury-entry-status', 'Please select a transaction type.'); return; }
      if (!payload.amount || payload.amount <= 0) { showAlert('#treasury-entry-status', 'Please enter a valid amount.'); return; }

      var btn = document.getElementById('btn-save-transaction');
      if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Saving...'; }

      request('/api/treasury', {
        method: 'POST',
        body: JSON.stringify(payload)
      }).then(function (resp) {
        var insertedId = (resp && resp.id) ? resp.id : '';
        var transactionToPrint = {
            id: insertedId,
            type: payload.type,
            amount: payload.amount,
            transaction_date: payload.transaction_date,
            category: payload.category,
            notes: payload.notes,
            person_name: payload.person_name
        };
        var printHtml = ' <button class="btn btn-sm btn-info" style="margin-left: 15px;" onclick=\'window.printReceipt(' + JSON.stringify(transactionToPrint).replace(/'/g, "&#39;") + ')\'><i class="fa fa-print"></i> Print وصل الدفع</button>';
        
        var alertEl = document.querySelector('#treasury-entry-status');
        if (alertEl) {
            alertEl.className = 'alert alert-success';
            alertEl.innerHTML = 'Transaction saved successfully!' + printHtml;
            alertEl.style.display = 'block';
        }
        
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
    var cachedSchool = null;
  function getSchoolInfo() {
    if (cachedSchool) return Promise.resolve(cachedSchool);
    if (window._ctx && window._ctx.school) {
      cachedSchool = window._ctx.school;
      return Promise.resolve(cachedSchool);
    }
    return request('/api/school-setup/settings').then(function (res) {
      if (res && res.school) cachedSchool = res.school;
      return cachedSchool;
    }).catch(function () {
      return null;
    });
  }

  function doPrintReceipt(transaction, school) {
    school = school || cachedSchool || (window._ctx && window._ctx.school) || {};

    var fallbackName = document.querySelector('#backend-school-name')
      ? document.querySelector('#backend-school-name').textContent.trim()
      : '';
    var fallbackLogo = document.querySelector('#sb-school-logo')
      ? document.querySelector('#sb-school-logo').src
      : '';

    var schoolName = (school && school.name && school.name.trim())
      ? school.name.trim()
      : (fallbackName || 'School System');

    var schoolLogoUrl = (school && school.logo && school.logo.trim())
      ? school.logo.trim()
      : '';
    if (!schoolLogoUrl && fallbackLogo && fallbackLogo.indexOf('loremflickr') === -1) {
      schoolLogoUrl = fallbackLogo;
    }
    if (!schoolLogoUrl) {
      schoolLogoUrl = 'img/logo/school-manager-logo.png';
    }

    // Zero-pad the id to 9 digits: e.g. TXN-000000003
    var rawId = String(transaction.id || '0');
    var paddedId = 'TXN-' + ('000000000' + rawId).slice(-9);

    // Format date (Algeria GMT+1)
    var dateObj = new Date(transaction.transaction_date);
    var dateString = isNaN(dateObj.getTime())
      ? String(transaction.transaction_date)
      : dateObj.toLocaleString('en-GB', {
          timeZone: 'Africa/Algiers',
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit', hour12: false
        });

    // QR payload encodes key payment fields
    var qrPayload = JSON.stringify({
      id:       paddedId,
      school:   schoolName,
      type:     transaction.type,
      category: transaction.category || '',
      amount:   transaction.amount,
      date:     dateString,
      person:   transaction.person_name || '',
      notes:    transaction.notes || '',
      by:       (transaction.recorded_by_name || '') + ' ' + (transaction.recorded_by_last || '')
    });

    function writeAndPrint(qrDataUrl) {
      var personLine = transaction.person_name
        ? '<div><strong>الاسم (Name):</strong> ' + esc(transaction.person_name) + '</div>'
        : '';

      var isIncome = transaction.type === 'income';
      var typeBadge = isIncome
        ? '<span style="display:inline-block;padding:3px 14px;border-radius:20px;background:#d4edda;color:#155724;font-size:13px;font-weight:600;">&darr; مداخيل &mdash; Income</span>'
        : '<span style="display:inline-block;padding:3px 14px;border-radius:20px;background:#f8d7da;color:#721c24;font-size:13px;font-weight:600;">&uarr; مصاريف &mdash; Expense</span>';

      var logoHtml = schoolLogoUrl
        ? '<div style="margin-bottom:8px;"><img src="' + esc(schoolLogoUrl) + '" alt="Logo" style="max-height:65px;max-width:160px;object-fit:contain;border-radius:4px;" onerror="this.style.display=\'none\';"></div>'
        : '';

      var nameHtml = schoolName
        ? '<h1 style="margin:0 0 6px;font-size:19px;font-weight:700;color:#1a252f;line-height:1.3;">' + esc(schoolName) + '</h1>'
        : '';

      var qrSection = qrDataUrl
        ? '<div style="margin:0 auto 16px;text-align:center;">'
          + '<img src="' + qrDataUrl + '" width="120" height="120" alt="QR" style="border:1px solid #eee;border-radius:6px;display:inline-block;">'
          + '<p style="font-size:10px;color:#aaa;margin:4px 0 0;">امسح لقراءة بيانات الوصل</p>'
          + '</div>'
        : '';

      var html = [
        '<!DOCTYPE html><html><head>',
        '<meta charset="utf-8">',
        '<title>' + paddedId + '</title>',
        '<style>',
        'body{font-family:"Segoe UI",Tahoma,sans-serif;padding:30px;text-align:center;direction:rtl;background:#fff;}',
        '.rc{border:2px solid #2c3e50;padding:26px 30px;max-width:420px;margin:0 auto;border-radius:10px;}',
        '.hdr{border-bottom:2px dashed #ccc;padding-bottom:14px;margin-bottom:18px;}',
        '.subhdr{color:#2c3e50;margin:0 0 4px;font-size:16px;font-weight:700;}',
        '.txn{font-size:11px;color:#888;letter-spacing:1.5px;font-family:monospace;margin:4px 0 8px;}',
        '.det{text-align:right;line-height:2.1;margin-bottom:18px;font-size:15px;}',
        '.det strong{color:#2c3e50;}',
        '.amt{font-size:30px;font-weight:700;margin-bottom:18px;padding:12px;background:#f4f8fb;border:2px solid #2c3e50;border-radius:8px;color:#1a252f;}',
        '.ftr{font-size:13px;color:#666;border-top:2px dashed #ccc;padding-top:12px;}',
        '@media print{body{padding:0;}@page{margin:10mm;}.rc{border:none;}}',
        '</style></head><body><div class="rc">',
        '<div class="hdr">',
        logoHtml,
        nameHtml,
        '<div class="subhdr">🏦 وصل الدفع &mdash; Payment Receipt</div>',
        '<div class="txn">' + paddedId + '</div>',
        '<div style="font-size:13px;">التاريخ / Date: <strong>' + dateString + '</strong></div>',
        '</div>',
        '<div style="margin-bottom:14px;">' + typeBadge + '</div>',
        '<div class="det">',
        personLine,
        '<div><strong>التصنيف (Category):</strong> ' + esc(transaction.category || '-') + '</div>',
        '<div><strong>ملاحظات (Notes):</strong> ' + esc(transaction.notes || '-') + '</div>',
        '</div>',
        '<div class="amt">' + fmtMoney(transaction.amount) + ' <span style="font-size:18px;color:#555;">DZD</span></div>',
        qrSection,
        '<div class="ftr">',
        '<div>المسجّل: <strong>' + esc(transaction.recorded_by_name || '') + ' ' + esc(transaction.recorded_by_last || '') + '</strong></div>',
        '<div style="margin-top:6px;font-size:10px;color:#bbb;">' + paddedId + '</div>',
        '<div style="margin-top:6px;">شكراً لكم &middot; Merci &middot; Thank you</div>',
        '</div></div>',
        '<scr' + 'ipt>window.onload=function(){setTimeout(function(){window.print();},400);};</scr' + 'ipt>',
        '</body></html>'
      ].join('');

      var iframe = document.getElementById('print-receipt-iframe');
      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = 'print-receipt-iframe';
        iframe.style.cssText = 'position:absolute;width:0;height:0;border:none;left:-9999px;';
        document.body.appendChild(iframe);
      }
      var doc = iframe.contentWindow || iframe.contentDocument;
      if (doc.document) doc = doc.document;
      doc.open();
      doc.write(html);
      doc.close();

      setTimeout(function() {
        try {
          if (iframe.contentWindow) {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
          }
        } catch(e) {}
      }, 700);
    }

    // Generate QR via qrcodejs (loaded on the page), fall back gracefully
    try {
      var tempDiv = document.createElement('div');
      tempDiv.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:120px;height:120px;';
      document.body.appendChild(tempDiv);
      new QRCode(tempDiv, {
        text: qrPayload,
        width: 120,
        height: 120,
        colorDark: '#1a252f',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
      });
      setTimeout(function() {
        var canvas = tempDiv.querySelector('canvas');
        var img = tempDiv.querySelector('img');
        var qrDataUrl = null;
        try {
          if (canvas && canvas.toDataURL) {
            qrDataUrl = canvas.toDataURL('image/png');
          }
        } catch (err) {}
        if (!qrDataUrl && img && img.src && img.src.indexOf('data:') === 0) {
          qrDataUrl = img.src;
        }
        if (tempDiv.parentNode) tempDiv.parentNode.removeChild(tempDiv);
        writeAndPrint(qrDataUrl);
      }, 100);
    } catch (e) {
      console.error('QR generation error:', e);
      writeAndPrint(null);
    }
  }

  window.printReceipt = function(transaction) {
    getSchoolInfo().then(function(school) {
      doPrintReceipt(transaction, school);
    });
  };

  document.addEventListener('DOMContentLoaded', function () {
    initTabs();
    bindForm();
    bindEditForm();
    bindFilters();
    bindDeleteModal();
    bindRefresh();
    loadTreasury();
  });

})();
