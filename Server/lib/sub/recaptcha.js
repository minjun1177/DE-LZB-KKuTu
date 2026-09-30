/**
 * Created by horyu1234 on 2017-11-14.
 */
const request = require('request');
const GLOBAL = require("./global.json");

exports.verifyRecaptcha = function (responseToken, remoteIp, callback) {
    // 사용자가 보낸 토큰이 쿼리 문자열에 다른 매개변수를 끼워 넣지 못하도록 인코딩한다.
    const verifyUrl = `https://google.com/recaptcha/api/siteverify?secret=${encodeURIComponent(GLOBAL.GOOGLE_RECAPTCHA_SECRET_KEY || "")}&response=${encodeURIComponent(String(responseToken || ""))}&remoteip=${encodeURIComponent(String(remoteIp || ""))}`;
    request(verifyUrl, (err, response, body) => {
        try {
            const responseBody = JSON.parse(body);
            callback(responseBody.success);
        } catch (e) {
            callback(false);
        }
    });
};