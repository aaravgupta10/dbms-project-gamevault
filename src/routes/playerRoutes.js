const express = require('express');
const router = express.Router();
const {
  createPlayer,
  getPlayers,
  getPlayer,
  updatePlayer,
  deletePlayer,
  getFreeAgents,
  lookupByGamerTag,
} = require('../controllers/playerController');

// (15) Partial Filter Index — Free agents scout query
router.get('/free-agents', getFreeAgents);

// (19) Collation — Case-insensitive gamerTag lookup
router.get('/lookup/tag', lookupByGamerTag);

router.route('/').get(getPlayers).post(createPlayer);
router.route('/:id').get(getPlayer).put(updatePlayer).delete(deletePlayer);

module.exports = router;

