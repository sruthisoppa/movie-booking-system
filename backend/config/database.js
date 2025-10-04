const mysql = require('mysql2');
require('dotenv').config();

// First connect without database to create it if needed
const initConnection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 3306
});

// Create database if it doesn't exist
initConnection.connect((err) => {
  if (err) {
    console.error('Initial connection failed:', err.message);
    return;
  }
  
  initConnection.query('CREATE DATABASE IF NOT EXISTS movie_booking', (err) => {
    if (err) {
      console.error('Error creating database:', err);
    } else {
      console.log('Database movie_booking is ready');
    }
    initConnection.end();
  });
});

// Now create the pool with the database
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'movie_booking',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Get a promise wrapper
const promisePool = pool.promise();

// Test connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Database connection failed:', err.message);
    return;
  }
  console.log('Connected to database as id ' + connection.threadId);
  connection.release();
});

module.exports = {
  pool,
  promisePool
};