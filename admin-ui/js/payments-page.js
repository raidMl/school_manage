/**
 * payments-page.js
 * Handles all logic for the Payments page (payments.html)
 * — Student search/select autocomplete
 * — Enter payment (record a payment for a student)
 * — Per-student payment history table
 * — Global payment archive with filters
 * — Students overview dashboard tab
 * — Summary stat cards
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
  function formatDate(val) {
    if (!val) return '-';
    var raw = String(val).split('T')[0].split(' ')[0];
    return raw || '-';
  }
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
  function avatarUrl(photo, name, type) {
    if (photo && photo.trim() && photo.indexOf('/img/avatar-') === -1) return photo.trim();
    var bg = type === 'student' ? 'f7971e' : '4f6eff';
    var letter = (name && name.trim()) ? name.trim().charAt(0).toUpperCase() : 'S';
    return 'https://ui-avatars.com/api/?name=' + encodeURIComponent(letter) + '&background=' + bg + '&color=fff&size=80';
  }
  function methodBadge(method) {
    var map = { cash: 'method-cash', bank_transfer: 'method-bank_transfer', card: 'method-card', other: 'method-other' };
    var label = method === 'bank_transfer' ? 'Bank Transfer' : (method ? method.charAt(0).toUpperCase() + method.slice(1) : '-');
    return '<span class="method-badge ' + (map[method] || 'method-other') + '">' + esc(label) + '</span>';
  }

  // ── All students cache for search ─────────────────────────────────────────
  var allStudents = [];

  function loadAllStudents() {
    request('/api/student-registrations').then(function (p) {
      allStudents = p.data || [];
      loadStats();
    }).catch(function () { });
  }

  // ── Stats cards ──────────────────────────────────────────────────────────
  function loadStats() {
    var today = new Date().toISOString().slice(0, 10);
    var paid = allStudents.filter(function (s) { return s.payment_status === 'paid'; }).length;
    var overdue = allStudents.filter(function (s) {
      return s.next_payment_date && s.next_payment_date < today && s.payment_status !== 'paid';
    }).length;

    // Collected amount from payment history
    request('/api/payment-history').then(function (p) {
      var total = Number(p.total || 0).toFixed(2);
      var el = document.getElementById('stat-total-collected');
      if (el) el.textContent = total;
    }).catch(function () { });

    setText('stat-paid-students', paid);
    setText('stat-all-students', allStudents.length);
    setText('stat-overdue-students', overdue);
  }
  function setText(id, val) {
    var el = document.getElementById(id); if (el) el.textContent = val;
  }

  // ── Tab switching ─────────────────────────────────────────────────────────
  var activeTab = 'tab-enter-payment';
  var tabLoaded = {};

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
        if (id === 'tab-history' && !tabLoaded['history']) {
          tabLoaded['history'] = true;
          loadGlobalHistory();
        }
        if (id === 'tab-dashboard' && !tabLoaded['dashboard']) {
          tabLoaded['dashboard'] = true;
          // Trigger existing backend.js loadPaymentsPage if available
          if (window._paymentsPageInit) window._paymentsPageInit();
        }
      });
    });
  }

  // ── Student autocomplete search ───────────────────────────────────────────
  var selectedStudent = null;

  function initStudentSearch() {
    var input = document.getElementById('student-search-input');
    var dropdown = document.getElementById('student-autocomplete');
    if (!input || !dropdown) return;

    input.addEventListener('input', function () {
      var q = this.value.trim().toLowerCase();
      if (!q) { dropdown.classList.remove('open'); return; }

      var matches = allStudents.filter(function (s) {
        var name = ([s.first_name, s.last_name].filter(Boolean).join(' ')).toLowerCase();
        var reg = (s.registration_number || '').toLowerCase();
        return name.indexOf(q) !== -1 || reg.indexOf(q) !== -1;
      }).slice(0, 10);

      if (!matches.length) {
        dropdown.innerHTML = '<div class="ac-item"><div class="ac-meta">No students found</div></div>';
        dropdown.classList.add('open');
        return;
      }

      dropdown.innerHTML = matches.map(function (s) {
        var name = [s.first_name, s.last_name].filter(Boolean).join(' ');
        var img = avatarUrl(s.photo, name, 'student');
        var formation = s.formation_title || '-';
        return '<div class="ac-item" data-id="' + s.id + '">' +
          '<img src="' + esc(img) + '" onerror="this.src=\'' + avatarUrl('', name, 'student') + '\'">' +
          '<div><div class="ac-name">' + esc(name) + '</div>' +
          '<div class="ac-meta">' + esc(s.registration_number) + ' · ' + esc(formation) + '</div></div>' +
          '</div>';
      }).join('');
      dropdown.classList.add('open');
    });

    dropdown.addEventListener('click', function (e) {
      var item = e.target.closest('.ac-item[data-id]');
      if (!item) return;
      var id = item.getAttribute('data-id');
      var student = allStudents.find(function (s) { return String(s.id) === id; });
      if (student) selectStudent(student);
    });

    // Close on outside click
    document.addEventListener('click', function (e) {
      if (!input.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.remove('open');
      }
    });
  }

  function selectStudent(student) {
    selectedStudent = student;
    var input = document.getElementById('student-search-input');
    var dropdown = document.getElementById('student-autocomplete');
    var name = [student.first_name, student.last_name].filter(Boolean).join(' ');

    if (input) input.value = name;
    if (dropdown) dropdown.classList.remove('open');

    // Fill selected student card
    var card = document.getElementById('selected-student-card');
    var photo = document.getElementById('sel-stu-photo');
    var nameEl = document.getElementById('sel-stu-name');
    var metaEl = document.getElementById('sel-stu-meta');
    var statusEl = document.getElementById('sel-stu-status');
    var nextPayEl = document.getElementById('sel-stu-next-payment');

    if (photo) { photo.src = avatarUrl(student.photo, name, 'student'); }
    if (nameEl) nameEl.textContent = name;
    if (metaEl) metaEl.textContent = (student.registration_number || '') + (student.formation_title ? ' · ' + student.formation_title : '');
    if (statusEl) {
      statusEl.textContent = student.payment_status === 'paid' ? 'Paid' : 'Unpaid';
      statusEl.className = student.payment_status === 'paid' ? 'badge-paid' : 'badge-unpaid';
    }
    if (nextPayEl) nextPayEl.textContent = formatDate(student.next_payment_date);
    if (card) card.className = 'visible';

    // Show form
    var form = document.getElementById('payment-entry-form');
    if (form) {
      form.style.display = 'block';
      document.getElementById('payment-student-id').value = student.id;
      // Set today as default payment date
      var dateInput = document.getElementById('pay-date');
      if (dateInput && !dateInput.value) {
        dateInput.value = new Date().toISOString().slice(0, 10);
      }
      hideAlert('#payment-entry-status');
    }

    // Load student payment history
    loadStudentHistory(student.id);

    // Expose global selector for cross-script usage
    window._paymentsSelectStudent = function (studentId) {
      var s = allStudents.find(function (stu) { return String(stu.id) === String(studentId); });
      if (s) selectStudent(s);
    };
  }

  function clearStudentSelection() {
    selectedStudent = null;
    var input = document.getElementById('student-search-input');
    var card = document.getElementById('selected-student-card');
    var form = document.getElementById('payment-entry-form');
    var panel = document.getElementById('student-history-panel');
    if (input) input.value = '';
    if (card) card.className = '';
    if (form) { form.style.display = 'none'; form.reset(); }
    if (panel) panel.style.display = 'none';
  }

  // ── Load student payment history ──────────────────────────────────────────
  function loadStudentHistory(studentId) {
    var panel = document.getElementById('student-history-panel');
    var tbody = document.querySelector('#student-history-table tbody');
    var totalEl = document.getElementById('student-history-total');
    if (!panel || !tbody) return;
    panel.style.display = 'block';
    tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Loading...</td></tr>';

    request('/api/payment-history/student/' + studentId).then(function (p) {
      var rows = p.data || [];
      if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state"><i class="fa fa-inbox"></i><p>No payment records yet for this student.</p></div></td></tr>';
        if (totalEl) totalEl.textContent = '';
        return;
      }
      tbody.innerHTML = rows.map(function (r, i) {
        var by = [r.recorded_by_name, r.recorded_by_last].filter(Boolean).join(' ') || '-';
        return '<tr>' +
          '<td>' + (i + 1) + '</td>' +
          '<td><strong style="color:#10b981">+ ' + Number(r.amount).toFixed(2) + '</strong></td>' +
          '<td>' + esc(formatDate(r.payment_date)) + '</td>' +
          '<td>' + methodBadge(r.payment_method) + '</td>' +
          '<td>' + esc(r.notes || '-') + '</td>' +
          '<td>' + esc(by) + '</td>' +
          '<td><button class="btn btn-xs btn-danger" data-del-ph="' + r.id + '" data-student-id="' + studentId + '" title="Delete"><i class="fa fa-trash"></i></button></td>' +
          '</tr>';
      }).join('');

      if (totalEl) {
        totalEl.textContent = 'Total paid: ' + Number(p.total || 0).toFixed(2);
      }

      // Bind delete
      tbody.querySelectorAll('[data-del-ph]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          openDeleteConfirm(this.getAttribute('data-del-ph'), function () {
            loadStudentHistory(studentId);
            loadStats();
          });
        });
      });
    }).catch(function (err) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Error: ' + esc(err.message) + '</td></tr>';
    });
  }

  // ── Payment entry form submit ─────────────────────────────────────────────
  function bindPaymentForm() {
    var form = document.getElementById('payment-entry-form');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      hideAlert('#payment-entry-status');

      var studentId = document.getElementById('payment-student-id').value;
      if (!studentId) {
        showAlert('#payment-entry-status', 'Please select a student first.');
        return;
      }

      var amount = document.getElementById('pay-amount').value;
      if (!amount || parseFloat(amount) <= 0) {
        showAlert('#payment-entry-status', 'Please enter a valid amount.');
        return;
      }

      var btn = document.getElementById('btn-save-payment');
      if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Saving...'; }

      request('/api/payment-history/student/' + studentId, {
        method: 'POST',
        body: JSON.stringify({
          amount: parseFloat(amount),
          payment_date: document.getElementById('pay-date').value || null,
          payment_method: document.getElementById('pay-method').value,
          notes: document.getElementById('pay-notes').value || null,
          update_status: document.getElementById('pay-update-status').checked,
        })
      }).then(function () {
        showAlert('#payment-entry-status', 'Payment recorded successfully!', 'success');
        form.querySelector('#pay-amount').value = '';
        form.querySelector('#pay-notes').value = '';
        form.querySelector('#pay-update-status').checked = false;

        // Reload student in allStudents cache to reflect new payment status
        var idx = allStudents.findIndex(function (s) { return String(s.id) === String(studentId); });
        if (idx !== -1 && document.getElementById('pay-update-status') && document.getElementById('pay-update-status').checked === false) {
          // Status was updated, reload
        }
        // Reload student's history
        loadStudentHistory(studentId);
        // Reload all students to refresh stats
        loadAllStudents();

        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa fa-save"></i> Save Payment'; }
      }).catch(function (err) {
        showAlert('#payment-entry-status', err.message);
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa fa-save"></i> Save Payment'; }
      });
    });

    // Clear button
    var clearBtn = document.getElementById('btn-clear-student');
    if (clearBtn) clearBtn.addEventListener('click', clearStudentSelection);
  }

  // ── Global payment history (Archive tab) ─────────────────────────────────
  function loadGlobalHistory(opts) {
    opts = opts || {};
    var tbody = document.querySelector('#payment-history-table tbody');
    var statusEl = document.getElementById('hist-status');
    var summaryEl = document.getElementById('hist-summary');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted"><i class="fa fa-spinner fa-spin"></i> Loading...</td></tr>';
    hideAlert(statusEl);

    var params = new URLSearchParams();
    if (opts.dateStart) params.append('date_start', opts.dateStart);
    if (opts.dateEnd) params.append('date_end', opts.dateEnd);
    if (opts.method) params.append('payment_method', opts.method);

    var url = '/api/payment-history' + (params.toString() ? '?' + params.toString() : '');

    request(url).then(function (p) {
      var rows = p.data || [];
      var total = Number(p.total || 0).toFixed(2);

      if (summaryEl) {
        document.getElementById('hist-count').textContent = rows.length;
        document.getElementById('hist-total').textContent = total;
        summaryEl.style.display = 'block';
      }

      if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="9"><div class="empty-state"><i class="fa fa-inbox"></i><p>No payment records found.</p></div></td></tr>';
        return;
      }

      tbody.innerHTML = rows.map(function (r) {
        var name = [r.first_name, r.last_name].filter(Boolean).join(' ');
        var by = [r.recorded_by_name, r.recorded_by_last].filter(Boolean).join(' ') || '-';
        var img = '<img src="' + esc(avatarUrl(r.photo, name, 'student')) + '" style="width:30px;height:30px;border-radius:50%;object-fit:cover;margin-right:8px" onerror="this.src=\'' + avatarUrl('', name, 'student') + '\'">';
        return '<tr>' +
          '<td>' + img + esc(name) + '</td>' +
          '<td>' + esc(r.registration_number || '-') + '</td>' +
          '<td>' + esc(r.formation_title || '-') + '</td>' +
          '<td><strong style="color:#10b981">+ ' + Number(r.amount).toFixed(2) + '</strong></td>' +
          '<td>' + esc(formatDate(r.payment_date)) + '</td>' +
          '<td>' + methodBadge(r.payment_method) + '</td>' +
          '<td>' + esc(r.notes || '-') + '</td>' +
          '<td>' + esc(by) + '</td>' +
          '<td><button class="btn btn-xs btn-danger" data-del-ph="' + r.id + '" title="Delete"><i class="fa fa-trash"></i></button></td>' +
          '</tr>';
      }).join('');

      // Bind delete buttons in archive
      tbody.querySelectorAll('[data-del-ph]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          openDeleteConfirm(this.getAttribute('data-del-ph'), function () {
            loadGlobalHistory(opts);
            loadStats();
          });
        });
      });
    }).catch(function (err) {
      tbody.innerHTML = '<tr><td colspan="9" class="text-center text-danger">Error: ' + esc(err.message) + '</td></tr>';
    });
  }

  function bindHistoryFilters() {
    var btnFilter = document.getElementById('btn-hist-filter');
    var btnReset = document.getElementById('btn-hist-reset');
    if (btnFilter) {
      btnFilter.addEventListener('click', function () {
        loadGlobalHistory({
          dateStart: document.getElementById('hist-filter-date-start').value,
          dateEnd: document.getElementById('hist-filter-date-end').value,
          method: document.getElementById('hist-filter-method').value,
        });
      });
    }
    if (btnReset) {
      btnReset.addEventListener('click', function () {
        document.getElementById('hist-filter-date-start').value = '';
        document.getElementById('hist-filter-date-end').value = '';
        document.getElementById('hist-filter-method').value = '';
        loadGlobalHistory();
      });
    }
  }

  // ── Delete confirm modal ─────────────────────────────────────────────────
  var _deleteId = null;
  var _deleteCallback = null;

  function openDeleteConfirm(id, cb) {
    _deleteId = id;
    _deleteCallback = cb;
    if (window.jQuery) {
      $('#delete-payment-modal').modal('show');
    }
  }

  function bindDeleteModal() {
    var confirmBtn = document.getElementById('btn-confirm-delete-payment');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', function () {
        if (!_deleteId) return;
        confirmBtn.disabled = true;
        request('/api/payment-history/' + _deleteId, { method: 'DELETE' }).then(function () {
          if (window.jQuery) $('#delete-payment-modal').modal('hide');
          if (_deleteCallback) _deleteCallback();
          _deleteId = null;
          _deleteCallback = null;
          confirmBtn.disabled = false;
        }).catch(function (err) {
          alert('Error deleting payment: ' + err.message);
          confirmBtn.disabled = false;
        });
      });
    }
  }

  // ── Students Overview (dashboard tab) — delegate to backend.js ────────────
  function initDashboardTab() {
    // Wire up filters from existing backend.js logic (populatePaymentFilters / loadPaymentsPage)
    // These elements have the same IDs as before so backend.js will pick them up
    window._paymentsPageInit = function () {
      if (typeof populatePaymentFilters === 'function') {
        populatePaymentFilters().then(function () {
          if (typeof bindPaymentFilters === 'function') bindPaymentFilters();
          if (typeof loadPaymentsPage === 'function') loadPaymentsPage();
        });
      }
    };
  }

  // ── Main init ────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    initTabs();
    loadAllStudents();
    initStudentSearch();
    bindPaymentForm();
    bindHistoryFilters();
    bindDeleteModal();
    initDashboardTab();

    // Expose globally for cross-script access (called from backend.js overview table)
    window._paymentsSelectStudent = function (studentId) {
      var s = allStudents.find(function (stu) { return String(stu.id) === String(studentId); });
      if (s) selectStudent(s);
    };
  });

})();
