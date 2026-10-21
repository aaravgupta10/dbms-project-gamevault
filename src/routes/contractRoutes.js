const express = require('express');
const { createContract, getContracts } = require('../controllers/contractController');

const router = express.Router();

// (14) Engine-Level Schema Validation ($jsonSchema)
router.route('/').post(createContract).get(getContracts);

module.exports = router;
