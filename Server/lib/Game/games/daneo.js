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

const ROBOT_START_DELAY = [ 1200, 800, 400, 200, 0 ];
const ROBOT_TYPE_COEF = [ 1250, 750, 500, 250, 0 ];
const ROBOT_THINK_COEF = [ 4, 2, 1, 0, 0 ];
const ROBOT_HIT_LIMIT = [ 4, 2, 1, 0, 0 ];

const KO_MORSE = {".-..":"ㄱ", "..-.":"ㄴ", "-...":"ㄷ", "...-":"ㄹ", "--":"ㅁ", ".--":"ㅂ", "--.":"ㅅ", "-.-":"ㅇ", ".--.":"ㅈ", "-.-.":"ㅊ", "-..-":"ㅋ", "--..":"ㅌ", "---":"ㅍ", ".---":"ㅎ", ".":"ㅏ", "..":"ㅑ", "-":"ㅓ", "...":"ㅕ", ".-":"ㅗ", "-.":"ㅛ", "....":"ㅜ", ".-.":"ㅠ", "-..":"ㅡ", "..-":"ㅣ", "--.-":"ㅐ", "-.--":"ㅔ" };
const EN_MORSE = { ".-": "a", "-...": "b", "-.-.": "c", "-..": "d", ".": "e", "..-.": "f", "--.": "g", "....": "h", "..": "i", ".---": "j", "-.-": "k", ".-..": "l", "--": "m", "-.": "n", "---": "o", ".--.": "p", "--.-": "q", ".-.": "r", "...": "s", "-": "t", "..-": "u", "...-": "v", ".--": "w", "-..-": "x", "-.--": "y", "--..": "z" };
const EN_PHONETIC = { "alpha":"a", "bravo":"b", "charlie":"c", "delta":"d", "echo":"e", "foxtrot":"f", "golf":"g", "hotel":"h", "india":"i", "juliett":"j", "kilo":"k", "lima":"l", "mike":"m", "november":"n", "oscar":"o", "papa":"p", "quebec":"q", "romeo":"r", "sierra":"s", "tango":"t", "uniform":"u", "victor":"v", "whiskey":"w", "x-ray":"x", "yankee":"y", "zulu":"z" };
const KO_PHONETIC = { "기러기":"ㄱ", "나포리":"ㄴ", "도라지":"ㄷ", "로오마":"ㄹ", "미나리":"ㅁ", "바가지":"ㅂ", "서울":"ㅅ", "잉어":"ㅇ", "지게":"ㅈ", "치마":"ㅊ", "키다리":"ㅋ", "통신":"ㅌ", "파고다":"ㅍ", "한강":"ㅎ", "아버지":"ㅏ", "야자수":"ㅑ", "어머니":"ㅓ", "연못":"ㅕ", "오징어":"ㅗ", "요지경":"ㅛ", "우편":"ㅜ", "유달산":"ㅠ", "은방울":"ㅡ", "이순신":"ㅣ", "앵무새":"ㅐ", "엑스레이":"ㅔ" };
const HANGUL_INITIAL_INDEX = { "ㄱ":0, "ㄲ":1, "ㄴ":2, "ㄷ":3, "ㄸ":4, "ㄹ":5, "ㅁ":6, "ㅂ":7, "ㅃ":8, "ㅅ":9, "ㅆ":10, "ㅇ":11, "ㅈ":12, "ㅉ":13, "ㅊ":14, "ㅋ":15, "ㅌ":16, "ㅍ":17, "ㅎ":18 };
const HANGUL_INITIAL_COMBINE = { "ㄱㄱ":"ㄲ", "ㄷㄷ":"ㄸ", "ㅂㅂ":"ㅃ", "ㅅㅅ":"ㅆ", "ㅈㅈ":"ㅉ" };
const HANGUL_MEDIAL_INDEX = { "ㅏ":0, "ㅐ":1, "ㅑ":2, "ㅒ":3, "ㅓ":4, "ㅔ":5, "ㅕ":6, "ㅖ":7, "ㅗ":8, "ㅘ":9, "ㅙ":10, "ㅚ":11, "ㅛ":12, "ㅜ":13, "ㅝ":14, "ㅞ":15, "ㅟ":16, "ㅠ":17, "ㅡ":18, "ㅢ":19, "ㅣ":20 };
const HANGUL_MEDIAL_COMBINE = { "ㅗㅏ":"ㅘ", "ㅗㅐ":"ㅙ", "ㅗㅣ":"ㅚ", "ㅜㅓ":"ㅝ", "ㅜㅔ":"ㅞ", "ㅜㅣ":"ㅟ", "ㅡㅣ":"ㅢ" };
const HANGUL_FINAL_INDEX = { "":0, "ㄱ":1, "ㄲ":2, "ㄳ":3, "ㄴ":4, "ㄵ":5, "ㄶ":6, "ㄷ":7, "ㄹ":8, "ㄺ":9, "ㄻ":10, "ㄼ":11, "ㄽ":12, "ㄾ":13, "ㄿ":14, "ㅀ":15, "ㅁ":16, "ㅂ":17, "ㅄ":18, "ㅅ":19, "ㅆ":20, "ㅇ":21, "ㅈ":22, "ㅊ":23, "ㅋ":24, "ㅌ":25, "ㅍ":26, "ㅎ":27 };
const HANGUL_FINAL_COMBINE = { "ㄱㅅ":"ㄳ", "ㄴㅈ":"ㄵ", "ㄴㅎ":"ㄶ", "ㄹㄱ":"ㄺ", "ㄹㅁ":"ㄻ", "ㄹㅂ":"ㄼ", "ㄹㅅ":"ㄽ", "ㄹㅌ":"ㄾ", "ㄹㅍ":"ㄿ", "ㄹㅎ":"ㅀ", "ㅂㅅ":"ㅄ" };

var ONLYLONG_MIN = 7 // onlylong
var ONLYSHORT_MAX = 5 // onlyshort

exports.init = function(_DB, _DIC){
	DB = _DB;
	DIC = _DIC;
};
exports.getTitle = function(){
	var R = new Lizard.Tail();
	var my = this;
	
	setTimeout(function(){
		R.go("①②③④⑤⑥⑦⑧⑨⑩");
	}, 500);
	return R;
};
exports.roundReady = function(){
	var my = this;
	var ijl = my.opts.injpick.length;
	
	clearTimeout(my.game.turnTimer);
	my.game.round++;
	my.game.roundTime = my.time * 1000;
	if(my.game.round <= my.round){
		my.game.theme = my.opts.injpick[Math.floor(Math.random() * ijl)];
		my.game.chain = [];
		if(my.opts.mission) my.game.mission = getMission(my.rule.lang, my.opts.easymission, my.opts.mission);
		my.byMaster('roundReady', {
			round: my.game.round,
			theme: my.game.theme,
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
	my.byMaster('turnStart', {
		turn: my.game.turn,
		speed: speed,
		roundTime: my.game.roundTime,
		turnTime: my.game.turnTime,
		mission: my.game.mission,
		seq: force ? my.game.seq : undefined
	}, true);
	my.game.turnTimer = setTimeout(my.turnEnd, Math.min(my.game.roundTime, my.game.turnTime + 100));
	if(si = my.game.seq[my.game.turn]) if(si.robot){
		my.readyRobot(si);
	}
};
exports.turnEnd = function(){
	var my = this;
	var target = DIC[my.game.seq[my.game.turn]] || my.game.seq[my.game.turn];
	var score;
	
	if(my.game.loading){
		my.game.turnTimer = setTimeout(my.turnEnd, 100);
		return;
	}
	if(!my.game.chain) return;
	
	my.game.late = true;
	if(target) if(target.game){
		score = Const.getPenalty(my.game.chain, target.game.score);
		target.game.score += score;
	}
	getAuto.call(my, my.game.theme, 0).then(function(w){
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
exports.submit = function(client, text, data){
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
	if(!my.game.theme) return;
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
		else if(!client.robot) return client.publish('turnError', { code: 488, value: originalText }, true);
	}else if(my.rule.lang == "ko"){
		composedText = composeHangulInput(text);
		if(composedText) text = composedText;
	}

	var textlength = text.length

	if(my.opts.onlylong) if(textlength < ONLYLONG_MIN && !client.robot) return client.publish('turnError', { code: 410, value: escapeHTML(originalText) }, true); // onlylong
	if(my.opts.onlyshort && !my.opts.onlylong) if(textlength > ONLYSHORT_MAX && !client.robot) return client.publish('turnError', { code: 411, value: escapeHTML(originalText) }, true); // onlyshort

	if(my.game.chain.indexOf(text) == -1){ // 사용된 단어?
		l = my.rule.lang;
		my.game.loading = true;
		function onDB($doc){
			function preApproved(){
				if(my.game.late) return;
				if(!my.game.chain) return;
				
				my.game.loading = false;
				my.game.late = true;
				clearTimeout(my.game.turnTimer);
				t = tv - my.game.turnAt;
				score = my.getScore(text, t);
				my.game.chain.push(text);
				my.game.roundTime -= t;
				client.game.score += score;
				client.publish('turnEnd', {
					ok: true,
					value: text,
					mean: $doc.mean,
					theme: $doc.theme,
					wc: $doc.type,
					score: score,
					bonus: (my.game.mission === true) ? score - my.getScore(text, t, true) : 0,
					baby: $doc.baby
				}, true);
				if(my.game.mission === true){
					my.game.mission = getMission(my.rule.lang, my.opts.easymission, my.opts.mission);
				}
				setTimeout(my.turnNext, my.game.turnTime / 6);
				if(!client.robot){
					client.invokeWordPiece(text, 1);
					DB.kkutu[l].update([ '_id', text ]).set([ 'hit', $doc.hit + 1 ]).on();
				}
			}
			function denied(code){
				my.game.loading = false;
				client.publish('turnError', { code: code || 404, value: text }, true);
			}
			if($doc){ // $doc (단어 데이터) 가 존재하는가
				if($doc.theme.match(toRegex(my.game.theme)) == null) denied(407);
				else preApproved();
			}else{
				denied();
			}
		}
		DB.kkutu[l].findOne([ '_id', text ],
			(l == "ko") ? [ 'type', Const.KOR_GROUP ] : [ '_id', Const.ENG_ID ]
		).on(onDB);
	}else{
		client.publish('turnError', { code: 409, value: text }, true);
	}
};
exports.getScore = function(text, delay, ignoreMission){
	var my = this;
	var tr = 1 - delay / my.game.turnTime;
	var score = Const.getPreScore(text, my.game.chain, tr);
	var arr;
	
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
	var w, text;
	
	getAuto.call(my, my.game.theme, 2).then(function(list){
		if(list.length){
			list.sort(function(a, b){ return b.hit - a.hit; });
			if(ROBOT_HIT_LIMIT[level] > list[0].hit) denied();
			else pickList(list);
		}else denied();
	});
	function denied(){
		text = "... T.T";
		after();
	}
	function pickList(list){
		if(list) do{
			if(!(w = list.shift())) break;
		}while(false);
		if(w){
			text = w._id;
			delay += 500 * ROBOT_THINK_COEF[level] * Math.random() / Math.log(1.1 + w.hit);
			after();
		}else denied();
	}
	function after(){
		delay += text.length * ROBOT_TYPE_COEF[level];
		setTimeout(my.turnRobot, delay, robot, text);
	}
};
function escapeHTML(str) {
    return (str || '').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
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
		if(cluster && HANGUL_MEDIAL_INDEX[chars[index + 2]] === undefined){
			return { final: cluster, next: index + 2 };
		}
	}

	if(HANGUL_MEDIAL_INDEX[second] !== undefined) return null;
	return { final: first, next: index + 1 };
}
function toRegex(theme){
	return new RegExp(`(^|,)${theme}($|,)`);
}
function getMission(l, ezm, mis){
	// var arr = (l == "ko") ? Const.MISSION_ko : Const.MISSION_en;
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
function getAuto(theme, type){
	/* type
		0 무작위 단어 하나
		1 존재 여부
		2 단어 목록
	*/
	var my = this;
	var R = new Lizard.Tail();
	var bool = type == 1;
	
	var aqs = [[ 'theme', toRegex(theme) ]];
	var aft;
	var raiser;
	var lst = false;
	
	if(my.game.chain) aqs.push([ '_id', { '$nin': my.game.chain } ]);
	raiser = DB.kkutu[my.rule.lang].find.apply(this, aqs).limit(bool ? 1 : 123);
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
	raiser.on(aft);
	
	return R;
}