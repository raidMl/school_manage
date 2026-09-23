(function () {
  'use strict';

  var TOKEN_KEY = 'school_system_token';
  var LANG_KEY = 'school_system_lang';
  var currentLang = localStorage.getItem(LANG_KEY) || 'en';

  // ── i18n ────────────────────────────────────────────────────────────────────
  var AR = {
    'Home': 'الرئيسية', 'Log Out': 'تسجيل الخروج',
    'Dashboard': 'لوحة التحكم', 'My Dashboard': 'لوحة التحكم',
    'Student Space': 'فضاء التلميذ', 'Teacher Space': 'فضاء الأستاذ',
    'Update Profile': 'تعديل الملف الشخصي',
    'My Attendance History': 'سجل الحضور',
    'Attendance & Scanning': 'تسجيل الحضور والمسح',
    'No records found': 'لا توجد سجلات', 'Loading...': 'جاري التحميل...',
    'Passwords do not match': 'كلمات المرور غير متطابقة',
    'Profile updated successfully!': 'تم تحديث الملف الشخصي بنجاح!',
    'Present': 'حاضر', 'Absent': 'غائب', 'Save Changes': 'حفظ التعديلات'
  };
  function t(s) { return currentLang === 'ar' ? (AR[s] || s) : s; }
  function applyTranslations(root) {
    if (currentLang !== 'ar') return;
    var container = root || document;
    if (window.AppI18n && typeof window.AppI18n.translateAll === 'function') {
      window.AppI18n.translateAll(container);
      return;
    }
    container.querySelectorAll('[data-i18n]').forEach(function (el) {
      var k = el.getAttribute('data-i18n').trim(), v = AR[k];
      if (v) {
        var labelEl = el.querySelector('.th-label-text');
        if (labelEl) {
          labelEl.textContent = v;
        } else {
          el.textContent = v;
        }
      }
    });
  }
  if (currentLang === 'ar') {
    var l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = 'css/bootstrap-rtl.min.css';
    document.head.appendChild(l);
    document.documentElement.dir = 'rtl'; document.documentElement.lang = 'ar';
  }

  // ── Avatar helper ────────────────────────────────────────────────────────────
  function avatarUrl(photo, name, type, gender) {
    if (photo && photo.trim() && photo.indexOf('/img/avatar-') === -1 && photo.indexOf('ui-avatars.com') === -1) {
      return photo.trim();
    }
    var userGender = gender || (window._ctx && window._ctx.user && window._ctx.user.gender) || '';
    var g = String(userGender).toLowerCase();
    var isFemale = (g === 'female' || g === 'f' || g === 'woman' || g === 'girl' || g === 'أنثى');

    if (type === 'student') {
      return isFemale ? encodeURI('img/طالبة مسلمة.webp') : encodeURI('img/طالب.webp');
    } else if (type === 'teacher') {
      return isFemale ? encodeURI('img/معلمة مسلمة.webp') : encodeURI('img/معلم.webp');
    }
    return isFemale ? encodeURI('img/طالبة مسلمة.webp') : encodeURI('img/طالب.webp');
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
      if (lang !== currentLang) {
        localStorage.setItem(LANG_KEY, lang);
        localStorage.setItem('app_lang', lang);
        window.location.reload();
      }
    });
  }

  // ── Auth ─────────────────────────────────────────────────────────────────────
  var ALLOWED_PAGES = {
    'student': ['student-space', 'student-profile', 'student-attendance'],
    'teacher': ['teacher-space', 'attendance', 'teacher-profile', 'teacher-attendance']
  };

  function ensureAuth() {
    if (isAuthPage()) {
      if (getToken()) request('/api/auth/me').then(function (ctx) {
        var role = ctx.user.role;
        if (role === 'student') redirect('student-space.html');
        else if (role === 'teacher') redirect('teacher-space.html');
        else if (role === 'admin' || role === 'super_admin') redirect('../admin-ui/index.html');
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
      userAvatar.src = avatarUrl(ctx.user.photo, name, ctx.user.role, ctx.user.gender);
    }
    if (ctx.school) window._schoolId = ctx.school.id;

    // Dynamically wire topbar dropdown links
    var dashLink = document.getElementById('header-dashboard-link');
    if (dashLink) {
      dashLink.href = ctx.user.role === 'student' ? 'student-space.html' : 'teacher-space.html';
    }
    var profLink = document.getElementById('header-profile-link');
    if (profLink) {
      profLink.href = ctx.user.role === 'student' ? 'student-profile.html' : 'teacher-profile.html';
    }

    bindLogout();
    filterSidebarByRole();
    fetchNotifications();
  }

  function fetchNotifications() {
    var badge = document.getElementById('notif-badge');
    var list = document.getElementById('notif-list');
    var readAllBtn = document.getElementById('notif-read-all');
    if (!badge || !list) return;

    request('/api/notifications').then(function(res) {
      var notifs = res.notifications || [];
      var paymentAlert = res.paymentAlert || null;
      var totalCount = notifs.length + (paymentAlert ? 1 : 0);

      if (totalCount > 0) {
        badge.style.display = 'block';

        if (paymentAlert) {
          if (paymentAlert.urgency === 'urgent' || paymentAlert.urgency === 'overdue') {
            badge.className = 'topbar-badge badge-red';
          } else {
            badge.className = 'topbar-badge badge-yellow';
          }
        } else {
          badge.className = 'topbar-badge badge-red';
        }

        var html = '';

        // Add payment subscription alert item at top if exists
        if (paymentAlert) {
          var isRed = paymentAlert.urgency === 'urgent' || paymentAlert.urgency === 'overdue';
          var dotClass = isRed ? 'dot-red' : 'dot-yellow';
          var days = Number(paymentAlert.days_left);
          var alertTitle = '';
          var alertSub = '';
          var badgeBg = isRed ? '#fee2e2' : '#fef3c7';
          var badgeColor = isRed ? '#dc2626' : '#b45309';

          if (days < 0) {
            var absDays = Math.abs(days);
            alertTitle = currentLang === 'ar' ? 'اشتراكك متأخر بالدفع' : 'Subscription Payment Overdue';
            alertSub = currentLang === 'ar' ? ('متأخر منذ ' + absDays + ' يوم &bull; ' + (paymentAlert.formation_title || 'اشتراك دورة')) : ('Overdue by ' + absDays + ' days &bull; ' + (paymentAlert.formation_title || 'Course'));
          } else if (days === 0) {
            alertTitle = currentLang === 'ar' ? 'موعد دفع الاشتراك اليوم' : 'Subscription Payment Due Today';
            alertSub = currentLang === 'ar' ? ('تاريخ الاستحقاق اليوم &bull; ' + (paymentAlert.formation_title || 'اشتراك دورة')) : ('Due today &bull; ' + (paymentAlert.formation_title || 'Course'));
          } else if (days === 1) {
            alertTitle = currentLang === 'ar' ? 'موعد دفع الاشتراك غداً' : 'Subscription Payment Due Tomorrow';
            alertSub = currentLang === 'ar' ? ('متبقي يوم واحد &bull; ' + (paymentAlert.formation_title || 'اشتراك دورة')) : ('1 day remaining &bull; ' + (paymentAlert.formation_title || 'Course'));
          } else {
            alertTitle = currentLang === 'ar' ? ('موعد دفع الاشتراك بعد ' + days + ' أيام') : ('Subscription Due in ' + days + ' Days');
            alertSub = currentLang === 'ar' ? ('الاستحقاق في: ' + paymentAlert.next_payment_date + ' &bull; ' + (paymentAlert.formation_title || 'اشتراك دورة')) : ('Due date: ' + paymentAlert.next_payment_date + ' &bull; ' + (paymentAlert.formation_title || 'Course'));
          }

          html += '<div style="padding: 12px 14px; background: ' + (isRed ? '#fff5f5' : '#fffbeb') + '; border-bottom: 1px solid #edf0f7; border-left: 3px solid ' + (isRed ? '#ef4444' : '#f59e0b') + ';">' +
            '<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 3px;">' +
              '<div style="display: flex; align-items: center; gap: 8px;">' +
                '<span class="notif-item-dot ' + dotClass + '"></span>' +
                '<span style="font-weight: 700; font-size: 13px; color: #1e293b;">' + esc(alertTitle) + '</span>' +
              '</div>' +
              '<span style="font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 10px; background:' + badgeBg + '; color:' + badgeColor + ';">' + (isRed ? (currentLang === 'ar' ? 'عاجل' : 'Urgent') : (currentLang === 'ar' ? 'تنبيه' : 'Notice')) + '</span>' +
            '</div>' +
            '<div style="font-size: 11px; color: #64748b; margin-top: 4px;">' + alertSub + '</div>' +
          '</div>';
        }

        // Add regular notifications
        if (notifs.length > 0) {
          html += notifs.map(function(n) {
            return '<div class="notif-item" data-id="' + n.id + '" style="padding: 10px 14px; border-bottom: 1px solid #eee; cursor:pointer; transition: background .15s;" onmouseover="this.style.background=\'#f8fafc\'" onmouseout="this.style.background=\'transparent\'">' +
                   '<div style="font-size:13px; color: #1e293b;">' + esc(n.message) + '</div>' +
                   '<div style="font-size:11px; color:#888; margin-top:4px;">' + new Date(n.created_at).toLocaleString() + '</div>' +
                   '</div>';
          }).join('');
        }

        list.innerHTML = html;

        // Bind clicks to mark regular notifications as read
        list.querySelectorAll('.notif-item').forEach(function(el) {
          el.addEventListener('click', function(e) {
            e.stopPropagation();
            var id = this.getAttribute('data-id');
            request('/api/notifications/' + id + '/read', { method: 'PUT' }).then(function() {
              fetchNotifications();
            });
          });
        });
      } else {
        badge.style.display = 'none';
        list.innerHTML = '<div style="padding: 24px; text-align: center; color: #888; font-size: 13px;">' +
          '<i class="fa fa-bell-slash-o" style="font-size: 24px; color: #cbd5e1; display: block; margin-bottom: 6px;"></i>' +
          '<span>' + (currentLang === 'ar' ? 'لا توجد إشعارات جديدة' : 'No new notifications') + '</span>' +
        '</div>';
      }
    }).catch(function(err) {
      console.error('Failed to fetch notifications', err);
    });

    if (readAllBtn && !readAllBtn._bound) {
      readAllBtn._bound = true;
      readAllBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        request('/api/notifications/read-all', { method: 'PUT' }).then(function() {
          fetchNotifications();
        });
      });
    }
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
    if (roleLabel) {
      var roleName = role === 'student' ? 'Student' : 'Teacher';
      roleLabel.textContent = window.AppI18n ? window.AppI18n.t(roleName) : roleName;
      roleLabel.setAttribute('data-i18n', roleName);
    }

    var sbAvatar = document.getElementById('sb-user-avatar');
    if (sbAvatar) sbAvatar.src = avatarUrl(ctx.user.photo, name, role, ctx.user.gender);
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
      if (window.AppI18n && typeof window.AppI18n.translateAll === 'function') {
        window.AppI18n.translateAll(document);
      } else {
        applyTranslations(document);
      }
      if (name === 'header') { bindLogout(); initLanguageSwitcher(); }
      if (name === 'sidebar') { filterSidebarByRole(); }
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
          } else if (role === 'admin' || role === 'super_admin') {
            setToken(r.token);
            redirect('../admin-ui/' + (r.needsSchoolSetup ? 'setup-school.html' : 'index.html'));
          } else {
            showAlert('#backend-auth-status', 'Unknown user role.');
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
    if (dateInput) { dateInput.value = todayStr; dateInput.max = todayStr; } // Prevent future dates

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

    // Monthly PDF button logic
    var btnMonthlyPdf = document.getElementById('btn-monthly-attendance-pdf');
    if (btnMonthlyPdf) {
      btnMonthlyPdf.addEventListener('click', function() {
        var gId = document.getElementById('attendance-filter-group').value;
        var dateVal = document.getElementById('attendance-filter-date').value || new Date().toISOString().split('T')[0];
        var isArBtn = (window.AppI18n && typeof window.AppI18n.getLang === 'function' && window.AppI18n.getLang() === 'ar') || (typeof currentLang !== 'undefined' && currentLang === 'ar');
        if (!gId) { alert(isArBtn ? 'يرجى اختيار فوج محدد أولاً.' : 'Please select a specific group first.'); return; }
        var parts = dateVal.split('-');
        downloadMonthlyAttendancePdf(gId, parseInt(parts[0], 10), parseInt(parts[1], 10));
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


  function downloadMonthlyAttendancePdf(groupId, year, month) {
    var jsPDFLib = window.jspdf && window.jspdf.jsPDF ? window.jspdf.jsPDF : (window.jsPDF || null);
    if (!jsPDFLib || typeof html2canvas === 'undefined') {
      alert('PDF libraries not loaded yet. Please wait a moment and try again.');
      return;
    }
    var btnPdf = document.getElementById('btn-monthly-attendance-pdf');
    var origHtml = btnPdf ? btnPdf.innerHTML : '';
    if (btnPdf) { btnPdf.innerHTML = '<i class="fa fa-spinner fa-spin"></i> جاري التجهيز...'; btnPdf.disabled = true; }
    function restore() { if (btnPdf) { btnPdf.innerHTML = origHtml; btnPdf.disabled = false; } }

    var ARABIC_MONTHS = ['','جانفي','فيفري','مارس','أفريل','ماي','جوان','جويلية','أوت','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
    var ARABIC_DAYS   = ['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
    var STATUS_LETTER = { present: 'ح', absent: 'غ', pending: 'م' };
    var STATUS_COLOR  = { present: '#bbf7d0', absent: '#fca5a5', pending: '#fef08a' };

    Promise.all([
      request('/api/school-setup/settings'),
      request('/api/groups/' + groupId),
      request('/api/attendance/monthly?group_id=' + groupId + '&year=' + year + '&month=' + month)
    ]).then(function(results) {
      var school    = (results[0] && results[0].school) ? results[0].school : {};
      var group     = results[1].data || {};
      var monthData = results[2];
      var students  = monthData.students || [];
      var daysInMonth = monthData.days || new Date(year, month, 0).getDate();

      var dayCols = [];
      for (var d = 1; d <= daysInMonth; d++) {
        var dObj = new Date(year, month - 1, d);
        dayCols.push({ day: d, dayName: ARABIC_DAYS[dObj.getDay()], isFriday: dObj.getDay() === 5 });
      }
      var pageSize = 20, pages = [];
      for (var i = 0; i < Math.max(students.length, 1); i += pageSize) {
        pages.push({ students: students.slice(i, i + pageSize), startIndex: i });
      }

      var defaultLogo1 = 'https://res.cloudinary.com/p0mhhcjg/image/upload/v1788176562/school_management/bgqqlyiwkzs7ja5zuxpt.png';
      var defaultLogo2 = 'https://res.cloudinary.com/p0mhhcjg/image/upload/v1788176568/school_management/hxldtqlgokkrrgasqov8.png';

      function imgToB64(url) {
        return new Promise(function(resolve) {
          if (!url) { resolve(''); return; }
          var done = false;
          function finish(v) { if (!done) { done = true; resolve(v || ''); } }
          var t = setTimeout(function() { finish(''); }, 3500);
          fetch(url, { mode: 'cors' })
            .then(function(r) { if (!r.ok) throw new Error(); return r.blob(); })
            .then(function(blob) {
              var fr = new FileReader();
              fr.onloadend = function() { clearTimeout(t); finish(fr.result); };
              fr.onerror   = function() { clearTimeout(t); finish(''); };
              fr.readAsDataURL(blob);
            }).catch(function() { clearTimeout(t); finish(''); });
        });
      }

      Promise.all([imgToB64(school.logo || defaultLogo1), imgToB64(school.logo2 || defaultLogo2)]).then(function(logos) {
        var logo1B64 = logos[0] || defaultLogo1;
        var logo2B64 = logos[1] || defaultLogo2;

        var container = document.getElementById('attendance-pdf-export-container');
        if (!container) {
          container = document.createElement('div');
          container.id = 'attendance-pdf-export-container';
          container.style.cssText = 'position:fixed;left:-9999px;top:0;z-index:-1;background:#fff;';
          document.body.appendChild(container);
        }

        var doc = new jsPDFLib({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        var pageW = 297, pageH = 210, pageIndex = 0;

        function buildPageHtml(pgCtx) {
          var pgStudents = pgCtx.students, startIdx = pgCtx.startIndex;
          var schoolName = school.name || 'مدرسة الريان لعلوم القرآن';
          var assocName  = 'جمعية العلماء المسلمين الجزائريين - شعبة حي قجال';
          var schoolAddr = [school.municipality, school.district, school.state].filter(Boolean).join(' - ') || school.address || '';
          var monthLabel = ARABIC_MONTHS[month] + ' ' + year;
          var l1 = logo1B64 ? '<img src="' + logo1B64 + '" style="width:60px;height:60px;object-fit:contain;">' : '<div style="width:60px;height:60px;"></div>';
          var l2 = logo2B64 ? '<img src="' + logo2B64 + '" style="width:60px;height:60px;object-fit:contain;">' : '<div style="width:60px;height:60px;"></div>';

          var dayNameCols = dayCols.map(function(col) {
            var bg = col.isFriday ? '#fef9c3' : '#fff';
            return '<th style="border:1px solid #000;width:20px;height:48px;padding:0;background:' + bg + ';text-align:center;vertical-align:middle;"><div style="display:flex;align-items:center;justify-content:center;width:20px;height:48px;"><span style="display:inline-block;transform:rotate(-90deg);white-space:nowrap;font-size:8px;font-weight:700;">' + col.dayName + '</span></div></th>';
          }).join('');

          var dayNumCols = dayCols.map(function(col) {
            var bg = col.isFriday ? '#fef9c3' : '#f8fafc';
            return '<th style="border:1px solid #000;width:20px;padding:0;text-align:center;vertical-align:middle;background:' + bg + ';font-size:9px;font-weight:700;">' + col.day + '</th>';
          }).join('');

          var displayStudents = pgStudents.slice();
          if (startIdx === 0 && displayStudents.length < 15) { while (displayStudents.length < 15) displayStudents.push(null); }

          var studentRows = displayStudents.map(function(st, idx) {
            var num = startIdx + idx + 1;
            var nameCell = st ? esc(st.name) : '';
            var dayCells = dayCols.map(function(col, di) {
              var status = (st && st.days && st.days[di] !== undefined) ? st.days[di] : (st ? 'pending' : '');
              var letter = status ? (STATUS_LETTER[status] || '') : '';
              var bg     = status ? (STATUS_COLOR[status] || '#fff') : '#fff';
              return '<td style="border:1px solid #000;padding:0;text-align:center;vertical-align:middle;background:' + bg + ';font-size:11px;font-weight:700;color:#000;">' + letter + '</td>';
            }).join('');
            return '<tr style="height:22px;"><td style="border:1px solid #000;text-align:center;font-size:11px;font-weight:700;padding:0;">' + num + '</td><td style="border:1px solid #000;text-align:right;font-size:11px;font-weight:700;padding:2px 6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + nameCell + '</td>' + dayCells + '</tr>';
          }).join('');

          return '<div class="attendance-pdf-page" style="width:1122px;min-height:790px;background:#fff;padding:12px 14px;box-sizing:border-box;font-family:\'Cairo\',\'Tahoma\',\'Arial\',sans-serif;direction:rtl;color:#000;">' +
            '<style>.attendance-pdf-page,.attendance-pdf-page *{font-family:"Cairo","Tahoma","Arial",sans-serif!important;}</style>' +
            '<div style="border:1.5px solid #000;padding:10px 12px;box-sizing:border-box;min-height:766px;display:flex;flex-direction:column;justify-content:space-between;">' +
              '<div>' +
                '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:7px;">' +
                  '<div style="flex:0 0 68px;">' + l2 + '</div>' +
                  '<div style="flex:1;text-align:center;line-height:1.5;">' +
                    '<div style="font-size:13px;font-weight:700;">' + assocName + '</div>' +
                    '<div style="font-size:14px;font-weight:700;">' + schoolName + '</div>' +
                    (schoolAddr ? '<div style="font-size:11px;font-weight:600;"><b>العنوان:</b> ' + esc(schoolAddr) + '</div>' : '') +
                  '</div>' +
                  '<div style="flex:0 0 68px;">' + l1 + '</div>' +
                '</div>' +
                '<div style="border:1.5px solid #475569;border-radius:10px;background:#cbd5e1;text-align:center;padding:3px 0;font-size:14px;font-weight:700;margin-bottom:6px;">جدول الحضور والغياب الشهري &mdash; ' + monthLabel + '</div>' +
                '<div style="border:1px solid #64748b;border-radius:4px;padding:5px 12px;margin-bottom:6px;font-size:11.5px;font-weight:600;display:flex;justify-content:space-between;">' +
                  '<span><b>الفوج:</b> ' + esc(group.name || '-') + '</span>' +
                  '<span><b>المعلم(ة):</b> ' + esc(group.teacher_name || '-') + '</span>' +
                  '<span><b>القسم:</b> ' + esc(group.classroom_name || '-') + '</span>' +
                  '<span><b>العدد الكلي:</b> ' + students.length + '</span>' +
                '</div>' +
                '<div style="overflow:hidden;"><table style="width:100%;border-collapse:collapse;table-layout:fixed;">' +
                  '<thead><tr>' +
                    '<th rowspan="2" style="border:1px solid #000;width:28px;padding:0;text-align:center;vertical-align:middle;background:#fff;"><span style="display:inline-block;transform:rotate(-90deg);white-space:nowrap;font-size:9px;font-weight:700;">الرقم</span></th>' +
                    '<th rowspan="2" style="border:1px solid #000;width:130px;padding:0 4px;text-align:center;vertical-align:middle;background:#fff;font-size:11px;font-weight:700;">اللقب والاسم</th>' +
                    dayNameCols +
                  '</tr><tr>' + dayNumCols + '</tr></thead>' +
                  '<tbody>' + studentRows + '</tbody>' +
                '</table></div>' +
              '</div>' +
              '<div style="border:1.5px solid #000;display:flex;align-items:center;justify-content:space-between;padding:3px 10px;margin-top:6px;font-size:11px;font-weight:700;">' +
                '<div style="display:flex;align-items:center;gap:16px;">' +
                  '<div style="display:flex;align-items:center;gap:5px;"><span style="background:#fef08a;border:1px solid #000;padding:1px 6px;border-radius:2px;font-weight:700;">م</span><span>معلّق / غير مسجّل</span></div>' +
                  '<div style="display:flex;align-items:center;gap:5px;"><span style="background:#fca5a5;border:1px solid #000;padding:1px 6px;border-radius:2px;font-weight:700;">غ</span><span>غائب(ة)</span></div>' +
                  '<div style="display:flex;align-items:center;gap:5px;"><span style="background:#bbf7d0;border:1px solid #000;padding:1px 6px;border-radius:2px;font-weight:700;">ح</span><span>حاضر(ة)</span></div>' +
                '</div>' +
                '<div style="border:1px solid #000;display:flex;"><div style="padding:2px 10px;border-right:1px solid #000;">' + students.length + '</div><div style="padding:2px 10px;">العدد</div></div>' +
              '</div>' +
            '</div></div>';
        }

        function renderPage(pIdx) {
          if (pIdx >= pages.length) {
            container.innerHTML = '';
            restore();
            var gName = (group.name || 'فوج').replace(/[\s\/\\]+/g, '-');
            doc.save('حضور-شهري-' + gName + '-' + year + '-' + String(month).padStart(2,'0') + '.pdf');
            return;
          }
          container.innerHTML = buildPageHtml(pages[pIdx]);
          var pageEl = container.querySelector('.attendance-pdf-page');
          if (!pageEl) { renderPage(pIdx + 1); return; }
          var doCapture = function() {
            html2canvas(pageEl, { scale: 2, useCORS: true, allowTaint: false, backgroundColor: '#ffffff', logging: false })
              .then(function(canvas) {
                if (pageIndex > 0) doc.addPage();
                var imgData = canvas.toDataURL('image/jpeg', 0.95);
                var cW = canvas.width / 2, cH = canvas.height / 2;
                var ratio = Math.min(pageW / cW, pageH / cH);
                doc.addImage(imgData, 'JPEG', (pageW - cW*ratio)/2, (pageH - cH*ratio)/2, cW*ratio, cH*ratio);
                pageIndex++;
                renderPage(pIdx + 1);
              }).catch(function() { renderPage(pIdx + 1); });
          };
          if (document.fonts && document.fonts.ready) { document.fonts.ready.then(function() { setTimeout(doCapture, 150); }); }
          else { setTimeout(doCapture, 300); }
        }
        renderPage(0);
      });
    }).catch(function(err) { restore(); alert('خطأ في تحميل البيانات: ' + (err.message || err)); });
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
          var isLocked = res.is_validated; // Only validated records are locked; past dates remain editable
          var btnValidate = document.getElementById('btn-validate-attendance');
          if (btnValidate) { btnValidate.style.display = 'none'; }
          var btnMonthlyPdf2 = document.getElementById('btn-monthly-attendance-pdf');
          if (btnMonthlyPdf2) { btnMonthlyPdf2.style.display = (type === 'student' && groupId) ? 'block' : 'none'; }
          var statusAlert = document.getElementById('attendance-status');
          if (res.is_validated) {
              statusAlert.className = 'alert alert-info';
              var isArAlertLocked = (window.AppI18n && typeof window.AppI18n.getLang === 'function' && window.AppI18n.getLang() === 'ar') || (typeof currentLang !== 'undefined' && currentLang === 'ar');
              statusAlert.innerHTML = '<i class="fa fa-lock"></i> ' + (isArAlertLocked ? 'تم تأكيد سجل الحضور هذا ولا يمكن تعديله.' : 'This attendance record has been validated and cannot be changed.');
              statusAlert.style.display = 'block';
          } else if (date !== todayStr) {
              statusAlert.className = 'alert alert-success';
              var isArAlert = (window.AppI18n && typeof window.AppI18n.getLang === 'function' && window.AppI18n.getLang() === 'ar') || (typeof currentLang !== 'undefined' && currentLang === 'ar');
              statusAlert.innerHTML = '<i class="fa fa-pencil"></i> ' + (isArAlert ? ('أنت تقوم بتعديل سجل سابق (' + date + '). سيتم حفظ التغييرات.') : ('You are editing a past record (' + date + '). Changes will be saved.'));
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
              var _isAr = currentLang === 'ar' || (window.AppI18n && typeof window.AppI18n.getLang === 'function' && window.AppI18n.getLang() === 'ar');
              var _lblPresent = _isAr ? 'حاضر' : 'Present';
              var _lblAbsent  = _isAr ? 'غائب'  : 'Absent';
              var _lblPending = _isAr ? 'معلّق' : 'Pending';
              var btnClass = isPresent ? 'status-present' : (isPending ? 'btn-default' : 'status-absent');
              var btnText = isPresent ? '<i class="fa fa-check"></i> ' + _lblPresent : (isPending ? '<i class="fa fa-clock-o"></i> ' + _lblPending : '<i class="fa fa-times"></i> ' + _lblAbsent);
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
          var _isArT = currentLang === 'ar' || (window.AppI18n && typeof window.AppI18n.getLang === 'function' && window.AppI18n.getLang() === 'ar');
          if (newStatus === 'present') { btn.className = 'status-toggle status-present'; btn.innerHTML = '<i class="fa fa-check"></i> ' + (_isArT ? 'حاضر' : 'Present'); }
          else { btn.className = 'status-toggle status-absent'; btn.innerHTML = '<i class="fa fa-times"></i> ' + (_isArT ? 'غائب' : 'Absent'); }
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