const { ValidationError, UniqueConstraintError, ForeignKeyConstraintError } = require('sequelize');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  // Multer file-size / file-filter errors
  if (err && err.name === 'MulterError') {
    return res.status(400).json({
      success: false,
      message: `File upload error: ${err.message}`,
      errors: [err.message],
    });
  }

  if (err instanceof UniqueConstraintError) {
    const fields = Object.keys(err.fields || {});
    return res.status(409).json({
      success: false,
      message: `${fields.join(', ') || 'Field'} already exists`,
      errors: err.errors ? err.errors.map((e) => e.message) : [err.message],
    });
  }

  if (err instanceof ForeignKeyConstraintError) {
    return res.status(409).json({
      success: false,
      message: 'This record is referenced by other records and cannot be deleted or modified',
      errors: [err.message],
    });
  }

  if (err instanceof ValidationError) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.errors ? err.errors.map((e) => e.message) : [err.message],
    });
  }

  if (err && err.isApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors || [],
    });
  }

  // eslint-disable-next-line no-console
  console.error('Unhandled error:', err);
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
    errors: [],
  });
}

module.exports = errorHandler;
