// Centralized error handling for validation conflicts, duplicate keys, and routing anomalies.
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let details;

  if (err.name === 'ValidationError') {
    // Mongoose schema validation failures
    statusCode = 400;
    details = Object.values(err.errors).map((e) => e.message);
    message = 'Validation failed';
  } else if (err.code === 11000) {
    // Duplicate key conflicts on unique indexes (e.g. team tag, player email)
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = field
      ? `Duplicate value for field '${field}': '${err.keyValue[field]}' already exists`
      : 'Duplicate key conflict';
  } else if (err.name === 'CastError') {
    // Malformed ObjectIds or type mismatches in route params/body
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details && { details }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
