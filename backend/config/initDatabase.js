const { promisePool } = require('./database');

const initDatabase = async () => {
  let connection;
  try {
    // Wait a bit for database to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    connection = await promisePool.getConnection();
    
    console.log('Starting database initialization...');

    // Create tables in correct order
    const tables = [
      `CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL, 
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        role ENUM('admin','user') DEFAULT 'user'
      )`,

      
      `CREATE TABLE IF NOT EXISTS cinemas (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        location VARCHAR(200) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS movies (
        id INT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        duration INT,
        genre VARCHAR(100),
        poster_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS screens (
        id INT PRIMARY KEY AUTO_INCREMENT,
        cinema_id INT,
        name VARCHAR(50) NOT NULL,
        total_seats INT DEFAULT 100,
        FOREIGN KEY (cinema_id) REFERENCES cinemas(id) ON DELETE CASCADE
      )`,
      
      `CREATE TABLE IF NOT EXISTS shows (
        id INT PRIMARY KEY AUTO_INCREMENT,
        movie_id INT,
        screen_id INT,
        start_time DATETIME NOT NULL,
        end_time DATETIME NOT NULL,
        price DECIMAL(8,2) NOT NULL,
        FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
        FOREIGN KEY (screen_id) REFERENCES screens(id) ON DELETE CASCADE
      )`,
      
      `CREATE TABLE IF NOT EXISTS bookings (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT,
        show_id INT,
        booking_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        total_amount DECIMAL(8,2) NOT NULL,
        status ENUM('confirmed', 'cancelled') DEFAULT 'confirmed',
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (show_id) REFERENCES shows(id) ON DELETE CASCADE
      )`,
      
      `CREATE TABLE IF NOT EXISTS seats (
        id INT PRIMARY KEY AUTO_INCREMENT,
        booking_id INT NULL,
        show_id INT NOT NULL,
        seat_number VARCHAR(10) NOT NULL,
        seat_row INT NOT NULL,
        seat_column INT NOT NULL,
        status ENUM('available', 'booked', 'blocked') DEFAULT 'available',
        blocked_until TIMESTAMP NULL,
        blocked_by_user INT NULL,
        FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
        FOREIGN KEY (show_id) REFERENCES shows(id) ON DELETE CASCADE,
        FOREIGN KEY (blocked_by_user) REFERENCES users(id) ON DELETE SET NULL,
        UNIQUE KEY unique_show_seat (show_id, seat_number)
      )`
    ];

    for (const tableQuery of tables) {
      await connection.execute(tableQuery);
      console.log('Table created successfully');
    }

    console.log('All database tables created successfully');

    // Check if sample data already exists
    const [existingCinemas] = await connection.execute('SELECT COUNT(*) as count FROM cinemas');
    if (existingCinemas[0].count === 0) {
      await insertSampleData(connection);
    } else {
      console.log('Sample data already exists, skipping...');
    }
    
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const insertSampleData = async (connection) => {
  try {
    console.log('Inserting sample data...');

    // Insert sample users if not exists
    await connection.execute(
      `INSERT IGNORE INTO users (name, email) VALUES (?, ?), (?, ?)`,
      ['John Doe', 'john@example.com', 'Jane Smith', 'jane@example.com']
    );

    // Insert sample cinemas if not exists
    await connection.execute(
      `INSERT IGNORE INTO cinemas (name, location) VALUES (?, ?), (?, ?), (?, ?)`,
      [
        'PVR Cinemas', 'Forum Mall, Koramangala, Bangalore',
        'INOX', 'Garuda Mall, Magrath Road, Bangalore',
        'Cinepolis', 'Urban Square Mall, Sarjapur Road, Bangalore'
      ]
    );

    // Insert sample movies if not exists
    await connection.execute(
      `INSERT IGNORE INTO movies (title, description, duration, genre, poster_url)
       VALUES (?, ?, ?, ?, ?), (?, ?, ?, ?, ?), (?, ?, ?, ?, ?)`,
      [
        'Avengers: Endgame',
        'The epic conclusion to the Infinity Saga where the Avengers take one final stand against Thanos.',
        181,
        'Action, Adventure, Sci-Fi',
        'https://m.media-amazon.com/images/M/MV5BMTc5MDE2ODcwNV5BMl5BanBnXkFtZTgwMzI2NzQ2NzM@._V1_.jpg',

        'Inception',
        'A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
        148,
        'Action, Sci-Fi, Thriller',
        'https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_.jpg',

        'The Dark Knight',
        'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests.',
        152,
        'Action, Crime, Drama',
        'https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_.jpg'
      ]
    );

    // Insert sample screens
    const [cinemas] = await connection.execute('SELECT id FROM cinemas');
    for (const cinema of cinemas) {
      for (let i = 1; i <= 3; i++) {
        await connection.execute(
          `INSERT IGNORE INTO screens (cinema_id, name, total_seats) VALUES (?, ?, ?)`,
          [cinema.id, `Screen ${i}`, 100]
        );
      }
    }

    // Insert sample shows for today and tomorrow
    const [movies] = await connection.execute('SELECT id FROM movies');
    const [screens] = await connection.execute('SELECT id FROM screens');
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    for (const date of [today, tomorrow]) {
      for (const movie of movies) {
        for (const screen of screens) {
          for (let i = 0; i < 3; i++) {
            const startTime = new Date(date);
            startTime.setHours(10 + i * 4, 0, 0, 0);
            const endTime = new Date(startTime);
            endTime.setMinutes(startTime.getMinutes() + 150);

            await connection.execute(
              `INSERT IGNORE INTO shows (movie_id, screen_id, start_time, end_time, price) VALUES (?, ?, ?, ?, ?)`,
              [movie.id, screen.id, startTime, endTime, 250.00]
            );
          }
        }
      }
    }

    // Initialize seats
    const [allShows] = await connection.execute('SELECT id FROM shows');
    for (const show of allShows) {
      await initializeSeatsForShow(connection, show.id);
    }

    console.log('✅ Sample data inserted successfully');

  } catch (error) {
    console.error('Error inserting sample data:', error);
  }
};


const initializeSeatsForShow = async (connection, showId) => {
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
  
  for (let row = 0; row < 10; row++) {
    for (let col = 1; col <= 10; col++) {
      await connection.execute(
        'INSERT IGNORE INTO seats (show_id, seat_number, seat_row, seat_column) VALUES (?, ?, ?, ?)',
        [showId, `${rows[row]}${col}`, row, col]
      );
    }
  }
};

module.exports = initDatabase;