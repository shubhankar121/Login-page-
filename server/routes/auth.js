// routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // ensure this path is correct

// JWT secret - in production store this in an env var (e.g. process.env.JWT_SECRET)
const JWT_SECRET = process.env.JWT_SECRET || 'replace_this_with_a_strong_secret';

// cookie options builder
function cookieOptions(remember = false) {
  const maxAge = remember ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000; // 7 days vs 1 day
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // true in production (HTTPS)
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // if cross-site cookies needed in prod, use 'none' + secure
    maxAge,
    path: '/', // explicit path to make clear where cookie is set/cleared
  };
}

/**
 * Helper: extract JWT token from cookie or Authorization header
 */
function extractToken(req) {
  // cookie-parser populates req.cookies
  if (req.cookies && req.cookies.token) return req.cookies.token;

  // fallback to Authorization header: "Bearer <token>"
  const auth = req.get('Authorization') || req.get('authorization');
  if (auth && auth.startsWith('Bearer ')) return auth.split(' ')[1];

  return null;
}

/**
 * POST /api/auth/register
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required.' });
    }

    const emailLower = String(email).trim().toLowerCase();
    const existing = await User.findOne({ email: emailLower });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const user = new User({
      name: String(name).trim(),
      email: emailLower,
      password: hashed, // hashed password stored in 'password'
    });

    await user.save();

    // Return minimal safe user data
    const retUser = { _id: user._id, name: user.name, email: user.email, createdAt: user.createdAt };
    return res.status(201).json({ message: 'User created successfully', user: retUser });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/auth/login
 * Accepts { email, password, remember }
 * Sets httpOnly cookie 'token' and returns safe user info
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password, remember } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    const emailLower = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: emailLower });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    // Support either user.password or user.passwordHash depending on your schema
    const storedHash = user.password || user.passwordHash;
    if (!storedHash) {
      console.error('Login error: no stored password hash for user', user._id);
      return res.status(500).json({ message: 'User has no password set' });
    }

    const valid = await bcrypt.compare(password, storedHash);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    const payload = { id: user._id, name: user.name, email: user.email };
    const expiresIn = remember ? '7d' : '1d';
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn });

    // set cookie
    res.cookie('token', token, cookieOptions(!!remember));

    // return non-sensitive user info
    const safeUser = { id: user._id, name: user.name, email: user.email };
    return res.json({ message: 'Login successful', user: safeUser });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/auth/me
 * Reads cookie OR Authorization header, verifies JWT and returns decoded user
 */
router.get('/me', (req, res) => {
  try {
    const token = extractToken(req);
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    const decoded = jwt.verify(token, JWT_SECRET);
    return res.json({ user: { id: decoded.id, name: decoded.name, email: decoded.email } });
  } catch (err) {
    console.error('/me error', err);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
});

/**
 * POST /api/auth/logout
 * Clears cookie
 */
router.post('/logout', (req, res) => {
  // clearCookie should use the same path & sameSite/secure values as when set
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
  });
  return res.json({ message: 'Logged out' });
});

module.exports = router;
