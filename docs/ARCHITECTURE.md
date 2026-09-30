# Architecture

This document describes how the KKuTu server is structured and how a game
request flows through the system. It is meant for developers who need to modify
or extend the code.

> 한국어 버전: [`ARCHITECTURE.ko.md`](./ARCHITECTURE.ko.md)

## 1. High-level overview

KKuTu runs as **two separate Node.js programs** that are started independently
and communicate over an internal WebSocket link:

```
                         ┌─────────────────────────────┐
   Browser ──HTTP──────► │  Web server                 │
   (portal page, login,  │  lib/Web/cluster.js         │
    static assets, API)  │   └─ forks lib/Web/main.js  │
                         │       • Express + Pug        │
                         │       • Passport (OAuth)     │
                         │       • PostgreSQL / Redis   │
                         └──────────────┬──────────────┘
                                        │ internal WebSocket
                                        │ (one client per game server)
                         ┌──────────────▼──────────────┐
   Browser ──WebSocket──►│  Game server(s)             │
   (room / gameplay)     │  lib/Game/cluster.js        │
                         │   ├─ master  (lib/Game/master.js)
                         │   └─ slaves  (lib/Game/slave.js, 1..N)
                         │       • rooms, turns, scoring
                         │       • robots (AI), shop, chat
                         └──────────────┬──────────────┘
                                        ▼
                              PostgreSQL  +  Redis (optional)
```

The browser talks **HTTP** to the web server (to load the portal/game page and
call the JSON API) and talks **WebSocket** directly to a game server for live
gameplay. The web server keeps its own WebSocket connection to each game server
so it can show live player counts (`seek`) and relay cross-server events such as
friend notifications.

## 2. Process model (Node `cluster`)

Both servers use Node's `cluster` module to fork worker processes.

### Game server — `lib/Game/cluster.js`

```
node lib/Game/cluster.js <serverId> <cpuCount>
# e.g. node lib/Game/cluster.js 0 1
```

- `serverId` (`SID`) selects which port set to use from `MAIN_PORTS` /
  `ROOM_PORTS` in `global.json`. Passing the literal `test` enables development
  ("under maintenance") mode (`global.test = true`).
- `cpuCount` is the number of **slave** workers (game channels) to fork.
- The **master** process (`master.js`) runs in the cluster primary. It manages
  the slaves, owns the public-facing WebSocket endpoint, handles admin commands,
  spam/abuse filtering, and Discord-webhook notifications.
- Each **slave** (`slave.js`) hosts a *channel* — a subset of rooms — listening
  on `ROOM_PORTS[SID] + i`. The `CHANNEL` and `KKUTU_PORT` are passed via env
  vars. If a slave dies, the master re-forks it.

### Web server — `lib/Web/cluster.js`

```
node lib/Web/cluster.js <cpuCount>
# e.g. node lib/Web/cluster.js 1
```

Each worker runs `lib/Web/main.js`: an Express app plus a set of outbound
WebSocket clients (one per entry in `MAIN_PORTS`) to the game servers.

### Multi-server launch

`Server/server-start-linux.sh` starts `KKT_SV_NUMS` game clusters (one per
`serverId`) plus one web cluster, redirecting output to `game0.log`,
`game1.log`, …, and `web.log`. `server-stop-linux.sh` stops them.

## 3. Directory layout

```
.
├── README.md                 # install guide (original, bilingual)
├── docker-compose.yml         # game + web + postgres stack
├── Dockerfile / psql.Dockerfile
├── db.sql                     # full PostgreSQL schema + seed data (~40 MB)
├── settings.json              # high-level server settings (name, CPU counts)
├── language.json              # available UI languages
├── server-setup.bat           # one-shot dependency install (runs Server/setup.js)
├── docs/                      # ← you are here
└── Server/
    ├── main.js                # Electron launcher (optional desktop shell)
    ├── runner.js              # Electron process runner / menu
    ├── setup.js               # npm install + prunes unused .bin shims
    ├── server-*-linux.sh      # start / stop / grunt helper scripts
    ├── package.json           # Electron launcher deps
    ├── views/                 # Electron launcher UI (index.pug)
    └── lib/
        ├── const.js           # GAME RULES, options, scoring, themes, flags
        ├── package.json       # runtime deps (kkutu-core)
        ├── Gruntfile.js       # client-side JS bundling (concat + uglify)
        ├── sub/               # shared helpers + config (see below)
        ├── Game/              # game server
        │   ├── cluster.js     # cluster entry point
        │   ├── master.js      # primary process
        │   ├── slave.js       # worker / channel process
        │   ├── kkutu.js       # Room / Client / Robot classes
        │   ├── robot.js       # AI bot logic
        │   ├── shop.js        # in-game shop
        │   └── games/         # one file per game mode (see §5)
        └── Web/
            ├── cluster.js     # cluster entry point
            ├── main.js        # Express app, routes, game-server clients
            ├── db.js          # PostgreSQL/Redis access layer
            ├── auth/          # one file per OAuth provider (Passport)
            ├── routes/        # major / consume / admin / login
            ├── lib/           # server-rendered page fragments + client rules
            ├── public/        # static assets (built JS, css, media)
            └── views/         # Pug templates
```

### `lib/sub/` — shared modules

| File | Responsibility |
|------|----------------|
| `global.json` | **(git-ignored)** main runtime config — see [CONFIGURATION.md](./CONFIGURATION.md) |
| `auth.json`   | **(git-ignored)** OAuth client IDs/secrets per provider |
| `jjlog.js`    | Coloured console logger (`info` / `success` / `warn` / `error` / `alert`) |
| `collection.js` | Thin abstraction over Postgres/Redis "collections" (Mongo-like API) |
| `lizard.js`   | Tiny promise/tail helper used throughout the DB layer |
| `secure.js`   | Loads SSL cert/key for `https`/`wss` |
| `checkpub.js` | Determines whether the instance is "public" |
| `recaptcha.js`| reCAPTCHA verification |
| `dcwh.js`     | Discord webhook helper |
| `ajae.js`     | Age-gate ("아재") helper (mostly disabled) |
| `webinit.js`  | Express bootstrap, page rendering, mobile allow-list |

## 4. Request & data flow

### Loading the page (HTTP)

1. Browser hits `GET /` on the web server (`lib/Web/main.js`).
2. The session is looked up in the `session` table; if a profile exists it is
   attached to `req.session`.
3. Express renders either the **portal** page (server list) or the **kkutu**
   game page (when `?server=<id>` resolves to a configured port), injecting
   constants from `const.js` (modes, rules, options, themes, equip groups).
4. The page connects back over WebSocket using `PORT` / `ROOM_PORT` /
   `PROTOCOL` (`ws` or `wss`) supplied in the template.

### Playing a game (WebSocket)

1. The browser opens a WebSocket to a game server slave.
2. Client → server events drive the room lifecycle: `enter`, `setRoom`,
   `ready`, `start`, `leave`, `practice`, `invite`, `inviteRes`, `heartbeat`.
3. Server → client events drive the round: `roundReady`, `turnStart`,
   `turnHint`, `turnError`, `turnEnd`, `roundEnd`, plus moderation events
   `kickVote` / `kickDeny`.
4. Each submitted word is validated against the dictionary tables
   (`kkutu_ko` / `kkutu_en`) and the active rule/options; scoring uses
   `Const.getPreScore` / `Const.getPenalty`.

The authoritative protocol reference is the community doc linked from
`Server/README.md`:
<https://github.com/horyu1234/KKuTu-Protocol-Docs>.

### Database access

`lib/Web/db.js` builds a Mongo-style API over a `pg` connection pool plus an
optional Redis client. On Redis failure it falls back to a "no-redis mode"
(`FAKE_REDIS`) so the server still boots. Connection parameters come from
`global.json` (`PG_USER`, `PG_PASSWORD`, `PG_HOST`, `PG_PORT`, `PG_DATABASE`).

Key tables (full schema in `db.sql`, documented in `Server/README.md`):
`users`, `kkutu_ko`, `kkutu_en`, `kkutu_cw_ko`, `kkutu_injeong`,
`kkutu_manner_ko/en`, `kkutu_shop`, `kkutu_shop_desc`, `session`, `ip_block`.

## 5. Game-mode system

Game modes are defined in two places:

1. **`lib/const.js` → `exports.RULE`** registers every mode by a 3-letter code
   (e.g. `KKT`, `EKT`, `KCW`, `KTY`, `HUN`, `KDA`, `KSS`, `KDG`). Each entry
   declares its `lang`, `rule` name, allowed special `opts`, `time` constant,
   whether AI bots are allowed (`ai`), whether it uses the big board (`big`),
   and end-when-quit behaviour (`ewq`). `GAME_TYPE` is the ordered list of codes.

2. **`lib/Game/games/<rule>.js`** implements the server-side logic for each
   rule, all built on the shared base in `games/_form.js`:

   | File | Rule | Description |
   |------|------|-------------|
   | `classic.js`   | Classic   | Standard word-chain (끝말잇기) |
   | `crossword.js` | Crossword | Crossword-style Korean word guessing |
   | `cw_maker.js`  | —         | Crossword board generator / checker CLI (`--help`) |
   | `daneo.js`     | Daneo     | Word-duel mode |
   | `hunmin.js`    | Hunmin    | Initial-consonant (훈민정음) quiz |
   | `jaqwi.js`     | Jaqwi     | Consonant quiz by theme (자음퀴즈) |
   | `sock.js`      | Sock      | Word-filtering (솎솎) |
   | `typing.js` / `typing_const.js` | Typing | Speed-typing duel |
   | `drawing.js`   | Drawing   | Draw-and-guess (uses Fabric.js on client) |

The matching **client-side** rule renderers live in
`lib/Web/lib/kkutu/rule_<rule>.js` and are bundled by Grunt.

### Adding / changing a mode

- Server logic: add or edit `lib/Game/games/<rule>.js`.
- Register/adjust the mode in `lib/const.js` (`RULE` + implicitly `GAME_TYPE`).
- Client renderer: add `lib/Web/lib/kkutu/rule_<rule>.js` and include it in the
  `KKUTU_LIST` array in `lib/Gruntfile.js`, then rebuild (see §7).

## 6. Authentication

Login is handled by Passport. Each provider has a file under
`lib/Web/auth/` (e.g. `auth_discord.js`, `auth_google.js`, `auth_naver.js`)
exporting three things:

- `config` — display metadata + the Passport `Strategy` class.
- `strategyConfig` — `clientID` / `clientSecret` / `callbackURL`, read from
  `auth.json`.
- `strategy(process, MainDB, Ajae)` — maps the provider profile onto KKuTu's
  internal profile (`$p.id`, `$p.name`, `$p.image`, …). User IDs are namespaced
  by provider, e.g. `discord-123456789`.

`auth/example.js` is the template to copy when adding a new provider.
Admin privileges are granted by adding a user's `_id` to the `ADMIN` array in
`global.json`.

## 7. Build pipeline (Grunt)

Client-side JavaScript is authored in `lib/Web/lib/` and bundled into
`lib/Web/public/js/` by `lib/Gruntfile.js`:

- `concat` joins the per-rule kkutu scripts into `in_game_kkutu.js`.
- `uglify` minifies each entry into `*.min.js` with the GPL banner.
- The custom `pack` task wraps the bundled game script in an IIFE.

Run from `Server/lib`:

```bash
npx grunt default pack   # build + pack (what the Dockerfile runs)
```

The built `*.min.js` files are git-ignored (see `.gitignore`), so a build step
is required before the web server serves a fresh checkout.

## 8. Deployment options

### Bare-metal / VM (Linux)

```bash
cd Server
./server-start-linux.sh   # starts game clusters + web cluster, logs to *.log
./server-stop-linux.sh
```

### Docker Compose

`docker-compose.yml` defines three services:

- `db` — PostgreSQL (built from `psql.Dockerfile`, seeded from `db.sql`).
- `game` — `node lib/Game/cluster.js 0 1`, exposes `8496` and `8080`.
- `web` — `node lib/Web/cluster.js 1`, exposes `80`, depends on `db` + `game`.

```bash
docker compose up --build
```

> Note: the Dockerfile pins `node:12`. Some newer features (e.g. the Discord
> webhook integration) were validated on Node 24; align the base image with
> your runtime if you depend on them.

## 9. Things to know / gotchas

- The host `127.0.0.2` is reserved for web ↔ game communication; do not bind it
  elsewhere.
- Redis is optional. Without it, ranking and some session features are limited
  but the server still runs (no-redis fallback).
- Behind Cloudflare, use **DNS only** (grey cloud) — proxying breaks room
  create/enter — and pick ports from Cloudflare's supported list.
- `global.json` and `auth.json` are **not** committed. You must create them
  (templates ship in the repo). See [CONFIGURATION.md](./CONFIGURATION.md).
- Bots other than cheat-bots require a minimum `hit` value in the word tables to
  behave normally.
</content>
