/**
 * Rule the words! DE LZB KKuTu
 * You can see this file in <https://github.com/minjun1177/DE-LZB-KKuTu>
 */

/**
 * 사용자별 요청 직렬화
 *
 * 상점(구매/환불/장착/강화/조합/사용) 요청은 "DB에서 읽기 → 계산 → 덮어쓰기" 순서로 동작한다.
 * 같은 사용자가 요청을 동시에 여러 번 보내면 모두 같은 옛 값을 읽어 아이템이나 돈이 복사될 수 있으므로,
 * 한 사용자의 요청은 이전 요청의 응답이 끝난 뒤에 처리한다.
 * (웹 서버 워커가 여러 개인 경우를 위해 돈이 바뀌는 요청은 DB 조건부 갱신도 함께 사용한다.)
 */
const LOCKS = {};
const LOCK_TIMEOUT = 10000;

exports.run = function(uid, res, task){
	var run = function(){
		var released = false;
		var timer;
		var release = function(){
			var queue;

			if(released) return;
			released = true;
			clearTimeout(timer);
			queue = LOCKS[uid];
			if(queue && queue.length) queue.shift()();
			else delete LOCKS[uid];
		};

		res.once('finish', release);
		res.once('close', release);
		// 응답이 끝나지 않는 경우(DB 오류 등)에도 영원히 잠기지 않도록 한다.
		timer = setTimeout(release, LOCK_TIMEOUT);
		try{
			task();
		}catch(e){
			release();
			throw e;
		}
	};

	if(LOCKS[uid]) LOCKS[uid].push(run);
	else{
		LOCKS[uid] = [];
		run();
	}
};
