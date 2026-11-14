/* GGORANGJI · 주문 중 로그인 화면에서 '비회원 구매'를 맨 위에 잘 보이게 (Cafe24 ScriptTag, MEMBER_LOGIN)
 *
 * 문제: 바로구매/장바구니 → 주문하기를 누르면 로그인 화면이 먼저 나오는데,
 *       '비회원 구매' 버튼이 화면 맨 아래에 있어 휴대폰에서는 스크롤해야 보임 → 구매 포기
 * 해결: 주문 흐름에서 들어온 경우(noMember=1 또는 returnUrl 이 주문서)에만
 *       알파푸시 빠른가입 전체화면 레이어를 숨기고,
 *       로그인 영역 맨 위에 '로그인 없이 바로 주문하기' 버튼을 추가. 기존 버튼/로그인은 그대로 둠.
 */
(function () {
  if (window.__gjGuestCta) return;
  window.__gjGuestCta = true;

  function fromOrder() {
    var q = location.search;
    return /[?&]noMember=1/.test(q) || /returnUrl=[^&]*order(%2F|\/)orderform/i.test(q);
  }

  // 주문 흐름에서는 알파푸시 '빠른 회원가입' 전체화면 레이어가 로그인 화면(비회원 구매 버튼 포함)을 덮으므로 숨긴다.
  // 일반 로그인 화면에서는 그대로 둔다.
  function hideQuickSignupOverlay() {
    var st = document.createElement('style');
    st.textContent = 'push-script-quick-signup{display:none!important}';
    (document.head || document.documentElement).appendChild(st);
    var unlock = function () {
      if (document.body && document.body.style.overflow === 'hidden') document.body.style.overflow = '';
      if (document.documentElement.style.overflow === 'hidden') document.documentElement.style.overflow = '';
    };
    unlock();
    var n = 0, t = setInterval(function () { unlock(); if (++n > 20) clearInterval(t); }, 500);
  }

  function start() {
    if (!/\/member\/login\.html/.test(location.pathname) || !fromOrder()) return;
    hideQuickSignupOverlay();
    var orig = document.querySelector('a.btnNonmember');
    if (!orig || document.querySelector('.gj-guest')) return;
    var href = orig.getAttribute('href');
    if (!href) return;

    var css = document.createElement('style');
    css.textContent =
      '.gj-guest{margin:8px 0 24px;padding:18px 16px;border-radius:14px;background:#F6F7F9;text-align:center}' +
      '.gj-guest p{margin:0 0 12px;font-size:14px;line-height:1.5;color:#333;word-break:keep-all}' +
      '.gj-guest p b{color:#111}' +
      '.gj-guest a.gj-guest-btn{display:flex;align-items:center;justify-content:center;height:52px;border-radius:12px;background:#111;color:#fff!important;font-size:16px;font-weight:700;text-decoration:none}' +
      '.gj-guest small{display:block;margin-top:10px;font-size:12px;color:#888;line-height:1.5;word-break:keep-all}';
    document.head.appendChild(css);

    var box = document.createElement('div');
    box.className = 'gj-guest';
    box.innerHTML =
      '<p><b>회원가입 없이도 주문할 수 있어요.</b></p>' +
      '<a class="gj-guest-btn" href="' + href.replace(/"/g, '&quot;') + '">로그인 없이 바로 주문하기</a>' +
      '<small>카카오·네이버로 로그인하면 가입 혜택과 적립금을 받을 수 있어요.</small>';

    // 로그인 화면 제목/SNS 로그인 영역 바로 위에 넣는다
    var anchor = document.querySelector('.xans-member-login') || orig.closest('form') || orig.parentElement;
    anchor.parentNode.insertBefore(box, anchor);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
