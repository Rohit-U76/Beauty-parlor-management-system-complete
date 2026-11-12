const fs = require('fs');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

async function dump() {
  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'root';
  const database = process.env.DB_NAME || 'smart_salon_db';

  console.log(`Exporting full SQL dump from MySQL ${database}...`);

  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database
  });

  let sql = '-- =============================================================================\n';
  sql += '-- SMART SALON & PARLOUR MANAGEMENT SYSTEM - RELATIONAL MYSQL DUMP\n';
  sql += '-- Complete Production Database Schema & All Migrated Records\n';
  sql += `-- Export Date: ${new Date().toISOString()}\n`;
  sql += '-- Compatible with MySQL 8.0+, MariaDB 10.4+, AWS RDS, Cloud SQL, Railway, cPanel\n';
  sql += '-- =============================================================================\n\n';
  sql += 'CREATE DATABASE IF NOT EXISTS `smart_salon_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\n';
  sql += 'USE `smart_salon_db`;\n\n';
  sql += 'SET foreign_key_checks = 0;\n\n';

  const [tables] = await conn.query('SHOW TABLES;');
  for (const t of tables) {
    const tableName = Object.values(t)[0];
    const [createTable] = await conn.query(`SHOW CREATE TABLE \`${tableName}\``);
    sql += '-- -------------------------------------------------------------\n';
    sql += `-- Table structure for table \`${tableName}\`\n`;
    sql += '-- -------------------------------------------------------------\n';
    sql += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
    sql += createTable[0]['Create Table'] + ';\n\n';

    const [rows] = await conn.query(`SELECT * FROM \`${tableName}\``);
    if (rows.length > 0) {
      sql += `-- Dumping data for table \`${tableName}\` (${rows.length} rows)\n`;
      for (const row of rows) {
        const cols = Object.keys(row).map(c => `\`${c}\``).join(', ');
        const vals = Object.values(row).map(v => {
          if (v === null || v === undefined) return 'NULL';
          if (typeof v === 'number') return v;
          if (typeof v === 'boolean') return v ? 1 : 0;
          if (Buffer.isBuffer(v)) return v[0] ? 1 : 0;
          if (typeof v === 'object') return conn.escape(JSON.stringify(v));
          return conn.escape(v);
        }).join(', ');
        sql += `INSERT INTO \`${tableName}\` (${cols}) VALUES (${vals});\n`;
      }
      sql += '\n';
    }
  }

  sql += 'SET foreign_key_checks = 1;\n';
  fs.writeFileSync('data/mysql-dump.sql', sql, 'utf8');
  console.log(`✓ Successfully generated data/mysql-dump.sql (${(sql.length / 1024).toFixed(1)} KB)`);
  
  // Also update root schema.sql with this fresh dump
  fs.writeFileSync('schema.sql', sql, 'utf8');
  console.log(`✓ Updated schema.sql with complete production schema & data (${(sql.length / 1024).toFixed(1)} KB)`);

  await conn.end();
}

dump().catch(err => {
  console.error('Export failed:', err);
  process.exit(1);
});
