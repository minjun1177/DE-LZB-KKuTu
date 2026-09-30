/**
 * Rule the words! KKuTu Online
 * Copyright (C) 2017 JJoriping(op@jjo.kr)
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * 십자말풀이(KCW) 판 생성기
 *
 * 8x8 맵(MAPS)의 빈칸에 사전 단어를 채워 kkutu_cw_ko 테이블에 넣는다.
 * 저장 형식은 게임(crossword.js)이 읽는 형식 그대로다: "x,y,방향,길이,단어|..." (방향 0 = 가로, 1 = 세로)
 *
 *   node lib/Game/games/cw_maker.js --help
 *   node lib/Game/games/cw_maker.js --count 10 --yes          # 10개를 만들어 확인 없이 저장
 *   node lib/Game/games/cw_maker.js --map 강아지 --dry-run     # 저장하지 않고 미리 보기
 *   node lib/Game/games/cw_maker.js --check                    # 이미 저장된 판 점검
 *
 * Docker: docker compose exec game node lib/Game/games/cw_maker.js --count 10 --yes
 */

const Const = require('../../const');
const readline = require('readline');

const BOARD_SIZE = 8;
const LANG = 'ko';
// 뜻풀이가 너무 짧거나 "= 다른말", "→ 참고" 같은 참조뿐인 단어는 문제로 쓰기 어렵다. (예전 생성기 기준 그대로)
const MEAN_FILTER = "^.{9}[^=→][^.]{15}";
// 문제로 내기 곤란한 주제 (예전 생성기 기준 그대로)
const THEME_EXCLUDE = "^(500|210|120|10)$";
const FLAG_MAX = 7;
// 부적절한 단어는 문제로 쓰지 않는다.
const BANNED_WORDS = [ "성교", "음경", "지랄", "불알", "자위", "자지", "보지", "보장지", "개새끼", "성관계", "고자", "창녀" ];

const HELP = `
십자말풀이 판 생성기

사용법: node lib/Game/games/cw_maker.js [옵션]

  -n, --count <수>       만들 판 개수 (기본 1)
  -m, --map <이름>       사용할 맵 (쉼표로 여러 개). 기본: 가장 적게 쓰인 맵부터
  -y, --yes              미리 보기 후 묻지 않고 바로 저장
      --dry-run          저장하지 않고 미리 보기만
  -t, --timeout <초>     판 하나를 만드는 제한 시간 (기본 20)
      --min-hit <수>     이 hit 이상인(자주 쓰인) 단어만 사용 (기본 0)
      --allow-reuse      다른 판에 이미 쓰인 단어도 허용
      --no-mean-filter   뜻풀이가 없는 단어도 사용 (게임에서 힌트가 비게 됩니다.
                         레포의 db.sql처럼 뜻풀이가 없는 사전으로 시험할 때만 쓰세요)
      --seed <수>        난수 시드 (같은 시드 = 같은 결과)
      --list-maps        맵 목록과 저장된 판 수 보기
      --check            저장된 판을 점검 (교차 글자, 사전·뜻풀이, 중복, 맵 모양)
  -q, --quiet            판 그림을 출력하지 않음
  -h, --help             도움말
`;

/* ---------------------------------------------------------------- 맵 정의 (queue: "x y 방향 길이" 네 자리씩) */
const MAPS = [
	{ name: "강아지",
		queue: "5003 1103 0202 6202 4303 0403 2502 3605 0213 1013 2412 3012 3512 4212 4612 6212 6612 7013 7413"
	},
	{ name: "거미줄",
		queue: "0002 4202 1302 5303 2404 0503 5502 2602 0513 1014 2314 3612 4013 5214 6513 7014"
	},
	{ name: "꼬마",
		queue: "0003 2103 0203 4304 1404 2602 6602 3704 0013 1213 2013 3414 4114 6212 6612 7314"
	},
	{ name: "나무",
		queue: "0003 5002 1202 4202 2303 6302 0402 5402 1505 0312 1013 1412 2212 3315 4212 5013 5413 6312 7113"
	},
	{ name: "달팽이",
		queue: "5002 1103 6102 0202 3202 2403 6402 0502 1602 5602 2704 0214 1112 1512 2612 3112 4213 5612 6012 6413 7114"
	},
	{ name: "닻",
		queue: "0003 5003 1203 6202 0302 5302 3403 0502 1602 4603 6702 1014 7013 3213 6212 0313 5312 4413 1512 6612"
	},
	{ name: "등불",
		queue: "0002 3004 0204 5203 4403 4603 0703 0013 1216 3013 4413 5213 6013 6413"
	},
	{ name: "로켓",
		queue: "5003 4102 3202 6202 2302 5302 0403 4402 3502 1603 3704 0114 1413 2312 3212 3513 4112 4412 5012 5312 6212 7013"
	},
	{ name: "미역",
		queue: "6002 0102 3102 1202 4204 2303 0403 4402 5503 4602 0012 1112 1413 2213 3012 4114 4612 5413 6013 7212"
	},
	{ name: "뱀",
		queue: "1003 5003 3102 4202 1303 5303 3402 0503 2603 0702 0513 1014 2512 3012 3312 4112 4413 5212 7014"
	},
	{ name: "버섯",
		queue: "1006 0102 6102 0403 5403 1602 5602 2704 0114 1012 1413 2312 2612 5312 5612 6012 6413 7114"
	},
	{ name: "버찌",
		queue: "5003 4102 1204 6302 1403 5402 0602 5602 1703 6702 0512 1612 2213 3414 4112 5012 5413 6312 6612 7014"
	},
	{ name: "번개",
		queue: "5003 4102 1204 0302 6302 3402 1503 6502 0602 5602 3703 0612 1212 1512 3214 4112 5012 5612 6314 7014"
	},
	{ name: "사슴",
		queue: "0003 5003 2102 0202 3203 2302 5302 6402 2604 5703 0013 2012 2314 3113 5014 5612 6312 7013"
	},
	{ name: "선인장",
		queue: "4002 2202 5303 0403 4503 0602 3602 6602 0213 2114 1414 4513 5014 6315 7113"
	},
	{ name: "성",
		queue: "2004 0203 5203 0402 6402 2604 0703 5703 0414 1213 2013 2612 5013 5612 6213 7414"
	},
	{ name: "소라",
		queue: "3003 5102 2202 1302 6302 0402 2503 6602 1702 4703 0413 1312 2212 2513 3013 3412 4513 5012 6113 6612 7314"
	},
	{ name: "악수",
		queue: "0102 3103 5203 1304 6402 0604 5603 3703 0012 4012 1113 3114 5112 7213 6413 0612 3612 5612"
	},
	{ name: "에스",
		queue: "2004 1102 5103 1304 4404 0603 5603 2704 0413 1113 2012 2612 4312 5012 5612 7112 7413"
	},
	{ name: "오징어",
		queue: "2004 1102 5102 1302 4303 1505 0602 2702 5703 0612 1113 1512 2012 2313 3513 4313 5012 5513 6113"
	},
	{ name: "요트",
		queue: "3003 5102 6202 2302 0403 5403 3502 0602 5602 1705 0413 1612 2312 3014 3513 5012 5612 6112 7214"
	},
	{ name: "우산",
		queue: "1005 0102 5102 6202 0304 3403 2502 5503 0703 0113 0513 1012 2513 3313 5012 5412 6112 7214"
	},
	{ name: "전화기",
		queue: "3004 1204 6302 2404 0503 5503 1702 6702 3013 6014 1113 4213 2412 5412 1513 7513"
	},
	{ name: "제기",
		queue: "0002 5103 0202 3203 1302 2403 1502 4502 0602 5603 0702 0013 0612 1212 1513 2313 3112 4214 5013 5512 7112 7512"
	},
	{ name: "쥐",
		queue: "0103 5103 2204 0302 6302 1402 5402 1602 5602 2704 0113 1012 1314 2112 2612 5112 5612 6012 6314 7113"
	},
	{ name: "집",
		queue: "2004 1102 5102 0202 6202 2404 0503 5503 1702 5702 0214 1112 2012 2414 5012 5414 6112 7214"
	},
	{ name: "채찍",
		queue: "3003 2102 4202 0303 6302 4403 0503 5602 0113 0512 1313 2113 2512 3012 4213 5013 5413 6312 6612 7113"
	},
	{ name: "클로버",
		queue: "1003 5002 0102 3102 6102 6302 0402 0602 3602 6602 1702 4703 0413 1015 1612 3012 4612 6012 6315 7113"
	},
	{ name: "토끼",
		queue: "1103 5102 3302 0403 5403 0603 5603 2704 0413 1114 2012 2612 3113 5012 5612 6114 7413"
	},
	{ name: "트럭",
		queue: "5003 3103 1203 0302 3302 6302 4403 6502 0605 0314 1212 1612 3113 3612 4314 5013 6313 7012"
	},
	{ name: "하트",
		queue: "0003 5003 2104 0402 6402 1502 5502 2604 1702 5702 0015 2012 5012 7015 1412 6412 2513 5513"
	},
	{ name: "해파리",
		queue: "3004 2102 6102 0203 1403 6402 0502 5502 2604 0212 0513 1412 2114 2612 3012 3413 5512 6012 6412 7114"
	},
	{ name: "회오리",
		queue: "1003 3102 6102 1304 6302 0402 3404 0602 3602 4703 0413 1012 1312 3012 3314 4114 4612 6312 6612 7113"
	}
];

/* ---------------------------------------------------------------- 옵션 */
function parseArgs(argv){
	var opts = { count: 1, maps: null, yes: false, dryRun: false, timeout: 20, minHit: 0, allowReuse: false, meanFilter: true, seed: null, listMaps: false, check: false, quiet: false, help: false };
	var i, a, v;
	var need = function(name){
		if(i + 1 >= argv.length) fail(`${name} 옵션에 값이 필요합니다.`);
		return argv[++i];
	};
	var num = function(name, text, min){
		var n = Number(text);

		if(!isFinite(n) || n < min) fail(`${name} 값이 올바르지 않습니다: ${text}`);
		return n;
	};

	for(i = 0; i < argv.length; i++){
		a = argv[i];
		if(a.indexOf("=") > 0 && a.startsWith("--")){
			argv.splice(i + 1, 0, a.slice(a.indexOf("=") + 1));
			a = a.slice(0, a.indexOf("="));
		}
		switch(a){
			case "-n": case "--count": opts.count = Math.floor(num(a, need(a), 1)); break;
			case "-m": case "--map": v = need(a); opts.maps = (opts.maps || []).concat(v.split(",").map(function(s){ return s.trim(); }).filter(Boolean)); break;
			case "-y": case "--yes": opts.yes = true; break;
			case "--dry-run": opts.dryRun = true; break;
			case "-t": case "--timeout": opts.timeout = num(a, need(a), 1); break;
			case "--min-hit": opts.minHit = num(a, need(a), 0); break;
			case "--allow-reuse": opts.allowReuse = true; break;
			case "--no-mean-filter": opts.meanFilter = false; break;
			case "--seed": opts.seed = Math.floor(num(a, need(a), 0)); break;
			case "--list-maps": opts.listMaps = true; break;
			case "--check": opts.check = true; break;
			case "-q": case "--quiet": opts.quiet = true; break;
			case "-h": case "--help": opts.help = true; break;
			default: fail(`알 수 없는 옵션: ${a}\n${HELP}`);
		}
	}
	return opts;
}
function fail(message){
	console.error(message);
	process.exit(1);
}

/* ---------------------------------------------------------------- 맵 */
// queue의 "xydl" 한 칸 = x, y, 방향(0 가로 / 1 세로), 길이
function parseMap(map){
	var slots = map.queue.trim().split(/\s+/).map(function(item){
		return { x: Number(item[0]), y: Number(item[1]), dir: Number(item[2]), len: Number(item[3]) };
	});
	var cellDir = {};
	var errors = [];

	slots.forEach(function(s, i){
		s.index = i;
		s.cells = [];
		if(item4(s)) errors.push(`칸 정의 오류 ${JSON.stringify(s)}`);
		for(var k = 0; k < s.len; k++){
			var x = s.x + (s.dir ? 0 : k), y = s.y + (s.dir ? k : 0);
			var key = x + "," + y;

			if(x >= BOARD_SIZE || y >= BOARD_SIZE) errors.push(`${i}번 칸이 판 밖으로 나감 (${key})`);
			if(cellDir[key + "," + s.dir] !== undefined) errors.push(`${i}번 칸이 같은 방향 칸과 겹침 (${key})`);
			cellDir[key + "," + s.dir] = i;
			s.cells.push(key);
		}
	});
	return { name: map.name, slots: slots, errors: errors };

	function item4(s){
		return [ s.x, s.y, s.dir, s.len ].some(isNaN) || s.dir > 1 || s.len < 2;
	}
}
function slotCode(s){
	return `${s.x},${s.y},${s.dir},${s.len}`;
}

/* ---------------------------------------------------------------- 난수 */
function makeRandom(seed){
	var a = (seed === null || seed === undefined) ? Math.floor(Math.random() * 4294967296) : seed >>> 0;

	// mulberry32
	return function(){
		a = (a + 0x6D2B79F5) >>> 0;
		var t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}
function shuffle(arr, random){
	for(var i = arr.length - 1; i > 0; i--){
		var j = Math.floor(random() * (i + 1));
		var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
	}
	return arr;
}

/* ---------------------------------------------------------------- 단어 색인 */
// 길이별로 단어를 모으고, (위치, 글자)마다 해당 단어 번호 목록을 만든다. 패턴 검색은 이 목록들의 교집합이다.
function WordIndex(rows){
	var my = this;

	my.byLen = {};
	rows.forEach(function(row){
		var w = row._id, len = w.length;
		var b = my.byLen[len] || (my.byLen[len] = { words: [], hits: [], all: [], pos: [] });
		var idx = b.words.length;

		b.words.push(w);
		b.hits.push(Number(row.hit) || 0);
		b.all.push(idx);
		for(var k = 0; k < len; k++){
			var p = b.pos[k] || (b.pos[k] = {});
			(p[w[k]] || (p[w[k]] = [])).push(idx);
		}
	});
	my.size = rows.length;
}
// pattern: 글자 또는 null 배열. 반환: 단어 번호 배열 (정렬되어 있음)
WordIndex.prototype.match = function(pattern){
	var b = this.byLen[pattern.length];
	var lists = [], k, list, res, i, j;

	if(!b) return [];
	for(k = 0; k < pattern.length; k++){
		if(pattern[k] === null) continue;
		list = b.pos[k] && b.pos[k][pattern[k]];
		if(!list) return [];
		lists.push(list);
	}
	if(!lists.length) return b.all;
	lists.sort(function(p, q){ return p.length - q.length; });
	res = lists[0];
	for(k = 1; k < lists.length && res.length; k++){
		list = lists[k];
		var out = [];
		for(i = 0, j = 0; i < res.length && j < list.length;){
			if(res[i] === list[j]){ out.push(res[i]); i++; j++; }
			else if(res[i] < list[j]) i++;
			else j++;
		}
		res = out;
	}
	return res;
};
WordIndex.prototype.word = function(len, idx){ return this.byLen[len].words[idx]; };
WordIndex.prototype.hit = function(len, idx){ return this.byLen[len].hits[idx]; };

/* ---------------------------------------------------------------- 풀이 */
// 백트래킹: 매번 후보가 가장 적은 칸을 먼저 채우고(MRV), 어떤 칸의 후보가 0이 되면 되돌아간다.
function solve(map, index, blocked, opts, random){
	var slots = map.slots;
	var grid = {};
	var assigned = new Array(slots.length);
	var used = new Set();
	var deadline = Date.now() + opts.timeout * 1000;
	var nodes = 0;
	var aborted = false;
	var MAX_TRY_PER_SLOT = 40;

	function pattern(s){
		return s.cells.map(function(key){ return grid[key] || null; });
	}
	function available(len, list){
		return list.filter(function(idx){
			var w = index.word(len, idx);
			return !used.has(w) && !blocked.has(w);
		});
	}
	// 후보가 많은 칸은 개수만 비교하면 되므로 거르지 않고, 적을 때만 이미 쓴·제외 단어를 걸러 정확히 센다.
	function candidates(s, exact){
		var list = index.match(pattern(s));

		return (exact || list.length <= 200) ? available(s.len, list) : list;
	}
	function order(s, list){
		// 자주 쓰인 단어(hit > 0)를 먼저, 같은 무리 안에서는 무작위로
		var common = [], rare = [];

		list.forEach(function(idx){ (index.hit(s.len, idx) > 0 ? common : rare).push(idx); });
		return shuffle(common, random).concat(shuffle(rare, random));
	}
	function place(s, w){
		var set = [];

		s.cells.forEach(function(key, k){
			if(!grid[key]){ grid[key] = w[k]; set.push(key); }
		});
		assigned[s.index] = w;
		used.add(w);
		return set;
	}
	function unplace(s, w, set){
		set.forEach(function(key){ delete grid[key]; });
		assigned[s.index] = undefined;
		used.delete(w);
	}
	function step(){
		var best = null, bestList = null, i, s, list;

		if(++nodes % 64 == 0 && Date.now() > deadline){ aborted = true; return false; }
		for(i = 0; i < slots.length; i++){
			s = slots[i];
			if(assigned[i]) continue;
			list = candidates(s);
			if(!list.length) return false;
			if(!best || list.length < bestList.length){ best = s; bestList = list; }
		}
		if(!best) return true;
		if(bestList.length > 200){
			bestList = available(best.len, bestList);
			if(!bestList.length) return false;
		}

		var tries = order(best, bestList).slice(0, MAX_TRY_PER_SLOT);
		for(i = 0; i < tries.length; i++){
			var w = index.word(best.len, tries[i]);
			var set = place(best, w);

			if(step()) return true;
			unplace(best, w, set);
			if(aborted) return false;
		}
		return false;
	}
	var ok = step();

	return { ok: ok, aborted: aborted, nodes: nodes, words: assigned.slice(), grid: grid };
}

/* ---------------------------------------------------------------- 검증·출력 */
// 뜻풀이의 번호 표시(＂1＂［1］（1）)와 답 단어를 빼고도 글자가 남아야 힌트로 쓸 수 있다.
function stripMarks(mean){
	return String(mean || "").replace(/＂\d+＂|［\d+］|（\d+）/g, "");
}
function hasMeaning(mean, word){
	return stripMarks(mean).split(word).join("").trim().length > 0;
}
function encodeBoard(map, words){
	return map.slots.map(function(s, i){ return slotCode(s) + "," + words[i]; }).join("|");
}
// 저장 형식 문자열을 맵과 사전으로 점검한다. 오류 목록을 돌려준다. (뜻풀이가 없는 단어는 noMean에 모은다)
function validateBoard(mapDef, data, meanOf, noMean){
	var errors = [];
	var items = String(data || "").split("|").map(function(item){ return item.split(","); });
	var grid = {};
	var seen = {};

	if(mapDef){
		var expected = mapDef.slots.map(slotCode).sort().join("|");
		var actual = items.map(function(it){ return it.slice(0, 4).join(","); }).sort().join("|");
		if(expected != actual) errors.push("맵 칸 배치와 다름");
	}
	items.forEach(function(it){
		if(it.length != 5){ errors.push(`형식 오류: ${it.join(",")}`); return; }
		var x = Number(it[0]), y = Number(it[1]), dir = Number(it[2]), len = Number(it[3]), w = it[4];

		if(w.length != len) errors.push(`길이 불일치: ${w} (${len})`);
		if(seen[w]) errors.push(`판 안에서 중복: ${w}`);
		seen[w] = true;
		for(var k = 0; k < w.length; k++){
			var key = (x + (dir == 1 ? 0 : k)) + "," + (y + (dir == 1 ? k : 0));
			if(grid[key] && grid[key] != w[k]) errors.push(`교차 글자 불일치 (${key}: ${grid[key]}/${w[k]})`);
			grid[key] = w[k];
		}
		if(meanOf){
			var mean = meanOf[w];
			if(mean === undefined) errors.push(`사전에 없음: ${w}`);
			else if(!hasMeaning(mean, w) && noMean) noMean.push(w);
		}
	});
	return errors;
}
function drawBoard(map, words){
	var grid = {};
	var y, x, line, out = [ "   " + [ 0, 1, 2, 3, 4, 5, 6, 7 ].join(" ") ];

	map.slots.forEach(function(s, i){
		s.cells.forEach(function(key, k){ grid[key] = words[i][k]; });
	});
	for(y = 0; y < BOARD_SIZE; y++){
		line = y + " ";
		for(x = 0; x < BOARD_SIZE; x++) line += grid[x + "," + y] || "　";
		out.push(line);
	}
	return out.join("\n");
}
function clip(text, len){
	text = String(text || "").replace(/\s+/g, " ");
	return text.length > len ? text.slice(0, len - 1) + "…" : text;
}

/* ---------------------------------------------------------------- DB */
function query(Pg, sql, params){
	return new Promise(function(resolve, reject){
		Pg.query(sql, params || [], function(err, res){
			if(err) reject(err);
			else resolve(res.rows);
		});
	});
}
function loadWords(Pg, opts){
	return query(Pg, `SELECT _id, hit FROM kkutu_${LANG}
		WHERE char_length(_id) BETWEEN 2 AND $1
		AND _id ~ '^[가-힣]+$'
		AND flag <= $2
		AND type ~ $3
		AND NOT (theme ~ $4)
		AND hit >= $5
		${opts.meanFilter ? "AND mean ~ $6" : ""}`, [ BOARD_SIZE, FLAG_MAX, Const.KOR_GROUP.source, THEME_EXCLUDE, opts.minHit ].concat(opts.meanFilter ? [ MEAN_FILTER ] : []));
}
function countMeanings(Pg){
	return query(Pg, `SELECT count(*) AS n FROM kkutu_${LANG} WHERE mean ~ $1`, [ MEAN_FILTER ]).then(function(rows){ return Number(rows[0].n); });
}
function loadBoards(Pg){
	return query(Pg, `SELECT _id, map, data FROM kkutu_cw_${LANG} ORDER BY _id`);
}
function loadMeans(Pg, words){
	if(!words.length) return Promise.resolve({});
	return query(Pg, `SELECT _id, mean FROM kkutu_${LANG} WHERE _id = ANY($1)`, [ words ]).then(function(rows){
		var R = {};
		rows.forEach(function(row){ R[row._id] = row.mean; });
		return R;
	});
}
function insertBoard(Pg, mapName, data){
	return query(Pg, `INSERT INTO kkutu_cw_${LANG} (map, data) VALUES ($1, $2) RETURNING _id`, [ mapName, data ]).then(function(rows){ return rows[0]._id; });
}

/* ---------------------------------------------------------------- 실행 */
function ask(question){
	var rl = readline.createInterface({ input: process.stdin, output: process.stdout });

	return new Promise(function(resolve){
		rl.question(question, function(answer){
			rl.close();
			resolve(String(answer || "").trim().toLowerCase());
		});
	});
}
async function runCheck(Pg, mapDefs){
	var boards = await loadBoards(Pg);
	var words = new Set();
	var bad = 0;
	var usage = {};

	boards.forEach(function(b){
		String(b.data || "").split("|").forEach(function(item){ words.add(item.split(",")[4]); });
	});
	var meanOf = await loadMeans(Pg, Array.from(words).filter(Boolean));

	var noMeanBoards = [];

	boards.forEach(function(b){
		var mapDef = mapDefs[b.map];
		var noMean = [];
		var errors = validateBoard(mapDef, b.data, meanOf, noMean);

		usage[b.map] = (usage[b.map] || 0) + 1;
		if(!mapDef) errors.unshift(`알 수 없는 맵: ${b.map}`);
		if(errors.length){
			bad++;
			console.log(`#${b._id} [${b.map}] ${errors.join(" / ")}`);
		}
		if(noMean.length) noMeanBoards.push({ id: b._id, words: noMean });
	});
	console.log(`\n저장된 판 ${boards.length}개 중 구조·사전 오류가 있는 판 ${bad}개`);
	if(bad) console.log("오류가 있는 판은 게임에서 답이 어긋나거나 문제가 빠질 수 있습니다. 확인 후 DELETE FROM kkutu_cw_ko WHERE _id IN (...) 로 지우세요.");
	if(noMeanBoards.length){
		console.log(`뜻풀이가 없는 단어가 들어 있는 판 ${noMeanBoards.length}개 (게임에서 해당 문제의 힌트가 비어 보입니다)`);
		if(noMeanBoards.length == boards.length) console.log("  → 모든 판이 해당됩니다. 사전(kkutu_ko)에 뜻풀이가 들어 있지 않은 것 같습니다. (레포의 db.sql은 뜻풀이가 비어 있습니다)");
		else noMeanBoards.slice(0, 20).forEach(function(item){ console.log(`  #${item.id}: ${item.words.join(", ")}`); });
	}
	return bad ? 2 : 0;
}
async function runGenerate(Pg, mapDefs, opts){
	var random = makeRandom(opts.seed);
	var boards = await loadBoards(Pg);
	var usage = {};
	var blocked = new Set(BANNED_WORDS);
	var names = Object.keys(mapDefs);
	var saved = 0, made = 0, failed = 0;
	var started = Date.now();

	names.forEach(function(n){ usage[n] = 0; });
	boards.forEach(function(b){
		usage[b.map] = (usage[b.map] || 0) + 1;
		if(!opts.allowReuse) String(b.data || "").split("|").forEach(function(item){ var w = item.split(",")[4]; if(w) blocked.add(w); });
	});
	if(opts.maps){
		opts.maps.forEach(function(n){ if(!mapDefs[n]) fail(`알 수 없는 맵: ${n} (--list-maps 로 목록 확인)`); });
		names = opts.maps;
	}

	console.log("사전 단어를 불러오는 중...");
	var index = new WordIndex(await loadWords(Pg, opts));
	console.log(`후보 단어 ${index.size}개, 제외 단어 ${blocked.size}개 (${((Date.now() - started) / 1000).toFixed(1)}초)`);
	if(!opts.meanFilter) console.log("주의: --no-mean-filter 로 만든 판은 뜻풀이가 없는 단어가 들어가 게임에서 힌트가 비어 보일 수 있습니다.");
	if(index.size < 1000){
		if(opts.meanFilter && await countMeanings(Pg) == 0){
			console.log("사전(kkutu_ko)에 뜻풀이가 있는 단어가 없습니다. 레포의 db.sql은 뜻풀이가 비어 있어 문제(힌트)를 만들 수 없습니다.");
			console.log("뜻풀이가 들어 있는 사전을 넣은 뒤 다시 실행하세요. 시험용으로는 --no-mean-filter 를 붙이면 됩니다.");
			return 1;
		}
		if(!index.size){
			console.log("조건에 맞는 단어가 없습니다. --min-hit 값을 낮추거나 --allow-reuse 를 붙여 보세요.");
			return 1;
		}
	}

	for(var n = 0; n < opts.count; n++){
		// 가장 적게 쓰인 맵부터 (같으면 무작위)
		var mapName = shuffle(names.slice(), random).sort(function(a, b){ return usage[a] - usage[b]; })[0];
		var map = mapDefs[mapName];
		var t0 = Date.now();
		var result = solve(map, index, blocked, opts, random);
		var secs = ((Date.now() - t0) / 1000).toFixed(1);

		if(!result.ok){
			failed++;
			console.log(`\n[${n + 1}/${opts.count}] ${mapName}: 실패 (${result.aborted ? "시간 초과" : "가능한 조합 없음"}, ${secs}초, 탐색 ${result.nodes})`);
			// 같은 맵만 계속 실패하지 않도록 다음에는 다른 맵이 뽑히게 한다.
			usage[mapName] += 0.5;
			continue;
		}
		made++;
		// 이번 실행에서 만든 판도 셈에 넣어 여러 개를 만들 때 맵이 고르게 쓰이게 한다.
		usage[mapName]++;
		var data = encodeBoard(map, result.words);
		var meanOf = await loadMeans(Pg, result.words);
		var noMean = [];
		var errors = validateBoard(map, data, meanOf, noMean);

		if(opts.meanFilter && noMean.length) errors.push(`뜻풀이 없음: ${noMean.join(", ")}`);

		console.log(`\n[${n + 1}/${opts.count}] ${mapName} (${secs}초, 탐색 ${result.nodes})`);
		if(!opts.quiet){
			console.log(drawBoard(map, result.words));
			map.slots.forEach(function(s, i){
				var w = result.words[i];
				console.log(`  ${s.dir ? "세로" : "가로"} (${s.x},${s.y}) ${w}: ${hasMeaning(meanOf[w], w) ? clip(stripMarks(meanOf[w]).split(w).join("★"), 50) : "(뜻풀이 없음)"}`);
			});
		}
		if(errors.length){
			failed++;
			console.log("  검증 실패: " + errors.join(" / "));
			continue;
		}
		var save = opts.yes && !opts.dryRun;

		if(!opts.dryRun && !opts.yes){
			var answer = await ask("저장할까요? (y = 저장 / n = 건너뛰기 / q = 끝내기) ");
			if(answer == "q") break;
			save = answer == "y";
		}
		if(save){
			var id = await insertBoard(Pg, mapName, data);
			saved++;
			result.words.forEach(function(w){ blocked.add(w); });
			console.log(`  저장됨 #${id}`);
		}else{
			// 저장하지 않은 판의 단어는 이번 실행에서 다시 쓰지 않아 다른 판이 나오게 한다.
			result.words.forEach(function(w){ blocked.add(w); });
		}
	}
	console.log(`\n완료: 생성 ${made}개, 저장 ${saved}개, 실패 ${failed}개${opts.dryRun ? " (--dry-run: 저장 안 함)" : ""}`);
	return failed && !made ? 1 : 0;
}
async function main(Pg, mapDefs, opts){
	if(opts.listMaps){
		var usage = {};
		(await loadBoards(Pg)).forEach(function(b){ usage[b.map] = (usage[b.map] || 0) + 1; });
		Object.keys(mapDefs).forEach(function(n){
			console.log(`${n}\t칸 ${mapDefs[n].slots.length}개\t저장된 판 ${usage[n] || 0}개`);
		});
		return 0;
	}
	if(opts.check) return runCheck(Pg, mapDefs);
	return runGenerate(Pg, mapDefs, opts);
}

(function(){
	var opts = parseArgs(process.argv.slice(2));
	var mapDefs = {};
	var DB;

	if(opts.help){
		console.log(HELP);
		process.exit(0);
	}
	MAPS.forEach(function(m){
		var def = parseMap(m);

		if(def.errors.length){
			console.warn(`맵 ${m.name}을(를) 건너뜁니다: ${def.errors.join(", ")}`);
			return;
		}
		mapDefs[m.name] = def;
	});
	if(!opts.dryRun && !opts.yes && !opts.check && !opts.listMaps && !process.stdin.isTTY){
		console.log("입력 창이 없는 환경이라 저장 여부를 물을 수 없어 --dry-run 으로 실행합니다. 저장하려면 --yes 를 붙이세요.");
		opts.dryRun = true;
	}
	DB = require('../../Web/db');
	DB.ready = function(Redis, Pg){
		main(Pg, mapDefs, opts).then(function(code){
			process.exit(code);
		}, function(err){
			console.error(err && err.stack || err);
			process.exit(1);
		});
	};
})();
