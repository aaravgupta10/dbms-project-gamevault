const Match = require('../models/Match');
const asyncHandler = require('../middleware/asyncHandler');
const ApiError = require('../utils/ApiError');
const paginate = require('../utils/pagination');
const { matchChangeEmitter } = require('../utils/changeStreamWatcher');

const POPULATE_FIELDS = [
  { path: 'tournament', select: 'name game status' },
  { path: 'teamA', select: 'name tag' },
  { path: 'teamB', select: 'name tag' },
  { path: 'winner', select: 'name tag' },
];

// @desc  Create a match
// (1) CRUD Operations
exports.createMatch = asyncHandler(async (req, res) => {
  const match = await Match.create(req.body);
  res.status(201).json({ success: true, data: match });
});

// @desc  List matches with pagination, sorting, and filtering
// (1) CRUD Operations, (5) Pagination and Sorting
exports.getMatches = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = paginate(req.query);
  const filter = {};
  if (req.query.tournament) filter.tournament = req.query.tournament;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.game) filter.game = req.query.game;

  const [matches, total] = await Promise.all([
    Match.find(filter).populate(POPULATE_FIELDS).sort(sort).skip(skip).limit(limit),
    Match.countDocuments(filter),
  ]);

  res.json({
    success: true,
    count: matches.length,
    total,
    page,
    pages: Math.ceil(total / limit) || 1,
    data: matches,
  });
});

// @desc  Get a single match
exports.getMatch = asyncHandler(async (req, res) => {
  const match = await Match.findById(req.params.id).populate(POPULATE_FIELDS);
  if (!match) throw new ApiError(404, 'Match not found');
  res.json({ success: true, data: match });
});

// @desc  Update match metadata (schedule, round, etc.)
exports.updateMatch = asyncHandler(async (req, res) => {
  const match = await Match.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!match) throw new ApiError(404, 'Match not found');
  res.json({ success: true, data: match });
});

// @desc  Delete a match
exports.deleteMatch = asyncHandler(async (req, res) => {
  const match = await Match.findByIdAndDelete(req.params.id);
  if (!match) throw new ApiError(404, 'Match not found');
  res.json({ success: true, data: {} });
});

// @desc  Update live score/status — this write is what the Change Stream below observes
exports.updateScore = asyncHandler(async (req, res) => {
  const { scoreA, scoreB, status } = req.body;
  const match = await Match.findById(req.params.id);
  if (!match) throw new ApiError(404, 'Match not found');

  if (scoreA !== undefined) match.scoreA = scoreA;
  if (scoreB !== undefined) match.scoreB = scoreB;
  if (status) match.status = status;

  if (match.status === 'Completed') {
    if (match.scoreA > match.scoreB) match.winner = match.teamA;
    else if (match.scoreB > match.scoreA) match.winner = match.teamB;
  }

  await match.save();
  res.json({ success: true, data: match });
});

// @desc  Server-Sent Events stream of live match changes
// (10) Change Streams — pushes real-time updates to connected viewers
exports.streamLiveMatches = (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  res.write(': connected\n\n');

  const listener = (change) => {
    res.write(`data: ${JSON.stringify(change)}\n\n`);
  };

  matchChangeEmitter.on('change', listener);

  req.on('close', () => {
    matchChangeEmitter.off('change', listener);
  });
};
