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

var Const = require('../../const');
var Lizard = require('../../sub/lizard');
var DB;
var DIC;

const ROBOT_START_DELAY = [ 1200, 800, 400, 200, 0 ]; // 로봇이 생각하는데 걸리는 시간?
const ROBOT_TYPE_COEF = [ 1250, 750, 500, 250, 0 ]; // 로봇이 타자를 치는데 걸리는 시간 계수?
const ROBOT_THINK_COEF = [ 4, 2, 1, 0, 0 ]; // 로봇이 단어를 생각하는데 걸리는 시간 계수?
const ROBOT_HIT_LIMIT = [ 0, 0, 0, 0, 0 ]; // 로봇이 단어를 선택할 때 최소 히트수?
const ROBOT_LENGTH_LIMIT = [ 3, 4, 9, 99, 99 ]; // 로봇의 최대 단어 길이?
const ROBOT_LENGTH_RANGES = [ 
    [3, 4],
    [4, 6],
    [5, 8],
    [6, 10],
    [8, 15]
] // 로봇의 비사전 단어 길이 범위

const RIEUL_TO_NIEUN = [4449, 4450, 4457, 4460, 4462, 4467]; // ㄹ->ㄴ 변환 가능한 자음
const RIEUL_TO_IEUNG = [4451, 4455, 4456, 4461, 4466, 4469]; // ㄹ->ㅇ 변환 가능한 자음
const NIEUN_TO_IEUNG = [4455, 4461, 4466, 4469]; // ㄴ->ㅇ 변환 가능한 자음
const KO_MORSE = {".-..":"ㄱ", "..-.":"ㄴ", "-...":"ㄷ", "...-":"ㄹ", "--":"ㅁ", ".--":"ㅂ", "--.":"ㅅ", "-.-":"ㅇ", ".--.":"ㅈ", "-.-.":"ㅊ", "-..-":"ㅋ", "--..":"ㅌ", "---":"ㅍ", ".---":"ㅎ", ".":"ㅏ", "..":"ㅑ", "-":"ㅓ", "...":"ㅕ", ".-":"ㅗ", "-.":"ㅛ", "....":"ㅜ", ".-.":"ㅠ", "-..":"ㅡ", "..-":"ㅣ", "--.-":"ㅐ", "-.--":"ㅔ" };
const EN_MORSE = { ".-": "a", "-...": "b", "-.-.": "c", "-..": "d", ".": "e", "..-.": "f", "--.": "g", "....": "h", "..": "i", ".---": "j", "-.-": "k", ".-..": "l", "--": "m", "-.": "n", "---": "o", ".--.": "p", "--.-": "q", ".-.": "r", "...": "s", "-": "t", "..-": "u", "...-": "v", ".--": "w", "-..-": "x", "-.--": "y", "--..": "z" };
const HANGUL_INITIAL_INDEX = { "ㄱ":0, "ㄲ":1, "ㄴ":2, "ㄷ":3, "ㄸ":4, "ㄹ":5, "ㅁ":6, "ㅂ":7, "ㅃ":8, "ㅅ":9, "ㅆ":10, "ㅇ":11, "ㅈ":12, "ㅉ":13, "ㅊ":14, "ㅋ":15, "ㅌ":16, "ㅍ":17, "ㅎ":18 };
const HANGUL_INITIAL_COMBINE = { "ㄱㄱ":"ㄲ", "ㄷㄷ":"ㄸ", "ㅂㅂ":"ㅃ", "ㅅㅅ":"ㅆ", "ㅈㅈ":"ㅉ" };
const HANGUL_MEDIAL_INDEX = { "ㅏ":0, "ㅐ":1, "ㅑ":2, "ㅒ":3, "ㅓ":4, "ㅔ":5, "ㅕ":6, "ㅖ":7, "ㅗ":8, "ㅘ":9, "ㅙ":10, "ㅚ":11, "ㅛ":12, "ㅜ":13, "ㅝ":14, "ㅞ":15, "ㅟ":16, "ㅠ":17, "ㅡ":18, "ㅢ":19, "ㅣ":20 };
const HANGUL_MEDIAL_COMBINE = { "ㅗㅏ":"ㅘ", "ㅗㅐ":"ㅙ", "ㅗㅣ":"ㅚ", "ㅜㅓ":"ㅝ", "ㅜㅔ":"ㅞ", "ㅜㅣ":"ㅟ", "ㅡㅣ":"ㅢ" };
const HANGUL_FINAL_INDEX = { "":0, "ㄱ":1, "ㄲ":2, "ㄳ":3, "ㄴ":4, "ㄵ":5, "ㄶ":6, "ㄷ":7, "ㄹ":8, "ㄺ":9, "ㄻ":10, "ㄼ":11, "ㄽ":12, "ㄾ":13, "ㄿ":14, "ㅀ":15, "ㅁ":16, "ㅂ":17, "ㅄ":18, "ㅅ":19, "ㅆ":20, "ㅇ":21, "ㅈ":22, "ㅊ":23, "ㅋ":24, "ㅌ":25, "ㅍ":26, "ㅎ":27 };
const HANGUL_FINAL_COMBINE = { "ㄱㅅ":"ㄳ", "ㄴㅈ":"ㄵ", "ㄴㅎ":"ㄶ", "ㄹㄱ":"ㄺ", "ㄹㅁ":"ㄻ", "ㄹㅂ":"ㄼ", "ㄹㅅ":"ㄽ", "ㄹㅌ":"ㄾ", "ㄹㅍ":"ㄿ", "ㄹㅎ":"ㅀ", "ㅂㅅ":"ㅄ", "ㄱㄱ":"ㄲ", "ㅅㅅ":"ㅆ" };

const HANGUL_SUNGUI = ["ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ", "ㅏ", "ㅑ", "ㅓ", "ㅕ", "ㅗ", "ㅛ", "ㅜ", "ㅠ", "ㅡ", "ㅣ", "ㄲ", "ㄸ", "ㅃ", "ㅆ", "ㅉ", "ㅐ", "ㅒ", "ㅔ", "ㅖ", "ㅘ", "ㅙ", "ㅚ", "ㅝ", "ㅞ", "ㅟ", "ㅢ", "ㄳ", "ㄵ", "ㄶ", "ㄺ", "ㄻ", "ㄼ", "ㄽ", "ㄾ", "ㄿ", "ㅀ", "ㅄ"];

const EN_PHONETIC = { "alpha":"a", "bravo":"b", "charlie":"c", "delta":"d", "echo":"e", "foxtrot":"f", "golf":"g", "hotel":"h", "india":"i", "juliett":"j", "kilo":"k", "lima":"l", "mike":"m", "november":"n", "oscar":"o", "papa":"p", "quebec":"q", "romeo":"r", "sierra":"s", "tango":"t", "uniform":"u", "victor":"v", "whiskey":"w", "x-ray":"x", "yankee":"y", "zulu":"z" };
const KO_PHONETIC = { "기러기":"ㄱ", "나포리":"ㄴ", "도라지":"ㄷ", "로오마":"ㄹ", "미나리":"ㅁ", "바가지":"ㅂ", "서울":"ㅅ", "잉어":"ㅇ", "지게":"ㅈ", "치마":"ㅊ", "키다리":"ㅋ", "통신":"ㅌ", "파고다":"ㅍ", "한강":"ㅎ", "아버지":"ㅏ", "야자수":"ㅑ", "어머니":"ㅓ", "연못":"ㅕ", "오징어":"ㅗ", "요지경":"ㅛ", "우편":"ㅜ", "유달산":"ㅠ", "은방울":"ㅡ", "이순신":"ㅣ", "앵무새":"ㅐ", "엑스레이":"ㅔ" };

var ONLYLONG_MIN = 7 // onlylong
var ONLYSHORT_MAX = 5 // onlyshort

exports.init = function(_DB, _DIC){
	DB = _DB;
	DIC = _DIC;
};
exports.getTitle = function(){
	var R = new Lizard.Tail();
	var my = this;
	var l = my.rule;
	var EXAMPLE;
	var eng, ja;
	
	if(!l){
		R.go("undefinedd");
		return R;
	}
	if(!l.lang){
		R.go("undefinedd");
		return R;
	}
	EXAMPLE = Const.EXAMPLE_TITLE[l.lang];
	my.game.dic = {};
	
	switch(Const.GAME_TYPE[my.mode]){
		case 'EKT':
		case 'ESH':
			eng = "^" + String.fromCharCode(97 + Math.floor(Math.random() * 26));
			break;
		case 'KKT':
			my.game.wordLength = 3;
		case 'KSH':
			ja = 44032 + 588 * Math.floor(Math.random() * 18);
			eng = "^[\\u" + ja.toString(16) + "-\\u" + (ja + 587).toString(16) + "]";
			break;
		case 'KAP':
			ja = 44032 + 588 * Math.floor(Math.random() * 18);
			eng = "[\\u" + ja.toString(16) + "-\\u" + (ja + 587).toString(16) + "]$";
			break;
	}
	function tryTitle(h){
		if(h > 50){
			R.go(EXAMPLE);
			return;
		}
		DB.kkutu[l.lang].find(
			[ '_id', new RegExp(eng + ".{" + Math.max(1, my.round - 1) + "}$") ],
			// [ 'hit', { '$lte': h } ],
			(l.lang == "ko") ? [ 'type', Const.KOR_GROUP ] : [ '_id', Const.ENG_ID ]
			// '$where', eng+"this._id.length == " + Math.max(2, my.round) + " && this.hit <= " + h
		).limit(20).on(function($md){
			var list;
			
			if($md.length){
				list = shuffle($md);
				checkTitle(list.shift()._id).then(onChecked);
			
				function onChecked(v){
					if(v) R.go(v);
					else if(list.length) checkTitle(list.shift()._id).then(onChecked);
					else R.go(EXAMPLE);
				}
			}else{
				tryTitle(h + 10);
			}
		});
	}
	function checkTitle(title){
		var R = new Lizard.Tail();
		var i, list = [];
		var len;
		
		/* ���ϰ� �ʹ� �ɸ��ٸ� �ּ��� Ǯ��. <-- ? 아마도 부하가 걸리면 주석을 풀자로 기억
		R.go(true);
		return R;
		*/
		if(title == null){
			R.go(EXAMPLE);
		}else{
			len = title.length;
			for(i=0; i<len; i++) list.push(getAuto.call(my, title[i], getSubChar.call(my, title[i]), 1));
			
			Lizard.all(list).then(function(res){
				for(i in res) if(!res[i]) return R.go(EXAMPLE);
				
				return R.go(title);
			});
		}
		return R;
	}
	tryTitle(10);
	
	return R;
};
exports.roundReady = function(){
	var my = this;
	if(!my.game.title) return;
	
	clearTimeout(my.game.turnTimer);
	my.game.round++;
	my.game.roundTime = my.time * 1000;
	if(my.game.round <= my.round){
		my.game.char = my.game.title[my.game.round - 1];
		my.game.subChar = getSubChar.call(my, my.game.char);
		my.game.chain = [];
		// if(my.opts.mission) my.game.mission = getMission(my.rule.lang, my.opts.ezm);
		// if(my.opts.EasyMission) my.game.mission = getMission(my.rule.lang, true);
		if (my.opts.mission) my.game.mission = getMission(my.rule.lang, my.opts.easymission, my.opts.mission);
		if(my.opts.sami) my.game.wordLength = 2;
		
		my.byMaster('roundReady', {
			round: my.game.round,
			char: my.game.char,
			subChar: my.game.subChar,
			mission: my.game.mission
		}, true);
		my.game.turnTimer = setTimeout(my.turnStart, 2400);
	}else{
		my.roundEnd();
	}
};
exports.turnStart = function(force){
	var my = this;
	var speed;
	var si;
	
	if(!my.game.chain) return;
	my.game.roundTime = Math.min(my.game.roundTime, Math.max(10000, 150000 - my.game.chain.length * 1500));
	speed = my.getTurnSpeed(my.game.roundTime);
	clearTimeout(my.game.turnTimer);
	clearTimeout(my.game.robotTimer);
	my.game.late = false;
	my.game.turnTime = 15000 - 1400 * speed;
	my.game.turnAt = (new Date()).getTime();
	if(my.opts.sami) my.game.wordLength = (my.game.wordLength == 3) ? 2 : 3;
	
	my.byMaster('turnStart', {
		turn: my.game.turn,
		char: my.game.char,
		subChar: my.game.subChar,
		speed: speed,
		roundTime: my.game.roundTime,
		turnTime: my.game.turnTime,
		mission: my.game.mission,
		wordLength: my.game.wordLength,
		seq: force ? my.game.seq : undefined
	}, true);
	my.game.turnTimer = setTimeout(my.turnEnd, Math.min(my.game.roundTime, my.game.turnTime + 100));
	if(si = my.game.seq[my.game.turn]) if(si.robot){
		si._done = [];
		my.readyRobot(si);
	}
};
exports.turnEnd = function(){
	var my = this;
	var target;
	var score;
	
	if(!my.game.seq) return;
	target = DIC[my.game.seq[my.game.turn]] || my.game.seq[my.game.turn];
	
	if(my.game.loading){
		my.game.turnTimer = setTimeout(my.turnEnd, 100);
		return;
	}
	my.game.late = true;
	if(target) if(target.game){
		score = Const.getPenalty(my.game.chain, target.game.score);
		target.game.score += score;
	}
	getAuto.call(my, my.game.char, my.game.subChar, 0).then(function(w){
		my.byMaster('turnEnd', {
			ok: false,
			target: target ? target.id : null,
			score: score,
			hint: w
		}, true);
		my.game._rrt = setTimeout(my.roundReady, 3000);
	});
	clearTimeout(my.game.robotTimer);
};
exports.submit = function(client, text){
	var score, l, t;
	var my = this;
	var tv = (new Date()).getTime();
	var mgt = my.game.seq[my.game.turn];
	var originalText = text;
	var morseDecoded;
	var morseMap;
	var composedText;
	
	if(!mgt) return;
	if(!mgt.robot) if(mgt != client.id) return;
	if(!my.game.char) return;
	
	if(my.opts.phonetic && !my.opts.morse && !client.robot){ // LZB - Added Phonetic
		var phoneticDecoded = decodePhoneticInput(text, my.rule.lang == "ko" ? KO_PHONETIC : EN_PHONETIC);
		if(!phoneticDecoded) return client.publish('turnError', { code: 459, value: escapeHTML(originalText) }, true);
		if(my.rule.lang == "ko") {
			var composed = composeHangulInput(phoneticDecoded);
			if(composed) text = composed;
			else text = phoneticDecoded;
		}
		else if(phoneticDecoded) text = phoneticDecoded;
	}

	if(my.opts.morse && (my.rule.lang == "ko" || my.rule.lang == "en")){ // LZB - Added Morse

		morseMap = my.rule.lang == "ko" ? KO_MORSE : EN_MORSE;
		morseDecoded = decodeMorseInput(text, morseMap);
		if(morseDecoded){
			if(my.rule.lang == "ko"){
				composedText = composeHangulInput(morseDecoded);
				text = composedText || morseDecoded;
			}else{
				text = morseDecoded;
			}
		}
		else if(!client.robot) return client.publish('turnError', { code: 488, value: escapeHTML(originalText) }, true);
	}else if(my.rule.lang == "ko"){
		composedText = composeHangulInput(text);
		if(composedText) text = composedText;
	}

	if(my.opts.muuu && !client.robot){
		/**
		 * 머 to 대
		 * 대 to 머
		 */
		text = text.replace(/[머대]/g, function(match) {
			if (match === '머') return '대';
			if (match === '대') return '머';
		});
	}

	var textlength = text.length;

	if(my.opts.onlylong) if(textlength < ONLYLONG_MIN && !client.robot) return client.publish('turnError', { code: 410, value: escapeHTML(originalText) }, true); // onlylong
	if(my.opts.onlyshort && !my.opts.onlylong) if(textlength > ONLYSHORT_MAX && !client.robot) return client.publish('turnError', { code: 411, value: escapeHTML(originalText) }, true); // onlyshort

	if(!isChainable(text, my.mode, my.game.char, my.game.subChar)) return client.chat(escapeHTML(originalText));
	if(my.game.chain.indexOf(text) != -1) return client.publish('turnError', { code: 409, value: escapeHTML(text) }, true);
	
	l = my.rule.lang;
	my.game.loading = true;
	function onDB($doc){
		if(!my.game.chain) return;
		var preChar = getChar.call(my, text);
		var preSubChar = getSubChar.call(my, preChar);
		var firstMove = my.game.chain.length < 1; // my.game.chain.length는 체인 횟수인듯
		
		function preApproved(){
			function approved(){
				if(my.game.late) return;
				if(!my.game.chain) return;
				if(!my.game.dic) return;
				
				my.game.loading = false;
				my.game.late = true;
				clearTimeout(my.game.turnTimer);
				t = tv - my.game.turnAt;
				score = my.getScore(text, t);
				my.game.dic[text] = (my.game.dic[text] || 0) + 1;
				my.game.chain.push(text);
				my.game.roundTime -= t;
				my.game.char = preChar;
				my.game.subChar = preSubChar;
				client.game.score += score;
				
				var mean, theme, wc, baby;
				if($doc){
					mean = $doc.mean;
					theme = $doc.theme;
					wc = $doc.type;
					baby = $doc.baby;
				}
				
				client.publish('turnEnd', {
					ok: true,
					value: escapeHTML(text),
					mean: mean,
					theme: theme,
					wc: wc,
					score: score,
					bonus: (my.game.mission === true) ? score - my.getScore(text, t, true) : 0,
					baby: baby
				}, true);
				if(my.game.mission === true){
					my.game.mission = getMission(my.rule.lang, my.opts.easymission, my.opts.mission);
				}
				setTimeout(my.turnNext, my.game.turnTime / 6);
				if(!client.robot){
					client.invokeWordPiece(text, 1);
					if($doc && !$doc._nickname) DB.kkutu[l].update([ '_id', text ]).set([ 'hit', $doc.hit + 1 ]).on();
				}
			}
			// 첫턴 혹은 매너, 비사전 아님 lzb - 모를땐 기능이라 우기면 됨
			if(firstMove || my.opts.manner) getAuto.call(my, preChar, preSubChar, 1).then(function(w){
				if(w) approved();
				else{
					my.game.loading = false;
					client.publish('turnError', { code: firstMove ? 402 : 403, value: escapeHTML(text) }, true);
					if(client.robot){
						my.readyRobot(client);
					}
				}
			});
			else approved();
		}
		function denied(code){
			my.game.loading = false;
			client.publish('turnError', { code: code || 404, value: escapeHTML(text) }, true);
		}
		function handleUnknown(){
			if(my.opts.nonoinjeong){
				denied(412);
			}else if(my.opts.unknown || my.opts.ggangganunknown){
				if(text.length < 2){
					denied();
				}else{
					$doc = {
						mean: "Non-dictionary word",
						theme: "",
						type: "unknown",
						hit: 0,
						baby: false,
						flag: 0
					};
					preApproved();
				}
			}else if(my.rule.lang == "ko" && isUnknownLowEffortWord(text)){
				denied(413);
			}else{
				denied();
			}
		}
		function handleNickname(){
			if(!my.opts.nicknam) return handleUnknown();
			DB.users.findOne([ 'nickname', text ]).limit([ 'nickname', true ]).on(function($user){
				if($user && $user.nickname){
					$doc = {
						mean: "User nickname",
						theme: "",
						type: "nickname",
						hit: 0,
						baby: false,
						flag: 0,
						_nickname: true
					};
					preApproved();
				}else{
					handleUnknown();
				}
			});
		}
		if($doc){ 
			// 해결
			if ((!my.opts.injeong && ($doc.flag & Const.KOR_FLAG.INJEONG)) && !my.opts.unknown) { // If opts is unknown then check only has choseong, joseong or jongseong, not approve.
				denied();
			} else if (!my.opts.injeong && my.opts.unknown && ($doc.flag & Const.KOR_FLAG.INJEONG)) { // 어인정 아님, 비사전 -> 어인정단어 비사전 doc 적용
				$doc = {
					mean: "Non-dictionary word",
					theme: "",
					type: "unknown",
					hit: 0,
					baby: false,
					flag: 0
				};
				preApproved();
			} else if (my.opts.strict && (!$doc.type.match(Const.KOR_STRICT) || $doc.flag >= 4)) {
				denied(406);
			} else if (my.opts.loanword && ($doc.flag & Const.KOR_FLAG.LOANWORD)) {
				denied(405);
			} else if (my.opts.nonoinjeong && !($doc.flag & Const.KOR_FLAG.INJEONG)) {
				denied(412);
			} else {
				preApproved();
			}
		}else{
			handleNickname();
		}
	}
	function isChainable(){
		var type = Const.GAME_TYPE[my.mode];
		var char = my.game.char, subChar = my.game.subChar;
		var l = char.length;
		
		if(!text) return false;
		if(text.length <= l) return false;
		if(my.game.wordLength && text.length != my.game.wordLength) return false;
		if(type == "KAP") return (text.slice(-1) == char) || (text.slice(-1) == subChar);
		switch(l){
			case 1: return (text[0] == char) || (text[0] == subChar);
			case 2: return (text.substr(0, 2) == char);
			case 3: return (text.substr(0, 3) == char) || (text.substr(0, 2) == char.slice(1));
			default: return false;
		}
	}
	DB.kkutu[l].findOne([ '_id', text ],
		(l == "ko") ? [ 'type', Const.KOR_GROUP ] : [ '_id', Const.ENG_ID ]
	).on(onDB);
};
exports.getScore = function(text, delay, ignoreMission){
	var my = this;
	var tr = 1 - delay / my.game.turnTime;
	var score, arr;
	
	if(!text || !my.game.chain || !my.game.dic) return 0;
	score = Const.getPreScore(text, my.game.chain, tr);
	
	if(my.game.dic[text]) score *= 15 / (my.game.dic[text] + 15);
	// 미션이 없을 때(null 등) new RegExp(null)은 "null"과 일치하므로 문자열 미션일 때만 검사한다.
	if(!ignoreMission && typeof my.game.mission == "string" && my.game.mission.length) if(arr = text.match(new RegExp(my.game.mission.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&"), "g"))){
		score += score * 0.5 * arr.length;
		my.game.mission = true;
	}
	return Math.round(score);
};
exports.readyRobot = function(robot){
	var my = this;
	var level = robot.level;
	var delay = ROBOT_START_DELAY[level];
	var ended = {};
	var w, text, i;
	var lmax;
	var isRev = Const.GAME_TYPE[my.mode] == "KAP";
	var isKkt = Const.GAME_TYPE[my.mode] == "KKT";
	var isEng = my.rule.lang == "en";
	
	getAuto.call(my, my.game.char, my.game.subChar, 2).then(function(list){
		if(list.length){
			list.sort(function(a, b){ return b.hit - a.hit; });
			if(ROBOT_HIT_LIMIT[level] > list[0].hit) denied();
			else{
				if(level >= 3 && !robot._done.length){
					if(Math.random() < 0.5) list.sort(function(a, b){ return b._id.length - a._id.length; });
					if(list[0]._id.length < 8 && my.game.turnTime >= 2300){
						for(i in list){
							w = list[i]._id.charAt(isRev ? 0 : (list[i]._id.length - 1));
							if(!ended.hasOwnProperty(w)) ended[w] = [];
							ended[w].push(list[i]);
						}
						getWishList(Object.keys(ended)).then(function(key){
							var v = ended[key];
							
							if(!v) denied();
							else pickList(v);
						});
					}else{
						pickList(list);
					}
				}else pickList(list);
			}
		}else denied();
	});
	function denied(){
		if(my.opts.unknown && !my.opts.nonoinjeong && my.game.char && !my.opts.manner){ // 비사전 단어 (그냥 잇기가 불가할때 랜덤 글자), 매너 해결 
			var char = my.game.char;
			var subChar = my.game.subChar;
			// var len = 2 + Math.floor(Math.random() * 3);
			let min = ROBOT_LENGTH_RANGES[level][0];
			let max = ROBOT_LENGTH_RANGES[level][1];

			if(my.opts.onlylong) { // onlylong일때 레벨낮은 로봇은 t.t로 패스, 높은 로봇은 단어 길이 제한
				if(ROBOT_LENGTH_LIMIT[level] < ONLYLONG_MIN) {
					text = isRev ? `T.T ...${char}` : `${char}... T.T`;
					after();
					return;
				} else {
					min = Math.max(min, ONLYLONG_MIN);
				}
			}
			if(my.opts.onlyshort && !my.opts.onlylong) max = Math.min(max, ONLYSHORT_MAX);
			if(max < min) min = max;

			// var len = isKkt ? my.game.wordLength : 3 + Math.floor(Math.random() * 2 * (ROBOT_UNK_LENGTH_LIMIT[level]));
			var len = min + Math.floor(Math.random() * (max - min + 1)); // Edited unknown word length
			var res = '';
			
			// korean char range 44032 ~ 55203
			if(isRev){ // 만약 앞말잇기 라면
				if (isEng) {
					for (i=1; i<len; i++){
						res += String.fromCharCode(97 + Math.floor(Math.random() * 26));
					}
					res += char;
				} else {
					for (i=1; i<len; i++){
						res += String.fromCharCode(44032 + Math.floor(Math.random() * (55203 - 44032 + 1)));
					}
					res += char;
				}

			}else if (isKkt){ // 만약 쿵쿵따 라면
				if (isEng) {
					res += char;
					for (i=0; i<2; i++){
						res += String.fromCharCode(97 + Math.floor(Math.random() * 26));
					}
				} else {
					res += char;
					for (i=0; i<2; i++){
						res += String.fromCharCode(44032 + Math.floor(Math.random() * (55203 - 44032 + 1)));
					}
				}
			}else{ // 일반적인 경우
				if (isEng) {
					res += char;
					for (i=0; i<len-1; i++){
						res += String.fromCharCode(97 + Math.floor(Math.random() * 26));
					}
				} else {
					res += char;
					for (i=0; i<len-1; i++){
						res += String.fromCharCode(44032 + Math.floor(Math.random() * (55203 - 44032 + 1)));
					}
				}
			}
			text = res;
		}else{
			text = isRev ? `T.T ...${my.game.char}` : `${my.game.char}... T.T`;
		}
		after();
	}
	function pickList(list){
		var robotMinLength = 0;
		var robotMaxLength = ROBOT_LENGTH_LIMIT[level];
		if(my.opts.onlyshort && !my.opts.onlylong) robotMaxLength = Math.min(robotMaxLength, ONLYSHORT_MAX);
		if(my.opts.onlylong) {
			if(robotMaxLength < ONLYLONG_MIN) {
				denied();
				return;
			}
			robotMinLength = ONLYLONG_MIN;
		}
		 
		if(list) do{
			if(!(w = list.shift())) break;
		}while(
			w._id.length > robotMaxLength ||
			w._id.length < robotMinLength ||
			robot._done.includes(w._id)
		);
		if(w){
			text = w._id;
			delay += 500 * ROBOT_THINK_COEF[level] * Math.random() / Math.log(1.1 + w.hit);
			after();
		}else denied();
	}
	function after(){
		delay += text.length * ROBOT_TYPE_COEF[level];
		robot._done.push(text);
		setTimeout(my.turnRobot, delay, robot, text);
	}
	function getWishList(list){
		var R = new Lizard.Tail();
		var wz = [];
		var res;
		
		for(i in list) wz.push(getWish(list[i]));
		Lizard.all(wz).then(function($res){
			if(!my.game.chain) return;
			$res.sort(function(a, b){ return a.length - b.length; });
			
			if(my.opts.manner || !my.game.chain.length){ // 과연 이게 맞을까
				while(res = $res.shift()) if(res.length) break;
			}else res = $res.shift();
			R.go(res ? res.char : null);
		});
		return R;
	}
	function getWish(char){
		var R = new Lizard.Tail();
		
		var ec = escapeRegExp(char);
		
		DB.kkutu[my.rule.lang].find([ '_id', new RegExp(isRev ? `.${ec}$` : `^${ec}.`) ]).limit(10).on(function($res){
			R.go({ char: char, length: $res.length });
		});
		return R;
	}
};
function getMission(l, ezm, mis){
	var arr;
	switch(l){
		case "ko":
			if (ezm && mis) {
				// if (true) { // for testing
				// 아 해결
				if (Math.random() > 0.5) {
					arr = Const.EZ_MISSION_ko;
				} else {
					arr = Const.MISSION_ko;
				}
			} else if (ezm && !mis) {
				arr = Const.EZ_MISSION_ko;
			} else if (!ezm && mis) {
				arr = Const.MISSION_ko;
			}
			break;
		case "en":
			arr = Const.MISSION_en;
			break;
	}

	
	if(!arr) return "-";
	return arr[Math.floor(Math.random() * arr.length)];
}
function getAuto(char, subc, type){
	/* type
		0 무작위 단어 하나
		1 존재 여부
		2 단어 목록
	*/
	var my = this;
	var R = new Lizard.Tail();
	var gameType = Const.GAME_TYPE[my.mode];
	var adv, adc;
	var key = gameType + "_" + keyByOptions(my.opts);
	var MAN = DB.kkutu_manner[my.rule.lang];
	var bool = type == 1;
	
	adc = escapeRegExp(char) + (subc ? ("|"+escapeRegExp(subc)) : "");
	switch(gameType){
		case 'EKT':
			adv = `^(${adc})..`;
			break;
		case 'KSH':
			adv = `^(${adc}).`;
			break;
		case 'ESH':
			adv = `^(${adc})...`;
			break;
		case 'KKT':
			adv = `^(${adc}).{${my.game.wordLength-1}}$`;
			break;
		case 'KAP':
			adv = `.(${adc})$`;
			break;
	}
	if(!char){
		console.log(`Undefined char detected! key=${key} type=${type} adc=${adc}`);
	}
	MAN.findOne([ '_id', char || "★" ]).on(function($mn){
		if($mn && bool){
			if(my.opts.unknown) return R.go(true);
			if($mn[key] === null) produce();
			else R.go($mn[key]);
		}else{
			produce();
		}
	});
	function produce(){
		var aqs = [[ '_id', new RegExp(adv) ]];
		var aft;
		var lst;
		
		// if(!my.opts.injeong) aqs.push([ 'flag', { '$nand': Const.KOR_FLAG.INJEONG } ]);
		if(my.rule.lang == "ko"){
			if(my.opts.nonoinjeong) {
				aqs.push([ 'flag', { '$not': { '$nand': Const.KOR_FLAG.INJEONG } } ]);
			} else if(my.opts.injeong) {
                aqs.push(['flag', { '$gte': 0}]);
            } else {
                aqs.push(['flag', { '$nand': Const.KOR_FLAG.INJEONG } ]);
            }
			if(my.opts.loanword) aqs.push([ 'flag', { '$nand': Const.KOR_FLAG.LOANWORD } ]);
			if(my.opts.strict) aqs.push([ 'type', Const.KOR_STRICT ], [ 'flag', { $lte: 3 } ]);
			else aqs.push([ 'type', Const.KOR_GROUP ]);
		}else{
			aqs.push([ '_id', Const.ENG_ID ]);
		}
		switch(type){
			case 0:
			default:
				aft = function($md){
					R.go($md[Math.floor(Math.random() * $md.length)]);
				};
				break;
			case 1:
				aft = function($md){
					R.go($md.length ? true : false);
				};
				break;
			case 2:
				aft = function($md){
					R.go($md);
				};
				break;
		}
		DB.kkutu[my.rule.lang].find.apply(this, aqs).limit(bool ? 1 : 123).on(function($md){
			forManner($md);
			// 존재 여부(type 1)는 limit 1로 조회하므로 걸러내지 않는다. 힌트/로봇 목록에서는 이미 쓴 단어를 제외한다.
			if(my.game.chain && !bool) aft($md.filter(function(item){ return !my.game.chain.includes(item._id); }));
			else aft($md);
		});
		function forManner(list){
			lst = list;
			MAN.upsert([ '_id', char ]).set([ key, lst.length ? true : false ]).on(null, null, onFail);
		}
		function onFail(){
			MAN.createColumn(key, "boolean").on(function(){
				forManner(lst);
			});
		}
	}
	return R;
}
function escapeRegExp(str) {
	return (str || '').replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}
function checkunknownSungui(word){ // words be like "가ㅏ32ㅜㅑㅇ노ㅑㄹ23ㅜ"
	var map = HANGUL_SUNGUI;

	if(word.length != 1) return null;
	// When unknown check letter like "ㄱ", "ㅂ", "ㅏ"
	if(map.includes(word)) return word;
	// When unknown check letter is single char but not in map, return null
	return null;
}
function isUnknownLowEffortWord(word){
	var chars;
	var i;
	var ch;
	var syllableCount = 0;
	var sunguiCount = 0;
	var noiseCount = 0;
	var nonHangulAlphaCount = 0;
	var total;

	if(typeof word !== "string") return false;
	word = word.replace(/\s+/g, "");
	if(!word) return true;

	chars = Array.from(word);
	for(i = 0; i < chars.length; i++){
		ch = chars[i];
		if(/[가-힣]/.test(ch)){
			syllableCount++;
		}else if(checkunknownSungui(ch)){
			sunguiCount++;
		}else if(/[0-9]/.test(ch)){
			noiseCount++;
		}else if(/[a-zA-Z]/.test(ch)){
			nonHangulAlphaCount++;
		}else{
			noiseCount++;
		}
	}
	total = chars.length;

	// 완성형 한글 비율이 충분하면 성의 있는 입력으로 본다.
	if(syllableCount >= Math.ceil(total * 0.6)) return false;
	if(syllableCount >= 2 && sunguiCount <= 1 && noiseCount === 0) return false;

	if(syllableCount === 0 && sunguiCount >= 2) return true;
	if(sunguiCount >= Math.ceil(total * 0.5) && syllableCount <= 1) return true;
	if(noiseCount >= 2 && sunguiCount >= 2 && syllableCount <= 1) return true;
	if(nonHangulAlphaCount >= Math.ceil(total * 0.7) && syllableCount === 0) return true;

	return false;
}
function decodeMorseInput(input, morseMap){ // LZB - Added Morse
	var normalized;
	var tokens;
	var output = "";
	var i, token, parts, j, part, ch;
	var map = morseMap || EN_MORSE;

	if(typeof input !== "string") return null;
	normalized = input.trim();
	if(!normalized) return null;
	if(!/^[\.\-\s\/|]+$/.test(normalized)) return null;

	normalized = normalized.replace(/\|/g, "/");
	tokens = normalized.split(/\s+/);
	for(i=0; i<tokens.length; i++){
		token = tokens[i];
		if(!token) continue;
		parts = token.split("/");
		for(j=0; j<parts.length; j++){
			part = parts[j];
			if(!part) continue;
			ch = map[part];
			if(!ch) return null;
			output += ch;
		}
	}

	return output || null;
}
function decodePhoneticInput(input, map){ // LZB - Added Phonetic
	var normalized;
	var tokens;
	var output = "";
	var i, token, ch;
	var map = map || EN_PHONETIC;

	if(typeof input !== "string") return null;
	normalized = input.trim().toLowerCase();
	if(!normalized) return null;

	normalized = normalized.replace(/[|/]/g, " / ");
	tokens = normalized.split(/\s+/);
	for(i=0; i<tokens.length; i++){
		token = tokens[i];
		if(token == "/"){
			if(output && output.charAt(output.length - 1) != "/") output += "/";
			continue;
		}
		ch = map[token];
		if(!ch) return null;
		output += ch;
	}

	return output || null;
}
function composeHangulInput(input){
	var parts;
	var out = "";
	var i;

	if(typeof input !== "string") return input;
	parts = input.split("/");
	for(i=0; i<parts.length; i++) out += composeHangulChunk(parts[i].trim());

	return out;
}
function composeHangulChunk(input){
	var chars;
	var out = "";
	var i = 0;
	var initial, medialRes, finalRes;
	var lead, leadPair, leadStep, vowel, tail;

	chars = Array.from(input);

	while(i < chars.length){
		lead = chars[i];
		leadPair = HANGUL_INITIAL_COMBINE[lead + (chars[i + 1] || "")];
		leadStep = (leadPair && HANGUL_MEDIAL_INDEX[chars[i + 2]] !== undefined) ? 2 : 1;
		if(leadStep === 2) lead = leadPair;
		initial = HANGUL_INITIAL_INDEX[lead];
		if(initial === undefined){
			out += lead;
			i++;
			continue;
		}

		medialRes = readMedial(chars, i + leadStep);
		if(!medialRes){
			out += lead;
			i += leadStep;
			continue;
		}

		vowel = medialRes.medial;
		finalRes = readFinal(chars, medialRes.next);
		tail = finalRes ? finalRes.final : "";
		out += String.fromCharCode(0xAC00 + (initial * 21 + HANGUL_MEDIAL_INDEX[vowel]) * 28 + HANGUL_FINAL_INDEX[tail]);
		i = finalRes ? finalRes.next : medialRes.next;
	}

	return out;
}
function readMedial(chars, index){
	var first = chars[index];
	var second = chars[index + 1];
	var combined;

	if(first == null) return null;
	if(HANGUL_MEDIAL_INDEX[first] === undefined) return null;

	if(second != null){
		combined = HANGUL_MEDIAL_COMBINE[first + second];
		if(combined) return { medial: combined, next: index + 2 };
	}
	return { medial: first, next: index + 1 };
}
function readFinal(chars, index){
	var first = chars[index];
	var second = chars[index + 1];
	var cluster;

	if(first == null) return null;
	if(HANGUL_FINAL_INDEX[first] === undefined || HANGUL_FINAL_INDEX[first] === 0) return null;

	if(second != null){
		cluster = HANGUL_FINAL_COMBINE[first + second];
		if(cluster && HANGUL_FINAL_INDEX[cluster] !== undefined && HANGUL_MEDIAL_INDEX[chars[index + 2]] === undefined){
			return { final: cluster, next: index + 2 };
		}
	}

	if(HANGUL_MEDIAL_INDEX[second] !== undefined) return null;
	return { final: first, next: index + 1 };
}
function escapeHTML(str) {
    return (str || '').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
function keyByOptions(opts){
	var arr = [];
	
	if(opts.injeong) arr.push('X');
	if(opts.loanword) arr.push('L');
	if(opts.strict) arr.push('S');
	return arr.join('');
}
function shuffle(arr){
	var i, r = [];
	
	for(i in arr) r.push(arr[i]);
	r.sort(function(a, b){ return Math.random() - 0.5; });
	
	return r;
}
function getChar(text){
	var my = this;
	
	switch(Const.GAME_TYPE[my.mode]){
		case 'EKT': return text.slice(text.length - 3);
		case 'ESH':
		case 'KKT':
		case 'KSH': return text.slice(-1);
		case 'KAP': return text.charAt(0);
	}
};
function getSubChar(char){
	var my = this;
	var r;
	var c = char.charCodeAt();
	var k;
	var ca, cb, cc;
	
	switch(Const.GAME_TYPE[my.mode]){
		case "EKT":
			if(char.length > 2) r = char.slice(1);
			break;
		case "KKT": case "KSH": case "KAP":
			k = c - 0xAC00;
			if(k < 0 || k > 11171) break;
			ca = [ Math.floor(k/28/21), Math.floor(k/28)%21, k%28 ];
			cb = [ ca[0] + 0x1100, ca[1] + 0x1161, ca[2] + 0x11A7 ];
			cc = false;
			if(cb[0] == 4357){ // ������ ��, �� ㄹ -> ㅇ
				cc = true;
				if(RIEUL_TO_NIEUN.includes(cb[1])) cb[0] = 4354;
				else if(RIEUL_TO_IEUNG.includes(cb[1])) cb[0] = 4363;
				else cc = false;
			}else if(cb[0] == 4354){ // ������ �� ㄴ -> ㅇ
				if(NIEUN_TO_IEUNG.indexOf(cb[1]) != -1){
					cb[0] = 4363;
					cc = true;
				}
			}
			if(cc){
				cb[0] -= 0x1100; cb[1] -= 0x1161; cb[2] -= 0x11A7;
				r = String.fromCharCode(((cb[0] * 21) + cb[1]) * 28 + cb[2] + 0xAC00);
			}
			break;
		case "ESH": default:
			break;
	}
	return r;
}