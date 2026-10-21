const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema(
  {
    // (2) Relational Linking — match references tournament and both teams
    tournament: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament', required: true },
    game: { type: String, required: [true, 'Game is required'], trim: true },
    round: { type: String, trim: true, default: 'Round 1' },
    teamA: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    teamB: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    scoreA: { type: Number, default: 0, min: 0 },
    scoreB: { type: Number, default: 0, min: 0 },
    winner: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
    // (12) Recursive Graph Traversal ($graphLookup) — links earlier matches in tournament bracket
    previousMatchIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Match' }],
    // (16) Positional Array Updates — fine-grained player stats updated atomically via arrayFilters
    playerPerformances: [
      {
        player: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
        kills: { type: Number, default: 0, min: 0 },
        deaths: { type: Number, default: 0, min: 0 },
        assists: { type: Number, default: 0, min: 0 },
      },
    ],
    status: {
      type: String,
      enum: ['Scheduled', 'Live', 'Completed'],
      default: 'Scheduled',
    },
    scheduledAt: { type: Date, required: [true, 'Scheduled date/time is required'] },
  },
  { timestamps: true }
);

// (4) Indexing — matches are frequently listed by tournament/date and filtered by status/game
matchSchema.index({ tournament: 1, scheduledAt: 1 });
matchSchema.index({ status: 1 });
matchSchema.index({ game: 1 });

// (15) Partial Filter Index — only indexes matches currently marked 'Live'
// Used by real-time scoreboard queries to immediately find live matches without scanning past or future ones.
matchSchema.index(
  { scheduledAt: 1 },
  { partialFilterExpression: { status: 'Live' } }
);

module.exports = mongoose.model('Match', matchSchema);

