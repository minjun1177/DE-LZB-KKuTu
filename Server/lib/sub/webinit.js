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

var File	 = require("fs");
var Path	 = require("path");
var GLOBAL	 = require("./global.json");
var PUBLIC_DIR = Path.resolve(__dirname, "../Web/public");
var JLog	 = require("./jjlog");
var Language = {
	'ko_KR': require("../Web/lang/ko_KR.json"),
	'en_US': require("../Web/lang/en_US.json")
};

const DEFAULT_LOCALE = "ko_KR";
const LOCALE_COOKIE = "kkt_locale";
const LOCALE_NAMES = { 'ko_KR': "한국어", 'en_US': "English" };

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
function hasPublicFile(rel){
	try{
		return File.statSync(Path.join(PUBLIC_DIR, rel)).isFile();
	}catch(e){
		return false;
	}
}
function getCookie(req, name){
	var list = String(req.headers.cookie || "").split(/;\s*/);
	var i, eq;
	
	for(i in list){
		eq = list[i].indexOf("=");
		if(eq > 0 && list[i].slice(0, eq) == name){
			try{
				return decodeURIComponent(list[i].slice(eq + 1));
			}catch(e){
				return null;
			}
		}
	}
	return null;
}
function setLocaleCookie(res, lang){
	res.append('Set-Cookie', `${LOCALE_COOKIE}=${lang}; Path=/; Max-Age=31536000; SameSite=Lax`);
}
// 언어는 ?locale= 로 고르면 쿠키에 저장해, 이후 이동(게임 시작, 로그인 등)에서 locale이 URL에서 빠져도 유지한다.
function resolveLocale(req, res){
	var q = req.query.locale;
	var c;
	
	if(typeof q == 'string' && Language[q]){
		if(getCookie(req, LOCALE_COOKIE) != q) setLocaleCookie(res, q);
		return q;
	}
	c = getCookie(req, LOCALE_COOKIE);
	if(c && Language[c]) return c;
	return DEFAULT_LOCALE;
}
// 현재 주소에서 locale 매개변수만 뺀 경로 (언어 전환 뒤 같은 페이지로 돌아오기 위해 사용)
function getReturnPath(req){
	var url;
	
	try{
		url = new URL(req.originalUrl, "http://localhost");
	}catch(e){
		return "/";
	}
	url.searchParams.delete('locale');
	return url.pathname + url.search;
}
function isSafeReturnPath(path){
	return typeof path == 'string' && /^\/(?![\/\\])/.test(path);
}
function getLocaleSwitch(req, current){
	var next = encodeURIComponent(getReturnPath(req));
	
	return Object.keys(LOCALE_NAMES).filter(function(code){ return Language[code]; }).map(function(code){
		return { code: code, name: LOCALE_NAMES[code], current: code == current, href: `/locale/${code}?next=${next}` };
	});
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
	data.lang = resolveLocale(req, res);
	data.langSwitch = getLocaleSwitch(req, data.lang);

	if(GLOBAL.WAF && !cfConnectingIp && !isInternalIp(addr)) return res.status(403).send("Direct ip connection is not allowed.");

	// URL ...?locale=en_US (또는 /locale/en_US) 로 언어를 바꾸면 쿠키에 저장되어 계속 유지된다.
	
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
	
	data.pageCss = hasPublicFile(`css/in_${data.page.replace("/", "_")}.css`);
	data.pageJs = hasPublicFile(`js/in_${data.page.replace("/", "_")}.min.js`);
	
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
	// 언어 전환: 쿠키에 저장하고 원래 보던 페이지로 돌아간다. (다른 사이트로의 이동은 허용하지 않는다)
	Server.get("/locale/:lang", function(req, res){
		var lang = req.params.lang;
		var next = req.query.next;
		
		if(Language[lang]) setLocaleCookie(res, lang);
		res.redirect(isSafeReturnPath(next) ? next : "/");
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