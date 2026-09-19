# GameVault — Esports Tournament & Team Management System

A backend REST API for organizing, managing, and analyzing a competitive esports
ecosystem. Built with **Node.js**, **Express.js**, and **MongoDB** (via **Mongoose**),
structured into configuration, models, controllers, routes, and middleware layers.

Version 2.0 explicitly demonstrates **10 distinct MongoDB features**, listed below
with the exact file/endpoint that implements each one.

## Feature map

| # | Feature | Where it lives |
|---|---|---|
| 1 | CRUD Operations | Every controller in [src/controllers](src/controllers) |
| 2 | Relational Linking (ObjectId refs + population) | `team`/`teams`/`players` refs in [src/models](src/models); `.populate()` calls in controllers |
| 3 | Aggregation Pipeline | `getTeamRankings`, `getGamesBreakdown` in [src/controllers/statsController.js](src/controllers/statsController.js) |
| 4 | Indexing | `schema.index(...)` calls in each model |
| 5 | Pagination & Sorting | [src/utils/pagination.js](src/utils/pagination.js), used by every list endpoint |
| 6 | Text Search | Text index on `Tournament`; `searchTournaments` in [src/controllers/tournamentController.js](src/controllers/tournamentController.js) |
| 7 | Multi-Document ACID Transactions | `transferPlayer` in [src/controllers/teamController.js](src/controllers/teamController.js) |
| 8 | TTL Index | `createdAt` field with `expires` in [src/models/MatchInvite.js](src/models/MatchInvite.js) |
| 9 | Geospatial Queries | `2dsphere` index on `Tournament.location`; `getNearbyTournaments` |
| 10 | Change Streams | [src/utils/changeStreamWatcher.js](src/utils/changeStreamWatcher.js) + SSE endpoint `streamLiveMatches` |

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
npm run seed            # optional: populate sample players/teams/tournaments/matches
npm run dev              # starts on http://localhost:5000 (nodemon)
```

## Project structure

```
server.js                     entrypoint: connects DB, starts server, starts change stream
src/
  app.js                      Express app: middleware + route mounting
  config/db.js                Mongoose connection
  models/                     Player, Team, Tournament, Match, MatchInvite
  controllers/                business logic per resource
  routes/                     Express routers per resource
  middleware/                 asyncHandler, notFound, errorHandler
  utils/                      ApiError, pagination helper, change-stream watcher, seed script
postman/
  GameVault.postman_collection.json   ready-to-import collection covering every endpoint
```

## API overview

Base URL: `http://localhost:5000/api`

| Resource | Endpoints |
|---|---|
| Players | `GET/POST /players`, `GET/PUT/DELETE /players/:id` |
| Teams | `GET/POST /teams`, `GET/PUT/DELETE /teams/:id`, `POST /teams/transfer` |
| Tournaments | `GET/POST /tournaments`, `GET/PUT/DELETE /tournaments/:id`, `GET /tournaments/search?q=`, `GET /tournaments/nearby?lng=&lat=&maxDistance=` |
| Matches | `GET/POST /matches`, `GET/PUT/DELETE /matches/:id`, `PATCH /matches/:id/score`, `GET /matches/live/stream` (SSE) |
| Invites | `GET/POST /invites`, `GET/PUT/DELETE /invites/:id` (auto-expire after 24h) |
| Stats | `GET /stats/rankings?game=`, `GET /stats/games-breakdown` |

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
