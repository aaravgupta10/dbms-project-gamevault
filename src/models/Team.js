const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Team name is required'],
      unique: true,
      trim: true,
    },
    tag: {
      type: String,
      required: [true, 'Team tag is required'],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: 6,
    },
    game: { type: String, required: [true, 'Game is required'], trim: true },
    region: { type: String, trim: true },
    // (2) Relational Linking — roster of players, kept in sync via roster transfers
    players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }],
    captain: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', default: null },
    stats: {
      wins: { type: Number, default: 0, min: 0 },
      losses: { type: Number, default: 0, min: 0 },
      points: { type: Number, default: 0 },
    },
    // (17) Soft Delete — preserves historical match integrity when a team disbands
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// (17) Mongoose Query Middleware Hooks — automatically intercept read queries to filter
// out soft-deleted teams unless explicitly queried with includeDeleted: true
teamSchema.pre(/^find/, function (next) {
  if (this.getFilter().includeDeleted !== true) {
    this.where({ isDeleted: { $ne: true } });
  } else {
    delete this.getFilter().includeDeleted;
  }
  next();
});

teamSchema.pre('countDocuments', function (next) {
  if (this.getFilter().includeDeleted !== true) {
    this.where({ isDeleted: { $ne: true } });
  } else {
    delete this.getFilter().includeDeleted;
  }
  next();
});

// (4) Indexing — leaderboards sort by points, lookups filter by game
teamSchema.index({ game: 1 });
teamSchema.index({ 'stats.points': -1 });
teamSchema.index({ isDeleted: 1 });

module.exports = mongoose.model('Team', teamSchema);

