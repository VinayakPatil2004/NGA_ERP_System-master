import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'new_nga_erp',
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  connectTimeout: 60000, // 60 seconds
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
});

pool.getConnection()
  .then(connection => {
    console.log(`MySQL Connected: ${connection.config.host}`);
    connection.release();
  })
  .catch(err => {
    console.error(`MySQL Connection Error: ${err.message}`);
    process.exit(1);
  });

export default pool;
