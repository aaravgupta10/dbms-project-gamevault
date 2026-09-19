const Player = require('../models/Player');
const asyncHandler = require('../middleware/asyncHandler');
const ApiError = require('../utils/ApiError');
const paginate = require('../utils/pagination');

// @desc  Create a player
// (1) CRUD Operations
exports.createPlayer = asyncHandler(async (req, res) => {
  const player = await Player.create(req.body);
  res.status(201).json({ success: true, data: player });
});

// @desc  List players with pagination, sorting, and filtering
// (1) CRUD Operations, (5) Pagination and Sorting, (2) Relational Linking (populate team)
exports.getPlayers = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = paginate(req.query);
  const filter = {};
  if (req.query.team) filter.team = req.query.team;
  if (req.query.role) filter.role = req.query.role;

  const [players, total] = await Promise.all([
    Player.find(filter).populate('team', 'name tag game').sort(sort).skip(skip).limit(limit),
    Player.countDocuments(filter),
  ]);

  res.json({
    success: true,
    count: players.length,
    total,
    page,
    pages: Math.ceil(total / limit) || 1,
    data: players,
  });
});

// @desc  Get a single player
exports.getPlayer = asyncHandler(async (req, res) => {
  const player = await Player.findById(req.params.id).populate('team', 'name tag game');
  if (!player) throw new ApiError(404, 'Player not found');
  res.json({ success: true, data: player });
});

// @desc  Update a player
exports.updatePlayer = asyncHandler(async (req, res) => {
  const player = await Player.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!player) throw new ApiError(404, 'Player not found');
  res.json({ success: true, data: player });
});

// @desc  Delete a player
exports.deletePlayer = asyncHandler(async (req, res) => {
  const player = await Player.findByIdAndDelete(req.params.id);
  if (!player) throw new ApiError(404, 'Player not found');
  res.json({ success: true, data: {} });
});
