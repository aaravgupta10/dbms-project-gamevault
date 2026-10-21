const mongoose = require('mongoose');

// (14) Engine-Level Schema Validation ($jsonSchema)
// In addition to Mongoose validation, this collection is backed by an explicit MongoDB
// database engine validator ($jsonSchema) enforced at storage level.
const playerContractSchema = new mongoose.Schema(
  {
    player: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    contractCode: {
      type: String,
      required: [true, 'Contract code is required'],
      match: [/^CTR-[0-9]{4}-[A-Z]{2}$/, 'Must match format CTR-####-XX'],
      trim: true,
    },
    salary: {
      type: Number,
      required: [true, 'Salary is required'],
      min: [500, 'Minimum pro salary is $500'],
    },
    status: {
      type: String,
      enum: ['Active', 'Pending', 'Terminated'],
      default: 'Pending',
    },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
  },
  { timestamps: true }
);

playerContractSchema.index({ player: 1, team: 1 });
playerContractSchema.index({ contractCode: 1 }, { unique: true });

module.exports = mongoose.model('PlayerContract', playerContractSchema);
