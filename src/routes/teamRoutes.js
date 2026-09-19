const express = require('express');
const router = express.Router();
const {
  createTeam,
  getTeams,
  getTeam,
  updateTeam,
  deleteTeam,
  transferPlayer,
} = require('../controllers/teamController');

// Must be declared before '/:id' so "transfer" isn't parsed as an id
router.post('/transfer', transferPlayer);

router.route('/').get(getTeams).post(createTeam);
router.route('/:id').get(getTeam).put(updateTeam).delete(deleteTeam);

module.exports = router;
