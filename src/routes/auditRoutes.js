const express = require('express');
const { createEvent, getRecentEvents } = require('../controllers/auditController');

const router = express.Router();

// (13) Capped Collections — circular event logging
router.post('/events', createEvent);
router.get('/events', getRecentEvents);

module.exports = router;
