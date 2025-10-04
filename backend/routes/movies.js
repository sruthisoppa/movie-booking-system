const express = require('express');
const router = express.Router();
const { promisePool } = require('../config/database');

// Get all movies
router.get('/', async (req, res) => {
  try {
    console.log('Fetching all movies...');
    
    const [movies] = await promisePool.execute(
      'SELECT * FROM movies ORDER BY title'
    );
    
    console.log(`Found ${movies.length} movies`);
    console.log('Movies:', movies);
    
    res.json(movies);
  } catch (error) {
    console.error('Error fetching movies:', error);
    res.status(500).json({ error: 'Failed to fetch movies', details: error.message });
  }
});

module.exports = router;