/**
 * i18n.js — Client UI Multilingual System (English & Arabic)
 * Provides seamless English <-> Arabic toggle, RTL styling, and live DOM translation.
 */

(function () {
  'use strict';

  var LANG_KEYS = ['school_system_lang', 'app_lang'];

  var DICT = {
    // ── Navigation & Common ──────────────────────────────────
    "Home": "الرئيسية",
    "Dashboard": "لوحة التحكم",
    "My Dashboard": "لوحة التحكم",
    "Student Space": "فضاء الطالب",
    "Teacher Space": "فضاء الأستاذ",
    "Update Profile": "تعديل الملف الشخصي",
    "My Attendance History": "سجل حضوري",
    "Attendance & Scanning": "تسجيل الحضور والمسح",
    "Salary Archive": "أرشيف الأجور",
    "Payment Archive": "أرشيف المدفوعات",
    "View your full salary payment history": "سجل دفع الرواتب والمستحقات",
    "View your full payment history": "سجل جميع المدفوعات والاشتراكات",
    "Log Out": "تسجيل الخروج",
    "Notifications": "الإشعارات",
    "Mark all read": "تحديد الكل كمقروء",
    "No new notifications": "لا توجد إشعارات جديدة",
    "Back to Dashboard": "العودة للوحة التحكم",
    "Quick Actions": "إجراءات سريعة",
    "Loading...": "جارٍ التحميل...",
    "Loading courses...": "جارٍ تحميل الدورات...",
    "Loading timetable...": "جارٍ تحميل جدول التوقيت...",
    "Loading attendance logs...": "جارٍ تحميل سجلات الحضور...",
    "No records found": "لا توجد سجلات",
    "No records": "لا توجد سجلات",
    "Save Changes": "حفظ التعديلات",
    "Saving...": "جارٍ الحفظ...",
    "Cancel": "إلغاء",
    "Profile updated successfully!": "تم تحديث الملف الشخصي بنجاح!",
    "Passwords do not match!": "كلمتا المرور غير متطابقتين!",
    "Passwords do not match": "كلمات المرور غير متطابقة",
    "My Portal": "بوابتي",
    "Student & Teacher": "الطلاب والأساتذة",
    "Student": "طالب",
    "Teacher": "أستاذ",
    "School Management System": "نظام إدارة المدرسة",

    // ── Dynamic Badges, Identifiers & Types ───────────────────
    "Reg:": "رقم التسجيل:",
    "Emp:": "رقم الموظف:",
    "Reg": "رقم التسجيل",
    "Emp": "رقم الموظف",
    "subscription": "اشتراك",
    "Subscription": "اشتراك",
    "Standard": "اشتراك قياسي",
    "standard": "اشتراك قياسي",
    "General": "عام",
    "Monthly": "شهري",
    "Quarterly": "فصلي",
    "Yearly": "سنوي",
    "Groups:": "الأفواج:",
    "Enrolled:": "تاريخ التسجيل:",
    "Enrolled": "تاريخ التسجيل",
    "Blue": "أزرق",
    "Green": "أخضر",
    "Purple": "بنفسجي",
    "Amber": "كهرماني",
    "Emerald": "زمردي",
    "Boy Student": "طالب",
    "Girl Student": "طالبة مسلمة",
    "Man Teacher": "معلم",
    "Woman Teacher": "معلمة مسلمة",

    // ── Status Badges & Pills ────────────────────────────────
    "Active Student": "طالب نشط",
    "Active Teacher": "أستاذ نشط",
    "Active Faculty": "عضو هيئة تدريس نشط",
    "Active Program": "البرنامج النشط",
    "Present": "حاضر",
    "Absent": "غائب",
    "PRESENT": "حاضر",
    "ABSENT": "غائب",
    "Recorded": "مسجل",
    "Not scanned": "غير ممسوح",
    "Logged": "مسجل",
    "Not recorded": "غير مسجل",
    "Up to date": "مُسدَّد / مُحَدَّث",
    "Subscription Payment Overdue": "اشتراكك متأخر بالدفع",
    "Subscription Due Soon": "موعد استحقاق الاشتراك قريباً",

    // ── Student Dashboard & Stats ────────────────────────────
    "Welcome back!": "مرحباً بك مجدداً!",
    "Course Type": "نوع الدورة",
    "Assigned Groups": "الأفواج المعين بها",
    "Enrolled Since": "تاريخ التسجيل",
    "Attendance Record": "نسبة الحضور",
    "My Formations & Groups": "دوراتي وأفواجي",
    "Active enrollments & assigned study groups": "الدورات والاشتراكات والأفواج المسجل بها",
    "My Weekly Planning": "جدول التوقيت الأسبوعي",
    "Timetable schedule for your enrolled groups": "أوقات الحصص والدروس للأفواج المسجلة",
    "Attendance History": "سجل الحضور",
    "Manage your email, password & photo": "تعديل البريد، كلمة المرور والصورة الشخصية",
    "View presence logs and timestamps": "متابعة سجل الحضور والغياب مع التوقيت",
    "No group assigned yet": "لم يتم تعيين أي فوج بعد",
    "No weekly classes scheduled": "لا توجد حصص مجدولة هذا الأسبوع",
    "You currently have no classes scheduled in the active program.": "لا توجد حصص دراسية مجدولة حالياً ضمن البرنامج الفعال.",

    // ── Table Column Headers ─────────────────────────────────
    "Day": "اليوم",
    "Time Slot": "الفترة الزمنية",
    "Subject": "المادة",
    "Classroom": "القاعة",
    "Teacher": "الأستاذ",
    "Group": "الفوج",
    "Date": "التاريخ",
    "Scan / Check-in Time": "وقت المسح / التسجيل",
    "Check-in / Scan Time": "وقت المسح / التسجيل",
    "Course Formation": "الدورة / التكوين",
    "Status": "الحالة",

    // ── Days of Week ─────────────────────────────────────────
    "Monday": "الإثنين",
    "Tuesday": "الثلاثاء",
    "Wednesday": "الأربعاء",
    "Thursday": "الخميس",
    "Friday": "الجمعة",
    "Saturday": "السبت",
    "Sunday": "الأحد",

    // ── Weekly Schedule & Timetable ──────────────────────────
    "Weekly Schedule": "جدول التوقيت الأسبوعي",
    "Weekly Teaching Schedule": "برنامج التدريس الأسبوعي",
    "Weekly Timetable": "جدول التوقيت الأسبوعي",
    "Teaching Timetable": "برنامج التدريس الأسبوعي",
    "Student Timetable": "جدول الحصص الأسبوعي",
    "Timetable": "جدول التوقيت",
    "Full Timetable": "جدول التوقيت الكامل",
    "View Full Timetable": "عرض جدول التوقيت الكامل",
    "Print Timetable": "طباعة جدول التوقيت",
    "Print Schedule": "طباعة البرنامج الأسبوعي",
    "Today": "اليوم",
    "Today's Sessions": "حصص اليوم",
    "Today's Séances": "حصص اليوم",
    "All Days": "جميع الأيام",
    "All Week": "كامل الأسبوع",
    "Weekly Sessions": "الحصص الأسبوعية",
    "Total Sessions": "إجمالي الحصص",
    "Weekly Hours": "الساعات الأسبوعية",
    "Sessions": "الحصص",
    "Session": "حصة",
    "séance": "حصة",
    "séances": "حصص",
    "Active Programs": "البرامج النشطة",
    "All Programs": "جميع البرامج",
    "Filter by Day": "تصفية حسب اليوم",
    "Filter by Group": "تصفية حسب الفوج",
    "All Groups": "جميع الأفواج",
    "Grid View": "عرض الجدول",
    "Cards View": "عرض البطاقات",
    "List View": "عرض القائمة",
    "No sessions today": "لا توجد حصص مبرمجة لليوم",
    "No sessions found for this day": "لا توجد حصص مجدولة لهذا اليوم",
    "There are no teaching sessions scheduled for this day.": "لا توجد حصص تدريسية مسندة في هذا اليوم.",
    "There are no classes scheduled for this day.": "لا توجد دروس أو حصص مبرمجة في هذا اليوم.",
    "Room": "القاعة",
    "Program": "البرنامج",
    "Mark Attendance": "تسجيل الحضور",
    "Take Attendance": "تسجيل الحضور",
    "Interactive weekly timetable & class sessions": "جدول تفاعلي للحصص الأسبوعية والأفواج والقاعات",
    "Complete weekly teaching timetable & group sessions": "جدول كامل لبرنامج التدريس الأسبوعي وتوزيع الحصص على الأفواج والقاعات",

    // ── Profile Page ─────────────────────────────────────────
    "Profile Information": "معلومات الملف الشخصي",
    "Update your account credentials and personal preferences": "تحديث البريد الإلكتروني، معلومات الاتصال وكلمة المرور",
    "Your Name": "اسمك الكامل",
    "Full Name": "الاسم الكامل",
    "Full Name (Official Record)": "الاسم الكامل (السجل الرسمي)",
    "Registration Number": "رقم التسجيل",
    "Registration Number (Official ID)": "رقم التسجيل (المعرف الرسمي)",
    "Employee Number": "رقم الموظف",
    "Employee Number (Official ID)": "رقم الموظف (المعرف الوظيفي)",
    "Email Address": "البريد الإلكتروني",
    "Phone Number": "رقم الهاتف",
    "Avatar Photo URL": "رابط الصورة الشخصية",
    "Enter an image URL below to customize your avatar, or pick a color preset.": "أدخل رابط الصورة بالأسفل أو اختر أحد الألوان الجاهزة.",
    "Enter an image URL below to update your faculty portrait, or select a preset color.": "أدخل رابط الصورة لتحديث صورتك الوظيفية أو اختر لوناً مناسباً.",
    "Paste a direct image link or choose a preset color above.": "الصق رابط صورة مباشر أو اختر لوناً من الخيارات أعلاه.",
    "Direct HTTPS link to your profile picture.": "رابط مباشر (HTTPS) لصورتك الشخصية.",
    "Security & Password": "الأمان وكلمة المرور",
    "Leave the password fields blank if you do not wish to change your password.": "اترك حقول كلمة المرور فارغة إذا كنت لا ترغب في تغييرها.",
    "New Password": "كلمة المرور الجديدة",
    "Confirm New Password": "تأكيد كلمة المرور الجديدة",
    "Academic Details": "البيانات الدراسية",
    "Official enrollment data": "بيانات التسجيل الرسمية",
    "Faculty Profile": "الملف الوظيفي للأستاذ",
    "Employment & teaching details": "بيانات التوظيف والتدريس",
    "Speciality": "التخصص",
    "Hire Date": "تاريخ التوظيف",
    "Faculty Status": "الحالة الوظيفية",
    "Course Formation:": "الدورة / التكوين:",
    "Formation Type:": "نوع الدورة:",
    "Enrollment Date:": "تاريخ التسجيل:",
    "Subscription Plan:": "خطة الاشتراك:",
    "Next Payment:": "تاريخ الدفع القادم:",
    "Speciality:": "التخصص:",
    "Employee Number:": "رقم الموظف:",
    "Hire Date:": "تاريخ التوظيف:",
    "Faculty Status:": "الحالة الوظيفية:",
    "To request changes to your official name or registration details, please visit the administration office.": "لتعديل بياناتك الرسمية (الاسم أو رقم التسجيل)، يرجى مراجعة إدارة المدرسة.",
    "Changes to your official employee identifier, contract status, or primary department must be authorized through the administration office.": "أي تعديل على المعرف الوظيفي أو العقد أو التخصص يجب أن يتم عبر إدارة المدرسة.",

    // ── Attendance Page ──────────────────────────────────────
    "Attendance Record": "سجل الحضور",
    "Faculty Attendance": "حضور الأساتذة",
    "Total Recorded Sessions": "إجمالي الحصص المسجلة",
    "Total Teaching Sessions": "إجمالي الحصص التدريسية",
    "Present Sessions": "عدد مرات الحضور",
    "Sessions Present": "عدد الحصص المنجزة",
    "Absences": "عدد مرات الغياب",
    "Absences / Excused": "الغيابات أو الأعذار",
    "Overall Attendance Rate": "نسبة الحضور الإجمالية",
    "Faculty Attendance Rate": "نسبة حضور الأستاذ",
    "Attendance Log History": "سجل الحضور والغياب المفصل",
    "Teaching Attendance Logs": "سجلات حضور حصص التدريس",
    "Real-time presence and scan verification history": "سجل عمليات التحقق والمسح الفوري للحضور",
    "Official presence verification logs for conducted sessions": "السجلات الرسمية لحضور حصص التدريس المعتمدة",
    "All Statuses": "جميع الحالات",
    "Present Only": "الحاضرون فقط",
    "Absent Only": "الغائبون فقط",
    "Search group or date...": "بحث بالفوج أو التاريخ...",
    "No attendance records found": "لا توجد سجلات حضور",
    "There are no attendance check-ins matching your filter criteria.": "لا توجد سجلات حضور تطابق معايير البحث الحالية.",
    "No attendance records have been registered for your teaching sessions yet.": "لم يتم تسجيل أي حضور لحصصك التدريسية حتى الآن.",

    // ── Teacher Dashboard ────────────────────────────────────
    "Welcome Professor!": "مرحباً بك يا أستاذ!",
    "Faculty Instructor": "أستاذ / مدرّس",
    "Mark Student Attendance": "تسجيل حضور الطلاب",
    "Courses Taught": "الدورات المسندة",
    "Assigned Groups": "الأفواج المسندة",
    "Hire Date": "تاريخ التعيين",
    "Active classes under your instruction": "الأفواج والدورات التعليمية المكلف بتدريسها",
    "My Weekly Teaching Schedule": "برنامج التدريس الأسبوعي",
    "Timetable schedule for your allocated lectures": "أوقات وقاعات الحصص المسندة إليك",
    "Scan student badges or manual check-in": "مسح شارات الطلاب أو التحضير اليدوي",
    "Review your logged teacher presence": "مراجعة سجل حضورك الشخصي",
    "Manage contact info & account security": "تعديل البريد، الهاتف وكلمة المرور",
    "No assigned courses": "لا توجد دورات مسندة حالياً",
    "You are not currently assigned to any active formations.": "لم يتم إسناد أي دورات نشطة لك في الوقت الحالي.",
    "No lectures scheduled": "لا توجد حصص مجدولة",
    "You have no active teaching timetable slots scheduled.": "لا توجد حصص مسندة لك في البرنامج الدراسي الفعال حالياً.",

    // ── Payment Archive (Teacher & Student) ───────────────────
    "Salary Archive": "أرشيف الأجور",
    "Payment Archive": "أرشيف المدفوعات",
    "Salary Archive — Teacher Space": "أرشيف الأجور — فضاء الأستاذ",
    "Payment History — Student Space": "أرشيف المدفوعات — فضاء الطالب",
    "Complete history of all your salary payments recorded by the administration": "سجل كامل بجميع مستحقاتك ورواتبك المسجلة من قِبل الإدارة",
    "Complete record of all your tuition payments and subscription renewals": "سجل كامل لجميع مدفوعات الرسوم الدراسية وتجديد الاشتراكات",
    "Total Payments": "إجمالي الدفعات",
    "Total Received": "إجمالي المستلم",
    "Total Paid": "إجمالي المدفوع",
    "Latest Payment": "آخر دفعة",
    "Last Payment": "آخر دفعة",
    "This Year": "هذا العام",
    "Filter by Year:": "تصفية حسب السنة:",
    "Filter by Year": "تصفية حسب السنة",
    "All Years": "جميع السنوات",
    "Payment Records": "سجلات المدفوعات",
    "records": "سجلات",
    "record": "سجل",
    "0 records": "0 سجل",
    "Month / Year": "الشهر / السنة",
    "Payment Date": "تاريخ الدفع",
    "Method": "طريقة الدفع",
    "Notes": "الملاحظات",
    "Recorded By": "سُجلت بواسطة",
    "Amount": "المبلغ",
    "Plan": "نوع الاشتراك",
    "Discount": "الخصم",
    "Apply": "تطبيق",
    "No salary payment records found.": "لا توجد سجلات أجور مسجلة حالياً.",
    "No payment records found yet.": "لا توجد سجلات مدفوعات مسجلة بعد.",
    "Failed to load payments.": "فشل تحميل سجلات المدفوعات.",
    "Cash": "نقداً",
    "Virement": "تحويل بنكي",
    "Cheque": "صك / شيك",
    "1 Month": "شهر واحد",
    "3 Months": "3 أشهر",
    "1 Year": "سنة كاملة",
    "January": "جانفي (يناير)",
    "February": "فيفري (فبراير)",
    "March": "مارس",
    "April": "أفريل (أبريل)",
    "May": "ماي (مايو)",
    "June": "جوان (يونيو)",
    "July": "جويلية (يوليو)",
    "August": "أوت (أغسطس)",
    "September": "سبتمبر",
    "October": "أكتوبر",
    "November": "نوفمبر",
    "December": "ديسمبر",

    // ── Login Portal ─────────────────────────────────────────
    "Student & Teacher Portal": "بوابة الطلاب والأساتذة",
    "Access your timetable, attendance & courses": "تابع جدولك الدراسي، سجل الحضور والدورات",
    "Students": "الطلاب",
    "Teachers": "الأساتذة",
    "Sign In to Portal": "تسجيل الدخول إلى البوابة",
    "Are you a school administrator?": "هل أنت مسؤول عن إدارة المدرسة؟",
    "Go to Admin Portal": "الانتقال إلى لوحة إدارة المدرسة",

    // ── Scanning & Attendance Admin ──────────────────────────
    "Scan RFID/QR Code or type ID here...": "امسح بطاقة RFID أو رمز QR أو اكتب المعرف هنا...",
    "Use Webcam QR": "استخدام كاميرا QR",
    "Manual Attendance Check": "تسجيل الحضور اليدوي",
    "Target Audience": "الفئة المستهدفة",
    "Group / Class": "الفوج / القسم",
    "-- All Groups --": "-- جميع الأفواج --",
    "Validate Attendance": "تأكيد وتثبيت الحضور",
    "Monthly PDF": "PDF شهري",
    "Mark Selected Present": "تحديد المختار كحاضر",
    "Mark Selected Absent": "تحديد المختار كغائب",
    "Photo": "الصورة",
    "ID Number": "رقم التعريف",
    "RFID Tag": "معرف RFID",
    "NFC / RFID Tag ID": "رقم التعريف لبطاقة NFC / RFID",
    "NFC / RFID Tag": "بطاقة NFC / RFID",
    "Scan or enter NFC/RFID Tag ID...": "امسح أو اكتب رقم تعريف بطاقة NFC / RFID...",
    "Name": "الاسم",

    // ── Student Pre-Registration ─────────────────────────────
    "Student Registration": "تسجيل طالب جديد",
    "Fill in the form below to apply for enrollment. Your account will be reviewed and activated by an administrator.": "يرجى ملء الاستمارة أدناه لتقديم طلب التسجيل. ستتم مراجعة حسابك وتفعيله من قبل إدارة المدرسة.",
    "Pending Admin Approval Required": "يتطلب موافقة وتفعيل الإدارة",
    "Personal Info": "البيانات الشخصية",
    "Academic Info": "البيانات الدراسية",
    "Confirmation": "التأكيد",
    "Personal Information": "المعلومات الشخصية",
    "Your basic personal details": "بياناتك الشخصية الأساسية",
    "First Name": "الاسم الشخصي",
    "Last Name": "اللقب",
    "Enter first name": "أدخل الاسم الشخصي",
    "Enter last name": "أدخل اللقب",
    "Email Address": "البريد الإلكتروني",
    "Phone Number": "رقم الهاتف",
    "Password": "كلمة المرور",
    "Min. 6 characters": "6 أحرف على الأقل",
    "Confirm Password": "تأكيد كلمة المرور",
    "Repeat password": "أعد إدخال كلمة المرور",
    "Gender": "الجنس",
    "— Not specified —": "— غير محدد —",
    "Male": "ذكر",
    "Female": "أنثى",
    "Date of Birth": "تاريخ الميلاد",
    "Academic Information": "المعلومات الدراسية",
    "Choose your desired formation / program": "اختر الدورة أو البرنامج المطلوب",
    "Formation / Program": "الدورة / البرنامج الدراسي",
    "— Loading formations... —": "— جاري تحميل الدورات... —",
    "— None —": "— لا يوجد —",
    "Select the program you want to enroll in (optional, admin can assign later)": "اختر البرنامج الذي ترغب في التسجيل فيه (اختياري، يمكن للإدارة تعيينه لاحقاً)",
    "Parent / Guardian Name": "اسم ولي الأمر",
    "Full name of parent/guardian": "الاسم الكامل لولي الأمر",
    "Parent / Guardian Phone": "هاتف ولي الأمر",
    "Parent contact number": "رقم هاتف ولي الأمر",
    "Additional Notes / Message": "ملاحظات أو رسالة إضافية",
    "Any special requirements, medical notes, or message to the administration...": "أي متطلبات خاصة، ملاحظات صحية، أو رسالة موجهة للإدارة...",
    "What happens next?": "ماذا يحدث بعد التسجيل؟",
    "Your registration will be saved with Pending status": "سيتم حفظ طلب تسجيلك بحالة «معلق»",
    "The school administration will review your application": "ستقوم إدارة المدرسة بمراجعة طلبك وبياناتك",
    "You will be notified once your account is activated": "سيتم إشعارك أو التواصل معك بمجرد تفعيل حسابك",
    "After activation, you can log in to the student portal": "بعد التفعيل، يمكنك تسجيل الدخول مباشرة إلى فضاء الطالب",
    "Submit Registration": "إرسال طلب التسجيل",
    "Submitting...": "جاري الإرسال...",
    "Registration Submitted!": "تم إرسال طلب التسجيل بنجاح!",
    "Pending Admin Approval": "في انتظار موافقة الإدارة",
    "Your registration has been received successfully. The school administration will review your application and activate your account shortly.": "تم استلام طلب تسجيلك بنجاح. ستراجع إدارة المدرسة طلبك وتقوم بتفعيل حسابك في أقرب وقت.",
    "Please keep your email and phone accessible. You'll be contacted when your account is activated.": "يرجى إبقاء بريدك الإلكتروني وهاتفك قيد المتابعة. سيتم التواصل معك عند تفعيل الحساب.",
    "Back to Home": "العودة للرئيسية",
    "Back to Login": "العودة لتسجيل الدخول",
    "Please enter your first and last name.": "يرجى إدخال الاسم واللقب.",
    "Please enter a valid email address.": "يرجى إدخال بريد إلكتروني صالح.",
    "Password must be at least 6 characters.": "يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.",
    "Passwords do not match.": "كلمتا المرور غير متطابقتين.",
    "Registration failed. Please try again.": "فشل التسجيل. يرجى المحاولة مرة أخرى.",
    "Network error. Please check your connection and try again.": "خطأ في الاتصال بالشبكة. يرجى المحاولة لاحقاً.",
    "Very Weak": "ضعيف جداً",
    "Weak": "ضعيف",
    "Fair": "متوسط",
    "Strong": "قوي",
    "Very Strong": "قوي جداً",
    "New Student?": "طالب جديد؟",
    "Register here": "سجّل هنا",
    "New Student? Register here": "طالب جديد؟ سجّل هنا",
    "This email is already registered.": "هذا البريد الإلكتروني مسجل بالفعل.",

    // ── Weekly Schedule & Timetables ────────────────────────
    "Weekly Teaching Schedule": "برنامج التدريس الأسبوعي",
    "Weekly Schedule": "برنامج الحصص الأسبوعي",
    "Full Timetable": "جدول التوقيت الكامل",
    "View Full Timetable": "جدول التوقيت الكامل",
    "Teaching Groups": "الأفواج المكلف بتدريسها",
    "Enrolled Groups": "الأفواج المسجل بها",
    "Filter by Group:": "تصفية حسب الفوج:",
    "No sessions scheduled": "لا توجد حصص مجدولة",
    "There are no teaching sessions matching the selected filter.": "لا توجد حصص تدريسية مطابقة للتصفية المحددة.",
    "Attendance": "تسجيل الحضور",
    "No classes scheduled": "لا توجد حصص دراسية",
    "There are no classes scheduled matching the selected filter.": "لا توجد حصص دراسية مطابقة للتصفية المحددة.",
    "Loading teaching assignments...": "جاري تحميل جدول التدريس...",
    "Action": "إجراء",
    "Enrolled Student": "طالب مسجل",
    "Time": "التوقيت",
    "Active Programs": "البرامج النشطة",
    "Class Sessions": "الحصص الدراسية",
    "Grid View": "عرض شبكي",
    "Cards View": "عرض بطاقات",
    "Print Timetable": "طباعة جدول التوقيت",
    "Print Schedule": "طباعة البرنامج",
    "Total Sessions": "إجمالي الحصص",
    "Active Groups": "الأفواج النشطة",
    "Weekly Hours": "الساعات الأسبوعية",
    "Teachers": "الأساتذة",
    "Room": "القاعة",
    "Group": "الفوج",
    "Teacher": "الأستاذ",
    "Course": "الدورة / المادة",
    "Program": "البرنامج الدراسي",
    "Today": "اليوم",
    "All Week": "كامل الأسبوع",
    "Saturday": "السبت",
    "Sunday": "الأحد",
    "Monday": "الإثنين",
    "Tuesday": "الثلاثاء",
    "Wednesday": "الأربعاء",
    "Thursday": "الخميس",
    "Friday": "الجمعة",
    "Saturday - Friday": "السبت - الجمعة",
    "Mark Attendance": "تسجيل الحضور",
    "Current Session": "الحصة الحالية",
    "Next Session": "الحصة القادمة",
    "All Programs": "جميع البرامج",
    "View Full Schedule": "عرض البرنامج كاملاً"
  };

  function getLang() {
    for (var i = 0; i < LANG_KEYS.length; i++) {
      var val = localStorage.getItem(LANG_KEYS[i]);
      if (val) return val;
    }
    return 'en';
  }

  function setLang(lang) {
    for (var i = 0; i < LANG_KEYS.length; i++) {
      localStorage.setItem(LANG_KEYS[i], lang);
    }
    window.location.reload();
  }

  function t(text) {
    if (!text) return '';
    var trimmed = String(text).trim();
    if (getLang() === 'ar') {
      return DICT[trimmed] !== undefined ? DICT[trimmed] : trimmed;
    }
    return trimmed;
  }

  function applyRTL() {
    var lang = getLang();
    var isAr = lang === 'ar';
    document.documentElement.dir = isAr ? 'rtl' : 'ltr';
    document.documentElement.lang = isAr ? 'ar' : 'en';

    if (isAr) {
      // Ensure Google Cairo Font is loaded for clean Arabic typography
      if (!document.getElementById('arabic-font-link')) {
        var font = document.createElement('link');
        font.id = 'arabic-font-link';
        font.rel = 'stylesheet';
        font.href = 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap';
        document.head.appendChild(font);
      }
      // Ensure bootstrap-rtl stylesheet is present
      if (!document.getElementById('bootstrap-rtl-link')) {
        var rtlCss = document.createElement('link');
        rtlCss.id = 'bootstrap-rtl-link';
        rtlCss.rel = 'stylesheet';
        rtlCss.href = 'css/bootstrap-rtl.min.css';
        document.head.appendChild(rtlCss);
      }
    } else {
      var existingRtl = document.getElementById('bootstrap-rtl-link');
      if (existingRtl) existingRtl.remove();
    }
  }

  function translateElement(el) {
    var isAr = getLang() === 'ar';
    if (!isAr) return;

    // Direct data-i18n translation
    if (el.hasAttribute('data-i18n')) {
      var key = el.getAttribute('data-i18n').trim();
      var translated = DICT[key];
      if (translated) {
        var labelEl = el.querySelector('.th-label-text');
        if (labelEl) {
          labelEl.textContent = translated;
        } else {
          el.textContent = translated;
        }
      }
    }

    // Placeholder translation
    if (el.hasAttribute('data-i18n-ph')) {
      var phKey = el.getAttribute('data-i18n-ph').trim();
      if (DICT[phKey]) el.placeholder = DICT[phKey];
    }

    // Title translation
    if (el.hasAttribute('data-i18n-title')) {
      var titleKey = el.getAttribute('data-i18n-title').trim();
      if (DICT[titleKey]) el.title = DICT[titleKey];
    }
  }

  function translateAll(root) {
    if (getLang() !== 'ar') return;
    var container = root || document;

    var elements = container.querySelectorAll('[data-i18n], [data-i18n-ph], [data-i18n-title]');
    for (var i = 0; i < elements.length; i++) {
      translateElement(elements[i]);
    }

    // Translate select options that have data-i18n or text matching dictionary
    var options = container.querySelectorAll('select option');
    for (var j = 0; j < options.length; j++) {
      var opt = options[j];
      var txt = opt.textContent.trim();
      if (opt.hasAttribute('data-i18n')) {
        var k = opt.getAttribute('data-i18n').trim();
        if (DICT[k]) opt.textContent = DICT[k];
      } else if (DICT[txt]) {
        opt.textContent = DICT[txt];
      }
    }

    // Update document title if present in dictionary
    if (document.title && DICT[document.title.trim()]) {
      document.title = DICT[document.title.trim()];
    }

    // Update topbar language indicator
    var lbl = document.getElementById('lang-current-label');
    if (lbl) lbl.textContent = 'عر';
  }

  function initSwitcher() {
    var lbl = document.getElementById('lang-current-label');
    if (lbl) lbl.textContent = getLang() === 'ar' ? 'عر' : 'EN';

    document.addEventListener('click', function (e) {
      var btn = e.target.closest('.lang-switch-btn') || e.target.closest('[data-lang]');
      if (!btn) return;
      var lang = btn.getAttribute('data-lang');
      if (lang && lang !== getLang()) {
        e.preventDefault();
        setLang(lang);
      }
    });
  }

  // Initialize immediately on parse
  applyRTL();

  document.addEventListener('DOMContentLoaded', function () {
    initSwitcher();
    translateAll(document);
  });

  // Expose global AppI18n API
  window.AppI18n = {
    getLang: getLang,
    setLang: setLang,
    t: t,
    dict: DICT,
    translateAll: translateAll,
    applyRTL: applyRTL
  };

})();
