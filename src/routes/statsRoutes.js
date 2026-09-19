const express = require('express');
const router = express.Router();
const { getTeamRankings, getGamesBreakdown } = require('../controllers/statsController');

router.get('/rankings', getTeamRankings);
router.get('/games-breakdown', getGamesBreakdown);

module.exports = router;
