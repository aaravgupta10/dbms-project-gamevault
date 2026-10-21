// Populates the database with sample data so every one of the 20 MongoDB
// features (text search terms, geospatial coordinates, relational links,
// stats for rankings, faceted search, bracket graph lookup, capped collection,
// $jsonSchema validation, partial indexes, array updates, soft delete, collation, GridFS)
// has rich, predictable data to demonstrate.
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const Player = require('../models/Player');
const Team = require('../models/Team');
const Tournament = require('../models/Tournament');
const Match = require('../models/Match');
const MatchInvite = require('../models/MatchInvite');
const MatchEventLog = require('../models/MatchEventLog');
const PlayerContract = require('../models/PlayerContract');

const run = async () => {
  await connectDB();
  const db = mongoose.connection.db;

  // Drop existing collections to ensure fresh indexes & schema configurations
  await Promise.all([
    Player.deleteMany({}),
    Team.deleteMany({}),
    Tournament.deleteMany({}),
    Match.deleteMany({}),
    MatchInvite.deleteMany({}),
  ]);

  // Clean / recreate Capped Collection (Feature 13)
  // Note: Capped collections cannot use deleteMany() in MongoDB — must be dropped and recreated
  try {
    await db.collection('matcheventlogs').drop();
  } catch (e) {}
  await db.createCollection('matcheventlogs', {
    capped: true,
    size: 1048576,
    max: 500,
  });

  // Recreate PlayerContract with native engine-level $jsonSchema validation (Feature 14)
  try {
    await db.collection('playercontracts').drop();
  } catch (e) {}
  await db.createCollection('playercontracts', {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['contractCode', 'salary', 'status'],
        properties: {
          contractCode: {
            bsonType: 'string',
            pattern: '^CTR-[0-9]{4}-[A-Z]{2}$',
            description: 'must match pattern CTR-####-XX',
          },
          salary: {
            bsonType: 'number',
            minimum: 500,
            description: 'minimum pro salary is $500',
          },
          status: {
            enum: ['Active', 'Pending', 'Terminated'],
            description: 'must be Active, Pending, or Terminated',
          },
        },
      },
    },
    validationAction: 'error',
  });

  // Recreate GridFS collections for fresh state (Feature 20)
  try {
    await db.collection('media.files').drop();
    await db.collection('media.chunks').drop();
  } catch (e) {}

  // 1. Teams (Feature 17: includes active teams and soft-deleted team)
  const teamA = await Team.create({
    name: 'Nova Phoenix',
    tag: 'NOVA',
    game: 'Valorant',
    region: 'NA',
    stats: { wins: 12, losses: 3, points: 240 },
  });

  const teamB = await Team.create({
    name: 'Crimson Wolves',
    tag: 'CRIM',
    game: 'Valorant',
    region: 'EU',
    stats: { wins: 8, losses: 6, points: 160 },
  });

  const teamC = await Team.create({
    name: 'Iron Falcons',
    tag: 'FALC',
    game: 'Dota 2',
    region: 'SEA',
    stats: { wins: 5, losses: 5, points: 100 },
  });

  // Soft-deleted team to demonstrate Feature 17
  const teamDisbanded = await Team.create({
    name: 'Ghost Raiders',
    tag: 'GHOST',
    game: 'Valorant',
    region: 'NA',
    stats: { wins: 1, losses: 9, points: 20 },
    isDeleted: true,
    deletedAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
  });

  // 2. Players (Feature 15: free agents; Feature 19: collation gamerTags)
  const players = await Player.insertMany([
    {
      username: 'skyline',
      gamerTag: 'SkyLine',
      email: 'skyline@gamevault.gg',
      team: teamA._id,
      role: 'Duelist',
      country: 'US',
      stats: { matchesPlayed: 25, kills: 340, deaths: 180, assists: 95 },
    },
    {
      username: 'ember',
      gamerTag: 'EMBER',
      email: 'ember@gamevault.gg',
      team: teamA._id,
      role: 'IGL',
      country: 'CA',
      stats: { matchesPlayed: 25, kills: 220, deaths: 195, assists: 210 },
    },
    {
      username: 'wolfden',
      gamerTag: 'WolfDen',
      email: 'wolfden@gamevault.gg',
      team: teamB._id,
      role: 'Sentinel',
      country: 'DE',
      stats: { matchesPlayed: 18, kills: 190, deaths: 160, assists: 130 },
    },
    {
      username: 'falconeye',
      gamerTag: 'FalconEye',
      email: 'falconeye@gamevault.gg',
      team: teamC._id,
      role: 'Carry',
      country: 'SG',
      stats: { matchesPlayed: 12, kills: 145, deaths: 110, assists: 85 },
    },
    // Free Agent 1 (Featured in Partial Index and Collation searches)
    {
      username: 'freeagent',
      gamerTag: 'v1per',
      email: 'freeagent@gamevault.gg',
      role: 'Flex',
      country: 'GB',
      team: null,
      stats: { matchesPlayed: 40, kills: 520, deaths: 230, assists: 180 },
    },
    // Free Agent 2
    {
      username: 'shadowsniper',
      gamerTag: 'ShadowSniper',
      email: 'shadow@gamevault.gg',
      role: 'Duelist',
      country: 'FR',
      team: null,
      stats: { matchesPlayed: 32, kills: 410, deaths: 205, assists: 110 },
    },
  ]);

  teamA.players = [players[0]._id, players[1]._id];
  teamA.captain = players[1]._id;
  await teamA.save();

  teamB.players = [players[2]._id];
  teamB.captain = players[2]._id;
  await teamB.save();

  teamC.players = [players[3]._id];
  teamC.captain = players[3]._id;
  await teamC.save();

  // 3. Tournaments (Feature 6: Text Search, Feature 9: Geospatial, Feature 11: Faceted Search)
  const tournamentOnline = await Tournament.create({
    name: 'GameVault Winter Championship',
    game: 'Valorant',
    description: 'A global online qualifier series for the winter season with double elimination bracket.',
    rules: 'Standard competitive ruleset, best of three per map, no coaching during rounds.',
    format: 'Double Elimination',
    teams: [teamA._id, teamB._id],
    startDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    prizePool: 50000,
    isLAN: false,
    status: 'Upcoming',
  });

  const tournamentLAN = await Tournament.create({
    name: 'GameVault LAN Invitational',
    game: 'Dota 2',
    description: 'An in-person invitational bringing together top regional Dota 2 rosters.',
    rules: 'LAN hardware provided, single elimination bracket, best of one until finals.',
    format: 'Single Elimination',
    teams: [teamC._id],
    startDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
    prizePool: 20000,
    isLAN: true,
    location: {
      type: 'Point',
      coordinates: [-122.4194, 37.7749], // San Francisco
      address: 'Moscone Center, San Francisco, CA',
    },
    status: 'Upcoming',
  });

  const tournamentAmateur = await Tournament.create({
    name: 'GameVault Rookie Open',
    game: 'Valorant',
    description: 'Grassroots open tournament for upcoming collegiate esports squads.',
    rules: 'Single map elimination, open registration.',
    format: 'Single Elimination',
    teams: [teamA._id, teamB._id],
    startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    prizePool: 3500,
    isLAN: false,
    status: 'Completed',
  });

  // 4. Bracket Matches (Feature 12: $graphLookup hierarchical progression & Feature 16: positional player stats)
  // Quarterfinal 1
  const qfMatch1 = await Match.create({
    tournament: tournamentOnline._id,
    game: 'Valorant',
    round: 'Quarterfinal 1',
    teamA: teamA._id,
    teamB: teamB._id,
    scoreA: 2,
    scoreB: 0,
    winner: teamA._id,
    status: 'Completed',
    scheduledAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
    playerPerformances: [
      { player: players[0]._id, kills: 22, deaths: 10, assists: 5 },
      { player: players[1]._id, kills: 15, deaths: 12, assists: 14 },
    ],
  });

  // Quarterfinal 2
  const qfMatch2 = await Match.create({
    tournament: tournamentOnline._id,
    game: 'Valorant',
    round: 'Quarterfinal 2',
    teamA: teamB._id,
    teamB: teamC._id,
    scoreA: 2,
    scoreB: 1,
    winner: teamB._id,
    status: 'Completed',
    scheduledAt: new Date(Date.now() - 1000 * 60 * 60 * 40),
    playerPerformances: [
      { player: players[2]._id, kills: 19, deaths: 14, assists: 8 },
    ],
  });

  // Semifinal (points to Quarterfinals via previousMatchIds)
  const semiMatch = await Match.create({
    tournament: tournamentOnline._id,
    game: 'Valorant',
    round: 'Semifinal',
    previousMatchIds: [qfMatch1._id, qfMatch2._id],
    teamA: teamA._id,
    teamB: teamB._id,
    scoreA: 2,
    scoreB: 1,
    winner: teamA._id,
    status: 'Completed',
    scheduledAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    playerPerformances: [
      { player: players[0]._id, kills: 28, deaths: 16, assists: 9 },
      { player: players[1]._id, kills: 18, deaths: 15, assists: 20 },
      { player: players[2]._id, kills: 24, deaths: 19, assists: 7 },
    ],
  });

  // Final match (root of $graphLookup traversal)
  const finalMatch = await Match.create({
    tournament: tournamentOnline._id,
    game: 'Valorant',
    round: 'Final',
    previousMatchIds: [semiMatch._id],
    teamA: teamA._id,
    teamB: teamB._id,
    scoreA: 1,
    scoreB: 0,
    status: 'Live', // Feature 15 partial index targets this
    scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 2),
    playerPerformances: [
      { player: players[0]._id, kills: 8, deaths: 3, assists: 2 },
      { player: players[1]._id, kills: 5, deaths: 4, assists: 6 },
    ],
  });

  // 5. Match Invites (Feature 8: TTL Index)
  await MatchInvite.create({
    fromTeam: teamB._id,
    toTeam: teamC._id,
    tournament: tournamentOnline._id,
    message: 'Want to scrim before the qualifier?',
  });

  // 6. Capped Collection Events (Feature 13: circular event ticker)
  await MatchEventLog.create([
    {
      match: finalMatch._id,
      eventType: 'AdminAction',
      message: 'Official match map pool veto completed: Haven, Ascent, Bind selected.',
      severity: 'Info',
    },
    {
      match: finalMatch._id,
      eventType: 'Kill',
      message: 'skyline eliminated wolfden with an Operator headshot (Round 4).',
      severity: 'Info',
    },
    {
      match: finalMatch._id,
      eventType: 'BombPlant',
      message: 'Spike planted on Site A by Nova Phoenix.',
      severity: 'Info',
    },
    {
      match: finalMatch._id,
      eventType: 'Pause',
      message: 'Tactical timeout called by Crimson Wolves coach.',
      severity: 'Warning',
    },
  ]);

  // 7. Player Contracts with Engine Schema Validation (Feature 14)
  await PlayerContract.create([
    {
      player: players[0]._id,
      team: teamA._id,
      contractCode: 'CTR-2026-NA',
      salary: 4500,
      status: 'Active',
      startDate: new Date(),
    },
    {
      player: players[2]._id,
      team: teamB._id,
      contractCode: 'CTR-2026-EU',
      salary: 3800,
      status: 'Active',
      startDate: new Date(),
    },
  ]);

  // 8. Sample Rulebook stored in GridFS (Feature 20: Chunked Binary Storage)
  const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'media' });
  const samplePdfContent = Buffer.from(
    '%PDF-1.4\n1 0 obj\n<< /Title (GameVault Winter Championship Rulebook) /Author (GameVault League Operations) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF'
  );

  await new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream('GameVault_Winter_Rulebook_2026.pdf', {
      contentType: 'application/pdf',
      metadata: {
        category: 'Rulebook',
        tournamentId: tournamentOnline._id,
        pages: 12,
        version: '1.0',
      },
    });
    uploadStream.end(samplePdfContent);
    uploadStream.on('finish', resolve);
    uploadStream.on('error', reject);
  });

  console.log('Seed data inserted successfully (all 20 DBMS features populated).');
  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
