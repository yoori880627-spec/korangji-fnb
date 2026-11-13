/* GGORANGJI · 메인 랜딩 (Cafe24 ScriptTag, display_location: MAIN)
 *
 * - 스킨 파일은 건드리지 않는다. 메인(#contents)의 기존 섹션을 숨기고 랜딩 섹션을 맨 위에 넣는다.
 * - ScriptTag 를 지우면 원래 메인으로 즉시 돌아간다.
 * - 상품명/가격은 메인에 원래 있는 상품 목록(숨겨진 DOM)에서 실시간으로 읽고, 없으면 아래 기본값 사용.
 */
(function () {
  if (window.__gjLanding) return;
  window.__gjLanding = true;

  var IMG = 'https://ggorangjicaron.com/web/product/big/';
  var P = {
    46: { name: '꼬랑지마카롱 BIG 5구 클래식', price: 15000, img: IMG + '202608/76b5d5a9cb46b3ce125187645005a4e3.jpg' },
    81: { name: '꼬랑지마카롱 BIG 5구 상큼', price: 15000, img: IMG + '202608/f9fd38dbfdb123ee51e6117c1dc107de.jpg' },
    34: { name: '꼬랑지마카롱 BIG 10구 클래식/상큼', price: 22000, img: IMG + '202608/81a8100e27b5a32024f662f5acd0009f.jpg' },
    59: { name: '레몬버터 꼬랑지마카롱 BIG', price: 23000, img: IMG + '202606/e36d94181c6af1ed2e38ae1a8af96406.png' },
    78: { name: '[당 10g] 두바이 쫀득 쿠키 6구 선물세트', price: 18000, img: IMG + '202606/f6f7028fbb4d7e956f25829f168d07c3.jpg' },
    48: { name: '미니 두바이초콜릿 피스', price: 21000, img: IMG + '202606/46e80f8c7f378150dcdd265d74931269.png' },
    43: { name: '힐로우 약과 5개입', price: 10000, img: IMG + '202605/1733136960f3de7536b4e59ff4ab6fc0.jpg' },
    32: { name: '[당 3g] 힐로우바 6개입 세트', price: 15000, img: IMG + '202609/87bb4b6e8fe2e31c3ac8510e7383c957.jpg' },
    83: { name: '[저당] 비건 힐로우바 6개입 세트', price: 15000, img: IMG + '202609/a5b22251c9f40e22700827da4fb56a56.jpg' },
    84: { name: '[프로틴 16g] 힐로우 나쵸칩', price: 9900, img: IMG + '202610/3ee5878358213265176187779c6a2eff.jpg' },
    30: { name: '마카롱 꼬끄 후레이크 대용량팩 360g', price: 15000, img: IMG + '202610/4774ea8490179017035c5fe1f8062c47.jpg' },
    85: { name: '마카롱 조각꼬끄 후레이크 대용량팩 360g', price: 12000, img: IMG + '202610/a37dddad5e69d5c1dd6ed35c943ee432.jpg' }
  };

  var FLAVORS = [
    { no: 46, tab: '클래식', title: '진하게, 클래식.', desc: '크림 꽉~찬 쫀득 뚱카롱. 처음 먹어도, 백 번째 먹어도 반가운 기본의 맛.', bg: '#FFB3CF', accent: '#FF5C9A' },
    { no: 81, tab: '상큼', title: '톡 쏘는, 상큼.', desc: '과일 필링이 입 안에서 톡. 달콤함 사이로 상큼함이 꼬리를 흔들어요.', bg: '#FFE15A', accent: '#FF8A00' },
    { no: 59, tab: '레몬버터', title: '버터에 레몬 한 방울.', desc: '고소한 버터 크림에 레몬을 더했어요. 꾸덕한데 무겁지 않게.', bg: '#FFF1A6', accent: '#E8B400' },
    { no: 78, tab: '두쫀쿠', title: '쫀득하게, 두쫀쿠.', desc: '두바이 쫀득 쿠키 6구 선물세트. 당은 10g, 쫀득함은 그대로.', bg: '#C9E7A8', accent: '#3F8F3A' }
  ];

  var MENU = [
    { cat: '마카롱', items: [34, 46, 81, 59] },
    { cat: '두쫀쿠 · 선물', items: [78, 48, 43] },
    { cat: '가볍게 · 간식', items: [32, 83, 84, 30, 85] }
  ];

  var REVIEWS = [
    { t: '약과가 맛있고 혈당이 오르지 않습니다. 재구매 의사 있습니다.', s: 5 },
    { t: '약과 안 달고 맛좋아요. 질긴 게 아니라 쫀득해서 너무 좋아요. 만족!', s: 5 },
    { t: '여러 개 사서 선물로 줬는데 다들 너무 좋아했어요!', s: 5 }
  ];

  function won(n) { return Number(n).toLocaleString('ko-KR') + '원'; }
  function link(no) { return '/product/detail.html?product_no=' + no; }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]; }); }

  /* 메인에 원래 있는 상품 목록에서 최신 이름/가격 읽기 */
  function liveData() {
    var out = {};
    document.querySelectorAll('#contents a[href*="/product/"]').forEach(function (a) {
      var m = a.getAttribute('href').match(/\/product\/[^\/]+\/(\d+)\//) || a.getAttribute('href').match(/product_no=(\d+)/);
      if (!m) return;
      var li = a.closest('li') || a.parentElement;
      if (!li || out[m[1]]) return;
      var nameEl = li.querySelector('.name a, .name, .prdName');
      var txt = li.innerText || '';
      var prices = (txt.match(/[\d,]+원/g) || []).map(function (s) { return parseInt(s.replace(/\D/g, ''), 10); }).filter(function (n) { return n > 0; });
      out[m[1]] = { name: nameEl ? nameEl.innerText.trim().replace(/\s+/g, ' ').replace(/^상품명\s*:\s*/, '') : '', price: prices.length ? Math.min.apply(null, prices) : 0 };
    });
    return out;
  }

  var CSS = '' +
    '@import url("https://fonts.googleapis.com/css2?family=Black+Han+Sans&display=swap");' +
    '@import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css");' +
    '.gjl{--ink:#3A1F14;--cream:#FFF8EC;--pink:#FFB3CF;--pink2:#FF5C9A;--lemon:#FFE15A;--orange:#FF6B1A;--pista:#C9E7A8;--mint:#A8DDE0;' +
    'font-family:Pretendard,"Apple SD Gothic Neo","Noto Sans KR",sans-serif;color:var(--ink);overflow:hidden;-webkit-font-smoothing:antialiased;word-break:keep-all}' +
    '.gjl *{box-sizing:border-box}' +
    '.gjl a{color:inherit;text-decoration:none}' +
    '.gjl-wrap{max-width:1200px;margin:0 auto;padding:0 20px;position:relative;z-index:1}' +
    '.gjl-sec{position:relative;padding:72px 0}' +
    '.gjl-eyebrow{display:inline-flex;align-items:center;gap:8px;font-weight:800;font-size:14px;letter-spacing:.02em}' +
    '.gjl-eyebrow:before{content:"";width:9px;height:9px;border-radius:50%;background:var(--dot,var(--ink))}' +
    '.gjl-display{font-family:"Black Han Sans",Pretendard,sans-serif;font-weight:400;line-height:.98;letter-spacing:-.01em;margin:0;' +
    'color:var(--cream);text-shadow:0 4px 0 var(--ink),3px 4px 0 var(--ink),-1px 4px 0 var(--ink),2px 6px 0 var(--ink);-webkit-text-stroke:2px var(--ink);paint-order:stroke fill}' +
    '.gjl-display .y{color:var(--lemon)}.gjl-display .p{color:var(--pink2)}' +
    '.gjl-h2{font-family:"Black Han Sans",Pretendard,sans-serif;font-weight:400;font-size:clamp(34px,7vw,64px);line-height:1.05;margin:0 0 14px}' +
    '.gjl-h2 em{font-style:normal;color:var(--cream);-webkit-text-stroke:2px var(--ink);paint-order:stroke fill;text-shadow:3px 4px 0 var(--ink)}' +
    '.gjl-lead{font-size:17px;line-height:1.65;font-weight:500;max-width:34em;margin:0}' +
    '.gjl-btns{display:flex;flex-wrap:wrap;gap:12px;margin-top:28px}' +
    '.gjl-btn{display:inline-flex;align-items:center;gap:14px;height:56px;padding:0 8px 0 24px;border-radius:999px;background:var(--ink);color:var(--cream)!important;font-weight:800;font-size:16px;border:2px solid var(--ink);box-shadow:0 5px 0 rgba(58,31,20,.35);transition:transform .2s,box-shadow .2s}' +
    '.gjl-btn i{width:40px;height:40px;border-radius:50%;background:var(--cream);color:var(--ink);display:grid;place-items:center;font-style:normal;font-size:18px;transition:transform .25s}' +
    '.gjl-btn:hover{transform:translateY(-2px);box-shadow:0 7px 0 rgba(58,31,20,.35)}.gjl-btn:hover i{transform:rotate(45deg)}' +
    '.gjl-btn.ghost{background:transparent;color:var(--ink)!important;padding:0 24px;box-shadow:none}' +
    /* sprinkles */
    '.gjl-spr{position:absolute;width:26px;height:8px;border-radius:8px;pointer-events:none;animation:gjlFloat 6s ease-in-out infinite}' +
    '@keyframes gjlFloat{0%,100%{transform:translateY(0) rotate(var(--r))}50%{transform:translateY(-14px) rotate(calc(var(--r) + 25deg))}}' +
    /* hero */
    '.gjl-hero{background:var(--pink);padding:56px 0 84px}' +
    '.gjl-hero .gjl-wrap{display:grid;grid-template-columns:1fr;gap:36px;align-items:center}' +
    '.gjl-hero h1{font-size:clamp(64px,17vw,148px);margin:18px 0 22px}' +
    '.gjl-hero-art{position:relative;justify-self:center;width:min(86vw,520px);aspect-ratio:1}' +
    '.gjl-blob{position:absolute;inset:0;border-radius:46% 54% 52% 48%/52% 44% 56% 48%;background:var(--cream);border:3px solid var(--ink);box-shadow:10px 12px 0 var(--ink);overflow:hidden;animation:gjlBlob 9s ease-in-out infinite}' +
    '.gjl-blob img{width:100%;height:100%;object-fit:cover;transform:scale(1.04)}' +
    '@keyframes gjlBlob{0%,100%{border-radius:46% 54% 52% 48%/52% 44% 56% 48%}50%{border-radius:54% 46% 44% 56%/46% 56% 44% 54%}}' +
    '.gjl-badge{position:absolute;right:-6px;top:-10px;width:118px;height:118px;border-radius:50%;background:var(--lemon);border:3px solid var(--ink);display:grid;place-items:center;box-shadow:4px 5px 0 var(--ink);z-index:2}' +
    '.gjl-badge svg{position:absolute;inset:6px;width:calc(100% - 12px);height:calc(100% - 12px);animation:gjlSpin 14s linear infinite}' +
    '.gjl-badge b{font-family:"Black Han Sans",sans-serif;font-weight:400;font-size:30px;line-height:1}' +
    '@keyframes gjlSpin{to{transform:rotate(360deg)}}' +
    '.gjl-tag{position:absolute;left:-8px;bottom:28px;background:var(--cream);border:2px solid var(--ink);border-radius:16px;padding:10px 14px;font-weight:800;font-size:14px;box-shadow:4px 4px 0 var(--ink);transform:rotate(-6deg);z-index:2}' +
    '.gjl-tag small{display:block;font-weight:600;font-size:12px;opacity:.7}' +
    /* marquee */
    '.gjl-marq{background:var(--ink);color:var(--cream);overflow:hidden;white-space:nowrap;padding:14px 0;border-block:3px solid var(--ink)}' +
    '.gjl-marq div{display:inline-block;animation:gjlMarq 22s linear infinite;font-family:"Black Han Sans",sans-serif;font-size:22px}' +
    '.gjl-marq span{margin:0 18px}.gjl-marq span.s{color:var(--lemon)}' +
    '@keyframes gjlMarq{to{transform:translateX(-50%)}}' +
    /* flavors */
    '.gjl-flv{transition:background-color .5s ease}' +
    '.gjl-tabs{display:flex;gap:8px;flex-wrap:wrap;margin:22px 0 30px}' +
    '.gjl-tabs button{font:inherit;font-weight:800;font-size:15px;height:44px;padding:0 18px;border-radius:999px;border:2px solid var(--ink);background:var(--cream);color:var(--ink);cursor:pointer;transition:transform .15s}' +
    '.gjl-tabs button[aria-selected="true"]{background:var(--ink);color:var(--cream)}' +
    '.gjl-tabs button:active{transform:scale(.96)}' +
    '.gjl-flv-body{display:grid;grid-template-columns:1fr;gap:28px;align-items:center}' +
    '.gjl-flv-img{position:relative;aspect-ratio:1;width:min(86vw,480px);justify-self:center;border-radius:36px;border:3px solid var(--ink);background:var(--cream);box-shadow:10px 12px 0 var(--ink);overflow:hidden;transform:rotate(-3deg);transition:transform .4s}' +
    '.gjl-flv-img img{width:100%;height:100%;object-fit:cover;transition:opacity .35s,transform .5s}' +
    '.gjl-flv-img.swap img{opacity:0;transform:scale(.94) rotate(4deg)}' +
    '.gjl-flv h3{font-family:"Black Han Sans",sans-serif;font-weight:400;font-size:clamp(34px,7vw,56px);line-height:1.05;margin:0 0 12px}' +
    '.gjl-price{display:inline-block;margin-top:16px;font-weight:900;font-size:20px;background:var(--cream);border:2px solid var(--ink);border-radius:12px;padding:6px 12px;box-shadow:3px 3px 0 var(--ink)}' +
    /* good stuff */
    '.gjl-good{background:var(--lemon)}' +
    '.gjl-cards{display:grid;grid-template-columns:1fr;gap:18px;margin-top:34px}' +
    '.gjl-card{background:var(--cream);border:3px solid var(--ink);border-radius:28px;padding:26px 24px 28px;box-shadow:7px 8px 0 var(--ink);transition:transform .25s}' +
    '.gjl-card:hover{transform:translateY(-4px) rotate(-1deg)}' +
    '.gjl-card .n{font-family:"Black Han Sans",sans-serif;font-size:48px;line-height:1;color:var(--orange);-webkit-text-stroke:2px var(--ink);paint-order:stroke fill}' +
    '.gjl-card h3{font-family:"Black Han Sans",sans-serif;font-weight:400;font-size:28px;margin:10px 0 8px}' +
    '.gjl-card p{margin:0;font-size:15.5px;line-height:1.6;font-weight:500}' +
    /* menu */
    '.gjl-menu{background:var(--cream)}' +
    '.gjl-cat{margin-top:40px}' +
    '.gjl-cat h3{display:inline-block;font-family:"Black Han Sans",sans-serif;font-weight:400;font-size:24px;margin:0 0 16px;background:var(--pink);border:2px solid var(--ink);border-radius:999px;padding:6px 18px;box-shadow:3px 3px 0 var(--ink)}' +
    '.gjl-cat:nth-child(3) h3{background:var(--lemon)}.gjl-cat:nth-child(4) h3{background:var(--pista)}' +
    '.gjl-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}' +
    '.gjl-item{display:block;background:#fff;border:2px solid var(--ink);border-radius:22px;overflow:hidden;box-shadow:4px 5px 0 var(--ink);transition:transform .2s,box-shadow .2s}' +
    '.gjl-item:hover{transform:translateY(-3px);box-shadow:6px 8px 0 var(--ink)}' +
    '.gjl-item .im{aspect-ratio:1;background:#f4ece0;overflow:hidden;border-bottom:2px solid var(--ink)}' +
    '.gjl-item .im img{width:100%;height:100%;object-fit:cover;transition:transform .4s}' +
    '.gjl-item:hover .im img{transform:scale(1.05)}' +
    '.gjl-item .tx{padding:12px 12px 14px}' +
    '.gjl-item .nm{font-size:14px;font-weight:700;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:2.8em}' +
    '.gjl-item .pr{margin-top:6px;font-weight:900;font-size:16px}' +
    /* reviews */
    '.gjl-rev{background:var(--pista)}' +
    '.gjl-quotes{display:grid;grid-template-columns:1fr;gap:16px;margin-top:30px}' +
    '.gjl-q{background:var(--cream);border:3px solid var(--ink);border-radius:26px 26px 26px 6px;padding:22px;box-shadow:6px 6px 0 var(--ink);font-weight:600;font-size:16px;line-height:1.6}' +
    '.gjl-q:nth-child(2){transform:rotate(1.2deg)}.gjl-q:nth-child(3){transform:rotate(-1deg)}' +
    '.gjl-q .st{color:var(--orange);letter-spacing:2px;font-size:15px;margin-bottom:6px}' +
    '.gjl-q small{display:block;margin-top:10px;font-size:12px;font-weight:700;opacity:.6}' +
    /* gift */
    '.gjl-gift{background:var(--ink);color:var(--cream)}' +
    '.gjl-gift .gjl-wrap{display:grid;grid-template-columns:1fr;gap:30px;align-items:center}' +
    '.gjl-gift .gjl-h2{color:var(--cream)}.gjl-gift .gjl-h2 em{color:var(--lemon);-webkit-text-stroke:0;text-shadow:none}' +
    '.gjl-gift .gjl-btn{background:var(--lemon);color:var(--ink)!important;border-color:var(--lemon)}' +
    '.gjl-gift .gjl-btn i{background:var(--ink);color:var(--lemon)}' +
    '.gjl-gift-img{border-radius:30px;overflow:hidden;border:3px solid var(--cream);transform:rotate(2deg);box-shadow:10px 10px 0 var(--orange)}' +
    '.gjl-gift-img img{display:block;width:100%}' +
    /* reveal */
    '.gjl-rv{opacity:0;transform:translateY(26px);transition:opacity .7s ease,transform .7s cubic-bezier(.2,.8,.2,1)}' +
    '.gjl-rv.in{opacity:1;transform:none}' +
    /* desktop */
    '@media (min-width:900px){.gjl-sec{padding:110px 0}.gjl-hero{padding:80px 0 120px}.gjl-hero .gjl-wrap{grid-template-columns:1.05fr 1fr}' +
    '.gjl-flv-body{grid-template-columns:1fr 1fr}.gjl-cards{grid-template-columns:repeat(3,1fr)}.gjl-grid{grid-template-columns:repeat(4,1fr)}' +
    '.gjl-quotes{grid-template-columns:repeat(3,1fr)}.gjl-gift .gjl-wrap{grid-template-columns:1fr 1fr}.gjl-badge{width:140px;height:140px}}' +
    '@media (prefers-reduced-motion:reduce){.gjl *{animation:none!important;transition:none!important}.gjl-rv{opacity:1;transform:none}}' +
    /* 기존 메인 섹션 숨김 (랜딩이 들어간 경우에만) */
    'body.gjl-on #contents > *:not(.gjl):not(.main--modal):not(script):not(style){display:none!important}';

  function sprinkles(n) {
    var colors = ['#FF5C9A', '#FFE15A', '#7FC8F8', '#8ED16B', '#FF8A00', '#B58CFF', '#FFF8EC'];
    var s = '';
    for (var i = 0; i < n; i++) {
      s += '<span class="gjl-spr" style="left:' + (5 + Math.random() * 90).toFixed(1) + '%;top:' + (5 + Math.random() * 85).toFixed(1) +
        '%;background:' + colors[i % colors.length] + ';--r:' + Math.round(Math.random() * 180) + 'deg;animation-delay:-' + (Math.random() * 6).toFixed(1) + 's" aria-hidden="true"></span>';
    }
    return s;
  }

  function badge() {
    return '<div class="gjl-badge" aria-hidden="true"><svg viewBox="0 0 100 100"><defs><path id="gjlc" d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0"/></defs>' +
      '<text font-size="10.5" font-weight="800" letter-spacing="2.2" fill="#3A1F14"><textPath href="#gjlc">BIG SIZE · 쫀득 꼬끄 · 크림 꽉 · </textPath></text></svg><b>BIG</b></div>';
  }

  function build(live) {
    function d(no) { var b = P[no], l = live[no] || {}; return { name: l.name || b.name, price: l.price || b.price, img: b.img }; }

    var hero = '<section class="gjl-sec gjl-hero" id="gjl-top">' + sprinkles(16) +
      '<div class="gjl-wrap"><div class="gjl-rv">' +
      '<span class="gjl-eyebrow">맛있으면, 꼬리가 먼저 반응해요</span>' +
      '<h1 class="gjl-display">맛있으면<br>꼬리가<br><span class="y">살랑.</span></h1>' +
      '<p class="gjl-lead">쫀득한 꼬끄에 크림은 꽉~. 당은 덜고 기분은 더한 디저트를 작게, 정성껏 구워요.</p>' +
      '<div class="gjl-btns"><a class="gjl-btn" href="#gjl-flavor">오늘의 맛 고르기<i>↗</i></a><a class="gjl-btn ghost" href="#gjl-menu">메뉴 전체 보기</a></div>' +
      '</div><div class="gjl-hero-art gjl-rv">' + badge() +
      '<div class="gjl-blob"><img src="' + P[34].img + '" alt="꼬랑지마카롱 BIG 10구" loading="eager"></div>' +
      '<a class="gjl-tag" href="' + link(34) + '">BIG 10구 클래식/상큼<small>' + won(d(34).price) + ' →</small></a>' +
      '</div></div></section>';

    var marq = '<div class="gjl-marq" aria-hidden="true"><div>' +
      new Array(3).join('<span>크림 꽉~찬 뚱카롱</span><span class="s">★</span><span>쫀득바삭 꼬끄</span><span class="s">★</span><span>당 걱정 덜고 가볍게</span><span class="s">★</span><span>선물은 꼬랑지로</span><span class="s">★</span>') +
      '</div></div>';

    var f0 = FLAVORS[0];
    var flv = '<section class="gjl-sec gjl-flv" id="gjl-flavor" style="background:' + f0.bg + '">' + sprinkles(8) +
      '<div class="gjl-wrap"><div class="gjl-rv"><span class="gjl-eyebrow">FLAVOR ROOM</span>' +
      '<h2 class="gjl-h2" style="margin-top:12px">오늘은 <em>어떤 맛?</em></h2>' +
      '<div class="gjl-tabs" role="tablist">' + FLAVORS.map(function (f, i) {
        return '<button type="button" role="tab" aria-selected="' + (i === 0) + '" data-i="' + i + '">' + f.tab + '</button>';
      }).join('') + '</div></div>' +
      '<div class="gjl-flv-body gjl-rv"><div class="gjl-flv-img"><img src="' + P[f0.no].img + '" alt=""></div>' +
      '<div><h3 class="gjl-flv-t">' + f0.title + '</h3><p class="gjl-lead gjl-flv-d">' + f0.desc + '</p>' +
      '<div class="gjl-flv-n" style="margin-top:14px;font-weight:700">' + esc(d(f0.no).name) + '</div>' +
      '<span class="gjl-price gjl-flv-p">' + won(d(f0.no).price) + '</span>' +
      '<div class="gjl-btns"><a class="gjl-btn gjl-flv-a" href="' + link(f0.no) + '">이 맛 보러 가기<i>↗</i></a></div></div></div>' +
      '</div></section>';

    var good = '<section class="gjl-sec gjl-good">' + sprinkles(6) + '<div class="gjl-wrap">' +
      '<div class="gjl-rv"><span class="gjl-eyebrow">THE GOOD STUFF</span>' +
      '<h2 class="gjl-h2" style="margin-top:12px">작은 디저트,<br><em>큰 기분.</em></h2>' +
      '<p class="gjl-lead">한 입이라도 제대로. 꼬랑지가 디저트를 만드는 세 가지 고집.</p></div>' +
      '<div class="gjl-cards">' +
      '<div class="gjl-card gjl-rv"><div class="n">01</div><h3>크림은 꽉~</h3><p>뚱카롱이라는 이름답게, 필링은 아끼지 않아요. 한 입 베어 물면 바로 알 수 있어요.</p></div>' +
      '<div class="gjl-card gjl-rv"><div class="n">02</div><h3>꼬끄는 쫀득바삭</h3><p>겉은 바삭, 속은 쫀득. 마카롱의 기본인 꼬끄부터 제대로 만들어요.</p></div>' +
      '<div class="gjl-card gjl-rv"><div class="n">03</div><h3>당은 가볍게</h3><p>당 3g 힐로우바, 당 10g 두쫀쿠처럼 부담은 덜고 맛은 지킨 라인도 함께 만들어요.</p></div>' +
      '</div></div></section>';

    var menu = '<section class="gjl-sec gjl-menu" id="gjl-menu"><div class="gjl-wrap">' +
      '<div class="gjl-rv"><span class="gjl-eyebrow">THE MENU</span><h2 class="gjl-h2" style="margin-top:12px">골라 먹는 <em>재미.</em></h2></div>' +
      MENU.map(function (c) {
        return '<div class="gjl-cat gjl-rv"><h3>' + c.cat + '</h3><div class="gjl-grid">' + c.items.map(function (no) {
          var x = d(no);
          return '<a class="gjl-item" href="' + link(no) + '"><div class="im"><img src="' + x.img + '" alt="' + esc(x.name) + '" loading="lazy"></div>' +
            '<div class="tx"><div class="nm">' + esc(x.name) + '</div><div class="pr">' + won(x.price) + '</div></div></a>';
        }).join('') + '</div></div>';
      }).join('') + '</div></section>';

    var rev = '<section class="gjl-sec gjl-rev">' + sprinkles(6) + '<div class="gjl-wrap">' +
      '<div class="gjl-rv"><span class="gjl-eyebrow">HAPPY TAILS</span><h2 class="gjl-h2" style="margin-top:12px">먹어 본 사람들의 <em>한마디.</em></h2></div>' +
      '<div class="gjl-quotes">' + REVIEWS.map(function (r) {
        return '<div class="gjl-q gjl-rv"><div class="st">' + '★★★★★'.slice(0, r.s) + '</div>' + esc(r.t) + '<small>스마트스토어 구매 후기</small></div>';
      }).join('') + '</div></div></section>';

    var gift = '<section class="gjl-sec gjl-gift"><div class="gjl-wrap">' +
      '<div class="gjl-rv"><span class="gjl-eyebrow" style="color:#FFE15A;--dot:#FFE15A">GIFT BOX</span>' +
      '<h2 class="gjl-h2" style="margin-top:12px">선물은<br><em>꼬랑지로.</em></h2>' +
      '<p class="gjl-lead" style="color:#FFF8EC">받는 사람 꼬리까지 흔들리는 선물. 두바이 쫀득 쿠키 6구 선물세트, ' + won(d(78).price) + '.</p>' +
      '<div class="gjl-btns"><a class="gjl-btn" href="' + link(78) + '">선물세트 보기<i>↗</i></a></div></div>' +
      '<a class="gjl-gift-img gjl-rv" href="' + link(78) + '"><img src="' + P[78].img + '" alt="두바이 쫀득 쿠키 6구 선물세트" loading="lazy"></a>' +
      '</div></section>';

    return hero + marq + flv + good + menu + rev + gift;
  }

  function bind(root, live) {
    // 맛 탭
    var sec = root.querySelector('.gjl-flv');
    var imgBox = root.querySelector('.gjl-flv-img');
    var img = imgBox.querySelector('img');
    root.querySelectorAll('.gjl-tabs button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var f = FLAVORS[+btn.getAttribute('data-i')];
        var b = P[f.no], l = live[f.no] || {};
        root.querySelectorAll('.gjl-tabs button').forEach(function (x) { x.setAttribute('aria-selected', x === btn); });
        sec.style.backgroundColor = f.bg;
        imgBox.classList.add('swap');
        setTimeout(function () { img.src = b.img; imgBox.classList.remove('swap'); }, 220);
        root.querySelector('.gjl-flv-t').textContent = f.title;
        root.querySelector('.gjl-flv-d').textContent = f.desc;
        root.querySelector('.gjl-flv-n').textContent = l.name || b.name;
        root.querySelector('.gjl-flv-p').textContent = won(l.price || b.price);
        root.querySelector('.gjl-flv-a').setAttribute('href', link(f.no));
      });
    });
    // 부드러운 앵커 이동 (고정 헤더 높이 보정)
    root.querySelectorAll('a[href^="#gjl-"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var t = document.querySelector(a.getAttribute('href'));
        if (!t) return;
        e.preventDefault();
        var hd = document.getElementById('header');
        var off = hd ? hd.offsetHeight : 0;
        window.scrollTo({ top: t.getBoundingClientRect().top + window.pageYOffset - off, behavior: 'smooth' });
      });
    });
    // 스크롤 등장
    var els = root.querySelectorAll('.gjl-rv');
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
      }, { threshold: 0.12 });
      els.forEach(function (el) { io.observe(el); });
    } else {
      els.forEach(function (el) { el.classList.add('in'); });
    }
  }

  function start() {
    var contents = document.getElementById('contents');
    if (!contents || document.querySelector('.gjl')) return;
    var st = document.createElement('style');
    st.id = 'gjl-style';
    st.textContent = CSS;
    document.head.appendChild(st);

    var live = liveData();
    var root = document.createElement('div');
    root.className = 'gjl';
    root.innerHTML = build(live);
    contents.insertBefore(root, contents.firstChild);
    document.body.classList.add('gjl-on');
    bind(root, live);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
