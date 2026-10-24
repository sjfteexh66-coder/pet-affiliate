/* ===== 부품별 가격 검색 설정 =====
 * 네이버 쇼핑 검색 API로 가격을 받아올 때만 쓰이며, 사이트에는 포함되지 않는다.
 *
 *   q  : API에 보낼 검색어
 *   qm : 상품명에 반드시 있어야 하는 토큰 (생략하면 q를 공백으로 쪼개 사용)
 *   qx : 상품명에 있으면 제외할 토큰 (상위 모델을 걸러낼 때 사용)
 *   qn : 부품 하나를 구성하는 개수 (메모리 2개 구성 등, 기본 1)
 *
 * 비교는 공백 · 하이픈 · 기호를 모두 없애고 대문자로 바꾼 뒤 이뤄진다.
 * 따라서 'DDR5-5600'은 상품명 'DDR5 5600'과도 일치한다.
 *
 * 부품을 새로 추가했다면 여기에도 항목을 추가해야 자동 갱신 대상이 된다.
 * 가격이 0원인 부품(내장그래픽, 번들 쿨러)은 대상이 아니다.
 */
export const PRICE_QUERIES = {
  /* --- CPU : 모델명이 명확해 정확도가 가장 높다 --- */
  'cpu-r5-5600':    { q:'AMD 라이젠5 5600 정품',        qm:['라이젠5','5600'],   qx:['5600X','5600G','5600GT'] },
  'cpu-i5-12400f':  { q:'인텔 코어i5-12400F 정품',      qm:['코어I512400F'] },
  'cpu-r5-7500f':   { q:'AMD 라이젠5 7500F 정품',       qm:['라이젠5','7500F'] },
  'cpu-r5-7600':    { q:'AMD 라이젠5 7600 정품',        qm:['라이젠5','7600'],   qx:['7600X'] },
  'cpu-i5-14400f':  { q:'인텔 코어i5-14400F 정품',      qm:['코어I514400F'] },
  'cpu-r5-9600x':   { q:'AMD 라이젠5 9600X 정품',       qm:['라이젠5','9600X'] },
  'cpu-u5-245k':    { q:'인텔 코어 울트라5 245K 정품',  qm:['울트라5','245K'],   qx:['245KF'] },
  'cpu-r7-9700x':   { q:'AMD 라이젠7 9700X 정품',       qm:['라이젠7','9700X'] },
  'cpu-i7-14700f':  { q:'인텔 코어i7-14700F 정품',      qm:['코어I714700F'] },
  'cpu-r7-7800x3d': { q:'AMD 라이젠7 7800X3D 정품',     qm:['라이젠7','7800X3D'] },
  'cpu-u7-265k':    { q:'인텔 코어 울트라7 265K 정품',  qm:['울트라7','265K'],   qx:['265KF'] },
  'cpu-r9-9900x':   { q:'AMD 라이젠9 9900X 정품',       qm:['라이젠9','9900X'],  qx:['9900X3D'] },
  'cpu-r7-9800x3d': { q:'AMD 라이젠7 9800X3D 정품',     qm:['라이젠7','9800X3D'] },
  'cpu-u9-285k':    { q:'인텔 코어 울트라9 285K 정품',  qm:['울트라9','285K'] },
  'cpu-r9-9950x':   { q:'AMD 라이젠9 9950X 정품',       qm:['라이젠9','9950X'],  qx:['9950X3D'] },

  /* --- 그래픽카드 : 상위 모델명이 하위 모델명을 포함하므로 qx로 걸러낸다 --- */
  'gpu-b580':       { q:'인텔 아크 B580 12GB 그래픽카드',    qm:['B580'] },
  'gpu-5050':       { q:'지포스 RTX 5050 8GB 그래픽카드',    qm:['RTX5050'] },
  'gpu-5060':       { q:'지포스 RTX 5060 8GB 그래픽카드',    qm:['RTX5060','8GB'],  qx:['5060TI'] },
  'gpu-9060xt8':    { q:'라데온 RX 9060 XT 8GB 그래픽카드',  qm:['9060XT','8GB'] },
  'gpu-9060xt16':   { q:'라데온 RX 9060 XT 16GB 그래픽카드', qm:['9060XT','16GB'] },
  'gpu-5060ti16':   { q:'지포스 RTX 5060 Ti 16GB 그래픽카드',qm:['5060TI','16GB'] },
  'gpu-5070':       { q:'지포스 RTX 5070 12GB 그래픽카드',   qm:['RTX5070','12GB'], qx:['5070TI'] },
  'gpu-9070':       { q:'라데온 RX 9070 16GB 그래픽카드',    qm:['RX9070'],         qx:['9070XT'] },
  'gpu-9070xt':     { q:'라데온 RX 9070 XT 16GB 그래픽카드', qm:['9070XT'] },
  'gpu-5070ti':     { q:'지포스 RTX 5070 Ti 16GB 그래픽카드',qm:['5070TI'] },
  'gpu-5080':       { q:'지포스 RTX 5080 16GB 그래픽카드',   qm:['RTX5080'] },
  'gpu-5090':       { q:'지포스 RTX 5090 32GB 그래픽카드',   qm:['RTX5090'] },

  /* --- 메인보드 --- */
  'mb-a520m':       { q:'ASUS PRIME A520M-K 메인보드',            qm:['A520MK'] },
  'mb-h610m':       { q:'ASUS PRIME H610M-K D4 메인보드',         qm:['H610MK'] },
  'mb-b550m':       { q:'MSI B550M PRO-VDH WIFI 메인보드',        qm:['B550M','PROVDH'] },
  'mb-b650m-hdv':   { q:'ASRock B650M-HDV/M.2 메인보드',          qm:['B650MHDV'] },
  'mb-b760m':       { q:'MSI B760M 박격포 WIFI DDR5 메인보드',    qm:['B760M','박격포','DDR5'] },
  'mb-b650m-mag':   { q:'MSI B650M 박격포 WIFI 메인보드',         qm:['B650M','박격포'] },
  'mb-b860m':       { q:'ASUS PRIME B860M-A WIFI 메인보드',       qm:['B860MA'] },
  'mb-b850':        { q:'ASUS TUF GAMING B850-PLUS WIFI 메인보드',qm:['B850PLUS'] },
  'mb-z890':        { q:'MSI Z890 토마호크 WIFI 메인보드',        qm:['Z890','토마호크'] },
  'mb-x870':        { q:'ASUS ROG STRIX X870-F 메인보드',         qm:['X870F'] },

  /* --- 메모리 : 단품은 qn:2 로 두 개 값, 패키지는 그대로 --- */
  'ram-d4-16':      { q:'삼성전자 DDR4-3200 8GB',      qm:['DDR43200','8GB'],  qn:2 },
  'ram-d4-32':      { q:'삼성전자 DDR4-3200 16GB',     qm:['DDR43200','16GB'], qn:2 },
  'ram-d5-16':      { q:'삼성전자 DDR5-5600 8GB',      qm:['DDR55600','8GB'],  qn:2 },
  'ram-d5-32':      { q:'삼성전자 DDR5-5600 16GB',     qm:['DDR55600','16GB'], qn:2 },
  'ram-d5-32-6000': { q:'G.SKILL DDR5-6000 CL30 TRIDENT Z5 NEO RGB 32GB', qm:['TRIDENTZ5NEO','6000','32GB'] },
  'ram-d5-64':      { q:'삼성전자 DDR5-5600 32GB',     qm:['DDR55600','32GB'], qn:2 },
  'ram-d5-96':      { q:'마이크론 Crucial DDR5-5600 48GB', qm:['DDR55600','48GB'], qn:2 },

  /* --- 저장장치 --- */
  'ssd-500':        { q:'SK하이닉스 Gold P31 500GB',   qm:['P31','500GB'] },
  'ssd-1t':         { q:'WD Blue SN5000 1TB',          qm:['SN5000','1TB'] },
  'ssd-1t-fast':    { q:'WD BLACK SN850X 1TB',         qm:['SN850X','1TB'] },
  'ssd-2t':         { q:'삼성전자 990 EVO Plus 2TB',   qm:['990EVOPLUS','2TB'] },
  'ssd-4t':         { q:'삼성전자 990 EVO Plus 4TB',   qm:['990EVOPLUS','4TB'] },

  /* --- 파워 --- */
  'psu-500b':       { q:'마이크로닉스 Classic II 풀체인지 500W', qm:['CLASSICII','500W'] },
  'psu-600b':       { q:'마이크로닉스 Classic II 풀체인지 600W', qm:['CLASSICII','600W'] },
  'psu-700b':       { q:'마이크로닉스 Classic II 풀체인지 700W', qm:['CLASSICII','700W'] },
  'psu-750g':       { q:'마이크로닉스 ASTRO GD 750W 골드',       qm:['ASTROGD','750W'] },
  'psu-850g':       { q:'마이크로닉스 ASTRO GD 850W 골드 ATX3.1',qm:['ASTROGD','850W'] },
  'psu-1000g':      { q:'시소닉 FOCUS GX-1000 ATX3.1',          qm:['GX1000'] },
  'psu-1200p':      { q:'시소닉 PRIME PX-1200 ATX3.1',          qm:['PX1200'] },

  /* --- 케이스 --- */
  'case-mini':      { q:'darkFlash DLM21 MESH',        qm:['DLM21'] },
  'case-mid':       { q:'darkFlash DLX21 RGB MESH',    qm:['DLX21'] },
  'case-mesh':      { q:'리안리 LANCOOL 216',          qm:['LANCOOL216'] },
  'case-big':       { q:'리안리 O11 DYNAMIC EVO XL',   qm:['O11','EVOXL'] },

  /* --- 쿨러 --- */
  'cool-slim':      { q:'DEEPCOOL AG400',                       qm:['AG400'], qx:['AG400D','DIGITAL'] },
  'cool-tower':     { q:'써멀라이트 Peerless Assassin 120 SE',  qm:['PEERLESSASSASSIN120'] },
  'cool-tower-p':   { q:'DEEPCOOL AK620 DIGITAL',               qm:['AK620','DIGITAL'] },
  'cool-aio240':    { q:'ARCTIC Liquid Freezer III 240',        qm:['LIQUIDFREEZERIII','240'] },
  'cool-aio360':    { q:'ARCTIC Liquid Freezer III 360',        qm:['LIQUIDFREEZERIII','360'] }
};
