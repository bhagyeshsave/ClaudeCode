const jwt = require('jsonwebtoken');
const { User } = require('../models');
const env = require('../config/env');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');

function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn,
  });
}

function serializeUser(user) {
  return { id: user.id, email: user.email, createdAt: user.createdAt };
}

const register = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const existing = await User.findOne({ where: { email } });
  if (existing) {
    throw new ApiError(400, 'Email is already registered', ['email already in use']);
  }

  const user = await User.create({ email, password });
  const token = signToken(user);

  return sendSuccess(res, {
    statusCode: 201,
    message: 'User registered successfully',
    data: { user: serializeUser(user), token },
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const token = signToken(user);

  return sendSuccess(res, {
    statusCode: 200,
    message: 'Login successful',
    data: { user: serializeUser(user), token },
  });
});

module.exports = { register, login };
