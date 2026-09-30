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

var Cluster = require("cluster");
var File = require('fs');
var Path = require('path');
var WebSocket = require('ws');
var https = require('https');
var HTTPS_Server;
var Heapdump = null;
try {
	Heapdump = require("heapdump");
} catch (e) {
	// heapdump is optional; #dump command will be disabled when unavailable.
}
var KKuTu = require('./kkutu');
var GLOBAL = require("../sub/global.json");
var Const = require("../const");
var JLog = require('../sub/jjlog');
var Secure = require('../sub/secure');
var Recaptcha = require('../sub/recaptcha');
// Discord Webhook [S]
var DCWH = require('../sub/dcwh');
const { WebhookClient, EmbedBuilder } = require('discord.js');
let UseDiscordWebhook = GLOBAL.USE_DISCORD_WEBHOOK && GLOBAL.DISCORD_WEBHOOK_URL && GLOBAL.DISCORD_WEBHOOK_URL.startsWith("https://discord.com/api/webhooks/");
// Discord Webhook [E]
var MainDB;

var Server;
var DIC = {};
var DNAME = {};
var ROOM = {};

var T_ROOM = {};
var T_USER = {};

var SID;
var WDIC = {};

const DEVELOP = exports.DEVELOP = global.test || false; // 서버가 점검중 인가?
const GUEST_PERMISSION = exports.GUEST_PERMISSION = {
	'create': true,
	'enter': true,
	'talk': true,
	'practice': true,
	'ready': true,
	'start': true,
	'invite': true,
	'inviteRes': true,
	'kick': true,
	'kickVote': true,
	'wp': true
};
const ENABLE_ROUND_TIME = exports.ENABLE_ROUND_TIME = [ 10, 30, 60, 90, 120, 150 ]; // 이건 아무런 영향이 없는듯 하다
const ENABLE_FORM = exports.ENABLE_FORM = [ "S", "J" ];
const MODE_LENGTH = exports.MODE_LENGTH = Const.GAME_TYPE.length;
const PORT = process.env['KKUTU_PORT'];
const BAD_CHAT_REGEXP = new RegExp([
	"느으*[^가-힣]*금마?",
	"니[^가-힣]*(엄|앰|엠)",
	"(ㅄ|ㅅㅂ|ㅂㅅ)",
	"미친(년|놈)?",
	"(병|븅|빙)[^가-힣]*신",
	"보[^가-힣]*지",
	"(새|섀|쌔|썌)[^가-힣]*(기|끼)",
	"섹[^가-힣]*스",
	"(시|씨|쉬|쒸)이*입?[^가-힣]*(발|빨|벌|뻘|팔|펄)",
	"십[^가-힣]*새",
	"씹",
	"(애|에)[^가-힣]*미",
	"자[^가-힣]*지",
	"존[^가-힣]*나",
	"좆|죶",
	"지[^가-힣]*랄",
	"창[^가-힣]*(녀|년|놈)",
	"fuck",
	"sex"
].join('|'), 'i');

function hasBadWord(text){
	if(typeof text !== 'string') return false;
	BAD_CHAT_REGEXP.lastIndex = 0;
	return BAD_CHAT_REGEXP.test(text);
}

function getAutobanReason(reasonKey){
	const autoban = GLOBAL.AUTOBAN || {};
	const reasonMap = autoban.AUTOBAN_REASON || {};
	return reasonMap[reasonKey] || reasonKey;
}

function getClientBlockIp($c){
	if(!$c) return null;
	// remoteAddress는 WAF / USE_X_FORWARDED_FOR 설정을 반영해 결정된 값이다.
	// 클라이언트가 임의로 넣을 수 있는 X-Forwarded-For를 그대로 쓰면 차단 우회/타인 차단이 가능하다.
	return $c.remoteAddress || null;
}
function safeSocketSend(socket, text){
	if(!socket || socket.readyState !== 1) return false;
	try{
		socket.send(text);
		return true;
	}catch(e){
		return false;
	}
}

function applyAutobanToClient($c, reasonKey){
	if(!GLOBAL.USE_AUTOBAN) return false;
	if(!MainDB || !MainDB.ip_block) return false;
	if(!$c) return false;
	if($c.admin || (Array.isArray(GLOBAL.ADMIN) && GLOBAL.ADMIN.indexOf($c.id) !== -1)) return false;

	const blockIp = getClientBlockIp($c);
	if(!blockIp) return false;

	const autoban = GLOBAL.AUTOBAN || {};
	const reasonText = getAutobanReason(reasonKey);
	const isForever = !!autoban.IS_AUTOBAN_FOREVER;
	let reasonBlocked = reasonText;
	let ipBlockedUntil = -1;

	if(!isForever){
		let days = Number(autoban.AUTOBAN_DAYS);
		if(isNaN(days) || days < 1) days = 1;
		reasonBlocked = `${autoban.AUTOBAN_MESSAGE || ''}${reasonText}`;
		ipBlockedUntil = addDate(days);
	}

	MainDB.ip_block.findOne([ '_id', blockIp ]).on(function($body){
		if($body) MainDB.ip_block.update([ '_id', blockIp ]).set([ 'reasonBlocked', reasonBlocked ], [ 'ipBlockedUntil', ipBlockedUntil ]).on();
		else MainDB.ip_block.insert([ '_id', blockIp ], [ 'reasonBlocked', reasonBlocked ], [ 'ipBlockedUntil', ipBlockedUntil ]).on();
	});
	if(UseDiscordWebhook){
		if(typeof DCWH.sendDiscordWebhookOnAutoban === 'function') DCWH.sendDiscordWebhookOnAutoban($c.id, blockIp, reasonText, GLOBAL.IS_DISCORD_WEBHOOK_ENGLISH);
	}

	safeSocketSend($c.socket, JSON.stringify({
		type: 'error',
		code: 446,
		reasonBlocked: reasonBlocked,
		ipBlockedUntil: ipBlockedUntil
	}));
	if($c.socket) $c.socket.close();

	JLog.info(`[AutoBan] IP ${blockIp} blocked for ${$c.id} (${reasonText})`);
	return true;
}

function shouldAutobanByBadChat($c, text){
	if(!GLOBAL.USE_AUTOBAN) return false;
	if(!hasBadWord(text)) return false;
	if($c && $c.place && ROOM[$c.place] && ROOM[$c.place].gaming) return false;

	const autoban = GLOBAL.AUTOBAN || {};
	let clearSecond = Number(autoban.BAD_CLEAR_SECOND);
	let maxCount = Number(autoban.MAX_BAD_COUNT_ON_CHAT);
	const now = Date.now();

	if(isNaN(clearSecond) || clearSecond < 1) clearSecond = 60;
	if(isNaN(maxCount) || maxCount < 1) maxCount = 1;

	if(!$c._badChatExpireAt || now > $c._badChatExpireAt) $c._badChatCount = 0;
	$c._badChatCount = ($c._badChatCount || 0) + 1;
	$c._badChatExpireAt = now + (clearSecond * 1000);

	return $c._badChatCount >= maxCount;
}

const ERROR_LOG_PATH = Path.resolve(__dirname, "../../../KKUTU_ERROR.log");

process.on('uncaughtException', function(err){
	var text = `:${PORT} [${new Date().toLocaleString()}] ERROR: ${err.toString()}\n${err.stack}\n`;
	
	File.appendFile(ERROR_LOG_PATH, text, function(res){
		JLog.error(`ERROR OCCURRED ON THE MASTER!`);
		console.log(text);
	});
});
function processAdmin(id, value){
	var cmd, temp, i, j;
	var cmdMatch = value.match(/^#(\w+)(?:[\s,]+(.*))?$/);
	if(cmdMatch){
		cmd = cmdMatch[1];
		value = (cmdMatch[2] || "").trim();
	}
	switch(cmd){
		case "yell":
			KKuTu.publish('yell', { value: value });
			return null;
		case "kill":
    		if(temp = DIC[value]){ // TNX TO @200mill
    		    try {
    		        if(temp.socket.readyState === 1 /* WebSocket.OPEN */)
    		            temp.socket.send('{"type":"error","code":410}');
    		    } catch(e){ /* socket already gone */ }
    		    temp.socket.close();
    		}
    		return null;
		case "tailroom":
			if(temp = ROOM[value]){
				if(T_ROOM[value] == id){
					i = true;
					delete T_ROOM[value];
				}else T_ROOM[value] = id;
				if(DIC[id]) DIC[id].send('tail', { a: i ? "trX" : "tr", rid: temp.id, id: id, msg: { pw: temp.password, players: temp.players } });
			}
			return null;
		case "tailuser":
			if(temp = DIC[value]){
				if(T_USER[value] == id){
					i = true;
					delete T_USER[value];
				}else T_USER[value] = id;
				temp.send('test');
				if(DIC[id]) DIC[id].send('tail', { a: i ? "tuX" : "tu", rid: temp.id, id: id, msg: temp.getData() });
			}
			return null;
		case "dump":
			if(!Heapdump || typeof Heapdump.writeSnapshot !== "function"){
				if(DIC[id]) DIC[id].send('yell', { value: "Heap dump module is not available on this server." });
				JLog.warn("Heap dump requested, but heapdump module is not installed.");
				return null;
			}
			if(DIC[id]) DIC[id].send('yell', { value: "Generating heap snapshot..." });
			Heapdump.writeSnapshot("/home/kkutu_memdump_" + Date.now() + ".heapsnapshot", function(err){
				if(err){
					JLog.error("Error when dumping!");
					if(DIC[id]) DIC[id].send('yell', { value: "Dump failed." });
					return JLog.error(err.toString());
				}
				if(DIC[id]) DIC[id].send('yell', { value: "DUMP OK" });
				JLog.success("Dumping success.");
			}); // 왜 주석임
			return null;
		case "roommsg":
			temp = value.match(/^(\d+)\s+(.+)$/);
			if (temp && ROOM[Number(temp[1])]) {
			  var rid = Number(temp[1]);
			  var message = temp[2];
			var r = JSON.stringify({ type: "yell", value: message });
			  for (var k in DIC) {
			    if (DIC[k].place == rid && DIC[k].socket && DIC[k].socket.readyState == 1) {
			      DIC[k].socket.send(r);
			    }
			  }
			  JLog.info(`Sent message to room #${rid}: ${message}`);
			} else {
			  if (DIC[id]) DIC[id].send("yell", { value: "Room not found." });
			}
    		return null;
		/* Enhanced User Block System [S] */
		case 'ban':
			try {
				var args = value.split(",");
				if(args.length == 2){
					MainDB.users.update([ '_id', args[0].trim() ]).set([ 'black', args[1].trim() ], [ 'blockedUntil', -1 ]).on();
					DIC[id].send('yell', { value: "OK" });
					JLog.info(`[Block] 사용자 #${args[0].trim()}(이)가 ${args[1].trim()}의 이유로 이용제한 처리되었습니다.`);
					DCWH.sendDiscordWebhookOnUserBan(args[0].trim(), args[1].trim(), "inf", GLOBAL.IS_DISCORD_WEBHOOK_ENGLISH);
				}else if(args.length == 3){
					var blockDays = parseInt(args[2].trim(), 10);
					if(isNaN(blockDays)){
						DIC[id].send('yell', { value: "Invalid arguments. (days must be a number)" });
						return null;
					}
					MainDB.users.update([ '_id', args[0].trim() ]).set([ 'black', args[1].trim() ], [ 'blockedUntil', addDate(blockDays) ]).on();				
					DIC[id].send('yell', { value: "OK" });
					JLog.info(`[Block] 사용자 #${args[0].trim()}(이)가 ${args[2].trim()}일동안 ${args[1].trim()}의 이유로 이용제한 처리되었습니다.`);
					DCWH.sendDiscordWebhookOnUserBan(args[0].trim(), args[1].trim(), args[2].trim(), GLOBAL.IS_DISCORD_WEBHOOK_ENGLISH);
				}else {
					DIC[id].send('yell', { value: "Invalid arguments." });
					return null;
				}				
				if(temp = DIC[args[0].trim()]){
					safeSocketSend(temp.socket, '{"type":"error","code":410}');
					temp.socket.close();
				}
			}catch(e){
				processAdminErrorCallback(e, id);
			}
			return null;
		case 'ipban':
			try {
				var args = value.split(",");
				var ipAddr;
				var reason;
				if(args.length == 2){
					ipAddr = args[0].trim();
					reason = args[1].trim();
					MainDB.ip_block.findOne([ '_id', ipAddr ]).on(function($body){
						if($body) MainDB.ip_block.update([ '_id', ipAddr ]).set([ 'reasonBlocked', reason ], [ 'ipBlockedUntil', -1 ]).on();
						else MainDB.ip_block.insert([ '_id', ipAddr ], [ 'reasonBlocked', reason ], [ 'ipBlockedUntil', -1 ]).on();
					});
					DIC[id].send('yell', { value: "OK" });
					JLog.info(`[Block] IP 주소 ${ipAddr}(이)가 ${reason}의 이유로 이용제한 처리되었습니다.`);
					DCWH.sendDiscordWebhookOnIPBan(ipAddr, reason, "inf", GLOBAL.IS_DISCORD_WEBHOOK_ENGLISH);

				}else if(args.length == 3){
					var ipBlockDays = parseInt(args[2].trim(), 10);
					if(isNaN(ipBlockDays)){
						DIC[id].send('yell', { value: "Invalid arguments. (days must be a number)" });
						return null;
					}
					ipAddr = args[0].trim();
					reason = args[1].trim();
					var blockedUntil = addDate(ipBlockDays);
					MainDB.ip_block.findOne([ '_id', ipAddr ]).on(function($body){
						if($body) MainDB.ip_block.update([ '_id', ipAddr ]).set([ 'reasonBlocked', reason ], [ 'ipBlockedUntil', blockedUntil ]).on();
						else MainDB.ip_block.insert([ '_id', ipAddr ], [ 'reasonBlocked', reason ], [ 'ipBlockedUntil', blockedUntil ]).on();
					});
					DIC[id].send('yell', { value: "OK" });
					JLog.info(`[Block] IP 주소 ${ipAddr}(이)가 ${args[2].trim()}일동안 ${reason}의 이유로 이용제한 처리되었습니다.`);
					// if )
					DCWH.sendDiscordWebhookOnIPBan(ipAddr, reason, ipBlockDays, GLOBAL.IS_DISCORD_WEBHOOK_ENGLISH);
				}else {
					DIC[id].send('yell', { value: "Invalid arguments." });
					return null;
				}
			}catch(e){
				processAdminErrorCallback(e, id);
			}
			return null;
		case 'unban':
			try {
				MainDB.users.update([ '_id', value ]).set([ 'black', null ], [ 'blockedUntil', 0 ]).on();								
				JLog.info(`[Block] 사용자 #${value}(이)가 이용제한 해제 처리되었습니다.`);
				DCWH.sendDiscordWebhookOnUserUnban(value, GLOBAL.IS_DISCORD_WEBHOOK_ENGLISH);
			}catch(e){
				processAdminErrorCallback(e, id);
			}
			return null;
		case 'ipunban':
			try {
				MainDB.ip_block.update([ '_id', value ]).set([ 'reasonBlocked', null ], [ 'ipBlockedUntil', 0 ]).on();								
				JLog.info(`[Block] IP 주소 ${value}(이)가 이용제한 해제 처리되었습니다.`);
				DCWH.sendDiscordWebhookOnIPUnban(value, GLOBAL.IS_DISCORD_WEBHOOK_ENGLISH);
			}catch(e){
				processAdminErrorCallback(e, id);
			}
			return null;
		/* Enhanced User Block System [E] */
		case 'banlist':
			try {
				MainDB.users.find([ 'black', { $ne: null } ]).limit([ 'black', true ], [ 'blockedUntil', true ]).on(function($body){
					var list = ($body || []).filter(function(item){
						return item.black && item.black != "null";
					}).map(function(item){
						return { id: item._id, reason: item.black, blockedUntil: item.blockedUntil };
					});
					if(DIC[id]) DIC[id].send('yell', { value: JSON.stringify(list) });
				});
			}catch(e){
				processAdminErrorCallback(e, id);
			}
			return null;
		case 'ipbanlist':
			try {
				MainDB.ip_block.find([ 'reasonBlocked', { $ne: null } ]).on(function($body){
					var now = Date.now();
					var list = ($body || []).filter(function(item){
						var blockedUntil = Number(item.ipBlockedUntil);
						if(!item.reasonBlocked) return false;
						return blockedUntil === -1 || blockedUntil > now;
					}).map(function(item){
						return { id: item._id, reason: item.reasonBlocked, blockedUntil: item.ipBlockedUntil };
					});
					if(DIC[id]) DIC[id].send('yell', { value: JSON.stringify(list) });
				});
			}catch(e){
				processAdminErrorCallback(e, id);
			}
			return null;
	}
	return value;
}
/* Enhanced User Block System [S] */
function addDate(num){
	if(isNaN(num)) return;
	return Date.now() + num * 24 * 60 * 60 * 1000;
}

function processAdminErrorCallback(error, id){
	if(DIC[id]) DIC[id].send('yell', { value: `명령을 처리하는 도중 오류가 발생하였습니다: ${error}` });
	JLog.warn(`[Block] 명령을 처리하는 도중 오류가 발생하였습니다: ${error}`);
}
/* Enhanced User Block System [E] */
function checkTailUser(id, place, msg){
	var temp;
	
	if(temp = T_USER[id]){
		if(!DIC[temp]){
			delete T_USER[id];
			return;
		}
		DIC[temp].send('tail', { a: "user", rid: place, id: id, msg: msg });
	}
}
function narrateFriends(id, friends, stat){
	if(!friends) return;
	var fl = Object.keys(friends);
	
	if(!fl.length) return;
	
	MainDB.users.find([ '_id', { $in: fl } ], [ 'server', /^\w+$/ ]).limit([ 'server', true ]).on(function($fon){
		var i, sf = {}, s;
		
		for(i in $fon){
			if(!sf[s = $fon[i].server]) sf[s] = [];
			sf[s].push($fon[i]._id);
		}
		if(DIC[id]) DIC[id].send('friends', { list: sf });
		
		if(sf[SID]){
			KKuTu.narrate(sf[SID], 'friend', { id: id, s: SID, stat: stat });
			delete sf[SID];
		}
		for(i in WDIC){
			WDIC[i].send('narrate-friend', { id: id, s: SID, stat: stat, list: sf });
			break;
		}
	});
}
Cluster.on('message', function(worker, msg){
	var temp;
	var i;
	
	switch(msg.type){
		case "admin":
			if(DIC[msg.id] && DIC[msg.id].admin) processAdmin(msg.id, msg.value);
			break;
		case "tail-report":
			if(temp = T_ROOM[msg.place]){
				if(!DIC[temp]) delete T_ROOM[msg.place];
				else DIC[temp].send('tail', { a: "room", rid: msg.place, id: msg.id, msg: msg.msg });
			}
			checkTailUser(msg.id, msg.place, msg.msg);
			break;
		case "okg":
			if(DIC[msg.id]) DIC[msg.id].onOKG(msg.time);
			break;
		case "kick":
			if(DIC[msg.target]) DIC[msg.target].socket.close();
			break;
		case "invite":
			if(!DIC[msg.target]){
				worker.send({ type: "invite-error", target: msg.id, code: 417 });
				break;
			}
			if(DIC[msg.target].place != 0){
				worker.send({ type: "invite-error", target: msg.id, code: 417 });
				break;
			}
			if(!GUEST_PERMISSION.invite) if(DIC[msg.target].guest){
				worker.send({ type: "invite-error", target: msg.id, code: 422 });
				break;
			}
			if(DIC[msg.target]._invited){
				worker.send({ type: "invite-error", target: msg.id, code: 419 });
				break;
			}
			DIC[msg.target]._invited = msg.place;
			DIC[msg.target].send('invited', { from: msg.place });
			break;
		case "room-new":
			if(ROOM[msg.room.id] || !DIC[msg.target]){ // 이미 그런 ID의 방이 있다... 그 방은 없던 걸로 해라.
				worker.send({ type: "room-invalid", room: msg.room });
			}else{
				ROOM[msg.room.id] = new KKuTu.Room(msg.room, msg.room.channel);
				KKuTu.publish('room-setting', { room: msg.room, created: true, target: msg.target });
				for(i in WDIC) WDIC[i].send('room-setting', { room: msg.room, created: true, target: msg.target });
			}
			break;
		case "room-come":
			if(ROOM[msg.id] && DIC[msg.target]){
				ROOM[msg.id].come(DIC[msg.target]);
			}else{
				JLog.warn(`Wrong room-come id=${msg.id}&target=${msg.target}`);
			}
			break;
		case "room-spectate":
			if(ROOM[msg.id] && DIC[msg.target]){
				ROOM[msg.id].spectate(DIC[msg.target], msg.pw);
			}else{
				JLog.warn(`Wrong room-spectate id=${msg.id}&target=${msg.target}`);
			}
			break;
		case "room-go":
			if(ROOM[msg.id] && DIC[msg.target]){
				ROOM[msg.id].go(DIC[msg.target]);
			}else{
				// 나가기 말고 연결 자체가 끊겼을 때 생기는 듯 하다.
				JLog.warn(`Wrong room-go id=${msg.id}&target=${msg.target}`);
				if(ROOM[msg.id] && ROOM[msg.id].players){
					// 이 때 수동으로 지워준다.
					var x = ROOM[msg.id].players.indexOf(msg.target);
					
					if(x != -1){
						ROOM[msg.id].players.splice(x, 1);
						JLog.warn(`^ OK`);
					}
				}
				if(msg.removed) delete ROOM[msg.id];
			}
			break;
		case "user-publish":
			if(temp = DIC[msg.data.id]){
				for(var i in msg.data){
					temp[i] = msg.data[i];
				}
			}
			break;
		case "room-publish":
			if(temp = ROOM[msg.data.room.id]){
				for(var i in msg.data.room){
					temp[i] = msg.data.room[i];
				}
				temp.password = msg.password;
			}
			KKuTu.publish('room', msg.data);
			break;
		case "room-expired":
			if(msg.create && ROOM[msg.id]){
				for(var i in ROOM[msg.id].players){
					var $c = DIC[ROOM[msg.id].players[i]];
					
					if($c) $c.send('roomStuck');
				}
				delete ROOM[msg.id];
			}
			break;
		case "room-invalid":
			delete ROOM[msg.room.id];
			// Discord Webhook [S]
			try {
				DCWH.SendWebhookOnDeleteRoom(msg.room.id, msg.room.channel);
			} catch (error) {
				JLog.warn(`Error on sending Discord webhook for room deletion: ${error}`);
			}
			break;
		// Discord Webhook [S]
		case "heartbeat":
			break;
		default:
			JLog.warn(`Unhandled IPC message type: ${msg.type}`);
	}
});
exports.init = function(_SID, CHAN){
	SID = _SID;
	MainDB = require('../Web/db');
	MainDB.ready = function(){
		JLog.success("Master DB is ready.");
		
		MainDB.users.update([ 'server', SID ]).set([ 'server', "" ]).on();
		if(Const.IS_SECURED || Const.WAF) {
			const options = Secure();
			HTTPS_Server = https.createServer(options)
				.listen(global.test ? (Const.TEST_PORT + 30) : process.env['KKUTU_PORT']); // WHY?????
			Server = new WebSocket.Server({server: HTTPS_Server});
		} else {
			Server = new WebSocket.Server({
				port: global.test ? (Const.TEST_PORT + 30) : process.env['KKUTU_PORT'], // WHY?????
				perMessageDeflate: false
			});
		}
		Server.on('connection', function(socket, info){
			var key = info.url.slice(1);
			var $c;
			
			socket.on('error', function(err){
				JLog.warn("Error on #" + key + " on ws: " + err.toString());
			});
			// 웹 서버
			if((info.headers.host || "").startsWith(GLOBAL.GAME_SERVER_HOST + ":")){
				var ws;
				
				if(WDIC[key]) WDIC[key].socket.close();
				ws = WDIC[key] = new KKuTu.WebServer(socket);
				JLog.info(`New web server #${key}`);
				socket.on('close', function(){
					JLog.alert(`Exit web server #${key}`);
					socket.removeAllListeners();
					// 같은 키로 새 웹 서버가 이미 붙었다면 그 연결은 지우지 않는다.
					if(WDIC[key] === ws) delete WDIC[key];
				});
				return;
			}
			if(Object.keys(DIC).length >= Const.KKUTU_MAX){
				safeSocketSend(socket, `{ "type": "error", "code": "full" }`);
				socket.close();
				return;
			}
			MainDB.session.findOne([ '_id', key ]).limit([ 'profile', true ]).on(function($body){
				$c = new KKuTu.Client(socket, $body ? $body.profile : null, key);
				$c.admin = GLOBAL.ADMIN.indexOf($c.id) != -1;
				/* Enhanced User Block System [S] */
				var forwardedFor = info.headers['x-forwarded-for'];
				var forwardedIp = forwardedFor ? forwardedFor.split(',')[0].trim() : null;
				var cfConnectingIp = info.headers['cf-connecting-ip'];
				$c.forwardedIp = forwardedIp || null;
				if(GLOBAL.WAF){
					// Cloudflare 뒤에서는 CF-Connecting-IP가 신뢰할 수 있는 실제 IP이다.
					$c.remoteAddress = cfConnectingIp || forwardedIp || info.connection.remoteAddress;
				}else{
					$c.remoteAddress = GLOBAL.USER_BLOCK_OPTIONS.USE_X_FORWARDED_FOR
						? (cfConnectingIp || forwardedIp || info.connection.remoteAddress)
						: info.connection.remoteAddress;
				}
				/* Enhanced User Block System [E] */
				
				if(DIC[$c.id]){
					DIC[$c.id].sendError(408);
					DIC[$c.id].socket.close();
				}
				if(DEVELOP && !Const.TESTER.includes($c.id)){
					$c.sendError(500);
					$c.socket.close();
					return;
				}
				if($c.guest){
					if(SID != "0"){
						$c.sendError(402);
						$c.socket.close();
						return;
					}
					if(KKuTu.NIGHT){
						$c.sendError(440);
						$c.socket.close();
						return;
					}
				}
				/* Enhanced User Block System [S] */
				if($c.isAjae === null){
					$c.sendError(441);
					$c.socket.close();
					return;
				}
				checkIpBlock($c, function(){
				/* Enhanced User Block System [E] */
				$c.refresh().then(function(ref){
					// 조회하는 동안 연결이 끊겼다면 유령 사용자가 남지 않도록 여기서 멈춘다.
					if($c.socket.readyState !== 1) return;
					/* Enhanced User Block System [S] */
					let isBlockRelease = false;
					var blockedUntilTs = Number(ref.blockedUntil);
					if(isNaN(blockedUntilTs)) blockedUntilTs = 0;

					if(ref.result == 444 && blockedUntilTs > 0 && blockedUntilTs < Date.now()) {
						MainDB.users.update([ '_id', $c.id ]).set([ 'blockedUntil', 0 ], [ 'black', null ]).on();
						JLog.info(`사용자 #${$c.id}의 이용제한이 해제되었습니다.`);
						DCWH.sendDiscordWebhookOnUserUnban($c.id, GLOBAL.IS_DISCORD_WEBHOOK_ENGLISH);
						isBlockRelease = true;
					}
					/* Enhanced User Block System [E] */						
					// ^V ?
					/* Enhanced User Block System [S] */
					if(ref.result == 200 || isBlockRelease){
					/* Enhanced User Block System [E] */
						DIC[$c.id] = $c;
						DNAME[($c.profile.title || $c.profile.name).replace(/\s/g, "")] = $c.id;
						MainDB.users.update([ '_id', $c.id ]).set([ 'server', SID ]).on();

						if (($c.guest && GLOBAL.GOOGLE_RECAPTCHA_TO_GUEST) || GLOBAL.GOOGLE_RECAPTCHA_TO_USER) {
							safeSocketSend($c.socket, JSON.stringify({
								type: 'recaptcha',
								siteKey: GLOBAL.GOOGLE_RECAPTCHA_SITE_KEY
							}));
						} else {
							$c.passRecaptcha = true;

							joinNewUser($c);
						}
					} else {
						/* Enhanced User Block System [S] */
						if(blockedUntilTs !== 0) $c.send('error', {
							code: ref.result, message: ref.black, blockedUntil: blockedUntilTs
						});
						else $c.send('error', {
							code: ref.result, message: ref.black
						});
						/* Enhanced User Block System [E] */
						
						$c._error = ref.result;
						$c.socket.close();
						// JLog.info("Black user #" + $c.id);
					}
				});
				});
			});
		});
		Server.on('error', function (err) {
			JLog.warn("Error on ws: " + err.toString());
		});
		KKuTu.init(MainDB, DIC, ROOM, GUEST_PERMISSION, CHAN);
	};
};

/* Enhanced User Block System [S] */
function checkIpBlock($c, next){
	var opts = GLOBAL.USER_BLOCK_OPTIONS || {};
	var blockIp;

	if(!opts.USE_MODULE) return next();
	if(opts.BLOCK_IP_ONLY_FOR_GUEST && !$c.guest) return next();
	if(!(blockIp = getClientBlockIp($c))) return next();

	MainDB.ip_block.findOne([ '_id', blockIp ]).on(function($body){
		var ipBlockedUntil, reasonBlocked;

		if(!$body || !$body.reasonBlocked) return next();
		ipBlockedUntil = Number($body.ipBlockedUntil);
		if(isNaN(ipBlockedUntil)) ipBlockedUntil = 0;
		if(ipBlockedUntil === -1 || ipBlockedUntil > Date.now()){
			reasonBlocked = $body.reasonBlocked || opts.DEFAULT_BLOCKED_TEXT;
			safeSocketSend($c.socket, JSON.stringify({
				type: 'error',
				code: 446,
				reasonBlocked: reasonBlocked,
				ipBlockedUntil: ipBlockedUntil
			}));
			$c.socket.close();
			DCWH.sendDiscordWebhookOnJoinBaneduser($c.id, blockIp, reasonBlocked, $body.ipBlockedUntil || "Unknown", GLOBAL.IS_DISCORD_WEBHOOK_ENGLISH);
			return;
		}
		// 기한이 지났거나 올바르지 않은 기한이면 차단을 해제한다.
		MainDB.ip_block.update([ '_id', blockIp ]).set([ 'ipBlockedUntil', 0 ], [ 'reasonBlocked', null ]).on();
		if(ipBlockedUntil > 0){
			JLog.info(`IP 주소 ${blockIp}의 이용제한이 해제되었습니다.`);
			DCWH.sendDiscordWebhookOnIPUnban(blockIp, GLOBAL.IS_DISCORD_WEBHOOK_ENGLISH);
		}
		next();
	});
}
/* Enhanced User Block System [E] */

function joinNewUser($c) {
	$c.send('welcome', {
		id: $c.id,
		guest: $c.guest,
		box: $c.box,
		nickname: $c.nickname,
		exordial: $c.exordial,
		playTime: $c.data.playTime,
		okg: $c.okgCount,
		users: KKuTu.getUserList(),
		rooms: KKuTu.getRoomList(),
		friends: $c.friends,
		admin: $c.admin,
		test: global.test,
		caj: $c._checkAjae ? true : false // 이건 셧다운제 물론 지금은 안씀
	});
	// Discord Webhook [S]
	// JLog.info(`USE_DISCORD_WEBHOOK: ${GLOBAL.USE_DISCORD_WEBHOOK}, ADMIN: ${$c.admin}, URL: ${GLOBAL.DISCORD_WEBHOOK_URL}`);
	if (UseDiscordWebhook && !$c.admin) {
		DCWH.sendDiscordWebhookOnUserJoin($c.nickname, $c.id, GLOBAL.IS_DISCORD_WEBHOOK_ENGLISH);
	}
	// Discord Webhook [E]
	narrateFriends($c.id, $c.friends, "on");
	KKuTu.publish('conn', {user: $c.getData()});
	
	JLog.info("New user #" + $c.id);
}

KKuTu.onClientMessage = function ($c, msg) {
	if (!msg) return;

	if (msg.type === 'heartbeat') { // TNX to https://github.com/kitt3n69420/KKuTu
		$c._lastHeartbeat = Date.now();
		if (msg.ack && typeof msg.t === 'number' && isFinite(msg.t)) {
			$c._pingLatency = Math.max(0, Date.now() - msg.t);
			$c.send('heartbeat', { rtt: $c._pingLatency });
		}
		return;
	}
	
	if ($c.passRecaptcha) {
		processClientRequest($c, msg);
	} else {
		if (msg.type === 'recaptcha') {
			if ($c._recaptchaPending) return;
			$c._recaptchaPending = true;
			Recaptcha.verifyRecaptcha(msg.token, $c.remoteAddress, function (success) {
				$c._recaptchaPending = false;
				if ($c.passRecaptcha) return;
				if (success) {
					$c.passRecaptcha = true;

					joinNewUser($c);

					processClientRequest($c, msg);
				} else {
					JLog.warn(`Recaptcha failed from IP ${$c.remoteAddress}`);

					$c.sendError(447);
					$c.socket.close();
				}
			});
		}
	}
};

function processClientRequest($c, msg) {
	var stable = true;
	var temp;
	var now = (new Date()).getTime();
	
	switch (msg.type) {
		case 'yell':
			if (!msg.value) return;
			if (!$c.admin) return;

			$c.publish('yell', {value: msg.value});
			break;
		case 'refresh':
			$c.refresh();
			break;
		case 'updateProfile':
			if($c.guest) return;
			if(typeof msg.nickname === 'string' && hasBadWord(msg.nickname)){
				applyAutobanToClient($c, 'BAD_NICKNAME');
				return;
			}
			// 클라이언트가 보낸 값을 그대로 퍼뜨리지 않고, 웹 서버(/profile)가 검증해 저장한 값을 DB에서 다시 읽는다.
			MainDB.users.findOne([ '_id', $c.id ]).limit([ 'nickname', true ], [ 'exordial', true ]).on(function($user){
				var data, prevName;

				if(!$user || DIC[$c.id] !== $c) return;
				data = { id: $c.id };
				if($user.nickname && $user.nickname != $c.nickname){
					prevName = ($c.profile.title || $c.profile.name || "").replace(/\s/g, "");
					if(DNAME[prevName] == $c.id) delete DNAME[prevName];
					data.nickname = $user.nickname;
				}
				if(typeof $user.exordial === 'string' && $user.exordial != $c.exordial) data.exordial = $user.exordial;
				if(!data.nickname && data.exordial === undefined) return;
				$c.updateProfile(data);
				if(data.nickname) DNAME[data.nickname.replace(/\s/g, "")] = $c.id;
				for(let i in DIC) DIC[i].send('updateUser', data);
			});
			break;
		case 'talk':
			if (!msg.value) return;
			if (!msg.value.substr) return;
			if (!GUEST_PERMISSION.talk) if ($c.guest) {
				$c.send('error', {code: 401});
				return;
			}
			msg.value = msg.value.substr(0, 500); // what if...?
			if ($c.admin) {
				if (!processAdmin($c.id, msg.value)) break;
			}
			if(shouldAutobanByBadChat($c, msg.value)){
				applyAutobanToClient($c, 'BAD_CHAT');
				return;
			}
			checkTailUser($c.id, $c.place, msg);
			if (msg.whisper) {
				if (typeof msg.whisper !== 'string') return;
				msg.whisper.split(',').forEach(v => {
					if (temp = DIC[DNAME[v]]) {
						temp.send('chat', {
							from: $c.profile.title || $c.profile.name,
							profile: $c.profile,
							value: msg.value
						});
					} else {
						$c.sendError(424, v);
					}
				});
			} else {
				$c.chat(msg.value);
			}
			break;
		case 'friendAdd':
			if (!msg.target) return;
			if ($c.guest) return;
			if ($c.id == msg.target) return;
			if (Object.keys($c.friends).length >= 100) return $c.sendError(452);
			if (temp = DIC[msg.target]) {
				if (temp.guest) return $c.sendError(453);
				if ($c._friend) return $c.sendError(454);
				$c._friend = temp.id;
				temp.send('friendAdd', {from: $c.id});
			} else {
				$c.sendError(450);
			}
			break;
		case 'friendAddRes':
			if (!(temp = DIC[msg.from])) return;
			if (temp._friend != $c.id) return;
			if (msg.res) {
				// $c와 temp가 친구가 되었다.
				$c.addFriend(temp.id);
				temp.addFriend($c.id);
			}
			temp.send('friendAddRes', {target: $c.id, res: msg.res});
			delete temp._friend;
			break;
		case 'friendEdit':
			if (!$c.friends) return;
			if (!$c.friends[msg.id]) return;
			$c.friends[msg.id] = String(msg.memo || "").slice(0, 50);
			$c.flush(false, false, true);
			$c.send('friendEdit', {friends: $c.friends});
			break;
		case 'friendRemove':
			if (!$c.friends) return;
			if (!$c.friends[msg.id]) return;
			$c.removeFriend(msg.id);
			break;
		case 'enter':
		case 'setRoom':
			if (!msg.title) stable = false;
			if (!msg.limit) stable = false;
			if (!msg.round) stable = false;
			if (!msg.time) stable = false;
			if (!msg.opts) stable = false;

			msg.code = false;
			msg.limit = Number(msg.limit);
			msg.mode = Number(msg.mode);
			msg.round = Number(msg.round);
			msg.time = Number(msg.time);

			if (isNaN(msg.limit)) stable = false;
			if (isNaN(msg.mode)) stable = false;
			if (isNaN(msg.round)) stable = false;
			if (isNaN(msg.time)) stable = false;

			if (stable) {
				if (typeof msg.title !== 'string' || msg.title.length > 20) stable = false;
				if (msg.password === undefined || msg.password === null) msg.password = "";
				if (typeof msg.password !== 'string' || msg.password.length > 20) stable = false;
				if (typeof msg.opts !== 'object') stable = false;
				if (msg.limit < 2 || msg.limit > 8) {
					msg.code = 432;
					stable = false;
				}
				if (msg.mode < 0 || msg.mode >= MODE_LENGTH) stable = false;
				if (msg.round < 1 || msg.round > 10) {
					msg.code = 433;
					stable = false;
				}
				if (ENABLE_ROUND_TIME.indexOf(msg.time) == -1) stable = false;
			}
			if (msg.type == 'enter') {
				if (msg.id || stable) $c.enter(msg, msg.spectate);
				else $c.sendError(msg.code || 431);
			} else if (msg.type == 'setRoom') {
				if (stable) $c.setRoom(msg);
				else $c.sendError(msg.code || 431);
			}
			break;
		case 'inviteRes':
			if (!(temp = ROOM[msg.from])) return;
			if (!GUEST_PERMISSION.inviteRes) if ($c.guest) return;
			if ($c._invited != msg.from) return;
			if (msg.res) {
				$c.enter({id: $c._invited}, false, true);
			} else {
				if (DIC[temp.master]) DIC[temp.master].send('inviteNo', {target: $c.id});
			}
			delete $c._invited;
			break;
		/* 망할 셧다운제
		case 'caj':
			if(!$c._checkAjae) return;
			clearTimeout($c._checkAjae);
			if(msg.answer == "yes") $c.confirmAjae(msg.input);
			else if(KKuTu.NIGHT){
				$c.sendError(440);
				$c.socket.close();
			}
			break;
		*/
		case 'test':
			checkTailUser($c.id, $c.place, msg);
			break;
		default:
			break;
	}
}

KKuTu.onClientClosed = function($c, code){
	var name;

	if($c.socket) $c.socket.removeAllListeners();
	// 같은 계정이 다시 접속해 DIC가 새 클라이언트로 바뀐 경우(408), 새 클라이언트의 정보를 지우면 안 된다.
	if(DIC[$c.id] !== $c) return;
	delete DIC[$c.id];
	if($c._error != 409) MainDB.users.update([ '_id', $c.id ]).set([ 'server', "" ]).on();
	if($c.profile){
		name = ($c.profile.title || $c.profile.name || "").replace(/\s/g, "");
		if(DNAME[name] == $c.id) delete DNAME[name];
	}
	if($c.friends) narrateFriends($c.id, $c.friends, "off");
	KKuTu.publish('disconn', { id: $c.id });

	JLog.alert("Exit #" + $c.id);
};
