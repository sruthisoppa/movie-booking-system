const express = require('express');
const router = express.Router();
const { promisePool } = require('../config/database');

// Create a new booking
router.post('/', async (req, res) => {
  const connection = await promisePool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { userId, showId, seatNumbers, totalAmount } = req.body;
    
    console.log('Creating booking:', { userId, showId, seatNumbers, totalAmount });
    
    // Create booking record
    const [bookingResult] = await connection.execute(
      'INSERT INTO bookings (user_id, show_id, total_amount) VALUES (?, ?, ?)',
      [userId, showId, totalAmount]
    );
    
    const bookingId = bookingResult.insertId;
    
    // Update seats status to booked
    for (const seatNumber of seatNumbers) {
      await connection.execute(
        'UPDATE seats SET booking_id = ?, status = "booked" WHERE show_id = ? AND seat_number = ?',
        [bookingId, showId, seatNumber]
      );
    }
    
    await connection.commit();
    
    console.log(`Booking ${bookingId} created successfully for seats: ${seatNumbers.join(', ')}`);
    
    res.json({ 
      bookingId, 
      message: 'Booking confirmed successfully',
      seats: seatNumbers,
      totalAmount 
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Failed to create booking', details: error.message });
  } finally {
    connection.release();
  }
});

// Get user's booking history
router.get('/user/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const [bookings] = await promisePool.execute(`
      SELECT 
        b.*,
        m.title as movie_title,
        m.poster_url,
        c.name as cinema_name,
        c.location as cinema_location,
        s.start_time,
        s.end_time,
        GROUP_CONCAT(st.seat_number) as booked_seats
      FROM bookings b
      JOIN shows s ON b.show_id = s.id
      JOIN movies m ON s.movie_id = m.id
      JOIN screens sc ON s.screen_id = sc.id
      JOIN cinemas c ON sc.cinema_id = c.id
      LEFT JOIN seats st ON b.id = st.booking_id
      WHERE b.user_id = ?
      GROUP BY b.id
      ORDER BY b.booking_time DESC
    `, [userId]);
    
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings', details: error.message });
  }
});

module.exports = router;