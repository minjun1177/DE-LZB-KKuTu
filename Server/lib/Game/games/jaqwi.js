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

var ROBOT_CATCH_RATE = [ 0.1, 0.3, 0.5, 0.7, 0.99 ];
var ROBOT_TYPE_COEF = [ 2000, 1200, 800, 300, 0 ];
var robotTimers = {};

const KO_MORSE = {".-..":"ㄱ", "..-.":"ㄴ", "-...":"ㄷ", "...-":"ㄹ", "--":"ㅁ", ".--":"ㅂ", "--.":"ㅅ", "-.-":"ㅇ", ".--.":"ㅈ", "-.-.":"ㅊ", "-..-":"ㅋ", "--..":"ㅌ", "---":"ㅍ", ".---":"ㅎ", ".":"ㅏ", "..":"ㅑ", "-":"ㅓ", "...":"ㅕ", ".-":"ㅗ", "-.":"ㅛ", "....":"ㅜ", ".-.":"ㅠ", "-..":"ㅡ", "..-":"ㅣ", "--.-":"ㅐ", "-.--":"ㅔ" };
const EN_MORSE = { ".-": "a", "-...": "b", "-.-.": "c", "-..": "d", ".": "e", "..-.": "f", "--.": "g", "....": "h", "..": "i", ".---": "j", "-.-": "k", ".-..": "l", "--": "m", "-.": "n", "---": "o", ".--.": "p", "--.-": "q", ".-.": "r", "...": "s", "-": "t", "..-": "u", "...-": "v", ".--": "w", "-..-": "x", "-.--": "y", "--..": "z" };
const KO_PHONETIC = { "기러기":"ㄱ", "나포리":"ㄴ", "도라지":"ㄷ", "로오마":"ㄹ", "미나리":"ㅁ", "바가지":"ㅂ", "서울":"ㅅ", "잉어":"ㅇ", "지게":"ㅈ", "치마":"ㅊ", "키다리":"ㅋ", "통신":"ㅌ", "파고다":"ㅍ", "한강":"ㅎ", "아버지":"ㅏ", "야자수":"ㅑ", "어머니":"ㅓ", "연못":"ㅕ", "오징어":"ㅗ", "요지경":"ㅛ", "우편":"ㅜ", "유달산":"ㅠ", "은방울":"ㅡ", "이순신":"ㅣ", "앵무새":"ㅐ", "엑스레이":"ㅔ" };const HANGUL_INITIAL_INDEX = { "ㄱ":0, "ㄲ":1, "ㄴ":2, "ㄷ":3, "ㄸ":4, "ㄹ":5, "ㅁ":6, "ㅂ":7, "ㅃ":8, "ㅅ":9, "ㅆ":10, "ㅇ":11, "ㅈ":12, "ㅉ":13, "ㅊ":14, "ㅋ":15, "ㅌ":16, "ㅍ":17, "ㅎ":18 };
const HANGUL_INITIAL_COMBINE = { "ㄱㄱ":"ㄲ", "ㄷㄷ":"ㄸ", "ㅂㅂ":"ㅃ", "ㅅㅅ":"ㅆ", "ㅈㅈ":"ㅉ" };
const HANGUL_MEDIAL_INDEX = { "ㅏ":0, "ㅐ":1, "ㅑ":2, "ㅒ":3, "ㅓ":4, "ㅔ":5, "ㅕ":6, "ㅖ":7, "ㅗ":8, "ㅘ":9, "ㅙ":10, "ㅚ":11, "ㅛ":12, "ㅜ":13, "ㅝ":14, "ㅞ":15, "ㅟ":16, "ㅠ":17, "ㅡ":18, "ㅢ":19, "ㅣ":20 };
const HANGUL_MEDIAL_COMBINE = { "ㅗㅏ":"ㅘ", "ㅗㅐ":"ㅙ", "ㅗㅣ":"ㅚ", "ㅜㅓ":"ㅝ", "ㅜㅔ":"ㅞ", "ㅜㅣ":"ㅟ", "ㅡㅣ":"ㅢ" };
const HANGUL_FINAL_INDEX = { "":0, "ㄱ":1, "ㄲ":2, "ㄳ":3, "ㄴ":4, "ㄵ":5, "ㄶ":6, "ㄷ":7, "ㄹ":8, "ㄺ":9, "ㄻ":10, "ㄼ":11, "ㄽ":12, "ㄾ":13, "ㄿ":14, "ㅀ":15, "ㅁ":16, "ㅂ":17, "ㅄ":18, "ㅅ":19, "ㅆ":20, "ㅇ":21, "ㅈ":22, "ㅊ":23, "ㅋ":24, "ㅌ":25, "ㅍ":26, "ㅎ":27 };
const HANGUL_FINAL_COMBINE = { "ㄱㅅ":"ㄳ", "ㄴㅈ":"ㄵ", "ㄴㅎ":"ㄶ", "ㄹㄱ":"ㄺ", "ㄹㅁ":"ㄻ", "ㄹㅂ":"ㄼ", "ㄹㅅ":"ㄽ", "ㄹㅌ":"ㄾ", "ㄹㅍ":"ㄿ", "ㄹㅎ":"ㅀ", "ㅂㅅ":"ㅄ" };
// todo - classic과 이 파일의 한글 변수개수가 몬가 다르다...?

exports.init = function(_DB, _DIC){
	DB = _DB;
	DIC = _DIC;
};
exports.getTitle = function(){
	var R = new Lizard.Tail();
	var my = this;
	
	my.game.done = [];
	setTimeout(function(){
		R.go("①②③④⑤⑥⑦⑧⑨⑩");
	}, 500);
	return R;
};
exports.roundReady = function(){
	var my = this;
	var ijl = my.opts.injpick.length;
	
	clearTimeout(my.game.qTimer);
	clearTimeout(my.game.hintTimer);
	clearTimeout(my.game.hintTimer2);
	my.game.themeBonus = 0.3 * Math.log(0.6 * ijl + 1);
	my.game.winner = [];
	my.game.giveup = [];
	my.game.round++;
	my.game.roundTime = my.time * 1000;
	if(my.game.round <= my.round){
		my.game.theme = my.opts.injpick[Math.floor(Math.random() * ijl)];
		getAnswer.call(my, my.game.theme).then(function($ans){
			if(!my.game.done) return;
			if(!my.gaming) return;
			
			// 주제에 맞는 문제가 더 없으면(모두 출제됨 등) 게임을 끝낸다. (null 접근으로 서버가 죽던 문제)
			if(!$ans || !$ans._id){
				my.game.round = my.round;
				my.roundEnd();
				return;
			}
			my.game.late = false;
			my.game.answer = $ans;
			my.game.done.push($ans._id);
			$ans.mean = ($ans.mean.length > 20) ? $ans.mean : getConsonants($ans._id, Math.round($ans._id.length / 2));
			my.game.hint = getHint($ans);
			my.byMaster('roundReady', {
				round: my.game.round,
				theme: my.game.theme
			}, true);
			setTimeout(my.turnStart, 2400);
		});
	}else{
		my.roundEnd();
	}
};
exports.turnStart = function(){
	var my = this;
	var i;
	
	if(!my.game.answer) return;
	
	my.game.conso = getConsonants(my.game.answer._id, 1);
	my.game.roundAt = (new Date()).getTime();
	my.game.meaned = 0;
	my.game.primary = 0;
	my.game.qTimer = setTimeout(my.turnEnd, my.game.roundTime);
	my.game.hintTimer = setTimeout(function(){ turnHint.call(my); }, my.game.roundTime * 0.333);
	my.game.hintTimer2 = setTimeout(function(){ turnHint.call(my); }, my.game.roundTime * 0.667);
	my.byMaster('turnStart', {
		char: my.game.conso,
		roundTime: my.game.roundTime
	}, true);
	
	for(i in my.game.robots){
		my.readyRobot(my.game.robots[i]);
	}
};
function turnHint(){
	var my = this;
	
	my.byMaster('turnHint', {
		hint: my.game.hint[my.game.meaned++]
	}, true);
}
exports.turnEnd = function(){
	var my = this;

	if(my.game.answer){
		my.game.late = true;
		my.byMaster('turnEnd', {
			answer: my.game.answer ? my.game.answer._id : ""
		});
	}
	my.game._rrt = setTimeout(my.roundReady, 2500);
};
exports.submit = function(client, text){
	var my = this;
	var score, t, i;
	var $ans = my.game.answer;
	var now = (new Date()).getTime();
	var play = (my.game.seq ? my.game.seq.includes(client.id) : false) || client.robot;
	var gu = my.game.giveup ? my.game.giveup.includes(client.id) : true;
	var originalText = text;
	var morseDecoded;
	var morseMap;
	var composedText;

	if(!my.game.winner) return;
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

	if(my.game.winner.indexOf(client.id) == -1
		&& text == $ans._id
		&& play && !gu
	){
		t = now - my.game.roundAt;
		if(my.game.primary == 0) if(my.game.roundTime - t > 10000){ // 가장 먼저 맞힌 시점에서 10초 이내에 맞히면 점수 약간 획득
			clearTimeout(my.game.qTimer);
			my.game.qTimer = setTimeout(my.turnEnd, 10000);
			for(i in my.game.robots){
				if(my.game.roundTime > my.game.robots[i]._delay){
					clearTimeout(my.game.robots[i]._timer);
					if(client != my.game.robots[i]) if(Math.random() < ROBOT_CATCH_RATE[my.game.robots[i].level])
						my.game.robots[i]._timer = setTimeout(my.turnRobot, ROBOT_TYPE_COEF[my.game.robots[i].level], my.game.robots[i], text);
				}
			}
		}
		clearTimeout(my.game.hintTimer);
		score = my.getScore(text, t);
		my.game.primary++;
		my.game.winner.push(client.id);
		client.game.score += score;
		client.publish('turnEnd', {
			target: client.id,
			ok: true,
			value: text,
			score: score,
			bonus: 0
		}, true);
		client.invokeWordPiece(text, 0.9);
		while(my.game.meaned < my.game.hint.length){
			turnHint.call(my);
		}
	}else if(play && !gu && (text == "gg" || text == "ㅈㅈ")){
		my.game.giveup.push(client.id);
		client.publish('turnEnd', {
			target: client.id,
			giveup: true
		}, true);
	}else{
		client.chat(text);
	}
	if(play) if(my.game.primary + my.game.giveup.length >= my.game.seq.length){
		clearTimeout(my.game.hintTimer);
		clearTimeout(my.game.hintTimer2);
		clearTimeout(my.game.qTimer);
		my.turnEnd();
	}
};
exports.getScore = function(text, delay){
	var my = this;
	var rank = my.game.hum - my.game.primary + 3;
	var tr = 1 - delay / my.game.roundTime;
	var score = 6 * Math.pow(rank, 1.4) * ( 0.5 + 0.5 * tr );

	return Math.round(score * my.game.themeBonus);
};
exports.readyRobot = function(robot){
	var my = this;
	var level = robot.level;
	var delay, text;
	var i;
	
	if(!my.game.answer) return;
	clearTimeout(robot._timer);
	robot._delay = 99999999;
	for(i=0; i<2; i++){
		if(Math.random() < ROBOT_CATCH_RATE[level]){
			text = my.game.answer._id;
			delay = my.game.roundTime / 3 * i + text.length * ROBOT_TYPE_COEF[level];
			robot._timer = setTimeout(my.turnRobot, delay, robot, text);
			robot._delay = delay;
			break;
		}else continue;
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
function getConsonants(word, lucky){
	var R = "";
	var i, len = word.length;
	var c;
	var rv = [];
	
	lucky = lucky || 0;
	while(lucky > 0){
		c = Math.floor(Math.random() * len);
		if(rv.includes(c)) continue;
		rv.push(c);
		lucky--;
	}
	for(i=0; i<len; i++){
		c = word.charCodeAt(i) - 44032;
		
		if(c < 0 || rv.includes(i)){
			R += word.charAt(i);
			continue;
		}else c = Math.floor(c / 588);
		R += Const.INIT_SOUNDS[c];
	}
	return R;
}
function getHint($ans){
	var R = [];
	var h1 = $ans.mean.split($ans._id).join("★");
	var h2;
	var tries = 0;
	
	R.push(h1);
	// 모든 글자가 한글이 아닌 단어 등은 항상 같은 결과가 나오므로 무한 반복을 막는다.
	do{
		h2 = getConsonants($ans._id, Math.ceil($ans._id.length / 2));
	}while(h1 == h2 && ++tries < 20);
	R.push(h2);
	
	return R;
}
function getAnswer(theme, nomean){
	var my = this;
	var R = new Lizard.Tail();
	var args = [ [ '_id', { $nin: my.game.done } ] ];
	
	args.push([ 'theme', new RegExp("(,|^)(" + theme + ")(,|$)") ]);
	args.push([ 'type', Const.KOR_GROUP ]);
	args.push([ 'flag', { $lte: 7 } ]);
	DB.kkutu['ko'].find.apply(my, args).on(function($res){
		if(!$res) return R.go(null);
		var pick;
		var len = $res.length;
		
		if(!len) return R.go(null);
		do{
			pick = Math.floor(Math.random() * len);
			if($res[pick]._id.length >= 2) if($res[pick].type == "INJEONG" || $res[pick].mean.length >= 0){
				return R.go($res[pick]);
			}
			$res.splice(pick, 1);
			len--;
		}while(len > 0);
		R.go(null);
	});
	return R;
}