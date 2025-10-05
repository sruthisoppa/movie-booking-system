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
// PATCH /api/seats/:seatId - Update seat status
// PATCH /api/seats/:seatId - Update seat status with user-based blocking
router.patch('/:seatId', async (req, res) => {
  let connection;
  try {
    const { seatId } = req.params;
    const { status, userId } = req.body; // Add userId to track who blocked the seat

    console.log('Updating seat:', seatId, 'to status:', status, 'by user:', userId);

    if (!status || !['available', 'booked', 'blocked'].includes(status)) {
      return res.status(400).json({ 
        error: 'Valid status is required' 
      });
    }

    connection = await promisePool.getConnection();

    // Get current seat status with blocking info
    const [currentSeats] = await connection.execute(
      'SELECT status, blocked_by_user, blocked_until FROM seats WHERE id = ?',
      [seatId]
    );

    if (currentSeats.length === 0) {
      return res.status(404).json({ error: 'Seat not found' });
    }

    const currentSeat = currentSeats[0];

    // Concurrency protection
    if (currentSeat.status === 'booked') {
      return res.status(409).json({ error: 'Seat is already booked' });
    }

    // Check if seat is blocked by another user
    if (currentSeat.status === 'blocked' && status === 'available') {
      if (currentSeat.blocked_by_user && currentSeat.blocked_by_user !== userId) {
        return res.status(409).json({ error: 'Seat is blocked by another user' });
      }
    }

    // Update seat
    let query = 'UPDATE seats SET status = ?';
    const params = [status];

    if (status === 'blocked') {
      query += ', blocked_by_user = ?, blocked_until = DATE_ADD(NOW(), INTERVAL 5 MINUTE)';
      params.push(userId);
    } else if (status === 'available') {
      query += ', blocked_by_user = NULL, blocked_until = NULL';
    }

    query += ' WHERE id = ?';
    params.push(seatId);

    const [result] = await connection.execute(query, params);

    if (result.affectedRows === 0) {
      return res.status(409).json({ error: 'Seat update conflict' });
    }

    res.json({ message: 'Seat status updated successfully' });

  } catch (error) {
    console.error('Update seat error:', error);
    res.status(500).json({ error: 'Failed to update seat status' });
  } finally {
    if (connection) connection.release();
  }
});

// PATCH /api/seats/release - Release a single seat
router.patch('/release', async (req, res) => {
  let connection;
  try {
    const { showId, seatNumber } = req.body;

    if (!showId || !seatNumber) {
      return res.status(400).json({
        error: 'Show ID and seat number are required'
      });
    }

    connection = await promisePool.getConnection();

    const [result] = await connection.execute(
      'UPDATE seats SET status = "available", blocked_until = NULL WHERE show_id = ? AND seat_number = ? AND status = "booked"',
      [showId, seatNumber]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: `Seat ${seatNumber} not found or not booked`
      });
    }

    res.json({
      message: `Seat ${seatNumber} released successfully`
    });

  } catch (error) {
    console.error('Release seat error:', error);
    res.status(500).json({
      error: 'Failed to release seat'
    });
  } finally {
    if (connection) connection.release();
  }
});

// Add this cleanup endpoint for expired blocks
router.post('/cleanup-expired', async (req, res) => {
  try {
    const [result] = await promisePool.execute(
      'UPDATE seats SET status = "available", blocked_until = NULL WHERE status = "blocked" AND blocked_until < NOW()'
    );

    console.log(`Cleaned up ${result.affectedRows} expired blocked seats`);
    
    res.json({ 
      message: `Cleaned up ${result.affectedRows} expired blocked seats`,
      cleanedCount: result.affectedRows
    });

  } catch (error) {
    console.error('Cleanup expired seats error:', error);
    res.status(500).json({ error: 'Failed to cleanup expired seats' });
  }
});

// PATCH /api/seats/:id - Update seat status
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    console.log('Updating seat:', id, 'to status:', status);

    if (!status || !['available', 'booked', 'blocked'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status is required. Must be: available, booked, or blocked'
      });
    }

    const [result] = await promisePool.execute(
      'UPDATE seats SET status = ? WHERE id = ?',
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Seat not found'
      });
    }

    console.log(`Successfully updated seat ${id} to ${status}`);

    res.json({
      success: true,
      message: `Seat status updated to ${status}`
    });

  } catch (error) {
    console.error('Update seat error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update seat status',
      details: error.message
    });
  }
});

// PATCH /api/seats/bulk-update - Update multiple seats at once
router.patch('/bulk-update', async (req, res) => {
  try {
    const { seatIds, status } = req.body;

    console.log('Bulk updating seats:', seatIds, 'to status:', status);

    if (!Array.isArray(seatIds) || !['available', 'booked', 'blocked'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data. seatIds must be an array and status must be valid'
      });
    }

    if (seatIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No seat IDs provided'
      });
    }

    // Create placeholders for the SQL query
    const placeholders = seatIds.map(() => '?').join(',');
    
    const [result] = await promisePool.execute(
      `UPDATE seats SET status = ? WHERE id IN (${placeholders})`,
      [status, ...seatIds]
    );

    console.log(`Bulk update successful: Updated ${result.affectedRows} seats to ${status}`);

    res.json({
      success: true,
      message: `Updated ${result.affectedRows} seats to ${status}`,
      affectedRows: result.affectedRows
    });

  } catch (error) {
    console.error('Bulk update seats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update seats',
      details: error.message
    });
  }
});

// POST /api/seats/block-multiple - Block multiple seats with transaction
router.post('/block-multiple', async (req, res) => {
  const connection = await promisePool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { seatIds, showId } = req.body;

    if (!Array.isArray(seatIds) || seatIds.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Valid seat IDs array is required'
      });
    }

    // Check if any seats are already booked
    const placeholders = seatIds.map(() => '?').join(',');
    const [existingSeats] = await connection.execute(
      `SELECT id, seat_number, status FROM seats WHERE id IN (${placeholders}) AND show_id = ?`,
      [...seatIds, showId]
    );

    const bookedSeats = existingSeats.filter(seat => seat.status === 'booked');
    if (bookedSeats.length > 0) {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        message: `Some seats are already booked: ${bookedSeats.map(s => s.seat_number).join(', ')}`,
        bookedSeats: bookedSeats.map(s => s.seat_number)
      });
    }

    // Block the seats
    const [updateResult] = await connection.execute(
      `UPDATE seats SET status = 'blocked' WHERE id IN (${placeholders}) AND show_id = ? AND status = 'available'`,
      [...seatIds, showId]
    );

    await connection.commit();

    res.json({
      success: true,
      message: `Successfully blocked ${updateResult.affectedRows} seats`,
      blockedCount: updateResult.affectedRows
    });

  } catch (error) {
    await connection.rollback();
    console.error('Block multiple seats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to block seats'
    });
  } finally {
    connection.release();
  }
});

module.exports = router;