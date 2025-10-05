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

    // 1. CHECK if any seats are already booked
    const placeholders = seatNumbers.map(() => '?').join(',');
    const [existingSeats] = await connection.execute(
      `SELECT seat_number, status FROM seats WHERE show_id = ? AND seat_number IN (${placeholders})`,
      [showId, ...seatNumbers]
    );

    const bookedSeats = existingSeats.filter(seat => seat.status === 'booked');
    if (bookedSeats.length > 0) {
      await connection.rollback();
      return res.status(409).json({ 
        message: `Some seats are already booked: ${bookedSeats.map(s => s.seat_number).join(', ')}` 
      });
    }

    // 2. Create booking
    const [bookingResult] = await connection.execute(
      'INSERT INTO bookings (user_id, show_id, total_amount, status) VALUES (?, ?, ?, "confirmed")',
      [userId, showId, totalAmount]
    );

    const bookingId = bookingResult.insertId;

    // 3. Update seats status to booked and link to booking
    for (const seatNumber of seatNumbers) {
      const [updateResult] = await connection.execute(
        'UPDATE seats SET status = "booked", booking_id = ? WHERE show_id = ? AND seat_number = ? AND status != "booked"',
        [bookingId, showId, seatNumber]
      );

      // Check if seat was actually updated (not already booked by someone else)
      if (updateResult.affectedRows === 0) {
        await connection.rollback();
        return res.status(409).json({ 
          message: `Seat ${seatNumber} was just booked by another user` 
        });
      }
    }

    await connection.commit();

    // 4. Get complete booking details
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
    
    if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
      res.status(409).json({ message: 'Some seats are already booked' });
    } else {
      res.status(500).json({ message: 'Server error' });
    }
  } finally {
    if (connection) connection.release();
  }
});
/*router.post('/', async (req, res) => {
  let connection;
  try {
    const { showId, seatNumbers, totalAmount } = req.body;
    const userId = req.user.id;

    connection = await promisePool.getConnection();
    await connection.beginTransaction();

    // 1. Create booking
    const [bookingResult] = await connection.execute(
      'INSERT INTO bookings (user_id, show_id, total_amount, status) VALUES (?, ?, ?, "confirmed")',
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
});*/
// Cancel booking
router.post('/:bookingId/cancel', async (req, res) => {
  let connection;
  try {
    const { bookingId } = req.params;
    const userId = req.user.id;

    connection = await promisePool.getConnection();
    await connection.beginTransaction();

    // 1. Verify booking belongs to user
    const [bookings] = await connection.execute(
      'SELECT * FROM bookings WHERE id = ? AND user_id = ?',
      [bookingId, userId]
    );

    if (bookings.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const booking = bookings[0];

    // 2. Update booking status to cancelled
    await connection.execute(
      'UPDATE bookings SET status = "cancelled" WHERE id = ?',
      [bookingId]
    );

    // 3. Release seats (set status back to available and remove booking_id)
    await connection.execute(
      'UPDATE seats SET status = "available", booking_id = NULL WHERE booking_id = ?',
      [bookingId]
    );

    await connection.commit();

    res.json({ 
      message: 'Booking cancelled successfully',
      booking: { ...booking, status: 'cancelled' }
    });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Cancel booking error:', error);
    res.status(500).json({ message: 'Failed to cancel booking' });
  } finally {
    if (connection) connection.release();
  }
});
router.post('/:id/cancel', async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { seatNumbers, showId } = req.body;

    console.log('Cancelling booking:', id, 'seats:', seatNumbers, 'show:', showId);

    if (!seatNumbers || !Array.isArray(seatNumbers) || !showId) {
      return res.status(400).json({
        success: false,
        message: 'Seat numbers and show ID are required'
      });
    }

    connection = await promisePool.getConnection();
    
    try {
      await connection.beginTransaction();

      // 1. Check if booking exists and is confirmed
      const [bookings] = await connection.execute(
        'SELECT * FROM bookings WHERE id = ? AND status = "confirmed"',
        [id]
      );

      if (bookings.length === 0) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          message: 'Booking not found or already cancelled'
        });
      }

      const booking = bookings[0];

      // 2. Update booking status to cancelled
      const [updateResult] = await connection.execute(
        'UPDATE bookings SET status = "cancelled", cancelled_at = NOW() WHERE id = ?',
        [id]
      );

      if (updateResult.affectedRows === 0) {
        await connection.rollback();
        return res.status(500).json({
          success: false,
          message: 'Failed to update booking status'
        });
      }

      // 3. Release all seats - THIS IS THE KEY FIX
      // Method 1: Release by booking_id (more reliable)
      const [releaseByBookingResult] = await connection.execute(
        'UPDATE seats SET status = "available", booking_id = NULL WHERE booking_id = ?',
        [id]
      );

      // Method 2: Also release by seat numbers and show_id (backup)
      let releasedBySeatNumbers = 0;
      for (const seatNumber of seatNumbers) {
        const [seatResult] = await connection.execute(
          'UPDATE seats SET status = "available", booking_id = NULL WHERE show_id = ? AND seat_number = ? AND booking_id = ?',
          [showId, seatNumber, id]
        );
        
        if (seatResult.affectedRows > 0) {
          releasedBySeatNumbers++;
        }
      }

      await connection.commit();

      const totalReleased = releaseByBookingResult.affectedRows + releasedBySeatNumbers;

      console.log(`Successfully cancelled booking ${id}, released ${totalReleased} seats`);

      res.json({
        success: true,
        message: `Booking cancelled successfully. ${totalReleased} seats released.`,
        seatsReleased: totalReleased,
        bookingId: id
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      if (connection) connection.release();
    }

  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel booking',
      details: error.message
    });
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
        GROUP_CONCAT(seats.seat_number) as seat_numbers
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

    const formattedBookings = bookings.map(booking => ({
      ...booking,
      seatNumbers: booking.seat_numbers ? booking.seat_numbers.split(',') : [],
      bookingId: `BK${booking.id.toString().padStart(3, '0')}`
    }));

    res.json({ data: formattedBookings });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/bookings/:id/cancel - Cancel booking and release seats
// POST /api/bookings/:id/cancel - Cancel booking and release seats

// PATCH /api/bookings/:id - Update booking status
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    console.log('Updating booking status:', id, 'to', status);

    if (!status || !['confirmed', 'cancelled', 'pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status is required'
      });
    }

    const [result] = await promisePool.execute(
      'UPDATE bookings SET status = ? WHERE id = ?',
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.json({
      success: true,
      message: `Booking status updated to ${status}`
    });

  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update booking',
      details: error.message
    });
  }
});

module.exports = router;