(function () {
  'use strict';

  var TOKEN_KEY = 'school_system_token';
  var LANG_KEY  = 'school_system_lang';
  var currentLang = localStorage.getItem(LANG_KEY) || 'en';

  // ── i18n ────────────────────────────────────────────────────────────────────
  var AR = {
    'Home':'الرئيسية','Dashboard':'لوحة التحكم','Teachers':'الأساتذة',
    'All Teachers':'جميع الأساتذة','Add Teacher':'إضافة أستاذ',
    'Students':'الطلاب','All Students':'جميع الطلاب','Add Student':'إضافة طالب',
    'Formations':'الدورات','All Formations':'جميع الدورات','Add Formation':'إضافة دورة',
    'Classrooms':'الفصول','Groups':'المجموعات','School Settings':'إعدادات المدرسة',
    'Notifications':'الإشعارات','Log Out':'تسجيل الخروج',
    'Certificate':'الشهادة','Generate Certificate':'إصدار شهادة',
    'Generate':'إصدار','Print / Download':'طباعة / تحميل',
    'No records found':'لا توجد سجلات','Loading...':'جاري التحميل...',
    'Backend connected':'الخادم متصل','Backend offline':'الخادم غير متصل',
    'Student created successfully':'تم إنشاء الطالب بنجاح',
    'Teacher created successfully':'تم إنشاء الأستاذ بنجاح',
    'Formation created successfully':'تم إنشاء الدورة بنجاح',
    'Group created successfully':'تم إنشاء المجموعة بنجاح',
    'Passwords do not match':'كلمات المرور غير متطابقة',
  };
  function t(s) { return currentLang === 'ar' ? (AR[s] || s) : s; }
  function applyTranslations(root) {
    if (currentLang !== 'ar' || !root) return;
    root.querySelectorAll('[data-i18n]').forEach(function(el){
      var k = el.getAttribute('data-i18n'), v = AR[k];
      if (v) el.textContent = v;
    });
  }
  if (currentLang === 'ar') {
    var l = document.createElement('link');
    l.rel='stylesheet'; l.href='css/bootstrap-rtl.min.css';
    document.head.appendChild(l);
    document.documentElement.dir='rtl'; document.documentElement.lang='ar';
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
  
  function avatarUrl(photo, name, type) {
    if (photo && photo.trim() && photo.indexOf('/img/avatar-') === -1) return photo.trim();
    var bg = type === 'student' ? 'f7971e' : (type === 'teacher' ? '11998e' : '4f6eff');
    var letter = type === 'student' ? 'S' : (type === 'teacher' ? 'T' : 'U');
    return 'https://ui-avatars.com/api/?name=' + letter + '&background=' + bg + '&color=fff&size=150';
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
    return fetch(base() + path, opts).then(function(res) {
      if (!res.ok) return res.json().catch(function(){ return { message: 'Request failed' }; })
        .then(function(p){ throw new Error(p.message || 'Request failed'); });
      if (res.status === 204) return null;
      return res.json();
    });
  }

  function esc(v) {
    return String(v==null?'':v)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
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
  function setText(sel, val) { var e=document.querySelector(sel); if(e) e.textContent=val; }
  function redirect(url) { window.location.href = url; }
  function urlParam(name) {
    var m = new RegExp('[?&]'+name+'=([^&]*)').exec(window.location.search);
    return m ? decodeURIComponent(m[1].replace(/\+/g,' ')) : null;
  }
  function getPage() { return (document.body&&document.body.getAttribute('data-page'))||''; }
  function isAuthPage() { var p=getPage(); return p==='login'||p==='register'||p==='setup-school'; }
  function showAlert(sel, msg, type) {
    var el=document.querySelector(sel); if(!el) return;
    el.className='alert alert-'+(type||'danger');
    el.textContent=msg; el.style.display='block';
    el.scrollIntoView({behavior:'smooth',block:'nearest'});
  }

  // ── Language switcher ────────────────────────────────────────────────────────
  function initLanguageSwitcher() {
    var label = document.getElementById('lang-current-label');
    if (label) label.textContent = currentLang==='ar' ? 'عر' : 'EN';
    document.addEventListener('click', function(e) {
      var btn = e.target.closest('.lang-switch-btn');
      if (!btn) return;
      e.preventDefault();
      var lang = btn.getAttribute('data-lang');
      if (lang !== currentLang) { localStorage.setItem(LANG_KEY, lang); window.location.reload(); }
    });
  }

  // ── Auth ─────────────────────────────────────────────────────────────────────
  function ensureAuth() {
    if (isAuthPage()) {
      if (getToken()) request('/api/auth/me').then(function(ctx){
        if(ctx.needsSchoolSetup && getPage()!=='setup-school') redirect('setup-school.html');
        else if(!ctx.needsSchoolSetup) redirect('index.html');
      }).catch(function(){ clearToken(); });
      return;
    }
    if (!getToken()) { redirect('login.html'); return; }
    request('/api/auth/me').then(function(ctx){
      if(ctx.needsSchoolSetup){ redirect('setup-school.html'); return; }
      window._ctx = ctx;
      populateAuthUI();
    }).catch(function(){ clearToken(); redirect('login.html'); });
  }

  function populateAuthUI() {
    var ctx = window._ctx;
    if(!ctx) return;
    
    var name=[ctx.user.first_name,ctx.user.last_name].filter(Boolean).join(' ');
    setText('#backend-user-name', name);
    setText('#backend-school-name', ctx.school?ctx.school.name:'');
    setText('#backend-school-name-footer', ctx.school?ctx.school.name:'');
    
    var schoolLogo = document.getElementById('sb-school-logo');
    if (schoolLogo && ctx.school) {
      schoolLogo.src = schoolImg(ctx.school.logo, ctx.school.name);
    }
    
    var userAvatar = document.getElementById('header-user-avatar');
    if (userAvatar) {
      userAvatar.src = avatarUrl(ctx.user.photo, name, 'default');
    }
    
    if(ctx.school) window._schoolId = ctx.school.id;
    bindLogout();
  }

  function bindLogout() {
    document.querySelectorAll('[data-backend-logout]').forEach(function(btn){
      if(btn._lb) return; btn._lb=true;
      btn.addEventListener('click',function(e){ e.preventDefault(); clearToken(); redirect('login.html'); });
    });
  }

  window.SchoolBackend = {
    afterPartialLoad: function(name) {
      populateAuthUI();
      if (name==='header') { bindLogout(); initLanguageSwitcher(); applyTranslations(document.getElementById('header-placeholder')); }
      if (name==='sidebar') applyTranslations(document.getElementById('sidebar-placeholder'));
    }
  };

  // ── Health ───────────────────────────────────────────────────────────────────
  function loadHealth() {
    var badge=document.querySelector('#backend-health-badge'); if(!badge) return;
    request('/health').then(function(p){
      badge.className='label label-success'; badge.textContent=t('Backend connected');
      setText('#backend-health-detail', p.database);
    }).catch(function(){
      badge.className='label label-danger'; badge.textContent=t('Backend offline');
    });
  }

  // ── Dashboard ────────────────────────────────────────────────────────────────
  function loadDashboard() {
    if(!document.getElementById('backend-dashboard-shell')) return;
    request('/api/dashboard/overview').then(function(p){
      var s=p.school;
      window._schoolName=s.name;
      setText('#backend-school-name', s.name);
      setText('#backend-school-name-footer', s.name);
      setText('#backend-school-status', 'School: '+s.name);
      ['users','teachers','students','classrooms','formations','groups'].forEach(function(k){
        setText('#backend-count-'+k, p.counts[k]);
      });
    }).catch(function(err){
      setText('#backend-dashboard-status', err.message);
      if(err.message==='School setup required') redirect('setup-school.html');
    });
    request('/api/dashboard/recent-students').then(function(p){ renderRecentStudents(p.data||[]); }).catch(function(){});
    request('/api/dashboard/recent-teachers').then(function(p){ renderRecentTeachers(p.data||[]); }).catch(function(){});
    request('/api/dashboard/formations-summary').then(function(p){ renderFormationsSummary(p.data||[]); }).catch(function(){});
  }

  function renderRecentStudents(rows) {
    var tb=document.querySelector('#backend-recent-students tbody'); if(!tb) return;
    if(!rows.length){ tb.innerHTML='<tr><td colspan="5" class="text-center">'+t('No records found')+'</td></tr>'; return; }
    tb.innerHTML=rows.map(function(r){
      var name=[r.first_name,r.last_name].filter(Boolean).join(' ');
      var img='<img src="'+esc(avatarUrl(r.photo,name,'student'))+'" style="width:32px;height:32px;border-radius:50%;object-fit:cover" onerror="this.src=\''+avatarUrl('',name,'student')+'\'">';
      return '<tr><td>'+img+'</td><td>'+esc(r.registration_number)+'</td><td>'+esc(name)+'</td><td>'+esc(r.email)+'</td><td>'+esc(r.enrollment_date||'-')+'</td></tr>';
    }).join('');
  }

  function renderRecentTeachers(rows) {
    var tb=document.querySelector('#backend-recent-teachers tbody'); if(!tb) return;
    if(!rows.length){ tb.innerHTML='<tr><td colspan="5" class="text-center">'+t('No records found')+'</td></tr>'; return; }
    tb.innerHTML=rows.map(function(r){
      var name=[r.first_name,r.last_name].filter(Boolean).join(' ');
      var img='<img src="'+esc(avatarUrl(r.photo,name,'teacher'))+'" style="width:32px;height:32px;border-radius:50%;object-fit:cover">';
      return '<tr><td>'+img+'</td><td>'+esc(r.employee_number)+'</td><td>'+esc(name)+'</td><td>'+esc(r.speciality||'-')+'</td><td>'+esc(r.hire_date||'-')+'</td></tr>';
    }).join('');
  }

  function renderFormationsSummary(rows) {
    var c=document.querySelector('#backend-formations-summary'); if(!c) return;
    if(!rows.length){ c.innerHTML='<p class="text-muted col-lg-12">'+t('No records found')+'</p>'; return; }
    c.innerHTML=rows.map(function(f){
      var img=formationImg(f.image, f.title);
      return '<div class="col-lg-4 col-md-6" style="margin-bottom:15px">'+
        '<div class="white-box" style="border-left:4px solid #e67e22;padding:15px;display:flex;gap:12px;align-items:center">'+
        '<img src="'+esc(img)+'" style="width:56px;height:56px;border-radius:8px;object-fit:cover">'+
        '<div><h5 style="margin:0 0 4px">'+esc(f.title)+'</h5>'+
        '<small class="text-muted">'+esc(f.teacher_name||'No teacher')+'</small><br>'+
        '<span class="label label-success">'+f.enrolled_students+' students</span>'+
        (f.price>0?' <span class="label label-info">$'+esc(f.price)+'</span>':'')+'</div></div></div>';
    }).join('');
  }

  // ── Auth forms ───────────────────────────────────────────────────────────────
  function bindLoginForm() {
    var form=document.querySelector('#backend-login-form'); if(!form) return;
    form.addEventListener('submit',function(e){
      e.preventDefault(); var fd=new FormData(form);
      request('/api/auth/login',{method:'POST',body:JSON.stringify({email:fd.get('email'),password:fd.get('password')})})
        .then(function(r){ setToken(r.token); redirect(r.needsSchoolSetup?'setup-school.html':'index.html'); })
        .catch(function(err){ showAlert('#backend-auth-status',err.message); });
    });
  }
  function bindRegisterForm() {
    var form=document.querySelector('#backend-register-form'); if(!form) return;
    form.addEventListener('submit',function(e){
      e.preventDefault(); var fd=new FormData(form);
      if(fd.get('password')!==fd.get('confirm_password')){ showAlert('#backend-auth-status',t('Passwords do not match')); return; }
      request('/api/auth/register',{method:'POST',body:JSON.stringify({first_name:fd.get('first_name'),last_name:fd.get('last_name'),email:fd.get('email'),password:fd.get('password')})})
        .then(function(r){ setToken(r.token); redirect(r.needsSchoolSetup?'setup-school.html':'index.html'); })
        .catch(function(err){ showAlert('#backend-auth-status',err.message); });
    });
  }
  function loadSchoolSettings() {
    var form=document.querySelector('#backend-setup-school-form'); if(!form) return;
    request('/api/school-setup/settings').then(function(p){
      if(!p.school) return; // New school setup mode
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
      var logoEl = form.querySelector('[name="logo"]'); if(logoEl) logoEl.value = s.logo || '';
      
      var fbEl = form.querySelector('[name="fb"]'); if(fbEl) fbEl.value = c.fb || '';
      var waEl = form.querySelector('[name="whatsapp"]'); if(waEl) waEl.value = c.whatsapp || '';
      var liEl = form.querySelector('[name="linkedin"]'); if(liEl) liEl.value = c.linkedin || '';
      
      var fnEl = form.querySelector('[name="admin_first_name"]'); if(fnEl) fnEl.value = u.first_name || '';
      var lnEl = form.querySelector('[name="admin_last_name"]'); if(lnEl) lnEl.value = u.last_name || '';
      var emEl = form.querySelector('[name="admin_email"]'); if(emEl) emEl.value = u.email || '';
      renderExistingAdmins(p.additional_admins || []);
    }).catch(function(err){
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
    container.innerHTML = admins.map(function(admin){
      return '<div class="additional-admin-card" data-admin-id="'+admin.id+'">' +
        '<div class="row">' +
          '<div class="col-md-3"><div class="form-group"><label>First Name</label><input type="text" class="form-control admin-first-name" value="'+esc(admin.first_name||'')+'"></div></div>' +
          '<div class="col-md-3"><div class="form-group"><label>Last Name</label><input type="text" class="form-control admin-last-name" value="'+esc(admin.last_name||'')+'"></div></div>' +
          '<div class="col-md-4"><div class="form-group"><label>Email</label><input type="email" class="form-control admin-email" value="'+esc(admin.email||'')+'"></div></div>' +
          '<div class="col-md-2"><div class="form-group"><label>Status</label><select class="form-control admin-is-active"><option value="1"'+(admin.is_active ? ' selected' : '')+'>Active</option><option value="0"'+(!admin.is_active ? ' selected' : '')+'>Inactive</option></select></div></div>' +
        '</div>' +
        '<div class="row">' +
          '<div class="col-md-6"><div class="form-group"><label>New Password</label><input type="password" class="form-control admin-password" placeholder="Leave blank to keep current"></div></div>' +
          '<div class="col-md-6 admin-card-actions">' +
            '<button type="button" class="btn admin-save-button" data-admin-id="'+admin.id+'"><i class="fa fa-save"></i> Save</button>' +
            '<button type="button" class="btn admin-delete-button" data-admin-id="'+admin.id+'"><i class="fa fa-trash"></i> Remove</button>' +
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
      addBtn.addEventListener('click', function() { addAdditionalAdminRow(); });
    }
    var container = document.getElementById('additional-admins-list');
    if (container) {
      container.addEventListener('click', function(e){
        if (!e.target.closest('.remove-additional-admin')) return;
        var row = e.target.closest('.additional-admin-row'); if (row) row.remove();
      });
    }

    var existingContainer = document.getElementById('existing-admins-list');
    if (existingContainer) {
      existingContainer.addEventListener('click', function(e){
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
      showAlert('#backend-setup-status', 'First name, last name and email are required for admin updates.');
      return;
    }
    request('/api/school-setup/settings/admin/' + encodeURIComponent(adminId), { method: 'PUT', body: JSON.stringify(payload) })
      .then(function(){
        showAlert('#backend-setup-status', 'Admin updated successfully', 'success');
        loadSchoolSettings();
      })
      .catch(function(err){ showAlert('#backend-setup-status', err.message); });
  }

  function deleteExistingAdmin(card) {
    var adminId = card.getAttribute('data-admin-id');
    if (!adminId) return;
    if (!confirm('Remove this admin from the school?')) return;
    request('/api/school-setup/settings/admin/' + encodeURIComponent(adminId), { method: 'DELETE' })
      .then(function(){
        showAlert('#backend-setup-status', 'Admin removed successfully', 'success');
        loadSchoolSettings();
      })
      .catch(function(err){ showAlert('#backend-setup-status', err.message); });
  }

  function bindSetupSchoolForm() {
    var form=document.querySelector('#backend-setup-school-form'); if(!form) return;
    form.addEventListener('submit',function(e){
      e.preventDefault(); var fd=new FormData(form);
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
      
      var btn=form.querySelector('[type=submit]'); if(btn) btn.disabled=true;
      var adminRows = form.querySelectorAll('.additional-admin-row[data-new-admin]');
      if (adminRows.length) {
        payload.additional_admins = Array.prototype.slice.call(adminRows).map(function(row){
          return {
            first_name: row.querySelector('[name="additional_admin_first_name[]"]')?.value || null,
            last_name: row.querySelector('[name="additional_admin_last_name[]"]')?.value || null,
            email: row.querySelector('[name="additional_admin_email[]"]')?.value || null,
            password: row.querySelector('[name="additional_admin_password[]"]')?.value || null,
            is_active: row.querySelector('[name="additional_admin_is_active[]"]')?.value === '1' ? 1 : 0,
          };
        }).filter(function(admin){
          return admin.first_name && admin.last_name && admin.email && admin.password;
        });
      }
      request('/api/school-setup/settings', {method:'PUT', body:JSON.stringify(payload)})
        .then(function(res){ 
          showAlert('#backend-setup-status', 'Settings saved successfully', 'success');
          if(btn) btn.disabled=false;
          // Refresh auth context
          request('/api/auth/me').then(function(ctx){
            window._ctx = ctx;
            populateAuthUI();
          }).catch(function(){});
          
          if(res.wasSetup) setTimeout(function(){ redirect('index.html'); }, 1000);
        })
        .catch(function(err){ showAlert('#backend-setup-status',err.message); if(btn) btn.disabled=false; });
    });
  }

  // ── Students ─────────────────────────────────────────────────────────────────
  function loadStudents() {
    var tbl=document.querySelector('#backend-students-table'); if(!tbl) return;
    request('/api/student-registrations').then(function(p){ renderStudentRows(p.data||[]); })
      .catch(function(err){ showAlert('#backend-students-status',err.message); });
  }
  function formatPaymentStatus(status) {
    return status === 'paid'
      ? '<span class="label label-success">Paid</span>'
      : '<span class="label label-danger">Unpaid</span>';
  }
  function renderStudentRows(rows) {
    var tbody=document.querySelector('#backend-students-table tbody'); if(!tbody) return;
    if(!rows.length){ tbody.innerHTML='<tr><td colspan="8" class="text-center">'+t('No records found')+'</td></tr>'; return; }
    tbody.innerHTML=rows.map(function(r){
      var chk='<input type="checkbox" class="row-checkbox" value="'+r.id+'" data-type="student">';
      var name=esc([r.first_name,r.last_name].filter(Boolean).join(' '));
      var img='<img src="'+esc(avatarUrl(r.photo,[r.first_name,r.last_name].join(' '),'student'))+'" style="width:36px;height:36px;border-radius:50%;object-fit:cover" onerror="this.src=\'https://ui-avatars.com/api/?name=S&background=27ae60&color=fff&size=36\'">';
      var payStatus = r.payment_status === 'paid' 
        ? '<span class="label label-success">Paid</span>' 
        : '<span class="label label-danger">Unpaid</span>';
      return '<tr><td>'+chk+'</td><td>'+img+'</td><td>'+esc(r.registration_number)+'</td><td>'+name+'</td><td>'+esc(r.email)+'</td><td>'+ (r.is_active ? '<span class="label label-success">Active</span>' : '<span class="label label-danger">Inactive</span>') +'</td><td>'+esc(r.parent_name||'-')+'</td><td>'+esc(formatGmtPlusOneDate(r.enrollment_date))+'</td><td>'+payStatus+'</td>'+ 
        '<td><a href="student-profile.html?id='+r.id+'" class="btn btn-xs btn-success" title="View Details"><i class="fa fa-eye"></i></a> '+
        '<a href="edit-student.html?id='+r.id+'" class="btn btn-xs btn-info" title="Edit"><i class="fa fa-pencil"></i></a> '+
        '<button class="btn btn-xs btn-danger" data-del-student="'+r.id+'" title="Delete"><i class="fa fa-trash"></i></button></td></tr>';
    }).join('');
    document.querySelector('#backend-students-table').addEventListener('click',function(e){
      var btn=e.target.closest('[data-del-student]'); if(!btn) return;
      if(!confirm('Delete this student?')) return;
      request('/api/student-registrations/'+btn.getAttribute('data-del-student'),{method:'DELETE'})
        .then(loadStudents).catch(function(err){ showAlert('#backend-students-status',err.message); });
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
    var tbl = document.querySelector('#backend-payments-table'); if(!tbl) return;
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
    Object.keys(filters).forEach(function(key){ if(filters[key]) params.append(key, filters[key]); });
    var url = '/api/student-registrations/payments' + (params.toString() ? '?' + params.toString() : '');

    paymentsPageLoading = true;
    request(url)
      .then(function(p){ renderPaymentRows(p.data || []); renderPaymentSummary(p.summary || {}); })
      .catch(function(err){ showAlert('#backend-payments-status', err.message); })
      .finally(function(){ paymentsPageLoading = false; });
  }

  function renderPaymentRows(rows) {
    var tbody=document.querySelector('#backend-payments-table tbody'); if(!tbody) return;
    if(!rows.length){ tbody.innerHTML='<tr><td colspan="10" class="text-center">'+t('No records found')+'</td></tr>'; return; }
    var today = formatGmtPlusOneDate(new Date());
    tbody.innerHTML=rows.map(function(r){
      var name=esc([r.first_name,r.last_name].filter(Boolean).join(' '));
      var nextPaymentDate = formatGmtPlusOneDate(r.next_payment_date);
      var enrollmentDate = formatGmtPlusOneDate(r.enrollment_date);
      var overdue = nextPaymentDate !== '-' && nextPaymentDate < today && r.payment_status !== 'paid';
      var trClass = overdue ? ' class="table-danger"' : '';
      return '<tr'+trClass+'>' +
        '<td>'+esc(r.registration_number)+'</td>' +
        '<td>'+name+'</td>' +
        '<td>'+esc(r.formation_title||'-')+'</td>' +
        '<td>'+esc(r.group_names||'-')+'</td>' +
        '<td>'+esc(r.classroom_names||'-')+'</td>' +
        '<td>'+formatPaymentStatus(r.payment_status)+'</td>' +
        '<td>'+esc(formatSubscriptionPlan(r.subscription_plan))+'</td>' +
        '<td>'+esc(nextPaymentDate)+'</td>' +
        '<td>'+esc(enrollmentDate)+'</td>' +
        '<td><a href="student-profile.html?id='+r.id+'" class="btn btn-xs btn-success" title="View"><i class="fa fa-eye"></i></a></td>' +
      '</tr>';
    }).join('');
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
    ]).then(function(res){
      var formations = res[0].data || [];
      var groups = res[1].data || [];
      var classrooms = res[2].data || [];
      var teachers = res[3].data || [];
      if (formationSel) {
        formationSel.innerHTML = '<option value="">All Formations</option>' + formations.map(function(f){ return '<option value="'+f.id+'">'+esc(f.title)+'</option>'; }).join('');
      }
      if (groupSel) {
        groupSel.innerHTML = '<option value="">All Groups</option>' + groups.map(function(g){ return '<option value="'+g.id+'">'+esc(g.name)+'</option>'; }).join('');
      }
      if (classroomSel) {
        classroomSel.innerHTML = '<option value="">All Classrooms</option>' + classrooms.map(function(c){ return '<option value="'+c.id+'">'+esc(c.name)+'</option>'; }).join('');
      }
      if (teacherSel) {
        teacherSel.innerHTML = '<option value="">All Teachers</option>' + teachers.map(function(t){ return '<option value="'+t.id+'">'+esc([t.first_name,t.last_name].filter(Boolean).join(' '))+'</option>'; }).join('');
      }
    }).catch(function(){ });
  }

  function bindPaymentFilters() {
    if (bindPaymentFilters.bound) return;
    bindPaymentFilters.bound = true;
    ['payment-filter-formation','payment-filter-group','payment-filter-classroom','payment-filter-teacher','payment-filter-subscription','payment-filter-date-start','payment-filter-date-end'].forEach(function(id){
      var sel = document.getElementById(id);
      if (sel) sel.addEventListener('change', loadPaymentsPage);
    });
  }

  function populateFormationSelect(sel) {
    if(!sel) return;
    request('/api/formations-list').then(function(p){
      var list = p.data || [];
      list = list.filter(function(f){ return f.status === 'open'; });
      sel.innerHTML='<option value="">-- Select Formation *</option>'+
        list.map(function(f){ return '<option value="'+f.id+'" data-type="'+esc(f.type)+'">'+esc(f.title)+'</option>'; }).join('');
    }).catch(function(){});
  }

  function setupSubscriptionPlanToggle(form) {
    var formationSelect = form.querySelector('#student-formation-id');
    var subPlanGroup = form.querySelector('#subscription-plan-group');
    var subPlanSelect = form.querySelector('[name="subscription_plan"]');
    if (formationSelect && subPlanGroup) {
      formationSelect.addEventListener('change', function() {
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
    if(!sel) return;
    if(!formationId) {
      sel.innerHTML='<option value="">No promo code</option>';
      return;
    }
    request('/api/promo-codes?formation_id='+encodeURIComponent(formationId)).then(function(p){
      var list = p.data || [];
      sel.innerHTML='<option value="">No promo code</option>' +
        list.filter(function(pc){ return pc.is_active !== false; }).map(function(pc){
          return '<option value="'+esc(pc.code)+'">'+esc(pc.code)+' ('+esc(pc.discount_percent)+'%)</option>';
        }).join('');
    }).catch(function(){ sel.innerHTML='<option value="">No promo code</option>'; });
  }

  function setupPromoCodeSelect(form) {
    var formationSelect = form.querySelector('#student-formation-id');
    var promoSelect = form.querySelector('#student-promo-code');
    if (!formationSelect || !promoSelect) return;
    formationSelect.addEventListener('change', function() {
      populatePromoCodeSelect(promoSelect, this.value);
    });
    populatePromoCodeSelect(promoSelect, formationSelect.value);
  }

  function bindAddStudentForm() {
    var form=document.querySelector('#backend-add-student-form'); if(!form) return;
    populateFormationSelect(form.querySelector('#student-formation-id'));
    setupSubscriptionPlanToggle(form);
    setupPromoCodeSelect(form);
    form.addEventListener('submit',function(e){
      e.preventDefault(); var fd=new FormData(form);
      var btn=form.querySelector('[type=submit]'); if(btn) btn.disabled=true;
      request('/api/student-registrations',{method:'POST',body:JSON.stringify({
        first_name:fd.get('first_name'),last_name:fd.get('last_name'),email:fd.get('email'),password:fd.get('password'),
        gender:fd.get('gender')||null,birth_date:fd.get('birth_date')||null,photo:fd.get('photo')||null,
        formation_id:fd.get('formation_id'),
        registration_number:fd.get('registration_number'),
        parent_name:fd.get('parent_name')||null,parent_phone:fd.get('parent_phone')||null,
        enrollment_date:fd.get('enrollment_date')||null,
        payment_status:fd.get('payment_status')||'not_paid',
        subscription_plan:fd.get('subscription_plan')||null,
        promo_code:fd.get('promo_code')||null,
      })}).then(function(){ showAlert('#backend-form-status',t('Student created successfully'),'success'); form.reset(); if(btn) btn.disabled=false; })
        .catch(function(err){ showAlert('#backend-form-status',err.message); if(btn) btn.disabled=false; });
    });
  }
  function bindEditStudentForm() {
    var form=document.querySelector('#backend-edit-student-form'); if(!form) return;
    var id=urlParam('id'); if(!id){ showAlert('#backend-form-status','No student ID in URL'); return; }
    var sel=form.querySelector('#student-formation-id');
    populateFormationSelect(sel);
    setupSubscriptionPlanToggle(form);
    setupPromoCodeSelect(form);
    request('/api/student-registrations/'+id).then(function(p){
      var s=p.data;
      ['first_name','last_name','email','gender','birth_date','photo','formation_id','registration_number','parent_name','parent_phone','enrollment_date','payment_status','subscription_plan'].forEach(function(f){
        var el=form.querySelector('[name="'+f+'"]'); if(el&&s[f]!=null) el.value = s[f];
      });
      var statusEl = form.querySelector('[name="is_active"]');
      if (statusEl) statusEl.value = s.is_active ? '1' : '0';
      if(s.formation_id&&sel) setTimeout(function(){ 
        sel.value=s.formation_id; 
        sel.dispatchEvent(new Event('change'));
        // Re-apply subscription plan value after toggle
        setTimeout(function(){
          var planEl = form.querySelector('[name="subscription_plan"]');
          if (planEl && s.subscription_plan) planEl.value = s.subscription_plan;
          var promoEl = form.querySelector('#student-promo-code');
          if (promoEl && s.promo_code) promoEl.value = s.promo_code;
        }, 100);
      }, 600);
      var preview=document.getElementById('student-photo-preview');
      if(preview) preview.src=avatarUrl(s.photo,[s.first_name,s.last_name].join(' '),'student');
    }).catch(function(err){ showAlert('#backend-form-status',err.message); });
    form.addEventListener('submit',function(e){
      e.preventDefault(); var fd=new FormData(form); var payload={};
      ['first_name','last_name','email','gender','birth_date','photo','formation_id','registration_number','parent_name','parent_phone','enrollment_date','payment_status','subscription_plan','promo_code'].forEach(function(f){
        var v=fd.get(f); if(v!==null) payload[f]=v||null;
      });
      var isActive = fd.get('is_active');
      if (isActive !== null) payload.is_active = isActive === '1' ? 1 : 0;
      var btn=form.querySelector('[type=submit]'); if(btn) btn.disabled=true;
      request('/api/student-registrations/'+id,{method:'PUT',body:JSON.stringify(payload)})
        .then(function(){ showAlert('#backend-form-status','Student updated successfully','success'); if(btn) btn.disabled=false; })
        .catch(function(err){ showAlert('#backend-form-status',err.message); if(btn) btn.disabled=false; });
    });
  }

  // ── Teachers ─────────────────────────────────────────────────────────────────
  function loadTeachers() {
    var tbl=document.querySelector('#backend-teachers-table'); if(!tbl) return;
    request('/api/teacher-registrations').then(function(p){ renderTeacherRows(p.data||[]); })
      .catch(function(err){ showAlert('#backend-teachers-status',err.message); });
  }
  function renderTeacherRows(rows) {
    var tbody=document.querySelector('#backend-teachers-table tbody'); if(!tbody) return;
    if(!rows.length){ tbody.innerHTML='<tr><td colspan="7" class="text-center">'+t('No records found')+'</td></tr>'; return; }
    tbody.innerHTML=rows.map(function(r){
      var chk='<input type="checkbox" class="row-checkbox" value="'+r.id+'" data-type="teacher">';
      var name=esc([r.first_name,r.last_name].filter(Boolean).join(' '));
      var img='<img src="'+esc(avatarUrl(r.photo,[r.first_name,r.last_name].join(' '),'teacher'))+'" style="width:36px;height:36px;border-radius:50%;object-fit:cover">';
      return '<tr><td>'+chk+'</td><td>'+img+'</td><td>'+esc(r.employee_number)+'</td><td>'+name+'</td><td>'+esc(r.email)+'</td><td>'+esc(r.speciality||'-')+'</td><td>'+esc(r.hire_date||'-')+'</td>'+
        '<td><a href="professor-profile.html?id='+r.id+'" class="btn btn-xs btn-success" title="View Details"><i class="fa fa-eye"></i></a> '+
        '<a href="edit-professor.html?id='+r.id+'" class="btn btn-xs btn-info" title="Edit"><i class="fa fa-pencil"></i></a> '+
        '<button class="btn btn-xs btn-danger" data-del-teacher="'+r.id+'" title="Delete"><i class="fa fa-trash"></i></button></td></tr>';
    }).join('');
    document.querySelector('#backend-teachers-table').addEventListener('click',function(e){
      var btn=e.target.closest('[data-del-teacher]'); if(!btn) return;
      if(!confirm('Delete this teacher?')) return;
      request('/api/teacher-registrations/'+btn.getAttribute('data-del-teacher'),{method:'DELETE'})
        .then(loadTeachers).catch(function(err){ showAlert('#backend-teachers-status',err.message); });
    });
  }
  function bindAddTeacherForm() {
    var form=document.querySelector('#backend-add-teacher-form'); if(!form) return;
    form.addEventListener('submit',function(e){
      e.preventDefault(); var fd=new FormData(form);
      var btn=form.querySelector('[type=submit]'); if(btn) btn.disabled=true;
      request('/api/teacher-registrations',{method:'POST',body:JSON.stringify({
        first_name:fd.get('first_name'),last_name:fd.get('last_name'),email:fd.get('email'),password:fd.get('password'),
        gender:fd.get('gender')||null,birth_date:fd.get('birth_date')||null,photo:fd.get('photo')||null,
        employee_number:fd.get('employee_number'),speciality:fd.get('speciality')||null,
        diploma:fd.get('diploma')||null,hire_date:fd.get('hire_date')||null,
      })}).then(function(){ showAlert('#backend-form-status',t('Teacher created successfully'),'success'); form.reset(); if(btn) btn.disabled=false; })
        .catch(function(err){ showAlert('#backend-form-status',err.message); if(btn) btn.disabled=false; });
    });
  }
  function bindEditTeacherForm() {
    var form=document.querySelector('#backend-edit-teacher-form'); if(!form) return;
    var id=urlParam('id'); if(!id){ showAlert('#backend-form-status','No teacher ID in URL'); return; }
    request('/api/teacher-registrations/'+id).then(function(p){
      var tc=p.data;
      ['first_name','last_name','email','gender','birth_date','photo','employee_number','speciality','diploma','hire_date'].forEach(function(f){
        var el=form.querySelector('[name="'+f+'"]'); if(el&&tc[f]!=null) el.value=tc[f];
      });
      var statusEl = form.querySelector('[name="is_active"]');
      if (statusEl) statusEl.value = tc.is_active ? '1' : '0';
      var preview=document.getElementById('teacher-photo-preview');
      if(preview) preview.src=avatarUrl(tc.photo,[tc.first_name,tc.last_name].join(' '),'teacher');
    }).catch(function(err){ showAlert('#backend-form-status',err.message); });
    form.addEventListener('submit',function(e){
      e.preventDefault(); var fd=new FormData(form); var payload={};
      ['first_name','last_name','email','gender','birth_date','photo','employee_number','speciality','diploma','hire_date'].forEach(function(f){
        var v=fd.get(f); if(v!==null) payload[f]=v||null;
      });
      var isActive = fd.get('is_active');
      if (isActive !== null) payload.is_active = isActive === '1' ? 1 : 0;
      var btn=form.querySelector('[type=submit]'); if(btn) btn.disabled=true;
      request('/api/teacher-registrations/'+id,{method:'PUT',body:JSON.stringify(payload)})
        .then(function(){ showAlert('#backend-form-status','Teacher updated successfully','success'); if(btn) btn.disabled=false; })
        .catch(function(err){ showAlert('#backend-form-status',err.message); if(btn) btn.disabled=false; });
    });
  }

  // ── Formations ───────────────────────────────────────────────────────────────
  function loadFormations() {
    var tbl=document.querySelector('#backend-formations-table'); if(!tbl) return;
    request('/api/formations').then(function(p){ renderFormationRows(p.data||[]); })
      .catch(function(err){ showAlert('#backend-formations-status',err.message); });
  }
  function renderFormationRows(rows) {
    var tbody=document.querySelector('#backend-formations-table tbody'); if(!tbody) return;
    if(!rows.length){ tbody.innerHTML='<tr><td colspan="11" class="text-center">'+t('No records found')+'</td></tr>'; return; }
    tbody.innerHTML=rows.map(function(r){
      var chk='<input type="checkbox" class="row-checkbox" value="'+r.id+'" data-type="formation">';
      var img='<img src="'+esc(formationImg(r.image,r.title))+'" style="width:40px;height:40px;border-radius:6px;object-fit:cover">';
      var typeLabel = r.type === 'subscription' ? 'Subscription' : 'Formation';
      var periodLabel = r.subscription_period === '1_month' ? 'Monthly' : (r.subscription_period === '3_months' ? '3 months' : (r.subscription_period === '1_year' ? 'Yearly' : '-'));
      var priceValue = r.type === 'subscription' ? (
        r.subscription_period === '1_month' ? r.price_monthly :
        (r.subscription_period === '3_months' ? r.price_3_months :
        (r.subscription_period === '1_year' ? r.price_1_year : r.price))
      ) : r.price;
      var statusColor = (r.status === 'open') ? '#10b981' : '#ef4444';
      var statusSelect = '<select class="form-control input-sm quick-status-change" data-id="'+r.id+'" style="padding:2px 8px; height:26px; font-size:12px; min-width:90px; color:#fff; font-weight:600; background-color:'+statusColor+'; border:none; border-radius:4px;">' +
        '<option value="open" '+(r.status==='open'?'selected':'')+' style="background:#fff; color:#333;">Open</option>' +
        '<option value="closed" '+(r.status==='closed'?'selected':'')+' style="background:#fff; color:#333;">Closed</option>' +
        '</select>';
      return '<tr><td>'+chk+'</td><td>'+img+'</td><td>'+esc(r.title)+'</td><td>'+esc(typeLabel)+'</td><td>'+statusSelect+'</td><td>'+esc(periodLabel)+'</td><td>'+esc(r.teacher_name||'-')+'</td><td>'+esc(r.classroom_name||'-')+'</td><td>'+esc(r.start_date||'-')+'</td><td>'+esc(r.end_date||'-')+'</td><td>$'+esc(priceValue || 0)+'</td>'+
        '<td><a href="course-info.html?id='+r.id+'" class="btn btn-xs btn-success" title="View Details"><i class="fa fa-eye"></i></a> '+
        '<a href="edit-course.html?id='+r.id+'" class="btn btn-xs btn-info" title="Edit"><i class="fa fa-pencil"></i></a> '+
        '<button class="btn btn-xs btn-danger" data-del-formation="'+r.id+'" title="Delete"><i class="fa fa-trash"></i></button></td></tr>';
    }).join('');
    var table = document.querySelector('#backend-formations-table');
    table.onclick = function(e){
      var btn=e.target.closest('[data-del-formation]'); if(!btn) return;
      if(!confirm('Delete this formation?')) return;
      request('/api/formations/'+btn.getAttribute('data-del-formation'),{method:'DELETE'})
        .then(loadFormations).catch(function(err){ showAlert('#backend-formations-status',err.message); });
    };
    table.onchange = function(e){
      if(e.target.classList.contains('quick-status-change')){
        var id=e.target.getAttribute('data-id');
        var newStatus=e.target.value;
        e.target.style.backgroundColor = (newStatus === 'open') ? '#10b981' : '#ef4444';
        e.target.disabled = true;
        request('/api/formations/'+id,{method:'PUT',body:JSON.stringify({status:newStatus})})
          .then(function(){ e.target.disabled = false; })
          .catch(function(err){ showAlert('#backend-formations-status',err.message); e.target.disabled = false; loadFormations(); });
      }
    };
  }
  function populateTeacherSelect(sel) {
    if(!sel) return Promise.resolve();
    return request('/api/teacher-registrations').then(function(p){
      sel.innerHTML='<option value="">-- Select Teacher (optional) --</option>'+
        (p.data||[]).filter(function(tc){ return tc.is_active !== 0 && tc.is_active !== false; }).map(function(tc){
          return '<option value="'+tc.id+'">'+esc([tc.first_name,tc.last_name].filter(Boolean).join(' '))+'</option>';
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
    var form=document.querySelector('#backend-add-formation-form'); if(!form) return;
    populateTeacherSelect(form.querySelector('#formation-teacher-id'));
    setupFormationTypeToggle(form);
    form.addEventListener('submit',function(e){
      e.preventDefault();
      var schoolId=window._schoolId; if(!schoolId){ showAlert('#backend-form-status','School not loaded. Refresh.'); return; }
      var fd=new FormData(form); var btn=form.querySelector('[type=submit]'); if(btn) btn.disabled=true;
      request('/api/formations',{method:'POST',body:JSON.stringify({
        school_id:schoolId,teacher_id:fd.get('teacher_id')||null,title:fd.get('title'),
        description:fd.get('description')||null,image:fd.get('image')||null,
        duration_hours:fd.get('duration_hours')||null,price:fd.get('price')||0,
        price_monthly:fd.get('price_monthly')||null,price_3_months:fd.get('price_3_months')||null,price_1_year:fd.get('price_1_year')||null,
        type:fd.get('type')||'formation',subscription_period:fd.get('subscription_period')||null,status:fd.get('status')||'open',
        start_date:fd.get('start_date')||null,end_date:fd.get('end_date')||null,
      })}).then(function(){ showAlert('#backend-form-status',t('Formation created successfully'),'success'); form.reset(); if(btn) btn.disabled=false; })
        .catch(function(err){ showAlert('#backend-form-status',err.message); if(btn) btn.disabled=false; });
    });
  }
  function bindEditFormationForm() {
    var form=document.querySelector('#backend-edit-formation-form'); if(!form) return;
    var id=urlParam('id'); if(!id){ showAlert('#backend-form-status','No formation ID in URL'); return; }
    var sel=form.querySelector('#formation-teacher-id');
    setupFormationTypeToggle(form);
    populateTeacherSelect(sel);
    request('/api/formations/'+id).then(function(p){
      var f=p.data;
      ['title','description','duration_hours','price','type','status','start_date','end_date','image'].forEach(function(field){
        var el=form.querySelector('[name="'+field+'"]'); if(el&&f[field]!=null) el.value=f[field];
      });
      ['price_monthly','price_3_months','price_1_year'].forEach(function(field){
        var el=form.querySelector('[name="'+field+'"]'); if(el&&f[field]!=null) el.value=f[field];
      });
      if(f.image){ var pv=document.getElementById('formation-image-preview'); if(pv) pv.src=formationImg(f.image,f.title); }
      if(f.teacher_id&&sel) setTimeout(function(){ sel.value=f.teacher_id; }, 600);
      setTimeout(function(){
        var typeSelect = form.querySelector('select[name="type"]');
        if (typeSelect && f.type) {
          typeSelect.value = f.type;
          typeSelect.dispatchEvent(new Event('change'));
          var periodSelect = form.querySelector('select[name="subscription_period"]');
          if (periodSelect && f.subscription_period) periodSelect.value = f.subscription_period;
        }
      }, 200);
    }).catch(function(err){ showAlert('#backend-form-status',err.message); });
    form.addEventListener('submit',function(e){
      e.preventDefault(); var fd=new FormData(form); var btn=form.querySelector('[type=submit]'); if(btn) btn.disabled=true;
      request('/api/formations/'+id,{method:'PUT',body:JSON.stringify({
        teacher_id:fd.get('teacher_id')||null,title:fd.get('title'),description:fd.get('description')||null,
        image:fd.get('image')||null,duration_hours:fd.get('duration_hours')||null,
        price:fd.get('price')||0,price_monthly:fd.get('price_monthly')||null,price_3_months:fd.get('price_3_months')||null,price_1_year:fd.get('price_1_year')||null,
        type:fd.get('type')||'formation',subscription_period:fd.get('subscription_period')||null,status:fd.get('status')||'open',start_date:fd.get('start_date')||null,end_date:fd.get('end_date')||null,
      })}).then(function(){ showAlert('#backend-form-status','Formation updated successfully','success'); if(btn) btn.disabled=false; })
        .catch(function(err){ showAlert('#backend-form-status',err.message); if(btn) btn.disabled=false; });
    });
  }

  // ── Classrooms ───────────────────────────────────────────────────────────────
  function loadClassrooms() {
    var tbl=document.querySelector('#backend-classrooms-table'); if(!tbl) return;
    request('/api/classrooms').then(function(p){ renderClassroomRows(p.data||[]); })
      .catch(function(err){ showAlert('#backend-classrooms-status',err.message); });
  }
  function renderClassroomRows(rows) {
    var tbody=document.querySelector('#backend-classrooms-table tbody'); if(!tbody) return;
    if(!rows.length){ tbody.innerHTML='<tr><td colspan="5" class="text-center">'+t('No records found')+'</td></tr>'; return; }
    tbody.innerHTML=rows.map(function(r){
      return '<tr><td>'+esc(r.id)+'</td><td>'+esc(r.name)+'</td><td>'+(r.capacity||'-')+'</td><td>'+esc(r.description||'-')+'</td>'+
        '<td><button class="btn btn-xs btn-danger" data-del-classroom="'+r.id+'"><i class="fa fa-trash"></i></button></td></tr>';
    }).join('');
    var tableEl = document.querySelector('#backend-classrooms-table');
    if(tableEl) tableEl.onclick = function(e){
      var btn=e.target.closest('[data-del-classroom]'); if(!btn) return;
      if(!confirm('Delete this classroom?')) return;
      request('/api/classrooms/'+btn.getAttribute('data-del-classroom'),{method:'DELETE'})
        .then(loadClassrooms).catch(function(err){ showAlert('#backend-classrooms-status',err.message); });
    };
  }
  function bindAddClassroomForm() {
    var form=document.querySelector('#backend-add-classroom-form'); if(!form) return;
    form.addEventListener('submit',function(e){
      e.preventDefault(); var fd=new FormData(form); var btn=form.querySelector('[type=submit]'); if(btn) btn.disabled=true;
      request('/api/classrooms',{method:'POST',body:JSON.stringify({
        name:fd.get('name'),capacity:fd.get('capacity')||null,description:fd.get('description')||null,
      })}).then(function(){ showAlert('#backend-classroom-form-status','Classroom added','success'); form.reset(); loadClassrooms(); if(btn) btn.disabled=false; })
        .catch(function(err){ showAlert('#backend-classroom-form-status',err.message); if(btn) btn.disabled=false; });
    });
  }

  // ── Groups ───────────────────────────────────────────────────────────────────
  var _allStudents = [];
  var _allGroups   = [];
  var _allFormations = [];

  function loadGroupsPage() {
    if(!document.querySelector('#backend-groups-list')) return;
    // Load formations, classrooms and students for selects
    Promise.all([
      request('/api/formations-list'),
      request('/api/classrooms'),
      request('/api/students-list'),
    ]).then(function(results){
      var formations = (results[0].data||[]).filter(function(f){ return f.status === 'open'; });
      var classrooms = results[1].data||[];
      _allStudents   = (results[2].data||[]).filter(function(s){ return s.is_active !== 0 && s.is_active !== false; });
      _allFormations = formations;

      // Populate formation selects
      var fSel=document.querySelector('#group-formation-id');
      if(fSel) {
        fSel.innerHTML='<option value="">-- Select Formation *</option>'+ 
          formations.map(function(f){ return '<option value="'+f.id+'">'+esc(f.title)+'</option>'; }).join('');
        fSel.addEventListener('change', function() { updateGroupTeacherSelection(this.form || document.querySelector('#backend-add-group-form')); });
      }
      var groupTeacherSel = document.querySelector('#group-teacher-id');
      if(groupTeacherSel) {
        populateTeacherSelect(groupTeacherSel).then(function(){
          if(groupTeacherSel.form && groupTeacherSel.form.id === 'backend-add-group-form') {
            groupTeacherSel.form.querySelector('#group-teacher-note').textContent = 'Select a teacher for this group. If the formation already has a teacher, it will be auto-selected.';
            updateGroupTeacherSelection(groupTeacherSel.form);
          }
        });
      }
      var fFilter=document.querySelector('#filter-formation');
      if(fFilter){ fFilter.innerHTML='<option value="">All Formations</option>'+
        formations.map(function(f){ return '<option value="'+f.id+'">'+esc(f.title)+'</option>'; }).join(''); }

      // Populate classroom select
      var cSel=document.querySelector('#group-classroom-id');
      if(cSel) cSel.innerHTML='<option value="">No classroom</option>'+
        classrooms.map(function(c){ return '<option value="'+c.id+'">'+esc(c.name)+(c.capacity?' (cap:'+c.capacity+')':'')+'</option>'; }).join('');

      // Render student list for multi-select
      renderStudentSelectList('#student-select-list-create', _allStudents);
      bindStudentSearch('#student-search-create', '#student-select-list-create');

      // Load groups
      loadGroups();
    }).catch(function(err){ showAlert('#backend-groups-status',err.message); });

    // Filter change
    var fFilter=document.querySelector('#filter-formation');
    if(fFilter) fFilter.addEventListener('change',function(){ renderGroupCards(_allGroups, this.value); });
  }

  function renderStudentSelectList(containerSel, students) {
    var c=document.querySelector(containerSel); if(!c) return;
    if(!students.length){ c.innerHTML='<p class="text-muted" style="margin:8px">No students found</p>'; return; }
    c.innerHTML=students.map(function(s){
      var name=[s.first_name,s.last_name].filter(Boolean).join(' ');
      var img=avatarUrl(s.photo, name,'student');
      return '<label><input type="checkbox" name="student_ids" value="'+s.id+'"> '+
        '<img src="'+esc(img)+'" onerror="this.src=\'https://ui-avatars.com/api/?name=S&background=27ae60&color=fff&size=30\'"> '+
        '<span>'+esc(name)+'</span> <small class="text-muted">'+esc(s.registration_number)+'</small></label>';
    }).join('');
  }

  function bindStudentSearch(inputSel, listSel) {
    var inp=document.querySelector(inputSel), list=document.querySelector(listSel);
    if(!inp||!list) return;
    inp.addEventListener('input',function(){
      var q=this.value.toLowerCase();
      list.querySelectorAll('label').forEach(function(lbl){
        lbl.style.display=lbl.textContent.toLowerCase().includes(q)?'':'none';
      });
    });
  }

  function loadGroups() {
    request('/api/groups').then(function(p){
      _allGroups=p.data||[];
      renderGroupCards(_allGroups, '');
    }).catch(function(err){ showAlert('#backend-groups-status',err.message); });
  }

  function renderGroupCards(groups, filterFormationId) {
    var c=document.querySelector('#backend-groups-list'); if(!c) return;
    var filtered=groups.filter(function(g){
      return !filterFormationId || String(g.formation_id)===String(filterFormationId);
    });
    if(!filtered.length){ c.innerHTML='<p class="text-muted text-center">No groups found. Create one using the form.</p>'; return; }
    c.innerHTML=filtered.map(function(g){
      var chk='<input type="checkbox" class="row-checkbox group-row-checkbox" value="'+g.id+'" data-type="group" style="transform:scale(1.3); cursor:pointer; margin:0;">';
      return '<div class="group-card" id="group-card-'+g.id+'">' +
        '<div class="row">' +
          '<div class="col-lg-8 col-sm-8 col-xs-12">' +
            '<h4 style="display:flex; align-items:center; gap:10px;">'+chk+'<span>'+esc(g.name)+'</span></h4>' +
            '<p class="meta">' +
              '<i class="fa fa-book"></i> '+esc(g.formation_title||'-')+' &nbsp;|&nbsp; '+
              '<i class="fa fa-user"></i> '+esc(g.teacher_name||'No teacher')+' &nbsp;|&nbsp; '+
              '<i class="fa fa-building"></i> '+esc(g.classroom_name||'No room')+' &nbsp;|&nbsp; '+
              '<i class="fa fa-users"></i> <span id="group-count-'+g.id+'">'+g.student_count+'</span> students' +
            '</p>' +
            '<div id="group-students-'+g.id+'"></div>' +
          '</div>' +
          '<div class="col-lg-4 col-sm-4 col-xs-12 text-right">' +
            '<a href="group-info.html?id='+g.id+'" class="btn btn-sm btn-info" title="View Details"><i class="fa fa-eye"></i></a> ' +
            '<a href="edit-group.html?id='+g.id+'" class="btn btn-sm btn-primary" title="Edit Group"><i class="fa fa-pencil"></i></a> ' +
            '<button class="btn btn-sm btn-success" onclick="toggleAddStudents('+g.id+')" title="Add Students"><i class="fa fa-user-plus"></i></button> ' +
            '<button class="btn btn-sm btn-danger" data-del-group="'+g.id+'" title="Delete Group"><i class="fa fa-trash"></i></button>' +
          '</div>' +
        '</div>' +
        '<div id="add-students-panel-'+g.id+'" class="add-panel">' +
          '<p><strong>Select students to add to this group:</strong></p>' +
          '<input type="text" class="stu-search" placeholder="Search..." oninput="filterGroupStudents(this,'+g.id+')">' +
          '<div class="stu-list" id="student-list-'+g.id+'"></div>' +
          '<button class="btn btn-primary btn-sm" style="margin-top:8px" onclick="addStudentsToGroup('+g.id+')"><i class="fa fa-save"></i> Save</button> ' +
          '<button class="btn btn-default btn-sm" style="margin-top:8px" onclick="toggleAddStudents('+g.id+')">Cancel</button>' +
        '</div>' +
      '</div>';
    }).join('');

    // Delete group
    c.addEventListener('click', function(e){
      var btn=e.target.closest('[data-del-group]'); if(!btn) return;
      if(!confirm('Delete this group and remove all students from it?')) return;
      request('/api/groups/'+btn.getAttribute('data-del-group'),{method:'DELETE'})
        .then(loadGroups).catch(function(err){ showAlert('#backend-groups-status',err.message); });
    });

    // Load students for each group
    filtered.forEach(function(g){ loadGroupStudents(g.id); });
  }

  function loadGroupStudents(groupId) {
    request('/api/groups/'+groupId+'/students').then(function(p){
      var students=p.data||[];
      var area=document.getElementById('group-students-'+groupId); if(!area) return;
      if(!students.length){ area.innerHTML='<span class="text-muted" style="font-size:12px">No students yet</span>'; }
      else {
        area.innerHTML=students.map(function(s){
          var name=[s.first_name,s.last_name].filter(Boolean).join(' ');
          var img=avatarUrl(s.photo,name,'student');
          return '<span class="student-card">'+
            '<img src="'+esc(img)+'" onerror="this.src=\'https://ui-avatars.com/api/?name=S&background=27ae60&color=fff&size=28\'"> '+
            esc(name)+
            ' <span class="rm" onclick="removeStudentFromGroup('+groupId+','+s.id+')" title="Remove">×</span>'+
            '</span>';
        }).join('');
      }
      // Populate add panel list
      var panel=document.getElementById('student-list-'+groupId); if(!panel) return;
      var assignedIds=students.map(function(s){ return s.id; });
      var available=_allStudents.filter(function(s){ return !assignedIds.includes(s.id); });
      if(!available.length){ panel.innerHTML='<p class="text-muted" style="margin:8px">All students already assigned</p>'; return; }
      panel.innerHTML=available.map(function(s){
        var name=[s.first_name,s.last_name].filter(Boolean).join(' ');
        var img=avatarUrl(s.photo,name,'student');
        return '<label><input type="checkbox" value="'+s.id+'"> <img src="'+esc(img)+'"> <span>'+esc(name)+'</span> <small class="text-muted">'+esc(s.registration_number)+'</small></label>';
      }).join('');
    });
  }

  // Exposed globally for onclick handlers in rendered HTML
  window.toggleAddStudents = function(groupId) {
    var panel=document.getElementById('add-students-panel-'+groupId); if(!panel) return;
    panel.classList.toggle('open');
    if(panel.classList.contains('open')) loadGroupStudents(groupId);
  };
  window.filterGroupStudents = function(inp, groupId) {
    var q=inp.value.toLowerCase();
    var panel=document.getElementById('student-list-'+groupId); if(!panel) return;
    panel.querySelectorAll('label').forEach(function(lbl){
      lbl.style.display=lbl.textContent.toLowerCase().includes(q)?'':'none';
    });
  };
  window.addStudentsToGroup = function(groupId) {
    var panel=document.getElementById('student-list-'+groupId); if(!panel) return;
    var checked=panel.querySelectorAll('input[type=checkbox]:checked');
    var ids=[].slice.call(checked).map(function(cb){ return parseInt(cb.value); });
    if(!ids.length){ alert('Select at least one student'); return; }
    request('/api/groups/'+groupId+'/students',{method:'POST',body:JSON.stringify({student_ids:ids})})
      .then(function(r){
        showAlert('#backend-groups-status',r.message,'success');
        loadGroupStudents(groupId);
        document.getElementById('add-students-panel-'+groupId).classList.remove('open');
      }).catch(function(err){ showAlert('#backend-groups-status',err.message); });
  };
  window.removeStudentFromGroup = function(groupId, studentId) {
    if(!confirm('Remove this student from the group?')) return;
    request('/api/groups/'+groupId+'/students/'+studentId,{method:'DELETE'})
      .then(function(){ loadGroupStudents(groupId); })
      .catch(function(err){ showAlert('#backend-groups-status',err.message); });
  };

  function updateGroupTeacherSelection(form) {
    if(!form) return;
    var fSel = form.querySelector('#group-formation-id');
    var tSel = form.querySelector('#group-teacher-id');
    var note = form.querySelector('#group-teacher-note');
    if(!fSel || !tSel) return;
    var formations = form._formations || _allFormations;
    var formation = (formations || []).find(function(f){ return String(f.id) === String(fSel.value); });
    if (formation && formation.teacher_id && !tSel.value) {
      tSel.value = formation.teacher_id;
      if (note) note.textContent = 'Teacher auto-selected from formation. You can override it if needed.';
    } else if (formation && formation.teacher_id) {
      if (note) note.textContent = 'Formation already has a teacher. You can override the selected teacher.';
    } else {
      if (note) note.textContent = 'Select a teacher for this group. If the formation already has a teacher, it will be auto-selected.';
    }
  }

  function bindAddGroupForm() {
    var form=document.querySelector('#backend-add-group-form'); if(!form) return;
    form.addEventListener('submit',function(e){
      e.preventDefault(); var fd=new FormData(form);
      var studentIds=[].slice.call(form.querySelectorAll('input[name="student_ids"]:checked')).map(function(cb){ return parseInt(cb.value); });
      var btn=form.querySelector('[type=submit]'); if(btn) btn.disabled=true;
      request('/api/groups',{method:'POST',body:JSON.stringify({
        formation_id:fd.get('formation_id'),classroom_id:fd.get('classroom_id')||null,
        teacher_id:fd.get('teacher_id')||null,
        name:fd.get('name'),start_date:fd.get('start_date')||null,end_date:fd.get('end_date')||null,
        max_students:fd.get('max_students')||null,student_ids:studentIds,
      })}).then(function(){
        showAlert('#backend-group-form-status',t('Group created successfully'),'success');
        form.reset(); loadGroups(); if(btn) btn.disabled=false;
      }).catch(function(err){ showAlert('#backend-group-form-status',err.message); if(btn) btn.disabled=false; });
    });
  }

  function bindEditGroupForm() {
    var form=document.querySelector('#backend-edit-group-form'); if(!form) return;
    var id=urlParam('id'); if(!id){ showAlert('#backend-group-form-status','No group ID in URL'); return; }
    
    Promise.all([
      request('/api/formations'),
      request('/api/classrooms'),
      request('/api/groups/'+id)
    ]).then(function(res){
      var formations = (res[0].data || []).filter(function(f){ return f.status === 'open'; });
      var classrooms = res[1].data || [];
      var group = res[2].data;
      
      var fSel=form.querySelector('#group-formation-id');
      if(fSel) {
        fSel.innerHTML='<option value="">-- Select Formation *</option>'+ 
          formations.map(function(f){ return '<option value="'+f.id+'" '+(f.id===group.formation_id?'selected':'')+'>'+esc(f.title)+'</option>'; }).join('');
        form._formations = formations;
        fSel.addEventListener('change', function() { updateGroupTeacherSelection(form); });
      }
      var cSel=form.querySelector('#group-classroom-id');
      if(cSel) cSel.innerHTML='<option value="">No classroom</option>'+
        classrooms.map(function(c){ return '<option value="'+c.id+'" '+(c.id===group.classroom_id?'selected':'')+'>'+esc(c.name)+'</option>'; }).join('');
      
      var tSel = form.querySelector('#group-teacher-id');
      if (tSel) {
        populateTeacherSelect(tSel).then(function(){
          if (group.teacher_id) tSel.value = group.teacher_id;
          updateGroupTeacherSelection(form);
        });
      }
      ['name','start_date','end_date','max_students'].forEach(function(f){
        var el=form.querySelector('[name="'+f+'"]'); if(el&&group[f]!=null) el.value=group[f];
      });
    }).catch(function(err){ showAlert('#backend-group-form-status',err.message); });

    form.addEventListener('submit',function(e){
      e.preventDefault(); var fd=new FormData(form); var payload={};
      ['formation_id','classroom_id','teacher_id','name','start_date','end_date','max_students'].forEach(function(f){
        var v=fd.get(f); if(v!==null) payload[f]=v||null;
      });
      var btn=form.querySelector('[type=submit]'); if(btn) btn.disabled=true;
      request('/api/groups/'+id,{method:'PUT',body:JSON.stringify(payload)})
        .then(function(){ showAlert('#backend-group-form-status','Group updated successfully','success'); if(btn) btn.disabled=false; })
        .catch(function(err){ showAlert('#backend-group-form-status',err.message); if(btn) btn.disabled=false; });
    });
  }
  // ── Profiles ─────────────────────────────────────────────────────────────────
  function loadStudentProfile() {
    var cont = document.querySelector('#sp-container'); if(!cont) return;
    var id = urlParam('id'); if(!id){ showAlert(cont, 'No student ID in URL'); return; }
    request('/api/student-registrations/' + id).then(function(p){
      var tc = p.data;
      document.getElementById('sp-loading').style.display = 'none';
      document.getElementById('sp-content').style.display = 'block';
      
      document.getElementById('sp-photo').src = avatarUrl(tc.photo, [tc.first_name, tc.last_name].join(' '), 'student');
      document.getElementById('sp-name').textContent = [tc.first_name, tc.last_name].filter(Boolean).join(' ');
      document.getElementById('sp-reg-num').textContent = tc.registration_number || '-';
      document.getElementById('sp-email').textContent = tc.email || '-';
      
      document.getElementById('sp-gender').textContent = tc.gender || '-';
      document.getElementById('sp-birth-date').textContent = tc.birth_date || '-';
      document.getElementById('sp-parent-name').textContent = tc.parent_name || '-';
      document.getElementById('sp-parent-phone').textContent = tc.parent_phone || '-';
      document.getElementById('sp-enrollment-date').textContent = tc.enrollment_date || '-';
      document.getElementById('sp-formation').textContent = tc.formation_title || '-';
      document.getElementById('sp-subscription-plan').textContent = formatSubscriptionPlan(tc.subscription_plan);
      document.getElementById('sp-next-payment-date').textContent = tc.next_payment_date || '-';
      document.getElementById('sp-payment-status').innerHTML = formatPaymentStatus(tc.payment_status);
      document.getElementById('sp-status').innerHTML = tc.is_active ? '<span class="label label-success">Active</span>' : '<span class="label label-danger">Inactive</span>';
    }).catch(function(err){ showAlert(cont, err.message); });
  }

  function loadTeacherProfile() {
    var cont = document.querySelector('#tp-container'); if(!cont) return;
    var id = urlParam('id'); if(!id){ showAlert(cont, 'No teacher ID in URL'); return; }
    request('/api/teacher-registrations/' + id).then(function(p){
      var tc = p.data;
      document.getElementById('tp-loading').style.display = 'none';
      document.getElementById('tp-content').style.display = 'block';
      
      document.getElementById('tp-photo').src = avatarUrl(tc.photo, [tc.first_name, tc.last_name].join(' '), 'teacher');
      document.getElementById('tp-name').textContent = [tc.first_name, tc.last_name].filter(Boolean).join(' ');
      document.getElementById('tp-emp-num').textContent = tc.employee_number || '-';
      document.getElementById('tp-email').textContent = tc.email || '-';
      
      document.getElementById('tp-speciality').textContent = tc.speciality || '-';
      document.getElementById('tp-diploma').textContent = tc.diploma || '-';
      document.getElementById('tp-hire-date').textContent = tc.hire_date || '-';
      document.getElementById('tp-gender').textContent = tc.gender || '-';
      document.getElementById('tp-birth-date').textContent = tc.birth_date || '-';
      document.getElementById('tp-status').innerHTML = tc.is_active ? '<span class="label label-success">Active</span>' : '<span class="label label-danger">Inactive</span>';
    }).catch(function(err){ showAlert(cont, err.message); });
  }

  function loadFormationProfile() {
    var cont = document.querySelector('#cp-container'); if(!cont) return;
    var id = urlParam('id'); if(!id){ showAlert(cont, 'No formation ID in URL'); return; }
    request('/api/formations/' + id).then(function(p){
      var tc = p.data;
      document.getElementById('cp-loading').style.display = 'none';
      document.getElementById('cp-content').style.display = 'block';
      
      document.getElementById('cp-image').src = formationImg(tc.image, tc.title);
      document.getElementById('cp-title').textContent = tc.title || '-';
      document.getElementById('cp-teacher').textContent = tc.teacher_name || 'No teacher assigned';
      document.getElementById('cp-classroom').textContent = tc.classroom_name || 'No classroom assigned';
      
      document.getElementById('cp-duration').textContent = tc.duration_hours ? tc.duration_hours + ' hours' : '-';
      document.getElementById('cp-price').textContent = tc.price ? tc.price + ' da' : 'Free';
      document.getElementById('cp-start-date').textContent = tc.start_date || '-';
      document.getElementById('cp-end-date').textContent = tc.end_date || '-';
      document.getElementById('cp-created').textContent = tc.created_at ? new Date(tc.created_at).toLocaleDateString() : '-';
      document.getElementById('cp-description').textContent = tc.description || 'No description provided.';
    }).catch(function(err){ showAlert(cont, err.message); });
  }

  function loadGroupProfile() {
    var cont = document.querySelector('#gp-container'); if(!cont) return;
    var id = urlParam('id'); if(!id){ showAlert(cont, 'No group ID in URL'); return; }
    request('/api/groups/' + id).then(function(p){
      var tc = p.data;
      document.getElementById('gp-loading').style.display = 'none';
      document.getElementById('gp-content').style.display = 'block';
      
      document.getElementById('gp-name').textContent = tc.name || '-';
      document.getElementById('gp-formation').textContent = tc.formation_title || 'No formation assigned';
      document.getElementById('gp-classroom').textContent = tc.classroom_name || 'No classroom assigned';
      
      document.getElementById('gp-start-date').textContent = tc.start_date || '-';
      document.getElementById('gp-end-date').textContent = tc.end_date || '-';
      document.getElementById('gp-max-students').textContent = tc.max_students || 'Unlimited';
      document.getElementById('gp-created').textContent = tc.created_at ? new Date(tc.created_at).toLocaleDateString() : '-';
      
      // Render students
      var stuList = document.getElementById('gp-students');
      if (!tc.students || !tc.students.length) {
        stuList.innerHTML = '<p class="text-muted">No students assigned to this group yet.</p>';
      } else {
        stuList.innerHTML = tc.students.map(function(s) {
          var name = [s.first_name, s.last_name].filter(Boolean).join(' ');
          var img = avatarUrl(s.photo, name, 'student');
          return '<div class="student-card" style="margin-bottom:8px; display:inline-flex; width:auto; padding-right:16px;">' +
                 '<img src="' + esc(img) + '"> ' +
                 '<span>' + esc(name) + ' (' + esc(s.registration_number) + ')</span>' +
                 '</div>';
        }).join('');
      }
    }).catch(function(err){ showAlert(cont, err.message); });
  }
  // ── Certificate ──────────────────────────────────────────────────────────────
  window.loadCertificatePage = function() {
    var formSel    = document.getElementById('cert-formation-id');
    var groupSel   = document.getElementById('cert-group-id');
    var stuSel     = document.getElementById('cert-student-id'); // hidden native select
    var stuPanel   = document.getElementById('cert-student-panel');
    var stuList    = document.getElementById('cert-student-list');
    var countBadge = document.getElementById('cert-selected-count');
    var genBtn     = document.getElementById('btn-generate-cert');
    var printBtn   = document.getElementById('btn-print-cert');
    var selectAllBtn    = document.getElementById('cert-select-all-btn');
    var deselectAllBtn  = document.getElementById('cert-deselect-all-btn');

    if(!formSel || !stuSel) return;

    var _students = [];
    var _formations = [];
    var _groups = [];
    var _groupStudents = [];
    var _selectedIds = new Set();

    // Fetch formations, students, and groups
    Promise.all([
      request('/api/formations-list').catch(function(){ return {data:[]}; }),
      request('/api/student-registrations').catch(function(){ return {data:[]}; }),
      request('/api/groups').catch(function(){ return {data:[]}; })
    ]).then(function(res) {
      _formations = res[0].data || [];
      _students   = res[1].data || [];
      _groups     = res[2].data || [];

      var groupPromises = _groups.map(function(g) {
        return request('/api/groups/'+g.id+'/students').then(function(p) {
          return { groupId: g.id, students: p.data || [] };
        }).catch(function(){ return { groupId: g.id, students: [] }; });
      });

      return Promise.all(groupPromises).then(function(groupRes) {
        _groupStudents = groupRes;

        formSel.innerHTML = '<option value="">-- Select Formation --</option>' +
          _formations.map(function(f){ return '<option value="'+f.id+'">'+esc(f.title)+'</option>'; }).join('');

        formSel.addEventListener('change', function() {
          var fId = this.value;
          _selectedIds.clear();
          if(fId) {
            groupSel.disabled = false;
            var fGroups = _groups.filter(function(g){ return String(g.formation_id) === String(fId); });
            groupSel.innerHTML = '<option value="">All Groups</option>' +
              fGroups.map(function(g){ return '<option value="'+g.id+'">'+esc(g.name)+'</option>'; }).join('');
            updateStudentsList();
          } else {
            groupSel.disabled = true;
            groupSel.innerHTML = '<option value="">Select Formation First</option>';
            if(stuPanel) stuPanel.style.display = 'none';
            genBtn.disabled = true;
            printBtn.disabled = true;
          }
        });

        groupSel.addEventListener('change', function() {
          _selectedIds.clear();
          updateStudentsList();
        });

        function updateStudentsList() {
          var fId = formSel.value;
          var gId = groupSel.value;
          if(!fId) return;

          var filteredStudents = [];
          if (gId) {
            var gMapping = _groupStudents.find(function(gm){ return String(gm.groupId) === String(gId); });
            if (gMapping) filteredStudents = gMapping.students;
          } else {
            var validGroupIds = _groups.filter(function(g){ return String(g.formation_id) === String(fId); }).map(function(g){ return String(g.id); });
            var studentsInGroups = [];
            _groupStudents.forEach(function(gm) {
              if (validGroupIds.includes(String(gm.groupId))) studentsInGroups = studentsInGroups.concat(gm.students);
            });
            var fStudents = _students.filter(function(s) { return String(s.formation_id) === String(fId); });
            var allS = fStudents.concat(studentsInGroups);
            var seen = {};
            allS.forEach(function(s) { if (!seen[s.id]) { seen[s.id] = true; filteredStudents.push(s); } });
          }
          filteredStudents = filteredStudents.map(function(s) {
            return _students.find(function(x){ return String(x.id) === String(s.id); }) || s;
          });

          // Show/hide student panel
          if(stuPanel) stuPanel.style.display = filteredStudents.length > 0 ? 'block' : 'none';
          if(selectAllBtn) selectAllBtn.disabled = filteredStudents.length === 0;

          // Render checkbox list
          if (stuList) {
            if (filteredStudents.length === 0) {
              stuList.innerHTML = '<p style="color:#aaa;text-align:center;padding:20px;font-size:13px;margin:0;">No students found</p>';
            } else {
              stuList.innerHTML = filteredStudents.map(function(s) {
                var name = [s.first_name, s.last_name].filter(Boolean).join(' ') || 'Unknown';
                var initials = name.split(' ').map(function(w){ return w[0]; }).join('').substring(0,2).toUpperCase();
                return '<div class="student-item" data-id="'+s.id+'">' +
                  '<div class="student-avatar">'+initials+'</div>' +
                  '<span class="student-name">'+esc(name)+'</span>' +
                  '<div class="student-check"><i class="fa fa-check" style="font-size:10px;display:none;"></i></div>' +
                '</div>';
              }).join('');

              // Bind click events
              stuList.querySelectorAll('.student-item').forEach(function(item) {
                item.addEventListener('click', function() {
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
          stuSel.innerHTML = filteredStudents.map(function(s) {
            var selected = _selectedIds.has(String(s.id)) ? ' selected' : '';
            var name = [s.first_name, s.last_name].filter(Boolean).join(' ');
            return '<option value="'+s.id+'"'+selected+'>'+esc(name)+'</option>';
          }).join('');
        }

        if (selectAllBtn) {
          selectAllBtn.addEventListener('click', function() {
            if (stuList) {
              stuList.querySelectorAll('.student-item').forEach(function(item) {
                var sid = item.getAttribute('data-id');
                _selectedIds.add(sid);
                item.classList.add('selected');
                var icon = item.querySelector('.student-check .fa');
                if(icon) icon.style.display = 'block';
              });
            }
            var fId = formSel.value;
            var gId = groupSel.value;
            var allS = gId ?
              (_groupStudents.find(function(gm){ return String(gm.groupId)===String(gId); }) || {students:[]}).students :
              _students.filter(function(s){ return String(s.formation_id)===String(fId); });
            allS = allS.map(function(s){ return _students.find(function(x){ return String(x.id)===String(s.id); }) || s; });
            syncNativeSelect(allS);
            checkBtnStates();
          });
        }

        if (deselectAllBtn) {
          deselectAllBtn.addEventListener('click', function() {
            _selectedIds.clear();
            if (stuList) {
              stuList.querySelectorAll('.student-item').forEach(function(item) {
                item.classList.remove('selected');
                var icon = item.querySelector('.student-check .fa');
                if(icon) icon.style.display = 'none';
              });
            }
            if (stuSel) stuSel.innerHTML = '';
            checkBtnStates();
          });
        }

        function checkBtnStates() {
          var count = _selectedIds.size;
          genBtn.disabled   = count === 0;
          printBtn.disabled = count === 0;

          if (countBadge) {
            if (count > 0) {
              countBadge.style.display = 'inline-block';
              countBadge.textContent = count + ' selected';
            } else {
              countBadge.style.display = 'none';
            }
          }
          if (deselectAllBtn) deselectAllBtn.style.display = count > 0 ? 'inline-block' : 'none';

          genBtn.innerHTML = count > 1
            ? '<i class="fa fa-eye"></i> Preview (First)'
            : '<i class="fa fa-eye"></i> Preview';
        }
      });
    }).catch(function(err){ showAlert('#backend-certificate-status', err.message); });

    function getSelectedStudents() {
      return Array.from(_selectedIds);
    }

    function getStudentById(sId) {
      var s = _students.find(function(x) { return String(x.id) === String(sId); });
      if (s) return s;
      for (var i=0; i<_groupStudents.length; i++) {
        s = _groupStudents[i].students.find(function(x) { return String(x.id) === String(sId); });
        if (s) return s;
      }
      return null;
    }

    genBtn.addEventListener('click', function() {
      var fId = formSel.value;
      var selectedIds = getSelectedStudents();
      if(!fId || selectedIds.length === 0) return;

      var formation = _formations.find(function(f) { return String(f.id) === String(fId); });
      var student = getStudentById(selectedIds[0]);
      if(!formation || !student) return;

      fillCertificate(student, formation);
      
      // Scroll to certificate preview
      setTimeout(function() {
        var preview = document.querySelector('.cert-preview-wrapper');
        if(preview) preview.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    function fillCertificate(student, formation) {
      var studentName = [student.first_name, student.last_name].filter(Boolean).join(' ');
      var today = new Date().toISOString().split('T')[0];

      document.getElementById('cert-out-student').textContent = studentName;
      document.getElementById('cert-out-formation').textContent = formation.title;
      document.getElementById('cert-out-date').textContent = today;
      
      var schoolInfo = window._ctx && window._ctx.school ? window._ctx.school : {name: 'School Name'};
      document.getElementById('cert-out-school').textContent = schoolInfo.name;
      var logoEl = document.getElementById('cert-out-logo');
      if(schoolInfo.logo) {
        logoEl.src = schoolImg(schoolInfo.logo, schoolInfo.name);
        logoEl.style.display = 'block';
      } else {
        logoEl.style.display = 'none';
      }
    }

    printBtn.addEventListener('click', function() {
      var fId = formSel.value;
      var selectedIds = getSelectedStudents();
      if(!fId || selectedIds.length === 0) return;

      var formation = _formations.find(function(f) { return String(f.id) === String(fId); });
      if(!formation) return;

      var certContainer = document.getElementById('printable-certificate');
      // Use html2canvas + jsPDF directly for reliable capture
      function captureCert(filename) {
        return new Promise(function(resolve, reject) {
          if (typeof html2canvas === 'undefined' || typeof jspdf === 'undefined') {
            return reject(new Error('PDF libraries not loaded yet. Please wait a moment and try again.'));
          }

          var origShadow = certContainer.style.boxShadow;
          certContainer.style.boxShadow = 'none';

          // Scroll element into view so html2canvas can see it
          certContainer.scrollIntoView({ block: 'start' });

          setTimeout(function() {
            html2canvas(certContainer, {
              scale: 2,
              useCORS: true,
              allowTaint: true,
              logging: false,
              backgroundColor: '#ffffff'
            }).then(function(canvas) {
              certContainer.style.boxShadow = origShadow;
              try {
                var imgData = canvas.toDataURL('image/jpeg', 1.0);
                var pdf = new jspdf.jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
                // Place image to fill full A4 landscape page (297mm x 210mm)
                pdf.addImage(imgData, 'JPEG', 0, 0, 297, 210);
                var buf = pdf.output('arraybuffer');
                resolve(buf);
              } catch(e) {
                reject(e);
              }
            }).catch(function(err) {
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
        if(!student) return;

        fillCertificate(student, formation);
        var studentName = [student.first_name, student.last_name].filter(Boolean).join(' ').trim() || 'Student';
        var fileName = studentName.replace(/[^a-z0-9]/gi, '_') + '_certificate.pdf';

        printBtn.disabled = true;
        genBtn.disabled = true;
        printBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Generating PDF...';

        captureCert(fileName).then(function(buf) {
          saveAs(new Blob([buf], {type: 'application/pdf'}), fileName);
          printBtn.disabled = false;
          genBtn.disabled = false;
          printBtn.innerHTML = '<i class="fa fa-download"></i> Download PDF / ZIP';
          showAlert('#backend-certificate-status', 'Certificate downloaded successfully!', 'success');
        }).catch(function() {
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
        showAlert('#backend-certificate-status', 'Generating '+selectedIds.length+' certificates. Please wait, this may take a moment...', 'info');

        var zip = new JSZip();
        var currentIdx = 0;

        function processNext() {
          if (currentIdx >= selectedIds.length) {
            // Done generating, now create ZIP
            printBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Zipping...';
            zip.generateAsync({type:"blob"}).then(function(content) {
              saveAs(content, "certificates_" + formation.title.replace(/[^a-z0-9]/gi, '_') + ".zip");
              printBtn.disabled = false;
              genBtn.disabled = false;
              printBtn.innerHTML = '<i class="fa fa-download"></i> Download PDF / ZIP';
              showAlert('#backend-certificate-status', 'ZIP file created successfully!', 'success');
            }).catch(function(err) {
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

          captureCert(fileName).then(function(pdfBuffer) {
            zip.file(fileName, pdfBuffer);
            currentIdx++;
            processNext();
          }).catch(function(err) {
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
  document.addEventListener('DOMContentLoaded', function() {
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
    loadStudents(); bindAddStudentForm(); bindEditStudentForm(); loadStudentProfile();
    populatePaymentFilters().then(function(){ bindPaymentFilters(); loadPaymentsPage(); });
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
    if(!document.getElementById('backend-promos-table')) return;
    var sel = document.getElementById('promo-formation-id');
    if(sel) {
      request('/api/formations-list').then(function(p){
        sel.innerHTML='<option value="">-- Select Formation *</option>'+
          (p.data||[]).map(function(f){ return '<option value="'+f.id+'">'+esc(f.title)+'</option>'; }).join('');
      }).catch(function(){});
    }

    loadPromoCodes();

    var form = document.getElementById('backend-add-promo-form');
    if(form) {
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        var fd = new FormData(form);
        var btn = form.querySelector('[type=submit]'); if(btn) btn.disabled = true;
        
        request('/api/promo-codes', {
          method: 'POST',
          body: JSON.stringify({
            formation_id: fd.get('formation_id'),
            code: fd.get('code'),
            discount_percent: parseInt(fd.get('discount_percent')),
            type: fd.get('type')
          })
        }).then(function() {
          form.reset();
          if(btn) btn.disabled = false;
          loadPromoCodes();
          showAlert('#backend-promos-status', 'Promo code generated successfully', 'success');
        }).catch(function(err) {
          if(btn) btn.disabled = false;
          showAlert('#backend-promos-status', err.message);
        });
      });
    }

    document.getElementById('backend-promos-table').addEventListener('click', function(e) {
      var delBtn = e.target.closest('[data-del-promo]');
      if (delBtn) {
        if(!confirm('Delete this promo code?')) return;
        request('/api/promo-codes/'+delBtn.getAttribute('data-del-promo'), {method:'DELETE'})
          .then(loadPromoCodes).catch(function(err){ showAlert('#backend-promos-status',err.message); });
      }
      var tglBtn = e.target.closest('[data-tgl-promo]');
      if (tglBtn) {
        var id = tglBtn.getAttribute('data-tgl-promo');
        var st = tglBtn.getAttribute('data-status') === '1' ? false : true;
        request('/api/promo-codes/'+id, {method:'PUT', body:JSON.stringify({is_active: st})})
          .then(loadPromoCodes).catch(function(err){ showAlert('#backend-promos-status',err.message); });
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

    document.addEventListener('change', function(e) {
      if (e.target.classList.contains('select-all')) {
        var isChecked = e.target.checked;
        document.querySelectorAll('.row-checkbox').forEach(function(cb) {
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
      return Array.from(document.querySelectorAll('.row-checkbox:checked')).map(function(cb) { return cb.value; });
    }
    
    function getType() {
      var checked = document.querySelector('.row-checkbox:checked');
      return checked ? checked.getAttribute('data-type') : null;
    }

    function doBulkAction(actionStr, value) {
      var ids = getIds();
      var type = getType();
      if(!ids.length) return;
      if(actionStr === 'delete') {
        if(!confirm('Are you sure you want to delete '+ids.length+' items?')) return;
      }
      
      var promises = ids.map(function(id) {
        var endpoint = '';
        if(type==='student') endpoint = '/api/student-registrations/'+id;
        else if(type==='teacher') endpoint = '/api/teacher-registrations/'+id;
        else if(type==='formation') endpoint = '/api/formations/'+id;
        else if(type==='group') endpoint = '/api/groups/'+id;
        
        if (actionStr === 'delete') {
          return request(endpoint, {method: 'DELETE'});
        } else {
          var payload = {};
          if (type === 'formation') {
            payload.status = value;
          } else {
            payload.is_active = value;
          }
          return request(endpoint, {method: 'PUT', body: JSON.stringify(payload)});
        }
      });
      
      Promise.all(promises).then(function() {
        document.querySelectorAll('.select-all').forEach(function(cb){ cb.checked = false; });
        updateQA();
        if(type==='student') loadStudents();
        else if(type==='teacher') loadTeachers();
        else if(type==='formation') loadFormations();
        else if(type==='group') loadGroups();
      }).catch(function(err){
        alert('Action partially failed: ' + err.message);
        if(type==='student') loadStudents();
        else if(type==='teacher') loadTeachers();
        else if(type==='formation') loadFormations();
        else if(type==='group') loadGroups();
      });
    }

    document.getElementById('qa-active').addEventListener('click', function() {
      doBulkAction('update', getType() === 'formation' ? 'open' : 1);
    });
    document.getElementById('qa-inactive').addEventListener('click', function() {
      doBulkAction('update', getType() === 'formation' ? 'closed' : 0);
    });
    document.getElementById('qa-delete').addEventListener('click', function() {
      doBulkAction('delete');
    });
  }
  
  document.addEventListener('DOMContentLoaded', initQuickActions);

  function loadPromoCodes() {
    var tbl = document.getElementById('backend-promos-table'); if(!tbl) return;
    request('/api/promo-codes').then(function(p) {
      var rows = p.data || [];
      var tbody = tbl.querySelector('tbody');
      if(!rows.length) { tbody.innerHTML='<tr><td colspan="6" class="text-center">No records found</td></tr>'; return; }
      
      tbody.innerHTML = rows.map(function(r) {
        var statusHtml = r.is_active ? '<span class="promo-badge active">Active</span>' : '<span class="promo-badge inactive">Inactive</span>';
        var tglIcon = r.is_active ? 'fa-ban' : 'fa-check';
        var tglClass = r.is_active ? 'btn-warning' : 'btn-success';
        var tglTitle = r.is_active ? 'Disable' : 'Enable';
        var formationLabel = esc(r.formation_title || ('#' + r.formation_id));
        var typeLabel = esc(r.type === 'single_student' ? 'Single Student' : 'Many Students');
        
        return '<tr>' +
          '<td><strong>'+esc(r.code)+'</strong></td>' +
          '<td><div style="font-weight:600">'+formationLabel+'</div><small class="text-muted">#'+esc(r.formation_id)+'</small></td>' +
          '<td><span class="promo-pill">'+esc(r.discount_percent)+'%</span></td>' +
          '<td>'+typeLabel+'</td>' +
          '<td>'+statusHtml+'</td>' +
          '<td>' +
            '<button class="btn btn-xs '+tglClass+'" data-tgl-promo="'+r.id+'" data-status="'+(r.is_active?1:0)+'" title="'+tglTitle+'"><i class="fa '+tglIcon+'"></i></button> ' +
            '<button class="btn btn-xs btn-danger" data-del-promo="'+r.id+'" title="Delete"><i class="fa fa-trash"></i></button>' +
          '</td></tr>';
      }).join('');
    }).catch(function(err){ showAlert('#backend-promos-status',err.message); });
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
    DAYS: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
    COLORS: [
      '#4f6eff','#11998e','#f7971e','#fc466b','#a18cd1',
      '#38ef7d','#4facfe','#fa709a','#667eea','#f093fb',
      '#43e97b','#fda085','#30cfd0','#a8edea','#9f7aea'
    ]
  };

  // ── Entry point ────────────────────────────────────────────────────────────
  function initWeeklyProgram() {
    if (document.body.getAttribute('data-page') !== 'weekly-program') return;

    // Load programs + groups + classrooms in parallel
    Promise.all([
      request('/api/weekly-programs').then(function(p){ WP.programs = p.data || []; }),
      request('/api/groups').then(function(p){ WP.groups = p.data || []; }),
      request('/api/classrooms').then(function(p){ WP.classrooms = p.data || []; })
    ]).then(function(){
      renderProgList();
      populateGroupDropdown();
      populateClassroomDropdown();
    }).catch(function(err){
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
    el.innerHTML = WP.programs.map(function(p){
      var badge = p.status === 'active'
        ? '<span class="badge-active">Active</span>'
        : '<span class="badge-disabled">Disabled</span>';
      var sel = (WP.current && WP.current.id === p.id) ? ' selected' : '';
      return '<div class="prog-item'+sel+'" data-prog-id="'+p.id+'">' +
        '<div class="prog-item-name">'+esc(p.name)+' '+badge+'</div>' +
        '<div class="prog-item-meta">Created: '+esc(String(p.created_at||'').split('T')[0])+'</div>' +
        '</div>';
    }).join('');

    el.querySelectorAll('.prog-item').forEach(function(item){
      item.addEventListener('click', function(){
        var id = this.getAttribute('data-prog-id');
        loadProgramDetail(id);
      });
    });
  }

  // ── Load full program detail ───────────────────────────────────────────────
  function loadProgramDetail(id) {
    request('/api/weekly-programs/'+id).then(function(p){
      WP.current = p.data;
      document.getElementById('wp-no-selection').style.display = 'none';
      document.getElementById('wp-detail').style.display = 'block';
      renderProgDetail();
      renderTimetableGrid();
      // highlight selected item
      document.querySelectorAll('.prog-item').forEach(function(it){
        it.classList.toggle('selected', it.getAttribute('data-prog-id') == id);
      });
    }).catch(function(err){
      showAlert('#wp-global-alert', 'Could not load program: '+err.message, 'danger');
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
    entries.forEach(function(e){
      var k = e.slot_id+'_'+e.day_of_week;
      if (!eMap[k]) eMap[k] = [];
      eMap[k].push(e);
    });

    var colW = Math.floor(88 / WP.DAYS.length) + '%';
    var html = '<div class="tt-wrap"><table class="tt-table"><thead><tr>' +
      '<th class="tt-th-time">Time</th>' +
      WP.DAYS.map(function(d){ return '<th>'+d+'</th>'; }).join('') +
      '<th class="no-print" style="width:64px">Actions</th>' +
      '</tr></thead><tbody>';

    slots.forEach(function(slot){
      html += '<tr><td class="tt-slot-label">' +
        '<div style="font-weight:700;font-size:12px">'+esc(slot.label)+'</div>' +
        '<div style="font-size:10px;color:#aab">'+esc(slot.start_time)+' – '+esc(slot.end_time)+'</div>' +
        '</td>';

      WP.DAYS.forEach(function(_, di){
        var day = di + 1;
        var k = slot.id+'_'+day;
        var chips = (eMap[k] || []).map(function(e){
          var bg = e.color || '#4f6eff';
          var details = [];
          if (e.classroom_name) details.push('<i class="fa fa-map-marker"></i> ' + esc(e.classroom_name));
          if (e.teacher_name) details.push('<i class="fa fa-user"></i> ' + esc(e.teacher_name));
          var detailsHtml = details.length ? '<span class="entry-chip-group" style="font-size:9.5px; opacity: 0.9; margin-top:2px;">'+details.join(' | ')+'</span>' : '';

          return '<div class="entry-chip" style="background:'+bg+'" data-entry-id="'+e.id+'">' +
            '<div class="entry-chip-body">' +
              '<span class="entry-chip-subject">'+esc(e.subject_name)+'</span>' +
              '<span class="entry-chip-group">'+esc(e.group_name)+'</span>' +
              detailsHtml +
            '</div>' +
            '<button class="entry-chip-del no-print" data-del-entry="'+e.id+'" title="Remove"><i class="fa fa-times"></i></button>' +
            '</div>';
        }).join('');

        html += '<td class="tt-cell"><div class="tt-cell-inner" data-slot="'+slot.id+'" data-day="'+day+'">' +
          chips +
          '<div class="add-hint no-print"><i class="fa fa-plus"></i></div>' +
          '</div></td>';
      });

      // Slot actions (edit/delete)
      html += '<td class="no-print" style="vertical-align:middle;padding:4px">' +
        '<div class="slot-actions">' +
          '<button data-edit-slot="'+slot.id+'" title="Edit slot"><i class="fa fa-pencil"></i></button>' +
          '<button class="del" data-del-slot="'+slot.id+'" title="Delete slot"><i class="fa fa-trash"></i></button>' +
        '</div></td>';
      html += '</tr>';
    });

    html += '</tbody></table></div>';
    wrap.innerHTML = html;

    // Bind cell clicks (open entry modal)
    wrap.querySelectorAll('.tt-cell-inner').forEach(function(cell){
      cell.addEventListener('click', function(e){
        if (e.target.closest('[data-del-entry]')) return; // handled below
        var slotId = this.getAttribute('data-slot');
        var day    = this.getAttribute('data-day');
        openEntryModal(slotId, day);
      });
    });

    // Bind delete-entry buttons
    wrap.querySelectorAll('[data-del-entry]').forEach(function(btn){
      btn.addEventListener('click', function(e){
        e.stopPropagation();
        var id = this.getAttribute('data-del-entry');
        if (!confirm('Remove this entry?')) return;
        request('/api/weekly-programs/'+WP.current.id+'/entries/'+id, {method:'DELETE'})
          .then(function(){ loadProgramDetail(WP.current.id); })
          .catch(function(err){ showAlert('#wp-global-alert', err.message, 'danger'); });
      });
    });

    // Bind slot edit buttons
    wrap.querySelectorAll('[data-edit-slot]').forEach(function(btn){
      btn.addEventListener('click', function(){
        var slotId = this.getAttribute('data-edit-slot');
        var slot = (WP.current.slots||[]).filter(function(s){ return s.id == slotId; })[0];
        if (!slot) return;
        openSlotModal(slot);
      });
    });

    // Bind slot delete buttons
    wrap.querySelectorAll('[data-del-slot]').forEach(function(btn){
      btn.addEventListener('click', function(){
        var slotId = this.getAttribute('data-del-slot');
        if (!confirm('Delete this time slot and ALL its entries?')) return;
        request('/api/weekly-programs/'+WP.current.id+'/slots/'+slotId, {method:'DELETE'})
          .then(function(){ loadProgramDetail(WP.current.id); })
          .catch(function(err){ showAlert('#wp-global-alert', err.message, 'danger'); });
      });
    });
  }

  // ── Open entry modal (add or edit) ─────────────────────────────────────────
  function openEntryModal(slotId, day) {
    var slot = (WP.current.slots||[]).filter(function(s){ return s.id == slotId; })[0];
    var dayName = WP.DAYS[parseInt(day)-1] || ('Day '+day);
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
      document.getElementById('wp-slot-form-id').value    = slot.id;
      document.getElementById('wp-slot-form-label').value = slot.label;
      document.getElementById('wp-slot-form-start').value = slot.start_time;
      document.getElementById('wp-slot-form-end').value   = slot.end_time;
      document.getElementById('wp-slot-form-order').value = slot.sort_order;
      document.getElementById('wp-slot-form-submit').textContent = 'Save Changes';
    } else {
      document.getElementById('modalSlotTitle').textContent = 'Add Time Slot';
      document.getElementById('wp-slot-form-id').value    = '';
      document.getElementById('wp-slot-form-label').value = '';
      document.getElementById('wp-slot-form-start').value = '';
      document.getElementById('wp-slot-form-end').value   = '';
      document.getElementById('wp-slot-form-order').value = (WP.current.slots||[]).length;
      document.getElementById('wp-slot-form-submit').textContent = 'Add Slot';
    }
    document.getElementById('wp-slot-form-alert').style.display = 'none';
    $('#modalSlot').modal('show');
  }

  // ── Color swatches ─────────────────────────────────────────────────────────
  function buildColorSwatches() {
    var row = document.getElementById('wp-entry-color-row');
    if (!row) return;
    WP.COLORS.forEach(function(c){
      var sw = document.createElement('div');
      sw.className = 'color-swatch';
      sw.style.background = c;
      sw.setAttribute('data-color', c);
      if (c === '#4f6eff') sw.classList.add('selected');
      sw.addEventListener('click', function(){ setEntryColor(c); });
      row.appendChild(sw);
    });
  }

  function setEntryColor(color) {
    document.getElementById('wp-entry-form-color').value = color;
    document.querySelectorAll('.color-swatch').forEach(function(sw){
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
      WP.groups.map(function(g){
        var label = esc(g.name) + (g.formation_title ? ' ('+esc(g.formation_title)+')' : '');
        return '<option value="'+g.id+'">'+label+'</option>';
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
      WP.classrooms.map(function(c){
        return '<option value="'+c.id+'">'+esc(c.name)+'</option>';
      }).join('');
  }

  // ── Auto-fill slot label from time inputs ──────────────────────────────────
  function autoActivateSlotLabel() {
    var startEl = document.getElementById('wp-slot-form-start');
    var endEl   = document.getElementById('wp-slot-form-end');
    var lblEl   = document.getElementById('wp-slot-form-label');
    if (!startEl || !endEl || !lblEl) return;
    function sync() {
      if (startEl.value && endEl.value && !lblEl.value) {
        lblEl.value = startEl.value + ' – ' + endEl.value;
      }
    }
    startEl.addEventListener('change', sync);
    endEl.addEventListener('change', function(){
      if (startEl.value && endEl.value) {
        lblEl.value = startEl.value + ' – ' + endEl.value;
      }
    });
  }

  // ── Bind toolbar buttons ───────────────────────────────────────────────────
  function bindWpButtons() {
    // Create program button
    var createBtn = document.getElementById('wp-create-btn');
    if (createBtn) createBtn.addEventListener('click', function(){
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
    if (editBtn) editBtn.addEventListener('click', function(){
      if (!WP.current) return;
      document.getElementById('modalProgramTitle').textContent = 'Edit Program';
      document.getElementById('wp-prog-form-id').value   = WP.current.id;
      document.getElementById('wp-prog-form-name').value = WP.current.name;
      document.getElementById('wp-prog-form-desc').value = WP.current.description || '';
      document.getElementById('wp-prog-form-submit').textContent = 'Save Changes';
      document.getElementById('wp-prog-form-alert').style.display = 'none';
      $('#modalProgram').modal('show');
    });

    // Activate
    var activateBtn = document.getElementById('wp-btn-activate');
    if (activateBtn) activateBtn.addEventListener('click', function(){
      if (!WP.current) return;
      if (!confirm('Activate "'+WP.current.name+'"? All other programs will be disabled.')) return;
      request('/api/weekly-programs/'+WP.current.id+'/activate', {method:'POST'})
        .then(function(){
          return Promise.all([
            request('/api/weekly-programs').then(function(p){ WP.programs = p.data||[]; }),
            loadProgramDetail(WP.current.id)
          ]);
        }).then(function(){ renderProgList(); })
        .catch(function(err){ showAlert('#wp-global-alert', err.message, 'danger'); });
    });

    // Add time slot
    var addSlotBtn = document.getElementById('wp-btn-add-slot');
    if (addSlotBtn) addSlotBtn.addEventListener('click', function(){
      if (!WP.current) return;
      openSlotModal(null);
    });

    // Delete program
    var delBtn = document.getElementById('wp-btn-delete');
    if (delBtn) delBtn.addEventListener('click', function(){
      if (!WP.current) return;
      if (!confirm('Delete program "'+WP.current.name+'" and ALL its data?')) return;
      request('/api/weekly-programs/'+WP.current.id, {method:'DELETE'})
        .then(function(){
          WP.current = null;
          return request('/api/weekly-programs').then(function(p){ WP.programs = p.data||[]; });
        }).then(function(){
          renderProgList();
          document.getElementById('wp-detail').style.display = 'none';
          document.getElementById('wp-no-selection').style.display = 'block';
          showAlert('#wp-global-alert','Program deleted.','success');
        }).catch(function(err){ showAlert('#wp-global-alert', err.message, 'danger'); });
    });

    // PDF / Print
    var pdfBtn = document.getElementById('wp-btn-pdf');
    if (pdfBtn) pdfBtn.addEventListener('click', function(){
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
      document.querySelectorAll('style').forEach(function(s) { existingCss += s.innerHTML; });

      // Get the current grid HTML, clean it up
      var gridClone = gridWrap.cloneNode(true);
      gridClone.querySelectorAll('.no-print, .add-hint, .entry-chip-del').forEach(function(el) { el.remove(); });
      var gridHtml = gridClone.outerHTML;

      var htmlContent = '<!DOCTYPE html><html><head><meta charset="utf-8">' +
        '<style>' +
          'body { margin: 0; padding: 30px; background: #fff; font-family: Inter, Arial, sans-serif; box-sizing: border-box; width: 1400px; }' +
          '.pdf-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #1a1f37; padding-bottom: 14px; margin-bottom: 24px; }' +
          '.pdf-school-name { margin:0; font-weight:800; font-size:22px; color:#1a1f37; }' +
          '.pdf-school-year { margin:4px 0 0; font-size:13px; color:#555; font-weight:600; }' +
          '.pdf-prog-name { margin:0; font-weight:800; font-size:22px; color:#4f6eff; text-align:right; }' +
          '.pdf-gen-date { margin:4px 0 0; font-size:13px; color:#555; text-align:right; }' +
          '.pdf-footer { margin-top: 30px; display: flex; justify-content: flex-end; padding-right: 30px; }' +
          '.pdf-stamp { width:110px; height:110px; border-radius:50%; border:3px solid #1a1f37; display:flex; align-items:center; justify-content:center; text-align:center; opacity:.75; }' +
          '.pdf-stamp-text { font-weight:800; font-size:13px; color:#1a1f37; line-height:1.3; }' +
          '.pdf-stamp-school { font-size:9px; font-weight:600; display:block; margin-top:3px; }' +
          existingCss +
          '.tt-table { width:100% !important; min-width:100% !important; table-layout:fixed !important; border-collapse:collapse; }' +
          '.tt-cell, .tt-header, .tt-time-cell, .tt-slot-time { word-wrap:break-word; overflow-wrap:break-word; }' +
          '.wp-card { box-shadow:none !important; border:none !important; padding:0 !important; background:transparent !important; }' +
          '.wp-card-title { display:none !important; }' +
        '</style>' +
        '</head><body>' +
        '<div class="pdf-header">' +
          '<div>' +
            '<p class="pdf-school-name">' + esc(school.name) + '</p>' +
            '<p class="pdf-school-year">Academic Year: ' + academicYear + '</p>' +
          '</div>' +
          '<div>' +
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
        margin:       8,
        filename:     'timetable-' + WP.current.name.replace(/\\s+/g, '-') + '.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, windowWidth: 1400 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'l' }
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
      grpSelect.addEventListener('change', function() {
        var gid = this.value;
        if (!gid) return;
        var group = WP.groups.filter(function(g) { return String(g.id) === String(gid); })[0];
        if (group && group.classroom_id) {
          clsSelect.value = group.classroom_id;
        } else {
          clsSelect.value = ''; // Reset if group has no default classroom
        }
      });
    }

    // Program form
    var progForm = document.getElementById('wp-prog-form');
    if (progForm) progForm.addEventListener('submit', function(e){
      e.preventDefault();
      var id   = document.getElementById('wp-prog-form-id').value;
      var name = document.getElementById('wp-prog-form-name').value.trim();
      var desc = document.getElementById('wp-prog-form-desc').value.trim();
      if (!name) { showAlert('#wp-prog-form-alert','Program name is required','danger'); return; }

      var isEdit = !!id;
      var method = isEdit ? 'PUT' : 'POST';
      var url    = isEdit ? '/api/weekly-programs/'+id : '/api/weekly-programs';
      var btn    = document.getElementById('wp-prog-form-submit');
      btn.disabled = true;

      request(url, {method: method, body: JSON.stringify({name: name, description: desc || null})})
        .then(function(){
          return request('/api/weekly-programs').then(function(p){ WP.programs = p.data||[]; });
        }).then(function(){
          btn.disabled = false;
          $('#modalProgram').modal('hide');
          renderProgList();
          if (isEdit && WP.current && WP.current.id == id) loadProgramDetail(id);
        }).catch(function(err){
          btn.disabled = false;
          showAlert('#wp-prog-form-alert', err.message, 'danger');
        });
    });

    // Slot form
    var slotForm = document.getElementById('wp-slot-form');
    if (slotForm) slotForm.addEventListener('submit', function(e){
      e.preventDefault();
      if (!WP.current) return;
      var id    = document.getElementById('wp-slot-form-id').value;
      var label = document.getElementById('wp-slot-form-label').value.trim();
      var start = document.getElementById('wp-slot-form-start').value;
      var end   = document.getElementById('wp-slot-form-end').value;
      var order = parseInt(document.getElementById('wp-slot-form-order').value) || 0;
      if (!label || !start || !end) { showAlert('#wp-slot-form-alert','All time fields are required','danger'); return; }

      var isEdit = !!id;
      var method = isEdit ? 'PUT' : 'POST';
      var url    = isEdit
        ? '/api/weekly-programs/'+WP.current.id+'/slots/'+id
        : '/api/weekly-programs/'+WP.current.id+'/slots';
      var btn = document.getElementById('wp-slot-form-submit');
      btn.disabled = true;

      request(url, {method: method, body: JSON.stringify({label:label, start_time:start, end_time:end, sort_order:order})})
        .then(function(){
          btn.disabled = false;
          $('#modalSlot').modal('hide');
          loadProgramDetail(WP.current.id);
        }).catch(function(err){
          btn.disabled = false;
          showAlert('#wp-slot-form-alert', err.message, 'danger');
        });
    });

    // Entry form
    var entryForm = document.getElementById('wp-entry-form');
    if (entryForm) entryForm.addEventListener('submit', function(e){
      e.preventDefault();
      if (!WP.current) return;
      var id       = document.getElementById('wp-entry-form-id').value;
      var slotId   = document.getElementById('wp-entry-form-slot-id').value;
      var day      = document.getElementById('wp-entry-form-day').value;
      var groupId  = document.getElementById('wp-entry-form-group').value;
      var classId  = document.getElementById('wp-entry-form-classroom').value;
      var subject  = document.getElementById('wp-entry-form-subject').value.trim();
      var color    = document.getElementById('wp-entry-form-color').value || '#4f6eff';

      if (!groupId || !subject) { showAlert('#wp-entry-form-alert','Group and subject are required','danger'); return; }

      var isEdit = !!id;
      var method = isEdit ? 'PUT' : 'POST';
      var url    = isEdit
        ? '/api/weekly-programs/'+WP.current.id+'/entries/'+id
        : '/api/weekly-programs/'+WP.current.id+'/entries';

      request(url, {method: method, body: JSON.stringify({
        slot_id: parseInt(slotId), day_of_week: parseInt(day),
        group_id: parseInt(groupId), subject_name: subject, color: color,
        classroom_id: classId ? parseInt(classId) : null
      })}).then(function(){
        $('#modalEntry').modal('hide');
        loadProgramDetail(WP.current.id);
      }).catch(function(err){ showAlert('#wp-entry-form-alert', err.message, 'danger'); });
    });
  }

  document.addEventListener('DOMContentLoaded', initWeeklyProgram);

})();