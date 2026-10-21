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
  getTournamentBracketTree,
} = require('../controllers/tournamentController');

// Static sub-routes must be declared before '/:id'
router.get('/search', searchTournaments);
router.get('/nearby', getNearbyTournaments);

// (12) Recursive Graph Traversal ($graphLookup) — tournament bracket progression
router.get('/:id/bracket-tree', getTournamentBracketTree);

router.route('/').get(getTournaments).post(createTournament);
router.route('/:id').get(getTournament).put(updateTournament).delete(deleteTournament);

module.exports = router;

