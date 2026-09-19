const mongoose = require('mongoose');

const matchInviteSchema = new mongoose.Schema({
  fromTeam: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  toTeam: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  tournament: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament', default: null },
  message: { type: String, trim: true, maxlength: 280 },
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Declined'],
    default: 'Pending',
  },
  // (8) TTL Index — pending invites are automatically purged 24 hours after creation
  createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 },
});

module.exports = mongoose.model('MatchInvite', matchInviteSchema);
