const MatchInvite = require('../models/MatchInvite');
const asyncHandler = require('../middleware/asyncHandler');
const ApiError = require('../utils/ApiError');
const paginate = require('../utils/pagination');

const POPULATE_FIELDS = [
  { path: 'fromTeam', select: 'name tag' },
  { path: 'toTeam', select: 'name tag' },
  { path: 'tournament', select: 'name' },
];

// @desc  Create a pending match invite
// (1) CRUD Operations, (8) TTL Index — auto-deleted 24 hours after creation
exports.createInvite = asyncHandler(async (req, res) => {
  const invite = await MatchInvite.create(req.body);
  res.status(201).json({
    success: true,
    message: 'Invite created; it will automatically expire in 24 hours if left pending',
    data: invite,
  });
});

// @desc  List invites with pagination, sorting, and filtering
exports.getInvites = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = paginate(req.query);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.toTeam) filter.toTeam = req.query.toTeam;
  if (req.query.fromTeam) filter.fromTeam = req.query.fromTeam;

  const [invites, total] = await Promise.all([
    MatchInvite.find(filter).populate(POPULATE_FIELDS).sort(sort).skip(skip).limit(limit),
    MatchInvite.countDocuments(filter),
  ]);

  res.json({
    success: true,
    count: invites.length,
    total,
    page,
    pages: Math.ceil(total / limit) || 1,
    data: invites,
  });
});

// @desc  Get a single invite
exports.getInvite = asyncHandler(async (req, res) => {
  const invite = await MatchInvite.findById(req.params.id).populate(POPULATE_FIELDS);
  if (!invite) throw new ApiError(404, 'Invite not found');
  res.json({ success: true, data: invite });
});

// @desc  Accept or decline a pending invite
exports.respondToInvite = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['Accepted', 'Declined'].includes(status)) {
    throw new ApiError(400, 'status must be either "Accepted" or "Declined"');
  }

  const invite = await MatchInvite.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true }
  );
  if (!invite) throw new ApiError(404, 'Invite not found');
  res.json({ success: true, data: invite });
});

// @desc  Delete an invite
exports.deleteInvite = asyncHandler(async (req, res) => {
  const invite = await MatchInvite.findByIdAndDelete(req.params.id);
  if (!invite) throw new ApiError(404, 'Invite not found');
  res.json({ success: true, data: {} });
});
