(function () {
  "use strict";

  // ── Contact numbers ──────────────────────────────────────────────────────
  var contacts = [
    { wa: '213669453240',  tg: '213669453240'  },
    { wa: '2113696002541', tg: '2113696002541' },
  ];

  // ── Translations ─────────────────────────────────────────────────────────
  var i18n = {
    ar: {
      label1:    'الدعم 1',
      label2:    'الدعم 2',
      tooltip:   'تواصل معنا',
      waTitle:   'واتساب',
      tgTitle:   'تيليغرام',
      waMsg:     'مرحباً، أريد الاستفسار عن نظام إدارة المدرسة.',
    },
    en: {
      label1:    'Support 1',
      label2:    'Support 2',
      tooltip:   'Contact us',
      waTitle:   'WhatsApp',
      tgTitle:   'Telegram',
      waMsg:     'Hello, I would like to inquire about the School Management System.',
    },
  };

  function getLang() {
    var l = localStorage.getItem('app_lang') || 'ar';
    return i18n[l] || i18n.ar;
  }

  // ── Inject CSS ───────────────────────────────────────────────────────────
  var css = `
    #_cfab {
      position: fixed; bottom: 24px; right: 24px; z-index: 99999;
      display: flex; flex-direction: column; align-items: flex-end; gap: 10px;
      font-family: 'Tajawal', 'Inter', sans-serif;
    }
    html[dir="rtl"] #_cfab { right: auto; left: 24px; align-items: flex-start; }

    ._cfab-toggle {
      width: 58px; height: 58px; border-radius: 50%;
      background: linear-gradient(135deg, #25d366 0%, #128c7e 100%);
      border: none; cursor: pointer;
      box-shadow: 0 4px 18px rgba(0,0,0,.28);
      display: flex; align-items: center; justify-content: center;
      transition: transform .2s, box-shadow .2s;
    }
    ._cfab-toggle:hover { transform: scale(1.1); box-shadow: 0 6px 24px rgba(0,0,0,.35); }
    ._cfab-toggle svg { width: 30px; height: 30px; fill: #fff; }

    ._cfab-menu {
      display: none; flex-direction: column; gap: 10px;
      align-items: flex-end;
    }
    html[dir="rtl"] ._cfab-menu { align-items: flex-start; }
    ._cfab-menu.open { display: flex; animation: _cfab-in .2s ease; }

    @keyframes _cfab-in {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    ._cfab-group {
      display: flex; flex-direction: column; gap: 6px; align-items: flex-end;
    }
    html[dir="rtl"] ._cfab-group { align-items: flex-start; }

    ._cfab-group-label {
      font-size: 11px; font-weight: 700; color: #888; text-transform: uppercase;
      letter-spacing: .5px; padding: 0 4px;
    }

    ._cfab-row {
      display: flex; align-items: center; gap: 8px;
    }

    ._cfab-chip {
      background: #fff; color: #222; font-size: 13px; font-weight: 600;
      padding: 5px 13px; border-radius: 20px;
      box-shadow: 0 2px 10px rgba(0,0,0,.13); white-space: nowrap;
    }

    ._cfab-btn {
      width: 42px; height: 42px; border-radius: 50%; border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,.2); transition: transform .2s;
      text-decoration: none;
    }
    ._cfab-btn:hover { transform: scale(1.12); }
    ._cfab-btn.wa { background: #25d366; }
    ._cfab-btn.tg { background: #229ed9; }
    ._cfab-btn svg { width: 22px; height: 22px; fill: #fff; }
  `;
  var styleEl = document.createElement('style');
  styleEl.innerHTML = css;
  document.head.appendChild(styleEl);

  // ── SVG Icons ────────────────────────────────────────────────────────────
  var ICONS = {
    chat: '<svg viewBox="0 0 32 32"><path d="M16 0C7.163 0 0 7.163 0 16c0 2.824.736 5.477 2.027 7.782L0 32l8.468-2.004A15.93 15.93 0 0016 32c8.837 0 16-7.163 16-16S24.837 0 16 0zm8.325 22.674c-.346.974-2.03 1.858-2.782 1.975-.713.108-1.616.153-2.607-.163-.602-.192-1.376-.446-2.36-.876-4.155-1.796-6.87-5.97-7.079-6.245-.206-.274-1.68-2.235-1.68-4.264 0-2.03 1.062-3.026 1.44-3.44.378-.412.825-.515 1.1-.515.275 0 .55.003.79.014.254.012.594-.097.93.71.346.825 1.176 2.854 1.28 3.062.103.207.172.45.034.724-.138.275-.207.447-.412.688-.206.24-.434.537-.619.72-.206.207-.42.43-.18.844.24.412 1.066 1.757 2.288 2.847 1.57 1.397 2.895 1.83 3.308 2.034.413.207.653.172.893-.104.24-.275 1.03-1.203 1.305-1.616.275-.413.55-.344.927-.207.378.137 2.4 1.133 2.81 1.34.41.207.684.31.785.48.103.171.103.994-.243 1.968z"/></svg>',
    close: '<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>',
    wa:    '<svg viewBox="0 0 32 32"><path d="M16 0C7.163 0 0 7.163 0 16c0 2.824.736 5.477 2.027 7.782L0 32l8.468-2.004A15.93 15.93 0 0016 32c8.837 0 16-7.163 16-16S24.837 0 16 0zm8.325 22.674c-.346.974-2.03 1.858-2.782 1.975-.713.108-1.616.153-2.607-.163-.602-.192-1.376-.446-2.36-.876-4.155-1.796-6.87-5.97-7.079-6.245-.206-.274-1.68-2.235-1.68-4.264 0-2.03 1.062-3.026 1.44-3.44.378-.412.825-.515 1.1-.515.275 0 .55.003.79.014.254.012.594-.097.93.71.346.825 1.176 2.854 1.28 3.062.103.207.172.45.034.724-.138.275-.207.447-.412.688-.206.24-.434.537-.619.72-.206.207-.42.43-.18.844.24.412 1.066 1.757 2.288 2.847 1.57 1.397 2.895 1.83 3.308 2.034.413.207.653.172.893-.104.24-.275 1.03-1.203 1.305-1.616.275-.413.55-.344.927-.207.378.137 2.4 1.133 2.81 1.34.41.207.684.31.785.48.103.171.103.994-.243 1.968z"/></svg>',
    tg:    '<svg viewBox="0 0 32 32"><path d="M16 0C7.163 0 0 7.163 0 16s7.163 16 16 16 16-7.163 16-16S24.837 0 16 0zm7.861 10.88l-2.703 12.738c-.2.9-.73 1.12-1.48.698l-4.09-3.01-1.973 1.898c-.218.217-.4.4-.82.4l.293-4.163 7.564-6.83c.329-.293-.07-.455-.51-.162l-9.346 5.88-4.025-1.258c-.875-.274-.893-.875.182-1.295l15.715-6.056c.73-.265 1.37.178 1.193 1.16z"/></svg>',
  };

  // ── Build widget ─────────────────────────────────────────────────────────
  function buildWidget() {
    var t   = getLang();
    var labels = [t.label1, t.label2];
    var msg = encodeURIComponent(t.waMsg);

    var groups = contacts.map(function(c, i) {
      return (
        '<div class="_cfab-group">' +
          '<span class="_cfab-group-label">' + labels[i] + '</span>' +
          '<div class="_cfab-row">' +
            '<span class="_cfab-chip">' + t.waTitle + '</span>' +
            '<a class="_cfab-btn wa" href="https://wa.me/' + c.wa + '?text=' + msg + '" target="_blank" rel="noopener" title="' + t.waTitle + '">' + ICONS.wa + '</a>' +
          '</div>' +
          '<div class="_cfab-row">' +
            '<span class="_cfab-chip">' + t.tgTitle + '</span>' +
            '<a class="_cfab-btn tg" href="https://t.me/+' + c.tg + '" target="_blank" rel="noopener" title="' + t.tgTitle + '">' + ICONS.tg + '</a>' +
          '</div>' +
        '</div>'
      );
    }).join('');

    var fab = document.createElement('div');
    fab.id = '_cfab';
    fab.innerHTML =
      '<div class="_cfab-menu" id="_cfab-menu">' + groups + '</div>' +
      '<button class="_cfab-toggle" id="_cfab-toggle" title="' + t.tooltip + '">' + ICONS.chat + '</button>';
    document.body.appendChild(fab);

    var toggle = document.getElementById('_cfab-toggle');
    var menu   = document.getElementById('_cfab-menu');
    var isOpen = false;

    toggle.addEventListener('click', function () {
      isOpen = !isOpen;
      menu.classList.toggle('open', isOpen);
      toggle.innerHTML = isOpen ? ICONS.close : ICONS.chat;
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildWidget);
  } else {
    buildWidget();
  }

})();