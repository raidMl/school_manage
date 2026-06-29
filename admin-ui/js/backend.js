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
      
      form.querySelector('[name="name"]').value = s.name || '';
      var logoEl = form.querySelector('[name="logo"]'); if(logoEl) logoEl.value = s.logo || '';
      
      var fbEl = form.querySelector('[name="fb"]'); if(fbEl) fbEl.value = c.fb || '';
      var waEl = form.querySelector('[name="whatsapp"]'); if(waEl) waEl.value = c.whatsapp || '';
      var liEl = form.querySelector('[name="linkedin"]'); if(liEl) liEl.value = c.linkedin || '';
      
      var fnEl = form.querySelector('[name="admin_first_name"]'); if(fnEl) fnEl.value = u.first_name || '';
      var lnEl = form.querySelector('[name="admin_last_name"]'); if(lnEl) lnEl.value = u.last_name || '';
      var emEl = form.querySelector('[name="admin_email"]'); if(emEl) emEl.value = u.email || '';
    }).catch(function(err){
      // If endpoint doesn't exist yet or fails, ignore gracefully
      console.error(err);
    });
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
      var name=esc([r.first_name,r.last_name].filter(Boolean).join(' '));
      var img='<img src="'+esc(avatarUrl(r.photo,[r.first_name,r.last_name].join(' '),'student'))+'" style="width:36px;height:36px;border-radius:50%;object-fit:cover" onerror="this.src=\'https://ui-avatars.com/api/?name=S&background=27ae60&color=fff&size=36\'">';
      var payStatus = r.payment_status === 'paid' 
        ? '<span class="label label-success">Paid</span>' 
        : '<span class="label label-danger">Unpaid</span>';
      return '<tr><td>'+img+'</td><td>'+esc(r.registration_number)+'</td><td>'+name+'</td><td>'+esc(r.email)+'</td><td>'+esc(r.parent_name||'-')+'</td><td>'+esc(formatGmtPlusOneDate(r.enrollment_date))+'</td><td>'+payStatus+'</td>'+ 
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

  function loadPaymentsPage() {
    var tbl = document.querySelector('#backend-payments-table'); if(!tbl) return;
    var filters = {
      formation_id: document.getElementById('payment-filter-formation') ? document.getElementById('payment-filter-formation').value : null,
      group_id: document.getElementById('payment-filter-group') ? document.getElementById('payment-filter-group').value : null,
      classroom_id: document.getElementById('payment-filter-classroom') ? document.getElementById('payment-filter-classroom').value : null,
      subscription_plan: document.getElementById('payment-filter-subscription') ? document.getElementById('payment-filter-subscription').value : null,
      payment_due: document.getElementById('payment-filter-due') ? document.getElementById('payment-filter-due').value : null,
    };
    var params = new URLSearchParams();
    Object.keys(filters).forEach(function(key){ if(filters[key]) params.append(key, filters[key]); });
    request('/api/student-registrations/payments?' + params.toString())
      .then(function(p){ renderPaymentRows(p.data || []); })
      .catch(function(err){ showAlert('#backend-payments-status', err.message); });
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

  function populatePaymentFilters() {
    var formationSel = document.getElementById('payment-filter-formation');
    var groupSel = document.getElementById('payment-filter-group');
    var classroomSel = document.getElementById('payment-filter-classroom');
    if (!formationSel && !groupSel && !classroomSel) return;

    Promise.all([
      request('/api/formations-list'),
      request('/api/groups'),
      request('/api/classrooms')
    ]).then(function(res){
      var formations = res[0].data || [];
      var groups = res[1].data || [];
      var classrooms = res[2].data || [];
      if (formationSel) {
        formationSel.innerHTML = '<option value="">All Formations</option>' + formations.map(function(f){ return '<option value="'+f.id+'">'+esc(f.title)+'</option>'; }).join('');
      }
      if (groupSel) {
        groupSel.innerHTML = '<option value="">All Groups</option>' + groups.map(function(g){ return '<option value="'+g.id+'">'+esc(g.name)+'</option>'; }).join('');
      }
      if (classroomSel) {
        classroomSel.innerHTML = '<option value="">All Classrooms</option>' + classrooms.map(function(c){ return '<option value="'+c.id+'">'+esc(c.name)+'</option>'; }).join('');
      }
    }).catch(function(){ });
  }

  function bindPaymentFilters() {
    ['payment-filter-formation','payment-filter-group','payment-filter-classroom','payment-filter-subscription','payment-filter-due'].forEach(function(id){
      var sel = document.getElementById(id);
      if (sel) sel.addEventListener('change', loadPaymentsPage);
    });
  }

  function populateFormationSelect(sel) {
    if(!sel) return;
    request('/api/formations-list').then(function(p){
      var list = p.data || [];
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
        var el=form.querySelector('[name="'+f+'"]'); if(el&&s[f]!=null) el.value=s[f];
      });
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
    if(!rows.length){ tbody.innerHTML='<tr><td colspan="10" class="text-center">'+t('No records found')+'</td></tr>'; return; }
    tbody.innerHTML=rows.map(function(r){
      var img='<img src="'+esc(formationImg(r.image,r.title))+'" style="width:40px;height:40px;border-radius:6px;object-fit:cover">';
      var typeLabel = r.type === 'subscription' ? 'Subscription' : 'Formation';
      var periodLabel = r.subscription_period === '1_month' ? 'Monthly' : (r.subscription_period === '3_months' ? '3 months' : (r.subscription_period === '1_year' ? 'Yearly' : '-'));
      var priceValue = r.type === 'subscription' ? (
        r.subscription_period === '1_month' ? r.price_monthly :
        (r.subscription_period === '3_months' ? r.price_3_months :
        (r.subscription_period === '1_year' ? r.price_1_year : r.price))
      ) : r.price;
      return '<tr><td>'+img+'</td><td>'+esc(r.title)+'</td><td>'+esc(typeLabel)+'</td><td>'+esc(periodLabel)+'</td><td>'+esc(r.teacher_name||'-')+'</td><td>'+esc(r.classroom_name||'-')+'</td><td>'+esc(r.start_date||'-')+'</td><td>'+esc(r.end_date||'-')+'</td><td>$'+esc(priceValue || 0)+'</td>'+
        '<td><a href="course-info.html?id='+r.id+'" class="btn btn-xs btn-success" title="View Details"><i class="fa fa-eye"></i></a> '+
        '<a href="edit-course.html?id='+r.id+'" class="btn btn-xs btn-info" title="Edit"><i class="fa fa-pencil"></i></a> '+
        '<button class="btn btn-xs btn-danger" data-del-formation="'+r.id+'" title="Delete"><i class="fa fa-trash"></i></button></td></tr>';
    }).join('');
    document.querySelector('#backend-formations-table').addEventListener('click',function(e){
      var btn=e.target.closest('[data-del-formation]'); if(!btn) return;
      if(!confirm('Delete this formation?')) return;
      request('/api/formations/'+btn.getAttribute('data-del-formation'),{method:'DELETE'})
        .then(loadFormations).catch(function(err){ showAlert('#backend-formations-status',err.message); });
    });
  }
  function populateTeacherSelect(sel) {
    if(!sel) return Promise.resolve();
    return request('/api/teacher-registrations').then(function(p){
      sel.innerHTML='<option value="">-- Select Teacher (optional) --</option>'+
        (p.data||[]).map(function(tc){
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
        type:fd.get('type')||'formation',subscription_period:fd.get('subscription_period')||null,
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
      ['title','description','duration_hours','price','type','start_date','end_date','image'].forEach(function(field){
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
        type:fd.get('type')||'formation',subscription_period:fd.get('subscription_period')||null,start_date:fd.get('start_date')||null,end_date:fd.get('end_date')||null,
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
      var formations = results[0].data||[];
      var classrooms = results[1].data||[];
      _allStudents   = results[2].data||[];
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
      return '<div class="group-card" id="group-card-'+g.id+'">' +
        '<div class="row">' +
          '<div class="col-lg-8 col-sm-8 col-xs-12">' +
            '<h4>'+esc(g.name)+'</h4>' +
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
      var formations = res[0].data || [];
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
    var formSel = document.getElementById('cert-formation-id');
    var stuSel = document.getElementById('cert-student-id');
    var genBtn = document.getElementById('btn-generate-cert');
    var printBtn = document.getElementById('btn-print-cert');
    
    if(!formSel || !stuSel) return;

    var _students = [];
    var _formations = [];

    // Fetch formations and students
    Promise.all([
      request('/api/formations-list').catch(function(){ return {data:[]}; }),
      request('/api/students-list').catch(function(){ return {data:[]}; })
    ]).then(function(res) {
      _formations = res[0].data || [];
      _students = res[1].data || [];

      // Populate formations
      formSel.innerHTML = '<option value="">-- Select Formation --</option>' + 
        _formations.map(function(f){ return '<option value="'+f.id+'">'+esc(f.title)+'</option>'; }).join('');
      
      formSel.addEventListener('change', function() {
        if(this.value) {
          stuSel.disabled = false;
          // Populate students
          stuSel.innerHTML = '<option value="">-- Select Student --</option>' + 
            _students.map(function(s){ return '<option value="'+s.id+'">'+esc([s.first_name, s.last_name].filter(Boolean).join(' '))+'</option>'; }).join('');
        } else {
          stuSel.disabled = true;
          stuSel.innerHTML = '<option value="">Select Formation First</option>';
          genBtn.disabled = true;
        }
      });

      stuSel.addEventListener('change', function() {
        genBtn.disabled = !this.value;
      });

    }).catch(function(err){ showAlert('#backend-certificate-status', err.message); });

    genBtn.addEventListener('click', function() {
      var fId = formSel.value;
      var sId = stuSel.value;
      if(!fId || !sId) return;

      var formation = _formations.find(function(f) { return String(f.id) === String(fId); });
      var student = _students.find(function(s) { return String(s.id) === String(sId); });
      if(!formation || !student) return;

      // Fill data
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

      printBtn.disabled = false;
      showAlert('#backend-certificate-status', t('Certificate generated and ready to print.'), 'success');
      
      // Scroll to certificate preview
      setTimeout(function() {
        var preview = document.querySelector('.cert-preview-wrapper');
        if(preview) preview.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    printBtn.addEventListener('click', function() {
      window.print();
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
    // Students
    loadStudents(); bindAddStudentForm(); bindEditStudentForm(); loadStudentProfile(); loadPaymentsPage(); bindPaymentFilters(); populatePaymentFilters();
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

})();