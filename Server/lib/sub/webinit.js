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

// By https://github.com/ishqqytiger

var GLOBAL	 = require("./global.json");
var JLog	 = require("./jjlog");
var Language = {
	'ko_KR': require("../Web/lang/ko_KR.json"),
	'en_US': require("../Web/lang/en_US.json")
};

for(let lang in Language) updateThemes(lang);

function updateThemes(lang){
	Language[lang].themes = {};
	for(let j in Language[lang].kkutu)
		if(j.includes("theme_"))
			Language[lang].themes[j] = Language[lang].kkutu[j];
}
function updateLanguage(){
	var i, src;
	
	for(i in Language){
		src = `../Web/lang/${i}.json`;
		
		delete require.cache[require.resolve(src)];
		Language[i] = require(src);

		updateThemes(i);
	}
}
function getLanguage(locale, page, shop){
	var i;
	var L = Language[locale] || {};
	var R = {};
	
	for(i in L.GLOBAL) R[i] = L.GLOBAL[i];
	if(shop) for(i in L.SHOP) R[i] = L.SHOP[i];
	if(L[page]) for(i in L[page]) R[i] = L[page][i];
	if(page == "help" || page == "search") Object.assign(R, L.themes);
	if(R['title']){
		const serverName = (process.env['KKT_SV_NAME'] || '').trim();
		if(serverName) R['title'] = `[${serverName}] ${R['title']}`;
	}
	
	return R;
}
function isInternalIp(ip){
	if(!ip) return false;
	var normalized = String(ip).trim().toLowerCase();
	if(normalized.startsWith("::ffff:")) normalized = normalized.slice(7);
	if(normalized == "::1" || normalized == "127.0.0.1" || normalized == "localhost") return true;
	if(normalized.startsWith("10.")) return true;
	if(normalized.startsWith("192.168.")) return true;
	if(/^172\.(1[6-9]|2\d|3[0-1])\./.test(normalized)) return true;
	return false;
}
function page(req, res, file, data){
	if(data == undefined)	data = {};
	if(req.session.createdAt){
		if(new Date() - req.session.createdAt > 3600000){
			delete req.session.profile;
		}
	}else{
		req.session.createdAt = new Date();
	}

	var cfConnectingIp = req.get('CF-Connecting-IP');
	var addr = GLOBAL.WAF ? (req.ip || "") : (cfConnectingIp || "");
	var sid = req.session.id || "";
	
	data.published = global.isPublic;
	data.lang = req.query.locale || "ko_KR";
	if(!Language[data.lang]) data.lang = "ko_KR";

	if(GLOBAL.WAF && !cfConnectingIp && !isInternalIp(addr)) return res.status(403).send("Direct ip connection is not allowed.");

	// URL ...?locale=en_US will show the page in English
	
	// if(exports.STATIC) data.static = exports.STATIC[data.lang];
	data.season = GLOBAL.SEASON;
	data.season_pre = GLOBAL.SEASON_PRE;
	
	data.locale = getLanguage(data.lang, data._page || file.split('_')[0], data._shop);
	data.session = req.session;
	if((/mobile/i).test(req.get('user-agent')) || req.query.mob){
		data.mobile = true;
		if(req.query.pc){
			data.as_pc = true;
			data.page = file;
		}else if(exports.MOBILE_AVAILABLE && exports.MOBILE_AVAILABLE.includes(file)){
			data.page = 'm_' + file;
		}else{
			data.mobile = false;
			data.page = file;
		}
	}else{
		data.page = file;
	}
	
	JLog.log(`${addr}@${sid.slice(0, 10)} ${data.page}, ${JSON.stringify(req.params)}`);
	JLog.log(`${req.get('X-Forwarded-For')}, ${cfConnectingIp}`);
	res.render(data.page, data, function(err, html){
		if(err) res.send(err.toString());
		else res.send(html);
	});
}
exports.init = function(Server, shop){
	Server.get("/language/:page/:lang", function(req, res){
		var page = req.params.page.replace(/_/g, "/");
		var lang = req.params.lang;
		
		if(page.substr(0, 2) == "m/") page = page.slice(2);
			if(page == "portal" || page == "v2") page = "kkutu";
		res.send("window.L = "+JSON.stringify(getLanguage(lang, page, shop))+";");
	});
	Server.get("/language/flush", function(req, res){
		// 누구나 언어 파일을 다시 읽게 할 수 없도록 관리자 또는 내부망에서만 허용한다.
		var isAdmin = req.session && req.session.profile && GLOBAL.ADMIN.indexOf(req.session.profile.id) != -1;
		
		if(!isAdmin && !isInternalIp(req.ip)) return res.sendStatus(403);
		updateLanguage();
		res.sendStatus(200);
	});
};
exports.page = page;