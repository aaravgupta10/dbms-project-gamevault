const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 24,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    realName: { type: String, trim: true },
    // (2) Relational Linking — a player belongs to at most one team
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
    role: {
      type: String,
      enum: ['Duelist', 'Controller', 'Sentinel', 'Initiator', 'IGL', 'Support', 'Carry', 'Flex'],
      default: 'Flex',
    },
    country: { type: String, trim: true },
    // (19) Collation — case-insensitive gamerTag (e.g. 'v1per' == 'V1PER')
    gamerTag: { type: String, trim: true },
    stats: {
      matchesPlayed: { type: Number, default: 0, min: 0 },
      kills: { type: Number, default: 0, min: 0 },
      deaths: { type: Number, default: 0, min: 0 },
      assists: { type: Number, default: 0, min: 0 },
    },
  },
  { timestamps: true }
);

// (4) Indexing — frequently filtered/joined fields
playerSchema.index({ team: 1 });
playerSchema.index({ role: 1 });

// (15) Partial Filter Index — only indexes unassigned free agents (team == null)
// Drastically saves RAM since active rostered players are omitted from this index.
playerSchema.index(
  { 'stats.kills': -1, createdAt: -1 },
  { partialFilterExpression: { team: null } }
);

// (19) Collation — strength: 2 treats uppercase and lowercase as identical
playerSchema.index(
  { gamerTag: 1 },
  { unique: true, sparse: true, collation: { locale: 'en', strength: 2 } }
);

module.exports = mongoose.model('Player', playerSchema);

