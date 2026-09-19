const mongoose = require('mongoose');

const tournamentSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Tournament name is required'], trim: true },
    game: { type: String, required: [true, 'Game is required'], trim: true },
    description: { type: String, trim: true },
    rules: { type: String, trim: true },
    format: {
      type: String,
      enum: ['Single Elimination', 'Double Elimination', 'Round Robin', 'Swiss'],
      default: 'Single Elimination',
    },
    // (2) Relational Linking — teams registered for this tournament
    teams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],
    startDate: { type: Date, required: [true, 'Start date is required'] },
    endDate: { type: Date },
    prizePool: { type: Number, default: 0, min: 0 },
    isLAN: { type: Boolean, default: false },
    // (9) Geospatial Queries — GeoJSON Point for LAN venues
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] }, // [longitude, latitude]
      address: { type: String, trim: true },
    },
    status: {
      type: String,
      enum: ['Upcoming', 'Ongoing', 'Completed', 'Cancelled'],
      default: 'Upcoming',
    },
  },
  { timestamps: true }
);

// (9) Geospatial index for $near queries
tournamentSchema.index({ location: '2dsphere' });
// (6) Text Search — search tournament titles and rule descriptions
tournamentSchema.index({ name: 'text', description: 'text', rules: 'text' });
// (4) Indexing — common filters/sorts
tournamentSchema.index({ startDate: 1 });
tournamentSchema.index({ game: 1, status: 1 });

module.exports = mongoose.model('Tournament', tournamentSchema);
