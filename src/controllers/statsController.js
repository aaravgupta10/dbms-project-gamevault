const Team = require('../models/Team');
const Match = require('../models/Match');
const Tournament = require('../models/Tournament');
const asyncHandler = require('../middleware/asyncHandler');


// @desc  Ranked team leaderboard with win-rate and roster size
// (3) Aggregation Pipeline
exports.getTeamRankings = asyncHandler(async (req, res) => {
  const matchStage = req.query.game ? { $match: { game: req.query.game } } : { $match: {} };

  const rankings = await Team.aggregate([
    matchStage,
    {
      $addFields: {
        totalMatches: { $add: ['$stats.wins', '$stats.losses'] },
        winRate: {
          $cond: [
            { $eq: [{ $add: ['$stats.wins', '$stats.losses'] }, 0] },
            0,
            { $divide: ['$stats.wins', { $add: ['$stats.wins', '$stats.losses'] }] },
          ],
        },
      },
    },
    { $sort: { 'stats.points': -1, winRate: -1 } },
    {
      $lookup: {
        from: 'players',
        localField: 'players',
        foreignField: '_id',
        as: 'roster',
      },
    },
    {
      $project: {
        name: 1,
        tag: 1,
        game: 1,
        region: 1,
        stats: 1,
        totalMatches: 1,
        winRate: { $round: ['$winRate', 3] },
        rosterSize: { $size: '$roster' },
      },
    },
  ]);

  res.json({ success: true, count: rankings.length, data: rankings });
});

// @desc  Breakdown of match volume/outcomes grouped by game
// (3) Aggregation Pipeline
exports.getGamesBreakdown = asyncHandler(async (req, res) => {
  const breakdown = await Match.aggregate([
    {
      $group: {
        _id: '$game',
        totalMatches: { $sum: 1 },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
        live: { $sum: { $cond: [{ $eq: ['$status', 'Live'] }, 1, 0] } },
        scheduled: { $sum: { $cond: [{ $eq: ['$status', 'Scheduled'] }, 1, 0] } },
        avgScoreA: { $avg: '$scoreA' },
        avgScoreB: { $avg: '$scoreB' },
      },
    },
    { $sort: { totalMatches: -1 } },
    {
      $project: {
        _id: 0,
        game: '$_id',
        totalMatches: 1,
        completed: 1,
        live: 1,
        scheduled: 1,
        avgScoreA: { $round: ['$avgScoreA', 2] },
        avgScoreB: { $round: ['$avgScoreB', 2] },
      },
    },
  ]);

  res.json({ success: true, count: breakdown.length, data: breakdown });
});

// @desc  Multi-faceted tournament dashboard analytics
// (11) Faceted Search ($facet & $bucket) — runs multiple parallel aggregation pipelines
// over incoming tournament data in a single database round-trip.
exports.getFacetedTournamentStats = asyncHandler(async (req, res) => {
  const result = await Tournament.aggregate([
    {
      $facet: {
        prizeBrackets: [
          {
            $bucket: {
              groupBy: '$prizePool',
              boundaries: [0, 5000, 25000, 100000],
              default: 'HighRoller',
              output: {
                count: { $sum: 1 },
                avgPrize: { $avg: '$prizePool' },
                tournaments: { $push: '$name' },
              },
            },
          },
        ],
        gameDistribution: [
          { $sortByCount: '$game' },
        ],
        statusCounts: [
          { $sortByCount: '$status' },
        ],
        topTournaments: [
          { $sort: { prizePool: -1 } },
          { $limit: 3 },
          {
            $project: {
              name: 1,
              game: 1,
              prizePool: 1,
              format: 1,
              status: 1,
            },
          },
        ],
      },
    },
  ]);

  res.json({
    success: true,
    description: 'Multi-dimensional analytics via $facet and $bucket in a single query',
    data: result[0] || {},
  });
});

