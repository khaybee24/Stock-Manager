const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getJwtSecret } = require('../middleware/auth.middleware');

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
});

const issueToken = (user) => jwt.sign(
  { sub: user._id.toString() },
  getJwtSecret(),
  { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
);

exports.register = async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (name.length < 2) {
      return res.status(400).json({ message: 'Name must be at least 2 characters' });
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ message: 'A valid email is required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email is already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, password: passwordHash });

    res.status(201).json({
      message: 'User registered successfully',
      user: publicUser(user),
      token: issueToken(user),
    });
  } catch (error) {
    console.error('Register user error:', error);
    res.status(400).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      message: 'Login successful',
      user: publicUser(user),
      token: issueToken(user),
    });
  } catch (error) {
    console.error('Login user error:', error);
    res.status(400).json({ message: error.message });
  }
};

exports.me = (req, res) => {
  res.json({ user: publicUser(req.user) });
};
