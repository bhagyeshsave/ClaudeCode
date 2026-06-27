// Wraps an async route handler so that rejected promises / thrown errors
// are forwarded to Express's centralized error-handling middleware instead
// of crashing the process or hanging the request.
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
