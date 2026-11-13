/* GGORANGJI · 브이리뷰 위젯을 하단 고정 구매바(#optionG) 밖으로 이동 (Cafe24 ScriptTag)
 *
 * 문제: 브이리뷰가 상품상세 요약 위젯(iframe)을 #optionG .inner 안에 넣는데,
 *       스크롤하면 .inner 가 position:fixed 로 하단에 고정되어 위젯이 화면 절반을 가림.
 * 해결: 위젯이 생기면 #optionG 바로 뒤(일반 흐름)로 한 번 옮긴다.
 *       - 옵션창 열기/닫기(스킨 detail.js)에는 관여하지 않음
 *       - 감시는 #optionG 의 "자식 추가"만, 이동 횟수 제한(무한 반복 방지), 30초 후 감시 종료
 */
(function () {
  if (window.__gjVreviewMove) return;
  window.__gjVreviewMove = true;

  var MAX_MOVES = 5;
  var moves = 0;

  function isVreview(el) {
    if (!el || el.nodeType !== 1) return false;
    var s = (typeof el.className === 'string' ? el.className : '') + ' ' + (el.id || '');
    return /vreview/i.test(s) && !/vreview-overlay|vreview-hide/i.test(s);
  }

  function findTop(box) {
    // #optionG 안의 브이리뷰 요소 중 가장 바깥쪽(부모가 브이리뷰가 아닌 것)
    var list = box.querySelectorAll('[class*="vreview"],[id*="vreview"]');
    var out = [];
    for (var i = 0; i < list.length; i++) {
      var el = list[i];
      if (!isVreview(el)) continue;
      var p = el.parentElement, nested = false;
      while (p && p !== box) { if (isVreview(p)) { nested = true; break; } p = p.parentElement; }
      if (!nested) out.push(el);
    }
    return out;
  }

  function slot(box) {
    var s = document.getElementById('gj-vreview-slot');
    if (!s) {
      s = document.createElement('div');
      s.id = 'gj-vreview-slot';
      s.style.cssText = 'margin:16px 0 0;clear:both';
      box.parentNode.insertBefore(s, box.nextSibling);
    }
    return s;
  }

  function run() {
    var box = document.getElementById('optionG');
    if (!box) return false;
    var els = findTop(box);
    if (!els.length) return false;
    var s = slot(box);
    els.forEach(function (el) { if (moves < MAX_MOVES) { s.appendChild(el); moves++; } });
    return true;
  }

  function start() {
    var box = document.getElementById('optionG');
    if (!box) return;
    run();
    var timer = null;
    var mo = new MutationObserver(function (list) {
      for (var i = 0; i < list.length; i++) {
        for (var j = 0; j < list[i].addedNodes.length; j++) {
          var n = list[i].addedNodes[j];
          if (n.nodeType === 1 && (isVreview(n) || (n.querySelector && n.querySelector('[class*="vreview"],[id*="vreview"]')))) {
            clearTimeout(timer);
            timer = setTimeout(function () { run(); if (moves >= MAX_MOVES) mo.disconnect(); }, 50);
            return;
          }
        }
      }
    });
    mo.observe(box, { childList: true, subtree: true });
    // 위젯 삽입 시점이 스크립트보다 늦거나 감지되지 않는 경우 대비: 0.5초 간격 확인
    var tries = 0;
    var poll = setInterval(function () {
      tries++;
      run();
      if (tries >= 60 || moves >= MAX_MOVES) clearInterval(poll);
    }, 500);
    setTimeout(function () { mo.disconnect(); clearInterval(poll); }, 30000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
