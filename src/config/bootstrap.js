const fs = require('fs/promises');
const path = require('path');
const mysql = require('mysql2/promise');

function splitSqlStatements(sql) {
  return sql
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n')
    .split(';')
    .map((statement) => statement.trim())
    .filter(Boolean);
}

async function bootstrapDatabase() {
  const schemaPath = path.resolve(__dirname, '../../../db.sql');
  const schemaSql = await fs.readFile(schemaPath, 'utf8');
  const statements = splitSqlStatements(schemaSql);
  const databaseName = process.env.DB_NAME || 'school_management';

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: false,
  });

  try {
    const [existingTables] = await connection.query(
      `SELECT COUNT(*) AS table_count
       FROM information_schema.tables
       WHERE table_schema = ? AND table_name = 'users'`,
      [databaseName]
    );

    if (existingTables[0].table_count > 0) {
      return;
    }

    for (const statement of statements) {
      await connection.query(statement);
    }
  } finally {
    await connection.end();
  }
}

module.exports = bootstrapDatabase;