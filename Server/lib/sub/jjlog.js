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

// 모듈 호출

var colors = require('colors');
// Discord Webhook [S]
var GLOBAL = require('./global.json');
const { WebhookClient, EmbedBuilder } = require('discord.js');
let UseDiscordWebhook = GLOBAL.USE_DISCORD_WEBHOOK && GLOBAL.DISCORD_WEBHOOK_URL && GLOBAL.DISCORD_WEBHOOK_URL.startsWith("https://discord.com/api/webhooks/");
let SEND_WEBHOOK_AT_JLOG = false
var JLog_wh_nickname = 'JLog Alert';
var MENTION_ON_ERROR = true;
async function sendDiscordWebhookOnJLog(whurl, type, message, color) {
	const shouldSendWebhook = UseDiscordWebhook && (SEND_WEBHOOK_AT_JLOG || (type === "Error" && MENTION_ON_ERROR));
	if (!shouldSendWebhook) return;
	const shouldMentionHere = type === "Error" && MENTION_ON_ERROR;
	// 이 함수 안에서 발생한 오류는 처리되지 않은 Promise 거부가 되어 프로세스를 종료시킬 수 있으므로 모두 잡는다.
	// (임베드 필드는 1024자 제한이 있어 긴 오류 메시지를 그대로 넣으면 예외가 발생한다)
	try {
		let text = String(message == null ? "" : message);
		if (text.length > 900) text = text.slice(0, 897) + "...";
		const dcwhclient = new WebhookClient({ url: whurl });
		const dcwhembed = new EmbedBuilder()
			.setTitle("JLog Alert")
			.addFields(
				{ name: "Type", value: type },
				{ name: "Message", value: `\`\`\`${text || "(empty)"}\`\`\` ${shouldMentionHere ? "@here" : ""}` },
				{ name: "Time", value: new Date().toLocaleString() }
			)
			.setColor(color)
			.setTimestamp();
		await dcwhclient.send({
			username: JLog_wh_nickname || 'JLog Alert',
			avatarURL: GLOBAL.DISCORD_AVATAR || 'https://i.imgur.com/AfFp7pu.png', // default discord js avatar
			embeds: [dcwhembed]
		});
	} catch (error) {
		// JLog.warn을 부르면 다시 이 함수로 들어오므로 콘솔에만 남긴다. (예전에는 정의되지 않은 JLog를 참조해 오류가 났다)
		callLog(`Failed to send Discord webhook: ${error}`);
	}
}
// Discord Webhook [E]

function callLog(text){
	var date = new Date();
	var o = {
		year: 1900 + date.getYear(),
		month: date.getMonth() + 1,
		date: date.getDate(),
		hour: date.getHours(),
		minute: date.getMinutes(),
		second: date.getSeconds()
	}, i;
	
	for(i in o){
		if(o[i] < 10) o[i] = "0"+o[i];
		else o[i] = o[i].toString();
	}
	console.log("["+o.year+"-"+o.month+"-"+o.date+" "+o.hour+":"+o.minute+":"+o.second+"] "+text);
}
exports.log = function(text){
	callLog(text);
	sendDiscordWebhookOnJLog(GLOBAL.DISCORD_WEBHOOK_URL, "Log", text, 0x00AE86);
};
exports.info = function(text){
	callLog(text.cyan);
	sendDiscordWebhookOnJLog(GLOBAL.DISCORD_WEBHOOK_URL, "Info", text, 0x007BFF);
};
exports.success = function(text){
	callLog(text.green);
	sendDiscordWebhookOnJLog(GLOBAL.DISCORD_WEBHOOK_URL, "Success", text, 0x28A745);
};
exports.alert = function(text){
	callLog(text.yellow);
	sendDiscordWebhookOnJLog(GLOBAL.DISCORD_WEBHOOK_URL, "Alert", text, 0xFFFF00);
};
exports.warn = function(text){
	callLog(text.black.bgYellow);
	sendDiscordWebhookOnJLog(GLOBAL.DISCORD_WEBHOOK_URL, "Warning", text, 0xFFFF00);
};
exports.error = function(text){
	callLog(text.bgRed);
	sendDiscordWebhookOnJLog(GLOBAL.DISCORD_WEBHOOK_URL, "Error", text, 0xFF0000);
};
