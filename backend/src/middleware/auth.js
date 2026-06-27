const jwt = require('jsonwebtoken');
const env = require('../config/env');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');

const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw new ApiError(401, 'Authentication token is missing or malformed');
  }

  try {
    const payload = jwt.verify(token, env.jwt.secret);
    req.user = { id: payload.id, email: payload.email };
    next();
  } catch (err) {
    throw new ApiError(401, 'Invalid or expired token');
  }
});

module.exports = authenticate;
