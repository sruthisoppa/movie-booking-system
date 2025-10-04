const express = require('express');
const router = express.Router();
const { promisePool } = require('../config/database');

// Get all cinemas
router.get('/', async (req, res) => {
  try {
    const [cinemas] = await promisePool.execute(
      'SELECT * FROM cinemas ORDER BY name'
    );
    res.json(cinemas);
  } catch (error) {
    console.error('Error fetching cinemas:', error);
    res.status(500).json({ error: 'Failed to fetch cinemas' });
  }
});

// Get movies for a specific cinema
router.get('/:id/movies', async (req, res) => {
  try {
    const cinemaId = req.params.id;
    
    const [movies] = await promisePool.execute(`
      SELECT DISTINCT m.* 
      FROM movies m
      JOIN shows s ON m.id = s.movie_id
      JOIN screens sc ON s.screen_id = sc.id
      WHERE sc.cinema_id = ?
      ORDER BY m.title
    `, [cinemaId]);
    
    res.json(movies);
  } catch (error) {
    console.error('Error fetching cinema movies:', error);
    res.status(500).json({ error: 'Failed to fetch movies' });
  }
});
// Get specific cinema by ID
router.get('/:id', async (req, res) => {
  try {
    const cinemaId = req.params.id;
    
    const [cinemas] = await promisePool.execute(
      'SELECT * FROM cinemas WHERE id = ?',
      [cinemaId]
    );
    
    if (cinemas.length === 0) {
      return res.status(404).json({ error: 'Cinema not found' });
    }
    
    res.json(cinemas[0]);
  } catch (error) {
    console.error('Error fetching cinema:', error);
    res.status(500).json({ error: 'Failed to fetch cinema' });
  }
});

module.exports = router;