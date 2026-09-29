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
 * 볕뉘 수정사항:
 * Login 을 Passport 로 수행하기 위한 수정
 */

var WS		 = require("ws");
var Express	 = require("express");
var Exession = require("express-session");
var Redission= require("connect-redis")(Exession);
var Redis	 = require("redis");
var Parser	 = require("body-parser");
var DDDoS	 = require("dddos");
var Server	 = Express();
var DB		 = require("./db");
//볕뉘 수정 구문삭제 (28)
var JLog	 = require("../sub/jjlog");
var WebInit	 = require("../sub/webinit");
var GLOBAL	 = require("../sub/global.json");
var Secure = require('../sub/secure');
//볕뉘 수정
var passport = require('passport');
//볕뉘 수정 끝
var Const	 = require("../const");
var https	 = require('https');
var fs		 = require('fs');

var Language = {
	'ko_KR': require("./lang/ko_KR.json"),
	'en_US': require("./lang/en_US.json")
};
//볕뉘 수정
var ROUTES = [
	"major", "consume", "admin", "login"
];
//볕뉘 수정 끝
var page = WebInit.page;
var gameServers = [];

WebInit.MOBILE_AVAILABLE = [
	"portal", "main", "kkutu"
];
const SESSION_SECRET = process.env['KKT_SESSION_SECRET'] || GLOBAL.SESSION_SECRET || 'kkutu';
const GAME_RECONNECT_DELAY = 5000;

require("../sub/checkpub");

JLog.info("<< KKuTu Web >>");
if(SESSION_SECRET == 'kkutu') JLog.warn("SESSION_SECRET is not set. Set SESSION_SECRET in global.json (or KKT_SESSION_SECRET) to a long random string.");
Server.set('views', __dirname + "/views");
Server.set('view engine', "pug");
// Behind a local reverse proxy (e.g., nginx), trust X-Forwarded-* headers from loopback.
// This prevents https redirect loops and restores correct client IP/protocol.
Server.set('trust proxy', 'loopback');
Server.use(Express.static(__dirname + "/public"));
Server.use("/lib", Express.static(__dirname + "/lib"));
Server.use(Parser.urlencoded({ extended: true }));
Server.use(Exession({

	// use only for redis-installed
	store: new Redission({
		client: Redis.createClient(process.env.REDIS_URL),
		ttl: 3600 * 12
	}),
	// use only for redis-installed
	
	// 세션 쿠키 서명 키. 공개된 기본값('kkutu')을 쓰면 누구나 서명된 세션 쿠키를 만들 수 있으므로
	// global.json의 SESSION_SECRET 또는 환경 변수 KKT_SESSION_SECRET로 반드시 바꿔 주세요.
	secret: SESSION_SECRET,
	resave: false,
	saveUninitialized: true
}));
//볕뉘 수정
Server.use(passport.initialize());
Server.use(passport.session());
Server.use((req, res, next) => {
	if(req.session.passport) {
		delete req.session.passport;
	}
	next();
});	
Server.use((req, res, next) => {
	if(Const.IS_SECURED || Const.WAF) {
		if(!req.secure) {
			let url = 'https://' + req.hostname + req.originalUrl;
			res.status(302).redirect(url);
		} else {
			next();
		}
	} else {
		next();
	}
});
//볕뉘 수정 끝
/* use this if you want

DDDoS = new DDDoS({
	maxWeight: 6,
	checkInterval: 10000,
	rules: [{
		regexp: "^/(cf|dict|gwalli)",
		maxWeight: 20,
		errorData: "429 Too Many Requests"
	}, {
		regexp: ".*",
		errorData: "429 Too Many Requests"
	}]
});
DDDoS.rules[0].logFunction = DDDoS.rules[1].logFunction = function(ip, path){
	JLog.warn(`DoS from IP ${ip} on ${path}`);
};
Server.use(DDDoS.express());*/

WebInit.init(Server, true);
DB.ready = function(){
	setInterval(function(){
		var q = [ 'createdAt', { $lte: Date.now() - 3600000 * 12 } ];

		DB.session.remove(q).on();
	}, 600000);
	setInterval(function(){
		gameServers.forEach(function(v){
			// 연결 중(CONNECTING)인 소켓에 send하면 예외가 발생해 웹 서버가 죽는다.
			if(v.socket && v.socket.readyState == WS.OPEN) v.send('seek');
			else v.seek = undefined;
		});
	}, 4000);
	JLog.success("DB is ready.");

	DB.kkutu_shop_desc.find().on(function($docs){
		var i, j;

		for(i in Language) flush(i);
		function flush(lang){
			var db;

			Language[lang].SHOP = db = {};
			for(j in $docs){
				db[$docs[j]._id] = [ $docs[j][`name_${lang}`], $docs[j][`desc_${lang}`] ];
			}
		}
	});
	const portalHttpPort = Number(GLOBAL.KKT_PORTAL_HTTP_PORT) || 80;
	Server.listen(portalHttpPort); // reverse-proxy friendly
	if((Const.IS_SECURED || Const.WAF) && !GLOBAL.KKT_PORTAL_BEHIND_PROXY) {
		const options = Secure();
		const portalHttpsPort = Number(GLOBAL.KKT_PORTAL_HTTPS_PORT) || 443;
		https.createServer(options, Server).listen(portalHttpsPort);
	}
};
Const.MAIN_PORTS.forEach(function(v, i){
	var KEY = process.env['WS_KEY'];
	var protocol = Const.IS_SECURED || Const.WAF ? 'wss' : 'ws';
	gameServers[i] = new GameClient(KEY, `${protocol}://${GLOBAL.GAME_SERVER_HOST}:${v}/${KEY}`);
});
function GameClient(id, url){
	var my = this;

	my.id = id;
	my.send = function(type, data){
		if(!data) data = {};
		data.type = type;

		if(!my.socket || my.socket.readyState != WS.OPEN) return false;
		try{
			my.socket.send(JSON.stringify(data));
		}catch(e){
			return false;
		}
		return true;
	};
	function connect(){
		var socket = my.socket = new WS(url, { perMessageDeflate: false, rejectUnauthorized: false });

		socket.on('open', function(){
			JLog.info(`Game server #${my.id} connected`);
		});
		socket.on('error', function(err){
			JLog.warn(`Game server #${my.id} has an error: ${err.toString()}`);
		});
		socket.on('close', function(code){
			JLog.error(`Game server #${my.id} closed: ${code}`);
			socket.removeAllListeners();
			socket.on('error', function(){});
			if(my.socket === socket) delete my.socket;
			my.seek = undefined;
			// 게임 서버가 재시작되어도 웹 서버를 다시 켜지 않아도 되도록 다시 연결한다.
			setTimeout(connect, GAME_RECONNECT_DELAY);
		});
		socket.on('message', function(data){
			var i;

			try{
				data = JSON.parse(data);
			}catch(e){
				return JLog.warn(`Invalid message from game server #${my.id}`);
			}
			switch(data.type){
				case "seek":
					my.seek = data.value;
					break;
				case "narrate-friend":
					for(i in data.list){
						if(gameServers[i]) gameServers[i].send('narrate-friend', { id: data.id, s: data.s, stat: data.stat, list: data.list[i] });
					}
					break;
				default:
			}
		});
	}
	connect();
}
ROUTES.forEach(function(v){
	require(`./routes/${v}`).run(Server, WebInit.page);
});
Server.get("/", function(req, res){
	var server = req.query.server;
	
	//볕뉘 수정 구문삭제(220~229, 240)
	DB.session.findOne([ '_id', req.session.id ]).on(function($ses){
		// var sid = (($ses || {}).profile || {}).sid || "NULL";
		if(global.isPublic){
			onFinish($ses);
			// DB.jjo_session.findOne([ '_id', sid ]).limit([ 'profile', true ]).on(onFinish);
		}else{
			if($ses && $ses.profile) $ses.profile.sid = $ses._id;
			onFinish($ses);
		}
	});
	function onFinish($doc){
		var id = req.session.id;

		if($doc && $doc.profile){
			req.session.profile = $doc.profile;
			id = $doc.profile.sid;
		}else{
			delete req.session.profile;
		}
		page(req, res, Const.MAIN_PORTS[server] ? "kkutu" : "portal", {
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

Server.get("/servers", function(req, res){
	var list = [];

	gameServers.forEach(function(v, i){
		// list[i] = v.seek + 400; // lol
		list[i] = v.seek;
	});
	res.send({ list: list, max: Const.KKUTU_MAX, ports: Const.MAIN_PORTS });
});

//볕뉘 수정 구문 삭제(274~353)

Server.get("/legal/:page", function(req, res){
	// req.params는 URL 디코딩되므로(%2F → /) 다른 경로의 템플릿을 렌더링하지 못하도록 이름을 제한한다.
	if(!/^[\w\- ]+$/.test(req.params.page)) return res.sendStatus(404);
	page(req, res, "legal/"+req.params.page);
})