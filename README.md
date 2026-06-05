# 꼬랑지F&B 코퍼레이트 홈페이지

정성으로 빚은 디저트 — 마카롱 · 약과 · 두바이 초콜릿 · 에너지바.
단일 HTML 파일로 동작하는 정적 웹사이트입니다. (Pretendard / 오렌지·블랙·화이트)

## 구성
- `index.html` — 홈페이지 전체 (HTML + CSS + JS 한 파일)

## 로컬에서 보기
파일을 더블클릭하거나 브라우저로 열면 됩니다.

## GitHub Pages로 배포
1. 저장소 → **Settings → Pages**
2. **Source: Deploy from a branch** → Branch: `main` / `/ (root)` → Save
3. 잠시 후 `https://<아이디>.github.io/<저장소이름>/` 에서 공개

## 교체해야 할 항목
- 제품/브랜드 사진 (현재 Unsplash 무료 이미지 → 실제 제품 사진)
- 로고
- 통계 숫자: `index.html`의 `data-to="0"` → 실제 값 (예: `data-to="50"`)
- 푸터: 사업자등록번호, 대표자, 주소, 연락처
- 뉴스 보도자료 내용
