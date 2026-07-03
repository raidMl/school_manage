(function () {
  'use strict';

  var TOKEN_KEY = 'school_system_token';
  var LANG_KEY = 'school_system_lang';
  var currentLang = localStorage.getItem(LANG_KEY) || 'en';

  // ── i18n ────────────────────────────────────────────────────────────────────
  var AR = {
    'Home': 'الرئيسية', 'Log Out': 'تسجيل الخروج',
    'No records found': 'لا توجد سجلات', 'Loading...': 'جاري التحميل...',
    'Passwords do not match': 'كلمات المرور غير متطابقة',
  };
  function t(s) { return currentLang === 'ar' ? (AR[s] || s) : s; }
  function applyTranslations(root) {
    if (currentLang !== 'ar' || !root) return;
    root.querySelectorAll('[data-i18n]').forEach(function (el) {
      var k = el.getAttribute('data-i18n'), v = AR[k];
      if (v) el.textContent = v;
    });
  }
  if (currentLang === 'ar') {
    var l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = 'css/bootstrap-rtl.min.css';
    document.head.appendChild(l);
    document.documentElement.dir = 'rtl'; document.documentElement.lang = 'ar';
  }

  // ── Avatar helper ────────────────────────────────────────────────────────────
  function avatarUrl(photo, name, type) {
    if (photo && photo.trim() && photo.indexOf('/img/avatar-') === -1) return photo.trim();
    var bg = type === 'student' ? 'f7971e' : (type === 'teacher' ? '11998e' : '4f6eff');
    var letter = type === 'student' ? 'S' : (type === 'teacher' ? 'T' : 'U');
    return 'https://ui-avatars.com/api/?name=' + letter + '&background=' + bg + '&color=fff&size=150';
  }

  // ── API client ───────────────────────────────────────────────────────────────
  function base() {
    var l = window.location;
    return (l.hostname === 'localhost' || l.hostname === '127.0.0.1')
      ? l.protocol + '//' + l.hostname + ':5000' : '';
  }
  function getToken() { return localStorage.getItem(TOKEN_KEY); }
  function setToken(v) { localStorage.setItem(TOKEN_KEY, v); }
  function clearToken() { localStorage.removeItem(TOKEN_KEY); }

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
  function setText(sel, val) { var e = document.querySelector(sel); if (e) e.textContent = val; }
  function redirect(url) { window.location.href = url; }
  function getPage() { return (document.body && document.body.getAttribute('data-page')) || ''; }
  function isAuthPage() { var p = getPage(); return p === 'login'; }
  function showAlert(sel, msg, type) {
    var el = document.querySelector(sel); if (!el) return;
    el.className = 'alert alert-' + (type || 'danger');
    el.textContent = msg; el.style.display = 'block';
  }

  // ── Language switcher ────────────────────────────────────────────────────────
  function initLanguageSwitcher() {
    var label = document.getElementById('lang-current-label');
    if (label) label.textContent = currentLang === 'ar' ? 'عر' : 'EN';
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('.lang-switch-btn');
      if (!btn) return;
      e.preventDefault();
      var lang = btn.getAttribute('data-lang');
      if (lang !== currentLang) { localStorage.setItem(LANG_KEY, lang); window.location.reload(); }
    });
  }

  // ── Auth ─────────────────────────────────────────────────────────────────────
  var ALLOWED_PAGES = {
    'student': ['student-space'],
    'teacher': ['teacher-space', 'attendance']
  };

  function ensureAuth() {
    if (isAuthPage()) {
      if (getToken()) request('/api/auth/me').then(function (ctx) {
        var role = ctx.user.role;
        if (role === 'student') redirect('student-space.html');
        else if (role === 'teacher') redirect('teacher-space.html');
        else { clearToken(); showAlert('#backend-auth-status', 'Admins must use the admin portal.'); }
      }).catch(function () { clearToken(); });
      return;
    }
    if (!getToken()) { redirect('index.html'); return; }
    request('/api/auth/me').then(function (ctx) {
      var role = ctx.user.role;
      var page = getPage();
      var allowed = ALLOWED_PAGES[role];

      if (!allowed) { clearToken(); redirect('index.html'); return; }
      if (allowed.indexOf(page) === -1) { redirect(allowed[0] + '.html'); return; }

      window._ctx = ctx;
      populateAuthUI();
      if (typeof window.onAuthReady === 'function') window.onAuthReady();
    }).catch(function () { clearToken(); redirect('index.html'); });
  }

  function populateAuthUI() {
    var ctx = window._ctx;
    if (!ctx) return;
    var name = [ctx.user.first_name, ctx.user.last_name].filter(Boolean).join(' ');
    setText('#backend-user-name', name);
    setText('#backend-school-name', ctx.school ? ctx.school.name : '');
    setText('#backend-school-name-footer', ctx.school ? ctx.school.name : '');

    var userAvatar = document.getElementById('header-user-avatar');
    if (userAvatar) {
      userAvatar.src = avatarUrl(ctx.user.photo, name, ctx.user.role);
    }
    if (ctx.school) window._schoolId = ctx.school.id;
    bindLogout();
    filterSidebarByRole();
  }

  function filterSidebarByRole() {
    var ctx = window._ctx;
    if (!ctx) return;
    var role = ctx.user.role;

    // Hide sidebar items that don't match the user's role
    document.querySelectorAll('#app-sidebar [data-role]').forEach(function (el) {
      var allowed = el.getAttribute('data-role').split(',');
      if (allowed.indexOf(role) === -1) {
        el.style.display = 'none';
      }
    });

    // Update sidebar footer with user info
    var name = [ctx.user.first_name, ctx.user.last_name].filter(Boolean).join(' ');
    setText('#sb-footer-user-name', name);
    var roleLabel = document.querySelector('#app-sidebar .sb-user-role');
    if (roleLabel) roleLabel.textContent = role === 'student' ? 'Student' : 'Teacher';

    var sbAvatar = document.getElementById('sb-user-avatar');
    if (sbAvatar) sbAvatar.src = avatarUrl(ctx.user.photo, name, role);
  }

  function bindLogout() {
    document.querySelectorAll('[data-backend-logout]').forEach(function (btn) {
      if (btn._lb) return; btn._lb = true;
      btn.addEventListener('click', function (e) { e.preventDefault(); clearToken(); redirect('index.html'); });
    });
  }

  window.SchoolBackend = {
    request: request,
    avatarUrl: avatarUrl,
    afterPartialLoad: function (name) {
      populateAuthUI();
      if (name === 'header') { bindLogout(); initLanguageSwitcher(); applyTranslations(document.getElementById('header-placeholder')); }
      if (name === 'sidebar') { applyTranslations(document.getElementById('sidebar-placeholder')); filterSidebarByRole(); }
    }
  };

  // ── Auth forms ───────────────────────────────────────────────────────────────
  function bindLoginForm() {
    var form = document.querySelector('#backend-login-form'); if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault(); var fd = new FormData(form);
      request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: fd.get('email'), password: fd.get('password') }) })
        .then(function (r) {
          var role = r.user.role;
          if (role === 'student' || role === 'teacher') {
            setToken(r.token);
            redirect(role === 'student' ? 'student-space.html' : 'teacher-space.html');
          } else {
            showAlert('#backend-auth-status', 'Admins must use the admin portal.');
          }
        })
        .catch(function (err) { showAlert('#backend-auth-status', err.message); });
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ATTENDANCE & SCANNING (for teachers)
  // ══════════════════════════════════════════════════════════════════════════

  function initAttendance() {
    if (document.body.getAttribute('data-page') !== 'attendance') return;

    var dateInput = document.getElementById('attendance-filter-date');
    var todayStr = new Date().toISOString().split('T')[0];
    if (dateInput) { dateInput.value = todayStr; }

    var btnValidate = document.getElementById('btn-validate-attendance');
    if (btnValidate) {
        btnValidate.addEventListener('click', function() {
            var gId = document.getElementById('attendance-filter-group').value;
            var dVal = document.getElementById('attendance-filter-date').value;
            if (!gId) { alert('Please select a specific group to validate.'); return; }
            if (!confirm('Are you sure you want to validate attendance for this group? This will lock it from further changes.')) return;
            btnValidate.disabled = true;
            request('/api/attendance/validate', {
                method: 'POST',
                body: JSON.stringify({ group_id: gId, date: dVal, admin_id: window._ctx.user.id })
            }).then(function() {
                alert('Attendance validated and locked successfully!');
                loadAttendanceData();
            }).catch(function(err) {
                alert('Error validating: ' + err.message);
                btnValidate.disabled = false;
            });
        });
    }

    populateAttendanceGroups();
    bindAttendanceFilters();

    // For teachers: hide the type filter and lock to students
    setTimeout(function() {
        if (window._ctx && window._ctx.user && window._ctx.user.role === 'teacher') {
            var typeFilter = document.getElementById('attendance-filter-type');
            if (typeFilter) {
                typeFilter.value = 'student';
                typeFilter.parentElement.style.display = 'none';
            }
        }
        loadAttendanceData();
    }, 500);

    // Bulk selection
    var selectAllCb = document.getElementById('attendance-select-all');
    if (selectAllCb) {
        selectAllCb.addEventListener('change', function() {
            var isChecked = this.checked;
            document.querySelectorAll('.attendance-row-checkbox:not(:disabled)').forEach(function(cb) {
                cb.checked = isChecked;
            });
            updateBulkActionVisibility();
        });
    }

    var btnBulkPresent = document.getElementById('btn-bulk-present');
    var btnBulkAbsent = document.getElementById('btn-bulk-absent');
    if (btnBulkPresent) btnBulkPresent.addEventListener('click', function() { performBulkAction('present'); });
    if (btnBulkAbsent) btnBulkAbsent.addEventListener('click', function() { performBulkAction('absent'); });

    // Scanner logic
    var scannerInput = document.getElementById('attendance-scanner-input');
    if (scannerInput) {
        scannerInput.focus();
        document.addEventListener('click', function(e) {
            if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'SELECT' && e.target.tagName !== 'BUTTON') {
                scannerInput.focus();
            }
        });
        scannerInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                var code = scannerInput.value.trim();
                scannerInput.value = '';
                if (code) processScan(code);
            }
        });
    }

    // Webcam toggle
    var webcamBtn = document.getElementById('btn-toggle-webcam');
    var html5QrcodeScanner = null;
    if (webcamBtn) {
        webcamBtn.addEventListener('click', function() {
            var readerDiv = document.getElementById('reader');
            if (readerDiv.style.display === 'block') {
                if (html5QrcodeScanner) { html5QrcodeScanner.clear(); html5QrcodeScanner = null; }
                readerDiv.style.display = 'none';
                webcamBtn.innerHTML = '<i class="fa fa-camera"></i> Use Webcam QR';
            } else {
                readerDiv.style.display = 'block';
                webcamBtn.innerHTML = '<i class="fa fa-stop"></i> Stop Webcam';
                html5QrcodeScanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: {width: 250, height: 250} }, false);
                html5QrcodeScanner.render(function(decodedText) {
                    processScan(decodedText);
                    html5QrcodeScanner.pause(true);
                    setTimeout(function() { html5QrcodeScanner.resume(); }, 3000);
                }, function(error) {});
            }
        });
    }
  }

  function processScan(tag) {
    var dateVal = document.getElementById('attendance-filter-date').value;
    var groupVal = document.getElementById('attendance-filter-group').value;
    var alertEl = document.getElementById('scan-result-alert');
    if (!dateVal) { alertEl.className = 'alert alert-danger'; alertEl.innerHTML = 'Please select a date first.'; alertEl.style.display = 'block'; return; }
    request('/api/attendance/scan', {
        method: 'POST',
        body: JSON.stringify({ tag: tag, date: dateVal, group_id: groupVal || null })
    }).then(function(res) {
        alertEl.className = 'alert alert-success';
        var name = esc(res.user.first_name + ' ' + res.user.last_name);
        alertEl.innerHTML = '<i class="fa fa-check-circle" style="font-size:24px; vertical-align:middle; margin-right:8px;"></i> ' + name + ' marked as PRESENT.';
        alertEl.style.display = 'block';
        loadAttendanceData();
        setTimeout(function() { alertEl.style.display = 'none'; }, 4000);
    }).catch(function(err) {
        alertEl.className = 'alert alert-danger';
        alertEl.innerHTML = '<i class="fa fa-exclamation-triangle" style="font-size:24px; vertical-align:middle; margin-right:8px;"></i> ' + err.message;
        alertEl.style.display = 'block';
        setTimeout(function() { alertEl.style.display = 'none'; }, 4000);
    });
  }

  function populateAttendanceGroups() {
    var groupSel = document.getElementById('attendance-filter-group');
    if (!groupSel) return;
    request('/api/groups').then(function(res) {
        var groups = res.data || [];
        var html = '<option value="">-- All Groups --</option>';
        html += groups.map(function(g) { return '<option value="' + g.id + '">' + esc(g.name) + '</option>'; }).join('');
        groupSel.innerHTML = html;
    }).catch(function(){});
  }

  function bindAttendanceFilters() {
      ['attendance-filter-date', 'attendance-filter-type', 'attendance-filter-group'].forEach(function(id) {
          var el = document.getElementById(id);
          if (el) el.addEventListener('change', function() {
              if (id === 'attendance-filter-type') {
                  var groupContainer = document.getElementById('attendance-group-container');
                  if (el.value === 'teacher') {
                      groupContainer.style.display = 'none';
                      document.getElementById('attendance-filter-group').value = '';
                  } else {
                      groupContainer.style.display = 'block';
                  }
              }
              loadAttendanceData();
          });
      });
  }

  function loadAttendanceData() {
      var tbody = document.querySelector('#backend-attendance-table tbody');
      if (!tbody) return;
      var date = document.getElementById('attendance-filter-date').value;
      var type = document.getElementById('attendance-filter-type').value;
      var groupId = document.getElementById('attendance-filter-group').value;
      if (!date) return;
      tbody.innerHTML = '<tr><td colspan="6" class="text-center">Loading...</td></tr>';
      var params = new URLSearchParams({ date: date, type: type });
      if (groupId) params.append('group_id', groupId);
      request('/api/attendance?' + params.toString()).then(function(res) {
          var items = type === 'student' ? res.students : res.teachers;
          if (!items || !items.length) {
              tbody.innerHTML = '<tr><td colspan="7" class="text-center">No records found</td></tr>';
              updateBulkActionVisibility();
              return;
          }
          var todayStr = new Date().toISOString().split('T')[0];
          var isLocked = res.is_validated || date !== todayStr;
          var btnValidate = document.getElementById('btn-validate-attendance');
          if (btnValidate) { btnValidate.style.display = 'none'; }
          var statusAlert = document.getElementById('attendance-status');
          if (res.is_validated) {
              statusAlert.className = 'alert alert-info';
              statusAlert.innerHTML = '<i class="fa fa-lock"></i> This attendance record has been validated and cannot be changed.';
              statusAlert.style.display = 'block';
          } else if (date !== todayStr) {
              statusAlert.className = 'alert alert-warning';
              statusAlert.innerHTML = '<i class="fa fa-info-circle"></i> You are viewing a past record. Edits are disabled.';
              statusAlert.style.display = 'block';
          } else {
              statusAlert.style.display = 'none';
          }
          tbody.innerHTML = items.map(function(r) {
              var name = esc([r.first_name, r.last_name].filter(Boolean).join(' '));
              var idNumber = esc(type === 'student' ? r.registration_number : r.employee_number);
              var tag = esc(r.rfid_tag || '-');
              var scanTime = esc(r.scan_time || '-');
              var img = '<img src="' + esc(avatarUrl(r.photo, name, type)) + '" style="width:36px;height:36px;border-radius:50%;object-fit:cover">';
              var isPresent = r.status === 'present';
              var isPending = r.status === 'pending' || r.status === null;
              var btnClass = isPresent ? 'status-present' : (isPending ? 'btn-default' : 'status-absent');
              var btnText = isPresent ? '<i class="fa fa-check"></i> Present' : (isPending ? '<i class="fa fa-clock-o"></i> Pending' : '<i class="fa fa-times"></i> Absent');
              var disabledAttr = isLocked ? ' disabled style="opacity:0.6;cursor:not-allowed;"' : '';
              var cbDisabled = isLocked ? ' disabled' : '';
              return '<tr>' +
                  '<td><input type="checkbox" class="attendance-row-checkbox" value="' + r.id + '"' + cbDisabled + '></td>' +
                  '<td>' + img + '</td>' +
                  '<td>' + idNumber + '</td>' +
                  '<td>' + name + '</td>' +
                  '<td>' + tag + '</td>' +
                  '<td>' + scanTime + '</td>' +
                  '<td><button class="status-toggle ' + btnClass + '" data-user-type="' + type + '" data-user-id="' + r.id + '" data-current-status="' + r.status + '"' + disabledAttr + '>' + btnText + '</button></td>' +
              '</tr>';
          }).join('');
          var selectAllCb = document.getElementById('attendance-select-all');
          if (selectAllCb) { selectAllCb.checked = false; selectAllCb.disabled = isLocked; }
          if (!isLocked) {
              tbody.querySelectorAll('.status-toggle').forEach(function(btn) {
                  btn.addEventListener('click', function() { toggleAttendanceStatus(this, date, groupId); });
              });
              tbody.querySelectorAll('.attendance-row-checkbox').forEach(function(cb) {
                  cb.addEventListener('change', updateBulkActionVisibility);
              });
          }
          updateBulkActionVisibility();
      }).catch(function(err) {
          tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Error: ' + esc(err.message) + '</td></tr>';
      });
  }

  function toggleAttendanceStatus(btn, date, groupId) {
      var userType = btn.getAttribute('data-user-type');
      var userId = btn.getAttribute('data-user-id');
      var currentStatus = btn.getAttribute('data-current-status');
      var newStatus = currentStatus === 'present' ? 'absent' : 'present';
      btn.disabled = true;
      request('/api/attendance/manual', {
          method: 'POST',
          body: JSON.stringify({ user_type: userType, user_id: userId, group_id: groupId || null, date: date, status: newStatus })
      }).then(function() {
          btn.disabled = false;
          btn.setAttribute('data-current-status', newStatus);
          if (newStatus === 'present') { btn.className = 'status-toggle status-present'; btn.innerHTML = '<i class="fa fa-check"></i> Present'; }
          else { btn.className = 'status-toggle status-absent'; btn.innerHTML = '<i class="fa fa-times"></i> Absent'; }
      }).catch(function(err) { btn.disabled = false; alert('Failed to update attendance: ' + err.message); });
  }

  function updateBulkActionVisibility() {
      var container = document.getElementById('attendance-bulk-actions');
      var counter = document.getElementById('bulk-selection-count');
      if (!container) return;
      var checked = document.querySelectorAll('.attendance-row-checkbox:checked').length;
      if (checked > 0) { container.style.display = 'block'; counter.textContent = checked + ' selected'; }
      else { container.style.display = 'none'; }
  }

  function performBulkAction(status) {
      var dateVal = document.getElementById('attendance-filter-date').value;
      var groupVal = document.getElementById('attendance-filter-group').value;
      var typeVal = document.getElementById('attendance-filter-type').value;
      var checkedBoxes = document.querySelectorAll('.attendance-row-checkbox:checked');
      var userIds = Array.from(checkedBoxes).map(function(cb) { return cb.value; });
      if (userIds.length === 0) return;
      if (!confirm('Mark ' + userIds.length + ' users as ' + status.toUpperCase() + '?')) return;
      request('/api/attendance/bulk', {
          method: 'POST',
          body: JSON.stringify({ user_type: typeVal, user_ids: userIds, group_id: groupVal || null, date: dateVal, status: status })
      }).then(function() { loadAttendanceData(); }).catch(function(err) { alert('Bulk update failed: ' + err.message); });
  }

  // ── Init ─────────────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    ensureAuth();
    initLanguageSwitcher();
    bindLoginForm();
    initAttendance();
  });

})();