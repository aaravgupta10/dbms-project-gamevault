const express = require('express');
const router = express.Router();
const {
  createPlayer,
  getPlayers,
  getPlayer,
  updatePlayer,
  deletePlayer,
} = require('../controllers/playerController');

router.route('/').get(getPlayers).post(createPlayer);
router.route('/:id').get(getPlayer).put(updatePlayer).delete(deletePlayer);

module.exports = router;
