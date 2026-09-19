const Team = require('../models/Team');
const Match = require('../models/Match');
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
