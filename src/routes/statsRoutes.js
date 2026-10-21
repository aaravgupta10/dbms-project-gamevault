const express = require('express');
const router = express.Router();
const {
  getTeamRankings,
  getGamesBreakdown,
  getFacetedTournamentStats,
} = require('../controllers/statsController');

router.get('/rankings', getTeamRankings);
router.get('/games-breakdown', getGamesBreakdown);
// (11) Faceted Search ($facet & $bucket)
router.get('/tournaments/faceted', getFacetedTournamentStats);

module.exports = router;

