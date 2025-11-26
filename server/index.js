// index.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// IMPORTANT: your provided connection string (keep secret, usually in .env)
// const MONGO_URL = 'mongodb+srv://shubhankarbera57_db_user:4GK5cht0P20IRC3d@bwu.9tvlghe.mongodb.net/?appName=BWU';
const MONGO_URL = 'mongodb://localhost:27017/BWU';

// Middleware
app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: 'http://localhost:5173', // your frontend origin
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true, // allow cookies to be sent/received
  })
);

// Routes
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('API is running');
});

// MongoDB Connection
mongoose
  .connect(MONGO_URL)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => {
      console.log(`Server started on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB error:', err);
  });
