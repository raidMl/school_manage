(function () {
  'use strict';

  var TOKEN_KEY = 'school_system_token';
  var LANG_KEY = 'app_lang';
  var currentLang = localStorage.getItem(LANG_KEY) || 'en';

  // ── i18n ────────────────────────────────────────────────────────────────────
  var AR = {
    'selected': 'محدد',
    'Home': 'الرئيسية', 'Dashboard': 'لوحة التحكم', 'Teachers': 'الأساتذة',
    'All Teachers': 'جميع الأساتذة', 'Add Teacher': 'إضافة أستاذ',
    'Students': 'الطلاب', 'All Students': 'جميع الطلاب', 'Add Student': 'إضافة طالب',
    'Formations': 'الدورات', 'All Formations': 'جميع الدورات', 'Add Formation': 'إضافة دورة',
    'Classrooms': 'الفصول', 'Groups': 'المجموعات', 'School Settings': 'إعدادات المدرسة',
    'Edit Classroom': 'تعديل القسم', 'Update': 'تحديث', 'Cancel': 'إلغاء',
    'Classroom updated successfully': 'تم تحديث القسم بنجاح',
    'Delete this classroom?': 'هل تريد حذف هذا القسم؟',
    'Delete': 'حذف', 'Edit': 'تعديل', 'Name': 'الاسم', 'Capacity': 'السعة', 'Description': 'الوصف',
    'Notifications': 'الإشعارات', 'Log Out': 'تسجيل الخروج',
    'Certificate': 'الشهادة', 'Generate Certificate': 'إصدار شهادة',
    'Generate': 'إصدار', 'Print / Download': 'طباعة / تحميل',
    'No records found': 'لا توجد سجلات', 'Loading...': 'جاري التحميل...',
    'Backend connected': 'الخادم متصل', 'Backend offline': 'الخادم غير متصل',
    'Student created successfully': 'تم إنشاء الطالب بنجاح',
    'Teacher created successfully': 'تم إنشاء الأستاذ بنجاح',
    'Formation created successfully': 'تم إنشاء الدورة بنجاح',
    'Formation updated successfully': 'تم تحديث الدورة بنجاح',
    'Formation deleted successfully': 'تم حذف الدورة بنجاح',
    'Student updated successfully': 'تم تحديث الطالب بنجاح',
    'Teacher updated successfully': 'تم تحديث الأستاذ بنجاح',
    'Group created successfully': 'تم إنشاء المجموعة بنجاح',
    'Group updated successfully': 'تم تحديث المجموعة بنجاح',
    'Passwords do not match': 'كلمات المرور غير متطابقة',
    'Admin updated successfully': 'تم تحديث المشرف بنجاح',
    'Admin removed successfully': 'تم إزالة المشرف بنجاح',
    'Settings saved successfully': 'تم حفظ الإعدادات بنجاح',
    'Classroom added': 'تم إضافة القسم',
    'Certificate downloaded successfully!': 'تم تحميل الشهادة بنجاح!',
    'ZIP file created successfully!': 'تم إنشاء ملف ZIP بنجاح!',
    'Promo code generated successfully': 'تم إنشاء رمز ترويجي بنجاح',
    'Program deleted.': 'تم حذف البرنامج.',
    'Successfully imported ': 'تم استيراد ',
    ' students!': ' طلاب بنجاح!',
    'Attendance validated and locked successfully!': 'تم التحقق من الحضور وتأكيده بنجاح!',

    // ── Niveau / Level ────────────────────────────────────────────────────────
    'Beginner': 'للمبتدئين',
    'Intermediate': 'متوسط',
    'Advanced': 'متقدم',

    // ── Formation / Subscription labels ──────────────────────────────────────
    'Formation': 'دورة',
    'Subscription': 'اشتراك',
    'Open': 'مفتوح',
    'Closed': 'مغلق',

    // ── Add Student form ──────────────────────────────────────────────────────
    'New Student Registration': 'تسجيل طالب جديد',
    'Fill in all required fields to register a new student.': 'أدخل جميع الحقول المطلوبة لتسجيل طالب جديد.',
    'Personal Information': 'المعلومات الشخصية',
    'First Name': 'الاسم', 'Last Name': 'اللقب',
    'Email': 'البريد الإلكتروني', 'Password': 'كلمة المرور',
    'Gender': 'الجنس', 'Birth Date': 'تاريخ الميلاد', 'Blood Type': 'فصيلة الدم',
    'Select gender': 'اختر الجنس', 'Male': 'ذكر', 'Female': 'أنثى',
    'Not specified': 'غير محدد',
    'Academic': 'المعلومات الأكاديمية',
    'Formation': 'الدورة التدريبية',
    'Loading formations...': 'جاري تحميل الدورات...',
    'Enrollment Date': 'تاريخ التسجيل',
    'Payment Status': 'حالة الدفع', 'Not Paid': 'غير مدفوع', 'Paid': 'مدفوع',
    'Promo Code': 'رمز الترقية', 'No promo code': 'بدون رمز ترقية',
    'Subscription Plan': 'خطة الاشتراك', 'Select plan': 'اختر خطة',
    'Per Month (1 Month)': 'شهرياً (شهر واحد)',
    'Per 3 Months': 'كل 3 أشهر',
    'Per Year (12 Months)': 'سنوياً (12 شهراً)',
    'Parent / Guardian Contact': 'معلومات الاتصال بولي الأمر',
    'Parent Name': 'اسم ولي الأمر',
    'Phone 1': 'الهاتف 1', 'Phone 2': 'الهاتف 2',
    'Primary': 'الرئيسي', 'Optional': 'اختياري',
    'Guardian Name': 'اسم النائب',
    'Relationship': 'صلة القرابة',
    'Guardian ID #': 'رقم بطاقة النائب',
    'Parents Status': 'حالة الوالدين',
    '— Not specified —': '— غير محدد —',
    'Together': 'متزوجان',
    'Divorced': 'مطلقان',
    'Father Deceased': 'الأب متوفى',
    'Mother Deceased': 'الأم متوفاة',
    'Both Deceased': 'كلاهما متوفى',
    'Other': 'أخرى',
    'Health Status': 'الحالة الصحية',
    'Does the student need special care?': 'هل يحتاج التلميذ رعاية خاصة؟',
    'No — Normal Health': 'لا — صحة طبيعية',
    'Yes — Needs Special Care': 'نعم — يحتاج رعاية خاصة',
    'Other': 'أخرى',
    'Photo URL': 'رابط الصورة',
    'Save Student': 'حفظ الطالب',
    'Back': 'رجوع',
    // placeholders
    'Full name of parent': 'الاسم الكامل لولي الأمر',
    'First & Last name': 'الاسم واللقب',
    'e.g. Uncle, Aunt...': 'مثال: عم، خالة...',
    'National ID': 'رقم بطاقة التعريف الوطنية',
    'Describe any health conditions, allergies, or special requirements...': 'صف الحالة الصحية، الحساسية أو أي متطلبات خاصة...',
    'https://example.com/photo.jpg': 'https://example.com/photo.jpg',

    // ── Formation detail page ──────────────────────────────────────────────────
    'hours': 'ساعة',
    'Free': 'مجاني',
    'No description provided.': 'لم يتم توفير وصف.',
    'No teacher assigned': 'لم يتم تعيين أستاذ',
    'No classroom assigned': 'لم يتم تعيين قسم',
    'Formation Information': 'معلومات الدورة',
    'Duration': 'المدة',
    'Places Capacity': 'عدد المقاعد',
    'Registered': 'المسجلون',
    'Created On': 'تاريخ الإنشاء',
    'Price': 'السعر',
    'Start Date': 'تاريخ البداية',
    'End Date': 'تاريخ النهاية',
    'Description': 'الوصف',
    'Details': 'التفاصيل',

    // ── Add/Edit Formation form ────────────────────────────────────────────────
    'Add Formation': 'إضافة دورة',
    'Edit Formation': 'تعديل الدورة',
    'Title': 'العنوان',
    'Assign Teacher': 'تعيين أستاذ',
    'Image URL': 'رابط الصورة',
    'Duration (hours)': 'المدة (ساعات)',
    'Price (DA)': 'السعر (دج)',
    'Type': 'النوع',
    'Status': 'الحالة',
    'Number of Places': 'عدد المقاعد',
    'Monthly Price (DA)': 'السعر الشهري (دج)',
    '3-Month Price (DA)': 'سعر 3 أشهر (دج)',
    'Yearly Price (DA)': 'السعر السنوي (دج)',
    'Save Formation': 'حفظ الدورة',
    'Update Formation': 'تحديث الدورة',
    'Edit': 'تعديل',
    'Add': 'إضافة',
    'Create a new training formation.': 'إنشاء دورة تدريبية جديدة.',
    'Update formation details.': 'تحديث تفاصيل الدورة.',
    'Used for formations.': 'يستخدم للدورات.',
    'Leave empty for subscriptions and assign later when creating a group.': 'اتركه فارغاً للاشتراكات وعيّنه لاحقاً عند إنشاء فوج.',
    'e.g. Web Development Bootcamp': 'مثال: دورة تطوير الويب',
    'Formation description...': 'وصف الدورة...',
    'e.g. 40': 'مثال: 40',
    'Loading...': 'جاري التحميل...',
    'Formation created successfully': 'تم إنشاء الدورة بنجاح',
    'Formation updated successfully': 'تم تحديث الدورة بنجاح',
    'Formation deleted successfully': 'تم حذف الدورة بنجاح',
    'Delete this formation?': 'هل أنت متأكد من حذف هذه الدورة؟'
  };
  function t(s) { return currentLang === 'ar' ? (AR[s] || s) : s; }
  function applyTranslations(root) {
    if (currentLang !== 'ar' || !root) return;
    root.querySelectorAll('[data-i18n]').forEach(function (el) {
      var k = el.getAttribute('data-i18n'), v = AR[k];
      if (v) el.textContent = v;
    });
    // Translate placeholder attributes
    root.querySelectorAll('[data-i18n-ph]').forEach(function (el) {
      var k = el.getAttribute('data-i18n-ph'), v = AR[k];
      if (v) el.placeholder = v;
    });
    // Translate option elements
    root.querySelectorAll('option[data-i18n]').forEach(function (el) {
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
  // Returns a working image src — uses photo URL if set, otherwise a generated realistic avatar
  function getStrHash(str) {
    var hash = 0;
    str = String(str || '');
    for (var i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash % 1000) + 1;
  }

  function avatarUrl(photo, name, type, gender) {
    if (photo && photo.trim() && photo.indexOf('/img/avatar-') === -1 && photo.indexOf('ui-avatars') === -1 && photo.indexOf('base64') === -1) {
        return photo.trim();
    }
    var isFemale = gender && (gender.toLowerCase() === 'female' || gender === 'أنثى');
    
    if (type === 'student') {
        return isFemale ? encodeURI('img/طالبة مسلمة.webp') : encodeURI('img/طالب.webp');
    } else if (type === 'teacher') {
        return isFemale ? encodeURI('img/معلمة مسلمة.webp') : encodeURI('img/معلم.webp');
    } else {
        return isFemale ? encodeURI('img/مشرفة.webp') : encodeURI('img/ادمين.webp');
    }
}

  // For formation cards that may have an image URL
  function formationImg(img, title) {
    if (img && img.trim()) return img.trim();
    return 'img/formation-placeholder.jpg';
  }

  // For school logos
  function schoolImg(img, name) {
    if (img && img.trim()) return img.trim();
    var lock = getStrHash(name || 'school');
    return 'https://loremflickr.com/150/150/school,building?lock=' + lock;
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
  function parseDisplayDate(value) {
    if (!value) return null;
    if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
    var raw = String(value).trim();
    if (!raw) return null;
    var normalized = raw.replace(' ', 'T');
    if (!/[zZ]|[+-]\d{2}:\d{2}$/.test(normalized)) normalized += 'Z';
    var date = new Date(normalized);
    return isNaN(date.getTime()) ? null : date;
  }
  function formatGmtPlusOneDate(value) {
    var date = parseDisplayDate(value);
    if (!date) {
      if (!value) return '-';
      var raw = String(value).trim();
      return raw.split('T')[0].split(' ')[0] || '-';
    }
    var shifted = new Date(date.getTime() + 60 * 60 * 1000);
    return shifted.toISOString().slice(0, 10);
  }
  // Format any date value (ISO or YYYY-MM-DD) to DD/MM/YYYY
  function fmtDate(value) {
    if (!value) return '-';
    var raw = String(value).trim();
    // Extract YYYY-MM-DD part regardless of time/timezone suffix
    var ymd = raw.split('T')[0].split(' ')[0];
    if (!ymd || ymd === '-') return '-';
    var parts = ymd.split('-');
    if (parts.length === 3) return parts[2] + '/' + parts[1] + '/' + parts[0];
    return ymd;
  }
  function setText(sel, val) { var e = document.querySelector(sel); if (e) e.textContent = val; }
  function redirect(url) { window.location.href = url; }
  function urlParam(name) {
    var m = new RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
    return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : null;
  }
  function getPage() { return (document.body && document.body.getAttribute('data-page')) || ''; }
  function isAuthPage() { var p = getPage(); return p === 'login' || p === 'register' || p === 'setup-school'; }
  function showAlert(sel, msg, type) {
    var el = document.querySelector(sel); if (!el) return;
    el.className = 'alert alert-' + (type || 'danger');
    el.textContent = msg; el.style.display = 'block';
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // ── Language switcher ────────────────────────────────────────────────────────
  function initLanguageSwitcher() {
    // Language switching is handled entirely by i18n.js via window.setAppLanguage()
  }

  // ── Auth ─────────────────────────────────────────────────────────────────────
  function ensureAuth() {
    if (isAuthPage()) {
      if (getToken()) request('/api/auth/me').then(function (ctx) {
        if (ctx.user.role === 'student' || ctx.user.role === 'teacher') {
          clearToken(); return;
        }
        if (ctx.needsSchoolSetup && getPage() !== 'setup-school') redirect('setup-school.html');
        else if (!ctx.needsSchoolSetup) redirect('index.html');
      }).catch(function () { clearToken(); });
      return;
    }
    if (!getToken()) { redirect('login.html'); return; }
    request('/api/auth/me').then(function (ctx) {
      if (ctx.user.role === 'student' || ctx.user.role === 'teacher') {
        clearToken(); redirect('login.html'); return;
      }
      if (ctx.needsSchoolSetup && window.location.pathname.indexOf('setup-school.html') === -1) { redirect('setup-school.html'); return; }

      window._ctx = ctx;
      populateAuthUI();
    }).catch(function () { clearToken(); redirect('login.html'); });
  }

  function populateAuthUI() {
    var ctx = window._ctx;
    if (!ctx) return;

    var name = [ctx.user.first_name, ctx.user.last_name].filter(Boolean).join(' ');
    setText('#backend-user-name', name);
    setText('#backend-school-name', ctx.school ? ctx.school.name : '');
    setText('#backend-school-name-footer', ctx.school ? ctx.school.name : '');

    var schoolLogo = document.getElementById('sb-school-logo');
    if (schoolLogo && ctx.school) {
      schoolLogo.src = schoolImg(ctx.school.logo, ctx.school.name);
    }

    var userAvatar = document.getElementById('header-user-avatar');
    if (userAvatar) {
      userAvatar.src = avatarUrl(ctx.user.photo, name, 'default', ctx.user.gender);
    }

    if (ctx.school) window._schoolId = ctx.school.id;
    bindLogout();
  }

  function bindLogout() {
    document.querySelectorAll('[data-backend-logout]').forEach(function (btn) {
      if (btn._lb) return; btn._lb = true;
      btn.addEventListener('click', function (e) { e.preventDefault(); clearToken(); redirect('login.html'); });
    });
  }

  window.SchoolBackend = {
    afterPartialLoad: function (name) {
      populateAuthUI();
      if (name === 'header') { bindLogout(); initLanguageSwitcher(); applyTranslations(document.getElementById('header-placeholder')); loadNotifications(); }
      if (name === 'sidebar') applyTranslations(document.getElementById('sidebar-placeholder'));
    }
  };

  // ── Health ───────────────────────────────────────────────────────────────────
  function loadHealth() {
    var badge = document.querySelector('#backend-health-badge'); if (!badge) return;
    request('/health').then(function (p) {
      badge.className = 'label label-success'; badge.textContent = t('Backend connected');
      setText('#backend-health-detail', p.database);
    }).catch(function () {
      badge.className = 'label label-danger'; badge.textContent = t('Backend offline');
    });
  }

  // ── Notifications ────────────────────────────────────────────────────────────
  function loadNotifications() {
    var notifBadge = document.getElementById('notif-badge');
    var notifCountText = document.getElementById('notif-count-text');
    var notifList = document.getElementById('notif-list');
    var notifBtn = document.querySelector('#topbar-notif-menu .topbar-icon-btn');
    if (!notifBadge || !notifList) return;

    request('/api/student-registrations/payments?payment_due=overdue').then(function (p) {
      var rows = p.data || [];
      if (rows.length > 0) {
        notifBadge.style.display = 'block';
        if (notifCountText) {
          notifCountText.style.display = 'inline-block';
          notifCountText.textContent = rows.length;
        }
        if (notifBtn) notifBtn.style.pointerEvents = 'auto'; // enable click to open dropdown
        notifList.innerHTML = rows.map(function (r) {
          var name = esc([r.first_name, r.last_name].filter(Boolean).join(' '));
          var img = avatarUrl(r.photo, name, 'student', r.gender);
          return '<a href="student-profile.html?id=' + r.id + '" style="display: flex; align-items: center; padding: 12px; border-bottom: 1px solid #eee; text-decoration: none; color: #333;">' +
            '<img src="' + esc(img) + '" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover; margin-right: 12px; flex-shrink: 0;" onerror="this.src=\'' + avatarUrl('', name, 'student', typeof r !== 'undefined' ? r.gender : (typeof s !== 'undefined' ? s.gender : null)) + '\'">' +
            '<div><div style="font-weight: 600; font-size: 13px;">' + name + '</div>' +
            '<div style="font-size: 11px; color: #e74c3c;">Payment Overdue</div></div></a>';
        }).join('');
      } else {
        notifBadge.style.display = 'none';
        if (notifCountText) notifCountText.style.display = 'none';
        if (notifBtn) notifBtn.style.pointerEvents = 'auto';
        notifList.innerHTML = '<div style="padding: 20px; text-align: center; color: #999; font-size: 13px;">No notifications</div>';
      }
    }).catch(function (err) {
      console.error('Failed to load notifications', err);
    });
  }

  // ── Dashboard ────────────────────────────────────────────────────────────────
  function loadDashboard() {
    if (!document.getElementById('backend-dashboard-shell')) return;
    request('/api/dashboard/overview').then(function (p) {
      var s = p.school;
      window._schoolName = s.name;
      setText('#backend-school-name', s.name);
      setText('#backend-school-name-footer', s.name);
      setText('#backend-school-status', 'School: ' + s.name);
      ['users', 'teachers', 'students', 'classrooms', 'formations', 'groups'].forEach(function (k) {
        setText('#backend-count-' + k, p.counts[k]);
      });
    }).catch(function (err) {
      setText('#backend-dashboard-status', err.message);
      if (err.message === 'School setup required') redirect('setup-school.html');
    });
    request('/api/dashboard/recent-students').then(function (p) { renderRecentStudents(p.data || []); }).catch(function () { });
    request('/api/dashboard/recent-teachers').then(function (p) { renderRecentTeachers(p.data || []); }).catch(function () { });
    request('/api/dashboard/formations-summary').then(function (p) { renderFormationsSummary(p.data || []); }).catch(function () { });
  }

  function renderRecentStudents(rows) {
    var tb = document.querySelector('#backend-recent-students tbody'); if (!tb) return;
    if (!rows.length) { tb.innerHTML = '<tr><td colspan="5" class="text-center">' + t('No records found') + '</td></tr>'; return; }
    tb.innerHTML = rows.map(function (r) {
      var name = [r.first_name, r.last_name].filter(Boolean).join(' ');
      var img = '<img src="' + esc(avatarUrl(r.photo, name, 'student', r.gender)) + '" style="width:32px;height:32px;border-radius:50%;object-fit:cover" onerror="this.src=\'' + avatarUrl('', name, 'student', typeof r !== 'undefined' ? r.gender : (typeof s !== 'undefined' ? s.gender : null)) + '\'">';
      return '<tr><td>' + img + '</td><td>' + esc(r.registration_number) + '</td><td>' + esc(name) + '</td><td>' + esc(r.email) + '</td><td>' + esc(r.enrollment_date || '-') + '</td></tr>';
    }).join('');
  }

  function renderRecentTeachers(rows) {
    var tb = document.querySelector('#backend-recent-teachers tbody'); if (!tb) return;
    if (!rows.length) { tb.innerHTML = '<tr><td colspan="5" class="text-center">' + t('No records found') + '</td></tr>'; return; }
    tb.innerHTML = rows.map(function (r) {
      var name = [r.first_name, r.last_name].filter(Boolean).join(' ');
      var img = '<img src="' + esc(avatarUrl(r.photo, name, 'teacher', r.gender)) + '" style="width:32px;height:32px;border-radius:50%;object-fit:cover">';
      return '<tr><td>' + img + '</td><td>' + esc(r.employee_number) + '</td><td>' + esc(name) + '</td><td>' + esc(r.speciality || '-') + '</td><td>' + esc(r.hire_date || '-') + '</td></tr>';
    }).join('');
  }

  function renderFormationsSummary(rows) {
    var c = document.querySelector('#backend-formations-summary'); if (!c) return;
    if (!rows.length) { c.innerHTML = '<p class="text-muted col-lg-12">' + t('No records found') + '</p>'; return; }
    c.innerHTML = rows.map(function (f) {
      var img = formationImg(f.image, f.title);
      return '<div class="col-lg-4 col-md-6" style="margin-bottom:15px">' +
        '<div class="white-box" style="border-left:4px solid #e67e22;padding:15px;display:flex;gap:12px;align-items:center">' +
        '<img src="' + esc(img) + '" style="width:56px;height:56px;border-radius:8px;object-fit:cover">' +
        '<div><h5 style="margin:0 0 4px">' + esc(f.title) + '</h5>' +
        '<small class="text-muted">' + esc(f.teacher_name || 'No teacher') + '</small><br>' +
        '<span class="label label-success">' + f.enrolled_students + ' students</span>' +
        (f.price > 0 ? ' <span class="label label-info">$' + esc(f.price) + '</span>' : '') + '</div></div></div>';
    }).join('');
  }

  // ── Auth forms ───────────────────────────────────────────────────────────────
  function bindLoginForm() {
    var form = document.querySelector('#backend-login-form'); if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault(); var fd = new FormData(form);
      request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: fd.get('email'), password: fd.get('password') }) })
        .then(function (r) {
          if (r.user.role === 'student' || r.user.role === 'teacher') {
            showAlert('#backend-auth-status', 'Students and teachers must use the student/teacher portal.');
            return;
          }
          setToken(r.token); redirect(r.needsSchoolSetup ? 'setup-school.html' : 'index.html');
        })
        .catch(function (err) { showAlert('#backend-auth-status', err.message); });
    });
  }
  function bindRegisterForm() {
    var form = document.querySelector('#backend-register-form'); if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault(); var fd = new FormData(form);
      if (fd.get('password') !== fd.get('confirm_password')) { showAlert('#backend-auth-status', t('Passwords do not match')); return; }
      request('/api/auth/register', { method: 'POST', body: JSON.stringify({ first_name: fd.get('first_name'), last_name: fd.get('last_name'), email: fd.get('email'), password: fd.get('password') }) })
        .then(function (r) { setToken(r.token); redirect(r.needsSchoolSetup ? 'setup-school.html' : 'index.html'); })
        .catch(function (err) { showAlert('#backend-auth-status', err.message); });
    });
  }
  function loadSchoolSettings() {
    var form = document.querySelector('#backend-setup-school-form'); if (!form) return;
    request('/api/school-setup/settings').then(function (p) {
      if (!p.school) return; // New school setup mode
      var s = p.school;
      var c = p.contact_info || {};
      var u = p.admin || {};

      // Check if logged in user is the primary admin (creator of the school)
      var isSuperAdmin = (window._ctx && window._ctx.user && window._ctx.user.id === s.admin_id);
      if (!isSuperAdmin) {
        // Hide Manage Admins for secondary admins
        var navAdmins = document.querySelector('a[href="#tab-admins"]');
        if (navAdmins && navAdmins.parentElement) navAdmins.parentElement.style.display = 'none';
      }

      form.querySelector('[name="name"]').value = s.name || '';
      var logoEl = form.querySelector('[name="logo"]'); if (logoEl) logoEl.value = s.logo || '';

      var fbEl = form.querySelector('[name="fb"]'); if (fbEl) fbEl.value = c.fb || '';
      var waEl = form.querySelector('[name="whatsapp"]'); if (waEl) waEl.value = c.whatsapp || '';
      var liEl = form.querySelector('[name="linkedin"]'); if (liEl) liEl.value = c.linkedin || '';

      var fnEl = form.querySelector('[name="admin_first_name"]'); if (fnEl) fnEl.value = u.first_name || '';
      var lnEl = form.querySelector('[name="admin_last_name"]'); if (lnEl) lnEl.value = u.last_name || '';
      var emEl = form.querySelector('[name="admin_email"]'); if (emEl) emEl.value = u.email || '';
      renderExistingAdmins(p.additional_admins || []);
    }).catch(function (err) {
      // If endpoint doesn't exist yet or fails, ignore gracefully
      console.error(err);
    });
  }

  function renderExistingAdmins(admins) {
    var container = document.getElementById('existing-admins-list');
    if (!container) return;
    if (!admins.length) {
      container.innerHTML = '<div class="text-muted" style="margin-bottom:16px"><i class="fa fa-info-circle"></i> No additional admins configured yet.</div>';
      return;
    }
    container.innerHTML = admins.map(function (admin) {
      return '<div class="additional-admin-card" data-admin-id="' + admin.id + '">' +
        '<div class="row">' +
        '<div class="col-md-3"><div class="form-group"><label>First Name</label><input type="text" class="form-control admin-first-name" value="' + esc(admin.first_name || '') + '"></div></div>' +
        '<div class="col-md-3"><div class="form-group"><label>Last Name</label><input type="text" class="form-control admin-last-name" value="' + esc(admin.last_name || '') + '"></div></div>' +
        '<div class="col-md-4"><div class="form-group"><label>Email</label><input type="email" class="form-control admin-email" value="' + esc(admin.email || '') + '"></div></div>' +
        '<div class="col-md-2"><div class="form-group"><label>Status</label><select class="form-control admin-is-active"><option value="1"' + (admin.is_active ? ' selected' : '') + '>Active</option><option value="0"' + (!admin.is_active ? ' selected' : '') + '>Inactive</option></select></div></div>' +
        '</div>' +
        '<div class="row">' +
        '<div class="col-md-6"><div class="form-group"><label>New Password</label><input type="password" class="form-control admin-password" placeholder="Leave blank to keep current"></div></div>' +
        '<div class="col-md-6 admin-card-actions">' +
        '<button type="button" class="btn admin-save-button" data-admin-id="' + admin.id + '"><i class="fa fa-save"></i> Save</button>' +
        '<button type="button" class="btn admin-delete-button" data-admin-id="' + admin.id + '"><i class="fa fa-trash"></i> Remove</button>' +
        '</div>' +
        '</div>' +
        '</div>';
    }).join('');
  }

  function addAdditionalAdminRow() {
    var container = document.getElementById('additional-admins-list'); if (!container) return;
    var row = document.createElement('div');
    row.className = 'additional-admin-row';
    row.setAttribute('data-new-admin', '1');
    row.innerHTML =
      '<div class="row">' +
      '<div class="col-md-3"><div class="form-group"><label>First Name</label><input type="text" name="additional_admin_first_name[]" class="form-control" required></div></div>' +
      '<div class="col-md-3"><div class="form-group"><label>Last Name</label><input type="text" name="additional_admin_last_name[]" class="form-control" required></div></div>' +
      '<div class="col-md-4"><div class="form-group"><label>Email</label><input type="email" name="additional_admin_email[]" class="form-control" required></div></div>' +
      '<div class="col-md-2"><div class="form-group"><label>Status</label><select name="additional_admin_is_active[]" class="form-control"><option value="1">Active</option><option value="0">Inactive</option></select></div></div>' +
      '</div>' +
      '<div class="row">' +
      '<div class="col-md-6"><div class="form-group"><label>Password</label><input type="password" name="additional_admin_password[]" class="form-control" required></div></div>' +
      '<div class="col-md-6 admin-card-actions">' +
      '<button type="button" class="btn remove-additional-admin"><i class="fa fa-times"></i> Remove</button>' +
      '</div>' +
      '</div>';
    container.appendChild(row);
  }

  function bindAdditionalAdminControls() {
    var addBtn = document.getElementById('add-additional-admin');
    if (addBtn) {
      addBtn.addEventListener('click', function () { addAdditionalAdminRow(); });
    }
    var container = document.getElementById('additional-admins-list');
    if (container) {
      container.addEventListener('click', function (e) {
        if (!e.target.closest('.remove-additional-admin')) return;
        var row = e.target.closest('.additional-admin-row'); if (row) row.remove();
      });
    }

    var existingContainer = document.getElementById('existing-admins-list');
    if (existingContainer) {
      existingContainer.addEventListener('click', function (e) {
        var saveBtn = e.target.closest('.admin-save-button');
        if (saveBtn) {
          var card = saveBtn.closest('.additional-admin-card');
          if (card) saveExistingAdmin(card);
          return;
        }
        var deleteBtn = e.target.closest('.admin-delete-button');
        if (deleteBtn) {
          var card = deleteBtn.closest('.additional-admin-card');
          if (card) deleteExistingAdmin(card);
          return;
        }
      });
    }
  }

  function saveExistingAdmin(card) {
    var adminId = card.getAttribute('data-admin-id');
    if (!adminId) return;
    var payload = {
      first_name: card.querySelector('.admin-first-name') ? card.querySelector('.admin-first-name').value.trim() : null,
      last_name: card.querySelector('.admin-last-name') ? card.querySelector('.admin-last-name').value.trim() : null,
      email: card.querySelector('.admin-email') ? card.querySelector('.admin-email').value.trim() : null,
      is_active: card.querySelector('.admin-is-active') ? (card.querySelector('.admin-is-active').value === '1' ? 1 : 0) : 1,
      password: card.querySelector('.admin-password') ? card.querySelector('.admin-password').value : null,
    };
    if (!payload.first_name || !payload.last_name || !payload.email) {
      showAlert('#backend-setup-status', t('First name, last name and email are required for admin updates.'));
      return;
    }
    request('/api/school-setup/settings/admin/' + encodeURIComponent(adminId), { method: 'PUT', body: JSON.stringify(payload) })
      .then(function () {
        showAlert('#backend-setup-status', t('Admin updated successfully'), 'success');
        loadSchoolSettings();
      })
      .catch(function (err) { showAlert('#backend-setup-status', err.message); });
  }

  function deleteExistingAdmin(card) {
    var adminId = card.getAttribute('data-admin-id');
    if (!adminId) return;
    if (!confirm(t('Remove this admin from the school?'))) return;
    request('/api/school-setup/settings/admin/' + encodeURIComponent(adminId), { method: 'DELETE' })
      .then(function () {
        showAlert('#backend-setup-status', t('Admin removed successfully'), 'success');
        loadSchoolSettings();
      })
      .catch(function (err) { showAlert('#backend-setup-status', err.message); });
  }

  function bindSetupSchoolForm() {
    var form = document.querySelector('#backend-setup-school-form'); if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault(); var fd = new FormData(form);
      var payload = {
        name: fd.get('name'),
        logo: fd.get('logo') || null,
        fb: fd.get('fb') || null,
        whatsapp: fd.get('whatsapp') || null,
        linkedin: fd.get('linkedin') || null,
        admin_first_name: fd.get('admin_first_name') || null,
        admin_last_name: fd.get('admin_last_name') || null,
        admin_email: fd.get('admin_email') || null,
        admin_password: fd.get('admin_password') || null
      };

      var btn = form.querySelector('[type=submit]'); if (btn) btn.disabled = true;
      var adminRows = form.querySelectorAll('.additional-admin-row[data-new-admin]');
      if (adminRows.length) {
        payload.additional_admins = Array.prototype.slice.call(adminRows).map(function (row) {
          return {
            first_name: row.querySelector('[name="additional_admin_first_name[]"]')?.value || null,
            last_name: row.querySelector('[name="additional_admin_last_name[]"]')?.value || null,
            email: row.querySelector('[name="additional_admin_email[]"]')?.value || null,
            password: row.querySelector('[name="additional_admin_password[]"]')?.value || null,
            is_active: row.querySelector('[name="additional_admin_is_active[]"]')?.value === '1' ? 1 : 0,
          };
        }).filter(function (admin) {
          return admin.first_name && admin.last_name && admin.email && admin.password;
        });
      }
      request('/api/school-setup/settings', { method: 'PUT', body: JSON.stringify(payload) })
        .then(function (res) {
          showAlert('#backend-setup-status', t('Settings saved successfully'), 'success');
          if (btn) btn.disabled = false;
          // Refresh auth context
          request('/api/auth/me').then(function (ctx) {
            window._ctx = ctx;
            populateAuthUI();
          }).catch(function () { });

          if (res.wasSetup) setTimeout(function () { redirect('index.html'); }, 1000);
        })
        .catch(function (err) { showAlert('#backend-setup-status', err.message); if (btn) btn.disabled = false; });
    });
  }

  // ── Students ─────────────────────────────────────────────────────────────────
  function loadStudents() {
    var tbl = document.querySelector('#backend-students-table'); if (!tbl) return;
    request('/api/student-registrations').then(function (p) { renderStudentRows(p.data || []); })
      .catch(function (err) { showAlert('#backend-students-status', err.message); });
  }
  function formatPaymentStatus(status) {
    return status === 'paid'
      ? '<span class="label label-success">Paid</span>'
      : '<span class="label label-danger">Unpaid</span>';
  }
  function renderStudentRows(rows) {
    var tbody = document.querySelector('#backend-students-table tbody'); if (!tbody) return;
    if (!rows.length) { tbody.innerHTML = '<tr><td colspan="8" class="text-center">' + t('No records found') + '</td></tr>'; return; }
    tbody.innerHTML = rows.map(function (r) {
      var fullName = [r.first_name, r.last_name].filter(Boolean).join(' ');
      var chk = '<input type="checkbox" class="row-checkbox" value="' + r.id + '" data-type="student" data-name="' + esc(fullName) + '" data-reg="' + esc(r.registration_number) + '" data-photo="' + esc(avatarUrl(r.photo, fullName, 'student', r.gender)) + '" data-formation="' + esc(r.formation_title || '') + '">';
      var name = esc(fullName);
      var img = '<img src="' + esc(avatarUrl(r.photo, fullName, 'student', r.gender)) + '" style="width:36px;height:36px;border-radius:50%;object-fit:cover" onerror="this.src=\'https://ui-avatars.com/api/?name=S&background=27ae60&color=fff&size=36\'">';
      var payStatus = r.payment_status === 'paid'
        ? '<span class="label label-success">Paid</span>'
        : '<span class="label label-danger">Unpaid</span>';
      return '<tr><td>' + chk + '</td><td>' + img + '</td><td>' + esc(r.registration_number) + '</td><td>' + name + '</td><td>' + esc(r.email) + '</td><td>' + (r.is_active ? '<span class="label label-success">Active</span>' : '<span class="label label-danger">Inactive</span>') + '</td><td>' + esc(r.parent_name || '-') + '</td><td>' + esc(formatGmtPlusOneDate(r.enrollment_date)) + '</td><td>' + payStatus + '</td>' +
        '<td><a href="student-profile.html?id=' + r.id + '" class="btn btn-xs btn-success" title="View Details"><i class="fa fa-eye"></i></a> ' +
        '<a href="edit-student.html?id=' + r.id + '" class="btn btn-xs btn-info" title="Edit"><i class="fa fa-pencil"></i></a> ' +
        '<button class="btn btn-xs btn-danger" data-del-student="' + r.id + '" title="Delete"><i class="fa fa-trash"></i></button></td></tr>';
    }).join('');
    document.querySelector('#backend-students-table').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-del-student]'); if (!btn) return;
      if (!confirm('Delete this student?')) return;
      request('/api/student-registrations/' + btn.getAttribute('data-del-student'), { method: 'DELETE' })
        .then(loadStudents).catch(function (err) { showAlert('#backend-students-status', err.message); });
    });
  }

  function formatSubscriptionPlan(plan) {
    if (plan === '1_month') return '1 Month';
    if (plan === '3_months') return '3 Months';
    if (plan === '1_year') return '1 Year';
    return plan ? plan.replace(/_/g, ' ') : '-';
  }

  var paymentsPageLoading = false;
  var paymentsPageInitialized = false;

  function loadPaymentsPage() {
    var tbl = document.querySelector('#backend-payments-table'); if (!tbl) return;
    if (paymentsPageLoading) return;

    var filters = {
      formation_id: document.getElementById('payment-filter-formation') ? document.getElementById('payment-filter-formation').value : null,
      group_id: document.getElementById('payment-filter-group') ? document.getElementById('payment-filter-group').value : null,
      classroom_id: document.getElementById('payment-filter-classroom') ? document.getElementById('payment-filter-classroom').value : null,
      teacher_id: document.getElementById('payment-filter-teacher') ? document.getElementById('payment-filter-teacher').value : null,
      subscription_plan: document.getElementById('payment-filter-subscription') ? document.getElementById('payment-filter-subscription').value : null,
      payment_date_start: document.getElementById('payment-filter-date-start') ? document.getElementById('payment-filter-date-start').value : null,
      payment_date_end: document.getElementById('payment-filter-date-end') ? document.getElementById('payment-filter-date-end').value : null,
    };
    if (filters.payment_date_start && filters.payment_date_end && filters.payment_date_end < filters.payment_date_start) {
      var tmp = filters.payment_date_start;
      filters.payment_date_start = filters.payment_date_end;
      filters.payment_date_end = tmp;
    }
    var params = new URLSearchParams();
    Object.keys(filters).forEach(function (key) { if (filters[key]) params.append(key, filters[key]); });
    var url = '/api/student-registrations/payments' + (params.toString() ? '?' + params.toString() : '');

    paymentsPageLoading = true;
    request(url)
      .then(function (p) { renderPaymentRows(p.data || []); renderPaymentSummary(p.summary || {}); })
      .catch(function (err) { showAlert('#backend-payments-status', err.message); })
      .finally(function () { paymentsPageLoading = false; });
  }

  function renderPaymentRows(rows) {
    var tbody = document.querySelector('#backend-payments-table tbody'); if (!tbody) return;
    if (!rows.length) { tbody.innerHTML = '<tr><td colspan="10" class="text-center">' + t('No records found') + '</td></tr>'; return; }
    var today = formatGmtPlusOneDate(new Date());
    tbody.innerHTML = rows.map(function (r) {
      var name = esc([r.first_name, r.last_name].filter(Boolean).join(' '));
      var nextPaymentDate = formatGmtPlusOneDate(r.next_payment_date);
      var enrollmentDate = formatGmtPlusOneDate(r.enrollment_date);
      var overdue = nextPaymentDate !== '-' && nextPaymentDate < today && r.payment_status !== 'paid';
      var trClass = overdue ? ' class="table-danger"' : '';
      return '<tr' + trClass + '>' +
        '<td>' + esc(r.registration_number) + '</td>' +
        '<td>' + name + '</td>' +
        '<td>' + esc(r.formation_title || '-') + '</td>' +
        '<td>' + esc(r.group_names || '-') + '</td>' +
        '<td>' + esc(r.classroom_names || '-') + '</td>' +
        '<td>' + formatPaymentStatus(r.payment_status) + '</td>' +
        '<td>' + esc(formatSubscriptionPlan(r.subscription_plan)) + '</td>' +
        '<td>' + esc(nextPaymentDate) + '</td>' +
        '<td>' + esc(enrollmentDate) + '</td>' +
        '<td style="white-space: nowrap;">' +
          '<a href="student-profile.html?id=' + r.id + '" class="btn btn-xs btn-success" title="View"><i class="fa fa-eye"></i></a> ' +
          '<button class="btn btn-xs btn-primary btn-enter-payment" data-student-id="' + r.id + '" title="Enter Payment"><i class="fa fa-dollar"></i></button>' +
          '</td>' +
        '</tr>';
    }).join('');

    // Bind enter-payment buttons: switch to tab-enter-payment and select student
    tbody.querySelectorAll('.btn-enter-payment').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var sid = this.getAttribute('data-student-id');
        // Switch tab
        var tabBtn = document.querySelector('[data-tab="tab-enter-payment"]');
        if (tabBtn) tabBtn.click();
        // Pre-fill search to trigger selection
        if (window._paymentsSelectStudent) {
          window._paymentsSelectStudent(sid);
        }
      });
    });
  }

  function renderPaymentSummary(summary) {
    var summaryRow = document.getElementById('payments-summary-row');
    if (!summaryRow) return;
    var amountEl = document.getElementById('payments-summary-amount');
    var studentsEl = document.getElementById('payments-summary-students');
    var filterEl = document.getElementById('payments-summary-filter');
    if (!amountEl || !studentsEl || !filterEl) return;

    amountEl.textContent = Number(summary.total_revenue || 0).toFixed(2);
    studentsEl.textContent = Number(summary.student_count || 0);
    var teacherSelect = document.getElementById('payment-filter-teacher');
    var teacherLabel = 'All Teachers';
    if (teacherSelect && teacherSelect.value) {
      teacherLabel = teacherSelect.options[teacherSelect.selectedIndex] ? teacherSelect.options[teacherSelect.selectedIndex].textContent : teacherLabel;
    }
    var startDate = document.getElementById('payment-filter-date-start') ? document.getElementById('payment-filter-date-start').value : null;
    var endDate = document.getElementById('payment-filter-date-end') ? document.getElementById('payment-filter-date-end').value : null;
    var dateRangeLabel = '';
    if (startDate && endDate) dateRangeLabel = startDate + ' → ' + endDate;
    else if (startDate) dateRangeLabel = 'From ' + startDate;
    else if (endDate) dateRangeLabel = 'Until ' + endDate;

    filterEl.textContent = teacherLabel + (dateRangeLabel ? ' / ' + dateRangeLabel : '');
    summaryRow.style.display = 'flex';
  }

  function populatePaymentFilters() {
    var formationSel = document.getElementById('payment-filter-formation');
    var groupSel = document.getElementById('payment-filter-group');
    var classroomSel = document.getElementById('payment-filter-classroom');
    var teacherSel = document.getElementById('payment-filter-teacher');
    if (!formationSel && !groupSel && !classroomSel && !teacherSel) return Promise.resolve();

    return Promise.all([
      request('/api/formations-list'),
      request('/api/groups'),
      request('/api/classrooms'),
      request('/api/teachers')
    ]).then(function (res) {
      var formations = res[0].data || [];
      var groups = res[1].data || [];
      var classrooms = res[2].data || [];
      var teachers = res[3].data || [];
      if (formationSel) {
        formationSel.innerHTML = '<option value="">All Formations</option>' + formations.map(function (f) { return '<option value="' + f.id + '">' + esc(f.title) + '</option>'; }).join('');
      }
      if (groupSel) {
        groupSel.innerHTML = '<option value="">All Groups</option>' + groups.map(function (g) { return '<option value="' + g.id + '">' + esc(g.name) + '</option>'; }).join('');
      }
      if (classroomSel) {
        classroomSel.innerHTML = '<option value="">All Classrooms</option>' + classrooms.map(function (c) { return '<option value="' + c.id + '">' + esc(c.name) + '</option>'; }).join('');
      }
      if (teacherSel) {
        teacherSel.innerHTML = '<option value="">All Teachers</option>' + teachers.map(function (t) { return '<option value="' + t.id + '">' + esc([t.first_name, t.last_name].filter(Boolean).join(' ')) + '</option>'; }).join('');
      }
    }).catch(function () { });
  }

  function bindPaymentFilters() {
    if (bindPaymentFilters.bound) return;
    bindPaymentFilters.bound = true;
    ['payment-filter-formation', 'payment-filter-group', 'payment-filter-classroom', 'payment-filter-teacher', 'payment-filter-subscription', 'payment-filter-date-start', 'payment-filter-date-end'].forEach(function (id) {
      var sel = document.getElementById(id);
      if (sel) sel.addEventListener('change', loadPaymentsPage);
    });
  }

  function populateFormationSelect(sel) {
    if (!sel) return;
    request('/api/formations-list').then(function (p) {
      var list = p.data || [];
      list = list.filter(function (f) { return f.status === 'open'; });
      sel.innerHTML = '<option value="">-- Select Formation *</option>' +
        list.map(function (f) { return '<option value="' + f.id + '" data-type="' + esc(f.type) + '">' + esc(f.title) + '</option>'; }).join('');
    }).catch(function () { });
  }

  function setupSubscriptionPlanToggle(form) {
    var formationSelect = form.querySelector('#student-formation-id');
    var subPlanGroup = form.querySelector('#subscription-plan-group');
    var subPlanSelect = form.querySelector('[name="subscription_plan"]');
    if (formationSelect && subPlanGroup) {
      formationSelect.addEventListener('change', function () {
        var opt = formationSelect.options[formationSelect.selectedIndex];
        var type = opt ? opt.getAttribute('data-type') : '';
        if (type === 'subscription') {
          subPlanGroup.style.display = 'block';
          if (subPlanSelect) subPlanSelect.required = true;
        } else {
          subPlanGroup.style.display = 'none';
          if (subPlanSelect) {
            subPlanSelect.required = false;
            subPlanSelect.value = '';
          }
        }
      });
    }
  }

  function populatePromoCodeSelect(sel, formationId) {
    if (!sel) return;
    if (!formationId) {
      sel.innerHTML = '<option value="">No promo code</option>';
      return;
    }
    request('/api/promo-codes?formation_id=' + encodeURIComponent(formationId)).then(function (p) {
      var list = p.data || [];
      sel.innerHTML = '<option value="">No promo code</option>' +
        list.filter(function (pc) { return pc.is_active !== false; }).map(function (pc) {
          return '<option value="' + esc(pc.code) + '">' + esc(pc.code) + ' (' + esc(pc.discount_percent) + '%)</option>';
        }).join('');
    }).catch(function () { sel.innerHTML = '<option value="">No promo code</option>'; });
  }

  function setupPromoCodeSelect(form) {
    var formationSelect = form.querySelector('#student-formation-id');
    var promoSelect = form.querySelector('#student-promo-code');
    if (!formationSelect || !promoSelect) return;
    formationSelect.addEventListener('change', function () {
      populatePromoCodeSelect(promoSelect, this.value);
    });
    populatePromoCodeSelect(promoSelect, formationSelect.value);
  }

  function bindAddStudentForm() {
    var form = document.querySelector('#backend-add-student-form'); if (!form) return;
    populateFormationSelect(form.querySelector('#student-formation-id'));
    setupSubscriptionPlanToggle(form);
    setupPromoCodeSelect(form);
    form.addEventListener('submit', function (e) {
      e.preventDefault(); var fd = new FormData(form);
      var btn = form.querySelector('[type=submit]'); if (btn) btn.disabled = true;
      request('/api/student-registrations', {
        method: 'POST', body: JSON.stringify({
          first_name: fd.get('first_name'), last_name: fd.get('last_name'), email: fd.get('email'), password: fd.get('password'),
          gender: fd.get('gender') || null, birth_date: fd.get('birth_date') || null, photo: fd.get('photo') || null,
          blood_type: fd.get('blood_type') || null,
          formation_id: fd.get('formation_id'),
          registration_number: Math.floor(1000000000 + Math.random() * 9000000000).toString(),
          parent_name: fd.get('parent_name') || null,
          parent_phone: fd.get('parent_phone') || null,
          phone1_has_whatsapp: fd.get('phone1_has_whatsapp') === '1' ? 1 : 0,
          phone1_has_viber: fd.get('phone1_has_viber') === '1' ? 1 : 0,
          phone1_has_telegram: fd.get('phone1_has_telegram') === '1' ? 1 : 0,
          parent_phone2: fd.get('parent_phone2') || null,
          phone2_has_whatsapp: fd.get('phone2_has_whatsapp') === '1' ? 1 : 0,
          phone2_has_viber: fd.get('phone2_has_viber') === '1' ? 1 : 0,
          phone2_has_telegram: fd.get('phone2_has_telegram') === '1' ? 1 : 0,
          guardian_name: fd.get('guardian_name') || null,
          guardian_relationship: fd.get('guardian_relationship') || null,
          guardian_id_number: fd.get('guardian_id_number') || null,
          health_notes: fd.get('health_notes') || null,
          parents_status: fd.get('parents_status') || null,
          enrollment_date: fd.get('enrollment_date') || null,
          payment_status: fd.get('payment_status') || 'not_paid',
          subscription_plan: fd.get('subscription_plan') || null,
          promo_code: fd.get('promo_code') || null,
        })
      }).then(function () { showAlert('#backend-form-status', t('Student created successfully'), 'success'); form.reset(); if (btn) btn.disabled = false; })
        .catch(function (err) { showAlert('#backend-form-status', err.message); if (btn) btn.disabled = false; });
    });
  }
  function bindEditStudentForm() {
    var form = document.querySelector('#backend-edit-student-form'); if (!form) return;
    var id = urlParam('id'); if (!id) { showAlert('#backend-form-status', 'No student ID in URL'); return; }
    var sel = form.querySelector('#student-formation-id');
    populateFormationSelect(sel);
    setupSubscriptionPlanToggle(form);
    setupPromoCodeSelect(form);
    request('/api/student-registrations/' + id).then(function (p) {
      var s = p.data;
      ['first_name', 'last_name', 'email', 'gender', 'birth_date', 'photo', 'blood_type', 'formation_id', 'registration_number', 'parent_name', 'parent_phone', 'parent_phone2', 'guardian_name', 'guardian_relationship', 'guardian_id_number', 'health_notes', 'parents_status', 'enrollment_date', 'payment_status', 'subscription_plan'].forEach(function (f) {
        var el = form.querySelector('[name="' + f + '"]'); if (el && s[f] != null) el.value = s[f];
      });
      // checkboxes
      ['phone1_has_whatsapp','phone1_has_viber','phone1_has_telegram','phone2_has_whatsapp','phone2_has_viber','phone2_has_telegram'].forEach(function(f) {
        var el = form.querySelector('[name="' + f + '"]'); if (el) el.value = s[f] ? '1' : '0';
        var chk = form.querySelector('[data-app-check="' + f + '"]'); if (chk) chk.classList.toggle('active', !!s[f]);
      });
      var statusEl = form.querySelector('[name="is_active"]');
      if (statusEl) statusEl.value = s.is_active ? '1' : '0';
      if (s.formation_id && sel) setTimeout(function () {
        sel.value = s.formation_id;
        sel.dispatchEvent(new Event('change'));
        // Re-apply subscription plan value after toggle
        setTimeout(function () {
          var planEl = form.querySelector('[name="subscription_plan"]');
          if (planEl && s.subscription_plan) planEl.value = s.subscription_plan;
          var promoEl = form.querySelector('#student-promo-code');
          if (promoEl && s.promo_code) promoEl.value = s.promo_code;
        }, 100);
      }, 600);
      var preview = document.getElementById('student-photo-preview');
      if (preview) preview.src = avatarUrl(s.photo, [s.first_name, s.last_name].join(' '), 'student', s.gender);
    }).catch(function (err) { showAlert('#backend-form-status', err.message); });
    form.addEventListener('submit', function (e) {
      e.preventDefault(); var fd = new FormData(form); var payload = {};
      ['first_name', 'last_name', 'email', 'gender', 'birth_date', 'photo', 'blood_type', 'formation_id', 'registration_number', 'parent_name', 'parent_phone', 'parent_phone2', 'guardian_name', 'guardian_relationship', 'guardian_id_number', 'health_notes', 'parents_status', 'enrollment_date', 'payment_status', 'subscription_plan', 'promo_code'].forEach(function (f) {
        var v = fd.get(f); if (v !== null) payload[f] = v || null;
      });
      // boolean app checkboxes
      ['phone1_has_whatsapp','phone1_has_viber','phone1_has_telegram','phone2_has_whatsapp','phone2_has_viber','phone2_has_telegram'].forEach(function(f) {
        var v = fd.get(f); if (v !== null) payload[f] = v === '1' ? 1 : 0;
      });
      var isActive = fd.get('is_active');
      if (isActive !== null) payload.is_active = isActive === '1' ? 1 : 0;
      var btn = form.querySelector('[type=submit]'); if (btn) btn.disabled = true;
      request('/api/student-registrations/' + id, { method: 'PUT', body: JSON.stringify(payload) })
        .then(function () { showAlert('#backend-form-status', t('Student updated successfully'), 'success'); if (btn) btn.disabled = false; })
        .catch(function (err) { showAlert('#backend-form-status', err.message); if (btn) btn.disabled = false; });
    });
  }

  function bindImportExcel() {
    var modal = document.getElementById('importExcelModal');
    var btnImport = document.getElementById('btn-do-import');
    var fileInput = document.getElementById('import-excel-file');
    var selectFormation = document.getElementById('import-formation-id');
    var status = document.getElementById('import-excel-status');
    var progressContainer = document.getElementById('import-progress-container');
    var progressBar = document.getElementById('import-progress-bar');
    var progressText = document.getElementById('import-progress-text');

    if (!modal || !btnImport) return;

    // Use jQuery event for Bootstrap modal
    if (window.jQuery) {
      $(modal).on('show.bs.modal', function () {
        populateFormationSelect(selectFormation);
        if (status) status.style.display = 'none';
        if (fileInput) fileInput.value = '';
        if (progressContainer) progressContainer.style.display = 'none';
        btnImport.disabled = false;
      });
    }

    btnImport.addEventListener('click', function () {
      var file = fileInput.files[0];
      var formationId = selectFormation.value;

      if (!formationId) {
        showAlert('#import-excel-status', 'Please select a formation.');
        return;
      }
      if (!file) {
        showAlert('#import-excel-status', 'Please select an Excel file.');
        return;
      }

      btnImport.disabled = true;
      if (status) status.style.display = 'none';

      var reader = new FileReader();
      reader.onload = function (e) {
        try {
          var data = new Uint8Array(e.target.result);
          var workbook = XLSX.read(data, { type: 'array' });
          var firstSheet = workbook.SheetNames[0];
          var rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet]);

          var studentsToImport = rows.map(function (row) {
            // Normalize keys: trim whitespace
            var r = {};
            Object.keys(row).forEach(function (k) { r[k.trim()] = row[k]; });
            return {
              first_name: r['الاسم'] || r['First Name'] || '',
              last_name: r['اللقب'] || r['Last Name'] || '',
              email: r['البريد الالكتروني'] || r['البريد الإلكتروني'] || r['Email'] || '',
              // optional fields
              birth_date: r['تاريخ الميلاد'] || r['Birth Date'] || '',
              gender: r['الجنس'] || r['Gender'] || '',
              parent_name: r['اسم الاب'] || r['Parent Name'] || '',
              parent_phone: r['رقم الهاتف'] || r['Phone'] || '',
              blood_type: r['الزمرة الدموية'] || r['Blood Type'] || '',
            };
          }).filter(function (s) { return s.first_name && s.last_name && s.email; });

          if (studentsToImport.length === 0) {
            showAlert('#import-excel-status', 'No valid students found. Ensure columns match.');
            btnImport.disabled = false;
            return;
          }

          progressContainer.style.display = 'block';
          progressText.textContent = 'Importing 0 / ' + studentsToImport.length;
          progressBar.style.width = '0%';

          var importedCount = 0;
          var errors = [];

          var processNext = function (index) {
            if (index >= studentsToImport.length) {
              if (errors.length === 0) {
                showAlert('#import-excel-status', t('Successfully imported ') + importedCount + t(' students!'), 'success');
              } else {
                showAlert('#import-excel-status', 'Imported ' + importedCount + ' students, with ' + errors.length + ' errors. Check console.', 'warning');
                console.warn('Import errors:', errors);
              }
              btnImport.disabled = false;
              loadStudents();
              if (window.jQuery && errors.length === 0) {
                setTimeout(function () { $(modal).modal('hide'); }, 2000);
              }
              return;
            }

            var s = studentsToImport[index];
            var payload = {
              first_name: String(s.first_name),
              last_name: String(s.last_name),
              email: String(s.email),
              password: '123456789',
              formation_id: formationId,
              registration_number: Math.floor(1000000000 + Math.random() * 9000000000).toString(),
              payment_status: 'not_paid',
            };
            // Optional fields — only add if present in the row
            if (s.birth_date) payload.birth_date = String(s.birth_date);
            if (s.parent_name) payload.parent_name = String(s.parent_name);
            if (s.parent_phone) payload.parent_phone = String(s.parent_phone);
            // gender: map Arabic values to expected enum
            if (s.gender) {
              var g = String(s.gender).trim();
              if (g === 'ذكر' || g.toUpperCase() === 'MALE') payload.gender = 'MALE';
              else if (g === 'أنثى' || g === 'انثى' || g.toUpperCase() === 'FEMALE') payload.gender = 'FEMALE';
            }
            // blood_type: accept Arabic or English labels
            if (s.blood_type) {
              var bt = String(s.blood_type).trim()
                .replace('موجب', '+')
                .replace('سالب', '-');
              var validBT = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
              if (validBT.indexOf(bt) !== -1) payload.blood_type = bt;
            }

            request('/api/student-registrations', {
              method: 'POST',
              body: JSON.stringify(payload)
            }).then(function () {
              importedCount++;
            }).catch(function (err) {
              errors.push({ student: s, error: err.message });
            }).finally(function () {
              var p = Math.round(((index + 1) / studentsToImport.length) * 100);
              progressBar.style.width = p + '%';
              progressText.textContent = 'Importing ' + (index + 1) + ' / ' + studentsToImport.length;
              processNext(index + 1);
            });
          };

          processNext(0);

        } catch (err) {
          showAlert('#import-excel-status', 'Error parsing Excel file: ' + err.message);
          btnImport.disabled = false;
        }
      };
      reader.onerror = function () {
        showAlert('#import-excel-status', 'Failed to read file.');
        btnImport.disabled = false;
      };
      reader.readAsArrayBuffer(file);
    });
  }


  // ── Teachers ─────────────────────────────────────────────────────────────────
  function loadTeachers() {
    var tbl = document.querySelector('#backend-teachers-table'); if (!tbl) return;
    request('/api/teacher-registrations').then(function (p) { renderTeacherRows(p.data || []); })
      .catch(function (err) { showAlert('#backend-teachers-status', err.message); });
  }
  function renderTeacherRows(rows) {
    var tbody = document.querySelector('#backend-teachers-table tbody'); if (!tbody) return;
    if (!rows.length) { tbody.innerHTML = '<tr><td colspan="7" class="text-center">' + t('No records found') + '</td></tr>'; return; }
    tbody.innerHTML = rows.map(function (r) {
      var name = esc([r.first_name, r.last_name].filter(Boolean).join(' '));
      var img = '<img src="' + esc(avatarUrl(r.photo, [r.first_name, r.last_name].join(' '), 'teacher', r.gender)) + '" style="width:36px;height:36px;border-radius:50%;object-fit:cover">';
      var chk = '<input type="checkbox" class="row-checkbox" value="' + r.id + '" data-type="teacher" data-name="' + name + '" data-reg="' + esc(r.employee_number) + '" data-photo="' + esc(avatarUrl(r.photo, name, 'teacher', r.gender)) + '" data-speciality="' + esc(r.speciality || '') + '">';
      var statusBadge = r.is_active ? '<span class="label label-success">Active</span>' : '<span class="label label-danger">Inactive</span>';
      return '<tr><td>' + chk + '</td><td>' + img + '</td><td>' + esc(r.employee_number) + '</td><td>' + name + '</td><td>' + esc(r.email) + '</td><td>' + statusBadge + '</td><td>' + esc(r.speciality || '-') + '</td><td>' + esc(r.hire_date || '-') + '</td>' +
        '<td><a href="professor-profile.html?id=' + r.id + '" class="btn btn-xs btn-success" title="View Details"><i class="fa fa-eye"></i></a> ' +
        '<a href="edit-professor.html?id=' + r.id + '" class="btn btn-xs btn-info" title="Edit"><i class="fa fa-pencil"></i></a> ' +
        '<button class="btn btn-xs btn-danger" data-del-teacher="' + r.id + '" title="Delete"><i class="fa fa-trash"></i></button></td></tr>';
    }).join('');
    document.querySelector('#backend-teachers-table').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-del-teacher]'); if (!btn) return;
      if (!confirm('Delete this teacher?')) return;
      request('/api/teacher-registrations/' + btn.getAttribute('data-del-teacher'), { method: 'DELETE' })
        .then(loadTeachers).catch(function (err) { showAlert('#backend-teachers-status', err.message); });
    });
  }
  function bindAddTeacherForm() {
    var form = document.querySelector('#backend-add-teacher-form'); if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault(); var fd = new FormData(form);
      var btn = form.querySelector('[type=submit]'); if (btn) btn.disabled = true;
      request('/api/teacher-registrations', {
        method: 'POST', body: JSON.stringify({
          first_name: fd.get('first_name'), last_name: fd.get('last_name'), email: fd.get('email'), password: fd.get('password'),
          gender: fd.get('gender') || null, birth_date: fd.get('birth_date') || null, photo: fd.get('photo') || null,
          blood_type: fd.get('blood_type') || null,
          employee_number: Math.floor(1000000000 + Math.random() * 9000000000).toString(), speciality: fd.get('speciality') || null,
          diploma: fd.get('diploma') || null, hire_date: fd.get('hire_date') || null,
        })
      }).then(function () { showAlert('#backend-form-status', t('Teacher created successfully'), 'success'); form.reset(); if (btn) btn.disabled = false; })
        .catch(function (err) { showAlert('#backend-form-status', err.message); if (btn) btn.disabled = false; });
    });
  }
  function bindEditTeacherForm() {
    var form = document.querySelector('#backend-edit-teacher-form'); if (!form) return;
    var id = urlParam('id'); if (!id) { showAlert('#backend-form-status', 'No teacher ID in URL'); return; }
    request('/api/teacher-registrations/' + id).then(function (p) {
      var tc = p.data;
      ['first_name', 'last_name', 'email', 'gender', 'birth_date', 'photo', 'blood_type', 'employee_number', 'speciality', 'diploma', 'hire_date'].forEach(function (f) {
        var el = form.querySelector('[name="' + f + '"]'); if (el && tc[f] != null) el.value = tc[f];
      });
      var statusEl = form.querySelector('[name="is_active"]');
      if (statusEl) statusEl.value = tc.is_active ? '1' : '0';
      var bloodTypeEl = form.querySelector('[name="blood_type"]');
      if (bloodTypeEl && tc.blood_type) bloodTypeEl.value = tc.blood_type;
      var preview = document.getElementById('teacher-photo-preview');
      if (preview) preview.src = avatarUrl(tc.photo, [tc.first_name, tc.last_name].join(' '), 'teacher', tc.gender);
    }).catch(function (err) { showAlert('#backend-form-status', err.message); });
    form.addEventListener('submit', function (e) {
      e.preventDefault(); var fd = new FormData(form); var payload = {};
      ['first_name', 'last_name', 'email', 'gender', 'birth_date', 'photo', 'blood_type', 'employee_number', 'speciality', 'diploma', 'hire_date'].forEach(function (f) {
        var v = fd.get(f); if (v !== null) payload[f] = v || null;
      });
      var isActive = fd.get('is_active');
      if (isActive !== null) payload.is_active = isActive === '1' ? 1 : 0;
      var btn = form.querySelector('[type=submit]'); if (btn) btn.disabled = true;
      request('/api/teacher-registrations/' + id, { method: 'PUT', body: JSON.stringify(payload) })
        .then(function () { showAlert('#backend-form-status', t('Teacher updated successfully'), 'success'); if (btn) btn.disabled = false; })
        .catch(function (err) { showAlert('#backend-form-status', err.message); if (btn) btn.disabled = false; });
    });
  }

  // ── Formations ───────────────────────────────────────────────────────────────
  function loadFormations() {
    var tbl = document.querySelector('#backend-formations-table'); if (!tbl) return;
    request('/api/formations').then(function (p) { renderFormationRows(p.data || []); })
      .catch(function (err) { showAlert('#backend-formations-status', err.message); });
  }
  function renderFormationRows(rows) {
    var tbody = document.querySelector('#backend-formations-table tbody'); if (!tbody) return;
    if (!rows.length) { tbody.innerHTML = '<tr><td colspan="11" class="text-center">' + t('No records found') + '</td></tr>'; return; }
    tbody.innerHTML = rows.map(function (r) {
      var chk = '<input type="checkbox" class="row-checkbox" value="' + r.id + '" data-type="formation">';
      var img = '<img src="' + esc(formationImg(r.image, r.title)) + '" style="width:40px;height:40px;border-radius:6px;object-fit:cover">';
      var typeLabel = r.type === 'subscription' ? t('Subscription') : t('Formation');
      var priceValue = r.type === 'subscription' ? (
        r.subscription_period === '1_month' ? r.price_monthly :
          (r.subscription_period === '3_months' ? r.price_3_months :
            (r.subscription_period === '1_year' ? r.price_1_year : r.price))
      ) : r.price;
      var statusColor = (r.status === 'open') ? '#10b981' : '#ef4444';
      var statusSelect = '<select class="form-control input-sm quick-status-change" data-id="' + r.id + '" style="padding:2px 8px; height:26px; font-size:12px; min-width:90px; color:#fff; font-weight:600; background-color:' + statusColor + '; border:none; border-radius:4px;">' +
        '<option value="open" ' + (r.status === 'open' ? 'selected' : '') + ' style="background:#fff; color:#333;">' + t('Open') + '</option>' +
        '<option value="closed" ' + (r.status === 'closed' ? 'selected' : '') + ' style="background:#fff; color:#333;">' + t('Closed') + '</option>' +
        '</select>';
      var niveauKey = r.niveau === 'begin' ? 'Beginner' : (r.niveau === 'intermediate' ? 'Intermediate' : 'Advanced');
      var niveauText = t(niveauKey);
      var placesText = r.places ? (r.registered_students || 0) + ' / ' + r.places : '-';
      return '<tr><td>' + chk + '</td><td>' + img + '</td><td>' + esc(r.title) + '</td><td>' + esc(typeLabel) + '</td><td>' + statusSelect + '</td><td>' + esc(niveauText) + '</td><td>' + esc(placesText) + '</td><td>' + esc(fmtDate(r.start_date)) + '</td><td>' + esc(fmtDate(r.end_date)) + '</td><td>' + esc(priceValue || 0) + ' DA</td>' +
        '<td><a href="course-info.html?id=' + r.id + '" class="btn btn-xs btn-success" title="View Details"><i class="fa fa-eye"></i></a> ' +
        '<a href="edit-course.html?id=' + r.id + '" class="btn btn-xs btn-info" title="Edit"><i class="fa fa-pencil"></i></a> ' +
        '<button class="btn btn-xs btn-danger" data-del-formation="' + r.id + '" title="Delete"><i class="fa fa-trash"></i></button></td></tr>';
    }).join('');
    var table = document.querySelector('#backend-formations-table');
    table.onclick = function (e) {
      var btn = e.target.closest('[data-del-formation]'); if (!btn) return;
      if (!confirm(t('Delete this formation?'))) return;
      request('/api/formations/' + btn.getAttribute('data-del-formation'), { method: 'DELETE' })
        .then(function () {
          showAlert('#backend-formations-status', t('Formation deleted successfully'), 'success');
          loadFormations();
        }).catch(function (err) { showAlert('#backend-formations-status', err.message); });
    };
    table.onchange = function (e) {
      if (e.target.classList.contains('quick-status-change')) {
        var id = e.target.getAttribute('data-id');
        var newStatus = e.target.value;
        e.target.style.backgroundColor = (newStatus === 'open') ? '#10b981' : '#ef4444';
        e.target.disabled = true;
        request('/api/formations/' + id, { method: 'PUT', body: JSON.stringify({ status: newStatus }) })
          .then(function () { e.target.disabled = false; })
          .catch(function (err) { showAlert('#backend-formations-status', err.message); e.target.disabled = false; loadFormations(); });
      }
    };
  }
  function populateTeacherSelect(sel) {
    if (!sel) return Promise.resolve();
    return request('/api/teacher-registrations').then(function (p) {
      sel.innerHTML = '<option value="">-- Select Teacher (optional) --</option>' +
        (p.data || []).filter(function (tc) { return tc.is_active !== 0 && tc.is_active !== false; }).map(function (tc) {
          return '<option value="' + tc.id + '">' + esc([tc.first_name, tc.last_name].filter(Boolean).join(' ')) + '</option>';
        }).join('');
    });
  }
  function setupFormationTypeToggle(form) {
    var typeSelect = form.querySelector('select[name="type"]');
    var priceGroup = form.querySelector('#formation-price-group');
    var subscriptionPricesGroup = form.querySelector('#subscription-prices-group');
    if (!typeSelect) return;

    function updatePeriodVisibility() {
      var isSubscription = typeSelect.value === 'subscription';
      if (priceGroup) priceGroup.style.display = isSubscription ? 'none' : 'block';
      if (subscriptionPricesGroup) subscriptionPricesGroup.style.display = isSubscription ? 'block' : 'none';
    }

    typeSelect.addEventListener('change', updatePeriodVisibility);
    updatePeriodVisibility();
  }

  function bindAddFormationForm() {
    var form = document.querySelector('#backend-add-formation-form'); if (!form) return;
    populateTeacherSelect(form.querySelector('#formation-teacher-id'));
    setupFormationTypeToggle(form);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var schoolId = window._schoolId; if (!schoolId) { showAlert('#backend-form-status', t('School not loaded. Refresh.')); return; }
      var fd = new FormData(form); var btn = form.querySelector('[type=submit]'); if (btn) btn.disabled = true;
      request('/api/formations', {
        method: 'POST', body: JSON.stringify({
          school_id: schoolId, teacher_id: fd.get('teacher_id') || null, title: fd.get('title'),
          description: fd.get('description') || null, image: fd.get('image') || null,
          duration_hours: fd.get('duration_hours') || null, price: fd.get('price') || 0,
          price_monthly: fd.get('price_monthly') || null, price_3_months: fd.get('price_3_months') || null, price_1_year: fd.get('price_1_year') || null,
          type: fd.get('type') || 'formation', subscription_period: fd.get('subscription_period') || null, status: fd.get('status') || 'open',
          niveau: fd.get('niveau') || 'begin', places: fd.get('places') ? parseInt(fd.get('places'), 10) : 0,
          start_date: fd.get('start_date') || null, end_date: fd.get('end_date') || null,
        })
      }).then(function () { showAlert('#backend-form-status', t('Formation created successfully'), 'success'); form.reset(); loadFormations(); if (btn) btn.disabled = false; })
        .catch(function (err) { showAlert('#backend-form-status', err.message); if (btn) btn.disabled = false; });
    });
  }
  function bindEditFormationForm() {
    var form = document.querySelector('#backend-edit-formation-form'); if (!form) return;
    var id = urlParam('id'); if (!id) { showAlert('#backend-form-status', t('No formation ID in URL')); return; }
    var sel = form.querySelector('#formation-teacher-id');
    setupFormationTypeToggle(form);
    populateTeacherSelect(sel);
    request('/api/formations/' + id).then(function (p) {
      var f = p.data;
      ['title', 'description', 'duration_hours', 'price', 'type', 'status', 'niveau', 'places', 'start_date', 'end_date', 'image'].forEach(function (field) {
        var el = form.querySelector('[name="' + field + '"]'); if (el && f[field] != null) el.value = f[field];
      });
      ['price_monthly', 'price_3_months', 'price_1_year'].forEach(function (field) {
        var el = form.querySelector('[name="' + field + '"]'); if (el && f[field] != null) el.value = f[field];
      });
      if (f.image) { var pv = document.getElementById('formation-image-preview'); if (pv) pv.src = formationImg(f.image, f.title); }
      if (f.teacher_id && sel) setTimeout(function () { sel.value = f.teacher_id; }, 600);
      setTimeout(function () {
        var typeSelect = form.querySelector('select[name="type"]');
        if (typeSelect && f.type) {
          typeSelect.value = f.type;
          typeSelect.dispatchEvent(new Event('change'));
          var periodSelect = form.querySelector('select[name="subscription_period"]');
          if (periodSelect && f.subscription_period) periodSelect.value = f.subscription_period;
        }
      }, 200);
    }).catch(function (err) { showAlert('#backend-form-status', err.message); });
    form.addEventListener('submit', function (e) {
      e.preventDefault(); var fd = new FormData(form); var btn = form.querySelector('[type=submit]'); if (btn) btn.disabled = true;
      request('/api/formations/' + id, {
        method: 'PUT', body: JSON.stringify({
          teacher_id: fd.get('teacher_id') || null, title: fd.get('title'), description: fd.get('description') || null,
          image: fd.get('image') || null, duration_hours: fd.get('duration_hours') || null,
          price: fd.get('price') || 0, price_monthly: fd.get('price_monthly') || null, price_3_months: fd.get('price_3_months') || null, price_1_year: fd.get('price_1_year') || null,
          type: fd.get('type') || 'formation', subscription_period: fd.get('subscription_period') || null, status: fd.get('status') || 'open',
          niveau: fd.get('niveau') || 'begin', places: fd.get('places') ? parseInt(fd.get('places'), 10) : 0, start_date: fd.get('start_date') || null, end_date: fd.get('end_date') || null,
        })
      }).then(function () { showAlert('#backend-form-status', t('Formation updated successfully'), 'success'); if (btn) btn.disabled = false; })
        .catch(function (err) { showAlert('#backend-form-status', err.message); if (btn) btn.disabled = false; });
    });
  }

  // ── Classrooms ───────────────────────────────────────────────────────────────
  function loadClassrooms() {
    var tbl = document.querySelector('#backend-classrooms-table'); if (!tbl) return;
    request('/api/classrooms').then(function (p) { renderClassroomRows(p.data || []); })
      .catch(function (err) { showAlert('#backend-classrooms-status', err.message); });
  }
  function renderClassroomRows(rows) {
    var tbody = document.querySelector('#backend-classrooms-table tbody'); if (!tbody) return;
    if (!rows.length) { tbody.innerHTML = '<tr><td colspan="5" class="text-center">' + t('No records found') + '</td></tr>'; return; }
    tbody.innerHTML = rows.map(function (r) {
      return '<tr><td>' + esc(r.id) + '</td><td>' + esc(r.name) + '</td><td>' + (r.capacity || '-') + '</td><td>' + esc(r.description || '-') + '</td>' +
        '<td><button class="btn btn-xs btn-primary" data-edit-classroom=\'' + JSON.stringify(r).replace(/'/g, "&apos;") + '\' style="margin: 0 8px;" title="' + t('Edit') + '"><i class="fa fa-edit"></i></button>' +
        '<button class="btn btn-xs btn-danger" data-del-classroom="' + r.id + '" title="' + t('Delete') + '"><i class="fa fa-trash"></i></button></td></tr>';
    }).join('');
    var tableEl = document.querySelector('#backend-classrooms-table');
    if (tableEl) tableEl.onclick = function (e) {
      var delBtn = e.target.closest('[data-del-classroom]');
      if (delBtn) {
        if (!confirm(t('Delete this classroom?'))) return;
        request('/api/classrooms/' + delBtn.getAttribute('data-del-classroom'), { method: 'DELETE' })
          .then(loadClassrooms).catch(function (err) { showAlert('#backend-classrooms-status', err.message); });
        return;
      }
      var editBtn = e.target.closest('[data-edit-classroom]');
      if (editBtn) {
        var data = JSON.parse(editBtn.getAttribute('data-edit-classroom'));
        document.getElementById('edit-classroom-id').value = data.id;
        document.getElementById('edit-classroom-name').value = data.name || '';
        document.getElementById('edit-classroom-capacity').value = data.capacity || '';
        document.getElementById('edit-classroom-desc').value = data.description || '';
        $('#edit-classroom-modal').modal('show');
      }
    };
  }
  function bindAddClassroomForm() {
    var form = document.querySelector('#backend-add-classroom-form'); if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault(); var fd = new FormData(form); var btn = form.querySelector('[type=submit]'); if (btn) btn.disabled = true;
      request('/api/classrooms', {
        method: 'POST', body: JSON.stringify({
          name: fd.get('name'), capacity: fd.get('capacity') || null, description: fd.get('description') || null,
        })
      }).then(function () { showAlert('#backend-classroom-form-status', t('Classroom added'), 'success'); form.reset(); loadClassrooms(); if (btn) btn.disabled = false; })
        .catch(function (err) { showAlert('#backend-classroom-form-status', err.message); if (btn) btn.disabled = false; });
    });
    
    var editForm = document.querySelector('#backend-edit-classroom-form');
    if (editForm) {
      editForm.addEventListener('submit', function (e) {
        e.preventDefault(); var fd = new FormData(editForm); var btn = editForm.querySelector('[type=submit]'); if (btn) btn.disabled = true;
        var id = document.getElementById('edit-classroom-id').value;
        request('/api/classrooms/' + id, {
          method: 'PUT', body: JSON.stringify({
            name: fd.get('name'), capacity: fd.get('capacity') || null, description: fd.get('description') || null,
          })
        }).then(function () { 
          showAlert('#backend-classrooms-status', t('Classroom updated successfully'), 'success'); 
          $('#edit-classroom-modal').modal('hide');
          loadClassrooms(); 
          if (btn) btn.disabled = false; 
        }).catch(function (err) { 
          showAlert('#backend-edit-classroom-status', err.message); 
          if (btn) btn.disabled = false; 
        });
      });
    }
  }

  // ── Groups ───────────────────────────────────────────────────────────────────
  var _allStudents = [];
  var _allGroups = [];
  var _allFormations = [];

  function loadGroupsPage() {
    if (!document.querySelector('#backend-groups-list')) return;
    // Load formations, classrooms and students for selects
    Promise.all([
      request('/api/formations-list'),
      request('/api/classrooms'),
      request('/api/students-list'),
    ]).then(function (results) {
      var formations = (results[0].data || []).filter(function (f) { return f.status === 'open'; });
      var classrooms = results[1].data || [];
      _allStudents = (results[2].data || []).filter(function (s) { return s.is_active !== 0 && s.is_active !== false; });
      _allFormations = formations;

      // Populate formation selects
      var fSel = document.querySelector('#group-formation-id');
      if (fSel) {
        fSel.innerHTML = '<option value="">-- ' + t('Select Formation') + ' *</option>' +
          formations.map(function (f) { return '<option value="' + f.id + '">' + esc(f.title) + '</option>'; }).join('');
        fSel.addEventListener('change', function () { updateGroupTeacherSelection(this.form || document.querySelector('#backend-add-group-form')); });
      }
      var groupTeacherSel = document.querySelector('#group-teacher-id');
      if (groupTeacherSel) {
        populateTeacherSelect(groupTeacherSel).then(function () {
          if (groupTeacherSel.form && groupTeacherSel.form.id === 'backend-add-group-form') {
            groupTeacherSel.form.querySelector('#group-teacher-note').textContent = t('Select a teacher for this group. If the formation already has a teacher, it will be auto-selected.');
            updateGroupTeacherSelection(groupTeacherSel.form);
          }
        });
      }
      var fFilter = document.querySelector('#filter-formation');
      if (fFilter) {
        fFilter.innerHTML = '<option value="">' + t('All Formations') + '</option>' +
          formations.map(function (f) { return '<option value="' + f.id + '">' + esc(f.title) + '</option>'; }).join('');
      }

      // Populate classroom select
      var cSel = document.querySelector('#group-classroom-id');
      if (cSel) cSel.innerHTML = '<option value="">' + t('No classroom') + '</option>' +
        classrooms.map(function (c) { return '<option value="' + c.id + '">' + esc(c.name) + (c.capacity ? ' (' + t('cap') + ':' + c.capacity + ')' : '') + '</option>'; }).join('');

      // Render student list for multi-select
      renderStudentSelectList('#student-select-list-create', _allStudents);
      bindStudentSearch('#student-search-create', '#student-select-list-create');

      // Load groups
      loadGroups();
    }).catch(function (err) { showAlert('#backend-groups-status', err.message); });

    // Filter change
    var fFilter = document.querySelector('#filter-formation');
    if (fFilter) fFilter.addEventListener('change', function () { renderGroupCards(_allGroups, this.value); });
  }

  function renderStudentSelectList(containerSel, students) {
    var c = document.querySelector(containerSel); if (!c) return;
    if (!students.length) { c.innerHTML = '<p class="text-muted" style="margin:8px">' + t('No students found') + '</p>'; return; }
    c.innerHTML = students.map(function (s) {
      var name = [s.first_name, s.last_name].filter(Boolean).join(' ');
      var img = avatarUrl(s.photo, name, 'student', s.gender);
      return '<label><input type="checkbox" name="student_ids" value="' + s.id + '"> ' +
        '<img src="' + esc(img) + '" onerror="this.src=\'https://ui-avatars.com/api/?name=S&background=27ae60&color=fff&size=30\'"> ' +
        '<span>' + esc(name) + '</span> <small class="text-muted">' + esc(s.registration_number) + '</small></label>';
    }).join('');
  }

  function bindStudentSearch(inputSel, listSel) {
    var inp = document.querySelector(inputSel), list = document.querySelector(listSel);
    if (!inp || !list) return;
    inp.addEventListener('input', function () {
      var q = this.value.toLowerCase();
      list.querySelectorAll('label').forEach(function (lbl) {
        lbl.style.display = lbl.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
    });
  }

  function loadGroups() {
    request('/api/groups').then(function (p) {
      _allGroups = p.data || [];
      renderGroupCards(_allGroups, '');
    }).catch(function (err) { showAlert('#backend-groups-status', err.message); });
  }

  function renderGroupCards(groups, filterFormationId) {
    var c = document.querySelector('#backend-groups-list'); if (!c) return;
    var filtered = groups.filter(function (g) {
      return !filterFormationId || String(g.formation_id) === String(filterFormationId);
    });
    if (!filtered.length) { c.innerHTML = '<p class="text-muted text-center">' + t('No groups found. Create one using the form.') + '</p>'; return; }
    c.innerHTML = filtered.map(function (g) {
      var chk = '<input type="checkbox" class="row-checkbox group-row-checkbox" value="' + g.id + '" data-type="group" style="transform:scale(1.3); cursor:pointer; margin:0;">';
      return '<div class="group-card" id="group-card-' + g.id + '">' +
        '<div class="row">' +
        '<div class="col-lg-8 col-sm-8 col-xs-12">' +
        '<h4 style="display:flex; align-items:center; gap:10px;">' + chk + '<span>' + esc(g.name) + '</span></h4>' +
        '<p class="meta">' +
        '<i class="fa fa-book"></i> ' + esc(g.formation_title || '-') + ' &nbsp;|&nbsp; ' +
        '<i class="fa fa-user"></i> ' + esc(g.teacher_name || t('No teacher')) + ' &nbsp;|&nbsp; ' +
        '<i class="fa fa-building"></i> ' + esc(g.classroom_name || t('No room')) + ' &nbsp;|&nbsp; ' +
        '<i class="fa fa-users"></i> <span id="group-count-' + g.id + '">' + g.student_count + '</span> ' + t('students') +
        '</p>' +
        '<div id="group-students-' + g.id + '"></div>' +
        '</div>' +
        '<div class="col-lg-4 col-sm-4 col-xs-12 text-right">' +
        '<a href="group-info.html?id=' + g.id + '" class="btn btn-sm btn-info" title="' + t('View Details') + '"><i class="fa fa-eye"></i></a> ' +
        '<a href="edit-group.html?id=' + g.id + '" class="btn btn-sm btn-primary" title="' + t('Edit Group') + '"><i class="fa fa-pencil"></i></a> ' +
        '<button class="btn btn-sm btn-success" onclick="toggleAddStudents(' + g.id + ')" title="' + t('Add Students') + '"><i class="fa fa-user-plus"></i></button> ' +
        '<button class="btn btn-sm btn-danger" data-del-group="' + g.id + '" title="' + t('Delete Group') + '"><i class="fa fa-trash"></i></button>' +
        '</div>' +
        '</div>' +
        '<div id="add-students-panel-' + g.id + '" class="add-panel">' +
        '<p><strong>' + t('Select students to add to this group:') + '</strong></p>' +
        '<input type="text" class="stu-search" placeholder="' + t('Search...') + '" oninput="filterGroupStudents(this,' + g.id + ')">' +
        '<div class="stu-list" id="student-list-' + g.id + '"></div>' +
        '<button class="btn btn-primary btn-sm" style="margin-top:8px" onclick="addStudentsToGroup(' + g.id + ')"><i class="fa fa-save"></i> ' + t('Save') + '</button> ' +
        '<button class="btn btn-default btn-sm" style="margin-top:8px" onclick="toggleAddStudents(' + g.id + ')">' + t('Cancel') + '</button>' +
        '</div>' +
        '</div>';
    }).join('');

    // Delete group
    c.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-del-group]'); if (!btn) return;
      if (!confirm(t('Delete this group and remove all students from it?'))) return;
      request('/api/groups/' + btn.getAttribute('data-del-group'), { method: 'DELETE' })
        .then(loadGroups).catch(function (err) { showAlert('#backend-groups-status', err.message); });
    });

    // Load students for each group
    filtered.forEach(function (g) { loadGroupStudents(g.id); });
  }

  function loadGroupStudents(groupId) {
    request('/api/groups/' + groupId + '/students').then(function (p) {
      var students = p.data || [];
      var area = document.getElementById('group-students-' + groupId); if (!area) return;
      if (!students.length) { area.innerHTML = '<span class="text-muted" style="font-size:12px">' + t('No students yet') + '</span>'; }
      else {
        area.innerHTML = students.map(function (s) {
          var name = [s.first_name, s.last_name].filter(Boolean).join(' ');
          var img = avatarUrl(s.photo, name, 'student', s.gender);
          return '<span class="student-card">' +
            '<img src="' + esc(img) + '" onerror="this.src=\'https://ui-avatars.com/api/?name=S&background=27ae60&color=fff&size=28\'"> ' +
            esc(name) +
            ' <span class="rm" onclick="removeStudentFromGroup(' + groupId + ',' + s.id + ')" title="' + t('Remove') + '">×</span>' +
            '</span>';
        }).join('');
      }
      // Populate add panel list
      var panel = document.getElementById('student-list-' + groupId); if (!panel) return;
      var assignedIds = students.map(function (s) { return s.id; });
      var available = _allStudents.filter(function (s) { return !assignedIds.includes(s.id); });
      if (!available.length) { panel.innerHTML = '<p class="text-muted" style="margin:8px">' + t('All students already assigned') + '</p>'; return; }
      panel.innerHTML = available.map(function (s) {
        var name = [s.first_name, s.last_name].filter(Boolean).join(' ');
        var img = avatarUrl(s.photo, name, 'student', s.gender);
        return '<label><input type="checkbox" value="' + s.id + '"> <img src="' + esc(img) + '"> <span>' + esc(name) + '</span> <small class="text-muted">' + esc(s.registration_number) + '</small></label>';
      }).join('');
    });
  }

  // Exposed globally for onclick handlers in rendered HTML
  window.toggleAddStudents = function (groupId) {
    var panel = document.getElementById('add-students-panel-' + groupId); if (!panel) return;
    panel.classList.toggle('open');
    if (panel.classList.contains('open')) loadGroupStudents(groupId);
  };
  window.filterGroupStudents = function (inp, groupId) {
    var q = inp.value.toLowerCase();
    var panel = document.getElementById('student-list-' + groupId); if (!panel) return;
    panel.querySelectorAll('label').forEach(function (lbl) {
      lbl.style.display = lbl.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  };
  window.addStudentsToGroup = function (groupId) {
    var panel = document.getElementById('student-list-' + groupId); if (!panel) return;
    var checked = panel.querySelectorAll('input[type=checkbox]:checked');
    var ids = [].slice.call(checked).map(function (cb) { return parseInt(cb.value); });
    if (!ids.length) { alert(t('Select at least one student')); return; }
    request('/api/groups/' + groupId + '/students', { method: 'POST', body: JSON.stringify({ student_ids: ids }) })
      .then(function (r) {
        showAlert('#backend-groups-status', r.message, 'success');
        loadGroupStudents(groupId);
        document.getElementById('add-students-panel-' + groupId).classList.remove('open');
      }).catch(function (err) { showAlert('#backend-groups-status', err.message); });
  };
  window.removeStudentFromGroup = function (groupId, studentId) {
    if (!confirm(t('Remove this student from the group?'))) return;
    request('/api/groups/' + groupId + '/students/' + studentId, { method: 'DELETE' })
      .then(function () { loadGroupStudents(groupId); })
      .catch(function (err) { showAlert('#backend-groups-status', err.message); });
  };

  function updateGroupTeacherSelection(form) {
    if (!form) return;
    var fSel = form.querySelector('#group-formation-id');
    var tSel = form.querySelector('#group-teacher-id');
    var note = form.querySelector('#group-teacher-note');
    if (!fSel || !tSel) return;
    var formations = form._formations || _allFormations;
    var formation = (formations || []).find(function (f) { return String(f.id) === String(fSel.value); });
    if (formation && formation.teacher_id && !tSel.value) {
      tSel.value = formation.teacher_id;
      if (note) note.textContent = t('Teacher auto-selected from formation. You can override it if needed.');
    } else if (formation && formation.teacher_id) {
      if (note) note.textContent = t('Formation already has a teacher. You can override the selected teacher.');
    } else {
      if (note) note.textContent = t('Select a teacher for this group. If the formation already has a teacher, it will be auto-selected.');
    }
  }

  function bindAddGroupForm() {
    var form = document.querySelector('#backend-add-group-form'); if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault(); var fd = new FormData(form);
      var studentIds = [].slice.call(form.querySelectorAll('input[name="student_ids"]:checked')).map(function (cb) { return parseInt(cb.value); });
      var btn = form.querySelector('[type=submit]'); if (btn) btn.disabled = true;
      request('/api/groups', {
        method: 'POST', body: JSON.stringify({
          formation_id: fd.get('formation_id'), classroom_id: fd.get('classroom_id') || null,
          teacher_id: fd.get('teacher_id') || null,
          name: fd.get('name'), start_date: fd.get('start_date') || null, end_date: fd.get('end_date') || null,
          max_students: fd.get('max_students') || null, student_ids: studentIds,
        })
      }).then(function () {
        showAlert('#backend-group-form-status', t('Group created successfully'), 'success');
        form.reset(); loadGroups(); if (btn) btn.disabled = false;
      }).catch(function (err) { showAlert('#backend-group-form-status', err.message); if (btn) btn.disabled = false; });
    });
  }

  function bindEditGroupForm() {
    var form = document.querySelector('#backend-edit-group-form'); if (!form) return;
    var id = urlParam('id'); if (!id) { showAlert('#backend-group-form-status', t('No group ID in URL')); return; }

    Promise.all([
      request('/api/formations'),
      request('/api/classrooms'),
      request('/api/groups/' + id)
    ]).then(function (res) {
      var formations = (res[0].data || []).filter(function (f) { return f.status === 'open'; });
      var classrooms = res[1].data || [];
      var group = res[2].data;

      var fSel = form.querySelector('#group-formation-id');
      if (fSel) {
        fSel.innerHTML = '<option value="">-- ' + t('Select Formation') + ' *</option>' +
          formations.map(function (f) { return '<option value="' + f.id + '" ' + (f.id === group.formation_id ? 'selected' : '') + '>' + esc(f.title) + '</option>'; }).join('');
        form._formations = formations;
        fSel.addEventListener('change', function () { updateGroupTeacherSelection(form); });
      }
      var cSel = form.querySelector('#group-classroom-id');
      if (cSel) cSel.innerHTML = '<option value="">' + t('No classroom') + '</option>' +
        classrooms.map(function (c) { return '<option value="' + c.id + '" ' + (c.id === group.classroom_id ? 'selected' : '') + '>' + esc(c.name) + '</option>'; }).join('');

      var tSel = form.querySelector('#group-teacher-id');
      if (tSel) {
        populateTeacherSelect(tSel).then(function () {
          if (group.teacher_id) tSel.value = group.teacher_id;
          updateGroupTeacherSelection(form);
        });
      }
      ['name', 'start_date', 'end_date', 'max_students'].forEach(function (f) {
        var el = form.querySelector('[name="' + f + '"]'); if (el && group[f] != null) el.value = group[f];
      });
    }).catch(function (err) { showAlert('#backend-group-form-status', err.message); });

    form.addEventListener('submit', function (e) {
      e.preventDefault(); var fd = new FormData(form); var payload = {};
      ['formation_id', 'classroom_id', 'teacher_id', 'name', 'start_date', 'end_date', 'max_students'].forEach(function (f) {
        var v = fd.get(f); if (v !== null) payload[f] = v || null;
      });
      var btn = form.querySelector('[type=submit]'); if (btn) btn.disabled = true;
      request('/api/groups/' + id, { method: 'PUT', body: JSON.stringify(payload) })
        .then(function () { showAlert('#backend-group-form-status', t('Group updated successfully'), 'success'); if (btn) btn.disabled = false; })
        .catch(function (err) { showAlert('#backend-group-form-status', err.message); if (btn) btn.disabled = false; });
    });
  }
  // ── Profiles ─────────────────────────────────────────────────────────────────
  function loadStudentProfile() {
    var cont = document.querySelector('#sp-container'); if (!cont) return;
    var id = urlParam('id'); if (!id) { showAlert(cont, t('No student ID in URL')); return; }
    request('/api/student-registrations/' + id).then(function (p) {
      var tc = p.data;
      document.getElementById('sp-loading').style.display = 'none';
      document.getElementById('sp-content').style.display = 'block';

      document.getElementById('sp-photo').src = avatarUrl(tc.photo, [tc.first_name, tc.last_name].join(' '), 'student', tc.gender);
      document.getElementById('sp-name').textContent = [tc.first_name, tc.last_name].filter(Boolean).join(' ');
      document.getElementById('sp-reg-num').textContent = tc.registration_number || '-';
      document.getElementById('sp-email').textContent = tc.email || '-';

      document.getElementById('sp-gender').textContent = tc.gender || '-';
      document.getElementById('sp-birth-date').textContent = tc.birth_date || '-';
      document.getElementById('sp-blood-type').textContent = tc.blood_type || '-';
      
      document.getElementById('sp-enrollment-date').textContent = tc.enrollment_date || '-';
      document.getElementById('sp-formation').textContent = tc.formation_title || '-';
      document.getElementById('sp-subscription-plan').textContent = formatSubscriptionPlan(tc.subscription_plan);
      document.getElementById('sp-payment-status').innerHTML = formatPaymentStatus(tc.payment_status);
      document.getElementById('sp-next-payment-date').textContent = tc.next_payment_date || '-';
      document.getElementById('sp-status').innerHTML = tc.is_active ? '<span class="label label-success">' + t('Active') + '</span>' : '<span class="label label-danger">' + t('Inactive') + '</span>';

      document.getElementById('sp-parent-name').textContent = tc.parent_name || '-';
      
      function renderPhoneApps(phone, wa, vb, tg) {
        if (!phone) return '-';
        var html = '<span>' + phone + '</span>';
        if (wa) html += ' <i class="fa fa-whatsapp" style="color:#25D366;font-size:16px;margin-left:6px;" title="WhatsApp"></i>';
        if (vb) html += ' <i class="fa fa-phone" style="color:#7c3aed;font-size:16px;margin-left:4px;" title="Viber"></i>';
        if (tg) html += ' <i class="fa fa-telegram" style="color:#0088cc;font-size:16px;margin-left:4px;" title="Telegram"></i>';
        return html;
      }
      
      document.getElementById('sp-parent-phone').innerHTML = renderPhoneApps(tc.parent_phone, tc.phone1_has_whatsapp, tc.phone1_has_viber, tc.phone1_has_telegram);
      document.getElementById('sp-parent-phone2').innerHTML = renderPhoneApps(tc.parent_phone2, tc.phone2_has_whatsapp, tc.phone2_has_viber, tc.phone2_has_telegram);
      
      document.getElementById('sp-guardian-name').textContent = tc.guardian_name || '-';
      document.getElementById('sp-guardian-rel').textContent = tc.guardian_relationship || '-';
      document.getElementById('sp-guardian-id').textContent = tc.guardian_id_number || '-';
      
      var ps = tc.parents_status || '-';
      var psLabels = {
        'together': t('Together'), 'divorced': t('Divorced'), 
        'father_deceased': t('Father Deceased'), 'mother_deceased': t('Mother Deceased'), 
        'both_deceased': t('Both Deceased'), 'other': t('Other')
      };
      var psText = psLabels[ps] || ps;
      document.getElementById('sp-parents-status').innerHTML = '<span data-i18n="'+psText+'">'+psText+'</span>';
      
      if (tc.needs_special_care) {
        document.getElementById('sp-health-notes').innerHTML = '<span class="text-danger" style="font-weight:600;"><i class="fa fa-exclamation-triangle"></i> ' + t('Needs Special Care') + '</span>' + 
          (tc.health_notes ? '<br><span style="font-size:13px;color:#555;margin-top:6px;display:block;">' + esc(tc.health_notes) + '</span>' : '');
      } else {
        document.getElementById('sp-health-notes').innerHTML = '<span class="text-success"><i class="fa fa-check-circle"></i> ' + t('Normal Health') + '</span>';
      }
      
      // Trigger i18n translation for dynamically injected strings
      if (window.AppI18n) window.AppI18n.translateAll(document.getElementById('sp-content'));
    }).catch(function (err) { showAlert(cont, err.message); });
  }

  function loadTeacherProfile() {
    var cont = document.querySelector('#tp-container'); if (!cont) return;
    var id = urlParam('id'); if (!id) { showAlert(cont, t('No teacher ID in URL')); return; }
    request('/api/teacher-registrations/' + id).then(function (p) {
      var tc = p.data;
      document.getElementById('tp-loading').style.display = 'none';
      document.getElementById('tp-content').style.display = 'block';

      document.getElementById('tp-photo').src = avatarUrl(tc.photo, [tc.first_name, tc.last_name].join(' '), 'teacher', tc.gender);
      document.getElementById('tp-name').textContent = [tc.first_name, tc.last_name].filter(Boolean).join(' ');
      document.getElementById('tp-emp-num').textContent = tc.employee_number || '-';
      document.getElementById('tp-email').textContent = tc.email || '-';

      document.getElementById('tp-speciality').textContent = tc.speciality || '-';
      document.getElementById('tp-diploma').textContent = tc.diploma || '-';
      document.getElementById('tp-hire-date').textContent = tc.hire_date || '-';
      document.getElementById('tp-gender').textContent = tc.gender || '-';
      document.getElementById('tp-birth-date').textContent = tc.birth_date || '-';
      document.getElementById('tp-status').innerHTML = tc.is_active ? '<span class="label label-success">' + t('Active') + '</span>' : '<span class="label label-danger">' + t('Inactive') + '</span>';
    }).catch(function (err) { showAlert(cont, err.message); });
  }

  function loadFormationProfile() {
    var cont = document.querySelector('#cp-container'); if (!cont) return;
    var id = urlParam('id'); if (!id) { showAlert(cont, t('No formation ID in URL')); return; }
    request('/api/formations/' + id).then(function (p) {
      var tc = p.data;
      document.getElementById('cp-loading').style.display = 'none';
      document.getElementById('cp-content').style.display = 'block';

      document.getElementById('cp-image').src = formationImg(tc.image, tc.title);
      document.getElementById('cp-title').textContent = tc.title || '-';
      document.getElementById('cp-teacher').textContent = tc.teacher_name || t('No teacher assigned');
      document.getElementById('cp-classroom').textContent = tc.classroom_name || t('No classroom assigned');
      
      var editBtn = document.getElementById('btn-edit-course');
      if (editBtn) editBtn.href = 'edit-course.html?id=' + tc.id;

      document.getElementById('cp-duration').textContent = tc.duration_hours ? tc.duration_hours + ' ' + t('hours') : '-';
      document.getElementById('cp-niveau').textContent = t(tc.niveau === 'begin' ? 'Beginner' : (tc.niveau === 'intermediate' ? 'Intermediate' : 'Advanced'));
      document.getElementById('cp-places').textContent = tc.places || '-';
      document.getElementById('cp-registered').textContent = tc.registered_students || '0';
      document.getElementById('cp-price').textContent = tc.price ? tc.price + ' DA' : t('Free');
      document.getElementById('cp-start-date').textContent = fmtDate(tc.start_date);
      document.getElementById('cp-end-date').textContent = fmtDate(tc.end_date);
      document.getElementById('cp-created').textContent = fmtDate(tc.created_at);
      document.getElementById('cp-description').textContent = tc.description || t('No description provided.');
    }).catch(function (err) { showAlert(cont, err.message); });
  }

  var _groupPageStudents = [];

  function loadGroupProfile() {
    var cont = document.querySelector('#gp-container'); if (!cont) return;
    var id = urlParam('id'); if (!id) { showAlert(cont, t('No group ID in URL')); return; }
    request('/api/groups/' + id).then(function (p) {
      var tc = p.data;
      document.getElementById('gp-loading').style.display = 'none';
      document.getElementById('gp-content').style.display = 'block';

      document.getElementById('gp-name').textContent = tc.name || '-';
      document.getElementById('gp-formation').textContent = tc.formation_title || t('No formation assigned');
      document.getElementById('gp-classroom').textContent = tc.classroom_name || t('No classroom assigned');

      document.getElementById('gp-start-date').textContent = tc.start_date || '-';
      document.getElementById('gp-end-date').textContent = tc.end_date || '-';
      document.getElementById('gp-max-students').textContent = tc.max_students || t('Unlimited');
      document.getElementById('gp-created').textContent = tc.created_at ? new Date(tc.created_at).toLocaleDateString() : '-';

      _groupPageStudents = tc.students || [];
      renderGroupStudentsTable(_groupPageStudents);
      
      // Hook up filters
      var searchInput = document.getElementById('gp-search-name');
      var statusFilter = document.getElementById('gp-filter-status');
      
      function filterGroupStudents() {
          var sVal = searchInput ? searchInput.value.toLowerCase() : '';
          var statVal = statusFilter ? statusFilter.value : '';
          var filtered = _groupPageStudents.filter(function(st) {
              var name = [st.first_name, st.last_name].filter(Boolean).join(' ').toLowerCase();
              var matchSearch = name.indexOf(sVal) > -1;
              var matchStatus = statVal === '' || (statVal === '1' ? st.is_active : !st.is_active);
              return matchSearch && matchStatus;
          });
          renderGroupStudentsTable(filtered);
      }
      
      if (searchInput) searchInput.addEventListener('input', filterGroupStudents);
      if (statusFilter) statusFilter.addEventListener('change', filterGroupStudents);

      // Fetch all students for the custom autocomplete dropdown
      request('/api/student-registrations').then(function(res) {
          var allStudents = res.data || [];
          var addInput = document.getElementById('gp-add-student-input');
          var dropdown = document.getElementById('gp-autocomplete-dropdown');
          if (!addInput || !dropdown) return;

          function renderDropdown(q) {
              var groupIds = _groupPageStudents.map(function(s) { return s.id; });
              var available = allStudents.filter(function(s) { return groupIds.indexOf(s.id) === -1; });
              
              if (q) {
                  q = q.toLowerCase();
                  available = available.filter(function(s) {
                      var name = [s.first_name, s.last_name].filter(Boolean).join(' ').toLowerCase();
                      var reg = (s.registration_number||'').toLowerCase();
                      return name.indexOf(q) > -1 || reg.indexOf(q) > -1;
                  });
              }
              
              if (!available.length) {
                  dropdown.innerHTML = '<div style="padding: 8px; text-align: center; color: #888; font-size: 13px;">' + t('No matching students found') + '</div>';
                  dropdown.style.display = 'block';
                  return;
              }
              
              dropdown.innerHTML = available.slice(0, 15).map(function(s) {
                  var name = esc([s.first_name, s.last_name].filter(Boolean).join(' '));
                  var img = esc(avatarUrl(s.photo, name, 'student', s.gender));
                  var reg = esc(s.registration_number);
                  return '<div class="autocomplete-item" data-id="' + s.id + '" style="display:flex;align-items:center;padding:8px;gap:10px;cursor:pointer;border-radius:4px;transition:background 0.2s;" onmouseover="this.style.background=\'#f1f5f9\'" onmouseout="this.style.background=\'transparent\'">' +
                         '<img src="' + img + '" style="width:28px;height:28px;border-radius:50%;object-fit:cover;" onerror="this.src=\'https://ui-avatars.com/api/?name=S&background=27ae60&color=fff&size=28\'">' +
                         '<div style="line-height:1.2"><div style="font-weight:600;font-size:13px;color:#333">' + name + '</div><div style="font-size:11px;color:#777">' + t('Reg') + ': ' + reg + '</div></div>' +
                         '</div>';
              }).join('');
              dropdown.style.display = 'block';
              
              // Bind clicks
              dropdown.querySelectorAll('.autocomplete-item').forEach(function(item) {
                  item.addEventListener('click', function() {
                      var stId = parseInt(this.getAttribute('data-id'));
                      addInput.value = '';
                      dropdown.style.display = 'none';
                      addInput.disabled = true;
                      addInput.placeholder = t('Adding') + '...';
                      
                      request('/api/groups/' + id + '/students', { method: 'POST', body: JSON.stringify({ student_ids: [stId] }) })
                        .then(function() {
                            addInput.disabled = false;
                            addInput.placeholder = 'Search student to add...';
                            loadGroupProfile(); // Reload to refresh table
                        })
                        .catch(function(err) {
                            alert('Error: ' + err.message);
                            addInput.disabled = false;
                            addInput.placeholder = 'Search student to add...';
                        });
                  });
              });
          }

          addInput.addEventListener('input', function() {
              if (this.value.trim().length > 0) renderDropdown(this.value.trim());
              else renderDropdown('');
          });
          addInput.addEventListener('focus', function() {
              renderDropdown(this.value.trim());
          });
          document.addEventListener('click', function(e) {
              if (addInput && dropdown && !addInput.contains(e.target) && !dropdown.contains(e.target)) {
                  dropdown.style.display = 'none';
              }
          });
          
      }).catch(function(e) { console.error('Failed to load global students', e); });

    }).catch(function (err) { showAlert(cont, err.message); });
  }

  function renderGroupStudentsTable(rows) {
      var tbody = document.getElementById('gp-students-tbody');
      if (!tbody) return;
      if (!rows.length) {
          tbody.innerHTML = '<tr><td colspan="8" class="text-center">No students found.</td></tr>';
          return;
      }
      tbody.innerHTML = rows.map(function(r) {
          var fullName = [r.first_name, r.last_name].filter(Boolean).join(' ');
          var chk = '<input type="checkbox" class="gp-row-checkbox" value="' + r.id + '" data-type="student" data-name="' + esc(fullName) + '" data-reg="' + esc(r.registration_number) + '" data-photo="' + esc(avatarUrl(r.photo, fullName, 'student', r.gender)) + '" data-formation="' + esc(r.formation_title || '') + '">';
          var img = '<img src="' + esc(avatarUrl(r.photo, fullName, 'student', r.gender)) + '" style="width:36px;height:36px;border-radius:50%;object-fit:cover" onerror="this.src=\'https://ui-avatars.com/api/?name=S&background=27ae60&color=fff&size=36\'">';
          
          return '<tr>' +
              '<td>' + chk + '</td>' +
              '<td>' + img + '</td>' +
              '<td>' + esc(r.registration_number) + '</td>' +
              '<td>' + esc(fullName) + '</td>' +
              '<td>' + (r.is_active ? '<span class="label label-success">Active</span>' : '<span class="label label-danger">Inactive</span>') + '</td>' +
              '<td>' + esc(r.parent_name || '-') + '</td>' +
              '<td>' + esc(formatGmtPlusOneDate(r.enrollment_date)) + '</td>' +
              '<td>' +
                  '<a href="student-profile.html?id=' + r.id + '" class="btn btn-xs btn-success" title="View"><i class="fa fa-eye"></i></a> ' +
                  '<a href="edit-student.html?id=' + r.id + '" class="btn btn-xs btn-info" title="Edit"><i class="fa fa-pencil"></i></a> ' +
                  '<button class="btn btn-xs btn-warning" data-del-group-student="' + r.id + '" title="Remove from Group"><i class="fa fa-chain-broken"></i></button>' +
              '</td>' +
          '</tr>';
      }).join('');
      
      // Attach remove events
      var tableEl = document.getElementById('gp-students-table');
      if (!tableEl) return;
      // Clone to remove old listeners so we don't trigger multiple times
      var newTableEl = tableEl.cloneNode(true);
      tableEl.parentNode.replaceChild(newTableEl, tableEl);
      // Re-fetch tbody reference after clone
      var tbody2 = newTableEl.querySelector('tbody');
      if (tbody2 && tbody2.id) tbody2.id = 'gp-students-tbody'; // keep id on cloned element
      
      newTableEl.addEventListener('click', function (e) {
          var btn = e.target.closest('[data-del-group-student]');
          if (!btn) return;
          if (!confirm('Remove this student from the group?')) return;
          var stId = btn.getAttribute('data-del-group-student');
          var groupId = urlParam('id');
          request('/api/groups/' + groupId + '/students/' + stId, { method: 'DELETE' })
            .then(function() {
                loadGroupProfile(); // Reload to refresh table and datalist
            }).catch(function (err) { alert(err.message); });
      });

      // Update checkboxes and generate button (re-query after clone)
      var selectAll = newTableEl.querySelector('.select-all');
      var rowCheckboxes = newTableEl.querySelectorAll('.gp-row-checkbox');
      var genBtn = document.getElementById('btn-generate-cards');
      
      if (selectAll) {
          selectAll.checked = false;
          selectAll.onchange = function() {
              var isChecked = this.checked;
              rowCheckboxes.forEach(function(cb) { cb.checked = isChecked; });
              if (genBtn) genBtn.style.display = Array.from(rowCheckboxes).some(function(cb) { return cb.checked; }) ? 'inline-block' : 'none';
          };
      }
      rowCheckboxes.forEach(function(cb) {
          cb.onchange = function() {
              if (genBtn) genBtn.style.display = Array.from(rowCheckboxes).some(function(c) { return c.checked; }) ? 'inline-block' : 'none';
          };
      });
  }

  // Generate Cards event binding for group page
  document.addEventListener('DOMContentLoaded', function() {
      var genBtn = document.getElementById('btn-generate-cards');
      if (genBtn && document.body.getAttribute('data-page') === 'groups') {
          genBtn.addEventListener('click', function() {
              var selected = Array.from(document.querySelectorAll('.gp-row-checkbox:checked')).map(function(cb) {
                  return {
                      id: cb.value,
                      name: cb.getAttribute('data-name'),
                      reg: cb.getAttribute('data-reg'),
                      photo: cb.getAttribute('data-photo'),
                      formation: cb.getAttribute('data-formation')
                  };
              });
              if (!selected.length) return alert('No students selected.');
              generateCardsForGroup(selected);
          });
      }
  });

  function generateCardsForGroup(selectedStudents) {
      if (!window.html2canvas || !window.JSZip || !window.saveAs || !window.QRCode) {
          return alert("Required libraries for generating cards are missing.");
      }
      
      var zip = new JSZip();
      var folder = zip.folder("Student_Cards");
      var btn = document.getElementById('btn-generate-cards');
      var origText = btn.innerHTML;
      btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Generating...';
      btn.disabled = true;
      
      var cardTemplate = document.getElementById('school-card-template');
      var container = document.getElementById('school-card-template-container');
      container.style.left = '0';
      container.style.top = '0';
      container.style.opacity = '0.01'; // Make it renderable but invisible
      container.style.pointerEvents = 'none';

      request('/api/school-setup/settings').then(function (res) {
          var school = res.school || {};
          document.getElementById('card-school-name').textContent = school.name || 'المدرسة';
          document.getElementById('card-school-logo').src = school.logo ? '/uploads/' + school.logo : 'img/logo/school-manager-logo.png';
          
          var processNext = function(index) {
              if (index >= selectedStudents.length) {
                  container.style.left = '-9999px';
                  zip.generateAsync({type:"blob"}).then(function(content) {
                      saveAs(content, "Group_Student_Cards.zip");
                      btn.innerHTML = origText;
                      btn.disabled = false;
                  });
                  return;
              }
              
              var st = selectedStudents[index];
              document.getElementById('card-student-name').textContent = st.name;
              document.getElementById('card-student-photo').src = st.photo;
              document.getElementById('card-qr-reg').textContent = st.reg;
              document.getElementById('card-student-formation').textContent = st.formation || 'Student';
              
              var qrContainer = document.getElementById('card-qr-code');
              qrContainer.innerHTML = '';
              new QRCode(qrContainer, { text: st.reg, width: 70, height: 70, colorDark: "#0d1f3c", colorLight: "#ffffff", correctLevel: QRCode.CorrectLevel.M });
              
              setTimeout(function() {
                  html2canvas(cardTemplate, { scale: 3, useCORS: true, backgroundColor: null, logging: false }).then(function(canvas) {
                      var imgData = canvas.toDataURL("image/jpeg", 0.95);
                      folder.file("Student_" + st.reg + ".jpg", imgData.split(',')[1], {base64: true});
                      processNext(index + 1);
                  }).catch(function(err) {
                      console.error('Canvas error', err);
                      processNext(index + 1);
                  });
              }, 150); // Give DOM/QR time to settle
          };
          processNext(0);
      }).catch(function(e) {
          console.error(e);
          btn.innerHTML = origText;
          btn.disabled = false;
          container.style.left = '-9999px';
          alert('Failed to load school settings for cards.');
      });
  }
  // ── Certificate ──────────────────────────────────────────────────────────────
  window.loadCertificatePage = function () {
    var formSel = document.getElementById('cert-formation-id');
    var groupSel = document.getElementById('cert-group-id');
    var stuSel = document.getElementById('cert-student-id'); // hidden native select
    var stuPanel = document.getElementById('cert-student-panel');
    var stuList = document.getElementById('cert-student-list');
    var countBadge = document.getElementById('cert-selected-count');
    var genBtn = document.getElementById('btn-generate-cert');
    var printBtn = document.getElementById('btn-print-cert');
    var selectAllBtn = document.getElementById('cert-select-all-btn');
    var deselectAllBtn = document.getElementById('cert-deselect-all-btn');

    if (!formSel || !stuSel) return;

    var _students = [];
    var _formations = [];
    var _groups = [];
    var _groupStudents = [];
    var _selectedIds = new Set();

    // Fetch formations, students, and groups
    Promise.all([
      request('/api/formations-list').catch(function () { return { data: [] }; }),
      request('/api/student-registrations').catch(function () { return { data: [] }; }),
      request('/api/groups').catch(function () { return { data: [] }; })
    ]).then(function (res) {
      _formations = res[0].data || [];
      _students = res[1].data || [];
      _groups = res[2].data || [];

      var groupPromises = _groups.map(function (g) {
        return request('/api/groups/' + g.id + '/students').then(function (p) {
          return { groupId: g.id, students: p.data || [] };
        }).catch(function () { return { groupId: g.id, students: [] }; });
      });

      return Promise.all(groupPromises).then(function (groupRes) {
        _groupStudents = groupRes;

        formSel.innerHTML = '<option value="">' + t('-- Select Formation --') + '</option>' +
          _formations.map(function (f) { return '<option value="' + f.id + '">' + esc(f.title) + '</option>'; }).join('');

        formSel.addEventListener('change', function () {
          var fId = this.value;
          _selectedIds.clear();
          if (fId) {
            groupSel.disabled = false;
            var fGroups = _groups.filter(function (g) { return String(g.formation_id) === String(fId); });
            groupSel.innerHTML = '<option value="">' + t('All Groups') + '</option>' +
              fGroups.map(function (g) { return '<option value="' + g.id + '">' + esc(g.name) + '</option>'; }).join('');
            updateStudentsList();
          } else {
            groupSel.disabled = true;
            groupSel.innerHTML = '<option value="">' + t('Select Formation First') + '</option>';
            if (stuPanel) stuPanel.style.display = 'none';
            genBtn.disabled = true;
            printBtn.disabled = true;
          }
        });

        groupSel.addEventListener('change', function () {
          _selectedIds.clear();
          updateStudentsList();
        });

        function updateStudentsList() {
          var fId = formSel.value;
          var gId = groupSel.value;
          if (!fId) return;

          var filteredStudents = [];
          if (gId) {
            var gMapping = _groupStudents.find(function (gm) { return String(gm.groupId) === String(gId); });
            if (gMapping) filteredStudents = gMapping.students;
          } else {
            var validGroupIds = _groups.filter(function (g) { return String(g.formation_id) === String(fId); }).map(function (g) { return String(g.id); });
            var studentsInGroups = [];
            _groupStudents.forEach(function (gm) {
              if (validGroupIds.includes(String(gm.groupId))) studentsInGroups = studentsInGroups.concat(gm.students);
            });
            var fStudents = _students.filter(function (s) { return String(s.formation_id) === String(fId); });
            var allS = fStudents.concat(studentsInGroups);
            var seen = {};
            allS.forEach(function (s) { if (!seen[s.id]) { seen[s.id] = true; filteredStudents.push(s); } });
          }
          filteredStudents = filteredStudents.map(function (s) {
            return _students.find(function (x) { return String(x.id) === String(s.id); }) || s;
          });

          // Show/hide student panel
          if (stuPanel) stuPanel.style.display = filteredStudents.length > 0 ? 'block' : 'none';
          if (selectAllBtn) selectAllBtn.disabled = filteredStudents.length === 0;

          // Render checkbox list
          if (stuList) {
            if (filteredStudents.length === 0) {
              stuList.innerHTML = '<p style="color:#aaa;text-align:center;padding:20px;font-size:13px;margin:0;">' + t('No students found') + '</p>';
            } else {
              stuList.innerHTML = filteredStudents.map(function (s) {
                var name = [s.first_name, s.last_name].filter(Boolean).join(' ') || t('Unknown');
                var initials = name.split(' ').map(function (w) { return w[0]; }).join('').substring(0, 2).toUpperCase();
                return '<div class="student-item" data-id="' + s.id + '">' +
                  '<div class="student-avatar">' + initials + '</div>' +
                  '<span class="student-name">' + esc(name) + '</span>' +
                  '<div class="student-check"><i class="fa fa-check" style="font-size:10px;display:none;"></i></div>' +
                  '</div>';
              }).join('');

              // Bind click events
              stuList.querySelectorAll('.student-item').forEach(function (item) {
                item.addEventListener('click', function () {
                  var sid = this.getAttribute('data-id');
                  if (_selectedIds.has(sid)) {
                    _selectedIds.delete(sid);
                    this.classList.remove('selected');
                    this.querySelector('.student-check .fa').style.display = 'none';
                  } else {
                    _selectedIds.add(sid);
                    this.classList.add('selected');
                    this.querySelector('.student-check .fa').style.display = 'block';
                  }
                  syncNativeSelect(filteredStudents);
                  checkBtnStates();
                });
              });
            }
          }

          syncNativeSelect(filteredStudents);
          checkBtnStates();
        }

        function syncNativeSelect(filteredStudents) {
          if (!stuSel) return;
          stuSel.innerHTML = filteredStudents.map(function (s) {
            var selected = _selectedIds.has(String(s.id)) ? ' selected' : '';
            var name = [s.first_name, s.last_name].filter(Boolean).join(' ');
            return '<option value="' + s.id + '"' + selected + '>' + esc(name) + '</option>';
          }).join('');
        }

        if (selectAllBtn) {
          selectAllBtn.addEventListener('click', function () {
            if (stuList) {
              stuList.querySelectorAll('.student-item').forEach(function (item) {
                var sid = item.getAttribute('data-id');
                _selectedIds.add(sid);
                item.classList.add('selected');
                var icon = item.querySelector('.student-check .fa');
                if (icon) icon.style.display = 'block';
              });
            }
            var fId = formSel.value;
            var gId = groupSel.value;
            var allS = gId ?
              (_groupStudents.find(function (gm) { return String(gm.groupId) === String(gId); }) || { students: [] }).students :
              _students.filter(function (s) { return String(s.formation_id) === String(fId); });
            allS = allS.map(function (s) { return _students.find(function (x) { return String(x.id) === String(s.id); }) || s; });
            syncNativeSelect(allS);
            checkBtnStates();
          });
        }

        if (deselectAllBtn) {
          deselectAllBtn.addEventListener('click', function () {
            _selectedIds.clear();
            if (stuList) {
              stuList.querySelectorAll('.student-item').forEach(function (item) {
                item.classList.remove('selected');
                var icon = item.querySelector('.student-check .fa');
                if (icon) icon.style.display = 'none';
              });
            }
            if (stuSel) stuSel.innerHTML = '';
            checkBtnStates();
          });
        }

        function checkBtnStates() {
          var count = _selectedIds.size;
          genBtn.disabled = count === 0;
          printBtn.disabled = count === 0;

          if (countBadge) {
            if (count > 0) {
              countBadge.style.display = 'inline-block';
              countBadge.textContent = count + ' ' + t('selected');
            } else {
              countBadge.style.display = 'none';
            }
          }
          if (deselectAllBtn) deselectAllBtn.style.display = count > 0 ? 'inline-block' : 'none';

          genBtn.innerHTML = count > 1
            ? '<i class="fa fa-eye"></i> ' + t('Preview (First)')
            : '<i class="fa fa-eye"></i> ' + t('Preview');
        }
      });
    }).catch(function (err) { showAlert('#backend-certificate-status', err.message); });

    function getSelectedStudents() {
      return Array.from(_selectedIds);
    }

    function getStudentById(sId) {
      var s = _students.find(function (x) { return String(x.id) === String(sId); });
      if (s) return s;
      for (var i = 0; i < _groupStudents.length; i++) {
        s = _groupStudents[i].students.find(function (x) { return String(x.id) === String(sId); });
        if (s) return s;
      }
      return null;
    }

    genBtn.addEventListener('click', function () {
      var fId = formSel.value;
      var selectedIds = getSelectedStudents();
      if (!fId || selectedIds.length === 0) return;

      var formation = _formations.find(function (f) { return String(f.id) === String(fId); });
      var student = getStudentById(selectedIds[0]);
      if (!formation || !student) return;

      fillCertificate(student, formation);

      // Scroll to certificate preview
      setTimeout(function () {
        var preview = document.querySelector('.cert-preview-wrapper');
        if (preview) preview.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    function fillCertificate(student, formation) {
      var studentName = [student.first_name, student.last_name].filter(Boolean).join(' ');
      var today = new Date().toISOString().split('T')[0];

      document.getElementById('cert-out-student').textContent = studentName;
      document.getElementById('cert-out-formation').textContent = formation.title;
      document.getElementById('cert-out-date').textContent = today;

      var schoolInfo = window._ctx && window._ctx.school ? window._ctx.school : { name: 'School Name' };
      document.getElementById('cert-out-school').textContent = schoolInfo.name;
      var logoEl = document.getElementById('cert-out-logo');
      if (schoolInfo.logo) {
        logoEl.src = schoolImg(schoolInfo.logo, schoolInfo.name);
        logoEl.style.display = 'block';
      } else {
        logoEl.style.display = 'none';
      }
    }

    printBtn.addEventListener('click', function () {
      var fId = formSel.value;
      var selectedIds = getSelectedStudents();
      if (!fId || selectedIds.length === 0) return;

      var formation = _formations.find(function (f) { return String(f.id) === String(fId); });
      if (!formation) return;

      var certContainer = document.getElementById('printable-certificate');
      // Use html2canvas + jsPDF directly for reliable capture
      function captureCert(filename) {
        return new Promise(function (resolve, reject) {
          if (typeof html2canvas === 'undefined' || typeof jspdf === 'undefined') {
            return reject(new Error('PDF libraries not loaded yet. Please wait a moment and try again.'));
          }

          var origShadow = certContainer.style.boxShadow;
          certContainer.style.boxShadow = 'none';

          // Scroll element into view so html2canvas can see it
          certContainer.scrollIntoView({ block: 'start' });

          setTimeout(function () {
            html2canvas(certContainer, {
              scale: 2,
              useCORS: true,
              allowTaint: true,
              logging: false,
              backgroundColor: '#ffffff'
            }).then(function (canvas) {
              certContainer.style.boxShadow = origShadow;
              try {
                var imgData = canvas.toDataURL('image/jpeg', 1.0);
                var pdf = new jspdf.jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
                // Place image to fill full A4 landscape page (297mm x 210mm)
                pdf.addImage(imgData, 'JPEG', 0, 0, 297, 210);
                var buf = pdf.output('arraybuffer');
                resolve(buf);
              } catch (e) {
                reject(e);
              }
            }).catch(function (err) {
              certContainer.style.boxShadow = origShadow;
              reject(err);
            });
          }, 200);
        });
      }


      if (selectedIds.length === 1) {
        // Direct download as PDF
        if (typeof html2canvas === 'undefined' || typeof jspdf === 'undefined') {
          return showAlert('#backend-certificate-status', 'Libraries not loaded yet. Please wait.', 'danger');
        }
        var student = getStudentById(selectedIds[0]);
        if (!student) return;

        fillCertificate(student, formation);
        var studentName = [student.first_name, student.last_name].filter(Boolean).join(' ').trim() || 'Student';
        var fileName = studentName.replace(/[^a-z0-9]/gi, '_') + '_certificate.pdf';

        printBtn.disabled = true;
        genBtn.disabled = true;
        printBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Generating PDF...';

        captureCert(fileName).then(function (buf) {
          saveAs(new Blob([buf], { type: 'application/pdf' }), fileName);
          printBtn.disabled = false;
          genBtn.disabled = false;
          printBtn.innerHTML = '<i class="fa fa-download"></i> Download PDF / ZIP';
          showAlert('#backend-certificate-status', t('Certificate downloaded successfully!'), 'success');
        }).catch(function () {
          printBtn.disabled = false;
          genBtn.disabled = false;
          printBtn.innerHTML = '<i class="fa fa-download"></i> Download PDF / ZIP';
        });
      } else {
        // Bulk generate ZIP
        if (typeof JSZip === 'undefined' || typeof html2canvas === 'undefined' || typeof jspdf === 'undefined') {
          return showAlert('#backend-certificate-status', 'Libraries not loaded yet. Please wait.', 'danger');
        }

        printBtn.disabled = true;
        genBtn.disabled = true;
        printBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Generating PDF ZIP...';
        showAlert('#backend-certificate-status', 'Generating ' + selectedIds.length + ' certificates. Please wait, this may take a moment...', 'info');

        var zip = new JSZip();
        var currentIdx = 0;

        function processNext() {
          if (currentIdx >= selectedIds.length) {
            // Done generating, now create ZIP
            printBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Zipping...';
            zip.generateAsync({ type: "blob" }).then(function (content) {
              saveAs(content, "certificates_" + formation.title.replace(/[^a-z0-9]/gi, '_') + ".zip");
              printBtn.disabled = false;
              genBtn.disabled = false;
              printBtn.innerHTML = '<i class="fa fa-download"></i> Download PDF / ZIP';
              showAlert('#backend-certificate-status', t('ZIP file created successfully!'), 'success');
            }).catch(function (err) {
              printBtn.disabled = false;
              genBtn.disabled = false;
              printBtn.innerHTML = '<i class="fa fa-download"></i> Download PDF / ZIP';
              showAlert('#backend-certificate-status', 'Error creating ZIP: ' + err.message, 'danger');
            });
            return;
          }

          var sId = selectedIds[currentIdx];
          var student = getStudentById(sId);
          if (!student) {
            currentIdx++;
            processNext();
            return;
          }

          fillCertificate(student, formation);
          var studentName = [student.first_name, student.last_name].filter(Boolean).join(' ').trim() || 'Student';
          var fileName = studentName.replace(/[^a-z0-9]/gi, '_') + '_certificate.pdf';

          captureCert(fileName).then(function (pdfBuffer) {
            zip.file(fileName, pdfBuffer);
            currentIdx++;
            processNext();
          }).catch(function (err) {
            console.error('Error generating PDF for', studentName, err);
            currentIdx++;
            processNext();
          });
        }

        // Start processing
        processNext();
      }
    });
  };

  // ── Init ─────────────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    ensureAuth();
    loadHealth();
    initLanguageSwitcher();
    loadDashboard();
    bindLoginForm();
    bindRegisterForm();
    loadSchoolSettings();
    bindSetupSchoolForm();
    bindAdditionalAdminControls();
    // Students
    loadStudents(); bindAddStudentForm(); bindEditStudentForm(); loadStudentProfile(); bindImportExcel();
    applyTranslations(document);
    populatePaymentFilters().then(function () { bindPaymentFilters(); loadPaymentsPage(); });
    // Teachers
    loadTeachers(); bindAddTeacherForm(); bindEditTeacherForm(); loadTeacherProfile();
    // Formations
    loadFormations(); bindAddFormationForm(); bindEditFormationForm(); loadFormationProfile();
    // Classrooms
    loadClassrooms(); bindAddClassroomForm();
    // Groups
    loadGroupsPage(); bindAddGroupForm(); bindEditGroupForm(); loadGroupProfile();
    // Promo Codes
    loadPromoCodesPage();
  });

  // ── Promo Codes ────────────────────────────────────────────────────────────
  function loadPromoCodesPage() {
    if (!document.getElementById('backend-promos-table')) return;
    var sel = document.getElementById('promo-formation-id');
    if (sel) {
      request('/api/formations-list').then(function (p) {
        sel.innerHTML = '<option value="">-- Select Formation *</option>' +
          (p.data || []).map(function (f) { return '<option value="' + f.id + '">' + esc(f.title) + '</option>'; }).join('');
      }).catch(function () { });
    }

    loadPromoCodes();

    var form = document.getElementById('backend-add-promo-form');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var fd = new FormData(form);
        var btn = form.querySelector('[type=submit]'); if (btn) btn.disabled = true;

        request('/api/promo-codes', {
          method: 'POST',
          body: JSON.stringify({
            formation_id: fd.get('formation_id'),
            code: fd.get('code'),
            discount_percent: parseInt(fd.get('discount_percent')),
            type: fd.get('type')
          })
        }).then(function () {
          form.reset();
          if (btn) btn.disabled = false;
          loadPromoCodes();
          showAlert('#backend-promos-status', t('Promo code generated successfully'), 'success');
        }).catch(function (err) {
          if (btn) btn.disabled = false;
          showAlert('#backend-promos-status', err.message);
        });
      });
    }

    document.getElementById('backend-promos-table').addEventListener('click', function (e) {
      var delBtn = e.target.closest('[data-del-promo]');
      if (delBtn) {
        if (!confirm('Delete this promo code?')) return;
        request('/api/promo-codes/' + delBtn.getAttribute('data-del-promo'), { method: 'DELETE' })
          .then(loadPromoCodes).catch(function (err) { showAlert('#backend-promos-status', err.message); });
      }
      var tglBtn = e.target.closest('[data-tgl-promo]');
      if (tglBtn) {
        var id = tglBtn.getAttribute('data-tgl-promo');
        var st = tglBtn.getAttribute('data-status') === '1' ? false : true;
        request('/api/promo-codes/' + id, { method: 'PUT', body: JSON.stringify({ is_active: st }) })
          .then(loadPromoCodes).catch(function (err) { showAlert('#backend-promos-status', err.message); });
      }
    });
  }

  function initQuickActions() {
    if (document.getElementById('quick-action-bar')) return;
    var bar = document.createElement('div');
    bar.id = 'quick-action-bar';
    bar.style.cssText = 'position:fixed; bottom:-80px; left:50%; transform:translateX(-50%); background:#2c3e50; color:white; padding:12px 24px; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.15); display:flex; align-items:center; gap:16px; transition:bottom 0.3s; z-index:9999;';
    bar.innerHTML = '<span id="qa-count" style="font-weight:600;">0 selected</span>' +
      '<button id="qa-active" class="btn btn-success btn-sm"><i class="fa fa-check"></i> Active</button>' +
      '<button id="qa-inactive" class="btn btn-warning btn-sm"><i class="fa fa-times"></i> Inactive</button>' +
      '<button id="qa-delete" class="btn btn-danger btn-sm"><i class="fa fa-trash"></i> Delete</button>';
    document.body.appendChild(bar);

    function updateQA() {
      var checked = document.querySelectorAll('.row-checkbox:checked');
      var type = checked.length ? checked[0].getAttribute('data-type') : null;
      if (checked.length > 0) {
        bar.style.bottom = '24px';
        document.getElementById('qa-count').textContent = checked.length + ' selected';
        if (type === 'group') {
          document.getElementById('qa-active').style.display = 'none';
          document.getElementById('qa-inactive').style.display = 'none';
        } else {
          document.getElementById('qa-active').style.display = 'inline-block';
          document.getElementById('qa-inactive').style.display = 'inline-block';
          if (type === 'formation') {
            document.getElementById('qa-active').innerHTML = '<i class="fa fa-check"></i> Open';
            document.getElementById('qa-inactive').innerHTML = '<i class="fa fa-times"></i> Closed';
          } else {
            document.getElementById('qa-active').innerHTML = '<i class="fa fa-check"></i> Active';
            document.getElementById('qa-inactive').innerHTML = '<i class="fa fa-times"></i> Inactive';
          }
        }
      } else {
        bar.style.bottom = '-80px';
      }
    }

    document.addEventListener('change', function (e) {
      if (e.target.classList.contains('select-all')) {
        var isChecked = e.target.checked;
        document.querySelectorAll('.row-checkbox').forEach(function (cb) {
          cb.checked = isChecked;
        });
        updateQA();
      } else if (e.target.classList.contains('row-checkbox')) {
        updateQA();
        var all = document.querySelectorAll('.row-checkbox');
        var checked = document.querySelectorAll('.row-checkbox:checked');
        var selectAll = document.querySelector('.select-all');
        if (selectAll) {
          selectAll.checked = (all.length > 0 && all.length === checked.length);
        }
      }
    });

    function getIds() {
      return Array.from(document.querySelectorAll('.row-checkbox:checked')).map(function (cb) { return cb.value; });
    }

    function getType() {
      var checked = document.querySelector('.row-checkbox:checked');
      return checked ? checked.getAttribute('data-type') : null;
    }

    function doBulkAction(actionStr, value) {
      var ids = getIds();
      var type = getType();
      if (!ids.length) return;
      if (actionStr === 'delete') {
        if (!confirm('Are you sure you want to delete ' + ids.length + ' items?')) return;
      }

      var promises = ids.map(function (id) {
        var endpoint = '';
        if (type === 'student') endpoint = '/api/student-registrations/' + id;
        else if (type === 'teacher') endpoint = '/api/teacher-registrations/' + id;
        else if (type === 'formation') endpoint = '/api/formations/' + id;
        else if (type === 'group') endpoint = '/api/groups/' + id;

        if (actionStr === 'delete') {
          return request(endpoint, { method: 'DELETE' });
        } else {
          var payload = {};
          if (type === 'formation') {
            payload.status = value;
          } else {
            payload.is_active = value;
          }
          return request(endpoint, { method: 'PUT', body: JSON.stringify(payload) });
        }
      });

      Promise.all(promises).then(function () {
        document.querySelectorAll('.select-all').forEach(function (cb) { cb.checked = false; });
        updateQA();
        if (type === 'student') loadStudents();
        else if (type === 'teacher') loadTeachers();
        else if (type === 'formation') loadFormations();
        else if (type === 'group') loadGroups();
      }).catch(function (err) {
        alert('Action partially failed: ' + err.message);
        if (type === 'student') loadStudents();
        else if (type === 'teacher') loadTeachers();
        else if (type === 'formation') loadFormations();
        else if (type === 'group') loadGroups();
      });
    }

    document.getElementById('qa-active').addEventListener('click', function () {
      doBulkAction('update', getType() === 'formation' ? 'open' : 1);
    });
    document.getElementById('qa-inactive').addEventListener('click', function () {
      doBulkAction('update', getType() === 'formation' ? 'closed' : 0);
    });
    document.getElementById('qa-delete').addEventListener('click', function () {
      doBulkAction('delete');
    });
  }

  document.addEventListener('DOMContentLoaded', initQuickActions);

  function loadPromoCodes() {
    var tbl = document.getElementById('backend-promos-table'); if (!tbl) return;
    request('/api/promo-codes').then(function (p) {
      var rows = p.data || [];
      var tbody = tbl.querySelector('tbody');
      if (!rows.length) { tbody.innerHTML = '<tr><td colspan="6" class="text-center">No records found</td></tr>'; return; }

      tbody.innerHTML = rows.map(function (r) {
        var statusHtml = r.is_active ? '<span class="promo-badge active">Active</span>' : '<span class="promo-badge inactive">Inactive</span>';
        var tglIcon = r.is_active ? 'fa-ban' : 'fa-check';
        var tglClass = r.is_active ? 'btn-warning' : 'btn-success';
        var tglTitle = r.is_active ? 'Disable' : 'Enable';
        var formationLabel = esc(r.formation_title || ('#' + r.formation_id));
        var typeLabel = esc(r.type === 'single_student' ? 'Single Student' : 'Many Students');

        return '<tr>' +
          '<td><strong>' + esc(r.code) + '</strong></td>' +
          '<td><div style="font-weight:600">' + formationLabel + '</div><small class="text-muted">#' + esc(r.formation_id) + '</small></td>' +
          '<td><span class="promo-pill">' + esc(r.discount_percent) + '%</span></td>' +
          '<td>' + typeLabel + '</td>' +
          '<td>' + statusHtml + '</td>' +
          '<td>' +
          '<button class="btn btn-xs ' + tglClass + '" data-tgl-promo="' + r.id + '" data-status="' + (r.is_active ? 1 : 0) + '" title="' + tglTitle + '"><i class="fa ' + tglIcon + '"></i></button> ' +
          '<button class="btn btn-xs btn-danger" data-del-promo="' + r.id + '" title="Delete"><i class="fa fa-trash"></i></button>' +
          '</td></tr>';
      }).join('');
    }).catch(function (err) { showAlert('#backend-promos-status', err.message); });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // WEEKLY PROGRAM PLANNING
  // ══════════════════════════════════════════════════════════════════════════

  var WP = {
    programs: [],           // list of all programs
    current: null,          // full detail of selected program
    groups: [],             // available groups for the school
    classrooms: [],         // available classrooms
    editMode: false,        // is entry modal in edit mode?
    DAYS: ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    COLORS: [
      '#4f6eff', '#11998e', '#f7971e', '#fc466b', '#a18cd1',
      '#38ef7d', '#4facfe', '#fa709a', '#667eea', '#f093fb',
      '#43e97b', '#fda085', '#30cfd0', '#a8edea', '#9f7aea'
    ]
  };

  // ── Entry point ────────────────────────────────────────────────────────────
  function initWeeklyProgram() {
    if (document.body.getAttribute('data-page') !== 'weekly-program') return;

    // Load programs + groups + classrooms in parallel
    Promise.all([
      request('/api/weekly-programs').then(function (p) { WP.programs = p.data || []; }),
      request('/api/groups').then(function (p) { WP.groups = p.data || []; }),
      request('/api/classrooms').then(function (p) { WP.classrooms = p.data || []; })
    ]).then(function () {
      renderProgList();
      populateGroupDropdown();
      populateClassroomDropdown();
    }).catch(function (err) {
      showAlert('#wp-global-alert', err.message, 'danger');
    });

    bindWpButtons();
    buildColorSwatches();
    bindWpForms();
    autoActivateSlotLabel();
  }

  // ── Render program list ────────────────────────────────────────────────────
  function renderProgList() {
    var el = document.getElementById('wp-prog-list');
    if (!el) return;
    if (!WP.programs.length) {
      el.innerHTML = '<p class="text-muted text-center" style="padding:20px 0">No programs yet.<br>Click <strong>Create Program</strong> to start.</p>';
      return;
    }
    el.innerHTML = WP.programs.map(function (p) {
      var badge = p.status === 'active'
        ? '<span class="badge-active">Active</span>'
        : '<span class="badge-disabled">Disabled</span>';
      var sel = (WP.current && WP.current.id === p.id) ? ' selected' : '';
      return '<div class="prog-item' + sel + '" data-prog-id="' + p.id + '">' +
        '<div class="prog-item-name">' + esc(p.name) + ' ' + badge + '</div>' +
        '<div class="prog-item-meta">Created: ' + esc(String(p.created_at || '').split('T')[0]) + '</div>' +
        '</div>';
    }).join('');

    el.querySelectorAll('.prog-item').forEach(function (item) {
      item.addEventListener('click', function () {
        var id = this.getAttribute('data-prog-id');
        loadProgramDetail(id);
      });
    });
  }

  // ── Load full program detail ───────────────────────────────────────────────
  function loadProgramDetail(id) {
    request('/api/weekly-programs/' + id).then(function (p) {
      WP.current = p.data;
      document.getElementById('wp-no-selection').style.display = 'none';
      document.getElementById('wp-detail').style.display = 'block';
      renderProgDetail();
      renderTimetableGrid();
      // highlight selected item
      document.querySelectorAll('.prog-item').forEach(function (it) {
        it.classList.toggle('selected', it.getAttribute('data-prog-id') == id);
      });
    }).catch(function (err) {
      showAlert('#wp-global-alert', 'Could not load program: ' + err.message, 'danger');
    });
  }

  // ── Render program header/toolbar ──────────────────────────────────────────
  function renderProgDetail() {
    var p = WP.current;
    document.getElementById('wp-detail-name').textContent = p.name;
    document.getElementById('wp-prog-desc').textContent = p.description || '';
    var badge = document.getElementById('wp-detail-badge');
    badge.innerHTML = p.status === 'active'
      ? '<span class="badge-active"><i class="fa fa-circle"></i> Active</span>'
      : '<span class="badge-disabled">Disabled</span>';
    // Toggle activate button visibility
    var activateBtn = document.getElementById('wp-btn-activate');
    activateBtn.style.display = p.status === 'active' ? 'none' : '';
  }

  // ── Render the timetable grid ──────────────────────────────────────────────
  function renderTimetableGrid() {
    var wrap = document.getElementById('wp-grid-wrap');
    var p = WP.current;
    var slots = p.slots || [];
    var entries = p.entries || [];

    if (!slots.length) {
      wrap.innerHTML =
        '<div class="wp-empty"><i class="fa fa-clock-o"></i>' +
        '<h4>No time slots yet</h4>' +
        '<p>Click <strong>Add Time Slot</strong> to build the timetable rows.</p></div>';
      return;
    }

    // Index entries by slotId_day
    var eMap = {};
    entries.forEach(function (e) {
      var k = e.slot_id + '_' + e.day_of_week;
      if (!eMap[k]) eMap[k] = [];
      eMap[k].push(e);
    });

    var colW = Math.floor(88 / WP.DAYS.length) + '%';
    var html = '<div class="tt-wrap"><table class="tt-table"><thead><tr>' +
      '<th class="tt-th-time">Time</th>' +
      WP.DAYS.map(function (d) { return '<th>' + d + '</th>'; }).join('') +
      '<th class="no-print" style="width:64px">Actions</th>' +
      '</tr></thead><tbody>';

    slots.forEach(function (slot) {
      html += '<tr><td class="tt-slot-label" style="text-align:center; padding: 8px 4px;">' +
        '<div style="font-weight:700;font-size:13px;color:#1a1f37;">' + esc(slot.start_time) + '</div>' +
        '<div style="font-size:10px;color:#99a;margin:2px 0;">–</div>' +
        '<div style="font-weight:700;font-size:13px;color:#1a1f37;">' + esc(slot.end_time) + '</div>' +
        '</td>';

      WP.DAYS.forEach(function (_, di) {
        var day = di + 1;
        var k = slot.id + '_' + day;
        var chips = (eMap[k] || []).map(function (e) {
          var bg = e.color || '#4f6eff';
          var details = [];
          if (e.classroom_name) details.push('<i class="fa fa-map-marker"></i> ' + esc(e.classroom_name));
          if (e.teacher_name) details.push('<i class="fa fa-user"></i> ' + esc(e.teacher_name));
          var detailsHtml = details.length ? '<span class="entry-chip-group" style="font-size:9.5px; opacity: 0.9; margin-top:2px;">' + details.join(' | ') + '</span>' : '';

          return '<div class="entry-chip" style="background:' + bg + '" data-entry-id="' + e.id + '">' +
            '<div class="entry-chip-body">' +
            '<span class="entry-chip-subject">' + esc(e.subject_name) + '</span>' +
            '<span class="entry-chip-group">' + esc(e.group_name) + '</span>' +
            detailsHtml +
            '</div>' +
            '<button class="entry-chip-del no-print" data-del-entry="' + e.id + '" title="Remove"><i class="fa fa-times"></i></button>' +
            '</div>';
        }).join('');

        html += '<td class="tt-cell"><div class="tt-cell-inner" data-slot="' + slot.id + '" data-day="' + day + '">' +
          chips +
          '<div class="add-hint no-print"><i class="fa fa-plus"></i></div>' +
          '</div></td>';
      });

      // Slot actions (edit/delete)
      html += '<td class="no-print" style="vertical-align:middle;padding:4px">' +
        '<div class="slot-actions">' +
        '<button data-edit-slot="' + slot.id + '" title="Edit slot"><i class="fa fa-pencil"></i></button>' +
        '<button class="del" data-del-slot="' + slot.id + '" title="Delete slot"><i class="fa fa-trash"></i></button>' +
        '</div></td>';
      html += '</tr>';
    });

    html += '</tbody></table></div>';
    wrap.innerHTML = html;
    if (window.AppI18n) window.AppI18n.translateAll(wrap);

    // Bind cell clicks (open entry modal)
    wrap.querySelectorAll('.tt-cell-inner').forEach(function (cell) {
      cell.addEventListener('click', function (e) {
        if (e.target.closest('[data-del-entry]')) return; // handled below
        var slotId = this.getAttribute('data-slot');
        var day = this.getAttribute('data-day');
        openEntryModal(slotId, day);
      });
    });

    // Bind delete-entry buttons
    wrap.querySelectorAll('[data-del-entry]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var id = this.getAttribute('data-del-entry');
        if (!confirm('Remove this entry?')) return;
        request('/api/weekly-programs/' + WP.current.id + '/entries/' + id, { method: 'DELETE' })
          .then(function () { loadProgramDetail(WP.current.id); })
          .catch(function (err) { showAlert('#wp-global-alert', err.message, 'danger'); });
      });
    });

    // Bind slot edit buttons
    wrap.querySelectorAll('[data-edit-slot]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var slotId = this.getAttribute('data-edit-slot');
        var slot = (WP.current.slots || []).filter(function (s) { return s.id == slotId; })[0];
        if (!slot) return;
        openSlotModal(slot);
      });
    });

    // Bind slot delete buttons
    wrap.querySelectorAll('[data-del-slot]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var slotId = this.getAttribute('data-del-slot');
        if (!confirm('Delete this time slot and ALL its entries?')) return;
        request('/api/weekly-programs/' + WP.current.id + '/slots/' + slotId, { method: 'DELETE' })
          .then(function () { loadProgramDetail(WP.current.id); })
          .catch(function (err) { showAlert('#wp-global-alert', err.message, 'danger'); });
      });
    });
  }

  // ── Open entry modal (add or edit) ─────────────────────────────────────────
  function openEntryModal(slotId, day) {
    var slot = (WP.current.slots || []).filter(function (s) { return s.id == slotId; })[0];
    var dayName = WP.DAYS[parseInt(day) - 1] || ('Day ' + day);
    document.getElementById('wp-entry-form-id').value = '';
    document.getElementById('wp-entry-form-slot-id').value = slotId;
    document.getElementById('wp-entry-form-day').value = day;
    document.getElementById('wp-entry-form-subject').value = '';
    document.getElementById('wp-entry-form-group').value = '';
    document.getElementById('wp-entry-form-classroom').value = '';
    setEntryColor('#4f6eff');
    document.getElementById('wp-entry-slot-info').textContent =
      (slot ? slot.label : '') + '  —  ' + dayName;
    document.getElementById('modalEntryTitle').textContent = 'Add Schedule Entry';
    document.getElementById('wp-entry-form-alert').style.display = 'none';
    $('#modalEntry').modal('show');
  }

  // ── Open slot modal (add or edit) ──────────────────────────────────────────
  function openSlotModal(slot) {
    if (slot) {
      document.getElementById('modalSlotTitle').textContent = 'Edit Time Slot';
      document.getElementById('wp-slot-form-id').value = slot.id;
      document.getElementById('wp-slot-form-label').value = slot.label;
      document.getElementById('wp-slot-form-start').value = slot.start_time;
      document.getElementById('wp-slot-form-end').value = slot.end_time;
      document.getElementById('wp-slot-form-order').value = slot.sort_order;
      document.getElementById('wp-slot-form-submit').textContent = 'Save Changes';
    } else {
      document.getElementById('modalSlotTitle').textContent = 'Add Time Slot';
      document.getElementById('wp-slot-form-id').value = '';
      document.getElementById('wp-slot-form-label').value = '';
      document.getElementById('wp-slot-form-start').value = '';
      document.getElementById('wp-slot-form-end').value = '';
      document.getElementById('wp-slot-form-order').value = (WP.current.slots || []).length;
      document.getElementById('wp-slot-form-submit').textContent = 'Add Slot';
    }
    document.getElementById('wp-slot-form-alert').style.display = 'none';
    $('#modalSlot').modal('show');
  }

  // ── Color swatches ─────────────────────────────────────────────────────────
  function buildColorSwatches() {
    var row = document.getElementById('wp-entry-color-row');
    if (!row) return;
    WP.COLORS.forEach(function (c) {
      var sw = document.createElement('div');
      sw.className = 'color-swatch';
      sw.style.background = c;
      sw.setAttribute('data-color', c);
      if (c === '#4f6eff') sw.classList.add('selected');
      sw.addEventListener('click', function () { setEntryColor(c); });
      row.appendChild(sw);
    });
  }

  function setEntryColor(color) {
    document.getElementById('wp-entry-form-color').value = color;
    document.querySelectorAll('.color-swatch').forEach(function (sw) {
      sw.classList.toggle('selected', sw.getAttribute('data-color') === color);
    });
  }

  // ── Populate group & classroom dropdowns ───────────────────────────────────
  function populateGroupDropdown() {
    var sel = document.getElementById('wp-entry-form-group');
    if (!sel) return;
    if (!WP.groups.length) {
      sel.innerHTML = '<option value="">No groups available</option>';
      return;
    }
    sel.innerHTML = '<option value="">-- Select group --</option>' +
      WP.groups.map(function (g) {
        var label = esc(g.name) + (g.formation_title ? ' (' + esc(g.formation_title) + ')' : '');
        return '<option value="' + g.id + '">' + label + '</option>';
      }).join('');
  }

  function populateClassroomDropdown() {
    var sel = document.getElementById('wp-entry-form-classroom');
    if (!sel) return;
    if (!WP.classrooms.length) {
      sel.innerHTML = '<option value="">No classrooms available</option>';
      return;
    }
    sel.innerHTML = '<option value="">-- No classroom --</option>' +
      WP.classrooms.map(function (c) {
        return '<option value="' + c.id + '">' + esc(c.name) + '</option>';
      }).join('');
  }

  // ── Auto-fill slot label from time inputs ──────────────────────────────────
  function autoActivateSlotLabel() {
    var startEl = document.getElementById('wp-slot-form-start');
    var endEl = document.getElementById('wp-slot-form-end');
    var lblEl = document.getElementById('wp-slot-form-label');
    if (!startEl || !endEl || !lblEl) return;
    function sync() {
      if (startEl.value && endEl.value && !lblEl.value) {
        lblEl.value = startEl.value + ' – ' + endEl.value;
      }
    }
    startEl.addEventListener('change', sync);
    endEl.addEventListener('change', function () {
      if (startEl.value && endEl.value) {
        lblEl.value = startEl.value + ' – ' + endEl.value;
      }
    });
  }

  // ── Bind toolbar buttons ───────────────────────────────────────────────────
  function bindWpButtons() {
    // Create program button
    var createBtn = document.getElementById('wp-create-btn');
    if (createBtn) createBtn.addEventListener('click', function () {
      document.getElementById('modalProgramTitle').textContent = 'Create Program';
      document.getElementById('wp-prog-form-id').value = '';
      document.getElementById('wp-prog-form-name').value = '';
      document.getElementById('wp-prog-form-desc').value = '';
      document.getElementById('wp-prog-form-submit').textContent = 'Create';
      document.getElementById('wp-prog-form-alert').style.display = 'none';
      $('#modalProgram').modal('show');
    });

    // Edit program
    var editBtn = document.getElementById('wp-btn-edit');
    if (editBtn) editBtn.addEventListener('click', function () {
      if (!WP.current) return;
      document.getElementById('modalProgramTitle').textContent = 'Edit Program';
      document.getElementById('wp-prog-form-id').value = WP.current.id;
      document.getElementById('wp-prog-form-name').value = WP.current.name;
      document.getElementById('wp-prog-form-desc').value = WP.current.description || '';
      document.getElementById('wp-prog-form-submit').textContent = 'Save Changes';
      document.getElementById('wp-prog-form-alert').style.display = 'none';
      $('#modalProgram').modal('show');
    });

    // Activate
    var activateBtn = document.getElementById('wp-btn-activate');
    if (activateBtn) activateBtn.addEventListener('click', function () {
      if (!WP.current) return;
      if (!confirm('Activate "' + WP.current.name + '"? All other programs will be disabled.')) return;
      request('/api/weekly-programs/' + WP.current.id + '/activate', { method: 'POST' })
        .then(function () {
          return Promise.all([
            request('/api/weekly-programs').then(function (p) { WP.programs = p.data || []; }),
            loadProgramDetail(WP.current.id)
          ]);
        }).then(function () { renderProgList(); })
        .catch(function (err) { showAlert('#wp-global-alert', err.message, 'danger'); });
    });

    // Add time slot
    var addSlotBtn = document.getElementById('wp-btn-add-slot');
    if (addSlotBtn) addSlotBtn.addEventListener('click', function () {
      if (!WP.current) return;
      openSlotModal(null);
    });

    // Delete program
    var delBtn = document.getElementById('wp-btn-delete');
    if (delBtn) delBtn.addEventListener('click', function () {
      if (!WP.current) return;
      if (!confirm('Delete program "' + WP.current.name + '" and ALL its data?')) return;
      request('/api/weekly-programs/' + WP.current.id, { method: 'DELETE' })
        .then(function () {
          WP.current = null;
          return request('/api/weekly-programs').then(function (p) { WP.programs = p.data || []; });
        }).then(function () {
          renderProgList();
          document.getElementById('wp-detail').style.display = 'none';
          document.getElementById('wp-no-selection').style.display = 'block';
          showAlert('#wp-global-alert', t('Program deleted.'), 'success');
        }).catch(function (err) { showAlert('#wp-global-alert', err.message, 'danger'); });
    });

    // PDF / Print
    var pdfBtn = document.getElementById('wp-btn-pdf');
    if (pdfBtn) pdfBtn.addEventListener('click', function () {
      if (!WP.current) return;

      var gridWrap = document.getElementById('wp-grid-wrap');
      if (!gridWrap) return;

      if (typeof html2pdf === 'undefined') { window.print(); return; }

      // Build a complete self-contained HTML string.
      // This bypasses ALL html2canvas DOM/scroll/coordinate bugs because
      // html2pdf renders the HTML in its own hidden iframe — not from a live DOM element.
      var school = (window._ctx && window._ctx.school) ? window._ctx.school : { name: 'Our School' };
      var currentYear = new Date().getFullYear();
      var academicYear = currentYear + ' - ' + (currentYear + 1);

      // Extract the existing CSS from the page's <style> blocks for the timetable
      var existingCss = '';
      document.querySelectorAll('style').forEach(function (s) { existingCss += s.innerHTML; });

      // Get the current grid HTML, clean it up
      var gridClone = gridWrap.cloneNode(true);
      gridClone.querySelectorAll('.no-print, .add-hint, .entry-chip-del').forEach(function (el) { el.remove(); });
      var gridHtml = gridClone.outerHTML;

      var isRtl = document.documentElement.dir === 'rtl';
      var dirAttr = isRtl ? ' dir="rtl"' : '';
      var bodyPadding = isRtl ? '40px 35px 40px 40px' : '40px 60px 40px 15px';

      var htmlContent = '<!DOCTYPE html><html' + dirAttr + '><head><meta charset="utf-8">' +
        '<style>' +
        'body { margin: 0px; padding: ' + bodyPadding + '; background: #fff; font-family: "Tajawal", "Inter", Arial, sans-serif; box-sizing: border-box; width: 1280px; }' +
        '.pdf-header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 3px solid #1a1f37; padding-bottom: 14px; margin-bottom: 24px; padding-left: 10px; padding-right: 10px; }' +
        '.pdf-school-name { margin:0; font-weight:800; font-size:24px; color:#1a1f37; text-transform:uppercase; }' +
        '.pdf-school-year { margin:4px 0 0; font-size:14px; color:#555; font-weight:600; }' +
        '.pdf-prog-name { margin:0; font-weight:800; font-size:24px; color:#4f6eff; text-transform:uppercase; }' +
        '.pdf-gen-date { margin:4px 0 0; font-size:14px; color:#555; }' +
        '.pdf-footer { margin-top: 40px; display: flex; justify-content: ' + (isRtl ? 'flex-start' : 'flex-end') + '; padding-right: 120px; padding-left: 20px; }' +
        '.pdf-stamp { width:80px; height:80px; border-radius:50%; border:3px solid #1a1f37; display:flex; align-items:center; justify-content:center; text-align:center; opacity:.75; }' +
        '.pdf-stamp-text { font-weight:800; font-size:11px; color:#1a1f37; line-height:1.2; }' +
        '.pdf-stamp-school { font-size:8px; font-weight:600; display:block; margin-top:2px; text-transform:uppercase; }' +
        existingCss +
        '.tt-table { width:100% !important; min-width:100% !important; table-layout:fixed !important; border-collapse:collapse; margin: 10px 20px 0 20px; }' +
        '.tt-table th { border: 1px solid #ddd; background: #f5f7ff; padding: 12px 8px; font-size: 14px; }' +
        '.tt-table td { border: 1px solid #ddd; vertical-align: top; }' +
        '.tt-th-time { width: 85px !important; }' +
        '.tt-slot-label { font-size:12px; padding:8px; text-align:center; background:#f8f9fd; }' +
        '.tt-cell, .tt-header { word-wrap:break-word; overflow-wrap:break-word; padding:4px; }' +
        '.tt-cell-inner { border:1px solid transparent !important; box-shadow:0 1px 4px rgba(0,0,0,0.05); min-height: 60px; margin: 2px; }' +
        '.entry-chip { margin-bottom: 4px; padding: 6px; box-shadow: none; border-radius: 6px; }' +
        '.entry-chip-subject { font-size:12px; font-weight:bold; white-space:normal; overflow:visible; }' +
        '.entry-chip-group { font-size:11px; white-space:normal; overflow:visible; }' +
        '.wp-card { box-shadow:none !important; border:none !important; padding:0 !important; background:transparent !important; }' +
        '.wp-card-title { display:none !important; }' +
        '</style>' +
        '</head><body>' +
        '<div class="pdf-header">' +
        '<div style="text-align:' + (isRtl ? 'right' : 'left') + '; position: relative; left: -30px;">' +
        '<p class="pdf-school-name">' + esc(school.name) + '</p>' +
        '<p class="pdf-school-year">Academic Year: ' + academicYear + '</p>' +
        '</div>' +
        '<div style="text-align:' + (isRtl ? 'left' : 'right') + '">' +
        '<p class="pdf-prog-name">' + esc(WP.current.name) + '</p>' +
        '<p class="pdf-gen-date">Generated on ' + new Date().toLocaleDateString() + '</p>' +
        '</div>' +
        '</div>' +
        gridHtml +
        '<div class="pdf-footer">' +
        '<div class="pdf-stamp">' +
        '<div class="pdf-stamp-text">OFFICIAL<br>STAMP<span class="pdf-stamp-school">' + esc(school.name) + '</span></div>' +
        '</div>' +
        '</div>' +
        '</body></html>';

      var opt = {
        margin: 8,
        filename: 'timetable-' + WP.current.name.replace(/\\s+/g, '-') + '.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, windowWidth: 1400 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'l' }
      };

      html2pdf().set(opt).from(htmlContent, 'string').save();
    });
  }

  // ── Bind form submissions ──────────────────────────────────────────────────
  function bindWpForms() {
    // Auto-select classroom when group changes
    var grpSelect = document.getElementById('wp-entry-form-group');
    var clsSelect = document.getElementById('wp-entry-form-classroom');
    if (grpSelect && clsSelect) {
      grpSelect.addEventListener('change', function () {
        var gid = this.value;
        if (!gid) return;
        var group = WP.groups.filter(function (g) { return String(g.id) === String(gid); })[0];
        if (group && group.classroom_id) {
          clsSelect.value = group.classroom_id;
        } else {
          clsSelect.value = ''; // Reset if group has no default classroom
        }
      });
    }

    // Program form
    var progForm = document.getElementById('wp-prog-form');
    if (progForm) progForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var id = document.getElementById('wp-prog-form-id').value;
      var name = document.getElementById('wp-prog-form-name').value.trim();
      var desc = document.getElementById('wp-prog-form-desc').value.trim();
      if (!name) { showAlert('#wp-prog-form-alert', 'Program name is required', 'danger'); return; }

      var isEdit = !!id;
      var method = isEdit ? 'PUT' : 'POST';
      var url = isEdit ? '/api/weekly-programs/' + id : '/api/weekly-programs';
      var btn = document.getElementById('wp-prog-form-submit');
      btn.disabled = true;

      request(url, { method: method, body: JSON.stringify({ name: name, description: desc || null }) })
        .then(function () {
          return request('/api/weekly-programs').then(function (p) { WP.programs = p.data || []; });
        }).then(function () {
          btn.disabled = false;
          $('#modalProgram').modal('hide');
          renderProgList();
          if (isEdit && WP.current && WP.current.id == id) loadProgramDetail(id);
        }).catch(function (err) {
          btn.disabled = false;
          showAlert('#wp-prog-form-alert', err.message, 'danger');
        });
    });

    // Slot form
    var slotForm = document.getElementById('wp-slot-form');
    if (slotForm) slotForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!WP.current) return;
      var id = document.getElementById('wp-slot-form-id').value;
      var label = document.getElementById('wp-slot-form-label').value.trim();
      var start = document.getElementById('wp-slot-form-start').value;
      var end = document.getElementById('wp-slot-form-end').value;
      var order = parseInt(document.getElementById('wp-slot-form-order').value) || 0;
      if (!label || !start || !end) { showAlert('#wp-slot-form-alert', 'All time fields are required', 'danger'); return; }

      var isEdit = !!id;
      var method = isEdit ? 'PUT' : 'POST';
      var url = isEdit
        ? '/api/weekly-programs/' + WP.current.id + '/slots/' + id
        : '/api/weekly-programs/' + WP.current.id + '/slots';
      var btn = document.getElementById('wp-slot-form-submit');
      btn.disabled = true;

      request(url, { method: method, body: JSON.stringify({ label: label, start_time: start, end_time: end, sort_order: order }) })
        .then(function () {
          btn.disabled = false;
          $('#modalSlot').modal('hide');
          loadProgramDetail(WP.current.id);
        }).catch(function (err) {
          btn.disabled = false;
          showAlert('#wp-slot-form-alert', err.message, 'danger');
        });
    });

    // Entry form
    var entryForm = document.getElementById('wp-entry-form');
    if (entryForm) entryForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!WP.current) return;
      var id = document.getElementById('wp-entry-form-id').value;
      var slotId = document.getElementById('wp-entry-form-slot-id').value;
      var day = document.getElementById('wp-entry-form-day').value;
      var groupId = document.getElementById('wp-entry-form-group').value;
      var classId = document.getElementById('wp-entry-form-classroom').value;
      var subject = document.getElementById('wp-entry-form-subject').value.trim();
      var color = document.getElementById('wp-entry-form-color').value || '#4f6eff';

      if (!groupId || !subject) { showAlert('#wp-entry-form-alert', 'Group and subject are required', 'danger'); return; }

      var isEdit = !!id;
      var method = isEdit ? 'PUT' : 'POST';
      var url = isEdit
        ? '/api/weekly-programs/' + WP.current.id + '/entries/' + id
        : '/api/weekly-programs/' + WP.current.id + '/entries';

      request(url, {
        method: method, body: JSON.stringify({
          slot_id: parseInt(slotId), day_of_week: parseInt(day),
          group_id: parseInt(groupId), subject_name: subject, color: color,
          classroom_id: classId ? parseInt(classId) : null
        })
      }).then(function () {
        $('#modalEntry').modal('hide');
        loadProgramDetail(WP.current.id);
      }).catch(function (err) { showAlert('#wp-entry-form-alert', err.message, 'danger'); });
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ATTENDANCE & SCANNING
  // ══════════════════════════════════════════════════════════════════════════

  function initAttendance() {
    if (document.body.getAttribute('data-page') !== 'attendance') return;

    // Set default date to today
    var dateInput = document.getElementById('attendance-filter-date');
    var todayStr = new Date().toISOString().split('T')[0];
    if (dateInput) {
      dateInput.value = todayStr;
    }

    // Validate button logic
    var btnValidate = document.getElementById('btn-validate-attendance');
    if (btnValidate) {
      btnValidate.addEventListener('click', function () {
        var gId = document.getElementById('attendance-filter-group').value;
        var dVal = document.getElementById('attendance-filter-date').value;
        var subjectVal = document.getElementById('attendance-filter-subject') ? document.getElementById('attendance-filter-subject').value : '';
        if (!gId) {
          alert('Please select a specific group to validate.');
          return;
        }
        if (!confirm('Are you sure you want to validate attendance for this group? This will lock it from further changes.')) return;

        btnValidate.disabled = true;
        request('/api/attendance/validate', {
          method: 'POST',
          body: JSON.stringify({ group_id: gId, date: dVal, admin_id: window._ctx.user.id, subject_name: subjectVal })
        }).then(function () {
          alert('Attendance validated and locked successfully!');
          loadAttendanceData();
        }).catch(function (err) {
          alert('Error validating: ' + err.message);
          btnValidate.disabled = false;
        });
      });
    }

    populateAttendanceGroups();
    bindAttendanceFilters();

    // Specific UI logic for Teacher Role
    setTimeout(function () {
      if (window._ctx && window._ctx.user && window._ctx.user.role === 'teacher') {
        var typeFilter = document.getElementById('attendance-filter-type');
        if (typeFilter) {
          typeFilter.value = 'student';
          typeFilter.parentElement.style.display = 'none'; // hide the selector
        }
      }
      loadAttendanceData(); // Initial load
    }, 500);

    // Bulk selection logic
    var selectAllCb = document.getElementById('attendance-select-all');
    if (selectAllCb) {
      selectAllCb.addEventListener('change', function () {
        var isChecked = this.checked;
        document.querySelectorAll('.attendance-row-checkbox:not(:disabled)').forEach(function (cb) {
          cb.checked = isChecked;
        });
        updateBulkActionVisibility();
      });
    }

    var btnBulkPresent = document.getElementById('btn-bulk-present');
    var btnBulkAbsent = document.getElementById('btn-bulk-absent');
    if (btnBulkPresent) btnBulkPresent.addEventListener('click', function () { performBulkAction('present'); });
    if (btnBulkAbsent) btnBulkAbsent.addEventListener('click', function () { performBulkAction('absent'); });

    // Scanner logic
    var scannerInput = document.getElementById('attendance-scanner-input');
    if (scannerInput) {
      scannerInput.focus();
      // Always keep focus unless user is explicitly clicking elsewhere
      document.addEventListener('click', function (e) {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'SELECT' && e.target.tagName !== 'BUTTON') {
          scannerInput.focus();
        }
      });

      scannerInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          var code = scannerInput.value.trim();
          scannerInput.value = '';
          if (code) processScan(code);
        }
      });
    }

    // Webcam toggle logic
    var webcamBtn = document.getElementById('btn-toggle-webcam');
    var html5QrcodeScanner = null;
    if (webcamBtn) {
      webcamBtn.addEventListener('click', function () {
        var readerDiv = document.getElementById('reader');
        if (readerDiv.style.display === 'block') {
          // Turn off
          if (html5QrcodeScanner) {
            html5QrcodeScanner.clear();
            html5QrcodeScanner = null;
          }
          readerDiv.style.display = 'none';
          webcamBtn.innerHTML = '<i class="fa fa-camera"></i> Use Webcam QR';
        } else {
          // Turn on
          readerDiv.style.display = 'block';
          webcamBtn.innerHTML = '<i class="fa fa-stop"></i> Stop Webcam';
          html5QrcodeScanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false);
          html5QrcodeScanner.render(function (decodedText) {
            // On success scan
            processScan(decodedText);
            // Prevent rapid re-scanning
            html5QrcodeScanner.pause(true);
            setTimeout(function () { html5QrcodeScanner.resume(); }, 3000);
          }, function (error) {
            // ignore errors during scanning stream
          });
        }
      });
    }
  }

  function processScan(tag) {
    var dateVal = document.getElementById('attendance-filter-date').value;
    var groupVal = document.getElementById('attendance-filter-group').value;
    var subjectVal = document.getElementById('attendance-filter-subject') ? document.getElementById('attendance-filter-subject').value : '';
    var alertEl = document.getElementById('scan-result-alert');

    if (!dateVal) {
      alertEl.className = 'alert alert-danger';
      alertEl.innerHTML = 'Please select a date first.';
      alertEl.style.display = 'block';
      return;
    }

    request('/api/attendance/scan', {
      method: 'POST',
      body: JSON.stringify({ tag: tag, date: dateVal, group_id: groupVal || null, subject_name: subjectVal })
    }).then(function (res) {
      alertEl.className = 'alert alert-success';
      var name = esc(res.user.first_name + ' ' + res.user.last_name);
      alertEl.innerHTML = '<i class="fa fa-check-circle" style="font-size:24px; vertical-align:middle; margin-right:8px;"></i> ' +
        name + ' marked as PRESENT.';
      alertEl.style.display = 'block';

      // Refresh table if the user matches current filters
      loadAttendanceData();

      setTimeout(function () { alertEl.style.display = 'none'; }, 4000);
    }).catch(function (err) {
      alertEl.className = 'alert alert-danger';
      alertEl.innerHTML = '<i class="fa fa-exclamation-triangle" style="font-size:24px; vertical-align:middle; margin-right:8px;"></i> ' + err.message;
      alertEl.style.display = 'block';
      setTimeout(function () { alertEl.style.display = 'none'; }, 4000);
    });
  }

  function populateAttendanceGroups() {
    var groupSel = document.getElementById('attendance-filter-group');
    if (!groupSel) return;
    request('/api/groups').then(function (res) {
      var groups = res.data || [];
      var html = '<option value="">-- All Groups --</option>';
      html += groups.map(function (g) { return '<option value="' + g.id + '">' + esc(g.name) + '</option>'; }).join('');
      groupSel.innerHTML = html;
    }).catch(function () { });
  }

  function fetchAttendanceSubjects() {
    var groupSel = document.getElementById('attendance-filter-group');
    var dateInput = document.getElementById('attendance-filter-date');
    var typeFilter = document.getElementById('attendance-filter-type');
    var subjectContainer = document.getElementById('attendance-subject-container');
    var subjectSel = document.getElementById('attendance-filter-subject');
    if (!groupSel || !dateInput || !subjectContainer || !subjectSel || !typeFilter) return;

    var gId = groupSel.value;
    var dateVal = dateInput.value;
    var type = typeFilter.value;

    if (!dateVal || (!gId && type === 'student')) {
      subjectContainer.style.display = 'none';
      subjectSel.innerHTML = '<option value="">-- Optional / Generic --</option>';
      loadAttendanceData();
      return;
    }

    var qs = '?date=' + dateVal;
    if (gId) qs += '&group_id=' + gId;

    request('/api/attendance/subjects' + qs).then(function (res) {
      var subjects = res.subjects || [];
      var html = '<option value="">-- Optional / Generic --</option>';
      html += subjects.map(function (s) { return '<option value="' + esc(s) + '">' + esc(s) + '</option>'; }).join('');
      subjectSel.innerHTML = html;
      subjectContainer.style.display = 'block';
      loadAttendanceData();
    }).catch(function () {
      subjectContainer.style.display = 'none';
      subjectSel.innerHTML = '<option value="">-- Optional / Generic --</option>';
      loadAttendanceData();
    });
  }

  function bindAttendanceFilters() {
    ['attendance-filter-date', 'attendance-filter-type', 'attendance-filter-group', 'attendance-filter-subject'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('change', function () {
        if (id === 'attendance-filter-type') {
          var groupContainer = document.getElementById('attendance-group-container');
          if (el.value === 'teacher') {
            groupContainer.style.display = 'none';
            document.getElementById('attendance-filter-group').value = '';
          } else {
            groupContainer.style.display = 'block';
          }
        }

        if (id === 'attendance-filter-date' || id === 'attendance-filter-group' || id === 'attendance-filter-type') {
          fetchAttendanceSubjects();
        } else {
          loadAttendanceData();
        }
      });
    });
  }

  function loadAttendanceData() {
    var tbody = document.querySelector('#backend-attendance-table tbody');
    if (!tbody) return;

    var date = document.getElementById('attendance-filter-date').value;
    var type = document.getElementById('attendance-filter-type').value;
    var groupId = document.getElementById('attendance-filter-group').value;
    var subject = document.getElementById('attendance-filter-subject') ? document.getElementById('attendance-filter-subject').value : '';

    if (!date) return;

    tbody.innerHTML = '<tr><td colspan="6" class="text-center">Loading...</td></tr>';

    var params = new URLSearchParams({ date: date, type: type });
    if (groupId) params.append('group_id', groupId);
    if (subject) params.append('subject_name', subject);

    request('/api/attendance?' + params.toString()).then(function (res) {
      var items = type === 'student' ? res.students : res.teachers;
      if (!items || !items.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No records found</td></tr>';
        updateBulkActionVisibility();
        return;
      }

      var todayStr = new Date().toISOString().split('T')[0];
      var isLocked = res.is_validated || date !== todayStr;

      var btnValidate = document.getElementById('btn-validate-attendance');
      if (btnValidate) {
        var isAdmin = window._ctx && window._ctx.user && (window._ctx.user.role === 'admin' || window._ctx.user.role === 'super_admin');
        if (isAdmin && type === 'student' && groupId && !res.is_validated) {
          btnValidate.style.display = 'block';
          btnValidate.disabled = false;
        } else {
          btnValidate.style.display = 'none';
        }
      }

      var statusAlert = document.getElementById('attendance-status');
      if (res.is_validated) {
        statusAlert.className = 'alert alert-info';
        statusAlert.innerHTML = '<i class="fa fa-lock"></i> This attendance record has been validated by an admin and cannot be changed.';
        statusAlert.style.display = 'block';
      } else if (date !== todayStr) {
        statusAlert.className = 'alert alert-warning';
        statusAlert.innerHTML = '<i class="fa fa-info-circle"></i> You are viewing a past record. Edits are disabled.';
        statusAlert.style.display = 'block';
      } else {
        statusAlert.style.display = 'none';
      }

      tbody.innerHTML = items.map(function (r) {
        var name = esc([r.first_name, r.last_name].filter(Boolean).join(' '));
        var idNumber = esc(type === 'student' ? r.registration_number : r.employee_number);
        var tag = esc(r.rfid_tag || '-');
        var scanTime = esc(r.scan_time || '-');
        var img = '<img src="' + esc(avatarUrl(r.photo, name, type, r.gender)) + '" style="width:36px;height:36px;border-radius:50%;object-fit:cover">';

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

      // Reset select all
      var selectAllCb = document.getElementById('attendance-select-all');
      if (selectAllCb) {
        selectAllCb.checked = false;
        selectAllCb.disabled = isLocked;
      }

      // Bind toggle clicks
      if (!isLocked) {
        tbody.querySelectorAll('.status-toggle').forEach(function (btn) {
          btn.addEventListener('click', function () {
            toggleAttendanceStatus(this, date, groupId);
          });
        });

        tbody.querySelectorAll('.attendance-row-checkbox').forEach(function (cb) {
          cb.addEventListener('change', updateBulkActionVisibility);
        });
      }

      updateBulkActionVisibility();

    }).catch(function (err) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Error: ' + esc(err.message) + '</td></tr>';
    });
  }

  function toggleAttendanceStatus(btn, date, groupId) {
    var userType = btn.getAttribute('data-user-type');
    var userId = btn.getAttribute('data-user-id');
    var currentStatus = btn.getAttribute('data-current-status');
    var newStatus = currentStatus === 'present' ? 'absent' : 'present';
    var subject = document.getElementById('attendance-filter-subject') ? document.getElementById('attendance-filter-subject').value : '';

    btn.disabled = true;

    request('/api/attendance/manual', {
      method: 'POST',
      body: JSON.stringify({
        user_type: userType,
        user_id: userId,
        group_id: groupId || null,
        date: date,
        status: newStatus,
        subject_name: subject
      })
    }).then(function () {
      btn.disabled = false;
      btn.setAttribute('data-current-status', newStatus);
      if (newStatus === 'present') {
        btn.className = 'status-toggle status-present';
        btn.innerHTML = '<i class="fa fa-check"></i> Present';
      } else {
        btn.className = 'status-toggle status-absent';
        btn.innerHTML = '<i class="fa fa-times"></i> Absent';
      }
    }).catch(function (err) {
      btn.disabled = false;
      alert('Failed to update attendance: ' + err.message);
    });
  }

  function updateBulkActionVisibility() {
    var container = document.getElementById('attendance-bulk-actions');
    var counter = document.getElementById('bulk-selection-count');
    if (!container) return;

    var checked = document.querySelectorAll('.attendance-row-checkbox:checked').length;
    if (checked > 0) {
      container.style.display = 'block';
      counter.textContent = checked + ' selected';
    } else {
      container.style.display = 'none';
    }
  }

  function performBulkAction(status) {
    var dateVal = document.getElementById('attendance-filter-date').value;
    var groupVal = document.getElementById('attendance-filter-group').value;
    var typeVal = document.getElementById('attendance-filter-type').value;
    var subjectVal = document.getElementById('attendance-filter-subject') ? document.getElementById('attendance-filter-subject').value : '';

    var checkedBoxes = document.querySelectorAll('.attendance-row-checkbox:checked');
    var userIds = Array.from(checkedBoxes).map(function (cb) { return cb.value; });

    if (userIds.length === 0) return;
    if (!confirm('Mark ' + userIds.length + ' users as ' + status.toUpperCase() + '?')) return;

    request('/api/attendance/bulk', {
      method: 'POST',
      body: JSON.stringify({
        user_type: typeVal,
        user_ids: userIds,
        group_id: groupVal || null,
        date: dateVal,
        status: status,
        subject_name: subjectVal
      })
    }).then(function () {
      loadAttendanceData();
    }).catch(function (err) {
      alert('Bulk update failed: ' + err.message);
    });
  }

  function initSchoolCards() {
    var table = document.querySelector('#backend-students-table') || document.querySelector('#backend-teachers-table');
    var btnCards = document.getElementById('btn-generate-cards');
    if (!table || !btnCards) return;

    var selectAll = table.querySelector('.select-all');

    function updateBtn() {
      var checked = table.querySelectorAll('.row-checkbox:checked');
      if (checked.length > 0) {
        btnCards.style.display = 'inline-block';
        btnCards.innerHTML = '<i class="fa fa-id-card"></i> \u0625\u0646\u0634\u0627\u0621 ' + checked.length + ' \u0628\u0637\u0627\u0642\u0629';
      } else {
        btnCards.style.display = 'none';
      }
    }

    table.addEventListener('change', function (e) {
      if (e.target.classList.contains('select-all')) {
        var isChecked = e.target.checked;
        table.querySelectorAll('.row-checkbox').forEach(function (cb) { cb.checked = isChecked; });
      }
      updateBtn();
    });

    btnCards.addEventListener('click', async function () {
      var checked = table.querySelectorAll('.row-checkbox:checked');
      if (checked.length === 0) return;

      btnCards.disabled = true;
      var originalHtml = btnCards.innerHTML;
      btnCards.innerHTML = '<i class="fa fa-spinner fa-spin"></i> \u062c\u0627\u0631\u064a \u0627\u0644\u0625\u0646\u0634\u0627\u0621...';

      try {
        // --- Pre-load Cairo Arabic font explicitly ---
        // This guarantees Arabic letters render as connected glyphs in html2canvas
        try {
          // Wait for all fonts (including Cairo loaded via <link>) to be ready
          await document.fonts.ready;
          // Check if Cairo is loaded; if not, force-load it
          var cairoLoaded = false;
          document.fonts.forEach(function (f) {
            if (f.family.indexOf('Cairo') !== -1 && f.status === 'loaded') cairoLoaded = true;
          });
          if (!cairoLoaded) {
            // Force load by using check() which triggers loading
            await document.fonts.load('700 16px Cairo');
            await document.fonts.load('400 16px Cairo');
            await document.fonts.ready;
          }
        } catch (fontErr) {
          await new Promise(function (r) { setTimeout(r, 500); });
        }

        // --- Fetch real school name & logo ---
        var schoolName = '\u0645\u062f\u0631\u0633\u062a\u064a';
        var schoolLogo = '';
        try {
          var schoolData = await request('/api/school-setup/settings');
          if (schoolData && schoolData.school) {
            schoolName = schoolData.school.name || schoolName;
            schoolLogo = schoolData.school.logo || '';
          }
        } catch (e) { /* use defaults */ }

        var zip = new JSZip();
        var jspdfObj = window.jspdf.jsPDF;

        var templateContainer = document.getElementById('school-card-template-container');
        var template = document.getElementById('school-card-template');

        // Bring template into rendering zone (off-screen but rendered)
        templateContainer.style.position = 'fixed';
        templateContainer.style.left = '-2000px';
        templateContainer.style.top = '0';
        templateContainer.style.zIndex = '1';
        templateContainer.style.opacity = '1';

        // Force a text render to "warm up" the Arabic shaper
        var warmupEl = document.getElementById('card-student-name');
        warmupEl.textContent = 'الاختبار';
        void template.offsetHeight; // force layout reflow
        await new Promise(function (r) { setTimeout(r, 80); });


        for (var i = 0; i < checked.length; i++) {
          var cb = checked[i];
          var studentName = cb.getAttribute('data-name') || cb.closest('tr').cells[3].innerText;
          var reg = cb.getAttribute('data-reg') || cb.closest('tr').cells[2].innerText;
          var formation = cb.getAttribute('data-formation') || cb.getAttribute('data-speciality') || '';
          var photoSrc = cb.getAttribute('data-photo') || '';

          // --- Populate card ---
          document.getElementById('card-school-name').textContent = schoolName;
          document.getElementById('card-student-name').textContent = studentName;
          document.getElementById('card-student-formation').textContent = formation
            ? '\u0627\u0644\u062f\u0648\u0631\u0629: ' + formation
            : '\u0637\u0627\u0644\u0628';

          // --- Generate QR code for registration number ---
          var qrContainer = document.getElementById('card-qr-code');
          qrContainer.innerHTML = ''; // clear previous
          new QRCode(qrContainer, {
            text: String(reg),
            width: 88,
            height: 88,
            colorDark: '#0d1f3c',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.M
          });
          document.getElementById('card-qr-reg').textContent = reg;

          var year = new Date().getFullYear();
          document.getElementById('card-year').textContent = year + '/' + (year + 1);

          var logoEl = document.getElementById('card-school-logo');
          logoEl.crossOrigin = 'anonymous';
          logoEl.src = schoolLogo ? schoolLogo : schoolImg('', schoolName);

          var photoEl = document.getElementById('card-student-photo');
          photoEl.crossOrigin = 'anonymous';
          photoEl.src = photoSrc;

          // Wait for images to load
          await new Promise(function (resolve) {
            var pending = 2;
            function done() { if (--pending <= 0) resolve(); }
            if (logoEl.complete) done(); else { logoEl.onload = done; logoEl.onerror = done; }
            if (photoEl.complete) done(); else { photoEl.onload = done; photoEl.onerror = done; }
          });

          await new Promise(function (r) { setTimeout(r, 300); });

          // Scale 3x for print-quality output
          var canvas = await html2canvas(template, {
            scale: 3,
            useCORS: true,
            allowTaint: false,
            logging: false
          });

          var imgData = canvas.toDataURL('image/jpeg', 0.98);

          // Output at exact business card dimensions: 85mm x 54mm (landscape)
          var pdf = new jspdfObj({
            orientation: 'landscape',
            unit: 'mm',
            format: [85, 54]
          });
          pdf.addImage(imgData, 'JPEG', 0, 0, 85, 54);
          var pdfBlob = pdf.output('blob');

          var safeName = studentName.replace(/[^\u0600-\u06FFa-z0-9]/gi, '_');
          zip.file('\u0628\u0637\u0627\u0642\u0629_' + safeName + '_' + reg + '.pdf', pdfBlob);
        }

        // Hide template again
        templateContainer.style.position = 'absolute';
        templateContainer.style.left = '-9999px';

        var zipBlob = await zip.generateAsync({ type: 'blob' });
        saveAs(zipBlob, '\u0628\u0637\u0627\u0642\u0627\u062a_\u0627\u0644\u0645\u062f\u0631\u0633\u0629.zip');

      } catch (err) {
        alert('\u0641\u0634\u0644 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0628\u0637\u0627\u0642\u0627\u062a: ' + err.message);
        console.error(err);
      } finally {
        btnCards.disabled = false;
        btnCards.innerHTML = originalHtml;
        table.querySelectorAll('.row-checkbox').forEach(function (cb) { cb.checked = false; });
        if (selectAll) selectAll.checked = false;
        updateBtn();
      }
    });
  }

  document.addEventListener('DOMContentLoaded', initWeeklyProgram);
  document.addEventListener('DOMContentLoaded', initAttendance);
  document.addEventListener('DOMContentLoaded', initSchoolCards);

  function loadNotifications() {
    request('/api/student-registrations/payments?payment_due=overdue')
      .then(function (res) {
        var notifBadge = document.getElementById('notif-badge');
        var notifList = document.getElementById('notif-list');
        var notifCountText = document.getElementById('notif-count-text');

        var overdueStudents = res.students || [];

        if (overdueStudents.length > 0) {
          if (notifBadge) {
            notifBadge.style.display = 'inline-block';
            notifBadge.textContent = overdueStudents.length > 9 ? '9+' : overdueStudents.length;
          }
          if (notifCountText) {
            notifCountText.style.display = 'inline-block';
            notifCountText.textContent = overdueStudents.length;
          }
          if (notifList) {
            var html = overdueStudents.map(function (s) {
              var name = [s.first_name, s.last_name].filter(Boolean).join(' ');
              return '<a href="course-payment.html" style="display:block; padding: 12px 15px; border-bottom: 1px solid #f5f5f5; text-decoration: none;">' +
                '<div style="font-size: 13px; color: #333; font-weight: 600;">' + esc(name) + '</div>' +
                '<div style="font-size: 11px; color: #e74c3c; margin-top: 4px;">Payment overdue since ' + esc(s.next_payment_date) + '</div>' +
                '</a>';
            }).join('');
            notifList.innerHTML = html;
          }
        } else {
          if (notifBadge) notifBadge.style.display = 'none';
          if (notifCountText) notifCountText.style.display = 'none';
          if (notifList) notifList.innerHTML = '<div style="padding: 20px; text-align: center; color: #999; font-size: 13px;">No notifications</div>';
        }
      })
      .catch(function (err) {
        console.error('Error loading notifications:', err);
      });
  }

  window.SchoolBackend = window.SchoolBackend || {};
  window.SchoolBackend.afterPartialLoad = function (name) {
    if (name === 'header') {
      populateAuthUI();
      loadNotifications();
    }
  };

})();