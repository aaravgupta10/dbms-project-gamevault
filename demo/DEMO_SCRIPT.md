# GameVault — Demo Script (cold-boot runbook)

Assumes the laptop is off when you sit down in front of your professor. Follow
in order. Rehearse this whole thing at least once, alone, before the real demo.

## Phase 0 — Before the demo day (not live)

- [ ] REST Client extension installed in VS Code (Extensions → search
      "REST Client" by Huachao Mao → should say "Installed").
- [ ] Confirmed you have Wi-Fi in the actual room you'll present in — MongoDB
      Atlas is cloud-hosted; no internet means nothing works, regardless of code.
- [ ] Ran through every step below once, successfully, start to finish.

## Phase 1 — Cold boot

1. Power on, log in, connect to Wi-Fi.
2. Open VS Code.
3. `File → Open Folder` → `C:\Users\Aarav Gupta\Downloads\dbms_project` → **Select Folder**.

## Phase 2 — Start the backend

4. Open a terminal (`` Ctrl+` ``).
5. Run:
   ```bash
   npm run seed
   ```
   Wait for `Seed data inserted successfully.` — **always reseed right before
   demoing**, so you start from a known dataset (3 teams, 5 players,
   2 tournaments, 2 matches, 1 invite) and IDs aren't stale from a previous run.
6. Run:
   ```bash
   npm run dev
   ```
   Wait for:
   ```
   MongoDB connected: ...
   GameVault API listening on port 5000
   ```
   If a "Change streams unavailable" warning appears, stop and fix your
   internet connection before continuing — feature #10 needs it.
7. **Do not close or reuse this terminal for anything else.**

## Phase 3 — 60-second spoken intro

> "GameVault is a backend REST API for managing an esports tournament
> ecosystem — players, teams, tournaments, and matches. It's built with
> Node.js, Express, and MongoDB using Mongoose. The focus is demonstrating 10
> distinct MongoDB capabilities beyond basic CRUD: relational linking,
> aggregation pipelines, indexing, pagination, text search, multi-document
> ACID transactions, TTL auto-expiry, geospatial queries, and real-time change
> streams. I'll go through each with a live request against the running API."

## Phase 4 — Open the request file

8. Explorer sidebar → `demo` folder → open `gamevault.http`.
9. Point at `@baseUrl = http://localhost:5000/api` at the top.

## Phase 5 — Features 1, 2, 5, 3, 6, 7, 8, 9 (click "Send Request" above each block)

| # | Feature | Request | Talking point |
|---|---|---|---|
| 1 | CRUD | `POST /players`, then `GET /players` | Baseline create/read every other feature builds on. |
| 2 | Relational Linking | `GET /teams` | Each team's `players` array holds full player objects, not raw IDs — Mongoose `.populate()` resolving ObjectId references, the NoSQL equivalent of a JOIN. |
| 5 | Pagination & Sorting | `GET /players?page=1&limit=10&sort=username` | Every list endpoint takes `page`/`limit`/`sort`; response includes `total`/`pages`. |
| 3 | Aggregation Pipeline | `GET /stats/rankings`, then `GET /stats/games-breakdown` | `winRate`/`rosterSize` aren't stored — computed live via `$addFields`/`$lookup` in the pipeline. |
| 6 | Text Search | `GET /tournaments/search?q=invitational` | MongoDB text index, relevance-ranked (see the `score` field). |
| 7 | ACID Transactions | Copy a `playerId` from `GET /players` and a `toTeamId` from `GET /teams`, paste into `POST /teams/transfer`, send | Updates 3 documents (player + both teams) inside one `session.withTransaction()` — all-or-nothing. |
| 8 | TTL Index | `POST /invites`, then `GET /invites` | Show the doc exists, then open `src/models/MatchInvite.js` and point at `expires: 60 * 60 * 24` on `createdAt` — MongoDB auto-deletes it in 24h, no cron job. |
| 9 | Geospatial | `GET /tournaments/nearby?lng=-122.42&lat=37.77&maxDistance=100000` | `$near` query against a 2dsphere index — LAN tournaments within 100km, sorted by distance. |
| 4 | Indexing | *(switch to browser)* Atlas → cluster → Collections → `tournaments` → **Indexes** tab | Point at the live `2dsphere` and text indexes; cross-reference `schema.index(...)` in `src/models/Tournament.js`. |

## Phase 6 — Feature 10: Change Streams (do last, needs two terminals)

10. Split the terminal (icon top-right of the terminal panel) — opens a second
    terminal next to the one running `npm run dev`. Don't touch terminal 1.
11. In the new terminal:
    ```bash
    curl.exe -N http://localhost:5000/api/matches/live/stream
    ```
    It prints `: connected` then waits — correct, it's an open live connection.
12. Back in `gamevault.http`: run `GET /matches`, copy a real `_id`, paste it
    into the `PATCH /matches/{id}/score` request's URL, click **Send Request**.
13. Look at the terminal from step 11 — a new JSON line appears live.
14. Say: *"The API watches the Match collection's oplog via `Match.watch()`.
    Any update — from this API, or someone editing the database directly —
    gets pushed instantly to every connected client. This is the foundation
    for a live spectator scoreboard."*

## If something breaks live

- Any request fails/404s → check terminal 1 still says `listening on port 5000`.
- A pasted ID is stale/invalid → re-run the corresponding `GET`, copy a fresh
  ID (IDs regenerate every `npm run seed`).
- Stream terminal shows nothing after the PATCH → confirm the same match ID
  was used in both, and terminal 1 didn't warn "Change streams unavailable"
  at startup.
- Anything else fails → fall back to plain `curl.exe http://localhost:5000/api/...`
  for any GET request directly in a terminal; it always works if the server is up.

## Anticipated questions

- **"Why MongoDB instead of a relational database?"** — Esports data (rosters,
  match history, tournament formats) is naturally document-shaped and
  hierarchical; MongoDB avoids the JOIN-heavy queries a relational schema
  would need for the same nested reads, while still supporting ACID
  transactions where they matter (roster transfers).
- **"What is an ACID transaction here, concretely?"** — Point at
  `src/controllers/teamController.js`, the `transferPlayer` function:
  `session.withTransaction()` wraps updates to the player and both team
  documents; if any step throws, MongoDB rolls back all of them.
- **"How do Change Streams work internally?"** — MongoDB replica sets record
  every write to an internal oplog; `Match.watch()` opens a cursor against
  that oplog filtered to the `Match` collection, so the app process is
  notified of changes without polling.
- **"Why Mongoose instead of the raw MongoDB driver?"** — Schema validation,
  default values, and a cleaner API for populate/indexes — trades a small
  amount of flexibility for a lot of correctness and readability.
