const nodemailer = require('nodemailer');

const TARGET_EMAIL = process.env.ORDER_NOTIFY_EMAIL || 'r.design.boite@gmail.com';

/**
 * Configure Nodemailer Transporter
 */
function getTransporter() {
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

  if (user && pass) {
    return nodemailer.createTransport({
      service: process.env.SMTP_SERVICE || 'gmail',
      auth: { user, pass }
    });
  }

  // Fallback for custom SMTP host
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: user && pass ? { user, pass } : undefined
    });
  }

  return null;
}

/**
 * Generate a high-end HTML email template for system orders
 */
function generateOrderEmailHtml({ name, phone, school, type, wilaya, notes, createdAt }) {
  const dateStr = createdAt || new Date().toLocaleString('ar-DZ', { timeZone: 'Africa/Algiers' });
  const cleanPhone = (phone || '').replace(/\D/g, '');
  const waNum = cleanPhone.startsWith('0') ? '213' + cleanPhone.substring(1) : cleanPhone;

  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>طلب جديد لنظام School Manager</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9; margin: 0; padding: 20px; direction: rtl; }
    .email-container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
    .email-header { background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
    .badge-tag { display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: #ffffff; font-size: 12px; font-weight: 700; padding: 4px 14px; border-radius: 999px; margin-bottom: 12px; }
    .header-title { margin: 0 0 6px 0; font-size: 22px; font-weight: 800; color: #ffffff; }
    .header-sub { margin: 0; font-size: 14px; color: #94a3b8; }
    .email-body { padding: 28px 24px; }
    .info-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
    .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px dashed #cbd5e1; font-size: 14px; }
    .info-row:last-child { border-bottom: none; }
    .info-label { color: #64748b; font-weight: 600; min-width: 140px; }
    .info-val { color: #0f172a; font-weight: 700; text-align: left; direction: ltr; }
    .info-val-rtl { color: #0f172a; font-weight: 700; text-align: right; }
    .notes-box { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 14px 18px; margin-bottom: 24px; }
    .notes-title { color: #1e40af; font-size: 13px; font-weight: 700; margin-bottom: 6px; }
    .notes-content { color: #1e3a8a; font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-line; }
    .actions-row { display: flex; gap: 12px; margin-top: 20px; }
    .btn { display: inline-block; padding: 12px 20px; border-radius: 10px; font-size: 14px; font-weight: 700; text-decoration: none; text-align: center; }
    .btn-wa { background-color: #25D366; color: #ffffff !important; flex: 1; }
    .btn-call { background-color: #4f46e5; color: #ffffff !important; flex: 1; }
    .email-footer { background: #0f172a; padding: 20px; text-align: center; color: #64748b; font-size: 12px; }
    .email-footer p { margin: 4px 0; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <span class="badge-tag">طلب جديد 🚀</span>
      <h1 class="header-title">طلب ترخيص وعرض تجريبي لنظام School Manager</h1>
      <p class="header-sub">تم استلام هذا الطلب من صفحة الهبوط الرسمية للمنصة</p>
    </div>

    <div class="email-body">
      <div class="info-card">
        <div class="info-row">
          <span class="info-label">👤 اسم مقدم الطلب:</span>
          <span class="info-val-rtl">${name || 'غير محدد'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">📱 رقم الهاتف / واتساب:</span>
          <span class="info-val"><a href="tel:${phone}" style="color: #4f46e5; text-decoration: none;">${phone || 'غير محدد'}</a></span>
        </div>
        <div class="info-row">
          <span class="info-label">🏫 اسم المؤسسة أو المدرسة:</span>
          <span class="info-val-rtl">${school || 'غير محدد'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">🏷️ نوع المؤسسة:</span>
          <span class="info-val-rtl">${type || 'مدرسة قرآنية / تعليمية'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">📍 الولاية أو المدينة:</span>
          <span class="info-val-rtl">${wilaya || 'غير محدد'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">⏱️ تاريخ وتوقيت الطلب:</span>
          <span class="info-val">${dateStr}</span>
        </div>
      </div>

      <div class="notes-box">
        <div class="notes-title">📝 تفاصيل وملاحظات إضافية:</div>
        <p class="notes-content">${notes || 'لا توجد ملاحظات إضافية تم تدوينها من قِبل العميل.'}</p>
      </div>

      <div class="actions-row">
        <a href="https://wa.me/${waNum}?text=%D8%A7%D9%84%D8%B3%D9%84%D8%A7%D9%85%20%D8%B9%D9%84%D9%8A%D9%83%D9%85%20%D8%A3%D8%B3%D8%AA%D8%A7%D8%B0%20${encodeURIComponent(name || '')}%D8%8C%20%D8%AA%D9%88%D8%A7%D8%B5%D9%84%D8%AA%D9%85%20%D9%85%D8%B9%D9%86%D8%A7%20%D8%A8%D8%AE%D8%B5%D9%88%D8%B5%20%D8%B7%D9%84%D8%A8%20%D9%86%D8%B8%D8%A7%D9%85%20School%20Manager" class="btn btn-wa" target="_blank">
          💬 مراسلة فورية عبر واتساب
        </a>
        <a href="tel:${phone}" class="btn btn-call">
          📞 اتصال هاتفي مباشر
        </a>
      </div>
    </div>

    <div class="email-footer">
      <p>نظام <strong>School Manager Platform</strong> © 2026 - تم التطوير بواسطة شركة RDesign</p>
      <p>البريد المستلم: ${TARGET_EMAIL} | هاتف الدعم والمبيعات: +213669453240</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Send System Order Email Notification
 */
async function sendSystemOrderEmail(orderData) {
  const html = generateOrderEmailHtml(orderData);
  const subject = `🚀 طلب جديد لنظام School Manager - ${orderData.school || orderData.name || 'عميل جديد'}`;

  const transporter = getTransporter();

  if (!transporter) {
    console.log('----------------------------------------------------');
    console.log(`[EMAIL NOTIFICATION TO: ${TARGET_EMAIL}]`);
    console.log(`SUBJECT: ${subject}`);
    console.log(`Order Info: ${JSON.stringify(orderData, null, 2)}`);
    console.log('Notice: SMTP_USER and SMTP_PASS not set in .env. Email logged successfully.');
    console.log('----------------------------------------------------');
    return { success: true, simulated: true, target: TARGET_EMAIL };
  }

  try {
    const info = await transporter.sendMail({
      from: `"School Manager Platform" <${process.env.SMTP_USER || 'no-reply@schoolmanager.com'}>`,
      to: TARGET_EMAIL,
      subject: subject,
      html: html
    });
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId, target: TARGET_EMAIL };
  } catch (err) {
    console.error('Failed to send email via SMTP:', err.message);
    return { success: false, error: err.message, target: TARGET_EMAIL };
  }
}

module.exports = {
  sendSystemOrderEmail,
  generateOrderEmailHtml,
  TARGET_EMAIL
};
