/**
 * payments-page.js  — v2
 * Features:
 *  - Student autocomplete search
 *  - Formation price / Subscription plan cards (with prices)
 *  - Promo code selector (reduces price, live preview)
 *  - Auto-marks student as Paid + shows next payment date on success
 *  - Per-student payment history
 *  - Payment Archive with search (name / reg# / formation), date & method filters
 *  - Live stat cards
 */
(function () {
  'use strict';

  /* ─── helpers ─────────────────────────────────────────────────────────── */
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
  function avatarUrl(photo, name) {
    if (photo && photo.trim() && photo.indexOf('/img/avatar-') === -1) return photo.trim();
    var letter = (name && name.trim()) ? encodeURIComponent(name.trim().charAt(0).toUpperCase()) : 'S';
    return 'https://ui-avatars.com/api/?name=' + letter + '&background=f7971e&color=fff&size=80';
  }
  function methodBadge(m) {
    var cls = { cash: 'method-cash', bank_transfer: 'method-bank_transfer', card: 'method-card', other: 'method-other' };
    var lbl = m === 'bank_transfer' ? 'Bank Transfer' : (m ? m.charAt(0).toUpperCase() + m.slice(1) : '-');
    return '<span class="method-badge ' + (cls[m] || 'method-other') + '">' + esc(lbl) + '</span>';
  }
  function planLabel(plan) {
    if (!plan) return '-';
    var isAr = (localStorage.getItem('app_lang') || document.documentElement.lang || 'ar') === 'ar';
    if (plan === '1_month') return isAr ? 'شهر واحد' : '1 Month';
    if (plan === '3_months') return isAr ? '3 أشهر' : '3 Months';
    if (plan === '1_year') return isAr ? 'سنة واحدة' : '1 Year';
    var clean = plan.replace(/_/g, ' ');
    if (isAr && window.AppI18n && window.AppI18n.dict && window.AppI18n.dict[clean]) {
      return window.AppI18n.dict[clean];
    }
    return clean;
  }
  function tr(elOrId) {
    if (window.AppI18n) {
      var el = typeof elOrId === 'string' ? document.getElementById(elOrId) : elOrId;
      if (el) window.AppI18n.translateAll(el);
    }
  }

  /* ─── state ───────────────────────────────────────────────────────────── */
  var allStudents = [];          // full student list (for autocomplete + stats)
  var allHistory  = [];          // full archive rows (for client-side search)
  var selectedStudent = null;    // currently selected student object
  var currentFormation = null;   // formation object for selected student
  var currentPromos = [];        // promo codes for current formation
  var selectedPlan = null;       // chosen subscription plan key  e.g. '1_month'
  var activeTab = 'tab-enter-payment';
  var tabLoaded = {};

  /* ══════════════════════════════════════════════════════════════════════
     STATS
  ══════════════════════════════════════════════════════════════════════ */
  function loadStats() {
    var today = new Date().toISOString().slice(0, 10);
    var paid = allStudents.filter(function (s) { return s.payment_status === 'paid'; }).length;
    var overdue = allStudents.filter(function (s) {
      return s.next_payment_date && s.next_payment_date < today && s.payment_status !== 'paid';
    }).length;
    setText('stat-paid-students', paid);
    setText('stat-all-students', allStudents.length);
    setText('stat-overdue-students', overdue);

    request('/api/payment-history').then(function (p) {
      setText('stat-total-collected', fmtMoney(p.total || 0));
    }).catch(function () {});
  }

  function loadAllStudents(cb) {
    request('/api/student-registrations').then(function (p) {
      allStudents = p.data || [];
      loadStats();
      if (cb) cb();
    }).catch(function () {});
  }

  /* ══════════════════════════════════════════════════════════════════════
     TABS
  ══════════════════════════════════════════════════════════════════════ */
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
        if (id === 'tab-history' && !tabLoaded.history) { tabLoaded.history = true; loadGlobalHistory(); }
        if (id === 'tab-dashboard' && !tabLoaded.dashboard) {
          tabLoaded.dashboard = true;
          if (window._paymentsPageInit) window._paymentsPageInit();
        }
      });
    });
  }

  /* ══════════════════════════════════════════════════════════════════════
     STUDENT AUTOCOMPLETE
  ══════════════════════════════════════════════════════════════════════ */
  function initStudentSearch() {
    var input = document.getElementById('student-search-input');
    var dropdown = document.getElementById('student-autocomplete');
    if (!input || !dropdown) return;

    input.addEventListener('input', function () {
      var q = this.value.trim().toLowerCase();
      if (!q) { dropdown.classList.remove('open'); return; }
      var matches = allStudents.filter(function (s) {
        var name = ([s.first_name, s.last_name].filter(Boolean).join(' ')).toLowerCase();
        var reg  = (s.registration_number || '').toLowerCase();
        var form = (s.formation_title || '').toLowerCase();
        return name.indexOf(q) !== -1 || reg.indexOf(q) !== -1 || form.indexOf(q) !== -1;
      }).slice(0, 12);

      if (!matches.length) {
        dropdown.innerHTML = '<div class="ac-item"><div class="ac-meta">No students found</div></div>';
        dropdown.classList.add('open'); return;
      }
      dropdown.innerHTML = matches.map(function (s) {
        var name = [s.first_name, s.last_name].filter(Boolean).join(' ');
        var statusDot = s.payment_status === 'paid'
          ? '<span style="width:8px;height:8px;border-radius:50%;background:#10b981;display:inline-block;margin-right:4px"></span>'
          : '<span style="width:8px;height:8px;border-radius:50%;background:#ef4444;display:inline-block;margin-right:4px"></span>';
        return '<div class="ac-item" data-id="' + s.id + '">' +
          '<img src="' + esc(avatarUrl(s.photo, name)) + '" onerror="this.src=\'' + avatarUrl('', name) + '\'">' +
          '<div><div class="ac-name">' + esc(name) + '</div>' +
          '<div class="ac-meta">' + statusDot + esc(s.registration_number) + ' · ' + esc(s.formation_title || 'No formation') + '</div></div>' +
          '</div>';
      }).join('');
      dropdown.classList.add('open');
      tr(dropdown);
    });

    dropdown.addEventListener('click', function (e) {
      var item = e.target.closest('.ac-item[data-id]');
      if (!item) return;
      var student = allStudents.find(function (s) { return String(s.id) === item.getAttribute('data-id'); });
      if (student) selectStudent(student);
    });
    document.addEventListener('click', function (e) {
      if (!input.contains(e.target) && !dropdown.contains(e.target)) dropdown.classList.remove('open');
    });
  }

  /* ══════════════════════════════════════════════════════════════════════
     SELECT STUDENT  — main entry point when a student is chosen
  ══════════════════════════════════════════════════════════════════════ */
  function selectStudent(student) {
    selectedStudent = student;
    currentFormation = null;
    currentPromos = [];
    selectedPlan = null;

    var name = [student.first_name, student.last_name].filter(Boolean).join(' ');
    var input = document.getElementById('student-search-input');
    var dropdown = document.getElementById('student-autocomplete');
    if (input) input.value = name;
    if (dropdown) dropdown.classList.remove('open');

    // Fill student card
    var photo = document.getElementById('sel-stu-photo');
    if (photo) { photo.src = avatarUrl(student.photo, name); }
    setText('sel-stu-name', name);
    setText('sel-stu-meta', (student.registration_number || '') + (student.formation_title ? ' · ' + student.formation_title : ''));
    refreshStudentBadge(student);
    setText('sel-stu-next-payment', fmtDate(student.next_payment_date));
    var card = document.getElementById('selected-student-card');
    if (card) { card.className = 'visible'; tr(card); }

    // Reset form
    var form = document.getElementById('payment-entry-form');
    if (form) {
      form.style.display = 'block';
      document.getElementById('payment-student-id').value = student.id;
      document.getElementById('payment-formation-id').value = student.formation_id || '';
      document.getElementById('payment-formation-type').value = '';
      document.getElementById('payment-selected-plan').value = '';
      var dateInput = document.getElementById('pay-date');
      if (dateInput) dateInput.value = new Date().toISOString().slice(0, 10);
      document.getElementById('pay-amount').value = '';
      document.getElementById('pay-notes').value = '';
      hideAlert('#payment-entry-status');
      hideBanner('payment-success-banner');
      hideBanner('pay-final-price-row');
      hideBanner('promo-code-row');
      hideBanner('formation-price-banner');
    }

    // Load formation details + promo codes
    if (student.formation_id) {
      loadFormationForStudent(student.formation_id);
    }

    // Load payment history
    loadStudentHistory(student.id, name);

    // Expose global selector
    window._paymentsSelectStudent = function (sid) {
      var s = allStudents.find(function (x) { return String(x.id) === String(sid); });
      if (s) selectStudent(s);
    };
  }

  function refreshStudentBadge(student) {
    var el = document.getElementById('sel-stu-status');
    if (!el) return;
    var isPaid = student.payment_status === 'paid';
    var isAr = (window.AppI18n && window.AppI18n.getLang ? window.AppI18n.getLang() : localStorage.getItem('app_lang')) === 'ar';
    var txt = isPaid ? (isAr ? 'مدفوع' : 'Paid') : (isAr ? 'غير مدفوع' : 'Unpaid');
    el.textContent = txt;
    el.setAttribute('data-i18n', isPaid ? 'Paid' : 'Unpaid');
    el.className = isPaid ? 'badge-paid' : 'badge-unpaid';
  }

  function hideBanner(id) {
    var el = document.getElementById(id);
    if (el) { el.style.display = 'none'; el.className = el.className.replace(' show',''); }
  }

  function clearStudentSelection() {
    selectedStudent = null; currentFormation = null; currentPromos = []; selectedPlan = null;
    var input = document.getElementById('student-search-input');
    var card  = document.getElementById('selected-student-card');
    var form  = document.getElementById('payment-entry-form');
    var panel = document.getElementById('student-history-panel');
    if (input) input.value = '';
    if (card)  card.className = '';
    if (form)  { form.style.display = 'none'; form.reset(); }
    if (panel) panel.style.display = 'none';
    hideBanner('payment-success-banner');
    hideBanner('pay-final-price-row');
    hideBanner('formation-price-banner');
    hideBanner('promo-code-row');
  }

  /* ══════════════════════════════════════════════════════════════════════
     FORMATION PRICE DISPLAY
  ══════════════════════════════════════════════════════════════════════ */
  function loadFormationForStudent(formationId) {
    request('/api/formations/' + formationId).then(function (p) {
      currentFormation = p.data;
      renderFormationPriceBanner(currentFormation);

      // Load promo codes for this formation
      request('/api/promo-codes?formation_id=' + formationId).then(function (pc) {
        currentPromos = (pc.data || []).filter(function (c) { return c.is_active; });
        renderPromoCodeSelect(currentPromos);
      }).catch(function () { currentPromos = []; renderPromoCodeSelect([]); });
    }).catch(function () { currentFormation = null; });
  }

  function renderFormationPriceBanner(f) {
    var banner = document.getElementById('formation-price-banner');
    if (!banner) return;

    if (f.type === 'subscription') {
      // Show plan cards
      banner.className = 'type-subscription';
      banner.style.display = 'block';
      var isAr = (localStorage.getItem('app_lang') || document.documentElement.lang || 'ar') === 'ar';
      var plans = [];
      if (f.price_monthly)  plans.push({ key: '1_month',   label: isAr ? 'شهر واحد' : '1 Month',   price: f.price_monthly });
      if (f.price_3_months) plans.push({ key: '3_months',  label: isAr ? '3 أشهر' : '3 Months',  price: f.price_3_months });
      if (f.price_1_year)   plans.push({ key: '1_year',    label: isAr ? 'سنة واحدة' : '1 Year',    price: f.price_1_year });

      banner.innerHTML =
        '<div class="price-banner-title" style="color:#1d4ed8"><i class="fa fa-refresh"></i> ' + esc(f.title) + ' — Subscription</div>' +
        '<p style="font-size:12px;color:#5a6580;margin:0 0 10px">Choose a subscription plan:</p>' +
        '<div class="plan-cards">' +
        plans.map(function (pl) {
          return '<div class="plan-card" data-plan="' + pl.key + '" data-price="' + pl.price + '">' +
            '<div class="plan-name">' + esc(pl.label) + '</div>' +
            '<div class="plan-price">' + fmtMoney(pl.price) + '</div>' +
            '<div style="font-size:10px;color:#8a96a8">per period</div>' +
            '</div>';
        }).join('') +
        '</div>';

      // Bind plan card clicks
      tr(banner);
      banner.querySelectorAll('.plan-card').forEach(function (card) {
        card.addEventListener('click', function () {
          banner.querySelectorAll('.plan-card').forEach(function (c) { c.classList.remove('selected'); });
          this.classList.add('selected');
          selectedPlan = this.getAttribute('data-plan');
          document.getElementById('payment-selected-plan').value = selectedPlan;
          document.getElementById('payment-formation-type').value = 'subscription';
          var price = parseFloat(this.getAttribute('data-price'));
          applyPromoAndSetAmount(price);
        });
      });

    } else {
      // Formation with fixed price
      banner.className = 'type-formation';
      banner.style.display = 'block';
      var price = parseFloat(f.price || 0);
      banner.innerHTML =
        '<div class="price-banner-title" style="color:#059669"><i class="fa fa-graduation-cap"></i> ' + esc(f.title) + '</div>' +
        '<div class="formation-price-display">' + fmtMoney(price) + '</div>' +
        '<div class="formation-price-label">Formation price</div>';

      tr(banner);
      document.getElementById('payment-formation-type').value = 'formation';
      applyPromoAndSetAmount(price);
    }
  }

  function renderPromoCodeSelect(promos) {
    var row = document.getElementById('promo-code-row');
    var sel = document.getElementById('pay-promo-code');
    if (!row || !sel) return;

    if (!promos.length) {
      row.style.display = 'none'; return;
    }
    sel.innerHTML = '<option value="">— No promo code —</option>' +
      promos.map(function (p) {
        return '<option value="' + esc(p.code) + '" data-discount="' + p.discount_percent + '">' +
          esc(p.code) + ' — ' + p.discount_percent + '% off</option>';
      }).join('');
    row.style.display = 'block';
    tr(row);

    // Bind change
    sel.onchange = function () { recalcPrice(); };
  }

  function getBasePrice() {
    if (!currentFormation) return 0;
    if (currentFormation.type === 'subscription') {
      if (!selectedPlan) return 0;
      if (selectedPlan === '1_month')  return parseFloat(currentFormation.price_monthly  || 0);
      if (selectedPlan === '3_months') return parseFloat(currentFormation.price_3_months || 0);
      if (selectedPlan === '1_year')   return parseFloat(currentFormation.price_1_year   || 0);
    }
    return parseFloat(currentFormation.price || 0);
  }

  function getSelectedDiscount() {
    var sel = document.getElementById('pay-promo-code');
    if (!sel || !sel.value) return 0;
    var opt = sel.options[sel.selectedIndex];
    return opt ? parseFloat(opt.getAttribute('data-discount') || 0) : 0;
  }

  function applyPromoAndSetAmount(basePrice) {
    var discount = getSelectedDiscount();
    var final = basePrice * (1 - discount / 100);

    var row = document.getElementById('pay-final-price-row');
    var origEl = document.getElementById('price-original');
    var finalEl = document.getElementById('price-final');
    var discEl  = document.getElementById('price-discount-label');
    var amtInput = document.getElementById('pay-amount');

    if (basePrice > 0) {
      if (row) row.style.display = 'block';
      if (discount > 0) {
        if (origEl) origEl.textContent = fmtMoney(basePrice);
        if (discEl)  discEl.textContent = '-' + discount + '% promo';
      } else {
        if (origEl) origEl.textContent = '';
        if (discEl)  discEl.textContent = '';
      }
      if (finalEl) finalEl.textContent = fmtMoney(final);
      if (amtInput) amtInput.value = fmtMoney(final);
    }
  }

  function recalcPrice() {
    var base = getBasePrice();
    if (base > 0) applyPromoAndSetAmount(base);
  }

  /* ══════════════════════════════════════════════════════════════════════
     STUDENT PAYMENT HISTORY (tab 1 panel)
  ══════════════════════════════════════════════════════════════════════ */
  function loadStudentHistory(studentId, name) {
    var panel = document.getElementById('student-history-panel');
    var tbody = document.querySelector('#student-history-table tbody');
    var totalEl = document.getElementById('student-history-total');
    var nameEl  = document.getElementById('student-history-name');
    if (!panel || !tbody) return;
    panel.style.display = 'block';
    if (nameEl) nameEl.textContent = name || '';
    tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted"><i class="fa fa-spinner fa-spin"></i> Loading...</td></tr>';

    request('/api/payment-history/student/' + studentId).then(function (p) {
      var rows = p.data || [];
      if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="8"><div class="empty-state"><i class="fa fa-inbox"></i><p>No payment records yet.</p></div></td></tr>';
        if (totalEl) totalEl.textContent = '';
        return;
      }
      tbody.innerHTML = rows.map(function (r, i) {
        var by = [r.recorded_by_name, r.recorded_by_last].filter(Boolean).join(' ') || '-';
        var planNote = r.subscription_plan ? '<small style="color:#8a96a8"> · ' + esc(planLabel(r.subscription_plan)) + '</small>' : '';
        return '<tr>' +
          '<td>' + (i + 1) + '</td>' +
          '<td><strong style="color:#10b981">+ ' + fmtMoney(r.amount) + '</strong></td>' +
          '<td>' + esc(fmtDate(r.payment_date)) + '</td>' +
          '<td>' + (r.payment_method ? methodBadge(r.payment_method) : '-') + planNote + '</td>' +
          '<td>' + methodBadge(r.payment_method) + '</td>' +
          '<td>' + esc(r.notes || '-') + '</td>' +
          '<td>' + esc(by) + '</td>' +
          '<td><button class="btn btn-xs btn-danger" data-del-ph="' + r.id + '" title="Delete"><i class="fa fa-trash"></i></button></td>' +
          '</tr>';
      }).join('');
      if (totalEl) totalEl.textContent = 'Total: ' + fmtMoney(p.total || 0);
      tr(tbody);
      tr(totalEl);

      tbody.querySelectorAll('[data-del-ph]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          openDeleteConfirm(this.getAttribute('data-del-ph'), function () {
            loadStudentHistory(studentId, name);
            loadStats();
          });
        });
      });
    }).catch(function (err) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center text-danger">Error: ' + esc(err.message) + '</td></tr>';
    });
  }

  /* ══════════════════════════════════════════════════════════════════════
     PAYMENT FORM SUBMIT
  ══════════════════════════════════════════════════════════════════════ */
  function bindPaymentForm() {
    var form = document.getElementById('payment-entry-form');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      hideAlert('#payment-entry-status');
      hideBanner('payment-success-banner');

      var studentId = document.getElementById('payment-student-id').value;
      if (!studentId) { showAlert('#payment-entry-status', 'Please select a student first.'); return; }

      // Subscription validation
      var formType = document.getElementById('payment-formation-type').value;
      if (formType === 'subscription' && !selectedPlan) {
        showAlert('#payment-entry-status', 'Please choose a subscription plan.');
        return;
      }

      var amount = parseFloat(document.getElementById('pay-amount').value);
      if (!amount || amount <= 0) { showAlert('#payment-entry-status', 'Please enter a valid amount.'); return; }

      var btn = document.getElementById('btn-save-payment');
      if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Saving...'; }

      var promoSel  = document.getElementById('pay-promo-code');
      var promoCode = promoSel ? (promoSel.value || null) : null;

      var payload = {
        amount: amount,
        payment_date: document.getElementById('pay-date').value || null,
        payment_method: document.getElementById('pay-method').value,
        notes: document.getElementById('pay-notes').value || null,
        update_status: true,   // always mark as paid
        subscription_plan: selectedPlan || null,
        promo_code: promoCode,
      };

      request('/api/payment-history/student/' + studentId, {
        method: 'POST',
        body: JSON.stringify(payload),
      }).then(function (resp) {
        // Reload student to get fresh next_payment_date
        request('/api/student-registrations/' + studentId).then(function (sp) {
          var updated = sp.data;
          // Update cache
          var idx = allStudents.findIndex(function (s) { return String(s.id) === String(studentId); });
          if (idx !== -1) allStudents[idx] = updated;
          selectedStudent = updated;

          // Refresh badge + next date in card
          refreshStudentBadge(updated);
          setText('sel-stu-next-payment', fmtDate(updated.next_payment_date));

          // Show success banner
          var banner = document.getElementById('payment-success-banner');
          if (banner) {
            var nextEl = document.getElementById('success-next-date');
            if (nextEl) {
              nextEl.textContent = updated.next_payment_date
                ? 'Next payment due: ' + fmtDate(updated.next_payment_date)
                : 'No recurring payment scheduled.';
            }
            banner.className = (banner.className || '').replace(' show','') + ' show';
            banner.classList.add('pulse-green');
            tr(banner);
          }
        }).catch(function () {});

        // Reset amount / notes
        document.getElementById('pay-amount').value = '';
        document.getElementById('pay-notes').value = '';
        var promoSel2 = document.getElementById('pay-promo-code');
        if (promoSel2) promoSel2.value = '';
        // Recalc price display to base
        recalcPrice();

        // Reload history and stats
        var name = [selectedStudent.first_name, selectedStudent.last_name].filter(Boolean).join(' ');
        loadStudentHistory(studentId, name);
        loadStats();
        // Invalidate archive tab so it reloads fresh next time
        tabLoaded.history = false;
        tabLoaded.dashboard = false;
        if (typeof window.loadPaymentsPage === 'function') window.loadPaymentsPage();

        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa fa-save"></i> Save Payment &amp; Mark as Paid'; }
      }).catch(function (err) {
        showAlert('#payment-entry-status', err.message);
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa fa-save"></i> Save Payment &amp; Mark as Paid'; }
      });
    });

    var clearBtn = document.getElementById('btn-clear-student');
    if (clearBtn) clearBtn.addEventListener('click', clearStudentSelection);
  }

  /* ══════════════════════════════════════════════════════════════════════
     PAYMENT ARCHIVE  (Tab 2)
  ══════════════════════════════════════════════════════════════════════ */
  function loadGlobalHistory(opts) {
    opts = opts || {};
    var tbody = document.querySelector('#payment-history-table tbody');
    var statusEl  = document.getElementById('hist-status');
    var summaryEl = document.getElementById('hist-summary');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted"><i class="fa fa-spinner fa-spin"></i> Loading...</td></tr>';
    hideAlert(statusEl);

    var params = new URLSearchParams();
    if (opts.dateStart) params.append('date_start', opts.dateStart);
    if (opts.dateEnd)   params.append('date_end',   opts.dateEnd);
    if (opts.method)    params.append('payment_method', opts.method);

    var url = '/api/payment-history' + (params.toString() ? '?' + params.toString() : '');
    request(url).then(function (p) {
      allHistory = p.data || [];
      renderHistoryRows(allHistory, opts.search || '');

      if (summaryEl) {
        var visibleRows = filterHistory(allHistory, opts.search || '');
        document.getElementById('hist-count').textContent = visibleRows.length;
        document.getElementById('hist-total').textContent = fmtMoney(
          visibleRows.reduce(function (s, r) { return s + Number(r.amount || 0); }, 0)
        );
        summaryEl.style.display = 'block';
      }
    }).catch(function (err) {
      tbody.innerHTML = '<tr><td colspan="9" class="text-center text-danger">Error: ' + esc(err.message) + '</td></tr>';
    });
  }

  function filterHistory(rows, search) {
    if (!search) return rows;
    var q = search.toLowerCase();
    return rows.filter(function (r) {
      var name = ([r.first_name, r.last_name].filter(Boolean).join(' ')).toLowerCase();
      var reg  = (r.registration_number || '').toLowerCase();
      var form = (r.formation_title || '').toLowerCase();
      var note = (r.notes || '').toLowerCase();
      return name.indexOf(q) !== -1 || reg.indexOf(q) !== -1 || form.indexOf(q) !== -1 || note.indexOf(q) !== -1;
    });
  }

  function renderHistoryRows(rows, search) {
    var tbody = document.querySelector('#payment-history-table tbody');
    var summaryEl = document.getElementById('hist-summary');
    if (!tbody) return;

    var filtered = filterHistory(rows, search);

    // Update summary
    if (summaryEl) {
      setText('hist-count', filtered.length);
      setText('hist-total', fmtMoney(filtered.reduce(function (s, r) { return s + Number(r.amount || 0); }, 0)));
      var noteEl = document.getElementById('hist-search-note');
      if (noteEl) noteEl.textContent = search ? ' (filtered by "' + search + '")' : '';
      summaryEl.style.display = 'block';
    }

    if (!filtered.length) {
      tbody.innerHTML = '<tr><td colspan="9"><div class="empty-state"><i class="fa fa-inbox"></i><p>No payment records found.</p></div></td></tr>';
      return;
    }

    tbody.innerHTML = filtered.map(function (r) {
      var name = [r.first_name, r.last_name].filter(Boolean).join(' ');
      var by   = [r.recorded_by_name, r.recorded_by_last].filter(Boolean).join(' ') || '-';
      var img  = '<img src="' + esc(avatarUrl(r.photo, name)) +
        '" style="width:30px;height:30px;border-radius:50%;object-fit:cover;margin-right:8px;vertical-align:middle"' +
        ' onerror="this.src=\'' + avatarUrl('', name) + '\'">';
      return '<tr>' +
        '<td>' + img + esc(name) + '</td>' +
        '<td>' + esc(r.registration_number || '-') + '</td>' +
        '<td>' + esc(r.formation_title || '-') + '</td>' +
        '<td><strong style="color:#10b981">+ ' + fmtMoney(r.amount) + '</strong></td>' +
        '<td>' + esc(fmtDate(r.payment_date)) + '</td>' +
        '<td>' + methodBadge(r.payment_method) + '</td>' +
        '<td style="max-width:160px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(r.notes || '-') + '</td>' +
        '<td>' + esc(by) + '</td>' +
        '<td style="white-space: nowrap;">' +
          '<button class="btn btn-xs btn-success" data-print-ph="' + r.id + '" title="Print Receipt" style="margin-right:3px"><i class="fa fa-print"></i></button>' +
          '<button class="btn btn-xs btn-warning" data-edit-ph="' + r.id + '" title="Edit" style="margin-right:3px"><i class="fa fa-edit"></i></button>' +
          '<button class="btn btn-xs btn-info" data-view-student="' + r.student_id + '" title="Enter Payment" style="margin-right:3px">' +
            '<i class="fa fa-plus"></i></button>' +
          '<button class="btn btn-xs btn-danger" data-del-ph="' + r.id + '" title="Delete" style="margin-right:3px"><i class="fa fa-trash"></i></button>' +
        '</td>' +
        '</tr>';
    }).join('');
    tr(tbody);

    // Bind print buttons
    tbody.querySelectorAll('[data-print-ph]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = this.getAttribute('data-print-ph');
        var row = allHistory.find(function (r) { return String(r.id) === String(id); });
        if (row) printPaymentReceipt(row);
      });
    });

    // Bind edit buttons
    tbody.querySelectorAll('[data-edit-ph]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = this.getAttribute('data-edit-ph');
        var row = allHistory.find(function (r) { return String(r.id) === String(id); });
        if (row) openEditPaymentModal(row);
      });
    });

    // Bind delete buttons
    tbody.querySelectorAll('[data-del-ph]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = this.getAttribute('data-del-ph');
        openDeleteConfirm(id, function () {
          allHistory = allHistory.filter(function (r) { return String(r.id) !== String(id); });
          var search = (document.getElementById('hist-search-input') || {}).value || '';
          renderHistoryRows(allHistory, search);
          loadStats();
        });
      });
    });

    // Bind quick-enter-payment buttons
    tbody.querySelectorAll('[data-view-student]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var sid = this.getAttribute('data-view-student');
        var tabBtn = document.querySelector('[data-tab="tab-enter-payment"]');
        if (tabBtn) tabBtn.click();
        setTimeout(function () {
          if (window._paymentsSelectStudent) window._paymentsSelectStudent(sid);
        }, 100);
      });
    });
  }

  function bindHistoryFilters() {
    var searchInput = document.getElementById('hist-search-input');
    var btnFilter   = document.getElementById('btn-hist-filter');
    var btnReset    = document.getElementById('btn-hist-reset');

    // Live search (client-side on cached rows)
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        if (allHistory.length) {
          renderHistoryRows(allHistory, this.value.trim());
        }
      });
    }

    if (btnFilter) {
      btnFilter.addEventListener('click', function () {
        var opts = {
          dateStart: document.getElementById('hist-filter-date-start').value,
          dateEnd:   document.getElementById('hist-filter-date-end').value,
          method:    document.getElementById('hist-filter-method').value,
          search:    searchInput ? searchInput.value.trim() : '',
        };
        loadGlobalHistory(opts);
      });
    }

    if (btnReset) {
      btnReset.addEventListener('click', function () {
        document.getElementById('hist-filter-date-start').value = '';
        document.getElementById('hist-filter-date-end').value   = '';
        document.getElementById('hist-filter-method').value     = '';
        if (searchInput) searchInput.value = '';
        loadGlobalHistory();
      });
    }
  }

  /* ══════════════════════════════════════════════════════════════════════
     PRINT PAYMENT RECEIPT
  ══════════════════════════════════════════════════════════════════════ */
  var _cachedPaySchool = null;
  function getSchoolInfoForPayments() {
    if (_cachedPaySchool) return Promise.resolve(_cachedPaySchool);
    if (window._ctx && window._ctx.school) {
      _cachedPaySchool = window._ctx.school;
      return Promise.resolve(_cachedPaySchool);
    }
    return request('/api/school-setup/settings').then(function (res) {
      if (res && res.school) _cachedPaySchool = res.school;
      return _cachedPaySchool;
    }).catch(function () { return null; });
  }

  function printPaymentReceipt(row) {
    getSchoolInfoForPayments().then(function (school) {
      school = school || {};
      var fallbackName = document.querySelector('#backend-school-name')
        ? document.querySelector('#backend-school-name').textContent.trim() : '';
      var fallbackLogo = document.querySelector('#sb-school-logo')
        ? document.querySelector('#sb-school-logo').src : '';

      var schoolName = (school.name && school.name.trim())
        ? school.name.trim() : (fallbackName || 'School System');
      var schoolLogoUrl = (school.logo && school.logo.trim()) ? school.logo.trim() : '';
      if (!schoolLogoUrl && fallbackLogo && fallbackLogo.indexOf('loremflickr') === -1) schoolLogoUrl = fallbackLogo;
      if (!schoolLogoUrl) schoolLogoUrl = 'img/logo/school-manager-logo.png';

      var rawId = String(row.id || '0');
      var paddedId = 'PAY-' + ('000000000' + rawId).slice(-9);
      var studentName = [row.first_name, row.last_name].filter(Boolean).join(' ') || '-';
      var dateStr = row.payment_date ? String(row.payment_date).split('T')[0] : '-';
      var byName = [row.recorded_by_name, row.recorded_by_last].filter(Boolean).join(' ') || '-';

      var qrPayload = JSON.stringify({
        id: paddedId,
        school: schoolName,
        student: studentName,
        reg: row.registration_number || '',
        formation: row.formation_title || '',
        amount: row.amount,
        date: dateStr,
        method: row.payment_method || '',
        notes: row.notes || '',
        by: byName
      });

      function writeAndPrint(qrDataUrl) {
        var logoHtml = schoolLogoUrl
          ? '<div style="margin-bottom:8px;"><img src="' + esc(schoolLogoUrl) + '" alt="Logo" style="max-height:65px;max-width:160px;object-fit:contain;border-radius:4px;" onerror="this.style.display=\'none\';"></div>'
          : '';
        var nameHtml = schoolName
          ? '<h1 style="margin:0 0 6px;font-size:19px;font-weight:700;color:#1a252f;line-height:1.3;">' + esc(schoolName) + '</h1>'
          : '';
        var qrSection = qrDataUrl
          ? '<div style="margin:0 auto 16px;text-align:center;">' +
              '<img src="' + qrDataUrl + '" width="120" height="120" alt="QR" style="border:1px solid #eee;border-radius:6px;display:inline-block;">' +
              '<p style="font-size:10px;color:#aaa;margin:4px 0 0;">امسح لقراءة بيانات الوصل</p>' +
            '</div>'
          : '';
        var methodLabels = { cash: 'نقدًا / Cash', bank_transfer: 'تحويل بنكي / Bank Transfer', card: 'بطاقة / Card', other: 'أخرى / Other' };
        var methodLabel = methodLabels[row.payment_method] || (row.payment_method || '-');

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
          '<div class="subhdr">📋 وصل الدفع — Payment Receipt</div>',
          '<div class="txn">' + paddedId + '</div>',
          '<div style="font-size:13px;">التاريخ / Date: <strong>' + esc(dateStr) + '</strong></div>',
          '</div>',
          '<div class="det">',
          '<div><strong>الطالب (Student):</strong> ' + esc(studentName) + '</div>',
          '<div><strong>رقم التسجيل (Reg#):</strong> ' + esc(row.registration_number || '-') + '</div>',
          '<div><strong>التكوين (Formation):</strong> ' + esc(row.formation_title || '-') + '</div>',
          '<div><strong>طريقة الدفع (Method):</strong> ' + esc(methodLabel) + '</div>',
          '<div><strong>ملاحظات (Notes):</strong> ' + esc(row.notes || '-') + '</div>',
          '</div>',
          '<div class="amt">' + fmtMoney(row.amount) + ' <span style="font-size:18px;color:#555;">DZD</span></div>',
          qrSection,
          '<div class="ftr">',
          '<div>المسجّل: <strong>' + esc(byName) + '</strong></div>',
          '<div style="margin-top:6px;font-size:10px;color:#bbb;">' + paddedId + '</div>',
          '<div style="margin-top:6px;">شكراً لكم · Merci · Thank you</div>',
          '</div></div>',
          '<scr' + 'ipt>window.onload=function(){setTimeout(function(){window.print();},400);};</scr' + 'ipt>',
          '</body></html>'
        ].join('');

        var iframe = document.getElementById('pay-print-receipt-iframe');
        if (!iframe) {
          iframe = document.createElement('iframe');
          iframe.id = 'pay-print-receipt-iframe';
          iframe.style.cssText = 'position:absolute;width:0;height:0;border:none;left:-9999px;';
          document.body.appendChild(iframe);
        }
        var doc = iframe.contentWindow || iframe.contentDocument;
        if (doc.document) doc = doc.document;
        doc.open(); doc.write(html); doc.close();
        setTimeout(function () {
          try { if (iframe.contentWindow) { iframe.contentWindow.focus(); iframe.contentWindow.print(); } } catch (e) {}
        }, 700);
      }

      try {
        var tempDiv = document.createElement('div');
        tempDiv.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:120px;height:120px;';
        document.body.appendChild(tempDiv);
        new QRCode(tempDiv, { text: qrPayload, width: 120, height: 120, colorDark: '#1a252f', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.M });
        setTimeout(function () {
          var canvas = tempDiv.querySelector('canvas');
          var img = tempDiv.querySelector('img');
          var qrDataUrl = null;
          try { if (canvas && canvas.toDataURL) qrDataUrl = canvas.toDataURL('image/png'); } catch (e) {}
          if (!qrDataUrl && img && img.src && img.src.indexOf('data:') === 0) qrDataUrl = img.src;
          if (tempDiv.parentNode) tempDiv.parentNode.removeChild(tempDiv);
          writeAndPrint(qrDataUrl);
        }, 100);
      } catch (e) {
        console.error('QR error:', e);
        writeAndPrint(null);
      }
    });
  }

  /* ══════════════════════════════════════════════════════════════════════
     EDIT PAYMENT MODAL
  ══════════════════════════════════════════════════════════════════════ */
  var _editPayRow = null;

  function openEditPaymentModal(row) {
    _editPayRow = row;
    var studentName = [row.first_name, row.last_name].filter(Boolean).join(' ') || '-';
    var nameEl   = document.getElementById('edit-pay-student-name');
    var amtEl    = document.getElementById('edit-pay-amount');
    var dateEl   = document.getElementById('edit-pay-date');
    var methodEl = document.getElementById('edit-pay-method');
    var notesEl  = document.getElementById('edit-pay-notes');
    var statusEl = document.getElementById('edit-payment-status');
    if (nameEl)   nameEl.value   = studentName;
    if (amtEl)    amtEl.value    = Number(row.amount || 0).toFixed(2);
    if (dateEl)   dateEl.value   = (row.payment_date || '').split('T')[0];
    if (methodEl) methodEl.value = row.payment_method || 'cash';
    if (notesEl)  notesEl.value  = row.notes || '';
    if (statusEl) statusEl.style.display = 'none';
    if (window.jQuery) $('#edit-payment-modal').modal('show');
  }

  function bindEditPaymentModal() {
    var form = document.getElementById('edit-payment-form');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!_editPayRow) return;
      var statusEl = document.getElementById('edit-payment-status');
      var saveBtn  = document.getElementById('btn-save-edit-payment');
      var amount   = parseFloat(document.getElementById('edit-pay-amount').value);
      var date     = document.getElementById('edit-pay-date').value;
      var method   = document.getElementById('edit-pay-method').value;
      var notes    = document.getElementById('edit-pay-notes').value.trim();

      if (!amount || amount <= 0) { showAlert(statusEl, 'Valid amount required.', 'danger'); return; }
      if (!date)                  { showAlert(statusEl, 'Date is required.', 'danger'); return; }

      if (saveBtn) saveBtn.disabled = true;
      hideAlert(statusEl);

      request('/api/payment-history/' + _editPayRow.id, {
        method: 'PUT',
        body: JSON.stringify({ amount: amount, payment_date: date, payment_method: method, notes: notes || null })
      }).then(function (res) {
        if (window.jQuery) $('#edit-payment-modal').modal('hide');
        // Update row in allHistory cache
        var updated = res.data || {};
        allHistory = allHistory.map(function (r) {
          if (String(r.id) === String(_editPayRow.id)) {
            return Object.assign({}, r, {
              amount: updated.amount || amount,
              payment_date: updated.payment_date || date,
              payment_method: updated.payment_method || method,
              notes: updated.notes !== undefined ? updated.notes : (notes || null)
            });
          }
          return r;
        });
        var search = (document.getElementById('hist-search-input') || {}).value || '';
        renderHistoryRows(allHistory, search);
        loadStats();
        _editPayRow = null;
      }).catch(function (err) {
        showAlert(statusEl, 'Error: ' + err.message, 'danger');
      }).then(function () {
        if (saveBtn) saveBtn.disabled = false;
      });
    });
  }

  /* ══════════════════════════════════════════════════════════════════════
     DELETE MODAL
  ══════════════════════════════════════════════════════════════════════ */
  var _deleteId = null, _deleteCallback = null;

  function openDeleteConfirm(id, cb) {
    _deleteId = id; _deleteCallback = cb;
    if (window.jQuery) $('#delete-payment-modal').modal('show');
  }

  function bindDeleteModal() {
    var btn = document.getElementById('btn-confirm-delete-payment');
    if (!btn) return;
    btn.addEventListener('click', function () {
      if (!_deleteId) return;
      btn.disabled = true;
      request('/api/payment-history/' + _deleteId, { method: 'DELETE' }).then(function () {
        if (window.jQuery) $('#delete-payment-modal').modal('hide');
        if (_deleteCallback) _deleteCallback();
        _deleteId = null; _deleteCallback = null;
        btn.disabled = false;
      }).catch(function (err) {
        alert('Error: ' + err.message);
        btn.disabled = false;
      });
    });
  }

  /* ══════════════════════════════════════════════════════════════════════
     DASHBOARD TAB
  ══════════════════════════════════════════════════════════════════════ */
  function initDashboardTab() {
    window._paymentsPageInit = function () {
      if (typeof populatePaymentFilters === 'function') {
        populatePaymentFilters().then(function () {
          if (typeof bindPaymentFilters === 'function') bindPaymentFilters();
          if (typeof loadPaymentsPage   === 'function') loadPaymentsPage();
        });
      }
    };
  }

  /* ══════════════════════════════════════════════════════════════════════
     INIT
  ══════════════════════════════════════════════════════════════════════ */
  document.addEventListener('DOMContentLoaded', function () {
    initTabs();
    loadAllStudents();
    initStudentSearch();
    bindPaymentForm();
    bindHistoryFilters();
    bindDeleteModal();
    bindEditPaymentModal();
    initDashboardTab();

    // Global hook for backend.js overview "Enter Payment" button
    window._paymentsSelectStudent = function (sid) {
      var s = allStudents.find(function (x) { return String(x.id) === String(sid); });
      if (s) selectStudent(s);
      else loadAllStudents(function () {
        var s2 = allStudents.find(function (x) { return String(x.id) === String(sid); });
        if (s2) selectStudent(s2);
      });
    };

    var refreshBtn = document.getElementById('btn-refresh-states');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', function() {
        var icon = this.querySelector('.fa-refresh');
        if (icon) icon.classList.add('fa-spin');
        
        loadAllStudents(function() {
          tabLoaded.history = false;
          tabLoaded.dashboard = false;

          if (activeTab === 'tab-history') {
            tabLoaded.history = true;
            loadGlobalHistory();
          } else if (activeTab === 'tab-dashboard' && typeof window.loadPaymentsPage === 'function') {
            tabLoaded.dashboard = true;
            window.loadPaymentsPage();
          }
          if (icon) setTimeout(function(){ icon.classList.remove('fa-spin'); }, 500);
        });
      });
    }
  });

})();
