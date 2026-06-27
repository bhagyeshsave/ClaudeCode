// Ensures route params that should be integer ids (e.g. :id, :jobId) are
// actually numeric before we ever build a query with them — avoids a raw
// Postgres "invalid input syntax for type integer" 500 and returns a clean
// 400/404 instead.
function validateIdParam(paramName) {
  return (req, res, next) => {
    const value = req.params[paramName];
    if (!/^\d+$/.test(value)) {
      return res.status(404).json({
        success: false,
        message: `Resource not found: invalid ${paramName} '${value}'`,
        errors: [],
      });
    }
    return next();
  };
}

module.exports = validateIdParam;
