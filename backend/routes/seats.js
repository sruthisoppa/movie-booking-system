const express = require('express');
const router = express.Router();
const { promisePool } = require('../config/database');

// Get seat layout for a specific show
router.get('/show/:showId', async (req, res) => {
  try {
    const showId = req.params.showId;
    
    console.log('Fetching seats for show ID:', showId);
    
    const [seats] = await promisePool.execute(`
      SELECT 
        id,
        seat_number,
        seat_row,
        seat_column,
        status,
        booking_id,
        blocked_until
      FROM seats 
      WHERE show_id = ?
      ORDER BY seat_row, seat_column
    `, [showId]);
    
    console.log(`Found ${seats.length} seats for show ${showId}`);
    
    res.json(seats);
  } catch (error) {
    console.error('Error fetching seats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch seats',
      details: error.message 
    });
  }
});

module.exports = router;