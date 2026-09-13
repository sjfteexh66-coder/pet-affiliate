/* ===== 검색 결과에서 쓸 만한 가격을 고르는 로직 =====
 * 네트워크에 접근하지 않는 순수 함수라 그대로 테스트할 수 있다.
 *
 * 쇼핑 검색 결과에는 중고 · 부품 · 조립PC 완본체처럼 견적에 쓰면 안 되는 항목이
 * 섞여 있다. 그래서 최저가를 그대로 쓰지 않고 다음 순서로 걸러낸 뒤
 * "유효한 항목 중 싼 쪽 몇 개의 중앙값"을 택한다. 오타 · 미끼 가격 한 건에
 * 전체 견적이 흔들리는 것을 막기 위해서다.
 */

/* 상품명에 있으면 견적용 부품이 아니라고 보는 단어 */
export const EXCLUDE_WORDS = [
  '중고', '리퍼', '렌탈', '대여', '수리', '파손', '부품용', '고장',
  '조립PC', '완본체', '게이밍PC', '본체', '데스크탑세트', '사은품', '쿠폰'
];

export const MIN_SAMPLES = 3;    // 이보다 적게 남으면 신뢰하지 않고 기존 가격을 유지
export const SAMPLE_SIZE = 5;    // 중앙값을 낼 때 쓰는 "싼 쪽" 개수
export const MIN_RATIO = 0.5;    // 기준가 대비 이 배수보다 싸면 버린다
export const MAX_RATIO = 2.0;    // 기준가 대비 이 배수보다 비싸면 버린다

/* 공백 · 하이픈 · 기호를 없애고 대문자로 맞춘다.
 * 'DDR5-5600'과 'DDR5 5600'을 같은 문자열로 취급하기 위한 처리다. */
export function normalize(s) {
  return String(s)
    .replace(/<[^>]*>/g, '')            // 검색 API가 넣는 <b> 강조 태그 제거
    .toUpperCase()
    .replace(/[^A-Z0-9가-힣]/g, '');
}

function median(sorted) {
  const m = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[m] : Math.round((sorted[m - 1] + sorted[m]) / 2);
}

/* items        : 검색 API가 돌려준 항목 배열 ({ title, lprice } 사용)
 * cfg          : price-queries.mjs 의 항목 설정
 * currentPrice : 현재 사이트에 들어 있는 가격 (이상치 판단 기준)
 */
export function pickPrice(items, cfg, currentPrice) {
  const count = cfg.qn || 1;
  const anchor = currentPrice / count;              // 개당 기준가
  const must = (cfg.qm || cfg.q.split(/\s+/)).map(normalize).filter(Boolean);
  const ban = (cfg.qx || []).map(normalize).filter(Boolean);
  const banned = EXCLUDE_WORDS.map(normalize);

  const kept = [];
  const dropped = [];

  for (const item of items || []) {
    const title = normalize(item.title);
    const price = Number(item.lprice);
    let why = null;

    if (!Number.isFinite(price) || price <= 0) why = '가격 없음';
    else if (banned.some(w => title.includes(w))) why = '견적용 상품 아님';
    else if (!must.every(m => title.includes(m))) why = '이름 불일치';
    else if (ban.some(b => title.includes(b))) why = '다른 모델';
    else if (price < anchor * MIN_RATIO) why = '지나치게 저렴';
    else if (price > anchor * MAX_RATIO) why = '지나치게 비쌈';

    if (why) dropped.push({ title: String(item.title).replace(/<[^>]*>/g, ''), price, why });
    else kept.push(price);
  }

  if (kept.length < MIN_SAMPLES) {
    return { price: null, samples: kept.length, dropped,
      reason: `유효 상품 ${kept.length}건 (최소 ${MIN_SAMPLES}건 필요)` };
  }

  kept.sort((a, b) => a - b);
  const unit = median(kept.slice(0, SAMPLE_SIZE));
  return {
    price: Math.round(unit * count / 1000) * 1000,   // 1,000원 단위로 반올림
    samples: kept.length,
    dropped
  };
}
