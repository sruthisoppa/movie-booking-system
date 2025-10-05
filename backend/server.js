const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const initDatabase = require('./config/initDatabase');
const { promisePool } = require('./config/database'); // ✅ Use only this import

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Import routes
const cinemaRoutes = require('./routes/cinemas');
const movieRoutes = require('./routes/movies');
const showRoutes = require('./routes/shows');
const seatRoutes = require('./routes/seats');
const bookingRoutes = require('./routes/bookings'); // Add this
const userRoutes = require('./routes/users'); 
   


// Use routes
app.use('/api/cinemas', cinemaRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/shows', showRoutes);
app.use('/api/seats', seatRoutes);
app.use('/api/bookings', bookingRoutes); // Add this
app.use('/api/users', userRoutes);  


// Health check route
app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is running!' });
});

// Socket.io for real-time seat blocking
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('joinShow', (showId) => {
    socket.join(`show_${showId}`);
    console.log(`User ${socket.id} joined show ${showId}`);
  });

  socket.on('blockSeat', async (data) => {
    const { showId, seatNumber, userId } = data;
    
    try {
      // Block seat for 5 minutes
      const blockedUntil = new Date(Date.now() + 5 * 60 * 1000);
      await promisePool.execute(
        'UPDATE seats SET status = "blocked", blocked_until = ? WHERE show_id = ? AND seat_number = ? AND status = "available"',
        [blockedUntil, showId, seatNumber]
      );

      // Notify other users
      socket.to(`show_${showId}`).emit('seatBlocked', { seatNumber, userId });
      
    } catch (error) {
      console.error('Error blocking seat:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;

// Initialize database and start server
initDatabase().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(error => {
  console.error('Failed to start server:', error);
});