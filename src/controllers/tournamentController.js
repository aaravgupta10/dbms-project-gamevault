const Tournament = require('../models/Tournament');
const Match = require('../models/Match');
const asyncHandler = require('../middleware/asyncHandler');
const ApiError = require('../utils/ApiError');

const paginate = require('../utils/pagination');

// @desc  Create a tournament
// (1) CRUD Operations
exports.createTournament = asyncHandler(async (req, res) => {
  const tournament = await Tournament.create(req.body);
  res.status(201).json({ success: true, data: tournament });
});

// @desc  List tournaments with pagination, sorting, and filtering
// (1) CRUD Operations, (5) Pagination and Sorting
exports.getTournaments = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = paginate(req.query);
  const filter = {};
  if (req.query.game) filter.game = req.query.game;
  if (req.query.status) filter.status = req.query.status;

  const [tournaments, total] = await Promise.all([
    Tournament.find(filter).populate('teams', 'name tag').sort(sort).skip(skip).limit(limit),
    Tournament.countDocuments(filter),
  ]);

  res.json({
    success: true,
    count: tournaments.length,
    total,
    page,
    pages: Math.ceil(total / limit) || 1,
    data: tournaments,
  });
});

// @desc  Get a single tournament
exports.getTournament = asyncHandler(async (req, res) => {
  const tournament = await Tournament.findById(req.params.id).populate('teams', 'name tag game');
  if (!tournament) throw new ApiError(404, 'Tournament not found');
  res.json({ success: true, data: tournament });
});

// @desc  Update a tournament
exports.updateTournament = asyncHandler(async (req, res) => {
  const tournament = await Tournament.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!tournament) throw new ApiError(404, 'Tournament not found');
  res.json({ success: true, data: tournament });
});

// @desc  Delete a tournament
exports.deleteTournament = asyncHandler(async (req, res) => {
  const tournament = await Tournament.findByIdAndDelete(req.params.id);
  if (!tournament) throw new ApiError(404, 'Tournament not found');
  res.json({ success: true, data: {} });
});

// @desc  Full-text search across tournament name, description, and rules
// (6) Text Search
exports.searchTournaments = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q) throw new ApiError(400, 'Query parameter "q" is required');

  const results = await Tournament.find(
    { $text: { $search: q } },
    { score: { $meta: 'textScore' } }
  ).sort({ score: { $meta: 'textScore' } });

  res.json({ success: true, count: results.length, data: results });
});

// @desc  Find LAN tournaments near a given coordinate
// (9) Geospatial Queries
exports.getNearbyTournaments = asyncHandler(async (req, res) => {
  const { lng, lat, maxDistance } = req.query;
  if (lng === undefined || lat === undefined) {
    throw new ApiError(400, 'Query parameters "lng" and "lat" are required');
  }

  const tournaments = await Tournament.find({
    isLAN: true,
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
        $maxDistance: parseFloat(maxDistance) || 50000, // meters, defaults to 50km
      },
    },
  });

  res.json({ success: true, count: tournaments.length, data: tournaments });
});

// @desc  Traverse tournament bracket tree from finals back to qualifiers
// (12) Recursive Graph Traversal ($graphLookup) — navigates hierarchical bracket
// matches starting from the Final match and recursively following previousMatchIds.
exports.getTournamentBracketTree = asyncHandler(async (req, res) => {
  const tournamentId = req.params.id;
  const tournament = await Tournament.findById(tournamentId);
  if (!tournament) throw new ApiError(404, 'Tournament not found');

  const tree = await Match.aggregate([
    {
      $match: {
        tournament: tournament._id,
        round: 'Final',
      },
    },
    {
      $graphLookup: {
        from: 'matches',
        startWith: '$previousMatchIds',
        connectFromField: 'previousMatchIds',
        connectToField: '_id',
        as: 'bracketProgression',
        depthField: 'bracketLevel',
      },
    },
    {
      $lookup: {
        from: 'teams',
        localField: 'teamA',
        foreignField: '_id',
        as: 'teamAInfo',
      },
    },
    {
      $lookup: {
        from: 'teams',
        localField: 'teamB',
        foreignField: '_id',
        as: 'teamBInfo',
      },
    },
    {
      $project: {
        round: 1,
        game: 1,
        status: 1,
        scoreA: 1,
        scoreB: 1,
        teamA: { $arrayElemAt: ['$teamAInfo.name', 0] },
        teamB: { $arrayElemAt: ['$teamBInfo.name', 0] },
        bracketProgression: {
          $map: {
            input: '$bracketProgression',
            as: 'm',
            in: {
              matchId: '$$m._id',
              round: '$$m.round',
              bracketLevel: '$$m.bracketLevel',
              scoreA: '$$m.scoreA',
              scoreB: '$$m.scoreB',
              status: '$$m.status',
            },
          },
        },
      },
    },
  ]);

  res.json({
    success: true,
    description: 'Hierarchical tournament bracket tree via $graphLookup recursive traversal',
    tournament: tournament.name,
    bracketRoot: tree[0] || null,
  });
});

