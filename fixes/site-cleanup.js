/* GGORANGJI · 가입 혜택 문구 통일(10% 할인) + 팝업 1개만 남기기 (Cafe24 ScriptTag, display_location: all)
 *
 * 1) 상단 띠배너: '회원가입하고 3,000원 혜택 받기' 슬라이드를 '신규가입 시 전제품 10% 할인 받기'로 교체
 *    (슬라이드를 지우면 슬라이더가 깨질 수 있어 문구/링크만 10% 슬라이드와 같게 바꿈)
 * 2) 팝업: 메인 프로모션 팝업(.main--modal)만 남김
 *    - 스마트팝업 앱(.app-smart-popup-*) 숨김
 *    - 알파푸시 화면 요소(<push-script-…>) 숨김: 빠른가입(적립금 10,000원) 화면 등
 *
 * ※ 화면 표시만 바꿉니다. 실제 지급되는 혜택(3,000원 혜택, 가입 적립금 10,000원)은
 *    카페24 관리자 / 알파푸시 관리자에서 꺼야 표시와 실제가 일치합니다.
 */
(function () {
  if (window.__gjSiteCleanup) return;
  window.__gjSiteCleanup = true;

  // 깜빡임 방지: 숨길 팝업은 CSS 로 먼저 가림
  var st = document.createElement('style');
  st.id = 'gj-site-cleanup';
  st.textContent =
    '.app-smart-popup-container,.app-smart-popup-dimmed{display:none!important}';
  (document.head || document.documentElement).appendChild(st);

  function hideAlpha(root) {
    var all = (root || document).getElementsByTagName('*');
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (el.tagName.indexOf('PUSH-SCRIPT-') === 0 && el.style.display !== 'none') {
        el.style.setProperty('display', 'none', 'important');
      }
    }
  }

  function unlockScroll() {
    // 숨긴 팝업이 걸어 둔 스크롤 잠금 해제 (메인 팝업이 떠 있을 때는 건드리지 않음)
    var modalOpen = document.querySelector('.main--modal.active');
    if (modalOpen) return;
    if (document.body && document.body.style.overflow === 'hidden') document.body.style.overflow = '';
    if (document.documentElement.style.overflow === 'hidden') document.documentElement.style.overflow = '';
  }

  function fixTopBand() {
    var band = document.getElementById('tbanner');
    if (!band) return;
    var links = band.querySelectorAll('.webpublic-banner-item a, li a');
    var good = null;
    for (var i = 0; i < links.length; i++) {
      if (/10%/.test(links[i].textContent)) { good = links[i]; break; }
    }
    if (!good) return;
    for (var j = 0; j < links.length; j++) {
      var a = links[j];
      if (a === good || /10%/.test(a.textContent)) continue;
      if (/3,000원|3000원|적립금|혜택/.test(a.textContent)) {
        a.innerHTML = good.innerHTML;
        var href = good.getAttribute('href');
        if (href) a.setAttribute('href', href);
        a.setAttribute('data-gj-replaced', '1');
      }
    }
  }

  function hideSmartPopup() {
    var els = document.querySelectorAll('[class*="app-smart-popup"]');
    for (var i = 0; i < els.length; i++) {
      if (els[i].style.getPropertyValue('display') !== 'none' || els[i].style.getPropertyPriority('display') !== 'important') {
        els[i].style.setProperty('display', 'none', 'important');
      }
    }
  }

  function run() { hideAlpha(); hideSmartPopup(); fixTopBand(); unlockScroll(); }

  function start() {
    run();
    // 늦게 붙는 요소 대비 (20초간)
    if (window.MutationObserver) {
      var t = null;
      var mo = new MutationObserver(function () { clearTimeout(t); t = setTimeout(run, 60); });
      mo.observe(document.body, { childList: true, subtree: true });
      setTimeout(function () { mo.disconnect(); run(); }, 20000);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
