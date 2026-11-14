"""스마트스토어 리뷰 → 상품군별 'AI 리뷰 요약' 데이터(reviews/insights.json) 생성.

- summary : 리뷰 원문을 읽고 작성한 요약 문장 (리뷰 갱신 시 함께 검토·수정)
- caution : 내부 참고용 아쉬운 점 (쇼핑몰에는 표시하지 않음, insights.json 에도 넣지 않음)
- 키워드/추천 대상 수치 : 이 스크립트가 리뷰 원문에서 직접 세어 계산 (과장 없음)

실행: python3 tools/build_insights.py
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REVIEWS = ROOT / 'reviews' / 'naverReviews.json'
OUT = ROOT / 'reviews' / 'insights.json'

X = ['피크닉', '비밀']
# 프론트(ggorangi-reviews.js)의 GROUPS 와 같은 기준
GROUPS = {
    '약과': dict(naver=['8906031486'], keywords=[], exclude=X),
    '두바이쫀득쿠키': dict(naver=['13090121881', '12969856469', '13635227357'], keywords=['쫀득쿠키', '쫀득 쿠키'], exclude=X),
    '꼬랑지마카롱': dict(naver=['10611185703', '6957805087', '5959915768'], keywords=['뚱카롱', '윗미 마카롱'], exclude=X + ['후레이크', '꼬끄', '키토', '사그램']),
    '힐로우바': dict(naver=['9149565686'], keywords=['힐로우바'], exclude=X),
    '나쵸칩': dict(naver=['13664442313', '13746596725', '13746678335'], keywords=['나쵸칩'], exclude=X),
    '두바이초콜릿': dict(naver=['11150214525'], keywords=['두바이 초콜릿', '두바이초콜릿'], exclude=X),
    '꼬끄 후레이크': dict(naver=['5471892506', '13812363886'], keywords=[], exclude=X),
}

# 리뷰를 읽고 작성한 요약 (리뷰 데이터가 바뀌면 다시 읽고 고칠 것)
SUMMARY = {
    '꼬랑지마카롱': ('덜 달고 부담 없는 저당 마카롱이라는 평이 가장 많고, 선물용이나 아이 간식으로 샀다는 후기가 많아요. '
                 '개별 포장과 넉넉한 소비기한도 장점으로 꼽혔어요.',
                 '크림이 다소 느끼하다는 의견과, 냉동 제품이라 꼬끄 식감이 제각각이라는 의견이 있어요.'),
    '두바이쫀득쿠키': ('쫀득한 겉피와 바삭한 카다이프, 진한 피스타치오 맛에 대한 만족이 높아요. '
                  '예쁜 패키지 덕분에 선물용으로 많이 샀고, 다른 두쫀쿠보다 가성비가 좋다는 후기도 많아요.',
                  '생각보다 달다는 의견과, 배송 중 뚜껑이 열리거나 아이스팩이 터진 사례가 일부 있었어요.'),
    '약과': ('당뇨·임신성 당뇨로 당 관리가 필요한 분이나 다이어트 중인 분이 부담 없이 먹을 수 있어 좋다는 후기가 많아요. '
           '개별 포장이라 하나씩 꺼내 먹기 좋고, 기본(아몬드)맛을 추천하는 의견이 많아요.',
           '일반 약과보다 쫀득한 식감에 맛이 다르고 크기가 작다는 의견, 가격이 비싸다는 의견이 있어요.'),
    '힐로우바': ('달지 않고 쫀득한 식감에 성분이 좋아 건강 간식이나 식단용으로 만족한다는 후기가 많아요. '
             '황치즈맛이 맛있다는 의견이 있어요.',
             '맛이 담백한 \'건강한 맛\'이고 식감이 끈적하다는 의견, 일부 배송 포장이 아쉬웠다는 의견이 있어요.'),
    '나쵸칩': ('바삭하고 고소한 식감에 단백질이 높아 다이어트 중 과자 대용으로 좋다는 평이 많아요. '
            '맛 중에서는 갈릭(마늘)맛을 꼽은 후기가 가장 많아요.',
            '출시 초기 배송이 많이 늦었다는 의견이 여러 건 있었어요.'),
    '두바이초콜릿': ('저당이라 좋다는 의견과 카다이프의 쫀득한 식감, 가성비에 만족한다는 후기가 있어요. '
               '요거트에 곁들여 먹어도 맛있다는 의견이 있어요.',
               '아직 리뷰 수가 적어서 참고용으로 봐 주세요.'),
    '꼬끄 후레이크': ('바로 먹으면 바삭, 살짝 녹이면 쫀득해지는 식감과 넉넉한 양에 만족한 후기가 많아요. '
                 '우유나 요거트에 곁들이거나 커피와 함께 먹기 좋다는 의견이 많아요.',
                 '딱딱한 조각이 많다거나 생각보다 달다는 의견이 일부 있어요.'),
}

# 키워드(리뷰 보기 필터) — 정규식은 프론트에서도 같은 것으로 리뷰를 걸러 보여줌
THEMES = [
    ('맛있어요', r'맛있|맛나|존맛|맛이 ?좋|맛좋|꿀맛'),
    ('덜 달아요', r'달지 ?않|덜 ?달|안 ?달|않고 ?달|담백|안달'),
    ('식감', r'쫀득|쫀뜩|쫜득|쫀딕|바삭|쫄깃|꾸덕|식감|콰삭|와사삭'),
    ('선물용', r'선물'),
    ('아이 간식', r'아이(?!스)|애들|아들|딸(?!기)|조카|아기|급식|초딩'),
    ('당 관리', r'저당|당뇨|임당|임신성|혈당|제로슈가|노슈가|당이 ?(낮|적|0)|당류|로우슈가'),
    ('다이어트', r'다이어트|다이어터|식단'),
    ('포장·배송', r'포장|배송|아이스팩|얼음팩|택배'),
    ('가성비', r'가성비|저렴|가격 ?대비|가격대 ?성능|할인|세일|1\+1|혜자'),
    ('재구매', r'재구매|재주문|또 ?(주문|살|시킬|사러|구매)|n번째|자주 ?(구매|시켜)'),
]

# '이런 분들이 많이 샀어요' — 구매 목적/대상
PERSONAS = [
    ('선물하실 분', r'선물'),
    ('아이 간식 찾는 분', r'아이(?!스)|애들|아들|딸(?!기)|조카|아기|급식|초딩'),
    ('당 관리가 필요한 분', r'당뇨|임당|임신성|혈당|당 ?관리|당조절|저당|제로슈가'),
    ('다이어트 중인 분', r'다이어트|다이어터|식단'),
    ('부모님 간식 찾는 분', r'엄마|아빠|부모|어머니|아버지|장모|연배|엄빠'),
    ('커피와 함께 드실 분', r'커피|아메리카노'),
    ('건강 간식 찾는 분', r'건강|성분|글루텐|밀가루'),
]


def belongs(r, g):
    if r.get('product_no') in g['naver']:
        return True
    name = re.sub(r'\s', '', r.get('product_name') or '')
    if any(re.sub(r'\s', '', e) in name for e in g['exclude']):
        return False
    return any(re.sub(r'\s', '', k) in name for k in g['keywords'])


def main():
    reviews = json.loads(REVIEWS.read_text(encoding='utf-8'))
    out = {'generated_from': len(reviews), 'themes': [{'label': l, 're': p} for l, p in THEMES], 'groups': {}}
    for name, g in GROUPS.items():
        rs = [r for r in reviews if belongs(r, g)]
        if not rs:
            continue
        texts = [r.get('text') or '' for r in rs]
        theme_counts = [{'label': l, 'count': sum(1 for t in texts if re.search(p, t))} for l, p in THEMES]
        persona_counts = [{'label': l, 'count': sum(1 for t in texts if re.search(p, t))} for l, p in PERSONAS]
        persona_counts = sorted([p for p in persona_counts if p['count'] >= 2], key=lambda p: -p['count'])[:3]
        s, c = SUMMARY[name]
        out['groups'][name] = {
            'review_count': len(rs),
            'summary': s,
            'personas': persona_counts,
            'themes': [t for t in theme_counts if t['count'] >= 2],
        }
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')
    for k, v in out['groups'].items():
        print(k, v['review_count'], '| 추천:', ', '.join(f"{p['label']} {p['count']}" for p in v['personas']),
              '| 키워드:', ', '.join(f"{t['label']} {t['count']}" for t in v['themes']))


if __name__ == '__main__':
    main()
