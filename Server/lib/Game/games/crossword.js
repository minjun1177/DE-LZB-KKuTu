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

var ROBOT_SEEK_DELAY = [ 5000, 3000, 1500, 700, 100 ];
var ROBOT_CATCH_RATE = [ 0.05, 0.2, 0.4, 0.6, 0.99 ];
var ROBOT_TYPE_COEF = [ 2000, 1200, 800, 300, 0 ];
const KO_MORSE = {".-..":"ㄱ", "..-.":"ㄴ", "-...":"ㄷ", "...-":"ㄹ", "--":"ㅁ", ".--":"ㅂ", "--.":"ㅅ", "-.-":"ㅇ", ".--.":"ㅈ", "-.-.":"ㅊ", "-..-":"ㅋ", "--..":"ㅌ", "---":"ㅍ", ".---":"ㅎ", ".":"ㅏ", "..":"ㅑ", "-":"ㅓ", "...":"ㅕ", ".-":"ㅗ", "-.":"ㅛ", "....":"ㅜ", ".-.":"ㅠ", "-..":"ㅡ", "..-":"ㅣ", "--.-":"ㅐ", "-.--":"ㅔ" };
const EN_MORSE = { ".-": "a", "-...": "b", "-.-.": "c", "-..": "d", ".": "e", "..-.": "f", "--.": "g", "....": "h", "..": "i", ".---": "j", "-.-": "k", ".-..": "l", "--": "m", "-.": "n", "---": "o", ".--.": "p", "--.-": "q", ".-.": "r", "...": "s", "-": "t", "..-": "u", "...-": "v", ".--": "w", "-..-": "x", "-.--": "y", "--..": "z" };const EN_PHONETIC = { "alpha":"a", "bravo":"b", "charlie":"c", "delta":"d", "echo":"e", "foxtrot":"f", "golf":"g", "hotel":"h", "india":"i", "juliett":"j", "kilo":"k", "lima":"l", "mike":"m", "november":"n", "oscar":"o", "papa":"p", "quebec":"q", "romeo":"r", "sierra":"s", "tango":"t", "uniform":"u", "victor":"v", "whiskey":"w", "x-ray":"x", "yankee":"y", "zulu":"z" };
const KO_PHONETIC = { "기러기":"ㄱ", "나포리":"ㄴ", "도라지":"ㄷ", "로오마":"ㄹ", "미나리":"ㅁ", "바가지":"ㅂ", "서울":"ㅅ", "잉어":"ㅇ", "지게":"ㅈ", "치마":"ㅊ", "키다리":"ㅋ", "통신":"ㅌ", "파고다":"ㅍ", "한강":"ㅎ", "아버지":"ㅏ", "야자수":"ㅑ", "어머니":"ㅓ", "연못":"ㅕ", "오징어":"ㅗ", "요지경":"ㅛ", "우편":"ㅜ", "유달산":"ㅠ", "은방울":"ㅡ", "이순신":"ㅣ", "앵무새":"ㅐ", "엑스레이":"ㅔ" };const HANGUL_INITIAL_INDEX = { "ㄱ":0, "ㄲ":1, "ㄴ":2, "ㄷ":3, "ㄸ":4, "ㄹ":5, "ㅁ":6, "ㅂ":7, "ㅃ":8, "ㅅ":9, "ㅆ":10, "ㅇ":11, "ㅈ":12, "ㅉ":13, "ㅊ":14, "ㅋ":15, "ㅌ":16, "ㅍ":17, "ㅎ":18 };
const HANGUL_INITIAL_COMBINE = { "ㄱㄱ":"ㄲ", "ㄷㄷ":"ㄸ", "ㅂㅂ":"ㅃ", "ㅅㅅ":"ㅆ", "ㅈㅈ":"ㅉ" };
const HANGUL_MEDIAL_INDEX = { "ㅏ":0, "ㅐ":1, "ㅑ":2, "ㅒ":3, "ㅓ":4, "ㅔ":5, "ㅕ":6, "ㅖ":7, "ㅗ":8, "ㅘ":9, "ㅙ":10, "ㅚ":11, "ㅛ":12, "ㅜ":13, "ㅝ":14, "ㅞ":15, "ㅟ":16, "ㅠ":17, "ㅡ":18, "ㅢ":19, "ㅣ":20 };
const HANGUL_MEDIAL_COMBINE = { "ㅗㅏ":"ㅘ", "ㅗㅐ":"ㅙ", "ㅗㅣ":"ㅚ", "ㅜㅓ":"ㅝ", "ㅜㅔ":"ㅞ", "ㅜㅣ":"ㅟ", "ㅡㅣ":"ㅢ" };
const HANGUL_FINAL_INDEX = { "":0, "ㄱ":1, "ㄲ":2, "ㄳ":3, "ㄴ":4, "ㄵ":5, "ㄶ":6, "ㄷ":7, "ㄹ":8, "ㄺ":9, "ㄻ":10, "ㄼ":11, "ㄽ":12, "ㄾ":13, "ㄿ":14, "ㅀ":15, "ㅁ":16, "ㅂ":17, "ㅄ":18, "ㅅ":19, "ㅆ":20, "ㅇ":21, "ㅈ":22, "ㅊ":23, "ㅋ":24, "ㅌ":25, "ㅍ":26, "ㅎ":27 };
const HANGUL_FINAL_COMBINE = { "ㄱㅅ":"ㄳ", "ㄴㅈ":"ㄵ", "ㄴㅎ":"ㄶ", "ㄹㄱ":"ㄺ", "ㄹㅁ":"ㄻ", "ㄹㅂ":"ㄼ", "ㄹㅅ":"ㄽ", "ㄹㅌ":"ㄾ", "ㄹㅍ":"ㄿ", "ㄹㅎ":"ㅀ", "ㅂㅅ":"ㅄ" };

exports.init = function(_DB, _DIC){
	DB = _DB;
	DIC = _DIC;
};
exports.getTitle = function(){
	var R = new Lizard.Tail();
	var my = this;
	var means = [];
	var mdb = [];
	
	my.game.started = false;
	DB.kkutu_cw[my.rule.lang].find().on(function($box){
		var answers = {};
		var boards = [];
		var maps = [];
		var left = my.round;
		var pick, pi, i, j;
		var mParser = [];
		
		while(left){
			pick = $box[pi = Math.floor(Math.random() * $box.length)];
			// 남은 판이 없으면 가진 판만으로 진행한다. (그냥 return하면 게임이 영원히 시작되지 않는다)
			if(!pick) break;
			$box.splice(pi, 1);
			if(maps.includes(pick.map)) continue;
			means.push({});
			mdb.push({});
			maps.push(pick.map);
			boards.push(pick.data.split('|').map(function(item){ return item.split(','); }));
			left--;
		}
		for(i in boards){
			for(j in boards[i]){
				pi = boards[i][j];
				mParser.push(getMeaning(i, pi));
				answers[`${i},${pi[0]},${pi[1]},${pi[2]}`] = pi.pop();
			}
		}
		my.game.numQ = mParser.length;
		Lizard.all(mParser).then(function(){
			my.game.prisoners = {};
			my.game.answers = answers;
			my.game.boards = boards;
			my.game.means = means;
			my.game.mdb = mdb;
			R.go("①②③④⑤⑥⑦⑧⑨⑩");
		});
	});
	function getMeaning(round, bItem){
		var R = new Lizard.Tail();
		var word = bItem[4];
		var x = Number(bItem[0]), y = Number(bItem[1]);
		
		DB.kkutu[my.rule.lang].findOne([ '_id', word ]).on(function($doc){
			if(!$doc) return R.go(null);
			var rk = `${x},${y}`;
			var i, o;
			
			means[round][`${rk},${bItem[2]}`] = o = {
				count: 0,
				x: x, y: y,
				dir: Number(bItem[2]), len: Number(bItem[3]),
				type: $doc.type,
				theme: $doc.theme,
				mean: $doc.mean.replace(new RegExp(word.split('').map(function(w){ return w + "\\s?"; }).join(''), "g"), "★")
			};
			for(i=0; i<o.len; i++){
				rk = `${x},${y}`;
				if(!mdb[round][rk]) mdb[round][rk] = [];
				mdb[round][rk].push(o);
				if(o.dir) y++; else x++;
			}
			R.go(true);
		});
		return R;
	}
	return R;
};
exports.roundReady = function(){
	var my = this;
	
	if(!my.game.started){
		my.game.started = true;
		my.game.roundTime = my.time * 1000;
		my.byMaster('roundReady', {
			seq: my.game.seq
		}, true);
		setTimeout(my.turnStart, 2400);
	}else{
		my.roundEnd();
	}
};
exports.turnStart = function(){
	var my = this;
	
	my.game.late = false;
	my.game.roundAt = (new Date()).getTime();
	my.game.qTimer = setTimeout(my.turnEnd, my.game.roundTime);
	my.byMaster('turnStart', {
		boards: my.game.boards,
		means: my.game.means
	}, true);
	
	/*for(i in my.game.robots){
		my.readyRobot(my.game.robots[i]);
	}*/
};
function turnHint(){
	var my = this;
	
	my.byMaster('turnHint', {
		hint: my.game.hint[my.game.meaned++]
	}, true);
}
exports.turnEnd = function(){
	var my = this;
	var i;
	
	my.game.late = true;
	my.byMaster('turnEnd', {});
	my.game._rrt = setTimeout(my.roundReady, 2500);
};
exports.submit = function(client, text, data){
	var my = this;
	var obj, score, mbjs, mbj, jx, jy, v;
	var play = (my.game.seq ? my.game.seq.includes(client.id) : false) || client.robot;
	var i, j, key;
	var originalText = text;
	var morseDecoded;
	var morseMap;
	var composedText;

	if(!my.game.boards) return;
	if(!my.game.answers) return;
	if(!my.game.mdb) return;
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
	checkAnswer.call(my, client, text, data, play);
};
function checkAnswer(client, text, data, play){
	var my = this;
	var obj, score, mbjs, mbj, jx, jy, v;
	var i, j, key;

	if(!my.game.answers || !my.game.mdb) return;
	if(data && play){
		key = `${data[0]},${data[1]},${data[2]},${data[3]}`;
		obj = my.game.answers[key];
		mbjs = my.game.mdb[data[0]];
		if(!mbjs) return;
		if(obj && obj == text){
			score = text.length * 10;
			
			jx = Number(data[1]), jy = Number(data[2]);
			my.game.prisoners[key] = text;
			my.game.answers[key] = false;
			for(i=0; i<obj.length; i++){
				if(mbj = mbjs[`${jx},${jy}`]){
					for(j in mbj){
						key = [ data[0], mbj[j].x, mbj[j].y, mbj[j].dir ];
						if(++mbj[j].count == mbj[j].len){
							// 이미 해석된 정답이므로 모스/음성 기호 해석을 다시 거치지 않도록 checkAnswer를 바로 부른다.
							if(v = my.game.answers[key.join(',')]) setTimeout(function(v, key){ checkAnswer.call(my, client, v, key, true); }, 1, v, key);
						}
					}
				}
				if(data[3] == "1") jy++; else jx++;
			}
			client.game.score += score;
			client.publish('turnEnd', {
				target: client.id,
				pos: data,
				value: text,
				score: score
			});
			client.invokeWordPiece(text, 1.2);
			if(--my.game.numQ < 1){
				clearTimeout(my.game.qTimer);
				my.turnEnd();
			}
		}else client.send('turnHint', { value: text });
	}else{
		client.chat(text);
	}
}
exports.getScore = function(text, delay){
	var my = this;
	var rank = my.game.hum - my.game.primary + 3;
	var tr = 1 - delay / my.game.roundTime;
	var score = (rank * rank * 3) * ( 0.5 + 0.5 * tr );

	return Math.round(score * my.game.themeBonus);
};
/*exports.readyRobot = function(robot){
	var my = this;
	var level = robot.level;
	var delay, text;
	var board, data, obj;
	var i;
	
	if(my.game.late) return;
	clearTimeout(robot._timerSeek);
	clearTimeout(robot._timerCatch);
	if(robot._board == undefined) changeBoard();
	delay = ROBOT_SEEK_DELAY[level];
	if(Math.random() < ROBOT_CATCH_RATE[level]){
		robot._timerCatch = false;
		board = my.game.boards[robot._board];
		for(i in board){
			data = board[i];
			key = `${robot._board},${data[0]},${data[1]},${data[2]}`;
			if(obj = my.game.answers[key]){
				delay += obj.length * ROBOT_TYPE_COEF[level];
				robot._timerCatch = setTimeout(my.turnRobot, delay, robot, obj, key.split(','));
				break;
			}
		}
		if(!robot._timerCatch) changeBoard();
	}else if(Math.random() < 0.05){
		changeBoard();
	}
	robot._timerSeek = setTimeout(my.readyRobot, delay, robot);
	function changeBoard(){
		robot._board = Math.floor(Math.random() * my.game.boards.length);
	}
};*/
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