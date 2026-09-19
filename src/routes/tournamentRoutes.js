const express = require('express');
const router = express.Router();
const {
  createTournament,
  getTournaments,
  getTournament,
  updateTournament,
  deleteTournament,
  searchTournaments,
  getNearbyTournaments,
} = require('../controllers/tournamentController');

// Static sub-routes must be declared before '/:id'
router.get('/search', searchTournaments);
router.get('/nearby', getNearbyTournaments);

router.route('/').get(getTournaments).post(createTournament);
router.route('/:id').get(getTournament).put(updateTournament).delete(deleteTournament);

module.exports = router;
