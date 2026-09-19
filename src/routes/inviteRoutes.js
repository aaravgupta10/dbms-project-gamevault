const express = require('express');
const router = express.Router();
const {
  createInvite,
  getInvites,
  getInvite,
  respondToInvite,
  deleteInvite,
} = require('../controllers/inviteController');

router.route('/').get(getInvites).post(createInvite);
router
  .route('/:id')
  .get(getInvite)
  .put(respondToInvite)
  .delete(deleteInvite);

module.exports = router;
