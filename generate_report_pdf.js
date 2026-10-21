const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const outputPath = path.join(__dirname, 'GameVault_DBMS_Project_Report.pdf');

try {
  fs.unlinkSync(outputPath);
} catch (e) {}

const TOTAL_PAGES = 13;

const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 25, bottom: 0, left: 40, right: 40 },
  autoFirstPage: true,
});


const writeStream = fs.createWriteStream(outputPath);
doc.pipe(writeStream);

const PAGE_WIDTH = doc.page.width - 80; // 515.28 pt

// Professional Color Palette
const C = {
  primaryDark: '#0f172a',    // Slate 900
  primaryBlue: '#1d4ed8',    // Blue 700
  navyHeader: '#1e3a8a',     // Blue 900
  accentCyan: '#0284c7',     // Sky 600
  accentPurple: '#7c3aed',   // Violet 600
  accentGreen: '#059669',    // Emerald 600
  bodyText: '#334155',       // Slate 700
  mutedText: '#64748b',      // Slate 500
  cardBg: '#f8fafc',         // Slate 50
  cardBorder: '#cbd5e1',     // Slate 300
  codeBg: '#f1f5f9',         // Slate 100
  white: '#ffffff',
};

// Helper: draw standard running header & footer inline on each page
function drawPageDecorations(pageNum) {
  // Running top header for pages 2 to 13
  if (pageNum > 1) {
    doc
      .fillColor(C.mutedText)
      .font('Helvetica')
      .fontSize(7.5)
      .text('GameVault — Esports Tournament & Team Management System (DBMS Technical Report)', 40, 20, {
        width: PAGE_WIDTH,
        align: 'left',
        lineBreak: false,
      });

    doc
      .strokeColor(C.cardBorder)
      .lineWidth(0.5)
      .moveTo(40, 30)
      .lineTo(40 + PAGE_WIDTH, 30)
      .stroke();
  }

  // Running bottom footer for all pages
  const footY = 818;
  doc
    .strokeColor(C.cardBorder)
    .lineWidth(0.5)
    .moveTo(40, footY - 4)
    .lineTo(40 + PAGE_WIDTH, footY - 4)
    .stroke();

  doc
    .fillColor(C.mutedText)
    .font('Helvetica')
    .fontSize(7.5)
    .text('DBMS Course Project • Version 3.0 • Node.js, Express & MongoDB Atlas', 40, footY, {
      width: PAGE_WIDTH / 2,
      align: 'left',
      lineBreak: false,
    });

  doc
    .fillColor(C.mutedText)
    .font('Helvetica')
    .fontSize(7.5)
    .text(`Page ${pageNum} of ${TOTAL_PAGES}`, 40 + PAGE_WIDTH / 2, footY, {
      width: PAGE_WIDTH / 2,
      align: 'right',
      lineBreak: false,
    });
}

// Helper: draw a styled feature card
function drawFeatureCard(x, y, cardWidth, cardHeight, num, name, category, plainExplanation, dbmsPrinciple, whereItLives, endpoint, vivaPoint) {
  doc.save();

  // Card Outer Box
  doc.roundedRect(x, y, cardWidth, cardHeight, 6).fillAndStroke(C.white, C.cardBorder);

  // Card Header Banner
  doc.roundedRect(x, y, cardWidth, 24, 6).fill(C.primaryDark);
  doc.rect(x, y + 18, cardWidth, 6).fill(C.primaryDark);

  // Feature Title
  doc
    .fillColor(C.white)
    .font('Helvetica-Bold')
    .fontSize(9.5)
    .text(`FEATURE ${num}: ${name.toUpperCase()}`, x + 10, y + 6, {
      width: cardWidth - 120,
      lineBreak: false,
    });

  // Category Badge
  const pillW = 100;
  doc.roundedRect(x + cardWidth - pillW - 8, y + 4, pillW, 16, 4).fill(C.primaryBlue);
  doc
    .fillColor(C.white)
    .font('Helvetica-Bold')
    .fontSize(7.5)
    .text(category.toUpperCase(), x + cardWidth - pillW - 8, y + 8, {
      width: pillW,
      align: 'center',
      lineBreak: false,
    });

  // Body content
  let contentY = y + 30;
  const innerW = cardWidth - 20;
  const innerX = x + 10;

  // 1. Gaming Analogy
  doc
    .fillColor(C.accentCyan)
    .font('Helvetica-Bold')
    .fontSize(7.8)
    .text('SIMPLE EXPLANATION & GAMING ANALOGY:', innerX, contentY, { lineBreak: false });
  contentY += 11;

  doc
    .fillColor(C.bodyText)
    .font('Helvetica')
    .fontSize(8.2)
    .text(plainExplanation, innerX, contentY, { width: innerW, lineGap: 1.5, align: 'justify' });
  contentY = doc.y + 6;

  // 2. DBMS Concept
  doc
    .fillColor(C.accentPurple)
    .font('Helvetica-Bold')
    .fontSize(7.8)
    .text('DBMS & MONGODB ENGINE PRINCIPLE:', innerX, contentY, { lineBreak: false });
  contentY += 11;

  doc
    .fillColor(C.bodyText)
    .font('Helvetica')
    .fontSize(8.2)
    .text(dbmsPrinciple, innerX, contentY, { width: innerW, lineGap: 1.5, align: 'justify' });
  contentY = doc.y + 6;

  // 3. Technical Metadata Box
  const metaBoxH = 68;
  doc.roundedRect(innerX, contentY, innerW, metaBoxH, 4).fillAndStroke(C.codeBg, C.cardBorder);

  doc
    .fillColor(C.primaryDark)
    .font('Helvetica-Bold')
    .fontSize(7.6)
    .text('Code Files: ', innerX + 8, contentY + 6, { continued: true, lineBreak: false })
    .font('Helvetica')
    .fillColor(C.bodyText)
    .text(whereItLives, { width: innerW - 16, lineBreak: false });

  doc
    .fillColor(C.primaryDark)
    .font('Helvetica-Bold')
    .fontSize(7.6)
    .text('Endpoint: ', innerX + 8, contentY + 18, { continued: true, lineBreak: false })
    .font('Courier-Bold')
    .fillColor(C.primaryBlue)
    .text(endpoint, { width: innerW - 16, lineBreak: false });

  // Viva Quote Box
  doc.roundedRect(innerX + 6, contentY + 32, innerW - 12, 30, 3).fill('#ecfdf5');
  doc.rect(innerX + 6, contentY + 32, 3, 30).fill(C.accentGreen);

  doc
    .fillColor(C.accentGreen)
    .font('Helvetica-Bold')
    .fontSize(7.4)
    .text('Viva Defense: ', innerX + 13, contentY + 36, { continued: true, lineBreak: false })
    .font('Helvetica-Oblique')
    .fillColor('#065f46')
    .text(`"${vivaPoint}"`, { width: innerW - 30, lineGap: 1.2 });

  doc.restore();
}

// ==========================================================
// PAGE 1: TITLE BANNER, ABSTRACT, ARCHITECTURE
// ==========================================================
drawPageDecorations(1);

// Title Banner
doc.roundedRect(40, 38, PAGE_WIDTH, 142, 8).fill(C.primaryDark);

doc
  .fillColor(C.white)
  .font('Helvetica-Bold')
  .fontSize(24)
  .text('GAMEVAULT', 56, 56, { lineBreak: false });

doc
  .font('Helvetica')
  .fontSize(12)
  .fillColor('#94a3b8')
  .text('Esports Tournament & Team Management System', 56, 84, { lineBreak: false });

doc
  .font('Helvetica-Bold')
  .fontSize(9.5)
  .fillColor('#38bdf8')
  .text('COMPREHENSIVE DBMS PROJECT SPECIFICATION & TECHNICAL REPORT', 56, 106, { lineBreak: false });

doc
  .font('Helvetica')
  .fontSize(8.5)
  .fillColor('#cbd5e1')
  .text('Complete Architectural Documentation & Demonstration Guide for 20 Distinct MongoDB Functionalities', 56, 123, { lineBreak: false });

doc
  .font('Helvetica-Bold')
  .fontSize(8)
  .fillColor('#f8fafc')
  .text('Stack: Node.js • Express.js • MongoDB Atlas (Replica Set) • Mongoose ODM', 56, 146, { lineBreak: false });

// 1. Abstract
let curY = 196;
doc.rect(40, curY, 4, 16).fill(C.primaryBlue);
doc
  .fillColor(C.primaryDark)
  .font('Helvetica-Bold')
  .fontSize(12.5)
  .text('1. Project Abstract & Executive Summary', 50, curY + 1, { lineBreak: false });

curY += 24;
doc
  .fillColor(C.bodyText)
  .font('Helvetica')
  .fontSize(8.8)
  .text(
    'GameVault is an enterprise-grade backend REST API engineered to organize, orchestrate, and analyze a competitive esports ecosystem. Competitive gaming leagues manage intricate, fast-moving datasets spanning professional players, sponsored multi-game teams, multi-tier tournament brackets, live round scoring, anti-cheat audit trails, and legally binding player contracts.',
    40,
    curY,
    { width: PAGE_WIDTH, align: 'justify', lineGap: 2 }
  );

curY = doc.y + 6;
doc.text(
  'While traditional relational database management systems (RDBMS) suffer from rigid table schemas and severe performance penalties when resolving deeply nested 5-table JOINs for live esports data, GameVault leverages MongoDB. MongoDB\'s flexible BSON document model allows intuitive, document-oriented representations of players, rosters, and match progressions while natively supporting multi-document ACID transactions, geospatial indexing, full-text searches, and change streams.',
  40,
  curY,
  { width: PAGE_WIDTH, align: 'justify', lineGap: 2 }
);

curY = doc.y + 6;
doc.text(
  'Version 3.0 explicitly implements and demonstrates 20 distinct MongoDB and DBMS functionalities. Each capability is isolated into a dedicated controller, model, and route, and is verified against a live MongoDB Atlas replica set cluster.',
  40,
  curY,
  { width: PAGE_WIDTH, align: 'justify', lineGap: 2 }
);

// 2. Architecture
curY = doc.y + 16;
doc.rect(40, curY, 4, 16).fill(C.primaryBlue);
doc
  .fillColor(C.primaryDark)
  .font('Helvetica-Bold')
  .fontSize(12.5)
  .text('2. System Architecture & Layered Design', 50, curY + 1, { lineBreak: false });

curY += 24;
const archLayers = [
  ['Client & Interface Layer', 'VS Code REST Client (demo/gamevault.http), cURL, and Postman submitting standard HTTP/REST requests.'],
  ['Routing Layer (Express.js)', 'Modular Express routers mounted in src/app.js directing incoming requests to specialized controllers.'],
  ['Controller Layer (Business Logic)', 'Enforces domain logic, query pagination, transaction session management, and change-stream broadcasting.'],
  ['Mongoose ODM Layer', 'Provides schema modeling, lifecycle query middleware hooks, virtual population, and index registrations.'],
  ['Database Engine (MongoDB Atlas)', 'Cloud replica set cluster executing aggregations, $jsonSchema validation, oplog change streams, and GridFS.'],
];

archLayers.forEach(([layer, desc]) => {
  doc
    .font('Helvetica-Bold')
    .fontSize(8.3)
    .fillColor(C.primaryBlue)
    .text(`• ${layer}: `, 50, curY, { continued: true, lineBreak: false })
    .font('Helvetica')
    .fillColor(C.bodyText)
    .text(desc, { width: PAGE_WIDTH - 20, lineGap: 1.5 });
  curY = doc.y + 4;
});

// ==========================================================
// PAGE 2: MASTER FEATURE SUMMARY TABLE (ALL 20 FEATURES)
// ==========================================================
doc.addPage();
drawPageDecorations(2);

doc.rect(40, 40, 4, 16).fill(C.primaryBlue);
doc
  .fillColor(C.primaryDark)
  .font('Helvetica-Bold')
  .fontSize(13)
  .text('3. Master Feature Map (All 20 Database Capabilities)', 50, 41, { lineBreak: false });

doc
  .fillColor(C.mutedText)
  .font('Helvetica')
  .fontSize(8.5)
  .text('Every functionality is fully implemented in the backend, seeded with test data, and verified via HTTP.', 40, 62, { lineBreak: false });

// Table Header
const tY = 78;
doc.rect(40, tY, PAGE_WIDTH, 20).fill(C.primaryDark);
doc.fillColor(C.white).font('Helvetica-Bold').fontSize(8);
doc.text('#', 46, tY + 6, { width: 20, lineBreak: false });
doc.text('FEATURE NAME', 70, tY + 6, { width: 140, lineBreak: false });
doc.text('CATEGORY', 215, tY + 6, { width: 75, lineBreak: false });
doc.text('DATABASE CONCEPT', 295, tY + 6, { width: 110, lineBreak: false });
doc.text('LIVE VERIFIED ENDPOINT', 410, tY + 6, { width: 135, lineBreak: false });

const featuresTableData = [
  ['1', 'CRUD Operations', 'Baseline', 'BSON create, read, update, delete', 'POST/GET /api/players'],
  ['2', 'Relational Linking', 'Relational', 'ObjectId refs & .populate() joins', 'GET /api/teams'],
  ['3', 'Aggregation Pipeline', 'Analytics', '$lookup, $addFields, $group', 'GET /api/stats/rankings'],
  ['4', 'Advanced Indexing', 'Optimization', 'Compound & unique B-tree indexes', 'Atlas Indexes Tab'],
  ['5', 'Pagination & Sorting', 'Optimization', 'Skip/limit cursor pagination', 'GET /api/players?page=1&limit=10'],
  ['6', 'Full-Text Search', 'Search', 'Text index & textScore relevance', 'GET /api/tournaments/search?q='],
  ['7', 'ACID Transactions', 'Integrity', 'Two-phase commit roster transfer', 'POST /api/teams/transfer'],
  ['8', 'TTL Auto-Expiration', 'Lifecycle', 'Time-To-Live auto purge (86400s)', 'POST /api/invites'],
  ['9', 'Geospatial Queries', 'Location', 'GeoJSON Point & 2dsphere $near', 'GET /api/tournaments/nearby'],
  ['10', 'Change Streams', 'Real-Time', 'Oplog watching & Server-Sent Events', 'GET /api/matches/live/stream'],
  ['11', 'Faceted Search', 'Analytics', '$facet parallel pipelines & $bucket', 'GET /api/stats/tournaments/faceted'],
  ['12', 'Bracket Tree Traversal', 'Hierarchy', '$graphLookup recursive traversal', 'GET /api/tournaments/:id/bracket-tree'],
  ['13', 'Capped Event Buffer', 'Logging', 'Fixed-size FIFO circular buffer', 'POST/GET /api/audit/events'],
  ['14', 'Engine Schema Validation', 'Integrity', '$jsonSchema database engine rules', 'POST /api/contracts (Code 121)'],
  ['15', 'Partial Filter Index', 'Optimization', 'RAM-optimized partial index', 'GET /api/players/free-agents'],
  ['16', 'Positional Array Updates', 'Concurrency', 'Atomic $[elem] via arrayFilters', 'PATCH /api/matches/:id/player-stats'],
  ['17', 'Soft Delete with Hooks', 'Retention', 'Mongoose pre(/^find/) query hooks', 'DELETE /teams/:id/soft, /restore'],
  ['18', 'Bulk Write Operations', 'Throughput', 'Batch update via Model.bulkWrite()', 'POST /api/matches/bulk-results'],
  ['19', 'Linguistic Collation', 'Indexing', 'Case-insensitive index (strength: 2)', 'GET /api/players/lookup/tag'],
  ['20', 'GridFS Binary Storage', 'Storage', 'Chunked 255KB streaming storage', 'POST/GET /api/media'],
];

let rowY = tY + 20;
featuresTableData.forEach((row, idx) => {
  const rowH = 18;
  if (idx % 2 === 1) {
    doc.rect(40, rowY, PAGE_WIDTH, rowH).fill('#f8fafc');
  } else {
    doc.rect(40, rowY, PAGE_WIDTH, rowH).fill(C.white);
  }
  doc.rect(40, rowY + rowH, PAGE_WIDTH, 0.5).fill('#e2e8f0');

  doc.font('Helvetica-Bold').fontSize(7.5).fillColor(C.primaryDark);
  doc.text(row[0], 46, rowY + 5, { width: 20, lineBreak: false });
  doc.text(row[1], 70, rowY + 5, { width: 140, lineBreak: false });

  doc.font('Helvetica').fontSize(7).fillColor(C.accentCyan);
  doc.text(row[2], 215, rowY + 5, { width: 75, lineBreak: false });

  doc.font('Helvetica').fontSize(7).fillColor(C.bodyText);
  doc.text(row[3], 295, rowY + 5, { width: 110, lineBreak: false });

  doc.font('Courier-Bold').fontSize(6.8).fillColor(C.primaryBlue);
  doc.text(row[4], 410, rowY + 5, { width: 135, lineBreak: false });

  rowY += rowH;
});

// ==========================================================
// PAGES 3 TO 12: THE 20 FEATURES (2 PER PAGE)
// ==========================================================
const featuresData = [
  // 1
  [
    1,
    'CRUD Operations',
    'Baseline Data Ops',
    'Like managing an inventory in a game: creating player profiles, viewing team rosters, updating rankings, and deleting retired squads.',
    'Fundamental document operations using MongoDB BSON documents. Mongoose maps controllers to insertOne, find, findByIdAndUpdate, and findByIdAndDelete with schema casting.',
    'src/models/Player.js • src/controllers/playerController.js • src/routes/playerRoutes.js',
    'POST /api/players • GET /api/players • PUT /api/players/:id • DELETE /api/players/:id',
    'Standard create/read baseline that every advanced query operator builds upon.',
  ],
  // 2
  [
    2,
    'Relational Linking & Population',
    'Relational NoSQL',
    'Instead of repeating the full player biography inside every team, teams store player IDs and look them up when needed (like a gamer ID badge).',
    'Normalizes relational data using ObjectId references (ref: "Player"). Mongoose .populate() resolves references across collections without document duplication or stale copies.',
    'src/models/Team.js • src/controllers/teamController.js',
    'GET /api/teams • GET /api/teams/:id',
    'Each team roster holds populated Player objects with username and role, resolving foreign keys.',
  ],
  // 3
  [
    3,
    'Aggregation Pipeline Analytics',
    'Database Analytics',
    'Calculating team leaderboards and win rates on the fly directly inside the database instead of downloading 10,000 matches into JavaScript loops.',
    'Multi-stage aggregation pipeline ($match, $addFields, $sort, $lookup, $project). Uses $cond and $divide to compute winRate without persisting redundant fields.',
    'src/controllers/statsController.js • src/routes/statsRoutes.js',
    'GET /api/stats/rankings • GET /api/stats/games-breakdown',
    'winRate and rosterSize are computed directly on the database server during pipeline execution.',
  ],
  // 4
  [
    4,
    'Database Indexing (Compound & Unique)',
    'Performance Optimization',
    'Like the alphabetical index at the back of a textbook: allows MongoDB to jump directly to a team or tournament in milliseconds instead of scanning every document.',
    'B-tree indexes created via schema.index(). Compound indexes ({ game: 1, status: 1 }) optimize multi-filter queries, while unique indexes prevent handle collisions.',
    'src/models/Player.js • src/models/Team.js • src/models/Tournament.js',
    'Visualized via MongoDB Atlas Collections > Indexes Tab',
    'Compound and unique indexes eliminate full collection scans (COLLSCAN) for fast IXSCAN queries.',
  ],
  // 5
  [
    5,
    'Pagination & Deterministic Sorting',
    'Large Datasets',
    'When viewing leaderboards with 100,000 players, you fetch 10 per page with Next/Previous buttons so your browser never freezes.',
    'Query cursor transformation using .skip((page - 1) * limit) and .limit(limit). Accompanied by countDocuments to return total pages for client pagination.',
    'src/utils/pagination.js • src/controllers/playerController.js',
    'GET /api/players?page=1&limit=10&sort=username',
    'Every list endpoint accepts page, limit, and sort query parameters to handle massive datasets.',
  ],
  // 6
  [
    6,
    'Full-Text Search & Relevance Scoring',
    'Search Engine',
    'A search bar that lets users type keywords like "invitational" or "qualifier" to find tournaments matching titles, descriptions, or rulebooks.',
    'Compound text index on { name: "text", description: "text", rules: "text" }. Queries use $text with $search and sort by textScore relevance metadata.',
    'src/models/Tournament.js • src/controllers/tournamentController.js',
    'GET /api/tournaments/search?q=invitational',
    'MongoDB tokenizes words, stems terms, and scores results based on term frequency and relevance.',
  ],
  // 7
  [
    7,
    'Multi-Document ACID Transactions',
    'Data Consistency',
    'An all-or-nothing transfer guarantee: when a player moves from Team A to Team B, both rosters and the player document update together. If power fails mid-way, it rolls back.',
    'session.withTransaction() on a replica set. Coordinates two-phase commit across multiple documents; if any write fails, all operations are cleanly rolled back.',
    'src/controllers/teamController.js (transferPlayer)',
    'POST /api/teams/transfer',
    'Guarantees atomic roster moves so a player can never be trapped on two rosters or left without one.',
  ],
  // 8
  [
    8,
    'Time-To-Live (TTL) Automatic Expiration',
    'Lifecycle Automation',
    'A self-destruct countdown timer on scrim invites: pending invitations automatically vanish 24 hours after creation without running background cron jobs.',
    'TTL single-field index on createdAt with expires: 86400 (24 hours). MongoDB background thread monitors index timestamps and purges expired documents automatically.',
    'src/models/MatchInvite.js • src/controllers/inviteController.js',
    'POST /api/invites • GET /api/invites',
    'Documents are automatically erased by MongoDB storage engine when TTL timer expires.',
  ],
  // 9
  [
    9,
    'Geospatial Queries (2dsphere & $near)',
    'Location Services',
    'A LAN tournament locator: players enter their city coordinates and the API finds in-person gaming arenas within a 100km radius sorted by proximity.',
    'GeoJSON Point storage ({ type: "Point", coordinates: [lng, lat] }) paired with a 2dsphere index. Queried using $near and $maxDistance in spherical meters.',
    'src/models/Tournament.js • src/controllers/tournamentController.js',
    'GET /api/tournaments/nearby?lng=-122.42&lat=37.77&maxDistance=100000',
    'Calculates geodesic distance over the Earth sphere and automatically sorts results nearest-first.',
  ],
  // 10
  [
    10,
    'Real-Time Change Streams & Server-Sent Events',
    'Real-Time Push',
    'Live spectator scoreboard: as soon as a referee updates the match score, all connected spectators see the score update immediately without refreshing.',
    'Match.watch() opens a persistent cursor against the MongoDB replica set internal oplog. Changes trigger Node.js EventEmitter pushing data over Server-Sent Events (SSE).',
    'src/utils/changeStreamWatcher.js • src/controllers/matchController.js',
    'GET /api/matches/live/stream (SSE) • PATCH /api/matches/:id/score',
    'Watches the database oplog directly to stream real-time push events to connected viewers.',
  ],
  // 11
  [
    11,
    'Faceted Search & Multi-Bucket Analytics',
    'Multi-Dimensional Stats',
    'The filter sidebar on Steam: clicking one search returns tournament prize brackets, game categories, and top tournaments calculated simultaneously.',
    'The $facet aggregation stage executes multiple independent pipelines in parallel over input documents in a single round-trip, utilizing $bucket and $sortByCount.',
    'src/controllers/statsController.js (getFacetedTournamentStats)',
    'GET /api/stats/tournaments/faceted',
    'Computes prize pool buckets, game breakdowns, and top tournaments in a single database trip.',
  ],
  // 12
  [
    12,
    'Recursive Graph Traversal ($graphLookup)',
    'Hierarchical Graphs',
    'Esports bracket tree: Quarterfinals feed into Semifinals, which feed into Finals. MongoDB traces the whole tournament tree backwards in one call.',
    '$graphLookup performs recursive transitive closure search across documents, linking previousMatchIds to _id and tagging recursion depth (bracketLevel).',
    'src/models/Match.js • src/controllers/tournamentController.js',
    'GET /api/tournaments/:id/bracket-tree',
    'Traverses directed acyclic graph (DAG) hierarchies natively without complex recursive app code.',
  ],
  // 13
  [
    13,
    'Capped Collections & Circular FIFO Buffer',
    'High-Throughput Ticker',
    'An in-game killfeed ticker: you only care about the latest 500 events. Old events fall off the back of the conveyor belt automatically as new ones arrive.',
    'Fixed-size collection created with capped: true, size: 1MB, max: 500. Inserts preserve natural physical order on disk, retrieved via $natural: -1 with zero cleanup jobs.',
    'src/models/MatchEventLog.js • src/controllers/auditController.js',
    'POST /api/audit/events • GET /api/audit/events?limit=10',
    'Maintains strict FIFO order on disk and auto-purges oldest records once byte/count limit is reached.',
  ],
  // 14
  [
    14,
    'Engine-Level Schema Validation ($jsonSchema)',
    'Database Guardrails',
    'An unbreakable rulebook inside MongoDB: player contracts must have salary >= $500 and a code like CTR-####-XX. Invalid writes are blocked even in Compass.',
    'Native MongoDB collection validator using $jsonSchema. Rejects invalid documents at the storage engine level with error code 121 (Document failed validation).',
    'src/models/PlayerContract.js • src/controllers/contractController.js',
    'POST /api/contracts (valid: 201 Created; invalid salary/code: 400 with code 121)',
    'Proves database-level constraint enforcement independent of application-layer Mongoose validation.',
  ],
  // 15
  [
    15,
    'Partial Filter Indexes (partialFilterExpression)',
    'Index Optimization',
    'Scouts only look for Free Agents (players without a team). Indexing all 50,000 rostered players is a waste of RAM, so we only index players with team == null.',
    'Index defined with partialFilterExpression: { team: null }. Ignores all documents not matching the predicate, drastically reducing index memory and write overhead.',
    'src/models/Player.js • src/controllers/playerController.js',
    'GET /api/players/free-agents',
    'Significantly reduces B-tree index footprint by only indexing relevant subset data.',
  ],
  // 16
  [
    16,
    'Positional Array Updates (arrayFilters & $inc)',
    'Atomic Sub-Documents',
    'A player gets a kill during a match: the database reaches straight inside the match player list and increments their kills by +1 atomically without race conditions.',
    'Positional array operator $[p] paired with arrayFilters: [{ "p.player": playerId }] and $inc. Updates the specific array sub-document without full document replacement.',
    'src/models/Match.js • src/controllers/matchController.js',
    'PATCH /api/matches/:id/player-stats',
    'Atomic in-place embedded array mutation avoiding read-modify-write race conditions in live scoring.',
  ],
  // 17
  [
    17,
    'Soft Delete with Mongoose Lifecycle Hooks',
    'Data Retention & Integrity',
    'A recycle bin for disbanded teams: marking isDeleted: true keeps past match history intact while automatically hiding the team from normal app searches.',
    'Mongoose pre(/^find/) and pre("countDocuments") middleware hooks intercept queries and inject { isDeleted: { $ne: true } } unless includeDeleted: true is passed.',
    'src/models/Team.js • src/controllers/teamController.js',
    'DELETE /api/teams/:id/soft • PATCH /api/teams/:id/restore • GET /api/teams?includeDeleted=true',
    'Demonstrates query lifecycle middleware and transparent enterprise data retention.',
  ],
  // 18
  [
    18,
    'High-Throughput Bulk Write Operations',
    'Batch Throughput',
    'Submitting 20 match scores at the end of a tournament day in one single package instead of making 20 slow back-and-forth network trips.',
    'Model.bulkWrite() batches multiple write operations (updateOne, insertOne) into a single network protocol packet, minimizing round-trips and database lock contention.',
    'src/controllers/matchController.js (bulkUpdateMatches)',
    'POST /api/matches/bulk-results',
    'Bundles dozens of match outcome writes into a single high-throughput database roundtrip.',
  ],
  // 19
  [
    19,
    'Linguistic Collation (Case-Insensitive Indexing)',
    'String Matching',
    'In esports, "v1per", "V1PER", and "V1per" are the same person. The database understands letter-case rules so duplicate handles are prevented and lookups are fast.',
    'Index collation { locale: "en", strength: 2 }. Level 2 strength ignores case differences during comparison and sorting, eliminating slow regex table scans.',
    'src/models/Player.js • src/controllers/playerController.js',
    'GET /api/players/lookup/tag?handle=V1PER',
    'Enforces case-insensitive handle uniqueness and search directly at the B-tree index level.',
  ],
  // 20
  [
    20,
    'GridFS Chunked Binary Media Storage',
    'Large File Storage',
    'MongoDB documents are capped at 16MB. GridFS splits official 50MB PDF rulebooks and match replay demo files into small 255KB chunks to store and stream them.',
    'GridFSBucket divides large binary files into 255KB chunks stored in media.files and media.chunks collections, streaming bytes cleanly to clients with MIME headers.',
    'src/controllers/mediaController.js • src/routes/mediaRoutes.js',
    'POST /api/media/upload • GET /api/media • GET /api/media/:id/stream',
    'Overcomes the 16MB BSON limit by chunking and streaming binary files via MongoDB GridFS.',
  ],
];

// Draw 2 features per page
const CARD_H = 370;
const CARD_GAP = 12;

for (let i = 0; i < featuresData.length; i += 2) {
  doc.addPage();
  const pageNum = 3 + i / 2;
  drawPageDecorations(pageNum);

  const f1 = featuresData[i];
  const f2 = featuresData[i + 1];

  drawFeatureCard(40, 42, PAGE_WIDTH, CARD_H, f1[0], f1[1], f1[2], f1[3], f1[4], f1[5], f1[6], f1[7]);

  if (f2) {
    drawFeatureCard(40, 42 + CARD_H + CARD_GAP, PAGE_WIDTH, CARD_H, f2[0], f2[1], f2[2], f2[3], f2[4], f2[5], f2[6], f2[7]);
  }
}

// ==========================================================
// PAGE 13: ACADEMIC VIVA Q&A AND TEAM DETAILS (EXACTLY AS SCREENSHOT)
// ==========================================================
doc.addPage();
drawPageDecorations(13);

doc.rect(40, 40, 4, 16).fill(C.primaryBlue);
doc
  .fillColor(C.primaryDark)
  .font('Helvetica-Bold')
  .fontSize(13)
  .text('4. Key Academic & Viva Defense Questions', 50, 41, { lineBreak: false });

doc
  .fillColor(C.mutedText)
  .font('Helvetica')
  .fontSize(8.5)
  .text('Fundamental theoretical rationales and architecture defense points for professor evaluation.', 40, 62, { lineBreak: false });

let qaY = 80;
const qaList = [
  [
    'Q1: Why choose MongoDB over a Relational Database (SQL) for GameVault?',
    'Esports data is inherently hierarchical and dynamic (nested team rosters, multi-tier tournament brackets, real-time match telemetry). In SQL, querying a tournament with its participating teams, player rosters, and live matches requires complex 5-table JOIN operations that introduce substantial lock contention. MongoDB stores documents in naturally aligned structures while still supporting multi-document ACID transactions (Feature 7) where relational integrity is critical.',
  ],
  [
    'Q2: What is the exact difference between Mongoose Validation and MongoDB $jsonSchema?',
    'Mongoose validation runs strictly in the Node.js application process memory before data is transmitted. If an administrator connects via MongoDB Compass, Python, or shell, Mongoose validation is completely bypassed. In contrast, Feature 14 enforces $jsonSchema directly inside the MongoDB database storage engine, rejecting invalid writes with error code 121 regardless of the client used.',
  ],
  [
    'Q3: Why use a Capped Collection for Match Events instead of a TTL Index?',
    'TTL indexes delete records based on elapsed duration (e.g., after 24 hours). Capped Collections (Feature 13) enforce strict physical size (1MB) and document count (500) boundaries. When record #501 arrives, record #1 is overwritten immediately on disk like a circular buffer with zero background delete overhead, guaranteeing fixed disk allocation for high-throughput live event tickers.',
  ],
  [
    'Q4: How do Change Streams function internally?',
    'Change Streams (Feature 10) require a MongoDB Replica Set. Every state modification is recorded into the internal replication operations log (oplog.rs). Match.watch() establishes a real-time tailable cursor against this oplog, emitting instant change events that are streamed over Server-Sent Events (SSE) without client polling.',
  ],
  [
    'Q5: How does GridFS handle high-volume binary file downloads?',
    'GridFS divides files exceeding 16MB into 255KB chunks. When a user requests a tournament rulebook or demo replay, the GridFSBucket opens a download stream that fetches chunks sequentially and pipes binary buffers directly to the Express response socket with appropriate MIME headers, minimizing server memory pressure.',
  ],
];

qaList.forEach(([q, a]) => {
  const boxH = 68;
  doc.roundedRect(40, qaY, PAGE_WIDTH, boxH, 4).fillAndStroke(C.cardBg, C.cardBorder);

  doc
    .fillColor(C.navyHeader)
    .font('Helvetica-Bold')
    .fontSize(8.2)
    .text(q, 50, qaY + 6, { width: PAGE_WIDTH - 20, lineBreak: false });

  doc
    .fillColor(C.bodyText)
    .font('Helvetica')
    .fontSize(7.6)
    .text(a, 50, qaY + 18, { width: PAGE_WIDTH - 20, lineGap: 1.2, align: 'justify' });

  qaY += boxH + 8;
});

// ==========================================================
// TEAM DETAILS BOX (EXACTLY AS IN SCREENSHOT)
// ==========================================================
const teamBoxY = qaY + 20;

// Border and Card
doc.roundedRect(40, teamBoxY, PAGE_WIDTH, 70, 8).fillAndStroke('#f8fafc', C.primaryBlue);
doc.rect(40, teamBoxY, 4, 70).fill(C.primaryBlue);

doc
  .fillColor(C.primaryDark)
  .font('Helvetica-Bold')
  .fontSize(14)
  .text('Team Details', 40, teamBoxY + 16, { width: PAGE_WIDTH, align: 'center', lineBreak: false });

doc
  .fillColor('#0f172a')
  .font('Helvetica-Bold')
  .fontSize(11)
  .text(
    'Nikit Pandey(24BKT0165) , Aarav Gupta (24BCE0725) , Raunak Raja (24BCE0057)',
    40,
    teamBoxY + 40,
    { width: PAGE_WIDTH, align: 'center', lineBreak: false }
  );

doc.end();

writeStream.on('finish', () => {
  console.log(`Report PDF generated cleanly at: ${outputPath} (Exact Page Count: ${TOTAL_PAGES})`);
});
