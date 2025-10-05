const express = require('express');
const { promisePool } = require('../config/database');
const adminAuth = require('../middleware/adminAuth');
const router = express.Router();

// Apply admin auth to all routes
router.use(adminAuth);

// Get all movies
// In your admin.js - what does this route return?
router.get('/movies', async (req, res) => {
  try {
    const [movies] = await promisePool.execute('SELECT * FROM movies ORDER BY created_at DESC');
    res.json(movies);     // ← This is what we want
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch movies' });
  }
});
// In your admin.js routes - Add this if missing
router.get('/cinemas', async (req, res) => {
  try {
    const [cinemas] = await promisePool.execute('SELECT * FROM cinemas ORDER BY created_at DESC');
    res.json( cinemas );
  } catch (error) {
    console.error('Failed to fetch cinemas:', error);
    res.status(500).json({ message: 'Failed to fetch cinemas' });
  }
});
// Add these routes to your admin.js

// Get all movies - FIXED RESPONSE FORMAT
router.get('/movies', async (req, res) => {
  try {
    const [movies] = await promisePool.execute('SELECT * FROM movies ORDER BY created_at DESC');
    res.json(movies); // Return array directly, not {movies}
  } catch (error) {
    console.error('Failed to fetch movies:', error);
    res.status(500).json({ message: 'Failed to fetch movies' });
  }
});

// Create movie
router.post('/movies', async (req, res) => {
  try {
    const { title, description, duration, genre, poster_url } = req.body;
    
    const [result] = await promisePool.execute(
      'INSERT INTO movies (title, description, duration, genre, poster_url) VALUES (?, ?, ?, ?, ?)',
      [title, description, duration, genre, poster_url]
    );

    res.status(201).json({ 
      message: 'Movie created successfully',
      id: result.insertId
    });
  } catch (error) {
    console.error('Failed to create movie:', error);
    res.status(500).json({ message: 'Failed to create movie' });
  }
});

// Update movie
router.put('/movies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, duration, genre, poster_url } = req.body;
    
    await promisePool.execute(
      'UPDATE movies SET title = ?, description = ?, duration = ?, genre = ?, poster_url = ? WHERE id = ?',
      [title, description, duration, genre, poster_url, id]
    );

    res.json({ message: 'Movie updated successfully' });
  } catch (error) {
    console.error('Failed to update movie:', error);
    res.status(500).json({ message: 'Failed to update movie' });
  }
});

// Delete movie
router.delete('/movies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await promisePool.execute('DELETE FROM movies WHERE id = ?', [id]);
    res.json({ message: 'Movie deleted successfully' });
  } catch (error) {
    console.error('Failed to delete movie:', error);
    res.status(500).json({ message: 'Failed to delete movie' });
  }
});

// Get all cinemas
router.get('/cinemas', async (req, res) => {
  try {
    const [cinemas] = await promisePool.execute('SELECT * FROM cinemas ORDER BY created_at DESC');
    res.json({ cinemas });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch cinemas' });
  }
});

// Create cinema
router.post('/cinemas', async (req, res) => {
  try {
    const { name, location } = req.body;
    
    const [result] = await promisePool.execute(
      'INSERT INTO cinemas (name, location) VALUES (?, ?)',
      [name, location]
    );

    res.status(201).json({ 
      message: 'Cinema created successfully',
      cinema: { id: result.insertId, name, location }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create cinema' });
  }
});

// Get screens for cinema
router.get('/cinemas/:cinemaId/screens', async (req, res) => {
  try {
    const { cinemaId } = req.params;
    const [screens] = await promisePool.execute(
      'SELECT * FROM screens WHERE cinema_id = ? ORDER BY name',
      [cinemaId]
    );
    res.json({ screens });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch screens' });
  }
});

// Create screen
router.post('/screens', async (req, res) => {
  try {
    const { cinema_id, name, total_seats } = req.body;
    
    const [result] = await promisePool.execute(
      'INSERT INTO screens (cinema_id, name, total_seats) VALUES (?, ?, ?)',
      [cinema_id, name, total_seats || 100]
    );

    res.status(201).json({ 
      message: 'Screen created successfully',
      screen: { id: result.insertId, cinema_id, name, total_seats }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create screen' });
  }
});

// Get show seat layout with booking details
router.get('/shows/:showId/seats', async (req, res) => {
  try {
    const { showId } = req.params;

    const [seats] = await promisePool.execute(`
      SELECT 
        s.*,
        u.name as user_name,
        u.email as user_email,
        b.booking_time
      FROM seats s
      LEFT JOIN bookings b ON s.booking_id = b.id
      LEFT JOIN users u ON b.user_id = u.id
      WHERE s.show_id = ?
      ORDER BY s.seat_row, s.seat_column
    `, [showId]);

    const [showDetails] = await promisePool.execute(`
      SELECT 
        sh.*,
        m.title as movie_title,
        c.name as cinema_name,
        sc.name as screen_name
      FROM shows sh
      JOIN movies m ON sh.movie_id = m.id
      JOIN screens sc ON sh.screen_id = sc.id
      JOIN cinemas c ON sc.cinema_id = c.id
      WHERE sh.id = ?
    `, [showId]);

    res.json({
      show: showDetails[0],
      seats
    });
  } catch (error) {
    console.error('Admin seats error:', error);
    res.status(500).json({ message: 'Failed to load seat details' });
  }
});

module.exports = router;