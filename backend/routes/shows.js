const express = require('express');
const router = express.Router();
const { promisePool } = require('../config/database');

// Get shows for a specific movie and cinema
router.get('/', async (req, res) => {
  try {
    const { movieId, cinemaId } = req.query;
    
    console.log('Fetching shows with params:', { movieId, cinemaId });
    
    let query = `
      SELECT 
        s.id,
        s.movie_id,
        s.screen_id,
        s.start_time,
        s.end_time,
        s.price,
        m.title as movie_title,
        m.duration,
        m.genre,
        m.poster_url,
        sc.name as screen_name,
        c.name as cinema_name,
        c.location as cinema_location
      FROM shows s
      JOIN movies m ON s.movie_id = m.id
      JOIN screens sc ON s.screen_id = sc.id
      JOIN cinemas c ON sc.cinema_id = c.id
      WHERE s.start_time > NOW()
    `;
    
    const params = [];
    
    if (movieId) {
      query += ' AND s.movie_id = ?';
      params.push(parseInt(movieId));
    }
    
    if (cinemaId) {
      query += ' AND sc.cinema_id = ?';
      params.push(parseInt(cinemaId));
    }
    
    query += ' ORDER BY s.start_time ASC';
    
    console.log('Executing query:', query);
    console.log('With parameters:', params);
    
    const [shows] = await promisePool.execute(query, params);
    
    console.log(`Found ${shows.length} shows`);
    
    // Format the response
    const formattedShows = shows.map(show => ({
      id: show.id,
      movie_id: show.movie_id,
      screen_id: show.screen_id,
      start_time: show.start_time,
      end_time: show.end_time,
      price: parseFloat(show.price),
      movie_title: show.movie_title,
      duration: show.duration,
      genre: show.genre,
      poster_url: show.poster_url,
      screen_name: show.screen_name,
      cinema_name: show.cinema_name,
      cinema_location: show.cinema_location
    }));
    
    res.json(formattedShows);
    
  } catch (error) {
    console.error('Error fetching shows:', error);
    res.status(500).json({ 
      error: 'Failed to fetch shows',
      details: error.message 
    });
  }
});

// Get specific show details
router.get('/:id', async (req, res) => {
  try {
    const showId = req.params.id;
    
    console.log('Fetching show details for ID:', showId);
    
    const [shows] = await promisePool.execute(`
      SELECT 
        s.*,
        m.title as movie_title,
        m.duration,
        m.genre,
        m.poster_url,
        m.description as movie_description,
        sc.name as screen_name,
        sc.total_seats,
        c.name as cinema_name,
        c.location as cinema_location
      FROM shows s
      JOIN movies m ON s.movie_id = m.id
      JOIN screens sc ON s.screen_id = sc.id
      JOIN cinemas c ON sc.cinema_id = c.id
      WHERE s.id = ?
    `, [showId]);
    
    if (shows.length === 0) {
      return res.status(404).json({ error: 'Show not found' });
    }
    
    const show = shows[0];
    
    // Format the response
    const formattedShow = {
      id: show.id,
      movie_id: show.movie_id,
      screen_id: show.screen_id,
      start_time: show.start_time,
      end_time: show.end_time,
      price: parseFloat(show.price),
      movie_title: show.movie_title,
      duration: show.duration,
      genre: show.genre,
      poster_url: show.poster_url,
      movie_description: show.movie_description,
      screen_name: show.screen_name,
      total_seats: show.total_seats,
      cinema_name: show.cinema_name,
      cinema_location: show.cinema_location
    };
    
    res.json(formattedShow);
    
  } catch (error) {
    console.error('Error fetching show:', error);
    res.status(500).json({ 
      error: 'Failed to fetch show',
      details: error.message 
    });
  }
});

// Get all shows (for admin panel or debugging)
router.get('/all/list', async (req, res) => {
  try {
    const [shows] = await promisePool.execute(`
      SELECT 
        s.*,
        m.title as movie_title,
        sc.name as screen_name,
        c.name as cinema_name
      FROM shows s
      JOIN movies m ON s.movie_id = m.id
      JOIN screens sc ON s.screen_id = sc.id
      JOIN cinemas c ON sc.cinema_id = c.id
      ORDER BY s.start_time DESC
      LIMIT 50
    `);
    
    res.json(shows);
    
  } catch (error) {
    console.error('Error fetching all shows:', error);
    res.status(500).json({ 
      error: 'Failed to fetch shows',
      details: error.message 
    });
  }
});

// Get shows by movie only
router.get('/movie/:movieId', async (req, res) => {
  try {
    const movieId = req.params.movieId;
    
    const [shows] = await promisePool.execute(`
      SELECT 
        s.*,
        m.title as movie_title,
        sc.name as screen_name,
        c.name as cinema_name,
        c.location as cinema_location
      FROM shows s
      JOIN movies m ON s.movie_id = m.id
      JOIN screens sc ON s.screen_id = sc.id
      JOIN cinemas c ON sc.cinema_id = c.id
      WHERE s.movie_id = ? AND s.start_time > NOW()
      ORDER BY s.start_time ASC
    `, [movieId]);
    
    res.json(shows);
    
  } catch (error) {
    console.error('Error fetching shows by movie:', error);
    res.status(500).json({ 
      error: 'Failed to fetch shows',
      details: error.message 
    });
  }
});

// Get shows by cinema only
router.get('/cinema/:cinemaId', async (req, res) => {
  try {
    const cinemaId = req.params.cinemaId;
    
    const [shows] = await promisePool.execute(`
      SELECT 
        s.*,
        m.title as movie_title,
        m.genre,
        m.poster_url,
        sc.name as screen_name
      FROM shows s
      JOIN movies m ON s.movie_id = m.id
      JOIN screens sc ON s.screen_id = sc.id
      WHERE sc.cinema_id = ? AND s.start_time > NOW()
      ORDER BY s.start_time ASC
    `, [cinemaId]);
    
    res.json(shows);
    
  } catch (error) {
    console.error('Error fetching shows by cinema:', error);
    res.status(500).json({ 
      error: 'Failed to fetch shows',
      details: error.message 
    });
  }
});

module.exports = router;