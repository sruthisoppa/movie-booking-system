const express = require('express');
const router = express.Router();
const { promisePool } = require('../config/database');

// Create a new user (for demo)
router.post('/', async (req, res) => {
  try {
    const { name, email } = req.body;
    
    const [result] = await promisePool.execute(
      'INSERT INTO users (name, email) VALUES (?, ?)',
      [name, email]
    );
    
    res.json({ 
      userId: result.insertId, 
      message: 'User created successfully' 
    });
  } catch (error) {
    console.error('Error creating user:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Email already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create user', details: error.message });
    }
  }
});

// Get or create demo user
router.get('/demo', async (req, res) => {
  try {
    // Check if demo user exists
    const [users] = await promisePool.execute(
      'SELECT * FROM users WHERE email = ?',
      ['demo@example.com']
    );
    
    if (users.length > 0) {
      return res.json(users[0]);
    }
    
    // Create demo user
    const [result] = await promisePool.execute(
      'INSERT INTO users (name, email) VALUES (?, ?)',
      ['Demo User', 'demo@example.com']
    );
    
    res.json({
      id: result.insertId,
      name: 'Demo User',
      email: 'demo@example.com'
    });
  } catch (error) {
    console.error('Error with demo user:', error);
    res.status(500).json({ error: 'Failed to get demo user', details: error.message });
  }
});

module.exports = router;