const mongoose = require('mongoose');

// (13) Capped Collection — circular FIFO buffer with fixed size and document limit.
// Oldest events are automatically overwritten when max size/count is reached.
const matchEventLogSchema = new mongoose.Schema(
  {
    match: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', default: null },
    eventType: {
      type: String,
      required: [true, 'Event type is required'],
      enum: ['Kill', 'BombPlant', 'Defuse', 'Pause', 'RosterChange', 'AdminAction'],
    },
    message: { type: String, required: [true, 'Event message is required'], trim: true },
    severity: {
      type: String,
      enum: ['Info', 'Warning', 'Critical'],
      default: 'Info',
    },
    timestamp: { type: Date, default: Date.now },
  },
  {
    capped: { size: 1048576, max: 500, autoIndexId: true },
    timestamps: true,
  }
);

module.exports = mongoose.model('MatchEventLog', matchEventLogSchema);
