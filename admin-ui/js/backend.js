(function () {
  'use strict';

  // =====================================================
  // Config
  // =====================================================
  var tokenKey = 'school_system_token';
  var langKey  = 'school_system_lang';
  var currentLang = window.localStorage.getItem(langKey) || 'en';

  // Inject RTL styles immediately if Arabic
  if (currentLang === 'ar') {
    ['css/bootstrap-rtl.min.css', 'css/rtl.css'].forEach(function (href) {
      var link = document.createElement('link');
      link.rel = 'stylesheet'; link.href = href;
      document.head.appendChild(link);
    });
  }

  // =====================================================
  // Translations (Arabic)
  // =====================================================
  var translations = {
    "Education":"التعليم","Dashboard v.1":"لوحة التحكم v.1","Analytics":"التحليلات","Widgets":"الأدوات",
    "Event":"الفعاليات","Teachers":"الأساتذة","All Teachers":"جميع الأساتذة","Add Teacher":"إضافة أستاذ",
    "Edit Teacher":"تعديل أستاذ","Students":"الطلاب","All Students":"جميع الطلاب","Add Student":"إضافة طالب",
    "Edit Student":"تعديل طالب","Formations":"الدورات التكوينية","All Formations":"جميع الدورات",
    "Add Formation":"إضافة دورة","Classrooms":"الفصول الدراسية","Groups":"المجموعات",
    "School Settings":"إعدادات المدرسة","Home":"الرئيسية","My School":"مدرستي","Log Out":"تسجيل الخروج",
    "My Account":"حسابي","Settings":"الإعدادات","Users":"المستخدمين","No records found":"لم يتم العثور على سجلات",
    "Backend connected":"الخادم متصل","Backend offline":"الخادم غير متصل",
    "PLEASE LOGIN TO APP":"يرجى تسجيل الدخول","REGISTER TO APP":"سجل في التطبيق",
    "Password":"كلمة المرور","Email":"البريد الإلكتروني","First name":"الاسم الأول",
    "Last name":"الاسم العائلي","Create your school":"إنشاء مدرستك","Create School":"إنشاء المدرسة",
    "School name":"اسم المدرسة","Student created successfully":"تم إنشاء الطالب بنجاح",
    "Teacher created successfully":"تم إنشاء الأستاذ بنجاح","Formation created successfully":"تم إنشاء الدورة بنجاح",
    "Confirm Password":"تأكيد كلمة المرور","Passwords do not match":"كلمات المرور غير متطابقة",
    "School setup required":"مطلوب إعداد المدرسة"
  };

  function t(str) {
    if (currentLang !== 'ar') return str;
    return translations[str] || str;
  }

  function traverse(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      var text = node.nodeValue.trim();
      if (translations[text]) node.nodeValue = node.nodeValue.replace(text, translations[text]);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      if (node.placeholder && translations[node.placeholder.trim()]) node.placeholder = translations[node.placeholder.trim()];
      var tag = node.tagName.toLowerCase();
      if (tag !== 'script' && tag !== 'style') {
        for (var i = 0; i < node.childNodes.length; i++) traverse(node.childNodes[i]);
      }
    }
  }

  function translatePage() {
    if (currentLang !== 'ar') return;
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'ar';
    document.body.classList.add('rtl-mode');
    traverse(document.body);
  }

  function injectLanguageSwitcher() {
    var rightMenu = document.querySelector('.header-right-menu');
    if (!rightMenu) return;
    var langName = currentLang === 'ar' ? 'العربية' : 'English';
    var li = document.createElement('li');
    li.className = 'nav-item dropdown';
    li.innerHTML =
      '<a href="#" data-toggle="dropdown" class="nav-link dropdown-toggle">' +
      '<i class="fa fa-language" style="font-size:16px"></i> <span class="admin-name">' + langName + '</span>' +
      '<i class="fa fa-angle-down edu-icon edu-down-arrow"></i></a>' +
      '<ul class="dropdown-header-top author-log dropdown-menu animated zoomIn" style="min-width:120px;right:0;left:auto">' +
      '<li><a href="#" class="lang-switch-btn" data-lang="en" style="padding:10px 15px;display:block">English</a></li>' +
      '<li><a href="#" class="lang-switch-btn" data-lang="ar" style="padding:10px 15px;display:block">العربية</a></li>' +
      '</ul>';
    rightMenu.insertBefore(li, rightMenu.firstChild);

    document.body.addEventListener('click', function (e) {
      var target = e.target;
      while (target && target !== document.body) {
        if (target.classList && target.classList.contains('lang-switch-btn')) {
          e.preventDefault();
          window.localStorage.setItem(langKey, target.getAttribute('data-lang'));
          window.location.reload();
          return;
        }
        target = target.parentNode;
      }
    });
  }

  // =====================================================
  // API Client
  // =====================================================
  function resolveApiBase() {
    if (window.SCHOOL_API_BASE_URL) return window.SCHOOL_API_BASE_URL;
    var loc = window.location;
    if (loc.protocol === 'http:' || loc.protocol === 'https:') {
      if (loc.hostname === 'localhost' || loc.hostname === '127.0.0.1') {
        return loc.protocol + '//' + loc.hostname + ':5000';
      }
      return '';
    }
    return 'http://localhost:5000';
  }

  var apiBase = resolveApiBase();

  function getToken() { return window.localStorage.getItem(tokenKey); }
  function setToken(t) { window.localStorage.setItem(tokenKey, t); }
  function clearToken() { window.localStorage.removeItem(tokenKey); }

  function request(path, options) {
    var opts = Object.assign({ headers: {} }, options);
    var hasFormData = typeof FormData !== 'undefined' && opts.body instanceof FormData;
    if (!hasFormData && opts.body && !opts.headers['Content-Type']) {
      opts.headers['Content-Type'] = 'application/json';
    }
    if (getToken()) opts.headers.Authorization = 'Bearer ' + getToken();
    return fetch(apiBase + path, opts).then(function (res) {
      if (!res.ok) {
        return res.json().catch(function () { return { message: 'Request failed' }; })
          .then(function (p) { throw new Error(p.message || 'Request failed'); });
      }
      if (res.status === 204) return null;
      return res.json();
    });
  }

  function escapeHtml(v) {
    return String(v == null ? '' : v)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  function setText(sel, val) {
    var el = document.querySelector(sel);
    if (el) el.textContent = val;
  }

  function redirectTo(path) { window.location.href = path; }
  function getPageName() { return (document.body && document.body.getAttribute('data-page')) || ''; }
  function isAuthPage() { var p = getPageName(); return p === 'login' || p === 'register' || p === 'setup-school'; }

  function showAlert(selector, msg, type) {
    var el = document.querySelector(selector);
    if (!el) return;
    el.className = 'alert alert-' + (type || 'danger');
    el.textContent = msg;
    el.style.display = 'block';
  }

  function urlParam(name) {
    var match = new RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
    return match ? decodeURIComponent(match[1].replace(/\+/g,' ')) : null;
  }

  // =====================================================
  // Auth & Session
  // =====================================================
  function ensureAuthenticated() {
    var page = getPageName();
    if (isAuthPage()) {
      if (!getToken()) return;
      request('/api/auth/me').then(function (payload) {
        if (payload.needsSchoolSetup && page !== 'setup-school') { redirectTo('setup-school.html'); return; }
        if (!payload.needsSchoolSetup) redirectTo('index.html');
      }).catch(function () { clearToken(); });
      return;
    }

    if (!getToken()) { redirectTo('login.html'); return; }

    request('/api/auth/me').then(function (payload) {
      if (payload.needsSchoolSetup) { redirectTo('setup-school.html'); return; }
      setText('#backend-user-name', [payload.user.first_name, payload.user.last_name].filter(Boolean).join(' '));
      setText('#backend-school-name', payload.school ? payload.school.name : '');
      setText('#backend-school-name-footer', payload.school ? payload.school.name : '');
      setText('#backend-school-status', payload.school ? 'School ID: ' + payload.school.id : '');
      // Make logout work after header partial loads
      window.SchoolBackend = window.SchoolBackend || {};
      window.SchoolBackend.bindLogout = bindLogoutButton;
      bindLogoutButton();
    }).catch(function () { clearToken(); redirectTo('login.html'); });
  }

  function bindLogoutButton() {
    var btns = document.querySelectorAll('[data-backend-logout]');
    Array.prototype.forEach.call(btns, function (btn) {
      if (btn._logoutBound) return;
      btn._logoutBound = true;
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        request('/api/auth/logout', { method: 'POST' }).finally(function () {
          clearToken(); redirectTo('login.html');
        });
      });
    });
  }

  function completeAuth(response) {
    setToken(response.token);
    if (response.needsSchoolSetup) { redirectTo('setup-school.html'); return; }
    redirectTo('index.html');
  }

  // =====================================================
  // Health Badge
  // =====================================================
  function loadHealth() {
    var badge = document.querySelector('#backend-health-badge');
    if (!badge) return;
    request('/health').then(function (p) {
      badge.className = 'label label-success';
      badge.textContent = t('Backend connected');
      setText('#backend-health-detail', p.database);
    }).catch(function () {
      badge.className = 'label label-danger';
      badge.textContent = t('Backend offline');
    });
  }

  // =====================================================
  // Dashboard
  // =====================================================
  function populateDashboard() {
    var shell = document.querySelector('#backend-dashboard-shell');
    if (!shell) return;

    request('/api/dashboard/overview').then(function (payload) {
      setText('#backend-school-name', payload.school.name);
      setText('#backend-school-name-footer', payload.school.name);
      setText('#backend-school-status', t('Logged in school admin dashboard'));
      var map = {
        '#backend-count-users': payload.counts.users,
        '#backend-count-teachers': payload.counts.teachers,
        '#backend-count-students': payload.counts.students,
        '#backend-count-classrooms': payload.counts.classrooms,
        '#backend-count-formations': payload.counts.formations,
        '#backend-count-groups': payload.counts.groups,
      };
      Object.keys(map).forEach(function (sel) { setText(sel, map[sel]); });
    }).catch(function (err) {
      setText('#backend-dashboard-status', err.message);
      if (err.message === 'School setup required') redirectTo('setup-school.html');
    });

    // Recent students table
    request('/api/dashboard/recent-students').then(function (payload) {
      renderRecentStudents(payload.data || []);
    }).catch(function () {});

    // Recent teachers table
    request('/api/dashboard/recent-teachers').then(function (payload) {
      renderRecentTeachers(payload.data || []);
    }).catch(function () {});

    // Formations summary
    request('/api/dashboard/formations-summary').then(function (payload) {
      renderFormationsSummary(payload.data || []);
    }).catch(function () {});
  }

  function renderRecentStudents(rows) {
    var tbody = document.querySelector('#backend-recent-students tbody');
    if (!tbody) return;
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center">' + t('No records found') + '</td></tr>';
      return;
    }
    tbody.innerHTML = rows.map(function (r) {
      var name = [r.first_name, r.last_name].filter(Boolean).join(' ');
      return '<tr>' +
        '<td>' + escapeHtml(r.registration_number) + '</td>' +
        '<td>' + escapeHtml(name) + '</td>' +
        '<td>' + escapeHtml(r.email) + '</td>' +
        '<td>' + escapeHtml(r.enrollment_date || '-') + '</td>' +
        '</tr>';
    }).join('');
  }

  function renderRecentTeachers(rows) {
    var tbody = document.querySelector('#backend-recent-teachers tbody');
    if (!tbody) return;
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center">' + t('No records found') + '</td></tr>';
      return;
    }
    tbody.innerHTML = rows.map(function (r) {
      var name = [r.first_name, r.last_name].filter(Boolean).join(' ');
      return '<tr>' +
        '<td>' + escapeHtml(r.employee_number) + '</td>' +
        '<td>' + escapeHtml(name) + '</td>' +
        '<td>' + escapeHtml(r.speciality || '-') + '</td>' +
        '<td>' + escapeHtml(r.hire_date || '-') + '</td>' +
        '</tr>';
    }).join('');
  }

  function renderFormationsSummary(rows) {
    var container = document.querySelector('#backend-formations-summary');
    if (!container) return;
    if (!rows.length) {
      container.innerHTML = '<p class="text-muted">' + t('No records found') + '</p>';
      return;
    }
    container.innerHTML = rows.map(function (f) {
      return '<div class="analytics-sparkle-line reso-mg-b-30">' +
        '<div class="analytics-content">' +
        '<h5>' + escapeHtml(f.title) + '</h5>' +
        '<p class="text-muted">' + escapeHtml(f.teacher_name || 'No teacher') + '</p>' +
        '<span class="text-success">' + f.enrolled_students + ' students</span>' +
        (f.price > 0 ? ' &middot; <span class="text-info">$' + escapeHtml(f.price) + '</span>' : '') +
        '</div></div>';
    }).join('');
  }

  // =====================================================
  // Auth Forms
  // =====================================================
  function bindLoginForm() {
    var form = document.querySelector('#backend-login-form');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fd = new FormData(form);
      request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: fd.get('email'), password: fd.get('password') }),
      }).then(completeAuth).catch(function (err) { showAlert('#backend-auth-status', err.message); });
    });
  }

  function bindRegisterForm() {
    var form = document.querySelector('#backend-register-form');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fd = new FormData(form);
      var pw = fd.get('password'), cpw = fd.get('confirm_password');
      if (pw !== cpw) { showAlert('#backend-auth-status', t('Passwords do not match')); return; }
      request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ first_name: fd.get('first_name'), last_name: fd.get('last_name'), email: fd.get('email'), password: pw }),
      }).then(completeAuth).catch(function (err) { showAlert('#backend-auth-status', err.message); });
    });
  }

  function bindSetupSchoolForm() {
    var form = document.querySelector('#backend-setup-school-form');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fd = new FormData(form);
      request('/api/school-setup', {
        method: 'POST',
        body: JSON.stringify({ name: fd.get('name'), logo: fd.get('logo') || null }),
      }).then(function () { redirectTo('index.html'); })
        .catch(function (err) { showAlert('#backend-setup-status', err.message); });
    });
  }

  // =====================================================
  // Students
  // =====================================================
  function loadStudents() {
    var table = document.querySelector('#backend-students-table');
    if (!table) return;
    request('/api/student-registrations').then(function (payload) {
      renderStudentRows(payload.data || []);
    }).catch(function (err) { showAlert('#backend-students-status', err.message); });
  }

  function renderStudentRows(rows) {
    var tbody = document.querySelector('#backend-students-table tbody');
    if (!tbody) return;
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center">' + t('No records found') + '</td></tr>';
      return;
    }
    tbody.innerHTML = rows.map(function (r) {
      var name = [r.first_name, r.last_name].filter(Boolean).join(' ');
      return '<tr>' +
        '<td>' + escapeHtml(r.registration_number) + '</td>' +
        '<td>' + escapeHtml(name) + '</td>' +
        '<td>' + escapeHtml(r.email) + '</td>' +
        '<td>' + escapeHtml(r.parent_name || '-') + '</td>' +
        '<td>' + escapeHtml(r.enrollment_date || '-') + '</td>' +
        '<td>' +
          '<a href="edit-student.html?id=' + r.id + '" class="btn btn-xs btn-info"><i class="fa fa-pencil"></i></a> ' +
          '<button class="btn btn-xs btn-danger" data-delete-student="' + r.id + '"><i class="fa fa-trash"></i></button>' +
        '</td>' +
        '</tr>';
    }).join('');

    // Bind delete buttons
    table.querySelectorAll('[data-delete-student]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (!confirm('Delete this student?')) return;
        var id = this.getAttribute('data-delete-student');
        request('/api/student-registrations/' + id, { method: 'DELETE' })
          .then(function () { loadStudents(); })
          .catch(function (err) { showAlert('#backend-students-status', err.message); });
      });
    });
  }

  function bindAddStudentForm() {
    var form = document.querySelector('#backend-add-student-form');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fd = new FormData(form);
      var payload = {
        first_name: fd.get('first_name'), last_name: fd.get('last_name'),
        email: fd.get('email'), password: fd.get('password'),
        gender: fd.get('gender') || null, birth_date: fd.get('birth_date') || null,
        photo: fd.get('photo') || null,
        registration_number: fd.get('registration_number'),
        parent_name: fd.get('parent_name') || null, parent_phone: fd.get('parent_phone') || null,
        enrollment_date: fd.get('enrollment_date') || null,
      };
      var btn = form.querySelector('[type=submit]');
      if (btn) btn.disabled = true;
      request('/api/student-registrations', { method: 'POST', body: JSON.stringify(payload) })
        .then(function () {
          showAlert('#backend-form-status', t('Student created successfully'), 'success');
          form.reset();
          if (btn) btn.disabled = false;
        })
        .catch(function (err) {
          showAlert('#backend-form-status', err.message);
          if (btn) btn.disabled = false;
        });
    });
  }

  function bindEditStudentForm() {
    var form = document.querySelector('#backend-edit-student-form');
    if (!form) return;
    var id = urlParam('id');
    if (!id) { showAlert('#backend-form-status', 'No student ID in URL'); return; }

    // Pre-populate form
    request('/api/student-registrations/' + id).then(function (payload) {
      var s = payload.data;
      var fields = ['first_name','last_name','email','gender','birth_date','photo',
                    'registration_number','parent_name','parent_phone','enrollment_date'];
      fields.forEach(function (f) {
        var el = form.querySelector('[name=' + f + ']');
        if (el && s[f] != null) el.value = s[f];
      });
    }).catch(function (err) { showAlert('#backend-form-status', err.message); });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fd = new FormData(form);
      var payload = {};
      ['first_name','last_name','email','gender','birth_date','photo',
       'registration_number','parent_name','parent_phone','enrollment_date'].forEach(function (f) {
        var v = fd.get(f);
        if (v !== null) payload[f] = v || null;
      });
      var btn = form.querySelector('[type=submit]');
      if (btn) btn.disabled = true;
      request('/api/student-registrations/' + id, { method: 'PUT', body: JSON.stringify(payload) })
        .then(function () {
          showAlert('#backend-form-status', 'Student updated successfully', 'success');
          if (btn) btn.disabled = false;
        })
        .catch(function (err) {
          showAlert('#backend-form-status', err.message);
          if (btn) btn.disabled = false;
        });
    });
  }

  // =====================================================
  // Teachers
  // =====================================================
  function loadTeachers() {
    var table = document.querySelector('#backend-teachers-table');
    if (!table) return;
    request('/api/teacher-registrations').then(function (payload) {
      renderTeacherRows(payload.data || []);
    }).catch(function (err) { showAlert('#backend-teachers-status', err.message); });
  }

  function renderTeacherRows(rows) {
    var tbody = document.querySelector('#backend-teachers-table tbody');
    if (!tbody) return;
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center">' + t('No records found') + '</td></tr>';
      return;
    }
    tbody.innerHTML = rows.map(function (r) {
      var name = [r.first_name, r.last_name].filter(Boolean).join(' ');
      return '<tr>' +
        '<td>' + escapeHtml(r.employee_number) + '</td>' +
        '<td>' + escapeHtml(name) + '</td>' +
        '<td>' + escapeHtml(r.email) + '</td>' +
        '<td>' + escapeHtml(r.speciality || '-') + '</td>' +
        '<td>' + escapeHtml(r.hire_date || '-') + '</td>' +
        '<td>' +
          '<a href="edit-professor.html?id=' + r.id + '" class="btn btn-xs btn-info"><i class="fa fa-pencil"></i></a> ' +
          '<button class="btn btn-xs btn-danger" data-delete-teacher="' + r.id + '"><i class="fa fa-trash"></i></button>' +
        '</td>' +
        '</tr>';
    }).join('');

    table.querySelectorAll('[data-delete-teacher]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (!confirm('Delete this teacher?')) return;
        var id = this.getAttribute('data-delete-teacher');
        request('/api/teacher-registrations/' + id, { method: 'DELETE' })
          .then(function () { loadTeachers(); })
          .catch(function (err) { showAlert('#backend-teachers-status', err.message); });
      });
    });
  }

  function bindAddTeacherForm() {
    var form = document.querySelector('#backend-add-teacher-form');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fd = new FormData(form);
      var payload = {
        first_name: fd.get('first_name'), last_name: fd.get('last_name'),
        email: fd.get('email'), password: fd.get('password'),
        gender: fd.get('gender') || null, birth_date: fd.get('birth_date') || null,
        photo: fd.get('photo') || null,
        employee_number: fd.get('employee_number'),
        speciality: fd.get('speciality') || null, diploma: fd.get('diploma') || null,
        hire_date: fd.get('hire_date') || null,
      };
      var btn = form.querySelector('[type=submit]');
      if (btn) btn.disabled = true;
      request('/api/teacher-registrations', { method: 'POST', body: JSON.stringify(payload) })
        .then(function () {
          showAlert('#backend-form-status', t('Teacher created successfully'), 'success');
          form.reset();
          if (btn) btn.disabled = false;
        })
        .catch(function (err) {
          showAlert('#backend-form-status', err.message);
          if (btn) btn.disabled = false;
        });
    });
  }

  function bindEditTeacherForm() {
    var form = document.querySelector('#backend-edit-teacher-form');
    if (!form) return;
    var id = urlParam('id');
    if (!id) { showAlert('#backend-form-status', 'No teacher ID in URL'); return; }

    request('/api/teacher-registrations/' + id).then(function (payload) {
      var t2 = payload.data;
      ['first_name','last_name','email','gender','birth_date','photo',
       'employee_number','speciality','diploma','hire_date'].forEach(function (f) {
        var el = form.querySelector('[name=' + f + ']');
        if (el && t2[f] != null) el.value = t2[f];
      });
    }).catch(function (err) { showAlert('#backend-form-status', err.message); });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fd = new FormData(form);
      var payload = {};
      ['first_name','last_name','email','gender','birth_date','photo',
       'employee_number','speciality','diploma','hire_date'].forEach(function (f) {
        var v = fd.get(f);
        if (v !== null) payload[f] = v || null;
      });
      var btn = form.querySelector('[type=submit]');
      if (btn) btn.disabled = true;
      request('/api/teacher-registrations/' + id, { method: 'PUT', body: JSON.stringify(payload) })
        .then(function () {
          showAlert('#backend-form-status', 'Teacher updated successfully', 'success');
          if (btn) btn.disabled = false;
        })
        .catch(function (err) {
          showAlert('#backend-form-status', err.message);
          if (btn) btn.disabled = false;
        });
    });
  }

  // =====================================================
  // Formations
  // =====================================================
  function loadFormations() {
    var table = document.querySelector('#backend-formations-table');
    if (!table) return;
    request('/api/formations').then(function (payload) {
      renderFormationRows(payload.data || []);
    }).catch(function (err) { showAlert('#backend-formations-status', err.message); });
  }

  function renderFormationRows(rows) {
    var tbody = document.querySelector('#backend-formations-table tbody');
    if (!tbody) return;
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center">' + t('No records found') + '</td></tr>';
      return;
    }
    tbody.innerHTML = rows.map(function (r) {
      return '<tr>' +
        '<td>' + escapeHtml(r.title) + '</td>' +
        '<td>' + escapeHtml(r.teacher_name || '-') + '</td>' +
        '<td>' + escapeHtml(r.classroom_name || '-') + '</td>' +
        '<td>' + escapeHtml(r.start_date || '-') + '</td>' +
        '<td>' + escapeHtml(r.end_date || '-') + '</td>' +
        '<td>$' + escapeHtml(r.price) + '</td>' +
        '<td>' +
          '<a href="edit-course.html?id=' + r.id + '" class="btn btn-xs btn-info"><i class="fa fa-pencil"></i></a> ' +
          '<button class="btn btn-xs btn-danger" data-delete-formation="' + r.id + '"><i class="fa fa-trash"></i></button>' +
        '</td>' +
        '</tr>';
    }).join('');

    table.querySelectorAll('[data-delete-formation]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (!confirm('Delete this formation?')) return;
        var id = this.getAttribute('data-delete-formation');
        request('/api/formations/' + id, { method: 'DELETE' })
          .then(function () { loadFormations(); })
          .catch(function (err) { showAlert('#backend-formations-status', err.message); });
      });
    });
  }

  function populateTeacherSelect(selectId) {
    var sel = document.querySelector('#' + selectId);
    if (!sel) return;
    request('/api/teacher-registrations').then(function (payload) {
      var teachers = payload.data || [];
      sel.innerHTML = '<option value="">-- Select Teacher (optional) --</option>' +
        teachers.map(function (tc) {
          var name = [tc.first_name, tc.last_name].filter(Boolean).join(' ');
          return '<option value="' + tc.id + '">' + escapeHtml(name) + '</option>';
        }).join('');
    }).catch(function () {});
  }

  function bindAddFormationForm() {
    var form = document.querySelector('#backend-add-formation-form');
    if (!form) return;
    populateTeacherSelect('formation-teacher-id');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fd = new FormData(form);
      var schoolId = window._schoolId;
      if (!schoolId) { showAlert('#backend-form-status', 'School not loaded. Please wait.'); return; }
      var payload = {
        school_id: schoolId,
        teacher_id: fd.get('teacher_id') || null,
        title: fd.get('title'),
        description: fd.get('description') || null,
        duration_hours: fd.get('duration_hours') || null,
        price: fd.get('price') || 0,
        start_date: fd.get('start_date') || null,
        end_date: fd.get('end_date') || null,
      };
      var btn = form.querySelector('[type=submit]');
      if (btn) btn.disabled = true;
      request('/api/formations', { method: 'POST', body: JSON.stringify(payload) })
        .then(function () {
          showAlert('#backend-form-status', t('Formation created successfully'), 'success');
          form.reset();
          if (btn) btn.disabled = false;
        })
        .catch(function (err) {
          showAlert('#backend-form-status', err.message);
          if (btn) btn.disabled = false;
        });
    });
  }

  function bindEditFormationForm() {
    var form = document.querySelector('#backend-edit-formation-form');
    if (!form) return;
    var id = urlParam('id');
    if (!id) { showAlert('#backend-form-status', 'No formation ID in URL'); return; }
    populateTeacherSelect('formation-teacher-id');

    request('/api/formations/' + id).then(function (payload) {
      var f = payload.data;
      ['title','description','duration_hours','price','start_date','end_date'].forEach(function (field) {
        var el = form.querySelector('[name=' + field + ']');
        if (el && f[field] != null) el.value = f[field];
      });
      // Set teacher select
      setTimeout(function () {
        var sel = form.querySelector('#formation-teacher-id');
        if (sel && f.teacher_id) sel.value = f.teacher_id;
      }, 500);
    }).catch(function (err) { showAlert('#backend-form-status', err.message); });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fd = new FormData(form);
      var payload = {
        teacher_id: fd.get('teacher_id') || null,
        title: fd.get('title'),
        description: fd.get('description') || null,
        duration_hours: fd.get('duration_hours') || null,
        price: fd.get('price') || 0,
        start_date: fd.get('start_date') || null,
        end_date: fd.get('end_date') || null,
      };
      var btn = form.querySelector('[type=submit]');
      if (btn) btn.disabled = true;
      request('/api/formations/' + id, { method: 'PUT', body: JSON.stringify(payload) })
        .then(function () {
          showAlert('#backend-form-status', 'Formation updated successfully', 'success');
          if (btn) btn.disabled = false;
        })
        .catch(function (err) {
          showAlert('#backend-form-status', err.message);
          if (btn) btn.disabled = false;
        });
    });
  }

  // Store school id globally for forms that need it
  function cacheSchoolId() {
    if (!getToken()) return;
    request('/api/auth/me').then(function (payload) {
      if (payload.school) window._schoolId = payload.school.id;
    }).catch(function () {});
  }

  // =====================================================
  // Init
  // =====================================================
  window.SchoolBackend = { bindLogout: bindLogoutButton };

  document.addEventListener('DOMContentLoaded', function () {
    injectLanguageSwitcher();
    translatePage();
    loadHealth();
    ensureAuthenticated();
    cacheSchoolId();
    bindLogoutButton();
    populateDashboard();
    bindLoginForm();
    bindRegisterForm();
    bindSetupSchoolForm();
    // Students
    loadStudents();
    bindAddStudentForm();
    bindEditStudentForm();
    // Teachers
    loadTeachers();
    bindAddTeacherForm();
    bindEditTeacherForm();
    // Formations
    loadFormations();
    bindAddFormationForm();
    bindEditFormationForm();
  });
})();