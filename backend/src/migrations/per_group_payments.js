const { query } = require('../config/db');

async function runMigration() {
  const safeAlter = async (sql) => {
    try {
      await query(sql);
      console.log('Executed:', sql);
    } catch (e) {
      console.log('Notice:', e.message);
    }
  };

  await safeAlter("ALTER TABLE student_groups ADD COLUMN payment_status VARCHAR(20) NOT NULL DEFAULT 'unpaid'");
  await safeAlter("ALTER TABLE student_groups ADD COLUMN subscription_plan VARCHAR(20) NULL");
  await safeAlter("ALTER TABLE student_groups ADD COLUMN next_payment_date DATE NULL");
  await safeAlter("ALTER TABLE student_groups ADD COLUMN last_payment_date DATE NULL");
  await safeAlter("ALTER TABLE student_groups ADD COLUMN discount_percent DECIMAL(5,2) DEFAULT 0");
  await safeAlter("ALTER TABLE student_groups ADD COLUMN promo_code_id BIGINT UNSIGNED NULL");

  await safeAlter("ALTER TABLE payment_history ADD COLUMN group_id BIGINT UNSIGNED NULL AFTER student_id");
  await safeAlter("ALTER TABLE payment_history ADD COLUMN formation_id BIGINT UNSIGNED NULL AFTER group_id");

  // Sync existing student payment_status & next_payment_date to student_groups
  const updateRes = await query(`
    UPDATE student_groups sg
    JOIN students s ON s.id = sg.student_id
    SET sg.payment_status = CASE WHEN s.payment_status = 'paid' THEN 'paid' ELSE 'not_paid' END,
        sg.subscription_plan = s.subscription_plan,
        sg.next_payment_date = s.next_payment_date
    WHERE sg.payment_status = 'unpaid'
  `);
  console.log('Synchronized existing student_groups rows:', updateRes.affectedRows);

  const cols = await query('DESCRIBE student_groups');
  console.log('student_groups columns now:', cols.map(c => c.Field + ' ' + c.Type));

  const phCols = await query('DESCRIBE payment_history');
  console.log('payment_history columns now:', phCols.map(c => c.Field + ' ' + c.Type));
}

runMigration().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
