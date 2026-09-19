const EventEmitter = require('events');
const mongoose = require('mongoose');

// (10) Change Streams — watches live score/status updates on the Match collection
// and re-broadcasts them so an SSE client (see matchController.streamLiveMatches)
// can push real-time updates to connected viewers.
const matchChangeEmitter = new EventEmitter();

const watchMatchChanges = () => {
  const Match = mongoose.model('Match');
  const changeStream = Match.watch([], { fullDocument: 'updateLookup' });

  changeStream.on('change', (change) => {
    console.log(`[ChangeStream] ${change.operationType} on Match ${change.documentKey?._id}`);
    matchChangeEmitter.emit('change', {
      operationType: change.operationType,
      documentKey: change.documentKey,
      fullDocument: change.fullDocument,
      updatedFields: change.updateDescription?.updatedFields,
    });
  });

  changeStream.on('error', (err) => {
    console.warn('[ChangeStream] error (requires a replica set / Atlas cluster):', err.message);
  });

  return changeStream;
};

module.exports = { watchMatchChanges, matchChangeEmitter };
