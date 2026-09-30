/**
 * Rule the words! DE LZB KKuTu
 * You can see this file in <https://github.com/minjun1177/DE-LZB-KKuTu>
 */

var JLog = require('./jjlog');
var GLOBAL = require('./global.json');
const { WebhookClient, EmbedBuilder } = require('discord.js');
let UseDiscordWebhook = GLOBAL.USE_DISCORD_WEBHOOK && GLOBAL.DISCORD_WEBHOOK_URL && GLOBAL.DISCORD_WEBHOOK_URL.startsWith("https://discord.com/api/webhooks/");
const FIELD_MAX = 1000; // Discord 임베드 필드 최대 1024자 (코드 블록 기호 여유분 포함)

/**
 * 웹후크를 보낸다. 웹후크가 꺼져 있으면 아무것도 하지 않고,
 * 임베드를 만드는 도중(필드 길이 초과, 잘못된 URL 등) 발생하는 예외가 호출한 쪽(게임 서버)으로 퍼지지 않게 한다.
 */
function dispatch(buildEmbed){
    if (!UseDiscordWebhook) return;
    try {
        const webhookClient = new WebhookClient({ url: GLOBAL.DISCORD_WEBHOOK_URL });
        const embed = buildEmbed();

        webhookClient.send({
            username: GLOBAL.DISCORD_WEBHOOK_NICKNAME || 'KKuTu Alert',
            avatarURL: GLOBAL.DISCORD_AVATAR || 'https://i.imgur.com/AfFp7pu.png',
            embeds: [embed],
        }).catch(function(error){
            JLog.warn(`Error on sending Discord webhook: ${error}`);
        });
    } catch (error) {
        JLog.warn(`Error on building Discord webhook: ${error}`);
    }
}
function clip(value, fallback){
    var text = String(value == null ? "" : value);

    if (text.length > FIELD_MAX) text = text.slice(0, FIELD_MAX - 3) + "...";
    return text || fallback || "-";
}

exports.SendWebhookOnTalk = function(profile, msg, place, isrobot) {
    if (!UseDiscordWebhook) return;
    var prefix = isrobot ? (GLOBAL.IS_DISCORD_WEBHOOK_ENGLISH ? "[Robot]" : "[로봇]") : "";
    var nickname = (profile && (profile.nickname || profile.title || profile.name || profile.id)) || "Unknown";
    
    nickname = String(nickname).slice(0, 100); // 닉네임은 100자로 제한
    var placeText = String(place == null ? "-" : place).slice(0, 100);
    var msgText = String(msg == null ? "" : msg);

    if(msgText.length > FIELD_MAX - 10) msgText = msgText.slice(0, FIELD_MAX - 13) + "...";

    dispatch(() => new EmbedBuilder()
        .setTitle( GLOBAL.IS_DISCORD_WEBHOOK_ENGLISH ? `${prefix ? prefix + " " : ""}${nickname} send a chat.`.slice(0,256) :`${prefix ? prefix + " " : ""}${nickname}님이 채팅을 입력하셨습니다.`.slice(0, 256))
        .addFields(
            { name: GLOBAL.IS_DISCORD_WEBHOOK_ENGLISH ? "Place" : "장소", value: placeText },
            { name: GLOBAL.IS_DISCORD_WEBHOOK_ENGLISH ? "Message" : "내용", value: `\`\`\`${msgText || "(empty)"}\`\`\`` },
            { name: GLOBAL.IS_DISCORD_WEBHOOK_ENGLISH ? "Time" : "시간", value: new Date().toLocaleString() }
        )
        .setColor(0xF1C40F)
        .setFooter({ text: GLOBAL.DISCORD_WEBHOOK_NICKNAME || 'KKuTu Alert', iconURL: GLOBAL.DISCORD_AVATAR || 'https://i.imgur.com/AfFp7pu.png' })
        .setTimestamp());
}
exports.SendWebhookOnDeleteRoom = function(roomid) {
    if (!UseDiscordWebhook) return;
    
    var roomidText = String(roomid || "").slice(0, FIELD_MAX);

    dispatch(() => new EmbedBuilder()
        .setTitle(GLOBAL.IS_DISCORD_WEBHOOK_ENGLISH ? "Room Deleted" : "방 삭제됨")
        .addFields(
            { name: GLOBAL.IS_DISCORD_WEBHOOK_ENGLISH ? "Room ID" : "방 ID", value: roomidText || (GLOBAL.IS_DISCORD_WEBHOOK_ENGLISH ? "None" : "없음") }
        )
        .setColor(0xE74C3C)
        .setTimestamp());
}
exports.SendWebhookOnRoomsetting = function(roomid, passwd, mode, opts) { // TODO - modify에 JSON정보 확인안됨 - 해결
    if (!UseDiscordWebhook) return;

    // 필드 값 길이 제한 (Discord embed field max 1024 chars)
    var roomidText = String(roomid || "").slice(0, FIELD_MAX);
    var passwdText = String(passwd || "").slice(0, FIELD_MAX);
    var modeText = String(mode || "").slice(0, FIELD_MAX);
    var optsText = "";
    
    if (opts) {
        try {
            optsText = JSON.stringify(opts);
            if (optsText.length > FIELD_MAX - 10) optsText = optsText.slice(0, FIELD_MAX - 13) + "...";
        } catch(e) {
            optsText = "[Invalid Options]";
        }
    }

    dispatch(() => new EmbedBuilder()
        .setTitle(GLOBAL.IS_DISCORD_WEBHOOK_ENGLISH ? "Room Setting Changed" : "방 설정 변경됨")
        .addFields(
            { name: GLOBAL.IS_DISCORD_WEBHOOK_ENGLISH ? "Room ID" : "방 ID", value: roomidText || (GLOBAL.IS_DISCORD_WEBHOOK_ENGLISH ? "None" : "없음") },
            { name: GLOBAL.IS_DISCORD_WEBHOOK_ENGLISH ? "Password" : "비밀번호", value: passwdText || (GLOBAL.IS_DISCORD_WEBHOOK_ENGLISH ? "None" : "없음") },
            { name: GLOBAL.IS_DISCORD_WEBHOOK_ENGLISH ? "Mode" : "모드", value: modeText || (GLOBAL.IS_DISCORD_WEBHOOK_ENGLISH ? "None" : "없음") },
            { name: GLOBAL.IS_DISCORD_WEBHOOK_ENGLISH ? "Options" : "옵션", value: optsText ? `\`\`\`${optsText}\`\`\`` : (GLOBAL.IS_DISCORD_WEBHOOK_ENGLISH ? "None" : "없음") }
        )
        .setColor(0x2ECC71)
        .setTimestamp());
}
exports.SendWebhookOnRoomJoin = function(roomid, targetid, passwd) {
    if (!UseDiscordWebhook) return;
    
    var roomidText = String(roomid || "").slice(0, FIELD_MAX);
    var targetidText = String(targetid || "").slice(0, FIELD_MAX);
    var passwdText = String(passwd || "").slice(0, FIELD_MAX);

    dispatch(() => new EmbedBuilder()
        .setTitle(GLOBAL.IS_DISCORD_WEBHOOK_ENGLISH ? "Room Joined" : "방 입장됨")
        .addFields(
            { name: GLOBAL.IS_DISCORD_WEBHOOK_ENGLISH ? "Room ID" : "방 ID", value: roomidText || (GLOBAL.IS_DISCORD_WEBHOOK_ENGLISH ? "None" : "없음") },
            { name: GLOBAL.IS_DISCORD_WEBHOOK_ENGLISH ? "Target ID" : "대상 ID", value: targetidText || (GLOBAL.IS_DISCORD_WEBHOOK_ENGLISH ? "None" : "없음") },
            { name: GLOBAL.IS_DISCORD_WEBHOOK_ENGLISH ? "Password" : "비밀번호", value: passwdText || (GLOBAL.IS_DISCORD_WEBHOOK_ENGLISH ? "None" : "없음") }
        )
        .setColor(0x9B59B6)
        .setTimestamp());
}
exports.SendWebhookOnGameStart = function(roomid, round, mode) {
    if (!UseDiscordWebhook) return;
    
    var roomidText = String(roomid || "").slice(0, FIELD_MAX);
    var modeText = String(mode || "").slice(0, FIELD_MAX);

    dispatch(() => new EmbedBuilder()
        .setTitle(GLOBAL.IS_DISCORD_WEBHOOK_ENGLISH ? "Game Started" : "게임 시작됨")
        .addFields(
            { name: GLOBAL.IS_DISCORD_WEBHOOK_ENGLISH ? "Room ID" : "방 ID", value: roomidText || (GLOBAL.IS_DISCORD_WEBHOOK_ENGLISH ? "None" : "없음") },
            { name: GLOBAL.IS_DISCORD_WEBHOOK_ENGLISH ? "Round" : "라운드", value: String(round + 1) },
            { name: GLOBAL.IS_DISCORD_WEBHOOK_ENGLISH ? "Mode" : "모드", value: `\`\`\`${modeText || "unknown"}\`\`\`` }
        )
        .setColor(0x1ABC9C)
        .setTimestamp());
}
exports.SendWebhookOnGameEnd = function(roomid, resultCount, userCount) {
    if (!UseDiscordWebhook) return;
    
    var roomidText = String(roomid || "").slice(0, FIELD_MAX);
    var resultCountText = String(resultCount || "").slice(0, FIELD_MAX);

    dispatch(() => new EmbedBuilder()
        .setTitle(GLOBAL.IS_DISCORD_WEBHOOK_ENGLISH ? "Game Ended" : "게임 종료됨")
        .addFields(
            { name: GLOBAL.IS_DISCORD_WEBHOOK_ENGLISH ? "Room ID" : "방 ID", value: roomidText || (GLOBAL.IS_DISCORD_WEBHOOK_ENGLISH ? "None" : "없음") },
            { name: GLOBAL.IS_DISCORD_WEBHOOK_ENGLISH ? "Result Count" : "결과", value: resultCountText || (GLOBAL.IS_DISCORD_WEBHOOK_ENGLISH ? "None" : "없음") },
            { name: GLOBAL.IS_DISCORD_WEBHOOK_ENGLISH ? "User Count" : "유저 수", value: String(userCount) }
        )
        .setColor(0x34495E)
        .setTimestamp());
}
exports.SendWebhookOnRoundEnd = function(roomid, round) {
    if (!UseDiscordWebhook) return;
    
    var roomidText = String(roomid || "").slice(0, FIELD_MAX);

    dispatch(() => new EmbedBuilder()
        .setTitle(GLOBAL.IS_DISCORD_WEBHOOK_ENGLISH ? "Round Ended" : "라운드 종료됨")
        .addFields(
            { name: GLOBAL.IS_DISCORD_WEBHOOK_ENGLISH ? "Room ID" : "방 ID", value: roomidText || (GLOBAL.IS_DISCORD_WEBHOOK_ENGLISH ? "None" : "없음") },
            { name: GLOBAL.IS_DISCORD_WEBHOOK_ENGLISH ? "Round" : "라운드", value: String(round) }
        )
        .setColor(0x8E44AD)
        .setTimestamp());
}
exports.SendWebhookOnRoomLeave = function(roomid, targetid, removed) {
    if (!UseDiscordWebhook) return;
    
    var roomidText = String(roomid || "").slice(0, FIELD_MAX);
    var targetidText = String(targetid || "").slice(0, FIELD_MAX);
    var removedText = removed ? (GLOBAL.IS_DISCORD_WEBHOOK_ENGLISH ? "Yes" : "예") : (GLOBAL.IS_DISCORD_WEBHOOK_ENGLISH ? "No" : "아니오");

    dispatch(() => new EmbedBuilder()
        .setTitle(GLOBAL.IS_DISCORD_WEBHOOK_ENGLISH ? "Room Left" : "방 퇴장됨")
        .addFields(
            { name: GLOBAL.IS_DISCORD_WEBHOOK_ENGLISH ? "Room ID" : "방 ID", value: roomidText || (GLOBAL.IS_DISCORD_WEBHOOK_ENGLISH ? "None" : "없음") },
            { name: GLOBAL.IS_DISCORD_WEBHOOK_ENGLISH ? "Target ID" : "대상 ID", value: targetidText || (GLOBAL.IS_DISCORD_WEBHOOK_ENGLISH ? "None" : "없음") },
            { name: GLOBAL.IS_DISCORD_WEBHOOK_ENGLISH ? "Removed" : "방 제거됨", value: removedText }
        )
        .setColor(0xE67E22)
        .setTimestamp());
}
exports.sendDiscordWebhookOnUserJoin = function(usernickname, userid, iseng) {
    // JLog.info(`${whurl} ${usernickname} ${userid} ${iseng}`);
    dispatch(() => new EmbedBuilder()
        .setTitle(iseng ? "A new user has joined!" : "새로운 사용자가 접속했습니다!")
        // .setThumbnail() // user avatar but how to??
        .setDescription(clip(`**${usernickname || userid}** (${userid})`))
        .setColor(0x00AE86)
        .setTimestamp());
}
exports.sendDiscordWebhookOnUserBan = function(userid, reason, day, iseng) {
    dispatch(() => new EmbedBuilder()
        .setTitle(iseng ? "A user has been banned." : "사용자가 차단되었습니다.")
        .setDescription(clip(iseng ? `**${userid}**\nReason: ${reason}\nDuration: ${day} day(s)` : `**${userid}**\n사유: ${reason}\n기간: ${day}일`))
        .setColor(0xFF0000)
        .setTimestamp());
}
exports.sendDiscordWebhookOnIPBan = function(ipAddr, reason, day, iseng) {
    dispatch(() => new EmbedBuilder()
        .setTitle(iseng ? "An IP address has been banned." : "IP 주소가 차단되었습니다.")
        .setDescription(clip(iseng ? `**${ipAddr}**\nReason: ${reason}\nDuration: ${day} day(s)` : `**${ipAddr}**\n사유: ${reason}\n기간: ${day}일`))
        .setColor(0xFF0000)
        .setTimestamp());
}
exports.sendDiscordWebhookOnUserUnban = function(userid, iseng) {
    dispatch(() => new EmbedBuilder()
        .setTitle(iseng ? "A user has been unbanned." : "사용자 차단이 해제되었습니다.")
        .setDescription(`**${userid}**`)
        .setColor(0x00FF00)
        .setTimestamp());
}
exports.sendDiscordWebhookOnIPUnban = function(ipAddr, iseng) {
    dispatch(() => new EmbedBuilder()
        .setTitle(iseng ? "An IP address has been unbanned." : "IP 주소 차단이 해제되었습니다.")
        .setDescription(`**${ipAddr}**`)
        .setColor(0x00FF00)
        .setTimestamp());
}
exports.sendDiscordWebhookOnAutoban = function(userid, ipAddr, reason, iseng) {
    dispatch(() => new EmbedBuilder()
        .setTitle(iseng ? "A user has been automatically banned." : "사용자가 자동으로 차단되었습니다.")
        .addFields(
            { name: iseng ? "User" : "유저", value: String(userid || "Unknown").slice(0, FIELD_MAX) },
            { name: iseng ? "IP" : "IP", value: String(ipAddr || "Unknown").slice(0, FIELD_MAX) },
            { name: iseng ? "Reason" : "사유", value: String(reason || "Unknown").slice(0, FIELD_MAX) }
        )
        .setColor(0xFF4500)
        .setTimestamp());
}
exports.sendDiscordWebhookOnJoinBaneduser = function(userid, ipAddr, reason, day, iseng) {
    dispatch(() => new EmbedBuilder()
        .setTitle(iseng ? "A banned user has attempted to join." : "차단된 사용자가 접속을 시도했습니다.")
        .addFields(
            { name: iseng ? "User" : "유저", value: String(userid || "Unknown").slice(0, FIELD_MAX) },
            { name: iseng ? "IP" : "IP", value: String(ipAddr || "Unknown").slice(0, FIELD_MAX) },
            { name: iseng ? "Reason" : "사유", value: String(reason || "Unknown").slice(0, FIELD_MAX) },
            { name: iseng ? "Days" : "일수", value: String(day || "Unknown").slice(0, FIELD_MAX) }
        )
        .setColor(0xFF6347)
        .setTimestamp());
}