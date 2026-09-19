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

module.exports = mongoose.model('Player', playerSchema);
