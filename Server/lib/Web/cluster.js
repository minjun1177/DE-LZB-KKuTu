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
var CPU = Number(process.argv[2]); //require("os").cpus().length;

if(isNaN(CPU)){
	console.log(`Invalid CPU Number ${CPU}`);
	return;
	// process.exit(1);
}
if(Cluster.isMaster){
	var keys = {};
	var fork = function(key){
		var w = Cluster.fork({ SERVER_NO_FORK: true, WS_KEY: key });
		
		keys[w.id] = key;
	};
	for(var i=0; i<CPU; i++){
		fork(i+1);
	}
	Cluster.on('exit', function(w){
		var key = keys[w.id];
		
		console.log(`Worker ${w.process.pid} died`);
		delete keys[w.id];
		// 워커가 죽으면 같은 WS_KEY로 다시 띄운다. (그렇지 않으면 모든 워커가 죽은 뒤 웹 서버가 멈춘다)
		setTimeout(function(){
			fork(key);
		}, 1000);
	});
}else{
	require("./main.js");
}