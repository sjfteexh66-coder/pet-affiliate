# 조립PC 견적기

예산과 용도를 고르면 호환성까지 검증된 조립PC 견적을 자동으로 만들어 주는 정적 사이트입니다.
빌드 도구나 서버가 필요 없습니다. `pc/index.html`을 브라우저로 열면 바로 동작합니다.

## 파일 구조

| 파일 | 역할 |
| --- | --- |
| `index.html` | 화면 구조 (견적 조건 · 결과 · 가이드 · FAQ) |
| `css/pc.css` | 스타일 (인쇄용 견적서 레이아웃 포함) |
| `js/prices.js` | **자동 수집된 가격** (스크립트가 생성, 직접 수정 금지) |
| `js/parts-data.js` | **부품 데이터베이스** — 스펙 · 성능 지수 · 기본 추정 가격 |
| `js/engine.js` | 견적 생성 · 호환성 검사 · 성능 추정 (화면과 무관한 순수 로직) |
| `js/app.js` | 화면 렌더링과 사용자 조작 처리 |

로드 순서는 `prices.js → parts-data.js → engine.js → app.js` 입니다.
`prices.js`에 수집된 가격이 있으면 `parts-data.js`의 추정 가격을 덮어쓰고, 비어 있으면 추정 가격을 그대로 씁니다.
가격의 기준 시점과 출처는 사이트 화면(견적표 아래 · 푸터 · FAQ)에 자동으로 표시됩니다.

## 가격을 실제 시세로 자동 갱신하기

네이버 쇼핑 검색 API로 매일 시세를 받아 `js/prices.js`를 갱신합니다. 정적 사이트 구조는 그대로 유지됩니다.

### 1. 네이버 API 키 발급 (무료)

1. <https://developers.naver.com/apps/#/register> 에서 애플리케이션 등록
2. **사용 API**로 `검색`을 선택
3. 발급된 **Client ID**와 **Client Secret**을 복사

검색 API는 하루 25,000회까지 무료이며, 이 스크립트는 한 번 실행에 65회만 사용합니다.

### 2. GitHub Secrets에 등록

저장소 **Settings → Secrets and variables → Actions → New repository secret** 에서 두 개를 추가합니다.

| 이름 | 값 |
| --- | --- |
| `NAVER_CLIENT_ID` | 발급받은 Client ID |
| `NAVER_CLIENT_SECRET` | 발급받은 Client Secret |

등록하면 `.github/workflows/update-prices.yml`이 **매일 06:00(KST)**에 시세를 받아
`pc/js/prices.js`를 갱신하고, 값이 바뀐 경우에만 커밋합니다.
**Actions 탭 → 부품 가격 자동 갱신 → Run workflow**로 즉시 실행할 수도 있습니다.

키를 등록하지 않아도 워크플로는 실패하지 않고 건너뜁니다(사이트는 추정 가격으로 계속 동작).

### 3. 로컬에서 직접 실행

```bash
export NAVER_CLIENT_ID=...
export NAVER_CLIENT_SECRET=...

node scripts/update-prices.mjs              # 수집 후 pc/js/prices.js 갱신
node scripts/update-prices.mjs --dry-run    # 결과만 확인, 파일은 그대로
node scripts/update-prices.mjs --only gpu-5070,cpu-r5-7500f   # 일부만
```

### 가격을 고르는 방법

쇼핑 검색 결과에는 중고 · 액세서리 · 조립PC 완본체가 섞여 있어 최저가를 그대로 쓰면 견적이 망가집니다.
그래서 `scripts/price-pick.mjs`가 다음 순서로 걸러낸 뒤 **유효 상품 중 싼 쪽 5건의 중앙값**을 택합니다.

1. 중고 · 리퍼 · 조립PC 완본체 등 제외 단어가 든 상품 제거
2. 상품명에 모델명(`qm`)이 모두 들어 있지 않으면 제거
3. 상위 모델(`qx`, 예: `RX 9070`을 찾을 때 `9070 XT`) 제거
4. 현재 가격의 0.5배 미만 · 2배 초과는 이상치로 제거
5. 남은 상품이 3건 미만이면 신뢰하지 않고 **기존 가격을 유지**

검색 조건은 `scripts/price-queries.mjs`에 부품별로 정의되어 있습니다.
CPU · 그래픽카드 · 메인보드는 모델명이 정확해 신뢰도가 높고,
SSD · 파워 · 케이스 · 쿨러는 특정 제품이 아니라 **등급 대표값**입니다.
특정 제품으로 고정하려면 해당 항목의 `q`와 `qm`을 그 제품명으로 바꾸면 됩니다.

메모리는 단품 가격을 받아 `qn`(2개 구성)을 곱해 계산합니다.

### 수동으로 고치려면

`js/parts-data.js`의 `price` 값(원 단위)을 고치면 됩니다.
단, `js/prices.js`에 수집된 가격이 있으면 그쪽이 우선하므로 해당 항목을 지우거나 함께 수정하세요.

```js
{ id:'gpu-5070', name:'지포스 RTX 5070 12GB', ..., price:830000 }
//                                                  ^^^^^^ 이 값만 수정
```

## 부품을 추가하려면

`PARTS`의 해당 카테고리 배열에 항목을 하나 추가하면 견적 대상에 자동으로 포함됩니다.
`id`는 전체에서 겹치지 않아야 하며(공유 링크에 사용됨), `score`는 **같은 카테고리 안에서의
상대 지수**입니다. 카테고리별 필수 필드는 다음과 같습니다.

- **cpu** — `socket`, `cores`, `threads`, `tdp`, `mem`(지원 메모리 규격 배열), `igpu`, `bundled`(번들 쿨러 포함 여부), `gameScore`, `workScore`
- **gpu** — `vram`, `tdp`, `length`(mm), `score`(RTX 5070 = 100 기준)
- **board** — `socket`, `chipset`, `form`(ATX/M-ATX), `mem`, `slots`, `m2`, `wifi`, `score`
- **ram** — `type`(DDR4/DDR5), `capacity`, `sticks`, `speed`, `score`
- **storage** — `iface`, `capacity`(GB), `seq`, `score`
- **psu** — `watt`, `rating`, `modular`, `score`
- **case** — `forms`(지원 규격 배열), `maxGpu`, `maxCooler`, `rad`, `score`
- **cooler** — `type`(공랭/수랭/번들), `height`, `tdpMax`, `rad`, `score`

CPU 소켓을 새로 추가했다면 그 소켓용 메인보드도 최소 하나는 있어야 합니다.
단종된 소켓은 `engine.js`의 `LEGACY_SOCKETS`에 넣으면 확장성 감점이 적용됩니다.

부품을 추가했다면 `scripts/price-queries.mjs`에도 같은 `id`로 검색 조건을 추가해야
자동 갱신 대상이 됩니다. 빠뜨리면 `node scripts/check-coverage.mjs`가 알려줍니다.

## 견적 알고리즘

1. **최소 구성** — 선택한 용도의 최소 요구 조건(메모리 · 저장장치 · 그래픽카드 필요 여부)을
   만족하는 가장 저렴한 조합을 플랫폼(소켓)별로 하나씩 만든다.
2. **탐욕적 업그레이드** — 남은 예산으로 *1만원당 점수 상승폭*이 가장 큰 부품을 하나씩 교체한다.
   교체할 때마다 소켓 · 메모리 규격 · 케이스 크기 · 파워 용량을 다시 맞춘다(`repair`).
3. **균형 감점** — CPU와 그래픽카드의 급 차이가 벌어지면 점수를 깎아, 한쪽에만 예산이
   몰리는 구성을 피한다. 해상도 · 주사율에 따라 기준이 달라진다.
4. **플랫폼 비교** — 플랫폼별 결과 중 점수가 가장 높은 구성을 최종 견적으로 채택한다.

용도별 가중치 · 예산 상한 · 충분 용량 기준은 `engine.js`의 `PURPOSES`에 모여 있습니다.

## 테스트

```bash
node --test scripts/price-pick.test.mjs   # 가격 선정 로직 (네트워크 불필요)
node scripts/check-coverage.mjs           # 부품 ↔ 검색 설정 대조
```

푸시와 풀 리퀘스트에서 `.github/workflows/ci.yml`이 자동으로 실행합니다.

## 주의

자동 수집된 가격도 **쇼핑 검색 결과 기준값**이라 실제 구매가와 다를 수 있습니다.
키를 등록하기 전까지는 추정 가격이 쓰입니다.
예상 프레임과 소비전력도 부품 등급을 바탕으로 계산한 값으로, 실제 성능은 게임 버전 ·
그래픽 옵션 · 드라이버에 따라 달라집니다.
