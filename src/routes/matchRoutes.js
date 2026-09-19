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
} = require('../controllers/matchController');

router.get('/live/stream', streamLiveMatches);

router.route('/').get(getMatches).post(createMatch);
router.route('/:id').get(getMatch).put(updateMatch).delete(deleteMatch);
router.patch('/:id/score', updateScore);

module.exports = router;
