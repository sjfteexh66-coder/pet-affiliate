/* ===== PC Parts Database =====
 * price : 원 단위. 2026년 9월 국내 유통가 조사값.
 *         CPU · 그래픽카드 · 메모리 · SSD 주요 품목은 가격비교 사이트 최저가를 확인해 넣었고,
 *         메인보드 · 파워 · 케이스 · 쿨러는 등급 기준 추정치다.
 *         2025~2026년 D램 · 낸드 공급 부족으로 메모리와 저장장치 가격이 크게 올라 있으므로
 *         구매 전 실제 시세를 다시 확인할 것.
 *         시세가 바뀌면 이 파일의 price 값만 수정하면 견적 전체에 반영된다.
 * score : 같은 카테고리 안에서만 의미가 있는 상대 성능/등급 지수 (0~100+).
 * CPU만 gameScore(게임) / workScore(다중작업) 두 축으로 평가한다.
 */
const PRICE_BASE_DATE = '2026년 9월';   // 자동 수집 전까지 쓰이는 조사 가격의 기준 시점

const PARTS = {

  /* ===== CPU ===== */
  cpu: [
    { id:'cpu-r5-5600',  name:'AMD 라이젠5-4세대 5600 (버미어) (멀티팩 정품)',        brand:'AMD',   socket:'AM4',     cores:6,  threads:12, tdp:65,  mem:['DDR4'],          igpu:false, bundled:true,  gameScore:58,  workScore:30,  price:115000 },
    { id:'cpu-i5-12400f',name:'인텔 코어i5-12세대 12400F (엘더레이크) (정품)',      brand:'Intel', socket:'LGA1700', cores:6,  threads:12, tdp:65,  mem:['DDR4','DDR5'],   igpu:false, bundled:true,  gameScore:62,  workScore:32,  price:150000 },
    { id:'cpu-r5-7500f', name:'AMD 라이젠5-5세대 7500F (라파엘) (멀티팩 정품)',       brand:'AMD',   socket:'AM5',     cores:6,  threads:12, tdp:65,  mem:['DDR5'],          igpu:false, bundled:true,  gameScore:70,  workScore:36,  price:190000 },
    { id:'cpu-r5-7600',  name:'AMD 라이젠5-5세대 7600 (라파엘) (멀티팩 정품)',        brand:'AMD',   socket:'AM5',     cores:6,  threads:12, tdp:65,  mem:['DDR5'],          igpu:true,  bundled:true,  gameScore:71,  workScore:37,  price:290000 },
    { id:'cpu-i5-14400f',name:'인텔 코어i5-14세대 14400F (랩터레이크 리프레시) (정품)',      brand:'Intel', socket:'LGA1700', cores:10, threads:16, tdp:65,  mem:['DDR4','DDR5'],   igpu:false, bundled:true,  gameScore:70,  workScore:44,  price:230000 },
    { id:'cpu-r5-9600x', name:'AMD 라이젠5-6세대 9600X (그래니트 릿지) (멀티팩 정품)',       brand:'AMD',   socket:'AM5',     cores:6,  threads:12, tdp:65,  mem:['DDR5'],          igpu:true,  bundled:false, gameScore:78,  workScore:43,  price:300000 },
    { id:'cpu-u5-245k',  name:'인텔 코어 울트라5 시리즈2 245K (애로우레이크) (정품)',  brand:'Intel', socket:'LGA1851', cores:14, threads:14, tdp:125, mem:['DDR5'],          igpu:true,  bundled:false, gameScore:80,  workScore:62,  price:330000 },
    { id:'cpu-r7-9700x', name:'AMD 라이젠7-6세대 9700X (그래니트 릿지) (멀티팩 정품)',       brand:'AMD',   socket:'AM5',     cores:8,  threads:16, tdp:65,  mem:['DDR5'],          igpu:true,  bundled:false, gameScore:83,  workScore:55,  price:400000 },
    { id:'cpu-i7-14700f',name:'인텔 코어i7-14세대 14700F (랩터레이크 리프레시) (정품)',      brand:'Intel', socket:'LGA1700', cores:20, threads:28, tdp:219, mem:['DDR4','DDR5'],   igpu:false, bundled:true,  gameScore:82,  workScore:78,  price:420000 },
    { id:'cpu-r7-7800x3d',name:'AMD 라이젠7-5세대 7800X3D (라파엘) (멀티팩 정품)',    brand:'AMD',   socket:'AM5',     cores:8,  threads:16, tdp:120, mem:['DDR5'],          igpu:true,  bundled:false, gameScore:92,  workScore:52,  price:440000 },
    { id:'cpu-u7-265k',  name:'인텔 코어 울트라7 시리즈2 265K (애로우레이크) (정품)',  brand:'Intel', socket:'LGA1851', cores:20, threads:20, tdp:125, mem:['DDR5'],          igpu:true,  bundled:false, gameScore:86,  workScore:82,  price:470000 },
    { id:'cpu-r9-9900x', name:'AMD 라이젠9-6세대 9900X (그래니트 릿지) (멀티팩 정품)',       brand:'AMD',   socket:'AM5',     cores:12, threads:24, tdp:120, mem:['DDR5'],          igpu:true,  bundled:false, gameScore:85,  workScore:78,  price:570000 },
    { id:'cpu-r7-9800x3d',name:'AMD 라이젠7-6세대 9800X3D (그래니트 릿지) (멀티팩 정품)',    brand:'AMD',   socket:'AM5',     cores:8,  threads:16, tdp:120, mem:['DDR5'],          igpu:true,  bundled:false, gameScore:100, workScore:62,  price:720000 },
    { id:'cpu-u9-285k',  name:'인텔 코어 울트라9 시리즈2 285K (애로우레이크) (정품)',  brand:'Intel', socket:'LGA1851', cores:24, threads:24, tdp:125, mem:['DDR5'],          igpu:true,  bundled:false, gameScore:88,  workScore:95,  price:700000 },
    { id:'cpu-r9-9950x', name:'AMD 라이젠9-6세대 9950X (그래니트 릿지) (멀티팩 정품)',       brand:'AMD',   socket:'AM5',     cores:16, threads:32, tdp:170, mem:['DDR5'],          igpu:true,  bundled:false, gameScore:88,  workScore:100, price:830000 }
  ],

  /* ===== 그래픽카드 : score는 RTX 5070 = 100 기준 상대 지수 ===== */
  gpu: [
    { id:'gpu-igpu',     name:'CPU 내장그래픽 사용', brand:'-',     vram:0,  tdp:0,   length:0,   score:8,   price:0,       needsIgpu:true },
    { id:'gpu-b580',     name:'ASRock 인텔 아크 B580 Challenger OC D6 12GB',       brand:'Intel',  vram:12, tdp:190, length:270, score:52,  price:400000},
    { id:'gpu-5050',     name:'GIGABYTE 지포스 RTX 5050 WINDFORCE OC D6 8GB',       brand:'NVIDIA', vram:8,  tdp:130, length:211, score:55,  price:440000},
    { id:'gpu-5060',     name:'ASUS DUAL 지포스 RTX 5060 OC D7 8GB',       brand:'NVIDIA', vram:8,  tdp:145, length:229, score:68,  price:460000},
    { id:'gpu-9060xt8',  name:'ASUS DUAL 라데온 RX 9060 XT OC D6 8GB',     brand:'AMD',    vram:8,  tdp:150, length:232, score:72,  price:520000},
    { id:'gpu-9060xt16', name:'ASUS DUAL 라데온 RX 9060 XT D6 16GB',    brand:'AMD',    vram:16, tdp:160, length:232, score:74,  price:600000},
    { id:'gpu-5060ti16', name:'MSI 지포스 RTX 5060 Ti 게이밍 OC D7 16GB 트윈프로져',   brand:'NVIDIA', vram:16, tdp:180, length:247, score:82,  price:740000},
    { id:'gpu-5070',     name:'MSI 지포스 RTX 5070 벤투스 2X OC D7 12GB',      brand:'NVIDIA', vram:12, tdp:250, length:242, score:100, price:950000},
    { id:'gpu-9070',     name:'PowerColor 라데온 RX 9070 Reaper D6 16GB',       brand:'AMD',    vram:16, tdp:220, length:304, score:108, price:1030000},
    { id:'gpu-9070xt',   name:'SAPPHIRE 라데온 RX 9070 XT PULSE D6 16GB',    brand:'AMD',    vram:16, tdp:304, length:310, score:120, price:1120000},
    { id:'gpu-5070ti',   name:'MSI 지포스 RTX 5070 Ti 쉐도우 3X OC D7 16GB',   brand:'NVIDIA', vram:16, tdp:300, length:303, score:124, price:1230000},
    { id:'gpu-5080',     name:'갤럭시 GALAX 지포스 RTX 5080 BLACK OC D7 16GB',      brand:'NVIDIA', vram:16, tdp:360, length:322, score:148, price:2280000},
    { id:'gpu-5090',     name:'조텍 GAMING 지포스 RTX 5090 SOLID OC D7 32GB',      brand:'NVIDIA', vram:32, tdp:575, length:332, score:200, price:8300000}
  ],

  /* ===== 메인보드 ===== */
  board: [
    { id:'mb-a520m',   name:'ASUS PRIME A520M-K',        socket:'AM4',     chipset:'A520', form:'M-ATX', mem:'DDR4', slots:2, m2:1, wifi:false, score:20, price:85000 },
    { id:'mb-h610m',   name:'ASUS PRIME H610M-K D4',     socket:'LGA1700', chipset:'H610', form:'M-ATX', mem:'DDR4', slots:2, m2:1, wifi:false, score:25, price:115000 },
    { id:'mb-b550m',   name:'MSI B550M PRO-VDH WIFI',    socket:'AM4',     chipset:'B550', form:'M-ATX', mem:'DDR4', slots:4, m2:2, wifi:true,  score:35, price:135000 },
    { id:'mb-b650m-hdv',name:'ASRock B650M-HDV/M.2',     socket:'AM5',     chipset:'B650', form:'M-ATX', mem:'DDR5', slots:2, m2:2, wifi:false, score:42, price:150000 },
    { id:'mb-b760m',   name:'MSI B760M 박격포 WIFI DDR5',socket:'LGA1700', chipset:'B760', form:'M-ATX', mem:'DDR5', slots:4, m2:3, wifi:true,  score:55, price:230000 },
    { id:'mb-b650m-mag',name:'MSI B650M 박격포 WIFI',    socket:'AM5',     chipset:'B650', form:'M-ATX', mem:'DDR5', slots:4, m2:2, wifi:true,  score:58, price:240000 },
    { id:'mb-b860m',   name:'ASUS PRIME B860M-A WIFI',   socket:'LGA1851', chipset:'B860', form:'M-ATX', mem:'DDR5', slots:4, m2:2, wifi:true,  score:62, price:270000 },
    { id:'mb-b850',    name:'ASUS TUF GAMING B850-PLUS WIFI', socket:'AM5',chipset:'B850', form:'ATX',   mem:'DDR5', slots:4, m2:3, wifi:true,  score:72, price:310000 },
    { id:'mb-z890',    name:'MSI Z890 토마호크 WIFI',    socket:'LGA1851', chipset:'Z890', form:'ATX',   mem:'DDR5', slots:4, m2:4, wifi:true,  score:88, price:470000 },
    { id:'mb-x870',    name:'ASUS ROG STRIX X870-F',     socket:'AM5',     chipset:'X870', form:'ATX',   mem:'DDR5', slots:4, m2:4, wifi:true,  score:92, price:510000 }
  ],

  /* ===== 메모리 : qty 는 견적서 수량 (단품 2개 = 2, 2개들이 패키지 = 1), price 는 그 줄의 합계 ===== */
  ram: [
    { id:'ram-d4-16',  name:'삼성전자 DDR4-3200 (8GB)', qty:2,        type:'DDR4', capacity:16, sticks:2, speed:3200, score:30,  price:200000 },
    { id:'ram-d4-32',  name:'삼성전자 DDR4-3200 (16GB)', qty:2,       type:'DDR4', capacity:32, sticks:2, speed:3200, score:50,  price:360000 },
    { id:'ram-d5-16',  name:'삼성전자 DDR5-5600 (8GB)', qty:2,        type:'DDR5', capacity:16, sticks:2, speed:5600, score:40,  price:380000 },
    { id:'ram-d5-32',  name:'삼성전자 DDR5-5600 (16GB)', qty:2,       type:'DDR5', capacity:32, sticks:2, speed:5600, score:62,  price:720000 },
    { id:'ram-d5-32-6000',name:'G.SKILL DDR5-6000 CL30 TRIDENT Z5 NEO RGB (32GB(16Gx2))', qty:1,type:'DDR5',capacity:32, sticks:2, speed:6000, score:72,  price:790000 },
    { id:'ram-d5-64',  name:'삼성전자 DDR5-5600 (32GB)', qty:2,       type:'DDR5', capacity:64, sticks:2, speed:5600, score:88,  price:1540000 },
    { id:'ram-d5-96',  name:'마이크론 Crucial DDR5-5600 CL46 (48GB)', qty:2,       type:'DDR5', capacity:96, sticks:2, speed:5600, score:100, price:2300000 }
  ],

  /* ===== 저장장치 ===== */
  storage: [
    { id:'ssd-500',    name:'SK하이닉스 Gold P31 M.2 NVMe (500GB)',         iface:'M.2 NVMe Gen3', capacity:500,  seq:3500, score:30,  price:120000 },
    { id:'ssd-1t',     name:'WD Blue SN5000 M.2 NVMe (1TB)',           iface:'M.2 NVMe Gen4', capacity:1000, seq:5150, score:55,  price:220000 },
    { id:'ssd-1t-fast',name:'WD BLACK SN850X M.2 NVMe (1TB)',    iface:'M.2 NVMe Gen4', capacity:1000, seq:7300, score:65,  price:270000 },
    { id:'ssd-2t',     name:'삼성전자 990 EVO Plus M.2 NVMe (2TB)',           iface:'M.2 NVMe Gen4', capacity:2000, seq:7250, score:80,  price:470000 },
    { id:'ssd-4t',     name:'삼성전자 990 EVO Plus M.2 NVMe (4TB)',           iface:'M.2 NVMe Gen4', capacity:4000, seq:7250, score:100, price:950000 }
  ],

  /* ===== 파워 ===== */
  psu: [
    { id:'psu-500b',   name:'마이크로닉스 Classic II 풀체인지 500W 80PLUS브론즈 230V EU',            watt:500,  rating:'브론즈',   modular:'논모듈러',  score:30,  price:60000},
    { id:'psu-600b',   name:'마이크로닉스 Classic II 풀체인지 600W 80PLUS브론즈 230V EU',            watt:600,  rating:'브론즈',   modular:'논모듈러',  score:40,  price:78000},
    { id:'psu-700b',   name:'마이크로닉스 Classic II 풀체인지 700W 80PLUS브론즈 230V EU',   watt:700,  rating:'브론즈',   modular:'논모듈러',  score:50,  price:92000},
    { id:'psu-750g',   name:'마이크로닉스 ASTRO GD 750W 80PLUS골드 풀모듈러',     watt:750,  rating:'골드',     modular:'풀모듈러',  score:68,  price:135000},
    { id:'psu-850g',   name:'마이크로닉스 ASTRO GD 850W 80PLUS골드 풀모듈러 ATX3.1',       watt:850,  rating:'골드',     modular:'풀모듈러',  score:80,  price:180000},
    { id:'psu-1000g',  name:'시소닉 FOCUS GX-1000 ATX3.1 80PLUS골드 풀모듈러',      watt:1000, rating:'골드',     modular:'풀모듈러',  score:90,  price:250000},
    { id:'psu-1200p',  name:'시소닉 PRIME PX-1200 ATX3.1 80PLUS플래티넘 풀모듈러',  watt:1200, rating:'플래티넘', modular:'풀모듈러',  score:100, price:420000}
  ],

  /* ===== 케이스 ===== */
  case: [
    { id:'case-mini',  name:'darkFlash DLM21 MESH 미니타워',       forms:['M-ATX'],       maxGpu:320, maxCooler:160, rad:240, score:30,  price:50000},
    { id:'case-mid',   name:'darkFlash DLX21 RGB MESH 강화유리 미들타워',         forms:['ATX','M-ATX'], maxGpu:400, maxCooler:165, rad:360, score:48,  price:70000},
    { id:'case-mesh',  name:'리안리 LANCOOL 216 RGB 미들타워',    forms:['ATX','M-ATX'], maxGpu:392, maxCooler:180, rad:360, score:72,  price:125000},
    { id:'case-big',   name:'리안리 O11 DYNAMIC EVO XL 빅타워',           forms:['ATX','M-ATX'], maxGpu:460, maxCooler:167, rad:360, score:90,  price:290000}
  ],

  /* ===== CPU 쿨러 ===== */
  cooler: [
    { id:'cool-stock', name:'CPU 동봉 기본 쿨러',           type:'번들', height:80,  tdpMax:95,  rad:0,   score:15,  price:0, needsBundled:true },
    { id:'cool-slim',  name:'DEEPCOOL AG400',            type:'공랭', height:150, tdpMax:150, rad:0,   score:30,  price:28000},
    { id:'cool-tower', name:'써멀라이트 Peerless Assassin 120 SE',          type:'공랭', height:155, tdpMax:230, rad:0,   score:55,  price:50000},
    { id:'cool-tower-p',name:'DEEPCOOL AK620 DIGITAL',     type:'공랭', height:162, tdpMax:260, rad:0,   score:78,  price:95000},
    { id:'cool-aio240',name:'ARCTIC Liquid Freezer III 240',             type:'수랭', height:0,   tdpMax:250, rad:240, score:80,  price:120000},
    { id:'cool-aio360',name:'ARCTIC Liquid Freezer III 360',             type:'수랭', height:0,   tdpMax:350, rad:360, score:95,  price:170000}
  ]
};

/* ===== 카테고리 표시 정보 (견적표 출력 순서) ===== */
const CATEGORIES = [
  { key:'cpu',     label:'CPU' },
  { key:'cooler',  label:'CPU 쿨러' },
  { key:'board',   label:'메인보드' },
  { key:'ram',     label:'메모리' },
  { key:'gpu',     label:'그래픽카드' },
  { key:'storage', label:'SSD' },
  { key:'psu',     label:'파워' },
  { key:'case',    label:'케이스' }
];

/* ===== 예상 FPS 산출용 게임 목록 =====
 * base   : GPU 지수 100(RTX 5070) 기준 해상도별 평균 FPS 추정값
 * cpuCap : gameScore 100(라이젠7 9800X3D) 기준 CPU가 감당하는 FPS 상한
 */
const GAMES = [
  { id:'lol',    name:'리그 오브 레전드', preset:'매우 높음', base:{ fhd60:480, fhd144:480, fhd240:480, qhd144:430, uhd:350 }, cpuCap:700 },
  { id:'val',    name:'발로란트',         preset:'경쟁 설정', base:{ fhd60:620, fhd144:620, fhd240:620, qhd144:500, uhd:350 }, cpuCap:800 },
  { id:'pubg',   name:'배틀그라운드',     preset:'울트라',    base:{ fhd60:230, fhd144:230, fhd240:230, qhd144:190, uhd:120 }, cpuCap:300 },
  { id:'loa',    name:'로스트아크',       preset:'상',        base:{ fhd60:200, fhd144:200, fhd240:200, qhd144:170, uhd:120 }, cpuCap:240 },
  { id:'cp2077', name:'사이버펑크 2077',  preset:'울트라(RT 끔)', base:{ fhd60:135, fhd144:135, fhd240:135, qhd144:95, uhd:50 }, cpuCap:190 },
  { id:'wukong', name:'검은 신화: 오공',  preset:'높음',      base:{ fhd60:110, fhd144:110, fhd240:110, qhd144:80, uhd:45 }, cpuCap:170 }
];

/* ===== 자동 수집된 가격 적용 =====
 * prices.js 를 parts-data.js 보다 먼저 로드하면, 수집된 가격이 위의 추정 가격을 덮어쓴다.
 * 수집 결과가 없으면(파일이 없거나 items 가 비어 있으면) 추정 가격을 그대로 쓴다.
 */
const PRICE_INFO = (function () {
  const live = typeof PRICE_OVERRIDES !== 'undefined' ? PRICE_OVERRIDES : null;
  const items = (live && live.items) || {};
  if (!Object.keys(items).length) {
    return { live:false, note:PRICE_BASE_DATE + ' 조사 기준 참고 시세' };
  }
  Object.keys(PARTS).forEach(function (key) {
    PARTS[key].forEach(function (part) {
      const price = items[part.id];
      if (typeof price === 'number' && price >= 0) part.price = price;
    });
  });
  return { live:true, note:live.updated + ' 수집된 ' + live.source };
})();
