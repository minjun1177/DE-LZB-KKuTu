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
var TYL = require('./typing_const');
var Lizard = require('../../sub/lizard');
var DB;
var DIC;

var LONGWORD_MIN_LENGTH = 6;
var LONGWORD_MAX_LENGTH = 12;
var WORD_MIN_LENGTH = 2;
var WORD_MAX_LENGTH = 5;
var HARD_LENGTH = 4;
var LIST_LENGTH = 200;
var DOUBLE_VOWELS = [ 9, 10, 11, 14, 15, 16, 19 ];
var DOUBLE_TAILS = [ 3, 5, 6, 9, 10, 11, 12, 13, 14, 15, 18 ];

// const KO_MORSE = {".-..":"ㄱ", "..-.":"ㄴ", "-...":"ㄷ", "...-":"ㄹ", "--":"ㅁ", ".--":"ㅂ", "--.":"ㅅ", "-.-":"ㅇ", ".--.":"ㅈ", "-.-.":"ㅊ", "-..-":"ㅋ", "--..":"ㅌ", "---":"ㅍ", ".---":"ㅎ", ".":"ㅏ", "..":"ㅑ", "-":"ㅓ", "...":"ㅕ", ".-":"ㅗ", "-.":"ㅛ", "....":"ㅜ", ".-.":"ㅠ", "-..":"ㅡ", "..-":"ㅣ", "--.-":"ㅐ", "-.--":"ㅔ" };
// const EN_MORSE = { ".-": "a", "-...": "b", "-.-.": "c", "-..": "d", ".": "e", "..-.": "f", "--.": "g", "....": "h", "..": "i", ".---": "j", "-.-": "k", ".-..": "l", "--": "m", "-.": "n", "---": "o", ".--.": "p", "--.-": "q", ".-.": "r", "...": "s", "-": "t", "..-": "u", "...-": "v", ".--": "w", "-..-": "x", "-.--": "y", "--..": "z" };
// const HANGUL_INITIAL_INDEX = { "ㄱ":0, "ㄲ":1, "ㄴ":2, "ㄷ":3, "ㄸ":4, "ㄹ":5, "ㅁ":6, "ㅂ":7, "ㅃ":8, "ㅅ":9, "ㅆ":10, "ㅇ":11, "ㅈ":12, "ㅉ":13, "ㅊ":14, "ㅋ":15, "ㅌ":16, "ㅍ":17, "ㅎ":18 };
// const HANGUL_MEDIAL_INDEX = { "ㅏ":0, "ㅐ":1, "ㅑ":2, "ㅒ":3, "ㅓ":4, "ㅔ":5, "ㅕ":6, "ㅖ":7, "ㅗ":8, "ㅘ":9, "ㅙ":10, "ㅚ":11, "ㅛ":12, "ㅜ":13, "ㅝ":14, "ㅞ":15, "ㅟ":16, "ㅠ":17, "ㅡ":18, "ㅢ":19, "ㅣ":20 };
// const HANGUL_MEDIAL_COMBINE = { "ㅗㅏ":"ㅘ", "ㅗㅐ":"ㅙ", "ㅗㅣ":"ㅚ", "ㅜㅓ":"ㅝ", "ㅜㅔ":"ㅞ", "ㅜㅣ":"ㅟ", "ㅡㅣ":"ㅢ" };
// const HANGUL_FINAL_INDEX = { "":0, "ㄱ":1, "ㄲ":2, "ㄳ":3, "ㄴ":4, "ㄵ":5, "ㄶ":6, "ㄷ":7, "ㄹ":8, "ㄺ":9, "ㄻ":10, "ㄼ":11, "ㄽ":12, "ㄾ":13, "ㄿ":14, "ㅀ":15, "ㅁ":16, "ㅂ":17, "ㅄ":18, "ㅅ":19, "ㅆ":20, "ㅇ":21, "ㅈ":22, "ㅊ":23, "ㅋ":24, "ㅌ":25, "ㅍ":26, "ㅎ":27 };
// const HANGUL_FINAL_COMBINE = { "ㄱㅅ":"ㄳ", "ㄴㅈ":"ㄵ", "ㄴㅎ":"ㄶ", "ㄹㄱ":"ㄺ", "ㄹㅁ":"ㄻ", "ㄹㅂ":"ㄼ", "ㄹㅅ":"ㄽ", "ㄹㅌ":"ㄾ", "ㄹㅍ":"ㄿ", "ㄹㅎ":"ㅀ", "ㅂㅅ":"ㅄ" };

function traverse(func){
	var my = this;
	var i, o;
	
	for(i in my.game.seq){
		if(!(o = DIC[my.game.seq[i]])) continue;
		if(!o.game) continue;
		func(o);
	}
}
exports.init = function(_DB, _DIC){
	DB = _DB;
	DIC = _DIC;
};
exports.getTitle = function(){
	var R = new Lizard.Tail();
	var my = this;
	var i, j;
	// LZB - Added longword option, 코딩초보이슈, 이상한 로직이 있을 수 있음
	
	// if (my.opts.proverb && my.opts.longword) { // 둘다 누르면 안된다... 하지만 랜덤으로 나오게 수정 <- 코딩초보이슈 가능은 하지만 긴 단어때 속담처럼 나오는 이슈
	// 	// if (Math.random() < 0.5){ // 속담
	// 	if (false) { // for testing
	// 		pick(TYL.PROVERBS[my.rule.lang]);
	// 	} else { // 긴 단어
	// 		DB.kkutu[my.rule.lang].find([ '_id', new RegExp(`^.{${LONGWORD_MIN_LENGTH},${LONGWORD_MAX_LENGTH}}$`) ], [ 'hit', { $gte: 1 } ]).limit(416).on(function($res){
	// 			pick($res.map(function(item){ return item._id; }));
	// 		});

	// 	}
	// }

	if(my.opts.proverb) pick(TYL.PROVERBS[my.rule.lang]); // 속담

	else if (my.opts.longword) { // 긴 단어
		DB.kkutu[my.rule.lang].find([ '_id', new RegExp(`^.{${LONGWORD_MIN_LENGTH},${LONGWORD_MAX_LENGTH}}$`) ], [ 'hit', { $gte: 1 } ]).limit(416).on(function($res){
			pick($res.map(function(item){ return item._id; }));
		});
	}

	 // LZB - Added hard word
	else if (my.opts.hard) { // 어려운 단어
		pickHard();
	}

	else DB.kkutu[my.rule.lang].find([ '_id', new RegExp(`^.{${WORD_MIN_LENGTH},${WORD_MAX_LENGTH}}$`) ], [ 'hit', { $gte: 1 } ]).limit(416).on(function($res){ // 일반 단어
		pick($res.map(function(item){ return item._id; }));
	});
	function pick(list){
		var data = [];
		var len = list.length;
		var arr;
		
		for(i=0; i<my.round; i++){
			arr = [];
			for(j=0; j<LIST_LENGTH; j++){
				arr.push(list[Math.floor(Math.random() * len)]);
			}
			data.push(arr);
		}
		my.game.lists = data;
		R.go("①②③④⑤⑥⑦⑧⑨⑩");
	}

	function pickHard(){ // LZB - Added hard word
		var data = [];
		var arr, tmp, k;

		for (i=0; i<my.round; i++){
			arr = [];
			for (j=0; j<LIST_LENGTH; j++){
				// String.fromCharCode(44032 + Math.floor(Math.random() * (55203 - 44032 + 1)));
				tmp = String.fromCharCode(44032 + Math.floor(Math.random() * (55203 - 44032 + 1)));
				for (k=0; k<HARD_LENGTH - 1; k++){
					tmp = tmp.concat(String.fromCharCode(44032 + Math.floor(Math.random() * (55203 - 44032 + 1))));
				}
				arr.push(tmp);
			}
			data.push(arr);
		}
		my.game.lists = data;
		R.go("①②③④⑤⑥⑦⑧⑨⑩");
	}

	traverse.call(my, function(o){
		o.game.spl = 0;
	});
	return R;
};
exports.roundReady = function(){
	var my = this;
	var scores = {};
	
	if(!my.game.lists) return;
	
	my.game.round++;
	my.game.roundTime = my.time * 1000;
	if(my.game.round <= my.round){
		my.game.clist = my.game.lists.shift();
		my.byMaster('roundReady', {
			round: my.game.round,
			list: my.game.clist
		}, true);
		setTimeout(my.turnStart, 2400);
	}else{
		traverse.call(my, function(o){
			scores[o.id] = Math.round(o.game.spl / my.round);
		});
		my.roundEnd({ scores: scores });
	}
};
exports.turnStart = function(){
	var my = this;
	
	my.game.late = false;
	traverse.call(my, function(o){
		o.game.miss = 0;
		o.game.index = 0;
		o.game.semi = 0;
	});
	my.game.qTimer = setTimeout(my.turnEnd, my.game.roundTime);
	my.byMaster('turnStart', { roundTime: my.game.roundTime }, true);
};
exports.turnEnd = function(){
	var my = this;
	var spl = {};
	var sv;
	
	my.game.late = true;
	traverse.call(my, function(o){
		sv = (o.game.semi + o.game.index - o.game.miss) / my.time * 60;
		spl[o.id] = Math.round(sv);
		o.game.spl += sv;
	});
	my.byMaster('turnEnd', {
		ok: false,
		speed: spl
	});
	my.game._rrt = setTimeout(my.roundReady, (my.game.round == my.round) ? 3000 : 10000);
};
exports.submit = function(client, text){
	var my = this;
	var score;
	// var originalText = text;
	// var morseDecoded;
	// var morseMap;
	// var composedText;

	if(!client.game) return;
	if(!my.game.clist) return;
	// 관전자 등 게임에 참여하지 않는 사람의 입력은 채팅으로 처리한다.
	if(!my.game.seq || !my.game.seq.includes(client.id)) return client.chat(text);
	// if(my.opts.morse && (my.rule.lang == "ko" || my.rule.lang == "en")){ // LZB - Added Morse
	// 	morseMap = my.rule.lang == "ko" ? KO_MORSE : EN_MORSE;
	// 	morseDecoded = decodeMorseInput(text, morseMap);
	// 	if(morseDecoded){
	// 		if(my.rule.lang == "ko"){
	// 			composedText = composeHangulInput(morseDecoded);
	// 			text = composedText || morseDecoded;
	// 		}else{
	// 			text = morseDecoded;
	// 		}
	// 	}
	// 	else if(!client.robot) return client.publish('turnError', { code: 488, value: originalText }, true);
	// }else if(my.rule.lang == "ko"){
	// 	composedText = composeHangulInput(text);
	// 	if(composedText) text = composedText;
	// }

	if(my.game.clist[client.game.index] == text){
		score = my.getScore(text);
		
		client.game.semi += score;
		client.game.score += score;
		client.publish('turnEnd', {
			target: client.id,
			ok: true,
			value: text,
			score: score
		}, true);
		client.invokeWordPiece(text, 0.5);
	}else{
		client.game.miss++;
		client.send('turnEnd', { error: true });
	}
	if(!my.game.clist[++client.game.index]) client.game.index = 0;
};
exports.getScore = function(text){
	var my = this;
	var i, len = text.length;
	var r = 0, s, t;
	
	switch(my.rule.lang){
		case 'ko':
			for(i=0; i<len; i++){
				s = text.charCodeAt(i);
				if(s < 44032){
					r++;
				}else{
					t = (s - 44032) % 28;
					r += t ? 3 : 2;
					if(DOUBLE_VOWELS.includes(Math.floor(((text.charCodeAt(i) - 44032) % 588) / 28))) r++;
					if(DOUBLE_TAILS.includes(t)) r++;
				}
			}
			return r;
		case 'en': return len;
		default: return r;
	}
};
function escapeHTML(str) {
    return (str || '').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
// function decodeMorseInput(input, morseMap){ // LZB - Added Morse
// 	var normalized;
// 	var tokens;
// 	var output = "";
// 	var i, token, parts, j, part, ch;
// 	var map = morseMap || EN_MORSE;
//
// 	if(typeof input !== "string") return null;
// 	normalized = input.trim();
// 	if(!normalized) return null;
// 	if(!/^[\.\-\s\/|]+$/.test(normalized)) return null;
//
// 	normalized = normalized.replace(/\|/g, "/");
// 	tokens = normalized.split(/\s+/);
// 	for(i=0; i<tokens.length; i++){
// 		token = tokens[i];
// 		if(!token) continue;
// 		parts = token.split("/");
// 		for(j=0; j<parts.length; j++){
// 			part = parts[j];
// 			if(!part) continue;
// 			ch = map[part];
// 			if(!ch) return null;
// 			output += ch;
// 		}
// 	}
//
// 	return output || null;
// }
// function composeHangulInput(input){
// 	var chars;
// 	var out = "";
// 	var i = 0;
// 	var initial, medialRes, finalRes;
// 	var lead, vowel, tail;
//
// 	if(typeof input !== "string") return input;
// 	chars = Array.from(input);
//
// 	while(i < chars.length){
// 		lead = chars[i];
// 		initial = HANGUL_INITIAL_INDEX[lead];
// 		if(initial === undefined){
// 			out += lead;
// 			i++;
// 			continue;
// 		}
//
// 		medialRes = readMedial(chars, i + 1);
// 		if(!medialRes){
// 			out += lead;
// 			i++;
// 			continue;
// 		}
//
// 		vowel = medialRes.medial;
// 		finalRes = readFinal(chars, medialRes.next);
// 		tail = finalRes ? finalRes.final : "";
// 		out += String.fromCharCode(0xAC00 + (initial * 21 + HANGUL_MEDIAL_INDEX[vowel]) * 28 + HANGUL_FINAL_INDEX[tail]);
// 		i = finalRes ? finalRes.next : medialRes.next;
// 	}
//
// 	return out;
// }
// function readMedial(chars, index){
// 	var first = chars[index];
// 	var second = chars[index + 1];
// 	var combined;
//
// 	if(first == null) return null;
// 	if(HANGUL_MEDIAL_INDEX[first] === undefined) return null;
//
// 	if(second != null){
// 		combined = HANGUL_MEDIAL_COMBINE[first + second];
// 		if(combined) return { medial: combined, next: index + 2 };
// 	}
// 	return { medial: first, next: index + 1 };
// }
// function readFinal(chars, index){
// 	var first = chars[index];
// 	var second = chars[index + 1];
// 	var cluster;
//
// 	if(first == null) return null;
// 	if(HANGUL_FINAL_INDEX[first] === undefined || HANGUL_FINAL_INDEX[first] === 0) return null;
//
// 	if(second != null){
// 		cluster = HANGUL_FINAL_COMBINE[first + second];
// 		if(cluster && HANGUL_MEDIAL_INDEX[chars[index + 2]] === undefined){
// 			return { final: cluster, next: index + 2 };
// 		}
// 	}
//
// 	if(HANGUL_MEDIAL_INDEX[second] !== undefined) return null;
// 	return { final: first, next: index + 1 };
// }
