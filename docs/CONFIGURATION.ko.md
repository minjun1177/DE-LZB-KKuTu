# 설정

KKuTu는 몇 개의 JSON 파일에서 설정을 읽습니다. 그중 두 개
(`Server/lib/sub/global.json`, `Server/lib/sub/auth.json`)는 비밀 정보를 담고
있어 **git에서 제외**됩니다. 서버를 시작하기 전에 직접 만들어야 합니다.
템플릿은 레포지토리에 포함되어 있습니다.

> English version: [`CONFIGURATION.md`](./CONFIGURATION.md)

| 파일 | git 추적 | 용도 |
|------|:--------:|------|
| `settings.json` (레포 루트) | ✅ | 상위 수준 런처 설정 (서버 이름, CPU 수) |
| `language.json` (레포 루트) | ✅ | 사용 가능한 UI 언어 |
| `Server/lib/sub/global.json` | ❌ | 메인 런타임 설정 (포트, DB, 관리자, 웹훅 등) |
| `Server/lib/sub/auth.json`   | ❌ | 제공자별 OAuth 클라이언트 ID / 시크릿 |
| SSL 파일 (`Server/*.crt`, `*.key`, `fullchain.pem`) | ❌ | `IS_SECURED`/`WAF`가 켜졌을 때의 TLS 자료 |

> 아래에 문서화된 키는 실제로 코드가 읽는 것들입니다. JSON 파일이 커밋되지
> 않으므로, 여기의 구조를 참고 기준으로 삼고 레포에 템플릿이 있다면 그것을
> 복사해 사용하세요.

---

## `settings.json` (레포 루트)

Electron 런처와 시작 스크립트가 사용합니다.

```json
{
    "server-name": "DE LZB KKuTu",
    "web-num-cpu": 1,
    "game-num-cpu": 1,
    "game-num-inst": 1
}
```

| 키 | 의미 |
|----|------|
| `server-name`   | 표시 이름 (`KKT_SV_NAME` 환경 변수로도 덮어쓸 수 있음) |
| `web-num-cpu`   | 웹 cluster 워커 수 |
| `game-num-cpu`  | 게임 cluster 워커 수 (인스턴스당 slave 수) |
| `game-num-inst` | 게임 서버 인스턴스 수 |

---

## `Server/lib/sub/global.json`

`lib/const.js`, `lib/Web/db.js`, `lib/Web/main.js`, 게임 master/slave, 대부분의
`sub/` 헬퍼가 로드하는 핵심 런타임 설정입니다.

### 포트 & 네트워킹

| 키 | 타입 | 사용처 | 의미 |
|----|------|--------|------|
| `MAIN_PORTS` | number[] | `const.js`, 웹 `main.js` | 게임 서버 인스턴스별 공개 웹소켓 포트 (웹이 여기로 연결) |
| `ROOM_PORTS` | number[] | `const.js`, 게임 `cluster.js` | 인스턴스별 방/slave 리스너 기본 포트 (`ROOM_PORTS[SID] + 채널인덱스`) |
| `GAME_SERVER_HOST` | string | 웹 `main.js`, 게임 `master.js` | 웹 서버가 게임 서버에 도달하는 호스트 (보통 `127.0.0.2`) |
| `KKT_PORTAL_HTTP_PORT` | number | 웹 `main.js` | 포털 HTTP 수신 포트 (기본 `80`) |
| `KKT_PORTAL_HTTPS_PORT` | number | 웹 `main.js` | 포털 HTTPS 수신 포트 (기본 `443`) |
| `KKT_PORTAL_BEHIND_PROXY` | boolean | 웹 `main.js` | `true`면 내장 HTTPS 서버 생략 (리버스 프록시가 TLS 종료) |

### 보안 / TLS

| 키 | 타입 | 의미 |
|----|------|------|
| `IS_SECURED` | boolean | SSL(`https`/`wss`) 사용, `sub/secure.js`로 인증서 로드 |
| `WAF` | boolean | 웹 방화벽 / 프록시 모드, 보안 동작도 강제함 |
| `SSL_OPTIONS` | object | HTTPS 서버 구성 시 `secure.js`에 전달되는 옵션 |
| `PASS` | string | 관리 페이지(`/gwalli`) 비밀번호, `routes/admin.js`에서 검사 |
| `ADMIN` | string[] | 관리자 사용자 ID (예: `"discord-123456"`), 관리자 명령·페이지 권한 부여 |

### 데이터베이스

| 키 | 타입 | 의미 |
|----|------|------|
| `PG_USER` | string | PostgreSQL 사용자 |
| `PG_PASSWORD` | string | PostgreSQL 비밀번호 |
| `PG_HOST` | string | PostgreSQL 호스트 |
| `PG_PORT` | number | PostgreSQL 포트 |
| `PG_DATABASE` | string | PostgreSQL 데이터베이스 이름 |

> Redis는 기본 `redis.createClient()` 설정으로 연결됩니다(설정 키 없음). Redis를
> 사용할 수 없으면 서버는 경고를 남기고 "no-redis 모드"로 실행됩니다.

### 게임플레이 / 포털

| 키 | 타입 | 의미 |
|----|------|------|
| `NICKNAME_LIMIT` | object | `{ "TERM": <닉네임 변경 간격(일), 0이면 제한 없음>, "REGEX": [ "<금지 문자 정규식>", "<플래그>" ] }`. 클라이언트와 `routes/major.js`(`/profile`)에서 검사 |
| `SESSION_SECRET` | string | 웹 세션 쿠키 서명 키. **길고 임의의 문자열로 꼭 설정하세요** (환경 변수 `KKT_SESSION_SECRET`도 가능). 기본값 `kkutu`는 공개된 값입니다 |
| `SEASON` | any | 현재 시즌 표시 (`sub/webinit.js`) |
| `SEASON_PRE` | any | 프리시즌 표시 (`sub/webinit.js`) |
| `KKUTUHOT_PATH` | string | 인기 단어 데이터 파일 경로 (`routes/admin.js`, `Server/data/kkutuhot.json` 참고) |

### 어뷰징 방지 / 자동 차단

| 키 | 타입 | 의미 |
|----|------|------|
| `USE_AUTOBAN` | boolean | 자동 차단 활성화 |
| `AUTOBAN` | object | 자동 차단 임계값/파라미터 (master & slave가 읽음) |
| `USER_BLOCK_OPTIONS` | object | 사용자 차단/패널티 옵션 |
| `GOOGLE_RECAPTCHA_TO_GUEST` | boolean | 게스트에게 reCAPTCHA 요구 |
| `GOOGLE_RECAPTCHA_TO_USER` | boolean | 로그인 사용자에게 reCAPTCHA 요구 |
| `GOOGLE_RECAPTCHA_SITE_KEY` | string | reCAPTCHA 사이트 키 (클라이언트에 전달) |
| `GOOGLE_RECAPTCHA_SECRET_KEY` | string | reCAPTCHA 시크릿 (서버 측 검증, `sub/recaptcha.js`) |

### Discord 웹훅 알림

| 키 | 타입 | 의미 |
|----|------|------|
| `USE_DISCORD_WEBHOOK` | boolean | Discord 알림 마스터 스위치 |
| `DISCORD_WEBHOOK_URL` | string | `https://discord.com/api/webhooks/`로 시작해야 함 |
| `IS_DISCORD_WEBHOOK_ENGLISH` | boolean | 웹훅 메시지를 한국어 대신 영어로 전송 |
| `DISCORD_WEBHOOK_NICKNAME` | string | 웹훅 발신자 이름 덮어쓰기 |
| `DISCORD_AVATAR` | string | 웹훅 아바타 URL 덮어쓰기 |

> Discord 웹훅 통합은 Node `24.13.1`에서 동작이 확인되었습니다.

### 최소 예시

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

OAuth 자격 증명을 제공자별 키로 담습니다. `lib/Web/auth/` 아래의 각 제공자
파일은 `config.<제공자>.clientID / clientSecret / callbackURL`을 읽습니다.

지원 제공자(`lib/Web/auth/`에 각각 파일 존재): **discord, google, github,
naver, kakao, facebook, instagram, twitch, twitter, spotify, line**
(그리고 `daldalso`는 현재 `.not.js` 접미사로 비활성화됨).

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
    // 실제로 활성화할 제공자만 추가하세요
}
```

참고:
- `kakao`와 `twitter`는 필드의 일부만 사용합니다(예: Kakao는 `clientID` +
  `callbackURL`만 필요, Twitter는 전략에 따라 consumer 키/시크릿과 함께
  `callbackURL` 사용).
- 새 제공자를 추가하려면 `lib/Web/auth/example.js`를 복사하고 `passport-*`
  전략을 연결한 뒤 `auth.json`에 해당 블록을 추가하세요.
  [ARCHITECTURE.ko.md §6](./ARCHITECTURE.ko.md#6-인증) 참고.

---

## 환경 변수

| 변수 | 설정 주체 | 의미 |
|------|-----------|------|
| `KKT_SV_NAME` | 시작 스크립트 / 셸 | 서버 표시 이름 (`settings.json`의 폴백) |
| `KKUTU_PORT` | 게임 `cluster.js` | 포크된 게임 워커의 포트 |
| `CHANNEL` | 게임 `cluster.js` | slave의 채널 번호 |
| `WS_KEY` | 웹 `cluster.js` | 웹 워커의 게임 서버 클라이언트 식별자 |
| `SERVER_NO_FORK` | cluster 진입점 | 포크된 자식을 표시하여 재포크 방지 |

---

## 관련 참고 자료

- 관리 페이지, 관리자 채팅 명령, DB 스키마, 공개 HTTP API, 웹소켓 이벤트:
  [`../Server/README.md`](../Server/README.md).
- 프로세스 모델과 빌드 파이프라인: [`ARCHITECTURE.ko.md`](./ARCHITECTURE.ko.md).
</content>
