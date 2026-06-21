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
    if (photo && photo.trim()) return photo.trim();
    var lock = getStrHash(name || type || 'user');
    if (type === 'student') return 'https://loremflickr.com/150/150/student,portrait?lock=' + lock;
    if (type === 'teacher') return 'https://loremflickr.com/150/150/teacher,portrait?lock=' + lock;
    return 'https://loremflickr.com/150/150/portrait?lock=' + lock;
  }
  
  // For formation cards that may have an image URL
  function formationImg(img, title) {
    if (img && img.trim()) return img.trim();
    var lock = getStrHash(title || 'formation');
    return 'https://loremflickr.com/320/240/education,course?lock=' + lock;
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
  function bindSetupSchoolForm() {
    var form=document.querySelector('#backend-setup-school-form'); if(!form) return;
    form.addEventListener('submit',function(e){
      e.preventDefault(); var fd=new FormData(form);
      request('/api/school-setup',{method:'POST',body:JSON.stringify({name:fd.get('name'),logo:fd.get('logo')||null})})
        .then(function(){ redirect('index.html'); })
        .catch(function(err){ showAlert('#backend-setup-status',err.message); });
    });
  }

  // ── Students ─────────────────────────────────────────────────────────────────
  function loadStudents() {
    var tbl=document.querySelector('#backend-students-table'); if(!tbl) return;
    request('/api/student-registrations').then(function(p){ renderStudentRows(p.data||[]); })
      .catch(function(err){ showAlert('#backend-students-status',err.message); });
  }
  function renderStudentRows(rows) {
    var tbody=document.querySelector('#backend-students-table tbody'); if(!tbody) return;
    if(!rows.length){ tbody.innerHTML='<tr><td colspan="7" class="text-center">'+t('No records found')+'</td></tr>'; return; }
    tbody.innerHTML=rows.map(function(r){
      var name=esc([r.first_name,r.last_name].filter(Boolean).join(' '));
      var img='<img src="'+esc(avatarUrl(r.photo,[r.first_name,r.last_name].join(' '),'student'))+'" style="width:36px;height:36px;border-radius:50%;object-fit:cover" onerror="this.src=\'https://ui-avatars.com/api/?name=S&background=27ae60&color=fff&size=36\'">';
      return '<tr><td>'+img+'</td><td>'+esc(r.registration_number)+'</td><td>'+name+'</td><td>'+esc(r.email)+'</td><td>'+esc(r.parent_name||'-')+'</td><td>'+esc(r.enrollment_date||'-')+'</td>'+
        '<td><a href="edit-student.html?id='+r.id+'" class="btn btn-xs btn-info"><i class="fa fa-pencil"></i></a> '+
        '<button class="btn btn-xs btn-danger" data-del-student="'+r.id+'"><i class="fa fa-trash"></i></button></td></tr>';
    }).join('');
    document.querySelector('#backend-students-table').addEventListener('click',function(e){
      var btn=e.target.closest('[data-del-student]'); if(!btn) return;
      if(!confirm('Delete this student?')) return;
      request('/api/student-registrations/'+btn.getAttribute('data-del-student'),{method:'DELETE'})
        .then(loadStudents).catch(function(err){ showAlert('#backend-students-status',err.message); });
    });
  }
  function bindAddStudentForm() {
    var form=document.querySelector('#backend-add-student-form'); if(!form) return;
    form.addEventListener('submit',function(e){
      e.preventDefault(); var fd=new FormData(form);
      var btn=form.querySelector('[type=submit]'); if(btn) btn.disabled=true;
      request('/api/student-registrations',{method:'POST',body:JSON.stringify({
        first_name:fd.get('first_name'),last_name:fd.get('last_name'),email:fd.get('email'),password:fd.get('password'),
        gender:fd.get('gender')||null,birth_date:fd.get('birth_date')||null,photo:fd.get('photo')||null,
        registration_number:fd.get('registration_number'),
        parent_name:fd.get('parent_name')||null,parent_phone:fd.get('parent_phone')||null,
        enrollment_date:fd.get('enrollment_date')||null,
      })}).then(function(){ showAlert('#backend-form-status',t('Student created successfully'),'success'); form.reset(); if(btn) btn.disabled=false; })
        .catch(function(err){ showAlert('#backend-form-status',err.message); if(btn) btn.disabled=false; });
    });
  }
  function bindEditStudentForm() {
    var form=document.querySelector('#backend-edit-student-form'); if(!form) return;
    var id=urlParam('id'); if(!id){ showAlert('#backend-form-status','No student ID in URL'); return; }
    request('/api/student-registrations/'+id).then(function(p){
      var s=p.data;
      ['first_name','last_name','email','gender','birth_date','photo','registration_number','parent_name','parent_phone','enrollment_date'].forEach(function(f){
        var el=form.querySelector('[name="'+f+'"]'); if(el&&s[f]!=null) el.value=s[f];
      });
      var preview=document.getElementById('student-photo-preview');
      if(preview) preview.src=avatarUrl(s.photo,[s.first_name,s.last_name].join(' '),'student');
    }).catch(function(err){ showAlert('#backend-form-status',err.message); });
    form.addEventListener('submit',function(e){
      e.preventDefault(); var fd=new FormData(form); var payload={};
      ['first_name','last_name','email','gender','birth_date','photo','registration_number','parent_name','parent_phone','enrollment_date'].forEach(function(f){
        var v=fd.get(f); if(v!==null) payload[f]=v||null;
      });
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
      var name=esc([r.first_name,r.last_name].filter(Boolean).join(' '));
      var img='<img src="'+esc(avatarUrl(r.photo,[r.first_name,r.last_name].join(' '),'teacher'))+'" style="width:36px;height:36px;border-radius:50%;object-fit:cover">';
      return '<tr><td>'+img+'</td><td>'+esc(r.employee_number)+'</td><td>'+name+'</td><td>'+esc(r.email)+'</td><td>'+esc(r.speciality||'-')+'</td><td>'+esc(r.hire_date||'-')+'</td>'+
        '<td><a href="edit-professor.html?id='+r.id+'" class="btn btn-xs btn-info"><i class="fa fa-pencil"></i></a> '+
        '<button class="btn btn-xs btn-danger" data-del-teacher="'+r.id+'"><i class="fa fa-trash"></i></button></td></tr>';
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
      var preview=document.getElementById('teacher-photo-preview');
      if(preview) preview.src=avatarUrl(tc.photo,[tc.first_name,tc.last_name].join(' '),'teacher');
    }).catch(function(err){ showAlert('#backend-form-status',err.message); });
    form.addEventListener('submit',function(e){
      e.preventDefault(); var fd=new FormData(form); var payload={};
      ['first_name','last_name','email','gender','birth_date','photo','employee_number','speciality','diploma','hire_date'].forEach(function(f){
        var v=fd.get(f); if(v!==null) payload[f]=v||null;
      });
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
    if(!rows.length){ tbody.innerHTML='<tr><td colspan="8" class="text-center">'+t('No records found')+'</td></tr>'; return; }
    tbody.innerHTML=rows.map(function(r){
      var img='<img src="'+esc(formationImg(r.image,r.title))+'" style="width:40px;height:40px;border-radius:6px;object-fit:cover">';
      return '<tr><td>'+img+'</td><td>'+esc(r.title)+'</td><td>'+esc(r.teacher_name||'-')+'</td><td>'+esc(r.classroom_name||'-')+'</td><td>'+esc(r.start_date||'-')+'</td><td>'+esc(r.end_date||'-')+'</td><td>$'+esc(r.price)+'</td>'+
        '<td><a href="edit-course.html?id='+r.id+'" class="btn btn-xs btn-info"><i class="fa fa-pencil"></i></a> '+
        '<button class="btn btn-xs btn-danger" data-del-formation="'+r.id+'"><i class="fa fa-trash"></i></button></td></tr>';
    }).join('');
    document.querySelector('#backend-formations-table').addEventListener('click',function(e){
      var btn=e.target.closest('[data-del-formation]'); if(!btn) return;
      if(!confirm('Delete this formation?')) return;
      request('/api/formations/'+btn.getAttribute('data-del-formation'),{method:'DELETE'})
        .then(loadFormations).catch(function(err){ showAlert('#backend-formations-status',err.message); });
    });
  }
  function populateTeacherSelect(sel) {
    if(!sel) return;
    request('/api/teacher-registrations').then(function(p){
      sel.innerHTML='<option value="">-- Select Teacher (optional) --</option>'+
        (p.data||[]).map(function(tc){
          return '<option value="'+tc.id+'">'+esc([tc.first_name,tc.last_name].filter(Boolean).join(' '))+'</option>';
        }).join('');
    });
  }
  function bindAddFormationForm() {
    var form=document.querySelector('#backend-add-formation-form'); if(!form) return;
    populateTeacherSelect(form.querySelector('#formation-teacher-id'));
    form.addEventListener('submit',function(e){
      e.preventDefault();
      var schoolId=window._schoolId; if(!schoolId){ showAlert('#backend-form-status','School not loaded. Refresh.'); return; }
      var fd=new FormData(form); var btn=form.querySelector('[type=submit]'); if(btn) btn.disabled=true;
      request('/api/formations',{method:'POST',body:JSON.stringify({
        school_id:schoolId,teacher_id:fd.get('teacher_id')||null,title:fd.get('title'),
        description:fd.get('description')||null,image:fd.get('image')||null,
        duration_hours:fd.get('duration_hours')||null,price:fd.get('price')||0,
        start_date:fd.get('start_date')||null,end_date:fd.get('end_date')||null,
      })}).then(function(){ showAlert('#backend-form-status',t('Formation created successfully'),'success'); form.reset(); if(btn) btn.disabled=false; })
        .catch(function(err){ showAlert('#backend-form-status',err.message); if(btn) btn.disabled=false; });
    });
  }
  function bindEditFormationForm() {
    var form=document.querySelector('#backend-edit-formation-form'); if(!form) return;
    var id=urlParam('id'); if(!id){ showAlert('#backend-form-status','No formation ID in URL'); return; }
    var sel=form.querySelector('#formation-teacher-id');
    populateTeacherSelect(sel);
    request('/api/formations/'+id).then(function(p){
      var f=p.data;
      ['title','description','duration_hours','price','start_date','end_date','image'].forEach(function(field){
        var el=form.querySelector('[name="'+field+'"]'); if(el&&f[field]!=null) el.value=f[field];
      });
      if(f.image){ var pv=document.getElementById('formation-image-preview'); if(pv) pv.src=formationImg(f.image,f.title); }
      if(f.teacher_id&&sel) setTimeout(function(){ sel.value=f.teacher_id; }, 600);
    }).catch(function(err){ showAlert('#backend-form-status',err.message); });
    form.addEventListener('submit',function(e){
      e.preventDefault(); var fd=new FormData(form); var btn=form.querySelector('[type=submit]'); if(btn) btn.disabled=true;
      request('/api/formations/'+id,{method:'PUT',body:JSON.stringify({
        teacher_id:fd.get('teacher_id')||null,title:fd.get('title'),description:fd.get('description')||null,
        image:fd.get('image')||null,duration_hours:fd.get('duration_hours')||null,
        price:fd.get('price')||0,start_date:fd.get('start_date')||null,end_date:fd.get('end_date')||null,
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

  function loadGroupsPage() {
    if(!document.querySelector('#backend-groups-list')) return;
    // Load formations, classrooms and students for selects
    Promise.all([
      request('/api/formations-list'),
      request('/api/classrooms'),
      request('/api/students-list'),
    ]).then(function(results){
      var formations = results[0].data||[];
      var classrooms = results[1].data||[];
      _allStudents   = results[2].data||[];

      // Populate formation selects
      var fSel=document.querySelector('#group-formation-id');
      if(fSel) fSel.innerHTML='<option value="">-- Select Formation *</option>'+
        formations.map(function(f){ return '<option value="'+f.id+'">'+esc(f.title)+'</option>'; }).join('');

      // Populate filter formation
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
      return '<div class="group-card" id="group-card-'+g.id+'">' +
        '<div class="row">' +
          '<div class="col-lg-8 col-sm-8 col-xs-12">' +
            '<h4>'+esc(g.name)+'</h4>' +
            '<p class="meta">' +
              '<i class="fa fa-book"></i> '+esc(g.formation_title||'-')+' &nbsp;|&nbsp; '+
              '<i class="fa fa-building"></i> '+esc(g.classroom_name||'No room')+' &nbsp;|&nbsp; '+
              '<i class="fa fa-users"></i> <span id="group-count-'+g.id+'">'+g.student_count+'</span> students' +
            '</p>' +
            '<div id="group-students-'+g.id+'"></div>' +
          '</div>' +
          '<div class="col-lg-4 col-sm-4 col-xs-12 text-right">' +
            '<button class="btn btn-sm btn-success" onclick="toggleAddStudents('+g.id+')"><i class="fa fa-user-plus"></i> Add Students</button> ' +
            '<button class="btn btn-sm btn-danger" data-del-group="'+g.id+'"><i class="fa fa-trash"></i></button>' +
          '</div>' +
        '</div>' +
        '<div id="add-students-panel-'+g.id+'" class="add-students-panel">' +
          '<p><strong>Select students to add to this group:</strong></p>' +
          '<input type="text" class="search-students" placeholder="Search..." oninput="filterGroupStudents(this,'+g.id+')">' +
          '<div class="student-select-list" id="student-list-'+g.id+'"></div>' +
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
            ' <span class="remove-student" onclick="removeStudentFromGroup('+groupId+','+s.id+')" title="Remove">×</span>'+
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

  function bindAddGroupForm() {
    var form=document.querySelector('#backend-add-group-form'); if(!form) return;
    form.addEventListener('submit',function(e){
      e.preventDefault(); var fd=new FormData(form);
      var studentIds=[].slice.call(form.querySelectorAll('input[name="student_ids"]:checked')).map(function(cb){ return parseInt(cb.value); });
      var btn=form.querySelector('[type=submit]'); if(btn) btn.disabled=true;
      request('/api/groups',{method:'POST',body:JSON.stringify({
        formation_id:fd.get('formation_id'),classroom_id:fd.get('classroom_id')||null,
        name:fd.get('name'),start_date:fd.get('start_date')||null,end_date:fd.get('end_date')||null,
        max_students:fd.get('max_students')||null,student_ids:studentIds,
      })}).then(function(){
        showAlert('#backend-group-form-status',t('Group created successfully'),'success');
        form.reset(); loadGroups(); if(btn) btn.disabled=false;
      }).catch(function(err){ showAlert('#backend-group-form-status',err.message); if(btn) btn.disabled=false; });
    });
  }

  // ── Init ─────────────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function() {
    ensureAuth();
    loadHealth();
    initLanguageSwitcher();
    loadDashboard();
    bindLoginForm();
    bindRegisterForm();
    bindSetupSchoolForm();
    // Students
    loadStudents(); bindAddStudentForm(); bindEditStudentForm();
    // Teachers
    loadTeachers(); bindAddTeacherForm(); bindEditTeacherForm();
    // Formations
    loadFormations(); bindAddFormationForm(); bindEditFormationForm();
    // Classrooms
    loadClassrooms(); bindAddClassroomForm();
    // Groups
    loadGroupsPage(); bindAddGroupForm();
  });

})();