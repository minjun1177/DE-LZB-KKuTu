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

const MainDB	 = require("../db");
const JLog	 = require("../../sub/jjlog");
// const Ajae	 = require("../../sub/ajaejs").checkAjae;
const passport = require('passport');
const glob = require('glob-promise');
const GLOBAL	 = require("../../sub/global.json");
const config = require('../../sub/auth.json');
const path = require('path')

function process(req, accessToken, MainDB, $p, done) {
    $p.token = accessToken;
    $p.sid = req.session.id;

    const now = Date.now();
    $p.sid = req.session.id;
    req.session.admin = GLOBAL.ADMIN.includes($p.id);
    req.session.authType = $p.authType;
    
    MainDB.users.findOne([ '_id', $p.id ]).on(($body) => {
		$p.nickname = $p.title = $p.name = ($body && $body.nickname) ? $body.nickname : $p.title || $p.name;
		req.session.profile = $p;
        MainDB.users.update([ '_id', $p.id ]).set([ 'lastLogin', now ]).on();
		// 세션이 DB에 저장된 뒤에 로그인을 끝내야 "/"로 돌아갔을 때 로그아웃 상태로 보이지 않는다.
		MainDB.session.upsert([ '_id', req.session.id ]).set({
			'profile': $p,
			'createdAt': now
		}).on(() => done(null, $p), null, (err) => done(err || new Error("Failed to save the session")));
    }, null, (err) => done(err || new Error("Failed to load the user")));
}
function isInternalIp(ip){
	var normalized = String(ip || "").trim().toLowerCase();
	
	if(normalized.startsWith("::ffff:")) normalized = normalized.slice(7);
	if(normalized == "::1" || normalized == "127.0.0.1") return true;
	if(normalized.startsWith("10.") || normalized.startsWith("192.168.")) return true;
	return /^172\.(1[6-9]|2\d|3[0-1])\./.test(normalized);
}

exports.run = (Server, page) => {
    //passport configure
    passport.serializeUser((user, done) => {
        done(null, user);
    });

    passport.deserializeUser((obj, done) => {
        done(null, obj);
    });

    const strategyList = {};
    
	for (let i in config) {
		try {
			let auth = require(path.resolve(__dirname, '..', 'auth', 'auth_' + i + '.js'))
			Server.get('/login/' + auth.config.vendor, passport.authenticate(auth.config.vendor))
			Server.get('/login/' + auth.config.vendor + '/callback', passport.authenticate(auth.config.vendor, {
				successRedirect: '/',
				failureRedirect: '/loginfail'
			}))
			passport.use(new auth.config.strategy(auth.strategyConfig, auth.strategy(process, MainDB /*, Ajae */)));
			strategyList[auth.config.vendor] = {
				vendor: auth.config.vendor,
				displayName: auth.config.displayName,
				color: auth.config.color,
				fontColor: auth.config.fontColor
			};

			JLog.info(`OAuth Strategy ${i} loaded successfully.`)
		} catch (error) {
			JLog.error(`OAuth Strategy ${i} is not loaded`)
			JLog.error(error.message)
		}
	}
	
	Server.get("/login", (req, res) => {
		if(global.isPublic){
			page(req, res, "login", { '_id': req.session.id, 'text': req.query.desc, 'loginList': strategyList});
		}else{
			// 비공개(개발) 모드에서는 아무 id로나 관리자 로그인이 되므로, 외부에서 접근할 수 없도록 내부망으로 제한한다.
			if(!isInternalIp(req.ip)) return res.status(403).send("Local login is only allowed from the internal network.");
			let now = Date.now();
			let id = String(req.query.id || "ADMIN");
			let lp = {
				id: id,
				title: "LOCAL #" + id,
				birth: [ 4, 16, 0 ],
				_age: { min: 20, max: undefined }
			};
			MainDB.session.upsert([ '_id', req.session.id ]).set([ 'profile', JSON.stringify(lp) ], [ 'createdAt', now ]).on(function($res){
				MainDB.users.update([ '_id', id ]).set([ 'lastLogin', now ]).on();
				req.session.admin = true;
				req.session.profile = lp;
				res.redirect("/");
			});
		}
	});

	Server.get("/logout", (req, res) => {
		if(!req.session.profile){
			return res.redirect("/");
		} else {
			req.session.destroy();
			res.redirect('/');
		}
	});

	Server.get("/loginfail", (req, res) => {
		page(req, res, "loginfail");
	});
}