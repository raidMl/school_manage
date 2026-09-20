const { query } = require('./config/db');

async function createTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS landing_inquiries (
      id INT AUTO_INCREMENT PRIMARY KEY,
      school_id INT DEFAULT 1,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(100) NOT NULL,
      formation_title VARCHAR(255) DEFAULT NULL,
      message TEXT DEFAULT NULL,
      status ENUM('new', 'contacted', 'enrolled', 'cancelled') DEFAULT 'new',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log('landing_inquiries table created or verified successfully');
  process.exit(0);
}

createTable().catch(err => {
  console.error(err);
  process.exit(1);
});
