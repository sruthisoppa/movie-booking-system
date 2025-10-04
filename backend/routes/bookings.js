const express = require('express');
const { promisePool } = require('../config/database');
const auth = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all booking routes
router.use(auth);

// Create booking
router.post('/', async (req, res) => {
  let connection;
  try {
    const { showId, seatNumbers, totalAmount } = req.body;
    const userId = req.user.id;

    connection = await promisePool.getConnection();
    await connection.beginTransaction();

    // 1. Create booking
    const [bookingResult] = await connection.execute(
      'INSERT INTO bookings (user_id, show_id, total_amount) VALUES (?, ?, ?)',
      [userId, showId, totalAmount]
    );

    const bookingId = bookingResult.insertId;

    // 2. Update seats status to booked and link to booking
    for (const seatNumber of seatNumbers) {
      await connection.execute(
        'UPDATE seats SET status = "booked", booking_id = ? WHERE show_id = ? AND seat_number = ?',
        [bookingId, showId, seatNumber]
      );
    }

    await connection.commit();

    // 3. Get complete booking details
    const [bookings] = await connection.execute(`
      SELECT 
        b.*,
        m.title as movie_title,
        c.name as cinema_name,
        s.start_time,
        GROUP_CONCAT(seats.seat_number) as seats
      FROM bookings b
      JOIN shows s ON b.show_id = s.id
      JOIN movies m ON s.movie_id = m.id
      JOIN screens sc ON s.screen_id = sc.id
      JOIN cinemas c ON sc.cinema_id = c.id
      JOIN seats ON seats.booking_id = b.id
      WHERE b.id = ?
      GROUP BY b.id
    `, [bookingId]);

    res.status(201).json({
      message: 'Booking created successfully',
      booking: bookings[0]
    });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Booking error:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    if (connection) connection.release();
  }
});

// Get user's bookings
router.get('/my-bookings', async (req, res) => {
  try {
    const [bookings] = await promisePool.execute(`
      SELECT 
        b.*,
        m.title as movie_title,
        m.poster_url,
        c.name as cinema_name,
        s.start_time,
        s.end_time,
        GROUP_CONCAT(seats.seat_number) as seats
      FROM bookings b
      JOIN shows s ON b.show_id = s.id
      JOIN movies m ON s.movie_id = m.id
      JOIN screens sc ON s.screen_id = sc.id
      JOIN cinemas c ON sc.cinema_id = c.id
      LEFT JOIN seats ON seats.booking_id = b.id
      WHERE b.user_id = ?
      GROUP BY b.id
      ORDER BY b.booking_time DESC
    `, [req.user.id]);

    res.json({ bookings });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;