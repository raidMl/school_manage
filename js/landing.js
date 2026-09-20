/**
 * Modern Animated Landing Page Logic
 * School: مدرسة الرضوان لعلوم القرآن (El-Ridwan Quranic School)
 */

(function () {
  'use strict';

  // --- Default Fallback Data (Matching actual school database) ---
  const DEFAULT_SCHOOL = {
    name_ar: 'مدرسة الرضوان لعلوم القرآن',
    name_en: 'El-Ridwan School of Quranic Sciences',
    address_ar: 'قجال، ولاية سطيف - الجزائر',
    address_en: 'Guidjel, Sétif - Algeria',
    phone: '0696002541',
    email: 'ing.otmani.billel@gmail.com',
    logo: 'https://res.cloudinary.com/p0mhhcjg/image/upload/v1788176562/school_management/bgqqlyiwkzs7ja5zuxpt.png'
  };

  const DEFAULT_COUNTS = {
    students: 158,
    teachers: 17,
    formations: 7,
    success_rate: 99
  };

  const DEFAULT_FORMATIONS = [
    {
      id: 8,
      title_ar: 'التمهيدي',
      title_en: 'Kindergarten & Early Childhood',
      category: 'preparatory',
      category_label_ar: 'التمهيدي',
      category_label_en: 'Kindergarten',
      description_ar: 'برنامج متميز للبراعم يركز على استكشاف الحروف والأرقام وتنمية المهارات الإدراكية والتعبيرية في بيئة تربوية محفزة.',
      description_en: 'Early childhood foundation program developing cognitive, linguistic and motor skills in a supportive setting.',
      image: 'https://res.cloudinary.com/p0mhhcjg/image/upload/v1788800156/school_management/meq2uu7jean8nndtpttn.png',
      fallback_image: 'client_ui/img/courses/1.jpg',
      niveau_ar: 'سن 4 - 5 سنوات',
      niveau_en: 'Age 4 - 5 Years',
      duration_hours: 2,
      places: 60,
      price: '4800 د.ج'
    },
    {
      id: 7,
      title_ar: 'القسم التحضيري',
      title_en: 'Preparatory Preschool',
      category: 'preparatory',
      category_label_ar: 'التحضيري',
      category_label_en: 'Preparatory',
      description_ar: 'تهيئة الأطفال وتنمية مهاراتهم اللغوية، الحسابية والسلوكية وفق مناهج تربوية حديثة تواكب الفطرة السليمة.',
      description_en: 'Holistic preschool development fostering language, basic arithmetic and social values in a nurturing space.',
      image: 'https://res.cloudinary.com/p0mhhcjg/image/upload/v1788854287/school_management/ddv2hgtkanyp9jmcrrpf.png',
      fallback_image: 'client_ui/img/courses/1.jpg',
      niveau_ar: 'سن 5 - 6 سنوات',
      niveau_en: 'Age 5 - 6 Years',
      duration_hours: 2,
      places: 52,
      price: '4800 د.ج'
    },
    {
      id: 6,
      title_ar: 'التعليم القرآني ابتدائي',
      title_en: 'Quranic Education (Primary)',
      category: 'quran',
      category_label_ar: 'علوم القرآن',
      category_label_en: 'Quranic Sciences',
      description_ar: 'برنامج مخصص لطلاب المرحلة الابتدائية يجمع بين حفظ القرآن الكريم والتربية الإسلامية والأخلاق الحميدة.',
      description_en: 'Tailored Quran memorization and Islamic ethics program designed specifically for primary school pupils.',
      image: 'https://res.cloudinary.com/p0mhhcjg/image/upload/v1788857459/school_management/icya2xkiuui4gpk8arsg.png',
      fallback_image: 'client_ui/img/courses/1.jpg',
      niveau_ar: 'المرحلة الابتدائية',
      niveau_en: 'Primary Stage',
      duration_hours: 6,
      places: 18,
      price: '1500 د.ج'
    },
    {
      id: 5,
      title_ar: 'التعليم القرآني متوسط وثانوي',
      title_en: 'Quranic Education (Middle & High)',
      category: 'quran',
      category_label_ar: 'علوم القرآن',
      category_label_en: 'Quranic Sciences',
      description_ar: 'حلقات متقدمة لإتقان الحفظ والمراجعة وضبط المتون لطلبة التعليم المتوسط والثانوي مع متابعة فردية دقيقة.',
      description_en: 'Advanced revision and memorization circles for middle and secondary students with personalized tracking.',
      image: 'https://res.cloudinary.com/p0mhhcjg/image/upload/v1788863739/school_management/jw4lvowsbbhlwtmxcmnl.png',
      fallback_image: 'client_ui/img/courses/1.jpg',
      niveau_ar: 'متوسط وثانوي',
      niveau_en: 'Middle & High School',
      duration_hours: 3,
      places: 50,
      price: '1500 د.ج'
    },
    {
      id: 4,
      title_ar: 'التعليم القرآني تلقين',
      title_en: 'Quran Memorization (Talaqqi)',
      category: 'quran',
      category_label_ar: 'علوم القرآن',
      category_label_en: 'Quranic Sciences',
      description_ar: 'تلقين وحفظ القرآن الكريم للأطفال والناشئة بالأحكام والتجويد تحت إشراف نخبة من المشايخ والأساتذة المعتمدين.',
      description_en: 'Direct memorization and recitation of the Holy Quran with Tajweed rules under certified scholars.',
      image: 'https://res.cloudinary.com/p0mhhcjg/image/upload/v1788991042/school_management/r7egatgtexvhlim88y11.png',
      fallback_image: 'client_ui/img/courses/1.jpg',
      niveau_ar: 'تمهيدي / أطفال',
      niveau_en: 'Introductory / Kids',
      duration_hours: 6,
      places: 40,
      price: '1500 د.ج'
    },
    {
      id: 3,
      title_ar: 'محو الأمية وتعليم الكبار',
      title_en: 'Adult Literacy & Quran Reading',
      category: 'support',
      category_label_ar: 'تعليم وتأهيل',
      category_label_en: 'Literacy & Support',
      description_ar: 'دورات نوعية لتعليم القراءة والكتابة وتلاوة كتاب الله لكبار السن والراغبين في تعلم القرآن بكل يسر.',
      description_en: 'Compassionate courses empowering adults to master reading, writing and reciting the Holy Quran.',
      image: 'https://res.cloudinary.com/p0mhhcjg/image/upload/v1788863806/school_management/nvfopcvhswvpg5d1ibme.png',
      fallback_image: 'client_ui/img/courses/1.jpg',
      niveau_ar: 'جميع المستويات',
      niveau_en: 'All Levels',
      duration_hours: 4,
      places: 30,
      price: 'مجاني'
    },
    {
      id: 2,
      title_ar: 'دروس الدعم في الرياضيات',
      title_en: 'Mathematics Academic Support',
      category: 'support',
      category_label_ar: 'دعم دراسي',
      category_label_en: 'Academic Support',
      description_ar: 'برامج دعم وتقوية في مادة الرياضيات لترسيخ المفاهيم العلمية وتحقيق أعلى النتائج والدرجات المدرسية.',
      description_en: 'Targeted reinforcement classes in Mathematics ensuring academic confidence and outstanding grades.',
      image: 'client_ui/img/courses/1.jpg',
      fallback_image: 'client_ui/img/courses/1.jpg',
      niveau_ar: 'متوسط وثانوي',
      niveau_en: 'Middle & Secondary',
      duration_hours: 30,
      places: 25,
      price: '2000 د.ج'
    }
  ];

  // --- Translation Dictionary ---
  const TRANSLATIONS = {
    ar: {
      site_title: 'مدرسة الرضوان لعلوم القرآن | الصرح التعليمي الرائد',
      school_name: 'مدرسة الرضوان لعلوم القرآن',
      school_tagline: 'قجال - ولاية سطيف',
      nav_home: 'الرئيسية',
      nav_about: 'عن المدرسة',
      nav_formations: 'تكويناتنا وبرامجنا',
      nav_stats: 'إحصائياتنا',
      nav_features: 'مميزاتنا',
      nav_contact: 'اتصل بنا',
      login_portal_btn: 'فضاء التلميذ والأستاذ',
      hero_badge: 'الصرح الرائد في علوم القرآن والتربية والتعليم',
      hero_title_1: 'نغرس القيم، نعلّم القرآن،',
      hero_title_gradient: 'ونبني أجيال المستقبل',
      hero_desc: 'مرحباً بكم في مدرسة الرضوان لعلوم القرآن بقجال. نجمع بين أصالة تحفيظ كتاب الله والأساليب التربوية والتقنية الحديثة لبناء شخصية متكاملة تسعى للإتقان والتميز.',
      hero_btn_formations: 'استكشف التكوينات والبرامج',
      hero_btn_portal: 'دخول الفضاء التعليمي',
      floating_chip_quran: 'حفظ وتجويد بإسناد متصل',
      floating_chip_portal: 'منصة رقمية ذكية للمتابعة',
      stats_students_label: 'طالب وطالبة مسجلين',
      stats_teachers_label: 'نخبة الأساتذة والمشايخ',
      stats_formations_label: 'برامج وتكوينات معتمدة',
      stats_success_label: 'نسبة النجاح والإتقان',
      formations_pill: 'بوابتك نحو التميز العلمي والروحي',
      formations_title: 'التكوينات والبرامج المتاحة',
      formations_subtitle: 'برامج متكاملة مصممة بعناية فائقة لتناسب مختلف الأعمار والمستويات التعليمية',
      tab_all: 'جميع البرامج',
      tab_quran: 'علوم القرآن الكريم',
      tab_preparatory: 'القسم التحضيري',
      tab_support: 'الدعم ومحو الأمية',
      card_btn_inquire: 'طلب تسجيل واستفسار',
      card_duration_label: 'ساعات أسبوعياً',
      card_places_label: 'مقعد متاح',
      features_pill: 'لماذا مدرسة الرضوان؟',
      features_title: 'بيئة تعليمية رائدة تجمع بين الأصالة والمعاصرة',
      features_subtitle: 'نحرص على تقديم أعلى معايير الجودة الأكاديمية والتربوية لأبنائنا الطلبة',
      f1_title: 'شيوخ وأساتذة أكفاء',
      f1_desc: 'نخبة من خيرة المعلمين والمشايخ المجازين ذوي الخبرة الطويلة والأساليب البيداغوجية المحفزة.',
      f2_title: 'متابعة رقمية للحضور والتقدم',
      f2_desc: 'نظام إلكتروني ذكي لتسجيل الحضور، ومتابعة الحفظ، والتواصل المستمر مع أولياء الأمور.',
      f3_title: 'مناهج متوازنة وشاملة',
      f3_desc: 'مواءمة محكمة بين حفظ القرآن الكريم والتربية الأخلاقية، والتحصيل الدراسي المتفوق.',
      contact_pill: 'نحن هنا لمساعدتكم',
      contact_title: 'تواصل معنا واستفسر عن التسجيل',
      contact_subtitle: 'أبواب مدرستنا مفتوحة دائماً لاستقبالكم والإجابة عن جميع استفساراتكم',
      contact_info_title: 'معلومات التواصل المباشر',
      contact_info_desc: 'يمكنكم زيارتنا في مقر المدرسة أو التواصل معنا عبر الهاتف أو المنصات الرقمية.',
      contact_phone_label: 'رقم الهاتف',
      contact_email_label: 'البريد الإلكتروني',
      contact_address_label: 'عنوان المدرسة',
      contact_hours_label: 'أوقات العمل',
      contact_hours_val: 'السبت - الخميس: 08:00 ص - 17:00 م',
      social_title: 'تابعونا على منصات التواصل الاجتماعي',
      form_title: 'أرسل لنا استفسارك أو طلب التسجيل',
      form_name_label: 'الاسم الكامل',
      form_name_placeholder: 'أدخل اسمك الكريم...',
      form_phone_label: 'رقم الهاتف',
      form_phone_placeholder: 'مثال: 0696002541',
      form_formation_label: 'البرنامج أو التكوين المطلوب',
      form_formation_select: 'اختر البرنامج المطلوب...',
      form_msg_label: 'رسالتك أو استفسارك',
      form_msg_placeholder: 'اكتب استفسارك هنا وسنتواصل معك في أقرب وقت...',
      form_submit_btn: 'إرسال الاستفسار الآن',
      footer_about: 'مدرسة الرضوان لعلوم القرآن - صرح تربوي وتعليمي رائد ببلدية قجال، ولاية سطيف. نسعى لتخريج حفظة لكتاب الله متقنين وناجحين في مسيرتهم العلمية والحياتية.',
      footer_quick_links: 'روابط سريعة',
      footer_rights: 'جميع الحقوق محفوظة لمدرسة الرضوان © 2026 - نظام School Manager تم التطوير بواسطة شركة RDesign',
      footer_privacy: 'سياسة الخصوصية والاستخدام',
      modal_title: 'طلب التسجيل والاستفسار عن البرنامج',
      modal_close: 'إغلاق',
      toast_sent: 'شكراً لتواصلك! تم استلام طلبك بنجاح وسيتواصل معك فريق المدرسة قريباً بإذن الله.',
      nav_order_system: 'طلب النظام 🚀',
      order_sys_pill: 'حلول برمجية للمؤسسات التعليمية',
      order_sys_title: 'هل أعجبك نظام إدارة المدرسة؟ اطلبه لمؤسستك الآن!',
      order_sys_subtitle: 'احصل على نسختك المخصصة من منصة School Manager لإدارة مدرسة قرآنية، مدرسة خاصة، أو مركز تعليمي بأعلى معايير الاحترافية والسهولة.',
      sys_edition_tag: 'الإصدار المؤسساتي 2026',
      sys_brand_lead: 'نظام متكامل صُمم لرقمنة إدارة المدارس القرآنية والتعليمية بأحدث التقنيات',
      sys_f1_title: 'إدارة شاملة وشخصية لمؤسستك',
      sys_f1_desc: 'شعاركم، هويتكم البصرية، وبياناتكم الخاصة في بيئة آمنة ومستقلة تماماً.',
      sys_f2_title: 'متابعة حلقات القرآن والتسميع',
      sys_f2_desc: 'بطاقات متابعة فردية، تتبع الأحزاب، التجويد، والإسناد المتصل.',
      sys_f3_title: 'تسجيل الحضور الذكي',
      sys_f3_desc: 'رصد فوري لغياب وتأخر الطلاب والأساتذة مع طباعة تقارير فورية.',
      sys_f4_title: 'إدارة الاشتراكات والمالية',
      sys_f4_desc: 'سندات قبض، متابعة الديون، تقارير المصاريف والأرباح الدورية.',
      sys_f5_title: 'فضاءات رقمية للتلميذ والأستاذ',
      sys_f5_desc: 'واجهة تفاعلية سهلة الاستخدام ومتوافقة كلياً مع جميع الهواتف الذكية.',
      sys_f6_title: 'تثبيت سريع ودعم فني مستمر',
      sys_f6_desc: 'استضافة سحابية فائقة السرعة أو تثبيت محلي مع تدريب مجاني للطاقم.',
      order_form_heading: 'استمارة طلب النظام أو حجز عرض توضيحي (Demo)',
      order_form_subheading: 'املأ الاستمارة وسيتواصل معك فريق التطوير لتقديم العرض المالي والعرض التجريبي مجاناً.',
      order_form_name_label: 'الاسم الكامل واللقب',
      order_form_phone_label: 'رقم الهاتف / واتساب',
      order_form_school_label: 'اسم المؤسسة أو المدرسة',
      order_form_type_label: 'نوع المؤسسة التعليمية',
      order_form_wilaya_label: 'الولاية أو المدينة',
      order_form_notes_label: 'ملاحظات أو متطلبات خاصة (اختياري)',
      btn_submit_order_sys: 'إرسال طلب النظام الآن',
      btn_sys_whatsapp: 'واتساب مباشر (+213669453240)',
      btn_sys_call: 'اتصال مباشر (+213669453240)',
      sys_order_success: 'شكراً لاهتمامك! تم استلام طلبك وإرسال إشعار فوري إلى فريق التطوير (r.design.boite@gmail.com)، وسنتواصل معك في أقرب وقت لتقديم العرض والتجربة المجانية.'
    },
    en: {
      site_title: 'El-Ridwan School of Quranic Sciences | Leading Educational Institution',
      school_name: 'El-Ridwan Quranic School',
      school_tagline: 'Guidjel - Sétif, Algeria',
      nav_home: 'Home',
      nav_about: 'About Us',
      nav_formations: 'Formations & Programs',
      nav_stats: 'Statistics',
      nav_features: 'Why Us',
      nav_contact: 'Contact',
      login_portal_btn: 'Student & Teacher Portal',
      hero_badge: 'Premier Institution for Quranic Studies & Excellence',
      hero_title_1: 'Nurturing Values, Teaching Quran,',
      hero_title_gradient: 'Building Future Leaders',
      hero_desc: 'Welcome to El-Ridwan Quranic School in Guidjel, Sétif. Combining authentic Quranic memorization with modern educational technology for well-rounded academic success.',
      hero_btn_formations: 'Explore Our Programs',
      hero_btn_portal: 'Access Client Portal',
      floating_chip_quran: 'Certified Quranic Chains (Sanad)',
      floating_chip_portal: 'Smart Digital Attendance Portal',
      stats_students_label: 'Enrolled Students',
      stats_teachers_label: 'Qualified Scholars & Teachers',
      stats_formations_label: 'Accredited Formations',
      stats_success_label: 'Memorization & Success Rate',
      formations_pill: 'Gateway to Knowledge & Mastery',
      formations_title: 'Available Formations & Programs',
      formations_subtitle: 'Carefully designed curricula suited for children, adolescents, and adults',
      tab_all: 'All Programs',
      tab_quran: 'Quranic Sciences',
      tab_preparatory: 'Preparatory Preschool',
      tab_support: 'Academic Support & Literacy',
      card_btn_inquire: 'Register / Inquire',
      card_duration_label: 'hrs/week',
      card_places_label: 'seats available',
      features_pill: 'Why El-Ridwan School?',
      features_title: 'Excellence in Education & Character Building',
      features_subtitle: 'Delivering the highest pedagogical standards in a calm, inspiring environment',
      f1_title: 'Certified & Dedicated Scholars',
      f1_desc: 'Distinguished educators and Quran scholars equipped with modern instructional methods.',
      f2_title: 'Smart Digital Attendance System',
      f2_desc: 'Online tracking portal for real-time attendance, progress evaluations, and parent engagement.',
      f3_title: 'Balanced & Holistic Curriculum',
      f3_desc: 'Harmonious integration of Quran memorization, moral values, and academic reinforcement.',
      contact_pill: 'We Are Here to Help',
      contact_title: 'Get In Touch & Enroll Today',
      contact_subtitle: 'Our doors are open to welcome you and answer all your enrollment inquiries',
      contact_info_title: 'Direct Contact Details',
      contact_info_desc: 'Visit our school campus in Guidjel or reach out via phone, email, and social networks.',
      contact_phone_label: 'Phone Number',
      contact_email_label: 'Email Address',
      contact_address_label: 'School Address',
      contact_hours_label: 'Working Hours',
      contact_hours_val: 'Saturday - Thursday: 8:00 AM - 5:00 PM',
      social_title: 'Follow Us on Social Media',
      form_title: 'Send Us an Inquiry or Registration Request',
      form_name_label: 'Full Name',
      form_name_placeholder: 'Enter your full name...',
      form_phone_label: 'Phone Number',
      form_phone_placeholder: 'e.g., 0696002541',
      form_formation_label: 'Desired Program',
      form_formation_select: 'Select a program...',
      form_msg_label: 'Your Message / Inquiry',
      form_msg_placeholder: 'Write your questions or notes here...',
      form_submit_btn: 'Submit Inquiry Now',
      footer_about: 'El-Ridwan School of Quranic Sciences - A premier educational and spiritual hub located in Guidjel, Sétif. Dedicated to graduating disciplined memorizers and scholars.',
      footer_quick_links: 'Quick Links',
      footer_rights: 'All rights reserved © 2026 El-Ridwan School - School Manager System Developed by RDesign Company',
      footer_privacy: 'Privacy Policy & Terms',
      modal_title: 'Program Inquiry & Pre-Registration',
      modal_close: 'Close',
      toast_sent: 'Thank you! Your inquiry has been submitted successfully. The school administration will contact you soon.',
      nav_order_system: 'Order System 🚀',
      order_sys_pill: 'Software Solutions for Educational Centers',
      order_sys_title: 'Like This School Platform? Order It for Your School!',
      order_sys_subtitle: 'Get your tailored edition of School Manager to digitize and manage your Quranic school, private academy, or training center with excellence.',
      sys_edition_tag: 'Institutional Edition 2026',
      sys_brand_lead: 'Comprehensive platform engineered to digitize Quranic and private schools.',
      sys_f1_title: 'Customized Institution Management',
      sys_f1_desc: 'Your unique logo, colors, and student records in a dedicated and secure environment.',
      sys_f2_title: 'Quran Circles & Recitation Tracking',
      sys_f2_desc: 'Individual student cards, tracking Hizbs, Surahs, Tajweed rules, and Sanad.',
      sys_f3_title: 'Smart Attendance System',
      sys_f3_desc: 'Real-time attendance logging for students and teachers with instant reporting.',
      sys_f4_title: 'Fees, Subscriptions & Finance',
      sys_f4_desc: 'Digital receipts, dues reminders, expense tracking, and financial statements.',
      sys_f5_title: 'Dedicated Portals for Students & Teachers',
      sys_f5_desc: 'Modern responsive portals accessible smoothly across phones and PCs.',
      sys_f6_title: 'Fast Deployment & Continuous Support',
      sys_f6_desc: 'High-speed cloud hosting or local server setup with free staff training.',
      order_form_heading: 'Order School Manager or Request a Free Demo',
      order_form_subheading: 'Fill out the form and our team will contact you with a customized quotation and demo.',
      order_form_name_label: 'Full Name',
      order_form_phone_label: 'Phone / WhatsApp',
      order_form_school_label: 'School or Center Name',
      order_form_type_label: 'Type of Educational Center',
      order_form_wilaya_label: 'Wilaya / City',
      order_form_notes_label: 'Special Requirements / Notes (Optional)',
      btn_submit_order_sys: 'Submit System Order Now',
      btn_sys_whatsapp: 'Direct WhatsApp (+213669453240)',
      btn_sys_call: 'Direct Call (+213669453240)',
      sys_order_success: 'Thank you for your interest! Your request has been received and forwarded to the development team (r.design.boite@gmail.com). We will contact you shortly with your demo and quotation.'
    }
  };

  // --- State ---
  let currentLang = localStorage.getItem('school_system_lang') || localStorage.getItem('app_lang') || 'ar';
  let liveFormations = DEFAULT_FORMATIONS;
  let liveCounts = DEFAULT_COUNTS;

  // --- API Fetch Helper ---
  function getApiBase() {
    const l = window.location;
    if (l.protocol === 'file:' || l.hostname === 'localhost' || l.hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    }
    return '';
  }

  // --- Dedicated Local Course Image Resolver ---
  function getCourseLocalImage(f) {
    if (!f) return 'client_ui/img/courses/course-quran-primary.svg';
    const id = Number(f.id);
    const title = (f.title || f.title_ar || '').toLowerCase();

    if (id === 8 || title.includes('تمهيدي')) return 'client_ui/img/courses/course-tamhidi.svg';
    if (id === 7 || title.includes('تحضيري')) return 'client_ui/img/courses/course-tahdiri.svg';
    if (id === 6 || (title.includes('قرآن') && title.includes('ابتدائي'))) return 'client_ui/img/courses/course-quran-primary.svg';
    if (id === 5 || (title.includes('قرآن') && (title.includes('متوسط') || title.includes('ثانوي')))) return 'client_ui/img/courses/course-quran-secondary.svg';
    if (id === 4 || (title.includes('قرآن') && title.includes('تلقين'))) return 'client_ui/img/courses/course-quran-talaqqi.svg';
    if (id === 3 || title.includes('أمية')) return 'client_ui/img/courses/course-literacy.svg';
    if (id === 2 || title.includes('رياضيات')) return 'client_ui/img/courses/course-math.svg';

    if (f.type === 'quran' || title.includes('قرآن')) return 'client_ui/img/courses/course-quran-primary.svg';
    if (f.type === 'preparatory' || title.includes('أطفال')) return 'client_ui/img/courses/course-tahdiri.svg';
    return 'client_ui/img/courses/course-literacy.svg';
  }

  // --- Populate Inquiry Select Dropdown ---
  function populateFormSelect() {
    const selectEl = document.getElementById('inquiry-formation-select');
    if (!selectEl) return;

    const isAr = (currentLang === 'ar');
    const defaultPlaceholder = isAr ? 'اختر البرنامج المطلوب...' : 'Select desired program...';
    const prevVal = selectEl.value;

    selectEl.innerHTML = `<option value="" id="opmsgsend" data-i18n="form_formation_select">${defaultPlaceholder}</option>`;

    liveFormations.forEach(f => {
      const title = isAr ? f.title_ar : f.title_en;
      const opt = document.createElement('option');
      opt.value = title;
      opt.textContent = title + (f.price ? ` (${f.price})` : '');
      if (prevVal && prevVal === title) {
        opt.selected = true;
      }
      selectEl.appendChild(opt);
    });
  }

  async function fetchLandingData() {
    try {
      const res = await fetch(getApiBase() + '/api/public/landing-data');
      if (res.ok) {
        const data = await res.json();
        if (data && data.success) {
          // 1. Dynamic School Profile Information from DB
          if (data.school) {
            const school = data.school;
            const schoolName = (school.name || '').trim();
            const navLogo = document.getElementById('nav-school-logo');
            const heroLogo = document.getElementById('hero-school-logo');
            const footerLogo = document.getElementById('footer-school-logo');

            // School Logo (Direct from DB)
            const dbLogo = (school.logo || school.logo2 || '').trim();
            const fallbackLogo = 'client_ui/img/logo/elridwan-logo.svg';
            const logoToUse = dbLogo || fallbackLogo;

            if (navLogo) {
              navLogo.src = logoToUse;
              navLogo.onerror = function () { this.onerror = null; this.src = fallbackLogo; };
              if (schoolName) navLogo.alt = 'شعار ' + schoolName;
            }
            if (heroLogo) {
              heroLogo.src = logoToUse;
              heroLogo.onerror = function () { this.onerror = null; this.src = fallbackLogo; };
              if (schoolName) heroLogo.alt = 'شعار ' + schoolName;
            }
            if (footerLogo) {
              footerLogo.src = logoToUse;
              footerLogo.onerror = function () { this.onerror = null; this.src = fallbackLogo; };
              if (schoolName) footerLogo.alt = 'شعار ' + schoolName;
            }

            // School Name
            if (schoolName) {
              TRANSLATIONS.ar.school_name = schoolName;
              TRANSLATIONS.en.school_name = schoolName;
              document.querySelectorAll('[data-i18n="school_name"]').forEach(el => {
                el.textContent = schoolName;
              });
              document.querySelectorAll('.logo-brand').forEach(el => {
                el.title = schoolName;
              });
              document.title = (currentLang === 'ar')
                ? `${schoolName} | الصرح التعليمي الرائد`
                : `${schoolName} | Leading Educational Institution`;

              const footerRights = document.querySelector('[data-i18n="footer_rights"]');
              if (footerRights) {
                footerRights.textContent = `جميع الحقوق محفوظة لـ ${schoolName} © ${new Date().getFullYear()} - نظام School Manager تم التطوير بواسطة شركة RDesign`;
              }
            }

            // School Location / Tagline
            const parts = [
              school.municipality ? school.municipality.trim() : '',
              (school.district && school.district.trim() !== (school.municipality || '').trim()) ? school.district.trim() : '',
              school.state ? 'ولاية ' + school.state.trim() : ''
            ].filter(Boolean);
            const schoolLoc = parts.join(' - ') || (school.address ? school.address.trim() : '') || 'قجال - ولاية سطيف';

            TRANSLATIONS.ar.school_tagline = schoolLoc;
            TRANSLATIONS.en.school_tagline = schoolLoc;
            document.querySelectorAll('[data-i18n="school_tagline"]').forEach(el => {
              el.textContent = schoolLoc;
            });

            // Address display in Contact section
            const fullAddress = [school.address ? school.address.trim() : '', schoolLoc].filter(Boolean).join('، ');
            const addrVal = document.querySelector('.contact-channel-item [data-i18n="school_tagline"]');
            if (addrVal) addrVal.textContent = fullAddress;

            // Phone
            const phone = school.phone_landline || school.phone_1 || school.phone_2;
            if (phone) {
              const cleanPhone = phone.trim();
              document.querySelectorAll('a[href^="tel:"]').forEach(a => {
                a.href = 'tel:' + cleanPhone;
                const phoneVal = a.querySelector('.channel-val');
                if (phoneVal) phoneVal.textContent = cleanPhone;
              });
              const contactPhoneInp = document.getElementById('contact-phone');
              if (contactPhoneInp) contactPhoneInp.placeholder = 'مثال: ' + cleanPhone;
            }

            // Email
            if (school.email) {
              const cleanEmail = school.email.trim();
              document.querySelectorAll('a[href^="mailto:"]').forEach(a => {
                a.href = 'mailto:' + cleanEmail;
                const emailVal = a.querySelector('.channel-val');
                if (emailVal) emailVal.textContent = cleanEmail;
              });
            }

            // Social Media Links
            if (school.fb) {
              const fbBtn = document.querySelector('.social-link-fb');
              if (fbBtn) fbBtn.href = school.fb.trim();
            }
            if (school.whatsapp || phone) {
              const rawWa = (school.whatsapp || phone).replace(/\D/g, '');
              const waNum = rawWa.startsWith('0') ? '213' + rawWa.substring(1) : rawWa;
              const waBtn = document.querySelector('.social-link-wa');
              if (waBtn) waBtn.href = 'https://wa.me/' + waNum;
            }
            if (school.youtube) {
              const ytBtn = document.querySelector('.social-link-yt');
              if (ytBtn) ytBtn.href = school.youtube.trim();
            }
            if (school.linkedin) {
              const tgBtn = document.querySelector('.social-link-tg');
              if (tgBtn) tgBtn.href = school.linkedin.trim();
            }
          }

          // 2. Live Counts from Database
          if (data.counts) {
            liveCounts = {
              students: Number(data.counts.students || DEFAULT_COUNTS.students),
              teachers: Number(data.counts.teachers || DEFAULT_COUNTS.teachers),
              formations: Number(data.counts.formations || DEFAULT_COUNTS.formations),
              success_rate: 99
            };
            updateStatsNumbers();
          }

          // 3. Dynamic Formations from Database
          if (Array.isArray(data.formations) && data.formations.length > 0) {
            liveFormations = data.formations.map((f) => {
              const matchedDefault = DEFAULT_FORMATIONS.find(df => df.id === f.id);
              const titleLower = (f.title || '').toLowerCase();
              let category = 'support';
              let catAr = 'تكوين معتمد';
              let catEn = 'Certified Course';

              if (f.type === 'quran' || titleLower.includes('قرآن') || titleLower.includes('تلقين')) {
                category = 'quran';
                catAr = 'علوم القرآن';
                catEn = 'Quranic Sciences';
              } else if (f.type === 'preparatory' || titleLower.includes('تحضيري') || titleLower.includes('تمهيدي')) {
                category = 'preparatory';
                catAr = 'القسم التحضيري';
                catEn = 'Preparatory';
              } else if (titleLower.includes('أمية') || titleLower.includes('دعم') || titleLower.includes('رياضيات')) {
                category = 'support';
                catAr = 'الدعم ومحو الأمية';
                catEn = 'Support & Literacy';
              } else if (matchedDefault) {
                category = matchedDefault.category;
                catAr = matchedDefault.category_label_ar;
                catEn = matchedDefault.category_label_en;
              }

              const priceNum = Number(f.price);
              const priceMonthlyNum = Number(f.price_monthly);
              let priceDisplay = 'مجاني';
              if (priceNum > 0) {
                priceDisplay = `${priceNum} د.ج`;
              } else if (priceMonthlyNum > 0) {
                priceDisplay = `${priceMonthlyNum} د.ج/شهر`;
              } else if (matchedDefault) {
                priceDisplay = matchedDefault.price;
              }

              // Course image directly from DB (f.image) - no generated images
              const dbCourseImg = (f.image && typeof f.image === 'string') ? f.image.trim() : '';
              const chosenImage = dbCourseImg || matchedDefault?.image || 'client_ui/img/courses/1.jpg';

              return {
                id: f.id,
                title_ar: (f.title || '').trim() || matchedDefault?.title_ar || 'تكوين تعليمي',
                title_en: matchedDefault?.title_en || (f.title || '').trim() || 'Educational Course',
                category: category,
                category_label_ar: catAr,
                category_label_en: catEn,
                description_ar: (f.description || '').trim() || matchedDefault?.description_ar || 'برنامج تعليمي متميز تحت إشراف نخبة من الأساتذة.',
                description_en: matchedDefault?.description_en || (f.description || '').trim() || 'Distinguished academic program guided by expert teachers.',
                image: chosenImage,
                fallback_image: 'client_ui/img/courses/1.jpg',
                niveau_ar: (f.niveau || '').trim() || matchedDefault?.niveau_ar || 'مختلف المستويات',
                niveau_en: matchedDefault?.niveau_en || (f.niveau || '').trim() || 'All Levels',
                duration_hours: f.duration_hours || matchedDefault?.duration_hours || 4,
                places: f.places || matchedDefault?.places || 30,
                price: priceDisplay
              };
            });

            renderFormations();
            populateFormSelect();
          }
        }
      }
    } catch (err) {
      console.warn('API sync notice:', err.message);
    }
  }

  // --- Translation Application ---
  function applyLanguage(lang) {
    currentLang = lang;
    document.documentElement.lang = lang;
    document.documentElement.dir = (lang === 'ar') ? 'rtl' : 'ltr';
    document.body.setAttribute('dir', (lang === 'ar') ? 'rtl' : 'ltr');

    const t = TRANSLATIONS[lang] || TRANSLATIONS.ar;
    document.title = t.site_title;

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (t[key] !== undefined) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.setAttribute('placeholder', t[key]);
        } else {
          el.textContent = t[key];
        }
      }
    });

    const langBtnText = document.getElementById('lang-switch-text');
    if (langBtnText) {
      langBtnText.textContent = (lang === 'ar') ? 'English' : 'العربية';
    }

    renderFormations();
    populateFormSelect();
  }

  // --- Formations Rendering ---
  function renderFormations(filterCategory = 'all') {
    const grid = document.getElementById('formations-grid');
    if (!grid) return;

    const isAr = (currentLang === 'ar');
    const items = (filterCategory === 'all')
      ? liveFormations
      : liveFormations.filter(f => f.category === filterCategory);

    grid.innerHTML = items.map(f => {
      const title = isAr ? f.title_ar : f.title_en;
      const desc = isAr ? f.description_ar : f.description_en;
      const niveau = isAr ? f.niveau_ar : f.niveau_en;
      const durationLabel = isAr ? 'ساعات' : 'hrs';
      const placesLabel = isAr ? 'مقعد' : 'seats';
      const inquireBtnText = isAr ? 'طلب تسجيل واستفسار' : 'Inquire & Register';
      const fallback = f.fallback_image || 'client_ui/img/courses/1.jpg';

      return `
        <div class="formation-card" data-category="${f.category}">
          <div class="formation-thumb-wrap">
            <img src="${f.image}" alt="${title}" class="formation-thumb" onerror="this.onerror=null; this.src='${fallback}';" loading="lazy">
            <span class="formation-badge-niveau"><i class="fa fa-bookmark"></i> ${niveau}</span>
            <span class="formation-badge-price">${f.price}</span>
          </div>
          <div class="formation-content">
            <h4 class="formation-title">${title}</h4>
            <p class="formation-desc">${desc}</p>
            <div class="formation-meta">
              <span class="meta-item"><i class="fa fa-clock-o"></i> ${f.duration_hours} ${durationLabel}</span>
              <span class="meta-item"><i class="fa fa-users"></i> ${f.places} ${placesLabel}</span>
            </div>
            <button class="btn-formation-inquire" data-formation-id="${f.id}" data-formation-title="${title}">
              <i class="fa fa-paper-plane-o"></i> ${inquireBtnText}
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Attach inquire click handlers
    grid.querySelectorAll('.btn-formation-inquire').forEach(btn => {
      btn.addEventListener('click', () => {
        const title = btn.getAttribute('data-formation-title');
        openInquireModal(title);
      });
    });
  }

  // --- Populate Inquiry Select Dropdown ---
  function populateFormSelect() {
    const sel = document.getElementById('inquiry-formation-select');
    if (!sel) return;

    const isAr = (currentLang === 'ar');
    const defaultOption = isAr ? '-- اختر البرنامج المطلوب --' : '-- Select a Program --';

    sel.innerHTML = `<option value="">${defaultOption}</option>` +
      liveFormations.map(f => {
        const title = isAr ? f.title_ar : f.title_en;
        return `<option value="${title}">${title} (${f.price})</option>`;
      }).join('');
  }

  // --- Animated Statistics Counters ---
  let countersAnimated = false;
  function updateStatsNumbers() {
    const sEl = document.getElementById('stat-students-num');
    const tEl = document.getElementById('stat-teachers-num');
    const fEl = document.getElementById('stat-formations-num');
    const rEl = document.getElementById('stat-success-num');

    if (sEl) sEl.setAttribute('data-target', liveCounts.students);
    if (tEl) tEl.setAttribute('data-target', liveCounts.teachers);
    if (fEl) fEl.setAttribute('data-target', liveCounts.formations);
    if (rEl) rEl.setAttribute('data-target', liveCounts.success_rate);

    if (countersAnimated) {
      if (sEl) sEl.textContent = liveCounts.students + '+';
      if (tEl) tEl.textContent = liveCounts.teachers + '+';
      if (fEl) fEl.textContent = liveCounts.formations + '+';
      if (rEl) rEl.textContent = liveCounts.success_rate + '%';
    }
  }

  function startCountersAnimation() {
    if (countersAnimated) return;
    countersAnimated = true;

    const targets = [
      { id: 'stat-students-num', val: liveCounts.students, suffix: '+' },
      { id: 'stat-teachers-num', val: liveCounts.teachers, suffix: '+' },
      { id: 'stat-formations-num', val: liveCounts.formations, suffix: '+' },
      { id: 'stat-success-num', val: liveCounts.success_rate, suffix: '%' }
    ];

    targets.forEach(item => {
      const el = document.getElementById(item.id);
      if (!el) return;

      const duration = 1800;
      const start = 0;
      const end = item.val;
      const startTime = performance.now();

      function step(now) {
        const progress = Math.min((now - startTime) / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const currentVal = Math.floor(easeProgress * (end - start) + start);
        el.textContent = currentVal + item.suffix;

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          el.textContent = end + item.suffix;
        }
      }

      requestAnimationFrame(step);
    });
  }

  // --- Setup Intersection Observer for Stats ---
  function setupStatsObserver() {
    const section = document.getElementById('statistics');
    if (!section) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          startCountersAnimation();
          observer.unobserve(section);
        }
      });
    }, { threshold: 0.25 });

    observer.observe(section);
  }

  // --- Header Scroll Effect ---
  function setupHeaderScroll() {
    const header = document.querySelector('.site-header');
    if (!header) return;

    window.addEventListener('scroll', () => {
      if (window.scrollY > 40) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });
  }

  // --- Filter Tabs Event Listeners ---
  function setupFilterTabs() {
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const cat = btn.getAttribute('data-filter');
        renderFormations(cat);
      });
    });
  }

  // --- Inquire Modal Logic ---
  function openInquireModal(preselectedFormation = '') {
    const modal = document.getElementById('inquire-modal');
    if (!modal) return;

    modal.classList.add('active');
    const selectEl = document.getElementById('inquiry-formation-select');
    if (selectEl && preselectedFormation) {
      for (let i = 0; i < selectEl.options.length; i++) {
        if (selectEl.options[i].value.includes(preselectedFormation)) {
          selectEl.selectedIndex = i;
          break;
        }
      }
    }
  }

  function closeInquireModal() {
    const modal = document.getElementById('inquire-modal');
    if (modal) modal.classList.remove('active');
  }

  // --- Toast Helper ---
  function showToast(msg) {
    let toast = document.getElementById('landing-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'landing-toast';
      toast.className = 'landing-toast';
      document.body.appendChild(toast);
    }
    toast.innerHTML = `<i class="fa fa-check-circle" style="font-size: 1.2rem;"></i> <span>${msg}</span>`;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 4500);
  }

  // --- Send Inquiry to Backend API ---
  function sendInquiryToBackend(payload) {
    return fetch(getApiBase() + '/api/public/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (res) {
      return res.json();
    }).catch(function (err) {
      console.warn('Backend inquiry save warning:', err);
      return { success: true };
    });
  }

  // --- Contact Form Submission ---
  function setupContactForm() {
    const form = document.getElementById('main-contact-form');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        const submitBtn = form.querySelector('button[type="submit"]');
        const origText = submitBtn ? submitBtn.innerHTML : '';
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> جاري الإرسال...';
        }

        const name = document.getElementById('contact-name')?.value;
        const phone = document.getElementById('contact-phone')?.value;
        const formation_title = document.getElementById('inquiry-formation-select')?.value;
        const message = document.getElementById('contact-msg')?.value;

        sendInquiryToBackend({ name: name, phone: phone, formation_title: formation_title, message: message })
          .finally(function () {
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.innerHTML = origText;
            }
            const t = TRANSLATIONS[currentLang] || TRANSLATIONS.ar;
            showToast(t.toast_sent);
            form.reset();
          });
      });
    }

    const modalForm = document.getElementById('modal-inquire-form');
    if (modalForm) {
      modalForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const modalBtn = modalForm.querySelector('button[type="submit"]');
        const origText = modalBtn ? modalBtn.innerHTML : '';
        if (modalBtn) {
          modalBtn.disabled = true;
          modalBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> جاري الإرسال...';
        }

        const name = modalForm.querySelector('input[type="text"]')?.value;
        const phone = modalForm.querySelector('input[type="tel"]')?.value;
        const formation_title = document.getElementById('inquiry-formation-select')?.value;
        const message = modalForm.querySelector('textarea')?.value;

        sendInquiryToBackend({ name: name, phone: phone, formation_title: formation_title, message: message })
          .finally(function () {
            if (modalBtn) {
              modalBtn.disabled = false;
              modalBtn.innerHTML = origText;
            }
            const t = TRANSLATIONS[currentLang] || TRANSLATIONS.ar;
            showToast(t.toast_sent);
            modalForm.reset();
            closeInquireModal();
          });
      });
    }
  }

  // --- School Manager System Order Form Submission ---
  function setupSystemOrderForm() {
    const form = document.getElementById('system-order-form');
    if (!form) {
      console.warn('[OrderForm] form#system-order-form not found in DOM');
      return;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const submitBtn = document.getElementById('btn-sys-submit');
      const origText = submitBtn ? submitBtn.innerHTML : '';
      const statusBox = document.getElementById('sys-order-status');

      console.log('[OrderForm] Submit triggered');

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> ' + (currentLang === 'ar' ? 'جاري إرسال الطلب...' : 'Sending Request...');
      }
      if (statusBox) {
        statusBox.style.display = 'none';
        statusBox.className = 'sys-order-status';
      }

      const name = document.getElementById('sys-name')?.value?.trim() || '';
      const phone = document.getElementById('sys-phone')?.value?.trim() || '';
      const school = document.getElementById('sys-school')?.value?.trim() || '';
      const type = document.getElementById('sys-type')?.value?.trim() || '';
      const wilaya = document.getElementById('sys-wilaya')?.value?.trim() || 'غير محدد';
      const notes = document.getElementById('sys-notes')?.value?.trim() || 'لا توجد ملاحظات إضافية';

      console.log('[OrderForm] Sending to /api/public/order-system:', { name, phone, school, type, wilaya });

      fetch(getApiBase() + '/api/public/order-system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, school, type, wilaya, notes })
      })
      .then(function (res) {
        console.log('[OrderForm] HTTP status:', res.status);
        return res.json().then(function (data) {
          if (!res.ok) {
            throw new Error(data.message || 'Error sending request');
          }
          return data;
        });
      })
      .then(function (data) {
        console.log('[OrderForm] Success response:', data);
        const t = TRANSLATIONS[currentLang] || TRANSLATIONS.ar;
        const successMsg = t.sys_order_success;

        // Show status box FIRST (before reset)
        if (statusBox) {
          statusBox.textContent = successMsg;
          statusBox.className = 'sys-order-status success';
          statusBox.style.display = 'block';
          // Scroll status into view
          statusBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        // Show toast notification
        showToast(successMsg);

        // Reset form fields after a short delay so user sees the message
        setTimeout(function () { form.reset(); }, 300);
      })
      .catch(function (err) {
        console.error('[OrderForm] Error:', err);
        const fallbackMsg = currentLang === 'ar'
          ? 'حدث خطأ أثناء الإرسال. يرجى المحاولة مرة أخرى أو التواصل عبر واتساب (+213669453240).'
          : 'Failed to send. Please try again or contact us via WhatsApp (+213669453240).';
        if (statusBox) {
          statusBox.textContent = err.message || fallbackMsg;
          statusBox.className = 'sys-order-status error';
          statusBox.style.display = 'block';
          statusBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      })
      .finally(function () {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = origText;
        }
      });
    });
  }

  // --- Mobile Menu Toggle ---
  function setupMobileMenu() {
    const btn = document.getElementById('mobile-menu-btn');
    const menu = document.getElementById('nav-menu');
    if (btn && menu) {
      btn.addEventListener('click', () => {
        menu.classList.toggle('open');
      });

      menu.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
          menu.classList.remove('open');
        });
      });
    }
  }

  // --- Language Switcher Button ---
  function setupLangSwitcher() {
    const btn = document.getElementById('btn-lang-toggle');
    if (btn) {
      btn.addEventListener('click', () => {
        const nextLang = (currentLang === 'ar') ? 'en' : 'ar';
        localStorage.setItem('school_system_lang', nextLang);
        localStorage.setItem('app_lang', nextLang);
        applyLanguage(nextLang);
      });
    }
  }

  // --- Modal Close Buttons ---
  function setupModalEvents() {
    document.querySelectorAll('[data-close-modal]').forEach(el => {
      el.addEventListener('click', closeInquireModal);
    });

    const modal = document.getElementById('inquire-modal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeInquireModal();
      });
    }
  }

  // --- Initialize on DOM Loaded ---
  document.addEventListener('DOMContentLoaded', () => {
    applyLanguage(currentLang);
    setupHeaderScroll();
    setupStatsObserver();
    setupFilterTabs();
    setupContactForm();
    setupSystemOrderForm();
    setupMobileMenu();
    setupLangSwitcher();
    setupModalEvents();
    fetchLandingData();
  });

})();
