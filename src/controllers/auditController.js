const MatchEventLog = require('../models/MatchEventLog');
const asyncHandler = require('../middleware/asyncHandler');
const ApiError = require('../utils/ApiError');

// @desc  Log an event to the capped collection
// (13) Capped Collections — circular FIFO buffer with fixed size and max document limit
exports.createEvent = asyncHandler(async (req, res) => {
  const { match, eventType, message, severity } = req.body;
  if (!eventType || !message) {
    throw new ApiError(400, 'eventType and message are required');
  }

  const log = await MatchEventLog.create({
    match: match || null,
    eventType,
    message,
    severity: severity || 'Info',
  });

  res.status(201).json({ success: true, data: log });
});

// @desc  Get recent events in natural order
// (13) Capped Collections — natural sort ($natural: -1) retrieves records in exact
// physical insertion order on disk, which is optimized for circular logging.
exports.getRecentEvents = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);

  const events = await MatchEventLog.find()
    .sort({ $natural: -1 })
    .limit(limit)
    .populate('match', 'game round status');

  res.json({
    success: true,
    count: events.length,
    description: 'Capped collection circular event buffer (FIFO)',
    data: events,
  });
});
