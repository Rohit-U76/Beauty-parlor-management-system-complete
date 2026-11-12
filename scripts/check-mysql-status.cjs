const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = parseInt(process.env.DB_PORT || '3306', 10);
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'root';
const DB_NAME = process.env.DB_NAME || 'smart_salon_db';

async function inspect() {
  try {
    const conn = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME
    });
    const tables = ['users', 'appointments', 'customers', 'salon_settings', 'inquiries', 'offers', 'reviews', 'notifications', 'broadcast_logs'];
    for (const t of tables) {
      try {
        const [cols] = await conn.query('DESCRIBE ' + t);
        console.log('\n=== ' + t + ' ===');
        console.log(cols.map(c => c.Field + ' (' + c.Type + ')').join(', '));
      } catch (e) {
        console.log('\n=== ' + t + ' === (not found or error: ' + e.message + ')');
      }
    }
    await conn.end();
  } catch (err) {
    console.error('Inspection error:', err.message);
  }
}

inspect();
