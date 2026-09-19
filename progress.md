# GameVault — Project Progress Log

Living record of everything done on this project, in order. Update this file after
every significant action, decision, or pivot — don't let context rot. Newest entries
go at the bottom of the log (chronological), but check the **Current State** section
at the top first for a fast catch-up.

---

## ⚠️ Pivot: dropped Postman, verifying via direct HTTP calls instead

After the desktop app also failed to visibly launch (see log entry below), the
user said "I'm done with this" regarding Postman. **Decision: stop depending on
any Postman variant.** The project doesn't actually need Postman to be "done" —
it needs proof the API works. Verified every non-trivial endpoint directly via
PowerShell's `Invoke-RestMethod` against the running `npm run dev` server:

- `GET /api/teams` — 3 seeded teams, roster correctly populated (relational linking) ✅
- `GET /api/players` — 5 players, each with populated `team` field ✅
- `GET /api/stats/rankings` — aggregation pipeline (win rate, roster size via $lookup) ✅
- `GET /api/stats/games-breakdown` — aggregation pipeline grouped by game ✅
- `GET /api/tournaments/search?q=invitational` — text search with relevance score ✅
- `GET /api/tournaments/nearby?lng=...&lat=...` — geospatial $near query ✅
- `POST /api/teams/transfer` — multi-document ACID transaction: moved player
  `freeagent` from no team onto Crimson Wolves; player.team and team.players
  both updated atomically ✅

**All core features are confirmed working against the live Atlas cluster.**
Postman (web or desktop) is now optional/nice-to-have for this project, not a
blocker — if the user wants it later (e.g. for report screenshots), it can be
revisited separately without holding up the rest of the work.

### Demo-day plan (user must present to their professor solo, no AI help allowed)
Since Postman is unreliable on this machine, built a self-contained demo kit
instead of depending on any tool prone to crashing:
- [demo/gamevault.http](demo/gamevault.http) — every endpoint pre-written for
  the VS Code **REST Client** extension (not a separate process — runs inside
  VS Code, so it can't crash independently the way the standalone Agent did).
  Organized by feature number (1–10) matching the abstract, with inline notes
  on what to say for each.
- [demo/DEMO_SCRIPT.md](demo/DEMO_SCRIPT.md) — a rehearsed walkthrough script:
  setup steps to do *before* the professor arrives, talking points per feature,
  and a "what to do if something breaks live" fallback section (curl/browser
  as a last resort for GET requests).
- User should install the REST Client extension and rehearse the whole script
  once end-to-end before the actual demo — not attempted live yet as of this
  log entry.

### Revision: full cold-boot runbook + fixed Change Streams demo approach
User pushed back that the first version wasn't concrete enough for presenting
solo, cold, in front of a professor with no help available. Rewrote both demo
files into a true step-by-step runbook assuming the laptop starts powered off:
boot → open VS Code → open folder → `npm run seed` (always reseed right before
demoing, for a known dataset and fresh IDs) → `npm run dev` → spoken intro →
walk every feature 1-9 via `demo/gamevault.http` with exact click instructions
and talking points per feature, feature 4 (Indexing) shown via the Atlas
Collections/Indexes tab in a browser rather than an API call.

**Important fix:** identified that REST Client (a request/response tool) isn't
built for long-lived streaming responses, so relying on it to demo feature #10
(Change Streams / SSE) live would have been unreliable. Changed that one
feature's demo method to a split VS Code terminal: one pane runs
`curl.exe -N http://localhost:5000/api/matches/live/stream` and stays open
watching for events, while the score-update PATCH is sent from the `.http`
file in the editor — the curl terminal then prints the change event live. This
is a more robust and visually convincing way to show real-time push than
anything Postman/REST Client would have given.

Also added an "anticipated questions" section (why MongoDB vs SQL, what ACID
transaction means concretely here, how change streams work via the oplog, why
Mongoose over the raw driver) since the user has to explain the project, not
just click through it.

Files are up to date in [demo/gamevault.http](demo/gamevault.http) and
[demo/DEMO_SCRIPT.md](demo/DEMO_SCRIPT.md) — these are now the authoritative
demo materials. **Not yet rehearsed live by the user as of this entry.**

## Current State (read this first)

- **Backend code: complete.** Full Express + Mongoose REST API implementing all 10
  MongoDB features from the abstract. Lives in this folder, see [README.md](README.md)
  for the feature-to-file map.
- **Database: connected and seeded.** MongoDB Atlas cluster `GameVault` is live,
  `.env` has a working `MONGO_URI`, `npm run seed` has been run successfully.
- **API testing tool: Postman.** User is on Windows, chose the Postman *web app*
  (web.postman.co) over the desktop app initially. Collection is imported there
  as "GameVault API".
- **Blocker in progress:** Postman web needs a local "Agent" process to reach
  `localhost:5000`. The standalone Postman Agent (v0.5.1) crashes immediately on
  this machine (Windows build 26200) — confirmed via Windows Event Log as a
  reproducible native crash (exception `0x80000003`), not a GPU or missing-runtime
  issue (both ruled out). **Decision:** abandon the standalone Agent, install the
  full Postman **desktop app** instead (it has the same local-access capability
  built in and is more stable). Desktop installer download was in progress when
  this file was created — check below for the outcome.
- **Not yet done:** confirm Postman desktop app installs and runs; send first live
  request (Get Teams/Players) against the running `npm run dev` server; populate
  Postman collection variables (`teamId`, `playerId`, etc.) with real IDs from
  seeded data; exercise the more advanced endpoints (ACID transfer, geospatial
  search, text search, TTL invite expiry, live-score SSE stream).

---

## Log

### 1. Project kickoff
User pointed at `GameVault_ABSTRACT.docx` in an empty project folder and asked to
build the project it describes. No `pandoc` available on this machine, so the
abstract was extracted by unzipping the .docx and parsing `word/document.xml`
directly with a small Node script.

**Abstract summary:** *GameVault — Esports Tournament & Team Management System*.
A backend REST API (Node.js + Express.js + MongoDB/Mongoose) that must explicitly
demonstrate 10 MongoDB features:
1. CRUD Operations
2. Relational Linking (ObjectId refs + population)
3. Aggregation Pipeline (team rankings, games-breakdown stats)
4. Indexing
5. Pagination and Sorting
6. Text Search (tournament titles/rules)
7. Multi-Document ACID Transactions (player roster transfers)
8. TTL Indexes (pending match invites expire after 24h)
9. Geospatial Queries (nearby LAN tournaments)
10. Change Streams (live score updates)

Plus centralized error handling (validation conflicts, duplicate keys, routing
anomalies), verified with Postman.

### 2. Backend scaffold built
Built the full project from scratch (no scaffolding tool — hand-written):

```
server.js                     entrypoint: connects DB, starts server, starts change stream
src/app.js                    Express app: middleware + route mounting
src/config/db.js              Mongoose connection
src/models/                   Player, Team, Tournament, Match, MatchInvite
src/controllers/               business logic per resource
src/routes/                   Express routers per resource
src/middleware/                asyncHandler, notFound, errorHandler
src/utils/                     ApiError, pagination helper, change-stream watcher, seed script
postman/GameVault.postman_collection.json   full request collection, one per endpoint
README.md                     setup guide + feature-to-file map
```

Design decisions worth remembering:
- **Player ↔ Team** relationship: `Player.team` (single ref) + `Team.players`
  (array of refs) kept in sync manually in the transfer transaction — not a
  Mongoose virtual populate, so both sides must be updated together (this is
  exactly why the roster-transfer endpoint needs a transaction).
- **Tournament** holds both the `2dsphere` geospatial index (for LAN venue
  `$near` queries) and a compound text index on `name/description/rules`.
- **Change Streams** implemented via `Match.watch()` wrapped in a try/catch —
  failure is logged as a warning, not fatal, because change streams require a
  replica set and shouldn't crash the whole API if unavailable. Live updates are
  re-broadcast to clients over Server-Sent Events at `GET /api/matches/live/stream`.
- **MatchInvite** TTL implemented via Mongoose's `expires: 86400` option on the
  `createdAt` field (auto-creates the TTL index).
- Centralized error handler distinguishes Mongoose `ValidationError` (400),
  duplicate-key `code 11000` (409), and `CastError` (400) from generic 500s.

Verification performed (no real MongoDB available on this machine at the time):
- `node --check` on every source file — all pass.
- Booted the Express app standalone (no DB) to confirm routes/controllers wire up
  without errors — confirmed via a real HTTP request to `/` (200) and a bad route
  (404 through the centralized error handler).
- Could not test DB-backed paths locally at this stage (no local MongoDB install).

### 3. User onboarding to MongoDB
User had never used MongoDB before. Explained the document-database model via a
direct comparison to relational concepts they already know (table→collection,
row→document, foreign key+JOIN→ObjectId ref+`.populate()`). Recommended MongoDB
Atlas (free M0 tier) over a local install specifically because features #7
(transactions) and #10 (change streams) require a replica set, and Atlas clusters
are replica sets by default — no manual `rs.initiate()` needed.

### 4. Atlas cluster setup
- User created an Atlas org/project and an M0 cluster named `GameVault`.
- Walked through: waiting for cluster deployment, creating a database user,
  Network Access (allow `0.0.0.0/0` for dev), and getting the driver connection
  string via **Connect → Drivers**.

### 5. Connection troubleshooting (`bad auth : authentication failed`)
Took several rounds to resolve — logged in detail since it's a good reference for
future auth issues:

1. First failure: generic bad-auth. Diagnosed locally by reading `.env` with the
   password masked (never printed the real value into chat) — ruled out stray
   whitespace, quotes, CRLF, and reserved/unencoded characters in the password.
2. User reset the password in Atlas and retried — same error. Diagnostics again
   came back clean syntactically, meaning the *stored* Atlas password still
   didn't match (most likely the "Update User" confirm step in the Atlas dialog
   wasn't actually clicked, or propagation delay).
3. Recommended creating a **brand-new** dedicated DB user to eliminate ambiguity
   about stale state.
4. **Root cause found:** the new password in `.env` still had literal `< >`
   angle brackets around it — e.g. `mongodb+srv://aarav2:<2yWhgvcbc4w6D1xq>@...`.
   Atlas's connection-string dialog shows `<db_password>` as a placeholder, and
   the brackets must be deleted along with the placeholder text, not left in.
   This is a very easy mistake to make and worth remembering if it happens again.
5. Fixed by editing `.env` directly (stripped brackets, added `/gamevault` as the
   database name, added `retryWrites=true&w=majority`). Ran `npm run seed`
   successfully:
   ```
   MongoDB connected: ac-i3ozk6g-shard-00-00.pimpvlx.mongodb.net/gamevault
   Seed data inserted successfully.
   ```
6. Confirmed `server.js` boots cleanly against the live Atlas cluster (started it
   briefly, saw `MongoDB connected` + `GameVault API listening on port 5000`).

**Current `.env` state:** working `MONGO_URI` pointing at the `GameVault` Atlas
cluster, database name `gamevault`, user `aarav2`.

### 6. Postman setup — chose web app over desktop
User prefers the Postman **web app** (web.postman.co) rather than installing the
desktop app. Walked through:
- Signing in, allowing the "Access other apps and services on this device" browser
  permission prompt (legitimate — needed for the web app to detect the local Agent
  process; confirmed the domain was genuine `postman.co` before advising to allow).
- Import UI in this Postman web version isn't in an obvious toolbar button; found
  via `Ctrl+O`.
- User initially tried "Open Folder" (bottom-left) and got "Local file access is
  only available on the desktop app" — that's a *different* feature (Git-synced
  local workspace folders), not the same as regular file import, but caused
  confusion.
- Because file-picker import reliability was in question, provided the entire
  `GameVault.postman_collection.json` content inline in chat for the user to paste
  into Postman's **Import → Raw text** tab instead of relying on a file picker.
- **Result:** Import succeeded. Collection "GameVault API" now shows in the user's
  Postman sidebar with all 6 folders (Players, Teams, Tournaments, Matches,
  Invites (TTL), Stats (Aggregation Pipeline)).

### 7. Postman Agent crash troubleshooting (in progress)
Postman web needs a local **Agent** helper process to reach `http://localhost:5000`
(browsers block a hosted web page from talking to localhost directly). The
collection's `baseUrl` variable is set to `http://localhost:5000/api`.

- User downloaded the standalone Postman Agent installer
  (`Postman Agent v0.5.1 (x64).exe`, ~193MB) from postman.com/downloads/postman-agent.
- First attempts: double-clicking did nothing visible. Verified the downloaded
  file itself was fine (correct size, valid Authenticode signature, no
  Windows "mark of the web" block).
- Running as Administrator: installer window flashed and closed. Verified via
  filesystem that this was actually a **successful install** —
  `C:\Users\Aarav Gupta\AppData\Local\Postman-Agent\` exists with the app binaries,
  plus a Start Menu shortcut. The brief window is normal Squirrel-installer
  behavior, not a failure.
- Launching the installed app: it appears briefly in the system tray, then
  disappears — this **is** a real crash, confirmed via Windows Event Log
  (`Application Error`, provider). Six repeated crash events found, all identical:
  ```
  Faulting application: Postman Agent.exe (0.5.1.0)
  Exception code: 0x80000003 (STATUS_BREAKPOINT)
  Fault offset: 0x0000000004cecc49   (identical every time)
  ```
- Ruled out GPU/hardware acceleration: launching manually with `--disable-gpu`
  survived slightly longer (~9s vs immediate) but crashed at the **same fault
  offset** shortly after — so GPU wasn't the real cause, just changed timing.
- Ruled out missing Visual C++ Redistributable: registry shows
  `v14.50.35719.00` (x64) already installed — a fairly recent version, not the
  problem.
- Ruled out Windows Defender / AV interference: no detections in
  `Get-MpThreatDetection` / `Get-MpThreat` referencing Postman Agent.
- **Working theory:** the standalone Agent build (v0.5.1) has a genuine bug on
  this Windows version (build `10.0.26200` — a very recent Windows 11 release),
  unrelated to anything the user did wrong.
- **Decision (via AskUserQuestion):** stop chasing the standalone Agent bug;
  install the full **Postman desktop app** instead, since it has the same
  local-request capability built in and is generally more stable/maintained.
  User chose: *"Install full Postman desktop app (Recommended)"* — i.e., do it
  for them.
- Downloaded the official Windows desktop installer from
  `https://dl.pstmn.io/download/latest/win64`, verified its signature (valid,
  signed by "Postman, Inc."), and ran it via automation — it installed cleanly
  to `%LOCALAPPDATA%\Postman` (v12.28.6), with a Start Menu shortcut created.
  However, launching it *via automation* exited immediately with no crash
  logged — most likely because the automated shell session doesn't have access
  to the user's actual interactive desktop, not a real app problem. Could not
  confirm visually whether it would have opened fine for the user.
- **User then deleted the desktop app entirely** and asked to redo the whole
  Postman setup manually themselves, following instructions step by step,
  rather than having actions run on their behalf. Restarting from a clean
  slate: download → install → launch → sign in → import collection → test,
  all done by the user directly this time.

---

## Reference / gotchas worth remembering

- **Atlas connection strings**: the `<db_password>` in Atlas's copy-paste
  connection string is a placeholder — delete the angle brackets too, not just
  the text inside them.
- **Transactions & Change Streams require a replica set.** Atlas clusters are
  replica sets by default, so this isn't an issue for the deployed Atlas cluster,
  but would matter again if ever testing against a local standalone `mongod`.
- **Postman web + localhost** always needs either the standalone Agent or the
  desktop app running locally — a hosted web page cannot reach `localhost` on its
  own. If localhost requests fail with a network/connection error in Postman web,
  check the Agent status indicator (bottom-right of the Postman web UI) first.
- User's dev loop: `npm run seed` (repopulate sample data, exits on its own) then
  `npm run dev` (long-running server via nodemon, keep the terminal open).
