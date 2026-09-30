# 아키텍처

이 문서는 KKuTu 서버의 구조와 게임 요청이 시스템을 통과하는 과정을 설명합니다.
코드를 수정하거나 확장해야 하는 개발자를 위한 문서입니다.

> English version: [`ARCHITECTURE.md`](./ARCHITECTURE.md)

## 1. 전체 개요

KKuTu는 **두 개의 독립적인 Node.js 프로그램**으로 실행되며, 각자 독립적으로
시작되어 내부 웹소켓 링크로 통신합니다.

```
                         ┌─────────────────────────────┐
   브라우저 ──HTTP──────► │  웹 서버                    │
   (포털 페이지, 로그인,  │  lib/Web/cluster.js         │
    정적 파일, API)       │   └─ lib/Web/main.js 포크   │
                         │       • Express + Pug        │
                         │       • Passport (OAuth)     │
                         │       • PostgreSQL / Redis   │
                         └──────────────┬──────────────┘
                                        │ 내부 웹소켓
                                        │ (게임 서버마다 클라이언트 1개)
                         ┌──────────────▼──────────────┐
   브라우저 ──웹소켓────►│  게임 서버(들)              │
   (방 / 게임플레이)     │  lib/Game/cluster.js        │
                         │   ├─ master  (lib/Game/master.js)
                         │   └─ slaves  (lib/Game/slave.js, 1..N)
                         │       • 방, 턴, 점수          │
                         │       • 로봇(AI), 상점, 채팅  │
                         └──────────────┬──────────────┘
                                        ▼
                              PostgreSQL  +  Redis (선택)
```

브라우저는 웹 서버와 **HTTP**로 통신하여(포털/게임 페이지 로드, JSON API 호출),
게임 서버와는 **웹소켓**으로 직접 통신하여 실시간 게임을 진행합니다. 웹 서버는
각 게임 서버에 대해 자체 웹소켓 연결을 유지하여 실시간 접속자 수(`seek`)를
표시하고, 친구 알림 같은 서버 간 이벤트를 중계합니다.

## 2. 프로세스 모델 (Node `cluster`)

두 서버 모두 Node의 `cluster` 모듈을 사용해 워커 프로세스를 포크합니다.

### 게임 서버 — `lib/Game/cluster.js`

```
node lib/Game/cluster.js <serverId> <cpuCount>
# 예: node lib/Game/cluster.js 0 1
```

- `serverId`(`SID`)는 `global.json`의 `MAIN_PORTS` / `ROOM_PORTS`에서 어떤 포트
  세트를 사용할지 결정합니다. 문자 `test`를 넘기면 개발("점검 중") 모드가
  활성화됩니다(`global.test = true`).
- `cpuCount`는 포크할 **slave** 워커(게임 채널)의 수입니다.
- **master** 프로세스(`master.js`)는 cluster 기본 프로세스에서 실행됩니다.
  slave 관리, 외부 공개 웹소켓 엔드포인트 소유, 관리자 명령 처리, 스팸/어뷰징
  필터링, Discord 웹훅 알림을 담당합니다.
- 각 **slave**(`slave.js`)는 *채널*(방의 일부 집합)을 호스팅하며
  `ROOM_PORTS[SID] + i`에서 수신 대기합니다. `CHANNEL`과 `KKUTU_PORT`는 환경
  변수로 전달됩니다. slave가 죽으면 master가 다시 포크합니다.

### 웹 서버 — `lib/Web/cluster.js`

```
node lib/Web/cluster.js <cpuCount>
# 예: node lib/Web/cluster.js 1
```

각 워커는 `lib/Web/main.js`를 실행합니다: Express 앱과 더불어 게임 서버로 향하는
아웃바운드 웹소켓 클라이언트(`MAIN_PORTS` 항목마다 1개)를 갖습니다.

### 다중 서버 실행

`Server/server-start-linux.sh`는 `KKT_SV_NUMS`개의 게임 cluster(`serverId`마다
하나)와 웹 cluster 하나를 시작하며, 출력은 `game0.log`, `game1.log`, …,
`web.log`로 리다이렉트됩니다. `server-stop-linux.sh`로 중지합니다.

## 3. 디렉토리 구성

```
.
├── README.md                 # 설치 가이드 (원본, 이중 언어)
├── docker-compose.yml         # game + web + postgres 스택
├── Dockerfile / psql.Dockerfile
├── db.sql                     # 전체 PostgreSQL 스키마 + 시드 데이터 (~40 MB)
├── settings.json              # 상위 수준 서버 설정 (이름, CPU 수)
├── language.json              # 사용 가능한 UI 언어
├── server-setup.bat           # 의존성 일괄 설치 (Server/setup.js 실행)
├── docs/                      # ← 현재 위치
└── Server/
    ├── main.js                # Electron 런처 (선택적 데스크톱 셸)
    ├── runner.js              # Electron 프로세스 러너 / 메뉴
    ├── setup.js               # npm install + 불필요한 .bin 셸 정리
    ├── server-*-linux.sh      # 시작 / 중지 / grunt 보조 스크립트
    ├── package.json           # Electron 런처 의존성
    ├── views/                 # Electron 런처 UI (index.pug)
    └── lib/
        ├── const.js           # 게임 규칙, 옵션, 점수, 테마, 플래그
        ├── package.json       # 런타임 의존성 (kkutu-core)
        ├── Gruntfile.js       # 클라이언트 JS 번들링 (concat + uglify)
        ├── sub/               # 공용 헬퍼 + 설정 (아래 참고)
        ├── Game/              # 게임 서버
        │   ├── cluster.js     # cluster 진입점
        │   ├── master.js      # 기본 프로세스
        │   ├── slave.js       # 워커 / 채널 프로세스
        │   ├── kkutu.js       # Room / Client / Robot 클래스
        │   ├── robot.js       # AI 봇 로직
        │   ├── shop.js        # 인게임 상점
        │   └── games/         # 게임 모드별 파일 (§5 참고)
        └── Web/
            ├── cluster.js     # cluster 진입점
            ├── main.js        # Express 앱, 라우트, 게임 서버 클라이언트
            ├── db.js          # PostgreSQL/Redis 접근 계층
            ├── auth/          # OAuth 제공자별 파일 (Passport)
            ├── routes/        # major / consume / admin / login
            ├── lib/           # 서버 렌더링 페이지 조각 + 클라이언트 규칙
            ├── public/        # 정적 자산 (빌드된 JS, css, 미디어)
            └── views/         # Pug 템플릿
```

### `lib/sub/` — 공용 모듈

| 파일 | 역할 |
|------|------|
| `global.json` | **(git 제외)** 메인 런타임 설정 — [CONFIGURATION.ko.md](./CONFIGURATION.ko.md) 참고 |
| `auth.json`   | **(git 제외)** 제공자별 OAuth 클라이언트 ID/시크릿 |
| `jjlog.js`    | 컬러 콘솔 로거 (`info` / `success` / `warn` / `error` / `alert`) |
| `collection.js` | Postgres/Redis "컬렉션"에 대한 얇은 추상화 (Mongo 유사 API) |
| `lizard.js`   | DB 계층 전반에서 쓰이는 작은 promise/tail 헬퍼 |
| `secure.js`   | `https`/`wss`용 SSL 인증서/키 로드 |
| `checkpub.js` | 인스턴스가 "공개"인지 판별 |
| `recaptcha.js`| reCAPTCHA 검증 |
| `dcwh.js`     | Discord 웹훅 헬퍼 |
| `ajae.js`     | 연령 제한("아재") 헬퍼 (대부분 비활성) |
| `webinit.js`  | Express 부트스트랩, 페이지 렌더링, 모바일 허용 목록 |

## 4. 요청 & 데이터 흐름

### 페이지 로드 (HTTP)

1. 브라우저가 웹 서버(`lib/Web/main.js`)의 `GET /`에 접속합니다.
2. `session` 테이블에서 세션을 조회하고, 프로필이 있으면 `req.session`에
   붙입니다.
3. Express가 **포털** 페이지(서버 목록) 또는 **kkutu** 게임 페이지(`?server=<id>`가
   설정된 포트로 해석될 때)를 렌더링하며, `const.js`의 상수(모드, 규칙, 옵션,
   테마, 장착 그룹)를 주입합니다.
4. 페이지는 템플릿에 전달된 `PORT` / `ROOM_PORT` / `PROTOCOL`(`ws` 또는 `wss`)을
   사용해 웹소켓으로 다시 연결합니다.

### 게임 플레이 (웹소켓)

1. 브라우저가 게임 서버 slave로 웹소켓을 엽니다.
2. 클라이언트 → 서버 이벤트가 방 라이프사이클을 주도합니다: `enter`,
   `setRoom`, `ready`, `start`, `leave`, `practice`, `invite`, `inviteRes`,
   `heartbeat`.
3. 서버 → 클라이언트 이벤트가 라운드를 주도합니다: `roundReady`, `turnStart`,
   `turnHint`, `turnError`, `turnEnd`, `roundEnd`, 그리고 추방 관련 이벤트인
   `kickVote` / `kickDeny`.
4. 제출된 각 단어는 사전 테이블(`kkutu_ko` / `kkutu_en`)과 활성 규칙/옵션에
   대해 검증되며, 점수는 `Const.getPreScore` / `Const.getPenalty`로 계산됩니다.

권위 있는 프로토콜 레퍼런스는 `Server/README.md`에 링크된 커뮤니티 문서입니다:
<https://github.com/horyu1234/KKuTu-Protocol-Docs>.

### 데이터베이스 접근

`lib/Web/db.js`는 `pg` 커넥션 풀과 선택적 Redis 클라이언트 위에 Mongo 스타일
API를 구성합니다. Redis 실패 시 "no-redis 모드"(`FAKE_REDIS`)로 폴백하여 서버가
계속 부팅됩니다. 연결 파라미터는 `global.json`에서 옵니다(`PG_USER`,
`PG_PASSWORD`, `PG_HOST`, `PG_PORT`, `PG_DATABASE`).

주요 테이블(전체 스키마는 `db.sql`, 문서는 `Server/README.md`):
`users`, `kkutu_ko`, `kkutu_en`, `kkutu_cw_ko`, `kkutu_injeong`,
`kkutu_manner_ko/en`, `kkutu_shop`, `kkutu_shop_desc`, `session`, `ip_block`.

## 5. 게임 모드 시스템

게임 모드는 두 곳에서 정의됩니다.

1. **`lib/const.js` → `exports.RULE`**: 모든 모드를 3글자 코드로 등록합니다
   (예: `KKT`, `EKT`, `KCW`, `KTY`, `HUN`, `KDA`, `KSS`, `KDG`). 각 항목은
   언어(`lang`), 규칙(`rule`) 이름, 허용 특수 옵션(`opts`), 시간 상수(`time`),
   AI 봇 허용 여부(`ai`), 큰 화면 사용 여부(`big`), 턴 이탈 시 라운드 종료
   여부(`ewq`)를 선언합니다. `GAME_TYPE`은 코드들의 순서 목록입니다.

2. **`lib/Game/games/<rule>.js`**: 각 규칙의 서버 측 로직을 구현하며, 모두
   `games/_form.js`의 공용 베이스 위에 만들어집니다.

   | 파일 | 규칙 | 설명 |
   |------|------|------|
   | `classic.js`   | Classic   | 표준 끝말잇기 |
   | `crossword.js` | Crossword | 십자말풀이식 한국어 단어 유추 |
   | `cw_maker.js`  | —         | 십자말풀이 판 생성·점검 CLI (`--help`) |
   | `daneo.js`     | Daneo     | 단어대결 모드 |
   | `hunmin.js`    | Hunmin    | 초성(훈민정음) 퀴즈 |
   | `jaqwi.js`     | Jaqwi     | 주제별 자음 퀴즈(자음퀴즈) |
   | `sock.js`      | Sock      | 단어 솎아내기(솎솎) |
   | `typing.js` / `typing_const.js` | Typing | 타자 대결 |
   | `drawing.js`   | Drawing   | 그림 그리고 맞히기(클라이언트에서 Fabric.js 사용) |

**클라이언트 측** 규칙 렌더러는 `lib/Web/lib/kkutu/rule_<rule>.js`에 있으며
Grunt로 번들링됩니다.

### 모드 추가 / 변경

- 서버 로직: `lib/Game/games/<rule>.js`를 추가/수정합니다.
- 모드 등록/조정: `lib/const.js`(`RULE` + 암묵적으로 `GAME_TYPE`).
- 클라이언트 렌더러: `lib/Web/lib/kkutu/rule_<rule>.js`를 추가하고
  `lib/Gruntfile.js`의 `KKUTU_LIST` 배열에 포함시킨 뒤 다시 빌드합니다(§7 참고).

## 6. 인증

로그인은 Passport가 처리합니다. 각 제공자는 `lib/Web/auth/` 아래에 파일을
가지며(예: `auth_discord.js`, `auth_google.js`, `auth_naver.js`) 세 가지를
내보냅니다.

- `config` — 표시 메타데이터 + Passport `Strategy` 클래스.
- `strategyConfig` — `auth.json`에서 읽는 `clientID` / `clientSecret` /
  `callbackURL`.
- `strategy(process, MainDB, Ajae)` — 제공자 프로필을 KKuTu 내부
  프로필(`$p.id`, `$p.name`, `$p.image` 등)로 매핑합니다. 사용자 ID는 제공자별로
  네임스페이스가 붙습니다. 예: `discord-123456789`.

`auth/example.js`는 새 제공자를 추가할 때 복사하는 템플릿입니다. 관리자 권한은
`global.json`의 `ADMIN` 배열에 사용자의 `_id`를 추가하여 부여합니다.

## 7. 빌드 파이프라인 (Grunt)

클라이언트 측 JavaScript는 `lib/Web/lib/`에서 작성되며 `lib/Gruntfile.js`에 의해
`lib/Web/public/js/`로 번들링됩니다.

- `concat`: 규칙별 kkutu 스크립트를 `in_game_kkutu.js`로 합칩니다.
- `uglify`: 각 항목을 GPL 배너와 함께 `*.min.js`로 압축합니다.
- 커스텀 `pack` 태스크: 번들된 게임 스크립트를 IIFE로 감쌉니다.

`Server/lib`에서 실행:

```bash
npx grunt default pack   # 빌드 + 패킹 (Dockerfile이 실행하는 것)
```

빌드된 `*.min.js` 파일은 git에서 제외됩니다(`.gitignore` 참고). 따라서 새로
체크아웃한 코드를 웹 서버가 제공하기 전에 빌드 단계가 필요합니다.

## 8. 배포 옵션

### 베어메탈 / VM (Linux)

```bash
cd Server
./server-start-linux.sh   # 게임 cluster + 웹 cluster 시작, *.log로 로깅
./server-stop-linux.sh
```

### Docker Compose

`docker-compose.yml`은 세 가지 서비스를 정의합니다.

- `db` — PostgreSQL(`psql.Dockerfile`로 빌드, `db.sql`로 시드).
- `game` — `node lib/Game/cluster.js 0 1`, `8496`과 `8080` 노출.
- `web` — `node lib/Web/cluster.js 1`, `80` 노출, `db` + `game`에 의존.

```bash
docker compose up --build
```

> 참고: Dockerfile은 `node:12`를 고정합니다. 일부 최신 기능(예: Discord 웹훅
> 통합)은 Node 24에서 검증되었으므로, 해당 기능에 의존한다면 베이스 이미지를
> 런타임에 맞추세요.

## 9. 알아둘 점 / 주의사항

- 호스트 `127.0.0.2`는 웹 ↔ 게임 통신용으로 예약되어 있으니 다른 곳에
  바인딩하지 마세요.
- Redis는 선택 사항입니다. 없으면 랭킹과 일부 세션 기능이 제한되지만 서버는
  계속 동작합니다(no-redis 폴백).
- Cloudflare 뒤에서는 **DNS only**(회색 구름)를 사용하세요 — 프록시는 방
  생성/입장을 깨뜨립니다 — 그리고 Cloudflare가 지원하는 포트를 선택하세요.
- `global.json`과 `auth.json`은 **커밋되지 않습니다.** 직접 생성해야 합니다
  (템플릿은 레포에 포함). [CONFIGURATION.ko.md](./CONFIGURATION.ko.md) 참고.
- 사기 봇을 제외한 봇은 단어 테이블에 최소 `hit` 값이 있어야 정상 동작합니다.
</content>
