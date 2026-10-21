const express = require('express');
const router = express.Router();
const {
  createMatch,
  getMatches,
  getMatch,
  updateMatch,
  deleteMatch,
  updateScore,
  streamLiveMatches,
  updatePlayerStats,
  bulkUpdateMatches,
} = require('../controllers/matchController');

router.get('/live/stream', streamLiveMatches);

// (18) Bulk Write Operations (bulkWrite) — batch match result ingestion
router.post('/bulk-results', bulkUpdateMatches);

router.route('/').get(getMatches).post(createMatch);
router.route('/:id').get(getMatch).put(updateMatch).delete(deleteMatch);
router.patch('/:id/score', updateScore);

// (16) Positional Array Updates (arrayFilters & $inc) — in-place player stat updates
router.patch('/:id/player-stats', updatePlayerStats);

module.exports = router;

