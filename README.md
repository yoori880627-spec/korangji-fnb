# cafe24-scripts

꼬랑지마카롱 카페24 쇼핑몰(ggorangjicaron.com)에 ScriptTag로 설치되는 화면 스크립트.

- `reviews/ggorangi-reviews.js` — 상품상세 하단 스마트스토어 리뷰를 상품군별로 표시
- `fixes/vreview-out-of-buybar.js` — 브이리뷰 위젯이 하단 고정 구매바 안에 들어가 화면을 가리는 문제 수정 (위젯을 구매바 밖으로 이동)
- `landing/ggorangji-landing.js` — 메인 랜딩 (기존 메인 섹션을 숨기고 랜딩 섹션 표시, ScriptTag 삭제 시 원복)
- `backup/skin9/` — 랜딩 적용 전 실제 스킨(skin9) 원본 파일 백업
  (상품군 설정은 파일 상단 `GROUPS`)

jsDelivr 커밋 고정 주소로 불러온다: `https://cdn.jsdelivr.net/gh/yoori880627-spec/korangji-fnb@<commit>/reviews/ggorangi-reviews.js`
