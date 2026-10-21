const express = require('express');
const router = express.Router();
const {
  createTeam,
  getTeams,
  getTeam,
  updateTeam,
  deleteTeam,
  transferPlayer,
  softDeleteTeam,
  restoreTeam,
} = require('../controllers/teamController');

// Must be declared before '/:id' so "transfer" isn't parsed as an id
router.post('/transfer', transferPlayer);

// (17) Soft Delete & Restore
router.delete('/:id/soft', softDeleteTeam);
router.patch('/:id/restore', restoreTeam);

router.route('/').get(getTeams).post(createTeam);
router.route('/:id').get(getTeam).put(updateTeam).delete(deleteTeam);

module.exports = router;

