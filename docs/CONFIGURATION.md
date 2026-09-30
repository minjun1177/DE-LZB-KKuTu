# Configuration

KKuTu reads configuration from a few JSON files. Two of them
(`Server/lib/sub/global.json` and `Server/lib/sub/auth.json`) hold secrets and
are **git-ignored** — you must create them before the server will start.
Templates ship in the repository.

> 한국어 버전: [`CONFIGURATION.ko.md`](./CONFIGURATION.ko.md)

| File | Tracked in git | Purpose |
|------|:--------------:|---------|
| `settings.json` (repo root) | ✅ | High-level launcher settings (server name, CPU counts) |
| `language.json` (repo root) | ✅ | Available UI languages |
| `Server/lib/sub/global.json` | ❌ | Main runtime config (ports, DB, admins, webhook, …) |
| `Server/lib/sub/auth.json`   | ❌ | OAuth client IDs / secrets per provider |
| SSL files (`Server/*.crt`, `*.key`, `fullchain.pem`) | ❌ | TLS material when `IS_SECURED`/`WAF` is on |

> The keys documented below are the ones actually read by the code. Because the
> JSON files are not committed, treat the structure here as the source of truth
> and copy from the in-repo templates where they exist.

---

## `settings.json` (repo root)

Consumed by the Electron launcher and the start scripts.

```json
{
    "server-name": "DE LZB KKuTu",
    "web-num-cpu": 1,
    "game-num-cpu": 1,
    "game-num-inst": 1
}
```

| Key | Meaning |
|-----|---------|
| `server-name`   | Display name (also overridable via `KKT_SV_NAME` env var) |
| `web-num-cpu`   | Web cluster worker count |
| `game-num-cpu`  | Game cluster worker count (slaves per instance) |
| `game-num-inst` | Number of game-server instances |

---

## `Server/lib/sub/global.json`

The core runtime config, loaded by `lib/const.js`, `lib/Web/db.js`,
`lib/Web/main.js`, the game master/slave, and most `sub/` helpers.

### Ports & networking

| Key | Type | Used in | Meaning |
|-----|------|---------|---------|
| `MAIN_PORTS` | number[] | `const.js`, web `main.js` | Public WebSocket port per game-server instance (web connects here) |
| `ROOM_PORTS` | number[] | `const.js`, game `cluster.js` | Base port for each instance's room/slave listeners (`ROOM_PORTS[SID] + channelIndex`) |
| `GAME_SERVER_HOST` | string | web `main.js`, game `master.js` | Host the web server uses to reach game servers (often `127.0.0.2`) |
| `KKT_PORTAL_HTTP_PORT` | number | web `main.js` | Portal HTTP listen port (default `80`) |
| `KKT_PORTAL_HTTPS_PORT` | number | web `main.js` | Portal HTTPS listen port (default `443`) |
| `KKT_PORTAL_BEHIND_PROXY` | boolean | web `main.js` | If `true`, skip the built-in HTTPS server (a reverse proxy terminates TLS) |

### Security / TLS

| Key | Type | Meaning |
|-----|------|---------|
| `IS_SECURED` | boolean | Use SSL (`https`/`wss`) and load cert via `sub/secure.js` |
| `WAF` | boolean | Web-application-firewall / proxy mode; also forces secure behaviour |
| `SSL_OPTIONS` | object | Options passed to `secure.js` when building the HTTPS server |
| `PASS` | string | Password for the admin page (`/gwalli`), checked in `routes/admin.js` |
| `ADMIN` | string[] | Admin user IDs (e.g. `"discord-123456"`); grants admin commands & page |

### Database

| Key | Type | Meaning |
|-----|------|---------|
| `PG_USER` | string | PostgreSQL user |
| `PG_PASSWORD` | string | PostgreSQL password |
| `PG_HOST` | string | PostgreSQL host |
| `PG_PORT` | number | PostgreSQL port |
| `PG_DATABASE` | string | PostgreSQL database name |

> Redis is connected with default `redis.createClient()` settings (no config
> keys). If Redis is unavailable the server logs a warning and runs in
> "no-redis mode".

### Gameplay / portal

| Key | Type | Meaning |
|-----|------|---------|
| `NICKNAME_LIMIT` | object | `{ "TERM": <days between nickname changes, 0 = no limit>, "REGEX": [ "<pattern of forbidden characters>", "<flags>" ] }`. Checked by the client and by `routes/major.js` (`/profile`) |
| `SESSION_SECRET` | string | Secret used to sign the web session cookie. **Set this to a long random string** (or use the `KKT_SESSION_SECRET` env var); the fallback `kkutu` is public |
| `SEASON` | any | Current season marker (`sub/webinit.js`) |
| `SEASON_PRE` | any | Pre-season marker (`sub/webinit.js`) |
| `KKUTUHOT_PATH` | string | Path to the hot-words data file (`routes/admin.js`, see `Server/data/kkutuhot.json`) |

### Anti-abuse / auto-ban

| Key | Type | Meaning |
|-----|------|---------|
| `USE_AUTOBAN` | boolean | Enable automatic banning |
| `AUTOBAN` | object | Auto-ban thresholds/parameters (read by master & slave) |
| `USER_BLOCK_OPTIONS` | object | User block/penalty options |
| `GOOGLE_RECAPTCHA_TO_GUEST` | boolean | Require reCAPTCHA for guests |
| `GOOGLE_RECAPTCHA_TO_USER` | boolean | Require reCAPTCHA for logged-in users |
| `GOOGLE_RECAPTCHA_SITE_KEY` | string | reCAPTCHA site key (sent to client) |
| `GOOGLE_RECAPTCHA_SECRET_KEY` | string | reCAPTCHA secret (server-side verify, `sub/recaptcha.js`) |

### Discord webhook notifications

| Key | Type | Meaning |
|-----|------|---------|
| `USE_DISCORD_WEBHOOK` | boolean | Master switch for Discord notifications |
| `DISCORD_WEBHOOK_URL` | string | Must start with `https://discord.com/api/webhooks/` |
| `IS_DISCORD_WEBHOOK_ENGLISH` | boolean | Send webhook messages in English instead of Korean |
| `DISCORD_WEBHOOK_NICKNAME` | string | Override webhook sender name |
| `DISCORD_AVATAR` | string | Override webhook avatar URL |

> Discord webhook integration was verified on Node `24.13.1`.

### Minimal example

```json
{
    "MAIN_PORTS": [8080],
    "ROOM_PORTS": [8496],
    "GAME_SERVER_HOST": "127.0.0.2",
    "KKT_PORTAL_HTTP_PORT": 80,

    "IS_SECURED": false,
    "WAF": false,
    "SSL_OPTIONS": {},

    "PASS": "change-me-admin-page-password",
    "ADMIN": ["discord-000000000000000000"],

    "PG_USER": "postgres",
    "PG_PASSWORD": "postgres",
    "PG_HOST": "127.0.0.1",
    "PG_PORT": 5432,
    "PG_DATABASE": "main",

    "NICKNAME_LIMIT": { "TERM": 7, "REGEX": [ "[\\{\\}\\[\\]\\/?.,;:|\\)*~`!^\\-+<>@#$%&\\\\=\\(\\'\"]", "gi" ] },
    "SESSION_SECRET": "change-me-to-a-long-random-string",

    "USE_AUTOBAN": false,
    "USE_DISCORD_WEBHOOK": false
}
```

---

## `Server/lib/sub/auth.json`

Holds OAuth credentials, keyed by provider. Each provider file under
`lib/Web/auth/` reads `config.<provider>.clientID / clientSecret / callbackURL`.

Supported providers (one file each in `lib/Web/auth/`): **discord, google,
github, naver, kakao, facebook, instagram, twitch, twitter, spotify, line**
(plus `daldalso`, currently disabled via the `.not.js` suffix).

```json
{
    "discord": {
        "clientID": "...",
        "clientSecret": "...",
        "callbackURL": "https://your-host/auth/discord/callback"
    },
    "google": {
        "clientID": "...",
        "clientSecret": "...",
        "callbackURL": "https://your-host/auth/google/callback"
    }
    // add only the providers you actually enable
}
```

Notes:
- `kakao` and `twitter` use a subset of the fields (e.g. Kakao needs only
  `clientID` + `callbackURL`; Twitter uses `callbackURL` with consumer
  key/secret per the strategy).
- To add a new provider, copy `lib/Web/auth/example.js`, wire up the
  `passport-*` strategy, and add the matching block to `auth.json`. See
  [ARCHITECTURE.md §6](./ARCHITECTURE.md#6-authentication).

---

## Environment variables

| Variable | Set by | Meaning |
|----------|--------|---------|
| `KKT_SV_NAME` | start script / shell | Server display name (fallback for `settings.json`) |
| `KKUTU_PORT` | game `cluster.js` | Port for a forked game worker |
| `CHANNEL` | game `cluster.js` | Channel number for a slave |
| `WS_KEY` | web `cluster.js` | Identifier for a web worker's game-server clients |
| `SERVER_NO_FORK` | cluster entry points | Marks a forked child so it doesn't re-fork |

---

## Related references

- Admin page, admin chat commands, DB schema, public HTTP API and WebSocket
  events: [`../Server/README.md`](../Server/README.md).
- Process model and build pipeline: [`ARCHITECTURE.md`](./ARCHITECTURE.md).
</content>
