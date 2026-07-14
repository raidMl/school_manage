const fs = require('fs');
const path = 'admin-ui/js/i18n.js';
let content = fs.readFileSync(path, 'utf16le');
if (!content.includes('التكوين')) {
  // If not found in utf16, try utf8 in case it was converted
  content = fs.readFileSync(path, 'utf8');
}
content = content.replace(/التكوينات والاشتراكات/g, 'الدورات والاشتراكات');
content = content.replace(/جميع التكوينات/g, 'جميع الدورات');
content = content.replace(/التكوينات/g, 'الدورات');
content = content.replace(/إضافة تكوين/g, 'إضافة دورة');
content = content.replace(/جار تحميل التكوينات/g, 'جار تحميل الدورات');
content = content.replace(/اختر التكوين/g, 'اختر الدورة');
content = content.replace(/قائمة التكوينات/g, 'قائمة الدورات');
content = content.replace(/إضافة تكوين \/ اشتراك/g, 'إضافة دورة / اشتراك');
content = content.replace(/\"التكوين\"/g, '\"الدورة\"');
content = content.replace(/\"تكوين\"/g, '\"دورة\"');
content = content.replace(/إنشاء تكوين تدريبي جديد\./g, 'إنشاء دورة تدريبية جديدة.');
content = content.replace(/يستخدم للتكوينات\./g, 'يستخدم للدورات.');
content = content.replace(/حفظ التكوين/g, 'حفظ الدورة');
fs.writeFileSync(path, content, 'utf8');
console.log('Done replacement. utf8 saved.');
