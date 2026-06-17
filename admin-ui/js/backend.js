(function () {
  'use strict';

  function resolveApiBase() {
    if (window.SCHOOL_API_BASE_URL) {
      return window.SCHOOL_API_BASE_URL;
    }

    if (window.location && (window.location.protocol === 'http:' || window.location.protocol === 'https:')) {
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return window.location.protocol + '//' + window.location.hostname + ':5000';
      }

      return '';
    }

    return 'http://localhost:5000';
  }

  var apiBase = resolveApiBase();
  var tokenKey = 'school_management_token';

  function getToken() {
    return window.localStorage.getItem(tokenKey);
  }

  function setToken(token) {
    window.localStorage.setItem(tokenKey, token);
  }

  function clearToken() {
    window.localStorage.removeItem(tokenKey);
  }

  function request(path, options) {
    var requestOptions = Object.assign({
      headers: {},
    }, options);
    var headers = requestOptions.headers || {};
    var hasFormData = typeof FormData !== 'undefined' && requestOptions.body instanceof FormData;

    if (!hasFormData && requestOptions.body && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    if (getToken()) {
      headers.Authorization = 'Bearer ' + getToken();
    }

    requestOptions.headers = headers;

    return fetch(apiBase + path, requestOptions).then(function (response) {
      if (!response.ok) {
        return response.json().catch(function () {
          return { message: 'Request failed' };
        }).then(function (payload) {
          throw new Error(payload.message || 'Request failed');
        });
      }

      if (response.status === 204) {
        return null;
      }

      return response.json();
    });
  }

  function setText(selector, value) {
    var element = document.querySelector(selector);

    if (element) {
      element.textContent = value;
    }
  }

  function redirectTo(path) {
    window.location.href = path;
  }

  function getPageName() {
    return (document.body && document.body.getAttribute('data-page')) || '';
  }

  function isAuthPage() {
    var page = getPageName();
    return page === 'login' || page === 'register' || page === 'setup-school';
  }

  function ensureAuthenticated() {
    var page = getPageName();

    if (isAuthPage()) {
      if (!getToken()) {
        return;
      }

      request('/api/auth/me').then(function (payload) {
        if (payload.needsSchoolSetup) {
          redirectTo('setup-school.html');
          return;
        }

        redirectTo('index.html');
      }).catch(function () {
        clearToken();
      });

      return;
    }

    if (!getToken()) {
      redirectTo('login.html');
      return;
    }

    request('/api/auth/me').then(function (payload) {
      if (payload.needsSchoolSetup) {
        redirectTo('setup-school.html');
        return;
      }

      var userName = document.querySelector('#backend-user-name');
      if (userName) {
        userName.textContent = [payload.user.first_name, payload.user.last_name].filter(Boolean).join(' ');
      }

      var schoolName = document.querySelector('#backend-school-name');
      if (schoolName && payload.school) {
        schoolName.textContent = payload.school.name;
      }

      var schoolStatus = document.querySelector('#backend-school-status');
      if (schoolStatus && payload.school) {
        schoolStatus.textContent = 'School ID: ' + payload.school.id;
      }
    }).catch(function () {
      clearToken();
      redirectTo('login.html');
    });
  }

  function bindLogoutButton() {
    var logoutButtons = document.querySelectorAll('[data-backend-logout]');

    if (!logoutButtons.length) {
      return;
    }

    Array.prototype.forEach.call(logoutButtons, function (logoutButton) {
      logoutButton.addEventListener('click', function (event) {
        event.preventDefault();
        request('/api/auth/logout', { method: 'POST' }).finally(function () {
          clearToken();
          redirectTo('login.html');
        });
      });
    });
  }

  function populateDashboard() {
    var dashboard = document.querySelector('#backend-dashboard-shell');

    if (!dashboard) {
      return;
    }

    request('/api/dashboard/overview').then(function (payload) {
      var schoolName = document.querySelector('#backend-school-name');
      if (schoolName) {
        schoolName.textContent = payload.school.name;
      }

      var schoolStatus = document.querySelector('#backend-school-status');
      if (schoolStatus) {
        schoolStatus.textContent = 'Logged in school admin dashboard';
      }

      var summaryMap = {
        '#backend-count-users': payload.counts.users,
        '#backend-count-teachers': payload.counts.teachers,
        '#backend-count-students': payload.counts.students,
        '#backend-count-classrooms': payload.counts.classrooms,
        '#backend-count-formations': payload.counts.formations,
        '#backend-count-groups': payload.counts.groups,
      };

      Object.keys(summaryMap).forEach(function (selector) {
        var element = document.querySelector(selector);
        if (element) {
          element.textContent = summaryMap[selector];
        }
      });
    }).catch(function (error) {
      setText('#backend-dashboard-status', error.message);
      if (error.message === 'School setup required') {
        redirectTo('setup-school.html');
      }
    });
  }

  function completeAuth(response) {
    setToken(response.token);

    if (response.needsSchoolSetup) {
      redirectTo('setup-school.html');
      return;
    }

    redirectTo('index.html');
  }

  function bindLoginForm() {
    var form = document.querySelector('#backend-login-form');

    if (!form) {
      return;
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      var formData = new FormData(form);
      var payload = {
        email: formData.get('email'),
        password: formData.get('password'),
      };

      request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      }).then(completeAuth).catch(function (error) {
        setText('#backend-auth-status', error.message);
      });
    });
  }

  function bindRegisterForm() {
    var form = document.querySelector('#backend-register-form');

    if (!form) {
      return;
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      var formData = new FormData(form);
      var password = formData.get('password');
      var confirmPassword = formData.get('confirm_password');

      if (password !== confirmPassword) {
        setText('#backend-auth-status', 'Passwords do not match');
        return;
      }

      request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          first_name: formData.get('first_name'),
          last_name: formData.get('last_name'),
          email: formData.get('email'),
          password: password,
        }),
      }).then(completeAuth).catch(function (error) {
        setText('#backend-auth-status', error.message);
      });
    });
  }

  function bindSetupSchoolForm() {
    var form = document.querySelector('#backend-setup-school-form');

    if (!form) {
      return;
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      var formData = new FormData(form);

      request('/api/school-setup', {
        method: 'POST',
        body: JSON.stringify({
          name: formData.get('name'),
          logo: formData.get('logo') || null,
        }),
      }).then(function () {
        redirectTo('index.html');
      }).catch(function (error) {
        setText('#backend-setup-status', error.message);
      });
    });
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function renderStudentRows(rows) {
    var tbody = document.querySelector('#backend-students-table tbody');

    if (!tbody) {
      return;
    }

    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center">No students found</td></tr>';
      return;
    }

    tbody.innerHTML = rows.map(function (row) {
      var fullName = [row.first_name, row.last_name].filter(Boolean).join(' ');

      return '<tr>' +
        '<td>' + escapeHtml(row.registration_number) + '</td>' +
        '<td>' + escapeHtml(fullName) + '</td>' +
        '<td>' + escapeHtml(row.email) + '</td>' +
        '<td>' + escapeHtml(row.parent_name || '-') + '</td>' +
        '<td>' + escapeHtml(row.parent_phone || '-') + '</td>' +
        '<td>' + escapeHtml(row.enrollment_date || '-') + '</td>' +
      '</tr>';
    }).join('');
  }

  function loadHealth() {
    var badge = document.querySelector('#backend-health-badge');

    if (!badge) {
      return;
    }

    request('/health').then(function (payload) {
      badge.className = 'label label-success';
      badge.textContent = 'Backend connected';

      var target = document.querySelector('#backend-health-detail');
      if (target) {
        target.textContent = payload.database;
      }
    }).catch(function () {
      badge.className = 'label label-danger';
      badge.textContent = 'Backend offline';
    });
  }

  function loadStudents() {
    var table = document.querySelector('#backend-students-table');

    if (!table) {
      return;
    }

    request('/api/student-registrations').then(function (payload) {
      renderStudentRows(payload.data || []);
    }).catch(function (error) {
      setText('#backend-students-status', error.message);
    });
  }

  function bindAddStudentForm() {
    var form = document.querySelector('#backend-add-student-form');

    if (!form) {
      return;
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      var formData = new FormData(form);
      var payload = {
        first_name: formData.get('first_name'),
        last_name: formData.get('last_name'),
        email: formData.get('email'),
        password: formData.get('password'),
        gender: formData.get('gender') || null,
        birth_date: formData.get('birth_date') || null,
        photo: formData.get('photo') || null,
        registration_number: formData.get('registration_number'),
        parent_name: formData.get('parent_name') || null,
        parent_phone: formData.get('parent_phone') || null,
        enrollment_date: formData.get('enrollment_date') || null,
      };

      request('/api/student-registrations', {
        method: 'POST',
        body: JSON.stringify(payload),
      }).then(function () {
        setText('#backend-form-status', 'Student created successfully');
        form.reset();
        loadStudents();
      }).catch(function (error) {
        setText('#backend-form-status', error.message);
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    loadHealth();
    ensureAuthenticated();
    bindLogoutButton();
    populateDashboard();
    bindLoginForm();
    bindRegisterForm();
    bindSetupSchoolForm();
    loadStudents();
    bindAddStudentForm();
  });
})();