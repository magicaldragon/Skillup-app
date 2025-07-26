const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://skillup-frontend.onrender.com', // replace with your actual frontend domain if different
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB Atlas'))
.catch(err => console.error('MongoDB connection error:', err));

// Import routes
const { router: authRouter } = require('./routes/auth');
const usersRouter = require('./routes/users');

// Use routes
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);

// Example root route
app.get('/', (req, res) => {
  res.send('SKILLUP Backend is running!');
});

// --- Test route for frontend-backend connection ---
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'Backend API is working and connected to MongoDB!' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!' 
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});