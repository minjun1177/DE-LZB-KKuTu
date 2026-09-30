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

var Web		 = require("request");
var MainDB	 = require("../db");
var JLog	 = require("../../sub/jjlog");
var GLOBAL	 = require("../../sub/global.json");
var Const	 = require("../../const");
var DB		 = require("../db");
var UserLock = require("../../sub/userlock");

var ENHANCE_COST = 160; // 강화할때 드는 돈
var ENHANCE_SUCCESS_RATE = 0.06; // 6% 누군가가 0.6%를 제안했는데 그렇게 낮출 필요는 없어 보인다, 하지만 어느 게임에서는 서서히 낮아지고 심지어는 파괴가 된다고는 하는데 일단 고정
var ENHANCE_STEP_G = 0.2; // gEXP, gMNY는 30씩 올라간다 너무 크거나 작지 않을까
var ENHANCE_STEP_H = 150; // hEXP, gEXP는 150씩 올라간다 

function obtain($user, key, value, term, addValue){
	var now = (new Date()).getTime();
	
	if(term){
		if($user.box[key]){
			if(addValue) $user.box[key].value += value;
			else $user.box[key].expire += term;
		}else $user.box[key] = { value: value, expire: Math.round(now * 0.001 + term) }
	}else{
		$user.box[key] = ($user.box[key] || 0) + value;
	}
}
function consume($user, key, value, force){
	var bd = $user.box[key];
	
	if(bd.value){
		// 기한이 끝날 때까지 box 자체에서 사라지지는 않는다. 기한 만료 여부 확인 시점: 1. 로그인 2. box 조회 3. 게임 결과 반영 직전 4. 해당 항목 사용 직전
		if((bd.value -= value) <= 0){
			if(force || !bd.expire) delete $user.box[key];
		}
	}else{
		if(($user.box[key] -= value) <= 0) delete $user.box[key];
	}
}
function getNicknameFilter(){
	var r = GLOBAL.NICKNAME_LIMIT && GLOBAL.NICKNAME_LIMIT.REGEX;
	
	if(!Array.isArray(r) || !r[0]) return null;
	try{
		return new RegExp(r[0], r[1] || "");
	}catch(e){
		JLog.warn(`Invalid NICKNAME_LIMIT.REGEX: ${e}`);
		return null;
	}
}
function shuffle(arr){
	var i, j, t;
	var r = arr.slice();
	
	for(i=r.length-1; i>0; i--){
		j = Math.floor(Math.random() * (i + 1));
		t = r[i]; r[i] = r[j]; r[j] = t;
	}
	return r;
}
// 돈이 바뀌는 요청은 읽었을 때의 돈이 그대로일 때만 저장한다. (동시 요청으로 돈/아이템이 복사되는 것을 막는다)
function updateUserMoney(uid, prevMoney, sets, res, callback){
	var q = MainDB.users.update([ '_id', uid ], [ 'money', prevMoney ]);
	
	q.set.apply(q, sets).on(function($res){
		if($res && $res.rowCount === 0) return res.json({ error: 400 });
		callback();
	}, null, function(){
		res.json({ error: 400 });
	});
}
function getEnhanceableOptions(options){
	var key;
	var list = [];
	
	if(!options) return list;
	for(key in options){
		if(key == "gif") continue;
		if(key == "gEXP" || key == "hEXP" || key == "gMNY" || key == "hMNY") list.push(key);
	}
	return list;
}

exports.run = function(Server, page){

Server.get("/cf-notice", function(req, res){
	page(req, res, "cf-notice", {
		'KO_INJEONG': Const.KO_INJEONG
	});
});

Server.get("/search", function(req, res){ // LZB - Added for word search
	page(req, res, "search", {
		'KO_INJEONG': Const.KO_INJEONG
	});
});
Server.get("/search/words", function(req, res){
	var theme = (req.query.theme || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
	var DB = MainDB.kkutu['ko'];
	
	if(!theme) return res.send({ error: 400, message: "theme is required" });
	if(!DB || !DB.find) return res.send({ error: 500 });
	
	DB.find([ 'theme', new RegExp("(^|,)" + theme + "(,|$)") ]).limit([ '_id', true ]).on(function($docs){
		if(!$docs) return res.send({ error: 404, words: [] });
		res.send({ words: $docs.map(function(v){ return v._id; }) });
	});
});
Server.get("/box", function(req, res){
	if(req.session.profile){
		/*if(Const.ADMIN.indexOf(req.session.profile.id) == -1){
			return res.send({ error: 555 });
		}*/
	}else{
		return res.send({ error: 400 });
	}
	MainDB.users.findOne([ '_id', req.session.profile.id ]).limit([ 'box', true ]).on(function($body){
		if(!$body){
			res.send({ error: 400 });
		}else{
			res.send($body.box);
		}
	});
});
Server.get("/help", function(req, res){
	page(req, res, "help", {
		'KO_INJEONG': Const.KO_INJEONG
	});
});
Server.get("/ranking", function(req, res){
	var pg = Number(req.query.p);
	var id = req.query.id;
	
	if(id){
		MainDB.redis.getSurround(id, 15).then(function($body){
			res.send($body);
		});
	}else{
		if(isNaN(pg)) pg = 0;
		MainDB.redis.getPage(pg, 15).then(function($body){
			res.send($body);
		});
	}
});
Server.get("/injeong/:word", function(req, res){
	if(!req.session.profile) return res.send({ error: 402 });
	var word = req.params.word;
	var theme = req.query.theme;
	var now = Date.now();
	
	if(now - req.session.injBefore < 2000) return res.send({ error: 429 });
	req.session.injBefore = now;
	
	MainDB.kkutu['ko'].findOne([ '_id', word.replace(/[^가-힣0-9]/g, "") ]).on(function($word){
		if($word) return res.send({ error: 409 });
		MainDB.kkutu_injeong.findOne([ '_id', word ]).on(function($ij){
			if($ij){
				if($ij.theme == '~') return res.send({ error: 406 });
				else return res.send({ error: 403 });
			}
			Web.get("https://namu.moe/w/" + encodeURI(word), function(err, _res){
				if(err) return res.send({ error: 400 });
				else if(_res.statusCode != 200) return res.send({ error: 405 });
				MainDB.kkutu_injeong.insert([ '_id', word ], [ 'theme', theme ], [ 'createdAt', now ], [ 'writer', req.session.profile.id ]).on(function($res){
					res.send({ message: "OK" });
				});
			});
		});
	});
});
Server.get("/cf/:word", function(req, res){
	res.send(getCFRewards(req.params.word, Number(req.query.l || 0), req.query.b == "1"));
});
Server.get("/shop", function(req, res){
	MainDB.kkutu_shop.find().limit([ 'cost', true ], [ 'term', true ], [ 'group', true ], [ 'options', true ], [ 'updatedAt', true ]).on(function($goods){
		res.json({ goods: $goods });
	});
	// res.json({ error: 555 });
});


Server.get("/v2", function(req, res){
	var server = req.query.server;
	
	//볕뉘 수정 구문삭제(220~229, 240)
	DB.session.findOne([ '_id', req.session.id ]).on(function($ses){
		// var sid = (($ses || {}).profile || {}).sid || "NULL";
		if(global.isPublic){
			onFinish($ses);
			// DB.jjo_session.findOne([ '_id', sid ]).limit([ 'profile', true ]).on(onFinish);
		}else{
			if($ses) $ses.profile.sid = $ses._id;
			onFinish($ses);
		}
	});
	function onFinish($doc){
		var id = req.session.id;

		if($doc){
			req.session.profile = $doc.profile;
			id = $doc.profile.sid;
		}else{
			delete req.session.profile;
		}
		page(req, res, "v2", {
			_page: "kkutu",
			_id: id,
			PORT: Const.MAIN_PORTS[server],
			ROOM_PORT: Const.ROOM_PORTS[server],
			HOST: req.hostname,
			PROTOCOL: Const.IS_SECURED || Const.WAF ? "wss" : "ws",
			TEST: req.query.test,
			MOREMI_PART: Const.MOREMI_PART,
			AVAIL_EQUIP: Const.AVAIL_EQUIP,
			CATEGORIES: Const.CATEGORIES,
			GROUPS: Const.GROUPS,
			MODE: Const.GAME_TYPE,
			RULE: Const.RULE,
			OPTIONS: Const.OPTIONS,
			NICKNAME_LIMIT: GLOBAL.NICKNAME_LIMIT,
			KO_INJEONG: Const.KO_INJEONG,
			EN_INJEONG: Const.EN_INJEONG,
			KO_THEME: Const.KO_THEME,
			EN_THEME: Const.EN_THEME,
			IJP_EXCEPT: Const.IJP_EXCEPT,
			ogImage: "https://kkutu.delzb.app/img/kkutu/logo.png",
			ogURL: "https://kkutu.delzb.app/",
			ogTitle: "글자로 놀자! 끄투 온라인",
			ogDescription: "끝말잇기가 이렇게 박진감 넘치는 게임이었다니!"
				});
			}
		});

Server.get("/v3", function(req, res){
	var server = req.query.server;
	
	//볕뉘 수정 구문삭제(220~229, 240)
	DB.session.findOne([ '_id', req.session.id ]).on(function($ses){
		// var sid = (($ses || {}).profile || {}).sid || "NULL";
		if(global.isPublic){
			onFinish($ses);
			// DB.jjo_session.findOne([ '_id', sid ]).limit([ 'profile', true ]).on(onFinish);
		}else{
			if($ses) $ses.profile.sid = $ses._id;
			onFinish($ses);
		}
	});
	function onFinish($doc){
		var id = req.session.id;

		if($doc){
			req.session.profile = $doc.profile;
			id = $doc.profile.sid;
		}else{
			delete req.session.profile;
		}
		page(req, res, "v3", {
			_page: "kkutu",
			_id: id,
			PORT: Const.MAIN_PORTS[server],
			ROOM_PORT: Const.ROOM_PORTS[server],
			HOST: req.hostname,
			PROTOCOL: Const.IS_SECURED || Const.WAF ? "wss" : "ws",
			TEST: req.query.test,
			MOREMI_PART: Const.MOREMI_PART,
			AVAIL_EQUIP: Const.AVAIL_EQUIP,
			CATEGORIES: Const.CATEGORIES,
			GROUPS: Const.GROUPS,
			MODE: Const.GAME_TYPE,
			RULE: Const.RULE,
			OPTIONS: Const.OPTIONS,
			NICKNAME_LIMIT: GLOBAL.NICKNAME_LIMIT,
			KO_INJEONG: Const.KO_INJEONG,
			EN_INJEONG: Const.EN_INJEONG,
			KO_THEME: Const.KO_THEME,
			EN_THEME: Const.EN_THEME,
			IJP_EXCEPT: Const.IJP_EXCEPT,
			ogImage: "https://kkutu.delzb.app/img/kkutu/logo.png",
			ogURL: "https://kkutu.delzb.app/",
			ogTitle: "글자로 놀자! 끄투 온라인",
			ogDescription: "끝말잇기가 이렇게 박진감 넘치는 게임이었다니!"
				});
			}
		});


// POST
Server.post("/profile", function(req, res){
	let nickname = req.body.nickname;
	const exordial = req.body.exordial;
	const filter = getNicknameFilter();

	if(!req.session.profile) return res.send({ error: 400 });
	// body-parser(extended)는 배열/객체도 만들 수 있으므로 문자열만 받는다.
	if(exordial !== undefined && typeof exordial !== 'string') return res.send({ error: 400 });
	if(nickname !== undefined && typeof nickname !== 'string') return res.send({ error: 400 });
	
	if(exordial !== undefined) MainDB.users.update([ '_id', req.session.profile.id ]).set([ 'exordial', exordial.slice(0, 100) ]).on();
	if(!nickname) return res.send({ result: 200 });

	// 클라이언트에서만 하던 닉네임 규칙 검사를 서버에서도 한다. (HTML 특수문자 등이 닉네임에 들어가지 않도록)
	if(filter) nickname = nickname.replace(filter, "");
	nickname = nickname.replace(/\s+/g, " ").trim();
	if(nickname.length > 12) nickname = nickname.slice(0, 12).trim();
	if(!nickname) return res.send({ error: 400 });
	MainDB.users.findOne([ 'nickname', nickname ]).on(function(data){
		if(data) return res.send({ error: 456 });
		MainDB.users.findOne([ '_id', req.session.profile.id ]).on(function(requester){
			const now = Number(new Date());
			if(!requester) return res.send({ error: 400 });
			if(GLOBAL.NICKNAME_LIMIT.TERM > 0){
				const changedDate = new Date(Number(requester.nickChanged));
				
				changedDate.setDate(changedDate.getDate() + GLOBAL.NICKNAME_LIMIT.TERM);
				if(now < Number(changedDate)) return res.send({ error: 457 });
			}
			
			MainDB.users.update([ '_id', req.session.profile.id ]).set([ 'nickname', nickname ], [ 'nickChanged', now ]).on();
			req.session.profile = { ...req.session.profile, name: nickname, title: nickname, nickname };
			MainDB.session.update([ '_id', req.session.id ]).set([ 'profile', req.session.profile ]).on();
			return res.send({ result: 200 });
		});
	});
});
Server.post("/buy/:id", function(req, res){
	if(req.session.profile){
		var uid = req.session.profile.id;
		var gid = req.params.id;
		
		UserLock.run(uid, res, function(){
		MainDB.kkutu_shop.findOne([ '_id', gid ]).on(function($item){
			if(!$item) return res.json({ error: 400 });
			if($item.cost < 0) return res.json({ error: 400 });
			MainDB.users.findOne([ '_id', uid ]).limit([ 'money', true ], [ 'box', true ]).on(function($user){
				if(!$user) return res.json({ error: 400 });
				if(!$user.box) $user.box = {};
				var postM = $user.money - $item.cost;
				
				if(postM < 0) return res.send({ result: 400 });
				
				obtain($user, gid, 1, $item.term);
				updateUserMoney(uid, $user.money, [
					[ 'money', postM ],
					[ 'box', $user.box ]
				], res, function(){
					res.send({ result: 200, money: postM, box: $user.box });
					JLog.log("[PURCHASED] " + gid + " by " + uid);
					// HIT를 올리는 데에 동시성 문제가 발생한다. 조심하자.
					MainDB.kkutu_shop.update([ '_id', gid ]).set([ 'hit', $item.hit + 1 ]).on();
				});
			});
		});
		});
	}else res.json({ error: 423 });
});
Server.post("/equip/:id", function(req, res){
	if(!req.session.profile) return res.json({ error: 400 });
	var uid = req.session.profile.id;
	var gid = req.params.id;
	var isLeft = req.body.isLeft == "true";
	var now = Date.now() * 0.001;
	
	UserLock.run(uid, res, function(){
	MainDB.users.findOne([ '_id', uid ]).limit([ 'box', true ], [ 'equip', true ]).on(function($user){
		if(!$user) return res.json({ error: 400 });
		if(!$user.box) $user.box = {};
		if(!$user.equip) $user.equip = {};
		var q = $user.box[gid], r;
		
		MainDB.kkutu_shop.findOne([ '_id', gid ]).limit([ 'group', true ]).on(function($item){
			if(!$item) return res.json({ error: 430 });
			if(!Const.AVAIL_EQUIP.includes($item.group)) return res.json({ error: 400 });
			
			var part = $item.group;
			if(part.substr(0, 3) == "BDG") part = "BDG";
			if(part == "Mhand") part = isLeft ? "Mlhand" : "Mrhand";
			var qid = $user.equip[part];
			
			if(qid){
				r = $user.box[qid];
				if(r && r.expire){
					obtain($user, qid, 1, r.expire, true);
				}else{
					obtain($user, qid, 1, now + $item.term, true);
				}
			}
			if(qid == $item._id){
				delete $user.equip[part];
			}else{
				if(!q) return res.json({ error: 430 });
				consume($user, gid, 1);
				$user.equip[part] = $item._id;
			}
			MainDB.users.update([ '_id', uid ]).set([ 'box', $user.box ], [ 'equip', $user.equip ]).on(function($res){
				res.send({ result: 200, box: $user.box, equip: $user.equip });
			});
		});
	});
	});
});
Server.post("/payback/:id", function(req, res){
	if(!req.session.profile) return res.json({ error: 400 });
	var uid = req.session.profile.id;
	var gid = req.params.id;
	var isDyn = gid.charAt() == '$';
	
	UserLock.run(uid, res, function(){
	MainDB.users.findOne([ '_id', uid ]).limit([ 'money', true ], [ 'box', true ]).on(function($user){
		if(!$user) return res.json({ error: 400 });
		if(!$user.box) $user.box = {};
		var q = $user.box[gid];
		var prevMoney = $user.money;
		
		if(!q) return res.json({ error: 430 });
		MainDB.kkutu_shop.findOne([ '_id', isDyn ? gid.slice(0, 4) : gid ]).limit([ 'cost', true ]).on(function($item){
			if(!$item) return res.json({ error: 430 });
			
			consume($user, gid, 1, true);
			$user.money = Number($user.money) + Math.round(0.2 * Number($item.cost));
			updateUserMoney(uid, prevMoney, [ [ 'money', $user.money ], [ 'box', $user.box ] ], res, function(){
				res.send({ result: 200, box: $user.box, money: $user.money });
			});
		});
	});
	});
});
Server.post("/enhance/:id", function(req, res){
	if(!req.session.profile) return res.json({ error: 400 });
	var uid = req.session.profile.id;
	var gid = req.params.id;
	var isDyn = gid.charAt() == '$';
	
	UserLock.run(uid, res, function(){
	MainDB.users.findOne([ '_id', uid ]).limit([ 'money', true ], [ 'box', true ], [ 'equip', true ], [ 'kkutu', true ]).on(function($user){
		if(!$user) return res.json({ error: 400 });
		var prevMoney = $user.money;
		if(!$user.box) $user.box = {};
		if(!$user.equip) $user.equip = {};
		if(!$user.kkutu) $user.kkutu = {};
		if(!$user.kkutu.enhance) $user.kkutu.enhance = {};
		var enhance = $user.kkutu.enhance;
		var q = $user.box[gid];
		
		if(!q) return res.json({ error: 430 });
		MainDB.kkutu_shop.findOne([ '_id', isDyn ? gid.slice(0, 4) : gid ]).limit([ 'group', true ], [ 'options', true ]).on(function($item){
			var part;
			var opts;
			var chance;
			var picked = null;
			var step = 0;
			var success;
			
			if(!$item) return res.json({ error: 430 });
			part = $item.group;
			if(part.substr(0, 3) == "BDG") part = "BDG";
			if(part == "Mhand"){
				if($user.equip['Mlhand'] == gid || $user.equip['Mrhand'] == gid) return res.json({ error: 426 });
			}else{
				if($user.equip[part] == gid) return res.json({ error: 426 });
			}
			opts = getEnhanceableOptions($item.options);
			if(!opts.length) return res.json({ error: 400 });
			if(Number($user.money) < ENHANCE_COST) return res.json({ error: 407 });
			
			$user.money = Number($user.money) - ENHANCE_COST;
			chance = Math.random();
			success = chance < ENHANCE_SUCCESS_RATE;
			if(success){
				picked = opts[Math.floor(Math.random() * opts.length)];
				step = (picked.charAt(0) == 'g') ? ENHANCE_STEP_G : ENHANCE_STEP_H;
				if(!enhance[gid]) enhance[gid] = {};
				enhance[gid][picked] = Number(enhance[gid][picked] || 0) + step;
			}
			updateUserMoney(uid, prevMoney, [
				[ 'money', $user.money ],
				[ 'kkutu', $user.kkutu ]
			], res, function(){
				res.send({
					result: 200,
					success: success,
					option: picked,
					optionType: picked ? picked.charAt(0) : null,
					total: picked ? Number(enhance[gid][picked] || 0) : 0,
					cost: ENHANCE_COST,
					chance: ENHANCE_SUCCESS_RATE,
					box: $user.box,
					money: $user.money,
					enhance: enhance
				});
			});
		});
	});
	});
});
function blendWord(word){
	var lang = parseLanguage(word);
	var i, kl = [];
	var kr = [];
	
	if(lang == "en") return String.fromCharCode(97 + Math.floor(Math.random() * 26));
	if(lang == "ko"){
		for(i=word.length-1; i>=0; i--){
			var k = word.charCodeAt(i) - 0xAC00;
			
			kl.push([ Math.floor(k/28/21), Math.floor(k/28)%21, k%28 ]);
		}
		shuffle([0,1,2]).forEach((v, i) => {
			kr.push(kl[v][i]);
		});
		return String.fromCharCode(((kr[0] * 21) + kr[1]) * 28 + kr[2] + 0xAC00);
	}
}
function parseLanguage(word){
	return word.match(/[a-zA-Z]/) ? "en" : "ko";
}
Server.post("/cf", function(req, res){
	if(!req.session.profile) return res.json({ error: 400 });
	var uid = req.session.profile.id;
	var tray = String(req.body.tray || "").split('|');
	var i, o;
	
	if(tray.length < 1 || tray.length > 6) return res.json({ error: 400 });
	// 글자 조각($WPA/B/C + 글자 한 개)만 재료로 쓸 수 있다.
	// (다른 아이템 키를 넣으면 level이 음수가 되어 비용이 음수 = 돈이 늘어나는 문제가 있었다)
	if(!tray.every(function(item){ return /^\$WP[ABC][a-z가-힣]$/.test(item); })) return res.json({ error: 400 });
	UserLock.run(uid, res, function(){
	MainDB.users.findOne([ '_id', uid ]).limit([ 'money', true ], [ 'box', true ]).on(function($user){
		if(!$user) return res.json({ error: 400 });
		if(!$user.box) $user.box = {};
		var req = {}, word = "", level = 0;
		var prevMoney = $user.money;
		var cfr, gain = [];
		var blend;
		
		for(i in tray){
			word += tray[i].slice(4);
			level += 68 - tray[i].charCodeAt(3);
			req[tray[i]] = (req[tray[i]] || 0) + 1;
			if(($user.box[tray[i]] || 0) < req[tray[i]]) return res.json({ error: 434 });
		}
		MainDB.kkutu[parseLanguage(word)].findOne([ '_id', word ]).on(function($dic){
			if(!$dic){
				if(word.length == 3){
					blend = true;
				}else return res.json({ error: 404 });
			}
			cfr = getCFRewards(word, level, blend);
			if($user.money < cfr.cost) return res.json({ error: 407 });
			for(i in req) consume($user, i, req[i]);
			for(i in cfr.data){
				o = cfr.data[i];
				
				if(Math.random() >= o.rate) continue;
				if(o.key.charAt(4) == "?"){
					o.key = o.key.slice(0, 4) + (blend ? blendWord(word) : word.charAt(Math.floor(Math.random() * word.length)));
				}
				obtain($user, o.key, o.value, o.term);
				gain.push(o);
			}
			$user.money -= cfr.cost;
			updateUserMoney(uid, prevMoney, [ [ 'money', $user.money ], [ 'box', $user.box ] ], res, function(){
				res.send({ result: 200, box: $user.box, money: $user.money, gain: gain });
			});
		});
	});
	});
	// res.send(getCFRewards(req.params.word, Number(req.query.l || 0)));
});
Server.get("/dict/:word", function(req, res){
    var word = req.params.word;
    var lang = req.query.lang;
    var DB = MainDB.kkutu[lang];
    
    if(!DB) return res.send({ error: 400 });
    if(!DB.findOne) return res.send({ error: 400 });
    DB.findOne([ '_id', word ]).on(function($word){
        if(!$word) return res.send({ error: 404 });
        res.send({
            word: $word._id,
            mean: $word.mean,
            theme: $word.theme,
            type: $word.type
        });
    });
});

};
function getCFRewards(word, level, blend){
	var R = [];
	var f = {
		len: word.length, // 최대 6
		lev: level // 최대 18
	};
	var cost = 20 * f.lev;
	var wur = f.len / 36; // 최대 2.867
	
	if(blend){
		if(wur >= 0.5){
			R.push({ key: "$WPA?", value: 1, rate: 1 });
		}else if(wur >= 0.35){
			R.push({ key: "$WPB?", value: 1, rate: 1 });
		}else if(wur >= 0.05){
			R.push({ key: "$WPC?", value: 1, rate: 1 });
		}
		cost = Math.round(cost * 0.2);
	}else{
		R.push({ key: "dictPage", value: Math.round(f.len * 0.6), rate: 1 });
		R.push({ key: "boxB4", value: 1, rate: Math.min(1, f.lev / 7) });
		if(f.lev >= 5){
			R.push({ key: "boxB3", value: 1, rate: Math.min(1, f.lev / 15) });
			cost += 10 * f.lev;
			wur += f.lev / 20;
		}
		if(f.lev >= 10){
			R.push({ key: "boxB2", value: 1, rate: Math.min(1, f.lev / 30) });
			cost += 20 * f.lev;
			wur += f.lev / 10;
		}
		if(wur >= 0.05){
			if(wur > 1) R.push({ key: "$WPC?", value: Math.floor(wur), rate: 1 });
			R.push({ key: "$WPC?", value: 1, rate: wur % 1 });
		}
		if(wur >= 0.35){
			if(wur > 2) R.push({ key: "$WPB?", value: Math.floor(wur / 2), rate: 1 });
			R.push({ key: "$WPB?", value: 1, rate: (wur / 2) % 1 });
		}
		if(wur >= 0.5){
			R.push({ key: "$WPA?", value: 1, rate: wur / 3 });
		}
	}
	return { data: R, cost: cost };
}