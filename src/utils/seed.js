// Populates the database with sample data so every one of the 10 MongoDB
// features (text search terms, geospatial coordinates, relational links,
// stats for rankings, etc.) has something meaningful to query.
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const Player = require('../models/Player');
const Team = require('../models/Team');
const Tournament = require('../models/Tournament');
const Match = require('../models/Match');
const MatchInvite = require('../models/MatchInvite');

const run = async () => {
  await connectDB();

  await Promise.all([
    Player.deleteMany({}),
    Team.deleteMany({}),
    Tournament.deleteMany({}),
    Match.deleteMany({}),
    MatchInvite.deleteMany({}),
  ]);

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

  const players = await Player.insertMany([
    { username: 'skyline', email: 'skyline@gamevault.gg', team: teamA._id, role: 'Duelist', country: 'US' },
    { username: 'ember', email: 'ember@gamevault.gg', team: teamA._id, role: 'IGL', country: 'CA' },
    { username: 'wolfden', email: 'wolfden@gamevault.gg', team: teamB._id, role: 'Sentinel', country: 'DE' },
    { username: 'falconeye', email: 'falconeye@gamevault.gg', team: teamC._id, role: 'Carry', country: 'SG' },
    { username: 'freeagent', email: 'freeagent@gamevault.gg', role: 'Flex', country: 'GB' },
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

  const tournamentOnline = await Tournament.create({
    name: 'GameVault Winter Championship',
    game: 'Valorant',
    description: 'A global online qualifier series for the winter season.',
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

  await Match.create([
    {
      tournament: tournamentOnline._id,
      game: 'Valorant',
      round: 'Semifinal',
      teamA: teamA._id,
      teamB: teamB._id,
      scoreA: 2,
      scoreB: 1,
      winner: teamA._id,
      status: 'Completed',
      scheduledAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    },
    {
      tournament: tournamentOnline._id,
      game: 'Valorant',
      round: 'Final',
      teamA: teamA._id,
      teamB: teamB._id,
      status: 'Scheduled',
      scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
    },
  ]);

  await MatchInvite.create({
    fromTeam: teamB._id,
    toTeam: teamC._id,
    tournament: tournamentOnline._id,
    message: 'Want to scrim before the qualifier?',
  });

  console.log('Seed data inserted successfully.');
  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
