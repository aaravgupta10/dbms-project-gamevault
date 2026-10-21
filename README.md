# GameVault — Esports Tournament & Team Management System

A backend REST API for organizing, managing, and analyzing a competitive esports
ecosystem. Built with **Node.js**, **Express.js**, and **MongoDB** (via **Mongoose**),
structured into configuration, models, controllers, routes, and middleware layers.

Version 3.0 explicitly demonstrates **20 distinct MongoDB features**, listed below
with the exact file/endpoint that implements each one.

## Feature map

| # | Feature | Category | Where it lives |
|---|---|---|---|
| 1 | CRUD Operations | Baseline | Every controller in [src/controllers](src/controllers) |
| 2 | Relational Linking (ObjectId refs + population) | Relational | `team`/`teams`/`players` refs in [src/models](src/models); `.populate()` calls |
| 3 | Aggregation Pipeline | Analytics | `getTeamRankings`, `getGamesBreakdown` in [src/controllers/statsController.js](src/controllers/statsController.js) |
| 4 | Indexing (Compound, Unique, Single-Field) | Optimization | `schema.index(...)` calls in each model |
| 5 | Pagination & Sorting | Large Datasets | [src/utils/pagination.js](src/utils/pagination.js), used by every list endpoint |
| 6 | Text Search | Search | Text index on `Tournament`; `searchTournaments` in [src/controllers/tournamentController.js](src/controllers/tournamentController.js) |
| 7 | Multi-Document ACID Transactions | Integrity | `transferPlayer` in [src/controllers/teamController.js](src/controllers/teamController.js) |
| 8 | TTL Index | Lifecycle | `createdAt` field with `expires` in [src/models/MatchInvite.js](src/models/MatchInvite.js) |
| 9 | Geospatial Queries | Location | `2dsphere` index on `Tournament.location`; `getNearbyTournaments` |
| 10 | Change Streams | Real-Time | [src/utils/changeStreamWatcher.js](src/utils/changeStreamWatcher.js) + SSE endpoint `streamLiveMatches` |
| 11 | Faceted Search (`$facet` & `$bucket`) | Analytics | `getFacetedTournamentStats` in [src/controllers/statsController.js](src/controllers/statsController.js) |
| 12 | Recursive Graph Traversal (`$graphLookup`) | Hierarchy | `getTournamentBracketTree` in [src/controllers/tournamentController.js](src/controllers/tournamentController.js) |
| 13 | Capped Collections (`capped: true`) | High Throughput | [src/models/MatchEventLog.js](src/models/MatchEventLog.js) + [src/controllers/auditController.js](src/controllers/auditController.js) |
| 14 | Engine Schema Validation (`$jsonSchema`) | Data Integrity | [src/models/PlayerContract.js](src/models/PlayerContract.js) + [src/controllers/contractController.js](src/controllers/contractController.js) |
| 15 | Partial Filter Indexes (`partialFilterExpression`) | Optimization | Partial index on `Player.team: null`; `getFreeAgents` in [src/controllers/playerController.js](src/controllers/playerController.js) |
| 16 | Positional Array Updates (`arrayFilters` & `$inc`) | Concurrency | `updatePlayerStats` in [src/controllers/matchController.js](src/controllers/matchController.js) |
| 17 | Soft Delete & Query Hooks (`pre('find')`) | Data Retention | `softDeleteTeam`, `restoreTeam` in [src/controllers/teamController.js](src/controllers/teamController.js) |
| 18 | Bulk Write Operations (`bulkWrite`) | Throughput | `bulkUpdateMatches` in [src/controllers/matchController.js](src/controllers/matchController.js) |
| 19 | Collation (Case-Insensitive Uniqueness) | Indexing | Collation index on `Player.gamerTag`; `lookupByGamerTag` in [src/controllers/playerController.js](src/controllers/playerController.js) |
| 20 | GridFS Chunked Binary Storage (`GridFSBucket`) | Storage | [src/controllers/mediaController.js](src/controllers/mediaController.js) + `/api/media` |

Centralized error handling for validation failures, duplicate-key conflicts, and
routing anomalies lives in [src/middleware/errorHandler.js](src/middleware/errorHandler.js)
and [src/middleware/notFound.js](src/middleware/notFound.js).

## Requirements

- Node.js 18+
- A MongoDB **replica set** (required for features #7 and #10 — transactions and
  change streams don't work on a standalone `mongod`). Easiest options:
  - A free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster (already a replica set), or
  - A local single-node replica set:
    ```bash
    mongod --replSet rs0 --dbpath <your-data-path>
    # then, once, in a mongo shell:
    rs.initiate()
    ```

## Setup

```bash
npm install
cp .env.example .env   # then set MONGO_URI to your replica-set connection string
npm run seed            # populates sample data across all 20 features
npm run dev             # starts on http://localhost:5000 (nodemon)
```

## Project structure

```
server.js                     entrypoint: connects DB, starts server, starts change stream
src/
  app.js                      Express app: middleware + route mounting
  config/db.js                Mongoose connection
  models/                     Player, Team, Tournament, Match, MatchInvite, MatchEventLog, PlayerContract
  controllers/                business logic per resource
  routes/                     Express routers per resource
  middleware/                 asyncHandler, notFound, errorHandler
  utils/                      ApiError, pagination helper, change-stream watcher, seed script
demo/
  gamevault.http              complete REST Client test suite for all 20 features
  DEMO_SCRIPT.md              spoken demo runbook & feature explanation guide
```

## API overview

Base URL: `http://localhost:5000/api`

| Resource | Endpoints |
|---|---|
| Players | `GET/POST /players`, `GET/PUT/DELETE /players/:id`, `GET /players/free-agents`, `GET /players/lookup/tag?handle=` |
| Teams | `GET/POST /teams`, `GET/PUT/DELETE /teams/:id`, `POST /teams/transfer`, `DELETE /teams/:id/soft`, `PATCH /teams/:id/restore` |
| Tournaments | `GET/POST /tournaments`, `GET/PUT/DELETE /tournaments/:id`, `GET /tournaments/search?q=`, `GET /tournaments/nearby?lng=&lat=&maxDistance=`, `GET /tournaments/:id/bracket-tree` |
| Matches | `GET/POST /matches`, `GET/PUT/DELETE /matches/:id`, `PATCH /matches/:id/score`, `PATCH /matches/:id/player-stats`, `POST /matches/bulk-results`, `GET /matches/live/stream` (SSE) |
| Invites | `GET/POST /invites`, `GET/PUT/DELETE /invites/:id` (auto-expire after 24h via TTL) |
| Stats | `GET /stats/rankings?game=`, `GET /stats/games-breakdown`, `GET /stats/tournaments/faceted` |
| Audit (Capped) | `POST /audit/events`, `GET /audit/events` |
| Contracts ($jsonSchema) | `POST /contracts`, `GET /contracts` |
| Media (GridFS) | `POST /media/upload`, `GET /media`, `GET /media/:id/stream` |

List endpoints accept `page`, `limit`, and `sort` (e.g. `sort=-stats.points`) query
parameters for pagination and sorting.


## Testing with Postman

Import [postman/GameVault.postman_collection.json](postman/GameVault.postman_collection.json)
into Postman. It includes one request per endpoint, grouped by resource, with
collection variables (`baseUrl`, `playerId`, `teamId`, etc.) you can fill in from
the IDs returned by the seed script or your own `POST` requests.

To see change streams in action: open the "Live Match Stream (SSE)" request in
one tab, then send "Update Live Score" requests against the same match ID in
another — the SSE connection will push each change as it happens.
