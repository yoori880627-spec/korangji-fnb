/* GGORANGJI · 상품군별 스마트스토어 리뷰 (Cafe24 ScriptTag) */
(function(){
(function(){
  /* ================================================================
     상품군 설정 — 여기만 수정하면 됩니다.
     - cafe24   : 카페24 상품번호 (상품 URL 끝 숫자, 예: /product/.../78/ → 78)
     - naver    : 스마트스토어 상품번호 (smartstore.naver.com/.../products/여기숫자)
     - keywords : 네이버 상품명에 이 단어가 들어 있으면 같은 상품군으로 인정
                  (naver 번호를 모를 때, 또는 번호가 여러 개일 때 편하게 사용)
     - exclude  : 상품명에 이 단어가 있으면 keywords 에 걸려도 제외 (선택)
     같은 상품군의 카페24 상품들은 모두 같은 네이버 리뷰를 보여줍니다.
     ================================================================ */
  var X = ['피크닉', '비밀'];   // 여러 상품이 섞인 세트/행사창은 키워드 매칭에서 제외
  var GROUPS = [
    { name: '약과',          cafe24: [43],                 naver: ['8906031486'], keywords: [] },
    { name: '두바이쫀득쿠키', cafe24: [78],                 naver: ['13090121881', '12969856469', '13635227357'], keywords: ['쫀득쿠키', '쫀득 쿠키'], exclude: X },
    { name: '꼬랑지마카롱',   cafe24: [34, 46, 81, 59],     naver: ['10611185703', '6957805087', '5959915768'], keywords: ['뚱카롱', '윗미 마카롱'], exclude: X.concat(['후레이크', '꼬끄', '키토', '사그램']) },
    { name: '힐로우바',       cafe24: [32, 62, 63, 66, 83], naver: ['9149565686'], keywords: ['힐로우바'], exclude: X },
    { name: '나쵸칩',         cafe24: [84],                 naver: ['13664442313', '13746596725', '13746678335'], keywords: ['나쵸칩'], exclude: X },
    { name: '두바이초콜릿',   cafe24: [48],                 naver: ['11150214525'], keywords: ['두바이 초콜릿', '두바이초콜릿'], exclude: X },
    { name: '꼬끄 후레이크',  cafe24: [30, 85],             naver: ['5471892506', '13812363886'], keywords: [], exclude: X }
  ];

  var root = document.getElementById('gj-text-reels'); if (!root) return;
  if (root.getAttribute('data-gj-groups') === '1') return;   // 중복 실행 방지
  root.setAttribute('data-gj-groups', '1');
  root.setAttribute('data-json', window.GJ_REVIEWS_JSON || 'https://cdn.jsdelivr.net/gh/yoori880627-spec/korangji-fnb@cafe24-scripts/reviews/naverReviews.json');
  root.setAttribute('data-limit', '30');        // 상품당 최신 30개
  root.setAttribute('data-min-rating', '4');    // 별점 4점 이상만
  root.style.display = 'none';
  var oldMsg = root.querySelectorAll('p'); oldMsg.forEach(function(p){ if (/리뷰/.test(p.textContent) && !p.closest('.gjtr-head')) p.remove(); });

  var jsonUrl   = root.getAttribute('data-json');
  var limit     = Math.min(Math.max(parseInt(root.getAttribute('data-limit') || '200', 10), 1), 1000);
  var minRating = parseInt(root.getAttribute('data-min-rating') || '1', 10);
  var debug     = (root.getAttribute('data-debug') || '') === '1';

  var track    = root.querySelector('.gjtr-track');
  var dotsWrap = root.querySelector('.gjtr-dots');
  var btnPrev  = root.querySelector('.gjtr-prev');
  var btnNext  = root.querySelector('.gjtr-next');
  var countEl  = root.querySelector('.gjtr-count');
  var slidesEls = [], idx = 0;

  function log(){ if (debug) console.log.apply(console, ['[NaverReviews]'].concat([].slice.call(arguments))); }
  function esc(t){ return String(t == null ? '' : t).replace(/[&<>"']/g, function(m){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]; }); }
  function stars(n){ n = parseInt(n || 0, 10); if (n < 0) n = 0; if (n > 5) n = 5; return '★'.repeat(n) + '☆'.repeat(5 - n); }
  function naverIdOf(r){
    if (r.product_no) return String(r.product_no);
    var m = (r.source_url || '').match(/\/products\/(\d+)/); return m ? m[1] : '';
  }

  /* 현재 카페24 상품번호 — iProductNo 는 이 스크립트보다 아래에서 선언되므로 URL 에서 먼저 읽는다 */
  function currentProductNo(){
    var m = location.search.match(/[?&]product_no=(\d+)/) || location.pathname.match(/\/product\/[^\/]+\/(\d+)/);
    if (m) return parseInt(m[1], 10);
    return window.iProductNo ? parseInt(window.iProductNo, 10) : 0;
  }

  function findGroup(no){
    for (var i = 0; i < GROUPS.length; i++) if (GROUPS[i].cafe24.indexOf(no) > -1) return GROUPS[i];
    return null;
  }

  function belongs(r, g){
    var id = naverIdOf(r);
    if (id && g.naver.indexOf(id) > -1) return true;
    var name = (r.product_name || '').replace(/\s+/g, ' ');
    var nameNoSpace = name.replace(/\s/g, '');
    for (var j = 0; j < (g.exclude || []).length; j++) {
      if (nameNoSpace.indexOf(g.exclude[j].replace(/\s/g, '')) > -1) return false;
    }
    for (var i = 0; i < (g.keywords || []).length; i++) {
      var k = g.keywords[i];
      if (name && (name.indexOf(k) > -1 || nameNoSpace.indexOf(k.replace(/\s/g, '')) > -1)) return true;
    }
    return false;
  }

  /* ====== 카드 ====== */
  function buildSlide(r){
    var card = document.createElement('article'); card.className = 'gjtr-card'; card.setAttribute('role', 'listitem');

    var meta = '<div class="gjtr-meta"><strong>' + esc(r.author || '익명') + '</strong>';
    if (r.date) meta += '<span class="gjtr-dot"></span><span>' + esc(r.date) + '</span>';
    if (r.rating != null) meta += '<span class="gjtr-dot"></span><span class="gjtr-stars" aria-label="별점 ' + esc(r.rating) + '점">' + stars(r.rating) + '</span>';
    meta += '</div>';

    var text = esc(r.text || '');
    var body = '<p class="gjtr-text">' + text + '</p>'
             + '<button type="button" class="gjtr-more" aria-label="더보기">더 보기</button>';

    var url = r.source_url || (naverIdOf(r) ? 'https://smartstore.naver.com/ggorangjimacaron/products/' + naverIdOf(r) : '');
    var foot = url ? '<div class="gjtr-footer"><a class="gjtr-link" href="' + esc(url) + '" target="_blank" rel="noopener">원문 보기'
             + '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" style="margin-left:4px"><path d="M7 17L17 7M17 7H9M17 7v8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>'
             + '</a></div>' : '';

    card.innerHTML = meta + body + foot;

    card.querySelector('.gjtr-more').addEventListener('click', function(e){
      e.stopPropagation();
      var p = card.querySelector('.gjtr-text');
      var expanded = p.getAttribute('data-expanded') === '1';
      if (expanded) { p.style.display = '-webkit-box'; p.style.webkitLineClamp = '5'; p.setAttribute('data-expanded', '0'); this.textContent = '더 보기'; }
      else          { p.style.display = 'block'; p.style.webkitLineClamp = 'unset'; p.setAttribute('data-expanded', '1'); this.textContent = '접기'; }
    });
    var link = card.querySelector('.gjtr-link');
    if (link) link.addEventListener('click', function(e){ e.stopPropagation(); });
    return card;
  }

  /* ====== 도트 / 이동 ====== */
  function renderDots(n){
    dotsWrap.innerHTML = '';
    for (var i = 0; i < n; i++) {
      var d = document.createElement('div'); d.className = 'gjtr-dot-btn' + (i === idx ? ' is-active' : '');
      d.addEventListener('click', (function(k){ return function(ev){ ev.stopPropagation(); goTo(k); }; })(i));
      dotsWrap.appendChild(d);
    }
  }
  function updateDots(){
    dotsWrap.querySelectorAll('.gjtr-dot-btn').forEach(function(el, i){ el.classList.toggle('is-active', i === idx); });
  }
  function goTo(k){
    if (!slidesEls.length) return;
    k = Math.max(0, Math.min(k, slidesEls.length - 1)); idx = k;
    track.scrollTo({ left: slidesEls[k].offsetLeft, behavior: 'smooth' });
    updateDots();
  }
  var ticking = false;
  track.addEventListener('scroll', function(){
    if (ticking) return; ticking = true;
    requestAnimationFrame(function(){
      ticking = false;
      var center = track.scrollLeft + track.clientWidth / 2, best = 0, bestDist = 1e9;
      for (var i = 0; i < slidesEls.length; i++) {
        var c = slidesEls[i].offsetLeft + slidesEls[i].offsetWidth / 2, d = Math.abs(c - center);
        if (d < bestDist) { bestDist = d; best = i; }
      }
      if (best !== idx) { idx = best; updateDots(); }
    });
  });
  btnPrev.addEventListener('click', function(e){ e.stopPropagation(); goTo(idx - 1); });
  btnNext.addEventListener('click', function(e){ e.stopPropagation(); goTo(idx + 1); });

  /* ====== 데이터 ====== */
  function applyData(raw, group){
    var list = raw.filter(function(r){
      return r && r.text && belongs(r, group) && (r.rating == null || r.rating >= minRating);
    });
    list.sort(function(a, b){ return String(b.date || '').localeCompare(String(a.date || '')); });
    var total = list.length;
    var allList = list;
    list = list.slice(0, limit);
    log('group:', group.name, 'raw:', raw.length, 'matched:', list.length);

    if (!list.length) return;                 // 리뷰 없으면 영역 숨김 유지

    if (countEl) countEl.textContent = '총 리뷰 ' + total.toLocaleString('ko-KR') + '개';
    track.innerHTML = '';
    slidesEls = list.map(buildSlide);
    slidesEls.forEach(function(s){ track.appendChild(s); });
    // 짧은 리뷰는 '더 보기' 숨김
    requestAnimationFrame(function(){ slidesEls.forEach(function(c){ var t=c.querySelector('.gjtr-text'), m=c.querySelector('.gjtr-more'); if (t && m && t.scrollHeight <= t.clientHeight + 2) m.style.display='none'; }); });
    root.style.display = '';
    idx = 0; renderDots(slidesEls.length); goTo(0);
    renderAllButton(allList);
  }

  /* ====== 전체 리뷰 보기 (모달 목록, 20개씩) ====== */
  var ALL_CSS = '' +
    '.gjtr-allbtn{display:flex;align-items:center;justify-content:center;gap:6px;width:100%;max-width:420px;margin:14px auto 0;height:46px;border-radius:999px;border:1px solid #E2E5EB;background:#fff;color:#0F1012;font:600 14px/1 inherit;cursor:pointer}' +
    '.gjtr-allbtn b{color:#FF7A00}' +
    '.gjtr-modal{position:fixed;inset:0;z-index:2147483000;background:rgba(15,16,18,.5);display:flex;align-items:flex-end;justify-content:center}' +
    '.gjtr-sheet{background:#fff;width:100%;max-width:640px;max-height:88vh;border-radius:20px 20px 0 0;display:flex;flex-direction:column;font-family:inherit;color:#0F1012}' +
    '@media(min-width:700px){.gjtr-modal{align-items:center}.gjtr-sheet{border-radius:20px;max-height:84vh}}' +
    '.gjtr-sh-head{display:flex;align-items:center;justify-content:space-between;padding:18px 20px 14px;border-bottom:1px solid #EEF0F3}' +
    '.gjtr-sh-head h3{margin:0;font-size:17px;font-weight:700}.gjtr-sh-head h3 small{display:block;margin-top:3px;font-size:12px;font-weight:500;color:#6F7480}' +
    '.gjtr-sh-x{width:36px;height:36px;border:0;background:#F3F4F6;border-radius:50%;font-size:18px;line-height:36px;cursor:pointer;color:#3E4046}' +
    '.gjtr-sh-list{overflow-y:auto;-webkit-overflow-scrolling:touch;padding:4px 20px 20px}' +
    '.gjtr-sh-item{padding:16px 0;border-bottom:1px solid #F1F2F5}' +
    '.gjtr-sh-meta{display:flex;align-items:center;gap:6px;font-size:12.5px;color:#6F7480;margin-bottom:6px}.gjtr-sh-meta strong{color:#3E4046;font-weight:600}.gjtr-sh-meta .s{color:#FFB400;letter-spacing:1px}' +
    '.gjtr-sh-text{margin:0;font-size:14px;line-height:1.6;white-space:pre-line;word-break:keep-all}' +
    '.gjtr-sh-more{display:block;width:100%;height:44px;margin-top:16px;border-radius:12px;border:1px solid #E2E5EB;background:#fff;font:600 14px/1 inherit;color:#3E4046;cursor:pointer}';

  function renderAllButton(allList){
    var old = root.querySelector('.gjtr-allbtn'); if (old) old.remove();
    if (allList.length <= limit) return;
    if (!document.getElementById('gjtr-all-css')) {
      var st = document.createElement('style'); st.id = 'gjtr-all-css'; st.textContent = ALL_CSS; document.head.appendChild(st);
    }
    var btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'gjtr-allbtn';
    btn.innerHTML = '스마트스토어 리뷰 전체 보기 <b>' + allList.length.toLocaleString('ko-KR') + '</b>';
    btn.addEventListener('click', function(e){ e.stopPropagation(); openAll(allList); });
    root.appendChild(btn);
  }

  function openAll(allList){
    var PAGE = 20, shown = 0;
    var prevOverflow = document.body.style.overflow;
    var modal = document.createElement('div');
    modal.className = 'gjtr-modal';
    modal.setAttribute('role', 'dialog'); modal.setAttribute('aria-modal', 'true'); modal.setAttribute('aria-label', '스마트스토어 리뷰 전체');
    modal.innerHTML = '<div class="gjtr-sheet"><div class="gjtr-sh-head"><h3>스마트스토어 리뷰 ' + allList.length.toLocaleString('ko-KR') + '개<small>별점 4점 이상 · 최신순</small></h3>' +
      '<button type="button" class="gjtr-sh-x" aria-label="닫기">✕</button></div><div class="gjtr-sh-list"></div></div>';
    var list = modal.querySelector('.gjtr-sh-list');
    function more(){
      var frag = document.createDocumentFragment();
      allList.slice(shown, shown + PAGE).forEach(function(r){
        var it = document.createElement('div'); it.className = 'gjtr-sh-item';
        it.innerHTML = '<div class="gjtr-sh-meta"><strong>' + esc(r.author || '익명') + '</strong>' +
          (r.rating != null ? '<span class="s">' + stars(r.rating) + '</span>' : '') +
          (r.date ? '<span>' + esc(r.date) + '</span>' : '') + '</div><p class="gjtr-sh-text">' + esc(r.text) + '</p>';
        frag.appendChild(it);
      });
      shown = Math.min(shown + PAGE, allList.length);
      var mb = list.querySelector('.gjtr-sh-more'); if (mb) mb.remove();
      list.appendChild(frag);
      if (shown < allList.length) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'gjtr-sh-more';
        b.textContent = '더 보기 (' + shown + ' / ' + allList.length + ')';
        b.addEventListener('click', more);
        list.appendChild(b);
      }
    }
    function close(){
      document.removeEventListener('keydown', onKey);
      modal.remove();
      document.body.style.overflow = prevOverflow;
      btnFocus && btnFocus.focus && btnFocus.focus();
    }
    function onKey(e){ if (e.key === 'Escape') close(); }
    var btnFocus = root.querySelector('.gjtr-allbtn');
    modal.addEventListener('click', function(e){ if (e.target === modal) close(); });
    modal.querySelector('.gjtr-sh-x').addEventListener('click', close);
    document.addEventListener('keydown', onKey);
    more();
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    modal.querySelector('.gjtr-sh-x').focus();
  }

  function start(){
    var no = currentProductNo();
    var group = findGroup(no);
    log('cafe24 product_no:', no, 'group:', group && group.name);
    if (!group) return;                        // 상품군 미지정 상품 → 표시 안 함

    fetch(jsonUrl)
      .then(function(res){ if (!res.ok) throw new Error('JSON ' + res.status); return res.json(); })
      .then(function(raw){
        if (!Array.isArray(raw)) throw new Error('Invalid JSON');
        applyData(raw, group);
        // 스킨의 기존 스크립트(약과 리뷰)가 늦게 끝나 카드를 덮어쓰면 다시 적용 (최대 3회, 20초간)
        var mine = countEl ? countEl.textContent : '', again = 0;
        if (countEl && window.MutationObserver) {
          var mo = new MutationObserver(function(){
            if (countEl.textContent !== mine && again < 3) { again++; applyData(raw, group); mine = countEl.textContent; }
          });
          mo.observe(countEl, { childList: true, characterData: true, subtree: true });
          setTimeout(function(){ mo.disconnect(); }, 20000);
        }
      })
      .catch(function(e){ log(e); });          // 실패해도 화면엔 아무것도 안 보이게
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
})();
