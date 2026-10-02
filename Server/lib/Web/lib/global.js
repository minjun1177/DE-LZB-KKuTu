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
 * getCookie 코드오류로 인한 코드 수정
 */
var global = {};
var L;

(function(){
	var size;
	var _setTimeout = setTimeout;
	
	function setCookie(cName, cValue, cDay){
        var expire = new Date();
		
        expire.setDate(expire.getDate() + cDay);
        cookies = cName + '=' + escape(cValue) + '; path=/ ';
        if(typeof cDay != 'undefined') cookies += ';expires=' + expire.toGMTString() + ';';
		
        document.cookie = cookies;
    }
    function getCookie(cName) {
        //볕뉘 수정
        var cName = cName+"=";
		var allCookie = decodeURIComponent(document.cookie).split(';');
		var cval = [];
		for(var i=0; i < allCookie.length; i++) {
			if (allCookie[i].trim().indexOf(cName) == 0) {
				cval = allCookie[i].trim().split("=");
			}
		}
		return unescape((cval.length > 0) ? cval[1] : "");
		//볕뉘 수정 끝
    }
	
	$.prototype.hotkey = function($f, code){
		var $this = $(this);
		($f || $(window)).on("keydown", function(e){
			if(!e.shiftKey){
				if(e.keyCode == code){
					// $("#JJoSearchTF").expl();
					$this.trigger("click");
					e.preventDefault();
				}
			}
		});
		return $this;
	};
	$.prototype.color = function(hex){
		return $(this).css({ 'color': hex });
	};
	$.prototype.bgColor = function(hex){
		return $(this).css({ 'background-color': hex });
	};
	$.cookie = function(key, value){
		if(value === undefined){
			return getCookie(key);
		}else{
			setCookie(key, value);
		}
	};
	$(document).ready(function(e){
		const LANG = {
			'ko_KR': "한국어"
		};
		var $gn = $("#global-notice").hide();
		var $c;
		var $expl;
		var gn = $("#gn-content").html() || "";
		
		global.profile = $("#profile").html();
		if(global.profile) global.profile = JSON.parse(global.profile);
		else global.profile = {};
		
		$.cookie('test', "good");
		if($.cookie('test') != "good"){
			$gn.html(gn = "쿠키 사용이 차단되어 있습니다. 로그인 관련 기능이 제한됩니다.<br>제한을 풀기 위해서는 브라우저 설정에서 쿠키 사용을 허용하도록 설정해야 합니다.<br>" + gn);
		}else{
			$.cookie('test', "");
		}
		if(gn.length > 1) $gn.show();
		$gn.on('click', function(e){ $gn.hide(); });
		
		$(window).on('resize', function(e){
			size = [ $(window).width(), $(window).height() ];
			
			$("#Middle").css('margin-left', Math.max(0, size[0] * 0.5 - 500));
			$("#Bottom").width(size[0]);
		}).on('mousemove', function(e){
			placeExpl(e.clientX, e.clientY);
		}).trigger('resize');
		
		// 설명 창은 마우스 오른쪽 아래에 두고, 화면을 넘으면 마우스 반대편으로 뒤집는다.
		// (화면 끝에 붙여 고정하면 한 축만 마우스를 따라가 계단처럼 움직이고, 창이 마우스를 가린다.)
		function placeExpl(x, y){
			var w, h, l, t;
			
			if(!$expl) return;
			w = $expl.outerWidth();
			h = $expl.outerHeight();
			l = x + 5;
			if(l + w > size[0] - 5) l = x - w - 5;
			t = y + 23;
			if(t + h > size[1] - 5) t = y - h - 5;
			$expl.css({ 'left': Math.max(0, l), 'top': Math.max(0, t) });
		}
		
		$("#quick-search-btn").on('click', function(e){
			var v;
			
			if($("#quick-search-btn").hasClass("searching")) return;
			if(v = $(".autocomp-select").html()) $("#quick-search-tf").val(v);
			$("#quick-search-btn").addClass("searching").html($("<i>").addClass("fa fa-spin fa-spinner"));
			location.href = "http://jjo.kr?q=" + encodeURI($("#quick-search-tf").val());
		}).hotkey($("#quick-search-tf"), 13);
	
	// 계정
		if($.cookie('lc') == "") $.cookie('lc', "ko_KR");
		
		if(global.profile.token){
			$("#account-info").html(global.profile.title || global.profile.name).on('click', function(e){
				if(confirm(L['ASK_LOGOUT'])) requestLogout(e);
			});
		}else{
			if(window['FB']){
				try{
					FB.logout();
				}catch(e){
					_setTimeout(function(){ FB.logout(); }, 1000);
				}
			}
			$("#account-info").html(L['LOGIN']).on('click', requestLogin);
		}
		/*if($.cookie('forlogout')){
			requestLogout();
		}*/
		global.watchInput($("#quick-search-tf"));
		(global.expl = function($mother){
			var $q = $mother ? $mother.find(".expl") : $(".expl");
			
			// 같은 요소에 여러 번 호출돼도 핸들러가 겹치지 않도록 이전 것을 지우고 건다.
			$q.parent().addClass("expl-mother").off('.expl').on('mouseenter.expl', function(e){
				var $e = $(e.currentTarget).children(".expl");
				
				$(".expl-active").removeClass("expl-active");
				$expl = $e.addClass("expl-active");
				// 보이게 한 뒤에 크기를 재고 바로 자리를 잡는다. 숨긴 채로 재면 크기가 틀리고,
				// 다음 mousemove 전까지 이전 위치나 원래 문서 위치에 떠 있게 된다.
				placeExpl(e.clientX, e.clientY);
			}).on('mouseleave.expl', function(e){
				$(e.currentTarget).children(".expl").removeClass("expl-active");
				$expl = null;
			});
		})();
	});
	function requestLogin(e){
		var tl = [ (size[0] - 200) * 0.5, (size[1] - 300) * 0.5 ];
		
		// $.cookie('preprev', location.href);
		location.href = "/login";
	}
	function requestLogout(e){
		/*if(location.host == "kkutu.kr"){
			// $.cookie('forlogout', "true");
			location.href = "/logout";
			return;
		}*/
		//볕뉘 수정 구문 삭제(161~167, facebook js SDK 대응코드 삭제)
		location.href = "/logout";
	}
	function onWatchInput($o, prev){
		var cid = $o.attr('id');
		var $ac = $("#ac-"+cid);
		
		if($o.val() != prev){
			if(prev = $o.val()){
				$.get("http://jjo.kr/search?q=" + encodeURI(prev), function(res){
					var i, c = 0;
					
					$ac.empty();
					global['wl-'+cid] = res.list.slice(0, 10);
					global['wi-'+cid] = -1;
					for(i in res.list){
						if(c++ >= 10) break;
						$ac.append($("<div>")
							.attr('id', "aci-" + res.list[i]._id)
							.addClass("autocomp-item ellipse")
							.html(res.list[i].profile.name)
							.on('click', function(e){
								location.href = "http://jjo.kr/users/" + $(e.currentTarget).attr('id').slice(4);
							})
						);
					}
					if(c){
						$ac.show();
						$o.css('border-bottom-left-radius', 0);
					}else{
						$ac.hide();
						$o.css('border-bottom-left-radius', "");
					}
				});
			}else{
				$ac.hide();
				$o.css('border-bottom-left-radius', "");
			}
		}
		_setTimeout(onWatchInput, 200, $o, prev);
	}
	global.watchInput = function($tf){
		var cid = $tf.attr('id');
		
		$tf.after($("<div>")
			.addClass("autocomp")
			.attr('id', "ac-"+cid)
			.css({
				'margin-top': $tf.outerHeight(),
				'width': $tf.outerWidth() - 6
			})
			.hide()
		).on('keydown', function(e){
			var dir = (e.keyCode == 38) ? -1 : (e.keyCode == 40) ? 1 : 0;
			var list;
			
			if(!dir) return;
			if(!(list = global['wl-'+cid])) return;
			if(global['wi-'+cid] == -1) if(dir == -1) dir = 0;
			
			$(".autocomp-select").removeClass("autocomp-select");
			global['wi-'+cid] += dir;
			if(global['wi-'+cid] < 0) global['wi-'+cid] += list.length;
			if(global['wi-'+cid] >= list.length) global['wi-'+cid] = 0;
			
			$("#aci-" + list[global['wi-'+cid]]._id).addClass("autocomp-select");
			e.preventDefault();
		});
		return _setTimeout(onWatchInput, 200, $tf, $tf.val());
	};
	global.zeroPadding = function(num, len){ var s = num.toString(); return "000000000000000".slice(0, Math.max(0, len - s.length)) + s; };
	global.onPopup = function(url){
		location.href = url;
	};
})();