const PlayerContract = require('../models/PlayerContract');
const asyncHandler = require('../middleware/asyncHandler');
const ApiError = require('../utils/ApiError');

// @desc  Create a player contract
// (14) Engine-Level Schema Validation ($jsonSchema) — MongoDB rejects writes that
// violate server-side rules (salary >= 500, regex CTR-####-XX, allowed statuses)
// with error code 121 (Document failed validation), regardless of application client.
exports.createContract = asyncHandler(async (req, res) => {
  const contract = await PlayerContract.create(req.body);
  res.status(201).json({
    success: true,
    message: 'Contract passed MongoDB $jsonSchema engine validation successfully',
    data: contract,
  });
});

// @desc  List all pro player contracts
exports.getContracts = asyncHandler(async (req, res) => {
  const contracts = await PlayerContract.find()
    .populate('player', 'username role country')
    .populate('team', 'name tag game');

  res.json({
    success: true,
    count: contracts.length,
    data: contracts,
  });
});
