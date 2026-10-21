const mongoose = require('mongoose');
const Team = require('../models/Team');
const Player = require('../models/Player');
const asyncHandler = require('../middleware/asyncHandler');
const ApiError = require('../utils/ApiError');
const paginate = require('../utils/pagination');

// @desc  Create a team
// (1) CRUD Operations
exports.createTeam = asyncHandler(async (req, res) => {
  const team = await Team.create(req.body);
  res.status(201).json({ success: true, data: team });
});

// @desc  List teams with pagination, sorting, and filtering
// (1) CRUD Operations, (5) Pagination and Sorting
exports.getTeams = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = paginate(req.query);
  const filter = {};
  if (req.query.game) filter.game = req.query.game;
  if (req.query.region) filter.region = req.query.region;
  if (req.query.includeDeleted === 'true') filter.includeDeleted = true;

  const [teams, total] = await Promise.all([
    Team.find(filter).populate('players', 'username role').sort(sort).skip(skip).limit(limit),
    Team.countDocuments(filter),
  ]);


  res.json({
    success: true,
    count: teams.length,
    total,
    page,
    pages: Math.ceil(total / limit) || 1,
    data: teams,
  });
});

// @desc  Get a single team
// (2) Relational Linking — populate roster and captain
exports.getTeam = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id)
    .populate('players', 'username role stats')
    .populate('captain', 'username role');
  if (!team) throw new ApiError(404, 'Team not found');
  res.json({ success: true, data: team });
});

// @desc  Update a team
exports.updateTeam = asyncHandler(async (req, res) => {
  const team = await Team.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!team) throw new ApiError(404, 'Team not found');
  res.json({ success: true, data: team });
});

// @desc  Delete a team
exports.deleteTeam = asyncHandler(async (req, res) => {
  const team = await Team.findByIdAndDelete(req.params.id);
  if (!team) throw new ApiError(404, 'Team not found');
  res.json({ success: true, data: {} });
});

// @desc  Transfer a player's roster spot from their current team to another team
// (7) Multi-Document ACID Transactions — the player document and both team
// documents are only ever committed together, never left half-updated.
exports.transferPlayer = asyncHandler(async (req, res) => {
  const { playerId, toTeamId } = req.body;
  if (!playerId || !toTeamId) {
    throw new ApiError(400, 'playerId and toTeamId are required');
  }

  const session = await mongoose.startSession();
  let updatedPlayer;

  try {
    await session.withTransaction(async () => {
      const player = await Player.findById(playerId).session(session);
      if (!player) throw new ApiError(404, 'Player not found');

      const toTeam = await Team.findById(toTeamId).session(session);
      if (!toTeam) throw new ApiError(404, 'Destination team not found');

      const fromTeamId = player.team;

      if (fromTeamId) {
        await Team.findByIdAndUpdate(
          fromTeamId,
          { $pull: { players: player._id } },
          { session }
        );
      }

      await Team.findByIdAndUpdate(
        toTeamId,
        { $addToSet: { players: player._id } },
        { session }
      );

      player.team = toTeam._id;
      updatedPlayer = await player.save({ session });
    });
  } finally {
    await session.endSession();
  }

  res.json({
    success: true,
    message: 'Player transferred successfully',
    data: updatedPlayer,
  });
});

// @desc  Soft delete a team (moves to trash without breaking past match relations)
// (17) Soft Delete — sets isDeleted: true and deletedAt timestamp
exports.softDeleteTeam = asyncHandler(async (req, res) => {
  const team = await Team.findByIdAndUpdate(
    req.params.id,
    { isDeleted: true, deletedAt: new Date() },
    { new: true }
  );
  if (!team) throw new ApiError(404, 'Team not found');
  res.json({
    success: true,
    message: 'Team soft-deleted successfully (excluded from normal queries via Mongoose pre hooks)',
    data: team,
  });
});

// @desc  Restore a soft-deleted team
// (17) Soft Delete — restores team back to active status
exports.restoreTeam = asyncHandler(async (req, res) => {
  const team = await Team.findOneAndUpdate(
    { _id: req.params.id, includeDeleted: true },
    { isDeleted: false, deletedAt: null },
    { new: true }
  );
  if (!team) throw new ApiError(404, 'Soft-deleted team not found');
  res.json({
    success: true,
    message: 'Team restored successfully',
    data: team,
  });
});

