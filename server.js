require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');
const { watchMatchChanges } = require('./src/utils/changeStreamWatcher');

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`GameVault API listening on port ${PORT}`);

      // (10) Change Streams — requires the MongoDB deployment to be a replica set
      // (a local single-node replica set, or MongoDB Atlas). Failures are logged,
      // not fatal, so the rest of the API still works without it.
      try {
        watchMatchChanges();
      } catch (err) {
        console.warn('Change streams unavailable:', err.message);
      }
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });
