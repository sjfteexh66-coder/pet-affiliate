/* ===== 자동 수집된 부품 가격 =====
 * scripts/update-prices.mjs 가 생성하는 파일입니다. 직접 수정하지 마세요.
 * 값을 손보고 싶다면 pc/js/parts-data.js 의 price 를 고치거나,
 * 검색 조건(scripts/price-queries.mjs)을 조정한 뒤 스크립트를 다시 실행하세요.
 *
 * items 가 비어 있으면 사이트는 parts-data.js 의 추정 가격을 그대로 사용합니다.
 * NAVER_CLIENT_ID / NAVER_CLIENT_SECRET 을 GitHub Secrets 에 등록하면
 * 매일 06:00(KST) 워크플로가 이 파일을 실제 시세로 채웁니다.
 */
const PRICE_OVERRIDES = {
  updated: '',
  source: '네이버 쇼핑 최저가',
  items: {
  }
};
