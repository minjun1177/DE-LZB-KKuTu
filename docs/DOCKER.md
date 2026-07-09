# Running KKuTu with Docker / Podman

A quick guide to running the full KKuTu stack in containers. The commands use
`docker compose`; if you use Podman, substitute **`podman compose`** in every
command — nothing else changes.

---

## Overview

`docker-compose.yml` starts four services:

| Service | Image | Role |
| ------- | ----- | ---- |
| `db`    | `postgres:16`    | Game database (auto-seeded from `db.sql` on first boot) |
| `redis` | `redis:7-alpine` | Sessions & ranking cache |
| `game`  | `kkutu-app:latest` (built from `Dockerfile`) | Game server — `node lib/Game/cluster.js 0 1` |
| `web`   | `kkutu-app:latest` (same image) | Web portal — `node lib/Web/cluster.js 1` |

`game` and `web` are the **same image** with different start commands. Startup
order is enforced automatically by healthchecks:

```
db + redis  →  game  →  web
```

You only visit the **web** service (port 80) in your browser.

## Prerequisites

- **Docker Engine + Compose v2**, or **Podman + `podman compose`**.
- Nothing else — Node 24 is built into the image; you do **not** need Node on the host.

## Quickstart

Run all commands from the repository root.

**1. Build the image and start everything (detached):**

```bash
docker compose up --build -d
# podman: podman compose up --build -d
```

> ⚠️ **First run is slow.** The image is built and the ~42 MB `db.sql` is
> imported into Postgres automatically. This can take several minutes (the db
> healthcheck allows up to 5 minutes). Subsequent starts are fast.

**2. Wait for all services to be healthy:**

```bash
docker compose ps
```

Wait until `db`, `redis`, `game`, and `web` all show `healthy` / `running`.

**3. Play:**

Open **<http://localhost/>** in your browser. Guest play works out of the box —
no login setup required.

**4. Follow logs (optional):**

```bash
docker compose logs -f web game
```

**5. Stop:**

```bash
docker compose down          # stop, keep the database
docker compose down -v       # stop AND wipe the database (re-seeds db.sql next start)
```

## Accessing the game

| What | Where |
| ---- | ----- |
| **Web portal (visit this)** | <http://localhost/> — port `80` |
| Game WebSocket | port `8080` (`MAIN_PORTS[0]`) — mostly internal |
| Room port | port `8496` (`ROOM_PORTS[0]`) — mostly internal |

The web service reaches the game service internally via the Compose network
(`GAME_SERVER_HOST: game`), so you normally only need port 80.

- **Guest play:** works immediately, no configuration.
- **Social login (OAuth):** disabled until you fill `deploy/auth.docker.json`
  (see below).

## Configuration

Two host files are mounted **read-only** over the in-container config, so you can
edit them without rebuilding:

| Host file | Mounted to |
| --------- | ---------- |
| `deploy/global.docker.json` | `/app/Server/lib/sub/global.json` |
| `deploy/auth.docker.json`   | `/app/Server/lib/sub/auth.json` |

### `deploy/global.docker.json`

Fine for local testing as-is. For any shared / non-test use, change at least:

- **`PASS`** — admin-page password (default `kkutu-test-admin-pass`).
- **`ADMIN`** — list of admin user IDs (default empty `[]`).

> 🔑 **Keep the DB password in sync.** If you change the database password, it
> must match in **both** places:
> - `PG_PASSWORD` in `deploy/global.docker.json`
> - `POSTGRES_PASSWORD` in `docker-compose.yml`
>
> Both default to `kkutu-test-pg`. A mismatch prevents the app from connecting.

### `deploy/auth.docker.json`

All OAuth `clientID` / `clientSecret` fields are blank by default. Fill in a
provider's credentials only if you want that social login to work (naver, google,
discord, kakao, github, etc.). Guest play needs nothing here.

## Common commands

```bash
docker compose up --build -d      # build + start in background
docker compose ps                 # service status / health
docker compose logs -f web game   # tail app logs
docker compose restart web        # restart just the web service (see note below)
docker compose down               # stop, keep data
docker compose down -v            # stop and wipe the db volume (full re-seed)
```

## Troubleshooting

- **First boot takes minutes / `db` not healthy yet** — Postgres is importing the
  large `db.sql`. Watch it with `docker compose logs -f db`. Wait for the
  `start_period` (up to 5 min) before assuming failure.
- **`web` shows errors after `game` restarted** — `web` does not automatically
  re-dial `game` after the connection drops. If `game` restarts, restart web too:
  `docker compose restart web`.
- **Login/OAuth does nothing** — expected until you fill `deploy/auth.docker.json`.
  Use guest play, or add provider credentials.
- **App can't connect to the database** — check that `PG_PASSWORD`
  (`deploy/global.docker.json`) matches `POSTGRES_PASSWORD` (`docker-compose.yml`).
- **Want a clean database** — `docker compose down -v` removes the `db_data`
  volume; the next `up` re-imports `db.sql` from scratch.

---
---

# Docker / Podman로 KKuTu 실행하기 (한국어)

컨테이너로 전체 KKuTu 스택을 실행하는 빠른 가이드입니다. 명령어는
`docker compose` 기준이며, Podman을 사용한다면 모든 명령의
`docker compose`를 **`podman compose`**로 바꾸기만 하면 됩니다.

---

## 개요

`docker-compose.yml`은 네 개의 서비스를 실행합니다:

| 서비스 | 이미지 | 역할 |
| ------ | ------ | ---- |
| `db`    | `postgres:16`    | 게임 DB (최초 실행 시 `db.sql` 자동 임포트) |
| `redis` | `redis:7-alpine` | 세션 / 랭킹 캐시 |
| `game`  | `kkutu-app:latest` (`Dockerfile`로 빌드) | 게임 서버 — `node lib/Game/cluster.js 0 1` |
| `web`   | `kkutu-app:latest` (동일 이미지) | 웹 포털 — `node lib/Web/cluster.js 1` |

`game`과 `web`은 시작 명령만 다른 **동일한 이미지**입니다. 시작 순서는
헬스체크로 자동 보장됩니다:

```
db + redis  →  game  →  web
```

브라우저로는 **web** 서비스(포트 80)에만 접속하면 됩니다.

## 사전 준비

- **Docker Engine + Compose v2**, 또는 **Podman + `podman compose`**.
- 그 외에는 필요 없습니다 — Node 24는 이미지에 포함되어 있어 호스트에 Node를 설치하지 않아도 됩니다.

## 빠른 시작

모든 명령은 저장소 루트에서 실행하세요.

**1. 이미지 빌드 후 전체 실행 (백그라운드):**

```bash
docker compose up --build -d
# podman: podman compose up --build -d
```

> ⚠️ **최초 실행은 느립니다.** 이미지를 빌드하고 약 42MB의 `db.sql`을
> Postgres에 자동으로 임포트합니다. 수 분이 걸릴 수 있습니다(db 헬스체크는
> 최대 5분까지 대기). 이후 실행은 빠릅니다.

**2. 모든 서비스가 정상(healthy)이 될 때까지 대기:**

```bash
docker compose ps
```

`db`, `redis`, `game`, `web`가 모두 `healthy` / `running`이 될 때까지 기다립니다.

**3. 접속:**

브라우저에서 **<http://localhost/>** 를 엽니다. 게스트 플레이는 별도 설정 없이
바로 가능합니다.

**4. 로그 확인 (선택):**

```bash
docker compose logs -f web game
```

**5. 종료:**

```bash
docker compose down          # 종료 (DB 유지)
docker compose down -v       # 종료 + DB 삭제 (다음 실행 시 db.sql 재임포트)
```

## 게임 접속

| 항목 | 위치 |
| ---- | ---- |
| **웹 포털 (여기로 접속)** | <http://localhost/> — 포트 `80` |
| 게임 WebSocket | 포트 `8080` (`MAIN_PORTS[0]`) — 주로 내부용 |
| 방(Room) 포트 | 포트 `8496` (`ROOM_PORTS[0]`) — 주로 내부용 |

web 서비스는 Compose 네트워크를 통해 game 서비스에 내부적으로 접속하므로
(`GAME_SERVER_HOST: game`), 보통 포트 80만 있으면 됩니다.

- **게스트 플레이:** 설정 없이 바로 가능.
- **소셜 로그인(OAuth):** `deploy/auth.docker.json`을 채우기 전까지 비활성화(아래 참고).

## 설정

두 개의 호스트 파일이 컨테이너 내부 설정 위에 **읽기 전용**으로 마운트되어,
재빌드 없이 수정할 수 있습니다:

| 호스트 파일 | 마운트 위치 |
| ----------- | ----------- |
| `deploy/global.docker.json` | `/app/Server/lib/sub/global.json` |
| `deploy/auth.docker.json`   | `/app/Server/lib/sub/auth.json` |

### `deploy/global.docker.json`

로컬 테스트용으로는 그대로 사용해도 됩니다. 공유 / 비테스트 용도라면 최소한
아래는 변경하세요:

- **`PASS`** — 관리자 페이지 비밀번호 (기본값 `kkutu-test-admin-pass`).
- **`ADMIN`** — 관리자 사용자 ID 목록 (기본값 빈 `[]`).

> 🔑 **DB 비밀번호는 반드시 일치시키세요.** 데이터베이스 비밀번호를 바꾼다면
> 아래 **두 곳**이 모두 같아야 합니다:
> - `deploy/global.docker.json`의 `PG_PASSWORD`
> - `docker-compose.yml`의 `POSTGRES_PASSWORD`
>
> 둘 다 기본값은 `kkutu-test-pg`입니다. 불일치 시 앱이 DB에 연결하지 못합니다.

### `deploy/auth.docker.json`

모든 OAuth `clientID` / `clientSecret` 필드가 기본적으로 비어 있습니다. 특정
제공자(naver, google, discord, kakao, github 등)의 로그인을 사용하려면 해당
자격 증명을 입력하세요. 게스트 플레이에는 필요 없습니다.

## 자주 쓰는 명령

```bash
docker compose up --build -d      # 빌드 + 백그라운드 실행
docker compose ps                 # 서비스 상태 / 헬스
docker compose logs -f web game   # 앱 로그 확인
docker compose restart web        # web 서비스만 재시작 (아래 참고)
docker compose down               # 종료 (데이터 유지)
docker compose down -v            # 종료 + db 볼륨 삭제 (전체 재시드)
```

## 문제 해결

- **최초 실행이 수 분 걸림 / `db`가 healthy가 안 됨** — Postgres가 큰 `db.sql`을
  임포트하는 중입니다. `docker compose logs -f db`로 확인하고, 실패로 판단하기
  전에 `start_period`(최대 5분)를 기다리세요.
- **`game` 재시작 후 `web`에 오류 발생** — `web`은 연결이 끊긴 뒤 `game`에
  자동으로 재접속하지 않습니다. `game`을 재시작했다면 web도 재시작하세요:
  `docker compose restart web`.
- **로그인/OAuth가 동작하지 않음** — `deploy/auth.docker.json`을 채우기 전까지
  정상입니다. 게스트로 플레이하거나 제공자 자격 증명을 추가하세요.
- **앱이 DB에 연결하지 못함** — `PG_PASSWORD`(`deploy/global.docker.json`)와
  `POSTGRES_PASSWORD`(`docker-compose.yml`)가 일치하는지 확인하세요.
- **DB를 초기화하고 싶음** — `docker compose down -v`로 `db_data` 볼륨을
  삭제하면 다음 `up` 시 `db.sql`을 처음부터 다시 임포트합니다.
