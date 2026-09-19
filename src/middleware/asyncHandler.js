// Wraps an async route handler so rejected promises reach the central error handler
// instead of requiring a try/catch block in every controller.
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
