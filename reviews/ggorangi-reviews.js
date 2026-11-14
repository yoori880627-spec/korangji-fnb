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

    var allCnt = raw.filter(function(r){ return r && belongs(r, group); }).length;   // 별점 무관 전체 (상단 합산과 같은 기준)
    if (countEl) countEl.textContent = '스마트스토어 리뷰 ' + allCnt.toLocaleString('ko-KR') + '개';
    track.innerHTML = '';
    slidesEls = list.map(buildSlide);
    slidesEls.forEach(function(s){ track.appendChild(s); });
    // 짧은 리뷰는 '더 보기' 숨김
    requestAnimationFrame(function(){ slidesEls.forEach(function(c){ var t=c.querySelector('.gjtr-text'), m=c.querySelector('.gjtr-more'); if (t && m && t.scrollHeight <= t.clientHeight + 2) m.style.display='none'; }); });
    root.style.display = '';
    idx = 0; renderDots(slidesEls.length); goTo(0);
    renderAllButton(allList);
  }

  /* ====== 리뷰 숫자 합산 (자사몰 + 스마트스토어) : 상단 요약 · 리뷰 탭 · 리뷰 요약 박스 ====== */
  // 자사몰 수치는 페이지 로드 시점(서버가 그린 리뷰 요약 박스)에서 한 번만 읽는다 → 중복 합산 방지
  var BASE = null;
  function readBase(){
    var hl = document.querySelector('#prdReview .review_highlight');
    var n = 0, avg = null, dist = [0, 0, 0, 0, 0, 0];
    var numEl = hl && hl.querySelector('.review__total .num');
    if (numEl) n = parseInt(numEl.textContent.replace(/\D/g, ''), 10) || 0;
    else {
      var c = document.querySelector('.grp_review .count_review');
      var m = c && c.textContent.match(/(\d[\d,]*)/); n = m ? parseInt(m[1].replace(/,/g, ''), 10) : 0;
    }
    var rt = hl && hl.querySelector('.review__rating .rate');
    var a = rt ? parseFloat(rt.textContent) : NaN; if (!isNaN(a)) avg = a;
    for (var k = 1; k <= 5; k++) {
      var pe = hl && hl.querySelector('.review__graph .rate' + k + ' .txt .percentile');
      var pv = pe ? parseFloat(pe.textContent) : NaN;
      dist[k] = isNaN(pv) ? 0 : Math.round(pv / 100 * n);
    }
    return { n: n, avg: avg, dist: dist };
  }
  // 스킨 스크립트가 리뷰 요약(별점/그래프)을 채울 때까지 기다렸다가 자사몰 수치를 한 번만 읽는다
  function whenBaseReady(cb){
    var t0 = Date.now();
    (function poll(){
      var hl = document.querySelector('#prdReview .review_highlight');
      var numEl = hl && hl.querySelector('.review__total .num');
      var n = numEl ? parseInt(numEl.textContent.replace(/\D/g, ''), 10) || 0 : 0;
      var filled = !n || [1,2,3,4,5].some(function(k){ var e = hl.querySelector('.review__graph .rate' + k + ' .txt .percentile'); return e && /\d/.test(e.textContent); });
      var topReady = !n || document.querySelector('.grp_review point');
      if ((filled && topReady) || Date.now() - t0 > 6000) { BASE = readBase(); cb(); }
      else setTimeout(poll, 250);
    })();
  }

  function updateCounts(raw, group){
    if (!BASE) return whenBaseReady(function(){ updateCounts(raw, group); });
    var nv = raw.filter(function(r){ return r && belongs(r, group); });           // 별점 무관 전체
    if (!nv.length) return;
    var nvDist = [0, 0, 0, 0, 0, 0], nvSum = 0;
    nv.forEach(function(r){ var x = Math.max(1, Math.min(5, r.rating || 0)); nvDist[x]++; nvSum += x; });
    var total = BASE.n + nv.length;
    var avg = Math.round(((BASE.avg != null ? BASE.avg * BASE.n : 0) + nvSum) / (BASE.avg != null ? total : nv.length) * 10) / 10;
    var label = '자사몰 ' + BASE.n.toLocaleString('ko-KR') + '개 + 스마트스토어 ' + nv.length.toLocaleString('ko-KR') + '개';
    var T = total.toLocaleString('ko-KR');

    function renderTop(){
      var box = document.querySelector('.grp_review .item_cont a'); if (!box) return '';
      var cnt = box.querySelector('.count_review'); if (!cnt) return '';
      var star = box.querySelector('.review-avg');
      if (star) {
        var rate = star.querySelector('rate.rating');
        if (!rate) { rate = document.createElement('rate'); rate.className = 'rating'; star.appendChild(rate); }
        rate.style.width = Math.min(100, avg / 5 * 100) + '%';
      }
      var pts = box.querySelectorAll('point');
      for (var q = 1; q < pts.length; q++) pts[q].remove();                    // 중복 별점 숫자 제거
      var pt = pts[0];
      if (!pt) { pt = document.createElement('point'); cnt.parentNode.insertBefore(pt, cnt); }
      pt.textContent = avg.toFixed(1);
      cnt.textContent = '(리뷰 ' + T + '개)'; cnt.title = label;
      var ul = box.closest('ul'); if (ul) ul.classList.remove('displaynone');
      return box.textContent;
    }
    function renderTab(){
      document.querySelectorAll('#detailTab .count_review').forEach(function(el){ el.textContent = '(' + T + ')'; el.title = label; });
      var li = document.querySelector('#detailTab a[href="#prdReview"]'); li = li && li.closest('li'); if (li) li.classList.remove('displaynone');
    }
    function renderBox(){
      var hl = document.querySelector('#prdReview .review_highlight'); if (!hl) return;
      var num = hl.querySelector('.review__total .num'); if (num) num.textContent = T;
      var rt = hl.querySelector('.review__rating .rate'); if (rt) rt.textContent = avg.toFixed(1);
      for (var k = 1; k <= 5; k++) {
        var pct = Math.round((BASE.dist[k] + nvDist[k]) / total * 100);
        var g = hl.querySelector('.review__graph .rate' + k);
        if (!g) continue;
        var bar = g.querySelector('.gauge .percentile'); if (bar) bar.style.height = pct ? pct + '%' : '';
        var tx = g.querySelector('.txt .percentile'); if (tx) tx.textContent = pct ? pct + '%' : '-';
      }
      var sub = hl.querySelector('.gj-src-note');
      if (!sub) { sub = document.createElement('p'); sub.className = 'gj-src-note'; sub.style.cssText = 'margin:12px 0 0;text-align:center;font-size:12px;color:#8A8F99'; hl.appendChild(sub); }
      sub.textContent = label + ' 합산';
    }

    function snap(){
      var b1 = document.querySelector('.grp_review .item_cont a'), b2 = document.querySelector('#prdReview .review_highlight');
      return (b1 ? b1.textContent : '') + '|' + (b2 ? b2.textContent : '') + '|' + (b2 ? [].map.call(b2.querySelectorAll('.gauge .percentile'), function(e){ return e.style.height; }).join(',') : '');
    }
    function all(){ renderTop(); renderTab(); renderBox(); }
    all();
    var mine = snap();
    // 스킨 스크립트가 나중에 숫자를 덮어쓰면 다시 적용 (15초간, 최대 8회). 자사몰 수치는 다시 읽지 않음
    if (window.MutationObserver) {
      var again = 0;
      var mo = new MutationObserver(function(){
        if (snap() !== mine && again < 8) { again++; all(); mine = snap(); }
      });
      ['.grp_review', '#prdReview .review_highlight', '#detailTab'].forEach(function(sel){
        var el = document.querySelector(sel);
        if (el) mo.observe(el, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['style'] });
      });
      setTimeout(function(){ mo.disconnect(); }, 15000);
    }
  }

  /* ====== 스마트스토어 리뷰 캐러셀을 리뷰 탭 안으로 이동 ====== */
  function moveIntoReviewTab(){
    var sec = document.getElementById('prdReview');
    if (!sec || sec.contains(root)) return;
    var anchor = sec.querySelector('.review_list_grp') || null;
    sec.insertBefore(root, anchor);
    root.style.margin = '28px auto';
  }

  /* ====== 리뷰 탭: 스마트스토어 리뷰를 자사몰 리뷰와 같은 마크업/클래스로 표시 ====== */
  function shortDate(d){ var m = String(d || '').match(/^\d{2}(\d{2})-(\d{2})-(\d{2})/); return m ? m[1] + '.' + m[2] + '.' + m[3] : ''; }

  function renderTabList(raw, group){
    var sec = document.getElementById('prdReview');
    var shopGrp = sec && sec.querySelector('.review_list_grp:not(.gj-nv-grp)');
    if (!sec || !shopGrp) return false;
    var all = raw.filter(function(r){ return r && belongs(r, group); });
    var good = all.filter(function(r){ return r.text && (r.rating == null || r.rating >= minRating); })
                  .sort(function(a, b){ return String(b.date || '').localeCompare(String(a.date || '')); });
    if (!good.length) return false;
    var old = sec.querySelector('.gj-nv'); if (old) old.remove();
    var oldH = sec.querySelector('.gj-shop-h'); if (oldH) oldH.remove();

    if (!document.getElementById('gj-nv-css')) {
      var st = document.createElement('style'); st.id = 'gj-nv-css';
      st.textContent =
        '#prdReview .gj-sub-h{display:flex;align-items:baseline;gap:8px;margin:40px 0 0;padding-bottom:14px;border-bottom:1px solid #111}' +
        '#prdReview .gj-sub-h strong{font-size:17px;font-weight:700;color:#000}' +
        '#prdReview .gj-sub-h span{font-size:12px;color:#999}' +
        '#prdReview .gj-nv .gj-src{display:inline-block;margin-left:2px;padding:0 4px;border-radius:2px;background:#03C75A;color:#fff;font-size:9px;line-height:14px;font-weight:600;letter-spacing:-.2px;vertical-align:1px}' +
        '#prdReview .gj-nv .cont.gj-open{display:block;-webkit-line-clamp:unset;max-height:none}' +
        '#prdReview .gj-nv .gj-morebox{text-align:center;margin:24px 0 8px}' +
        '#prdReview .gj-nv .gj-morebox .btnNormalFix{cursor:pointer}' +
        '@media (max-width:767px){#prdReview .gj-sub-h{display:block;margin-top:28px}#prdReview .gj-sub-h strong{display:block;font-size:15px}#prdReview .gj-sub-h span{display:block;margin-top:4px}}';
      document.head.appendChild(st);
    }

    var wrap = document.createElement('div');
    wrap.className = 'gj-nv';
    wrap.innerHTML =
      '<div class="gj-sub-h"><strong>스마트스토어 리뷰 ' + all.length.toLocaleString('ko-KR') + '개</strong><span>네이버 스마트스토어 구매자 리뷰 · 별점 4점 이상 최신순</span></div>' +
      '<div class="review_list_grp gj-nv-grp"><div class="review__list"><ul class="wp-review-list gj-nv-list"></ul></div></div>' +
      '<div class="gj-morebox ec-base-button"></div>';
    var ul = wrap.querySelector('.gj-nv-list'), moreBox = wrap.querySelector('.gj-morebox');
    var shown = 0, FIRST = 5, STEP = 10;

    function item(r){
      var li = document.createElement('li');
      var n = Math.max(1, Math.min(5, parseInt(r.rating, 10) || 5));
      li.innerHTML =
        '<div class="item"><div class="chk"></div>' +
          '<div class="content">' +
            '<div class="rate rate' + n + '">' + n + '.0</div>' +
            '<div class="cont clamp">' + esc(r.text).replace(/\n/g, '<br>') + '</div>' +
            '<div class="cont__more gj-more displaynone">더보기 <span class="arrow"></span></div>' +
          '</div>' +
          '<div class="content_right">' +
            '<div class="member">' + esc(r.author || '익명') + '</div>' +
            '<div class="date">' + shortDate(r.date) + '</div>' +
            '<div class="hit"><span class="gj-src">N 스마트스토어</span></div>' +
          '</div>' +
        '</div>';
      var more = li.querySelector('.gj-more'), cont = li.querySelector('.cont');
      more.addEventListener('click', function(e){
        e.preventDefault(); e.stopPropagation();
        var open = cont.classList.toggle('gj-open');
        more.firstChild.nodeValue = open ? '접기 ' : '더보기 ';
      });
      return li;
    }
    function fixMore(lis){
      requestAnimationFrame(function(){
        lis.forEach(function(li){
          var c = li.querySelector('.cont'), m = li.querySelector('.gj-more');
          if (c && m) m.classList.toggle('displaynone', c.scrollHeight <= c.clientHeight + 2);
        });
      });
    }
    function next(){
      var batch = good.slice(shown, shown + (shown ? STEP : FIRST)).map(item);
      batch.forEach(function(li){ ul.appendChild(li); });
      shown += batch.length;
      fixMore(batch);
      moreBox.innerHTML = '';
      if (shown < good.length) {
        var b = document.createElement('a');
        b.href = '#none'; b.className = 'btnNormalFix sizeM';
        b.textContent = '스마트스토어 리뷰 더보기 (' + shown + ' / ' + good.length + ')';
        b.addEventListener('click', function(e){ e.preventDefault(); next(); });
        moreBox.appendChild(b);
      }
    }
    next();

    var shopH = document.createElement('div');
    shopH.className = 'gj-sub-h gj-shop-h';
    shopH.innerHTML = '<strong>자사몰 리뷰 ' + (BASE ? BASE.n : 0).toLocaleString('ko-KR') + '개</strong><span>꼬랑지 공식몰 구매자 리뷰</span>';
    sec.insertBefore(wrap, shopGrp);
    if (BASE && BASE.n > 0) sec.insertBefore(shopH, shopGrp);
    return true;
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
    btn.innerHTML = '스마트스토어 리뷰 모아보기 <b>' + allList.length.toLocaleString('ko-KR') + '</b><span style="font-weight:500;color:#8A8F99;font-size:12px">(별점 4점 이상)</span>';
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
        whenBaseReady(function(){
          updateCounts(raw, group);
          if (renderTabList(raw, group)) root.style.display = 'none';   // 리뷰 탭에 자사몰과 같은 디자인으로 표시 → 캐러셀은 숨김
        });
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
