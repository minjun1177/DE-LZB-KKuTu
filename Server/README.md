# KO

해당 문서는 서버 관리자가 원활한 서버관리를 위해 작성한 문서입니다.

## 공통

날짜는 **UNIX Time을 기준**으로 설정됩니다. 

## 서버 관리

### 서버켜기

```shell
./server-start-linux.sh
```
nvm을 사용중 이라면
```shell
nvm use 24
./server-start-linux.sh
```

로그는 web.log, game0.log, game1.log에 저장 됩니다.


### 서버 끄기

```shell
./server-stop-linux.sh
```

### 전체 공지 수정

`lib/Web/public/global_notice.html`을 수정합니다.


### portal 공지 수정

`lib/Web/public/kkutu_bulletin.html`을 수정합니다.

---

## 관리자 관련

관리자 권한은 `lib/sub/global.json`의 **_id( ex: discord-1234567 )를 ADMIN에 배열**로 저장합니다.

### 관리자 명령어

`#`입력후 채팅창에 입력합니다.

| 명령어      |    파라미터1    | 파라미터2 |                            기능                             |
|----------|:-----------:|:-----:|:---------------------------------------------------------:|
| yell     |    공지할 글    |   -   |               서버에 있는 모든 유저에게 1번 내용을 공지합니다.                |
| kill     |    킥할 ID    |   -   |                       유저의 소켓 연결을 끊습니다.                    |
| tailroom |  추적할 방 번호   |   -   |                         방의 정보를 불러옵니다.                     |
| tailuser |  추적할 유저 ID  |   -   |                        유저의 정보를 불러옵니다.                     |
| dump     |      -      |   -   | 메모리 스냅샷을 /home/kkutu_memdump . . . .heapsnapshot으로 저장합니다. |
| ban      |  밴할 유저 ID   | 밴 기한  |            유저의 서버출입을   arg2 일까지 불허가 합니다. *2번은 필수가 아닙니다.*        |
| ipban    |    밴할 IP    | 밴 기한  |        1번의 IP의 서버출입을 arg2 일까지 불허가 합니다. *2번은 필수가 아닙니다.*        |
| unban    | 밴 해제할 유저 ID |   -   |                       유저의 서버출입을 허가합니다.                    |
| ipunban  |  밴 해제할 IP   |   -   |                       IP의 서버출입을 허가합니다                     |
| roommsg  | 방 번호 | 메시지 | 방 번호에 메시지를 보냅니다. |

### 관리 페이지

`'서버주소'/gwalli` 혹은 [localhost/gwalli](http://localhost/gwalli)로 접속합니다

#### 자격

| 이름  |                 설명                  |
|-----|:-----------------------------------:|
| 암호  | `lib/sub/global.json`의 PASS를 입력합니다. |
| 테이블 |   테이블에 수정할 DB의 언어(ko, en)을 입력합니다.   |

#### 추가 요청 받기

| 이름    |        기능         |
|-------|:-----------------:|
| 조회    | 추가요청한 단어를 불러옵니다.  |
| 승인?   |   승인여부를 체크합니다.    |
| 링크    | namu.moe로 이동합니다.  |
| 단어    |    단어를 나타냅니다.     |
| 주제    |  어인정 주제를 나타냅니다.   |
| 한사람   |    요청자를 나타냅니다.    |
| 언제    |  요청한 기간을 나타냅니다.   |
| 모두 승인 |  승인여부를 모두 체크합니다.  |
| 모두 거절 | 승인여부를 모두 체크해제합니다. |
| 적용    |   변경사항을 저장합니다.    |

#### 상점 DB 다루기

| 이름      |                     기능                     |
|---------|:------------------------------------------:|
| 품목      | 아이템의 ID를 입력합니다. "~ALL"를 입력시 아이템 전체를 나타냅니다. |
| 조회      |              아이템의 ID를 검색합니다.               |
| 숨기기     |               아이템 리스트를 숨깁니다.               |
| "#"     |              아이템의 ID를 나타냅니다.               |
| 가격      |              상점에서의 가격을 입력니다.               |
| 산 횟수    |           유저가 상점에서 산 횟수를 나타냅니다.            |
| term    |             보유할 수 있는 기간을 입력니다.             |
| 종류      |               아이템의 종류를 입력니다.               |
| 업데이트 날짜 |           아이템이 업데이트된 날짜를 나타냅니다.            |
| 장착효과    |             장착시 아이템의 효과를 입력니다.             |
| 한국어 이름  |               한국어 이름을 입력니다.                |
| 한국어 설명  |               한국어 설명을 입력니다.                |
| 영어 이름   |                영어 이름을 입력니다.                |
| 영어 설명   |                영어 설명을 입력니다.                |

| 아이템 ID           |    한국어 이름     |
|------------------|:-------------:|
| black_oxford     |   검정 옥스포드화    |
| black_shoes      |    검은콩 신발     |
| blackrobe        |     검은 로브     |
| blue_name        |     푸른 이름     |
| blue_vest        |     파란 조끼     |
| bluecandy        |   포도 막대 사탕    |
| cat_mouth        |     고양이 입     |
| choco_ice        |    초코 아이스     |
| cuspidal         |    송곳니 장식     |
| darkblack        |   어둠의 다크니스    |
| double_brows     |    눈썹 두 가닥    |
| green_name       |    초록빛 이름     |
| lemoncandy       |   레몬 막대 사탕    |
| loosesocks       |     루즈삭스      |
| melon_ice        |    멜론 아이스     |
| mustache         |      콧수염      |
| orange_headphone |    주황 헤드폰     |
| orange_vest      |     귤색 조끼     |
| pinkcandy        |   딸기 막대 사탕    |
| purple_ice       |    보라 아이스     |
| red_name         |     붉은 이름     |
| scouter          |     스카우터      |
| sunglasses       |     선글라스      |
| taengja          |     탱자 벽지     |
| water            |      물옷       |
| white_mask       |     하얀 복면     |
| b1_gm            |    운영자의 휘장    |
| brownbere        |    갈색 베레모     |
| $WPA             |   희귀 글자 조각    |
| b2_fire          | 불꽃같이 날아오르는 휘장 |
| b3_do            |   도전의 ㄷ 휘장    |
| b4_hongsi        |    귤색 띠 휘장    |
| b4_mint          |    민트 띠 휘장    |
| b3_pok           |   폭풍의 ㅍ 휘장    |
| beardoll         |     곰인형 입     |
| black_mask       |     검은 복면     |
| blackbere        |    검은 베레모     |
| blue_headphone   |    파란 헤드폰     |
| brave_eyes       |    용감한 눈매     |
| brown_oxford     |   갈색 옥스포드화    |
| decayed_mouth    |     썩은 미소     |
| haksamo          |      학사모      |
| medal            |      금메달      |
| miljip           |     밀짚모자      |
| nekomimi         |     고양이 귀     |
| pink_vest        |     분홍 조끼     |
| redbere          |    붉은 베레모     |
| rio_seonghwa     |     리우 성화     |
| twoeight         |    2:8 가르마    |
| $WPC             |     글자 조각     |
| $WPB             |   고급 글자 조각    |
| b2_metal         |  강철같이 굳건한 휘장  |
| merong           |     메롱 입      |
| oh               |     오! 입      |
| pants_korea      |    한국한국 바지    |
| pants_china      |    중국중국 바지    |
| orange_name      |     주황 이름     |
| purple_name      |     보라 이름     |
| boxB3            |   고급 휘장 상자    |
| boxB2            |   희귀 휘장 상자    |
| boxB4            |   일반 휘장 상자    |
| sqpants          |     네모 바지     |
| tile             |      타일       |
| cwd              |      청와대      |
| close_eye        |     감은 눈      |
| lazy_eye         |     게으른 눈     |
| bokjori          |      복조리      |
| hamster_O        |   주황 햄스터 머리   |
| hamster_G        |   잿빛 햄스터 머리   |
| b3_hwa           |   조화의 ㅎ 휘장    |
| dictPage         |    백과사전 낱장    |
| laugh            |    웃으며 말해요    |
| bigeye           |     서클렌즈      |
| inverteye        |     반전 눈      |
| pants_japan      |    일본일본 바지    |
| indigo_name      |     남색 이름     |
| pink_name        |     분홍 이름     |
| stars            |    밤하늘의 별     |
| spanner          |      스패너      |
| b4_bb            |   블루베리 띠 휘장   |

| 아이템 종류   | 종류 이름  |
|----------|:------:|
| NIK      | 이름 스킨  |
| BDG1     | 보물 휘장  |
| BDG2     | 희귀 휘장  |
| BDG3     | 고급 휘장  |
| BDG4     | 일반 휘장  |
| Mhead    | 모레미 머리 |
| Meye     | 모레미 눈  |
| Mmouth   | 모레미 입  |
| Mhand    | 모레미 손  |
| Mclothes | 모레미 옷  |
| Mshoes   | 모레미 발  |
| Mback    | 모레미 전경 |

장착효과는 **json**으로 작성합니다.
| 장착효과 |   값   |       설명       |
| -------- | :----: | :--------------: |
| gEXP     |  실수  |   휙득 경험치    |
| gMNY     |  실수  |     획득 핑      |
| hEXP     |  정수  | 분당 추가 경험치 |
| hMNY     |  정수  |   분당 추가 핑   |
| gif      | 불리언 |     gif 여부     |

#### 유저 DB 다루기

| 이름       |               설명               |
|----------|:------------------------------:|
| ID       |         유저 ID를 입력합니다.          |
| 닉네임      |         유저 닉네임을 입력합니다.         |
| 조회       |          유저정보를 불러옵니다.          |
| "#"      |           ID를 나타냅니다.           |
| 돈        |           핑을 나타냅니다.            |
| 전적       |   끄투 전적, 경험치, 접속한 날을 나타냅니다.    |
| 인벤토리     |          인벤토리를 나타냅니다.          |
| 장착중      |      현재 장착중인 아이템을 나타냅니다.       |
| 닉네임      |          닉네임을 나타냅니다.           |
| 닉네임 변경날짜 |      닉네임이 변경된 날짜를 나타냅니다.       |
| 소개글      |         소개 한마디를 나타냅니다.         |
| 마지막 접속   |      마지막으로 접속한 날자를 나타냅니다.      |
| 밴사유      |   밴 이유를 나타냅니다. 없으면 밴이 아닙니다.    |
| 밴끝       | 밴의 끝나는 날짜를 나타냅니다. 없으면 무기한 입니다. |
| 친구       |     친구의 ID를 json으로 나타냅니다.      |

#### 유저 감시하기

| 이름 |             기능             |
|----|:--------------------------:|
| ID | 감시할 ID를 입력합니다. ","로 구분합니다. |
| 감시 |         감시를 시작합니다.         |

#### 끄투 DB 다루기

| 이름  |              기능              |
|-----|:----------------------------:|
| 단어  |        수정할 단어를 입력합니다.        |
| 조회  |        단어 정보를 불러옵니다.         |
| "#" |         단어의 뜻을 나눕니다.         |
| 타입  | 단어의 타입을 입력니다. (어떤 타입인지 추가바람) |
| 주제  |         단어 주제를 입력니다.         |
| 뜻   |         단어의 뜻을 입력니다.         |
| 행동  |   단어의 뜻을 올리고, 삭제하고, 수입력니다    |
| 추가  |          뜻을 추가합니다.           |
| 적용  |         변경사항을 저장합니다.         |

#### 끄투 DB에 단어 추가하기

| 이름    |                    기능                     |
|-------|:-----------------------------------------:|
| 주제    |               단어 주제를 입력합니다.               |
| 단어 목록 |              추가할 단어를 입력합니다.               |
| 확인    | 단어를 DB에 추가합니다. "자격"에서 입력한 테이블의 언어로 추가합니다. |

---

## Game서버 관련

### 서버 구조

- **master (`lib/Game/master.js`)** : 슬레이브 관리용 중앙 프로세스
- **slave (`lib/Game/slave.js`)** : 게임 로직 처리 프로세스

### 주요 클래스

| 클래스    | 파일                  | 역할                       |
|--------|---------------------|--------------------------|
| Room   | `lib/Game/kkutu.js` | 게임방 관리 (플레이어, 게임상태, 스코어) |
| Client | `lib/Game/kkutu.js` | 개별 클라이언트 연결 관리           |
| Robot  | `lib/Game/kkutu.js` | AI 봇 플레이어                |

### 게임 모드

게임 모드는 `lib/Game/games/` 디렉토리에 위치합니다.

| 파일             |  게임 모드  | 설명             |
|----------------|:-------:|----------------|
| `classic.js`   | 기본 끝말잇기 | 단어 끝말잇기        |
| `crossword.js` |  십자말풀이  | 알맞은 한국어 단어를 유추 |
| `daneo.js`     |  단어대결   | 단어 대기          |
| `hunmin.js`    |  훈민정음   | 초성 맞추기         |
| `jaqwi.js`     |  자음퀴즈   | 주제의 초성 맞추기     |
| `sock.js`      |   솎솎    | 단어 솎아내기        |
| `typing.js`    |  타자대결   | 주어진 단어 타이핑     |

### 게임 상수

`lib/Game/const.js`에서 다음 항목들을 설정할 수 있습니다:

 - **게임 모드**: 언어, 규칙, 특수규칙등 설정
 - **미션 글자**: 미션 설정
 - **어인정 주제**: 단어 주제 설정

---

## Web서버 관련

(추가바람)

---

## 웹소켓 관련

클라이언트와 서버는 웹소켓으로 통신합니다.

#### 주요 이벤트 (클라이언트 → 서버)
- `enter`: 방 입장
- `setRoom`: 방 설정
- `leave`: 방 퇴장
- `ready`: 게임 준비
- `start`: 게임 시작
- `practice`: 연습
- `invite`: 방 초대
- `inviteRes`: 방 초대 결과
- `heartbeat`: 클라우드플레어 타임아웃 방지

#### 주요 이벤트 (서버 → 클라이언트)
- `roundReady`: 라운드 준비
- `turnStart`: 턴 시작
- `turnError`: 턴 오류
- `turnHint`: 턴 힌트
- `turnEnd`: 턴 종료
- `roundEnd`: 라운드 종료
- `kickVote`: 방 추방 투표 진행
- `kickDeny`: 방 추방 투표 부결
- `heartbeat`: 클라우드플레어 타임아웃 방지

자세한 이벤트는 [여기](https://github.com/horyu1234/KKuTu-Protocol-Docs)를 참고하세요.

---

## DB관련

PostgreSQL을 사용하며, 주요 쿼리와 설정은 `lib/Web/db.js`에 정의됩니다.

#### db.sql 주요 내용

- `ip_block` 테이블: 차단된 IP 목록
- `kkutu_cw_ko`  테이블: 십자말풀이 목록
- `kkutu_en` 테이블: 영어 단어 목록
- `kkutu_injeong` 테이블: 단어 인정 신청 기록
- `kkutu_ko` 테이블: 한국어 단어 목록
- `kkutu_manner_en` 테이블: 영어 끄투 매너 목록
- `kkutu_manner_ko` 테이블: 한국어 매너 목록
- `kkutu_shop` 테이블: 아이템 목록
- `kkutu_shop_desc` 테이블: 아이템 이름, 설명 목록
- `session` 테이블: 현재 세션 목록
- `users` 테이블: 사용자 정보

### 주요 테이블 스키마

#### users 테이블

사용자 계정 정보를 저장합니다.

| 컬럼명            | 타입       | 설명                             |
|----------------|----------|--------------------------------|
| `_id`          | VARCHAR  | 사용자 고유 ID (ex: discord-123456) |
| `money`        | INTEGER  | 핑 (게임 재화)                      |
| `kkutu`        | JSON     | 게임 전적                          |
| `lastLogin`    | INTERGER | 닉네임 변경 날짜                      |
| `box`          | JSON     | 인벤토리                           |
| `equip`        | JSON     | 장착중인 아이템                       |
| `nickname`     | VARCHAR  | 닉네임                            |
| `exordial`     | BIGINT   | 설명                             |
| `black`        | VARCHAR  | 밴 사유, 없으면 밴 아님                 |
| `blockedUntil` | INTERGER | 밴 기한                           |
| `server`       | VARCHAR  | 현재 접속 서버                       |
| `password`     | VARCHAR  | (추가바람)                         |
| `friend`       | JSON     | 친구 목록                          |

#### kkutu_en/kkutu_ko 테이블

단어정보를 저장합니다

| 컬럼명     | 타입       | 설명    |
|---------|----------|-------|
| `_id`   | VARCHAR  | 단어    |
| `type`  | VARCHAR  | 단어 종류 |
| `mean`  | VARCHAR  | 뜻     |
| `hit`   | INTERGER | 사용 횟수 |
| `flag`  | INTERGER | 타입    |
| `theme` | VARCHER  | 테마    |

#### kkutu_injeong 테이블

어인정 단어를 저장합니다

| 컬럼명         | 타입       | 설명     |
|-------------|----------|--------|
| `_id`       | VARCHAR  | 단어     |
| `theme`     | VARCHAR  | 테마     |
| `createdAt` | INTERGER | 요청한 날짜 |
| `writer`    | VARCHAR  | 요청한 사람 |

### DB 유지보수

#### 데이터베이스 백업

```bash
# 전체 백업
pg_dump -U postgres kkutu > backup_$(date +%Y%m%d_%H%M%S).sql

# 특정 테이블만 백업
pg_dump -U postgres -t users kkutu > backup_users.sql
```

#### 백업 복구

```bash
# 전체 복구
psql -U postgres kkutu < backup_20260205_120000.sql

# 특정 테이블만 복구
psql -U postgres kkutu < backup_users.sql
```

---

## API

| 경로              | 메소드 |      옵션       | 예시                                                                                                                                                              |   비고   |
|-----------------|:---:|:-------------:|-----------------------------------------------------------------------------------------------------------------------------------------------------------------|:------:|
| /shop           | get |       -       | GET /shop -> {"goods":[{"cost":"-1","term":0,"group":"PIX","options":{},"updatedAt:null,"_id":"$WPA"} . . .]}                                                   |   -    |
| /servers        | get |       -       | GET /servers -> {"list":[1],"max":400}                                                                                                                          |   -    |
| /box            | get |       -       | GET /box -> {"bokjori":1,"boxB2":4}                                                                                                                             | 로그인 필요 |
| /dict/"단어"      | get | lang - ko, en | GET /dict/사과?lang=ko -> {"word":"사과","mean":" (중략) INJEONG,INJEONG"}                                                                                            |   -    |
| /injeong/"단어"   | get | theme - 단어 주제 | GET /injeong/놈놈놈?theme=MAN -> {message: "OK"}                                                                                                                   | 로그인 필요 |
| /language/flush | get |       -       | GET /language/flush -> OK                                                                                                                                       |   -    | 
| /ranking        | get |    p - 페이지    | GET /ranking?p=0 -> {"page":0,"data":[{"id":"discord-1234567","rank":0,"score":"161971"} . . . ]}                                                               |   -    |
| /cf/"단어"        | get |       -       | GET /cf/사과 -> {"data":[{"key":"dictPage","value":1,"rate":1},{"key":"boxB4","value":1,"rate":0},{"key":"$WPC?","value":1,"rate":0.05555555555555555}],"cost":0} |   -    | 
| /search/words | get | theme -단어 주제 | GET /search/words?theme=gsi -> {"words":["요요","사과","가연" . . .]} | - |
---

## 기타

- 언어팩을 수정하였다면 `'서버주소'/language/flush`로 접속하여 새로고침합니다. (관리자 계정으로 로그인했거나 내부망에서 접속한 경우에만 허용됩니다.)
- 사기 봇을 제외한 봇은 최소 hit값이 있습니다. 따라서 정상적인 봇을 사용하려면 데이터베이스 kkutu_en/kkutu_ko 테이블안의 hit값을 수정해야 합니다.
- 클라우드플레어 사용 시 서버와 유저가 통신하는 모든 포트는 [클라우드플레어가 지원하는 포트](https://developers.cloudflare.com/fundamentals/reference/network-ports/) 중 하나로 설정하셔야 합니다.
- 새로운 기능 Discord Webhook 알림 기능이 추가 되었습니다. 사용시 global.json에서 `USE_DISCORD_WEBHOOK`을 true와 `DISCORD_WEBHOOK_URL`의 알맞는 값을 설정합니다.
- Discord Webhook 알림 기능은 `node 24.13.1`에서 작동을 확인했습니다.


# EN
This document was written to help server administrators manage the server smoothly.

## Common

Dates are configured using **UNIX Time**.

## Server Management

### Start Server

```shell
./server-start-linux.sh
```

If you use nvm:

```shell
nvm use 24
./server-start-linux.sh
```

Logs are saved to web.log, game0.log, and game1.log.

### Stop Server

```shell
./server-stop-linux.sh
```

### Edit Global Notice

Edit `lib/Web/public/global_notice.html`.

### Edit Portal Notice

Edit `lib/Web/public/kkutu_bulletin.html`.

---

## Admin

To grant admin permissions, add the user's `_id` (for example, `discord-1234567`) to the `ADMIN` array in `lib/sub/global.json`.

### Admin Commands

Type `#` in chat, then enter the command.

| Command  | Parameter 1  | Parameter 2 | Description |
|----------|:------------:|:-----------:|:------------|
| yell     | Message      | -           | Broadcasts the message in Parameter 1 to all users on the server. |
| kill     | User ID      | -           | Disconnects the specified user's socket. |
| tailroom | Room number  | -           | Loads information about the specified room. |
| tailuser | User ID      | -           | Loads information about the specified user. |
| dump     | -            | -           | Saves a memory snapshot to `/home/kkutu_memdump....heapsnapshot`. |
| ban      | User ID      | Ban expiry  | Blocks the user from entering the server until the date in arg2. *arg2 is optional.* |
| ipban    | IP           | Ban expiry  | Blocks the IP from entering the server until the date in arg2. *arg2 is optional.* |
| unban    | User ID      | -           | Removes the ban for the specified user. |
| ipunban  | IP           | -           | Removes the ban for the specified IP. |
| roommsg  | Room number  | Message     | Sends a message to the specified room. |

### Admin Page

Visit `'ServerAddress'/gwalli` or [localhost/gwalli](http://localhost/gwalli).

#### Credentials

| Name | Description |
|------|:------------|
| Password | Enter `PASS` from `lib/sub/global.json`. |
| Table | Enter the DB language to edit (`ko` or `en`). |

#### Handle Additional Word Requests

| Name | Description |
|------|:------------|
| Fetch | Loads requested words. |
| Approve? | Checks whether to approve each request. |
| Link | Opens namu.moe. |
| Word | Displays the word. |
| Theme | Displays the injeong theme. |
| User | Displays the requester. |
| When | Displays the request time. |
| Approve All | Checks approval for all items. |
| Reject All | Unchecks approval for all items. |
| Apply | Saves changes. |

#### Manage Shop DB

| Name | Description |
|------|:------------|
| Item | Enter the item ID. Use `~ALL` to show all items. |
| Fetch | Searches by item ID. |
| Hide | Hides the item list. |
| # | Displays the item ID. |
| Price | Sets the shop price. |
| Purchase Count | Shows how many times users bought the item. |
| term | Sets the ownership duration. |
| Type | Sets the item type. |
| Updated At | Shows when the item was updated. |
| Equip Effect | Sets the effect when equipped. |
| Korean Name | Sets the Korean name. |
| Korean Description | Sets the Korean description. |
| English Name | Sets the English name. |
| English Description | Sets the English description. |

| Item ID | Korean Name |
|------------------|:-------------:|
| black_oxford     |   검정 옥스포드화    |
| black_shoes      |    검은콩 신발     |
| blackrobe        |     검은 로브     |
| blue_name        |     푸른 이름     |
| blue_vest        |     파란 조끼     |
| bluecandy        |   포도 막대 사탕    |
| cat_mouth        |     고양이 입     |
| choco_ice        |    초코 아이스     |
| cuspidal         |    송곳니 장식     |
| darkblack        |   어둠의 다크니스    |
| double_brows     |    눈썹 두 가닥    |
| green_name       |    초록빛 이름     |
| lemoncandy       |   레몬 막대 사탕    |
| loosesocks       |     루즈삭스      |
| melon_ice        |    멜론 아이스     |
| mustache         |      콧수염      |
| orange_headphone |    주황 헤드폰     |
| orange_vest      |     귤색 조끼     |
| pinkcandy        |   딸기 막대 사탕    |
| purple_ice       |    보라 아이스     |
| red_name         |     붉은 이름     |
| scouter          |     스카우터      |
| sunglasses       |     선글라스      |
| taengja          |     탱자 벽지     |
| water            |      물옷       |
| white_mask       |     하얀 복면     |
| b1_gm            |    운영자의 휘장    |
| brownbere        |    갈색 베레모     |
| $WPA             |   희귀 글자 조각    |
| b2_fire          | 불꽃같이 날아오르는 휘장 |
| b3_do            |   도전의 ㄷ 휘장    |
| b4_hongsi        |    귤색 띠 휘장    |
| b4_mint          |    민트 띠 휘장    |
| b3_pok           |   폭풍의 ㅍ 휘장    |
| beardoll         |     곰인형 입     |
| black_mask       |     검은 복면     |
| blackbere        |    검은 베레모     |
| blue_headphone   |    파란 헤드폰     |
| brave_eyes       |    용감한 눈매     |
| brown_oxford     |   갈색 옥스포드화    |
| decayed_mouth    |     썩은 미소     |
| haksamo          |      학사모      |
| medal            |      금메달      |
| miljip           |     밀짚모자      |
| nekomimi         |     고양이 귀     |
| pink_vest        |     분홍 조끼     |
| redbere          |    붉은 베레모     |
| rio_seonghwa     |     리우 성화     |
| twoeight         |    2:8 가르마    |
| $WPC             |     글자 조각     |
| $WPB             |   고급 글자 조각    |
| b2_metal         |  강철같이 굳건한 휘장  |
| merong           |     메롱 입      |
| oh               |     오! 입      |
| pants_korea      |    한국한국 바지    |
| pants_china      |    중국중국 바지    |
| orange_name      |     주황 이름     |
| purple_name      |     보라 이름     |
| boxB3            |   고급 휘장 상자    |
| boxB2            |   희귀 휘장 상자    |
| boxB4            |   일반 휘장 상자    |
| sqpants          |     네모 바지     |
| tile             |      타일       |
| cwd              |      청와대      |
| close_eye        |     감은 눈      |
| lazy_eye         |     게으른 눈     |
| bokjori          |      복조리      |
| hamster_O        |   주황 햄스터 머리   |
| hamster_G        |   잿빛 햄스터 머리   |
| b3_hwa           |   조화의 ㅎ 휘장    |
| dictPage         |    백과사전 낱장    |
| laugh            |    웃으며 말해요    |
| bigeye           |     서클렌즈      |
| inverteye        |     반전 눈      |
| pants_japan      |    일본일본 바지    |
| indigo_name      |     남색 이름     |
| pink_name        |     분홍 이름     |
| stars            |    밤하늘의 별     |
| spanner          |      스패너      |
| b4_bb            |   블루베리 띠 휘장   |

| Item Type | Type Name |
|----------|:------:|
| NIK      | Name Skin |
| BDG1     | Treasure Badge |
| BDG2     | Rare Badge |
| BDG3     | Advanced Badge |
| BDG4     | Common Badge |
| Mhead    | Moremi Head |
| Meye     | Moremi Eye |
| Mmouth   | Moremi Mouth |
| Mhand    | Moremi Hand |
| Mclothes | Moremi Clothes |
| Mshoes   | Moremi Shoes |
| Mback    | Moremi Foreground |

Equip effects are written in **JSON**.

| Equip Effect | Value Type | Description |
| -------- | :----: | :--------------: |
| gEXP     | Float  | Extra gained EXP |
| gMNY     | Float  | Extra gained Ping |
| hEXP     | Integer | Additional EXP per minute |
| hMNY     | Integer | Additional Ping per minute |
| gif      | Boolean | Whether GIF is enabled |

#### Manage User DB

| Name | Description |
|------|:------------|
| ID | Enter user ID. |
| Nickname | Enter user nickname. |
| Fetch | Loads user information. |
| # | Displays the ID. |
| Money | Displays Ping. |
| Record | Shows KKuTu record, EXP, and login days. |
| Inventory | Shows inventory. |
| Equipped | Shows currently equipped items. |
| Nickname | Shows nickname. |
| Nickname Changed At | Shows the nickname change date. |
| Status Message | Shows profile status text. |
| Last Login | Shows the last login date. |
| Ban Reason | Shows ban reason; if empty, user is not banned. |
| Ban Ends | Shows ban end date; if empty, ban is permanent. |
| Friends | Shows friend IDs as JSON. |

#### Monitor Users

| Name | Description |
|------|:------------|
| ID | Enter IDs to monitor, separated by `,`. |
| Monitor | Starts monitoring. |

#### Manage KKuTu DB

| Name | Description |
|------|:------------|
| Word | Enter the word to edit. |
| Fetch | Loads word information. |
| # | Splits meanings of the word. |
| Type | Enter the word type. (TODO: add details for each type) |
| Theme | Enter the word theme. |
| Meaning | Enter the word meaning. |
| Action | Add, delete, or manually input meanings. |
| Add | Adds a meaning. |
| Apply | Saves changes. |

#### Add Words to KKuTu DB

| Name | Description |
|------|:------------|
| Theme | Enter the word theme. |
| Word List | Enter words to add. |
| Confirm | Adds words to DB using the language table selected in Credentials. |

---

## Game Server

### Server Structure

- **master (`lib/Game/master.js`)**: Central process for managing slaves
- **slave (`lib/Game/slave.js`)**: Process that handles game logic

### Main Classes

| Class | File | Role |
|--------|---------------------|--------------------------|
| Room   | `lib/Game/kkutu.js` | Manages game rooms (players, game state, score) |
| Client | `lib/Game/kkutu.js` | Manages individual client connections |
| Robot  | `lib/Game/kkutu.js` | AI bot player |

### Game Modes

Game modes are located in `lib/Game/games/`.

| File | Game Mode | Description |
|----------------|:-------:|----------------|
| `classic.js`   | Basic Word Chain | Standard word-chain mode |
| `crossword.js` | Crossword | Guess proper Korean words |
| `daneo.js`     | Word Duel | Word standby/duel mode |
| `hunmin.js`    | Hunminjeongeum | Initial-consonant quiz |
| `jaqwi.js`     | Consonant Quiz | Guess initials by theme |
| `sock.js`      | SockSock | Word filtering mode |
| `typing.js`    | Typing Duel | Type given words quickly |

### Game Constants

You can configure the following in `lib/Game/const.js`:

- **Game modes**: language, rules, special rules, etc.
- **Mission letters**: mission settings
- **Injeong themes**: approved-word theme settings

---

## Web Server

(TODO)

---

## WebSocket

The client and server communicate through WebSocket.

#### Main Events (Client -> Server)

- `enter`: Enter room
- `setRoom`: Set room options
- `leave`: Leave room
- `ready`: Ready up
- `start`: Start game
- `practice`: Practice mode
- `invite`: Invite to room
- `inviteRes`: Invitation result
- `heartbeat`: Prevent Cloudflare timeout

#### Main Events (Server -> Client)

- `roundReady`: Round ready
- `turnStart`: Turn start
- `turnError`: Turn error
- `turnHint`: Turn hint
- `turnEnd`: Turn end
- `roundEnd`: Round end
- `kickVote`: Start kick vote
- `kickDeny`: Kick vote denied
- `heartbeat`: Prevent Cloudflare timeout

For detailed events, see [here](https://github.com/horyu1234/KKuTu-Protocol-Docs).

---

## Database

This project uses PostgreSQL, and main queries/configs are defined in `lib/Web/db.js`.

#### Main Contents of db.sql

- `ip_block` table: blocked IP list
- `kkutu_cw_ko` table: crossword entries
- `kkutu_en` table: English word list
- `kkutu_injeong` table: injeong request history
- `kkutu_ko` table: Korean word list
- `kkutu_manner_en` table: English manner list
- `kkutu_manner_ko` table: Korean manner list
- `kkutu_shop` table: item list
- `kkutu_shop_desc` table: item name/description list
- `session` table: active session list
- `users` table: user information

### Main Table Schemas

#### users table

Stores user account information.

| Column Name | Type | Description |
|----------------|----------|--------------------------------|
| `_id`          | VARCHAR  | Unique user ID (e.g. `discord-123456`) |
| `money`        | INTEGER  | Ping (in-game currency) |
| `kkutu`        | JSON     | Game records |
| `lastLogin`    | INTERGER | Nickname change date |
| `box`          | JSON     | Inventory |
| `equip`        | JSON     | Equipped items |
| `nickname`     | VARCHAR  | Nickname |
| `exordial`     | BIGINT   | Profile intro |
| `black`        | VARCHAR  | Ban reason; empty means not banned |
| `blockedUntil` | INTERGER | Ban expiry |
| `server`       | VARCHAR  | Current connected server |
| `password`     | VARCHAR  | (TODO) |
| `friend`       | JSON     | Friend list |

#### kkutu_en / kkutu_ko tables

Store word information.

| Column Name | Type | Description |
|---------|----------|-------|
| `_id`   | VARCHAR  | Word |
| `type`  | VARCHAR  | Word type |
| `mean`  | VARCHAR  | Meaning |
| `hit`   | INTERGER | Usage count |
| `flag`  | INTERGER | Type flag |
| `theme` | VARCHER  | Theme |

#### kkutu_injeong table

Stores injeong words.

| Column Name | Type | Description |
|-------------|----------|--------|
| `_id`       | VARCHAR  | Word |
| `theme`     | VARCHAR  | Theme |
| `createdAt` | INTERGER | Request time |
| `writer`    | VARCHAR  | Requester |

### DB Maintenance

#### Database Backup

```bash
# Full backup
pg_dump -U postgres kkutu > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup a specific table
pg_dump -U postgres -t users kkutu > backup_users.sql
```

#### Backup Restore

```bash
# Full restore
psql -U postgres kkutu < backup_20260205_120000.sql

# Restore a specific table
psql -U postgres kkutu < backup_users.sql
```

---

## API

| Path | Method | Option | Example | Notes |
|-----------------|:---:|:-------------:|-----------------------------------------------------------------------------------------------------------------------------------------------------------------|:------:|
| /shop | get | - | GET /shop -> {"goods":[{"cost":"-1","term":0,"group":"PIX","options":{},"updatedAt:null,"_id":"$WPA"} . . .]} | - |
| /servers | get | - | GET /servers -> {"list":[1],"max":400} | - |
| /box | get | - | GET /box -> {"bokjori":1,"boxB2":4} | Login required |
| /dict/"word" | get | lang - ko, en | GET /dict/사과?lang=ko -> {"word":"사과","mean":" (omitted) INJEONG,INJEONG"} | - |
| /injeong/"word" | get | theme - word theme | GET /injeong/놈놈놈?theme=MAN -> {message: "OK"} | Login required |
| /language/flush | get | - | GET /language/flush -> OK | - |
| /ranking | get | p - page | GET /ranking?p=0 -> {"page":0,"data":[{"id":"discord-1234567","rank":0,"score":"161971"} . . . ]} | - |
| /cf/"word" | get | - | GET /cf/사과 -> {"data":[{"key":"dictPage","value":1,"rate":1},{"key":"boxB4","value":1,"rate":0},{"key":"$WPC?","value":1,"rate":0.05555555555555555}],"cost":0} | - |
| /search/words | get | theme - word theme | GET /search/words?theme=gsi -> {"words":["요요","사과","가연" . . .]} | - |

---

## Notes

- If you edited a language pack, refresh by visiting `'ServerAddress'/language/flush`. (Allowed only for admin accounts or from the internal network.)
- Bots (except cheat bots) require a minimum `hit` value. To use normal bots, update `hit` in `kkutu_en`/`kkutu_ko` tables.
- When using Cloudflare, all server-client communication ports must be one of [Cloudflare supported ports](https://developers.cloudflare.com/fundamentals/reference/network-ports/).
- Discord Webhook notification was added. Enable `USE_DISCORD_WEBHOOK` and set `DISCORD_WEBHOOK_URL` in `global.json`.
- Discord Webhook notification has been verified on `node 24.13.1`.