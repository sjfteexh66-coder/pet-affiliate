/* ===== PC Parts Database =====
 * price : 원 단위. 2026년 9월 국내 온라인 유통가 기준 "참고용 추정치".
 *         시세가 바뀌면 이 파일의 price 값만 수정하면 견적 전체에 반영된다.
 * score : 같은 카테고리 안에서만 의미가 있는 상대 성능/등급 지수 (0~100+).
 * CPU만 gameScore(게임) / workScore(다중작업) 두 축으로 평가한다.
 */
const PRICE_BASE_DATE = '2026년 9월';   // 자동 수집 전까지 쓰이는 추정 가격의 기준 시점

const PARTS = {

  /* ===== CPU ===== */
  cpu: [
    { id:'cpu-r5-5600',  name:'AMD 라이젠5 5600',        brand:'AMD',   socket:'AM4',     cores:6,  threads:12, tdp:65,  mem:['DDR4'],          igpu:false, bundled:true,  gameScore:58,  workScore:30,  price:105000 },
    { id:'cpu-i5-12400f',name:'인텔 코어i5-12400F',      brand:'Intel', socket:'LGA1700', cores:6,  threads:12, tdp:65,  mem:['DDR4','DDR5'],   igpu:false, bundled:true,  gameScore:62,  workScore:32,  price:135000 },
    { id:'cpu-r5-7500f', name:'AMD 라이젠5 7500F',       brand:'AMD',   socket:'AM5',     cores:6,  threads:12, tdp:65,  mem:['DDR5'],          igpu:false, bundled:true,  gameScore:70,  workScore:36,  price:175000 },
    { id:'cpu-r5-7600',  name:'AMD 라이젠5 7600',        brand:'AMD',   socket:'AM5',     cores:6,  threads:12, tdp:65,  mem:['DDR5'],          igpu:true,  bundled:true,  gameScore:71,  workScore:37,  price:205000 },
    { id:'cpu-i5-14400f',name:'인텔 코어i5-14400F',      brand:'Intel', socket:'LGA1700', cores:10, threads:16, tdp:65,  mem:['DDR4','DDR5'],   igpu:false, bundled:true,  gameScore:70,  workScore:44,  price:210000 },
    { id:'cpu-r5-9600x', name:'AMD 라이젠5 9600X',       brand:'AMD',   socket:'AM5',     cores:6,  threads:12, tdp:65,  mem:['DDR5'],          igpu:true,  bundled:false, gameScore:78,  workScore:43,  price:280000 },
    { id:'cpu-u5-245k',  name:'인텔 코어 울트라5 245K',  brand:'Intel', socket:'LGA1851', cores:14, threads:14, tdp:125, mem:['DDR5'],          igpu:true,  bundled:false, gameScore:80,  workScore:62,  price:330000 },
    { id:'cpu-r7-9700x', name:'AMD 라이젠7 9700X',       brand:'AMD',   socket:'AM5',     cores:8,  threads:16, tdp:65,  mem:['DDR5'],          igpu:true,  bundled:false, gameScore:83,  workScore:55,  price:420000 },
    { id:'cpu-i7-14700f',name:'인텔 코어i7-14700F',      brand:'Intel', socket:'LGA1700', cores:20, threads:28, tdp:219, mem:['DDR4','DDR5'],   igpu:false, bundled:true,  gameScore:82,  workScore:78,  price:430000 },
    { id:'cpu-r7-7800x3d',name:'AMD 라이젠7 7800X3D',    brand:'AMD',   socket:'AM5',     cores:8,  threads:16, tdp:120, mem:['DDR5'],          igpu:true,  bundled:false, gameScore:92,  workScore:52,  price:460000 },
    { id:'cpu-u7-265k',  name:'인텔 코어 울트라7 265K',  brand:'Intel', socket:'LGA1851', cores:20, threads:20, tdp:125, mem:['DDR5'],          igpu:true,  bundled:false, gameScore:86,  workScore:82,  price:480000 },
    { id:'cpu-r9-9900x', name:'AMD 라이젠9 9900X',       brand:'AMD',   socket:'AM5',     cores:12, threads:24, tdp:120, mem:['DDR5'],          igpu:true,  bundled:false, gameScore:85,  workScore:78,  price:590000 },
    { id:'cpu-r7-9800x3d',name:'AMD 라이젠7 9800X3D',    brand:'AMD',   socket:'AM5',     cores:8,  threads:16, tdp:120, mem:['DDR5'],          igpu:true,  bundled:false, gameScore:100, workScore:62,  price:620000 },
    { id:'cpu-u9-285k',  name:'인텔 코어 울트라9 285K',  brand:'Intel', socket:'LGA1851', cores:24, threads:24, tdp:125, mem:['DDR5'],          igpu:true,  bundled:false, gameScore:88,  workScore:95,  price:750000 },
    { id:'cpu-r9-9950x', name:'AMD 라이젠9 9950X',       brand:'AMD',   socket:'AM5',     cores:16, threads:32, tdp:170, mem:['DDR5'],          igpu:true,  bundled:false, gameScore:88,  workScore:100, price:850000 }
  ],

  /* ===== 그래픽카드 : score는 RTX 5070 = 100 기준 상대 지수 ===== */
  gpu: [
    { id:'gpu-igpu',     name:'내장 그래픽 사용 (별도 구매 없음)', brand:'-',     vram:0,  tdp:0,   length:0,   score:8,   price:0,       needsIgpu:true },
    { id:'gpu-b580',     name:'인텔 아크 B580 12GB',       brand:'Intel',  vram:12, tdp:190, length:272, score:52,  price:320000 },
    { id:'gpu-5050',     name:'지포스 RTX 5050 8GB',       brand:'NVIDIA', vram:8,  tdp:130, length:244, score:55,  price:330000 },
    { id:'gpu-5060',     name:'지포스 RTX 5060 8GB',       brand:'NVIDIA', vram:8,  tdp:145, length:245, score:68,  price:430000 },
    { id:'gpu-9060xt8',  name:'라데온 RX 9060 XT 8GB',     brand:'AMD',    vram:8,  tdp:150, length:250, score:72,  price:440000 },
    { id:'gpu-9060xt16', name:'라데온 RX 9060 XT 16GB',    brand:'AMD',    vram:16, tdp:160, length:260, score:74,  price:490000 },
    { id:'gpu-5060ti16', name:'지포스 RTX 5060 Ti 16GB',   brand:'NVIDIA', vram:16, tdp:180, length:250, score:82,  price:620000 },
    { id:'gpu-5070',     name:'지포스 RTX 5070 12GB',      brand:'NVIDIA', vram:12, tdp:250, length:270, score:100, price:830000 },
    { id:'gpu-9070',     name:'라데온 RX 9070 16GB',       brand:'AMD',    vram:16, tdp:220, length:280, score:108, price:880000 },
    { id:'gpu-9070xt',   name:'라데온 RX 9070 XT 16GB',    brand:'AMD',    vram:16, tdp:304, length:290, score:120, price:1030000 },
    { id:'gpu-5070ti',   name:'지포스 RTX 5070 Ti 16GB',   brand:'NVIDIA', vram:16, tdp:300, length:300, score:124, price:1330000 },
    { id:'gpu-5080',     name:'지포스 RTX 5080 16GB',      brand:'NVIDIA', vram:16, tdp:360, length:310, score:148, price:1900000 },
    { id:'gpu-5090',     name:'지포스 RTX 5090 32GB',      brand:'NVIDIA', vram:32, tdp:575, length:340, score:200, price:3600000 }
  ],

  /* ===== 메인보드 ===== */
  board: [
    { id:'mb-a520m',   name:'ASUS PRIME A520M-K',        socket:'AM4',     chipset:'A520', form:'M-ATX', mem:'DDR4', slots:2, m2:1, wifi:false, score:20, price:75000 },
    { id:'mb-h610m',   name:'ASUS PRIME H610M-K D4',     socket:'LGA1700', chipset:'H610', form:'M-ATX', mem:'DDR4', slots:2, m2:1, wifi:false, score:25, price:105000 },
    { id:'mb-b550m',   name:'MSI B550M PRO-VDH WIFI',    socket:'AM4',     chipset:'B550', form:'M-ATX', mem:'DDR4', slots:4, m2:2, wifi:true,  score:35, price:125000 },
    { id:'mb-b650m-hdv',name:'ASRock B650M-HDV/M.2',     socket:'AM5',     chipset:'B650', form:'M-ATX', mem:'DDR5', slots:2, m2:2, wifi:false, score:42, price:135000 },
    { id:'mb-b760m',   name:'MSI B760M 박격포 WIFI DDR5',socket:'LGA1700', chipset:'B760', form:'M-ATX', mem:'DDR5', slots:4, m2:3, wifi:true,  score:55, price:215000 },
    { id:'mb-b650m-mag',name:'MSI B650M 박격포 WIFI',    socket:'AM5',     chipset:'B650', form:'M-ATX', mem:'DDR5', slots:4, m2:2, wifi:true,  score:58, price:225000 },
    { id:'mb-b860m',   name:'ASUS PRIME B860M-A WIFI',   socket:'LGA1851', chipset:'B860', form:'M-ATX', mem:'DDR5', slots:4, m2:2, wifi:true,  score:62, price:255000 },
    { id:'mb-b850',    name:'ASUS TUF GAMING B850-PLUS WIFI', socket:'AM5',chipset:'B850', form:'ATX',   mem:'DDR5', slots:4, m2:3, wifi:true,  score:72, price:295000 },
    { id:'mb-z890',    name:'MSI Z890 토마호크 WIFI',    socket:'LGA1851', chipset:'Z890', form:'ATX',   mem:'DDR5', slots:4, m2:4, wifi:true,  score:88, price:450000 },
    { id:'mb-x870',    name:'ASUS ROG STRIX X870-F',     socket:'AM5',     chipset:'X870', form:'ATX',   mem:'DDR5', slots:4, m2:4, wifi:true,  score:92, price:490000 }
  ],

  /* ===== 메모리 ===== */
  ram: [
    { id:'ram-d4-16',  name:'DDR4 16GB (8GB×2) 3200',        type:'DDR4', capacity:16, sticks:2, speed:3200, score:30,  price:45000 },
    { id:'ram-d4-32',  name:'DDR4 32GB (16GB×2) 3200',       type:'DDR4', capacity:32, sticks:2, speed:3200, score:50,  price:85000 },
    { id:'ram-d5-16',  name:'DDR5 16GB (8GB×2) 5600',        type:'DDR5', capacity:16, sticks:2, speed:5600, score:40,  price:60000 },
    { id:'ram-d5-32',  name:'DDR5 32GB (16GB×2) 5600',       type:'DDR5', capacity:32, sticks:2, speed:5600, score:62,  price:105000 },
    { id:'ram-d5-32-6000',name:'DDR5 32GB (16GB×2) 6000 CL30',type:'DDR5',capacity:32, sticks:2, speed:6000, score:72,  price:130000 },
    { id:'ram-d5-64',  name:'DDR5 64GB (32GB×2) 6000',       type:'DDR5', capacity:64, sticks:2, speed:6000, score:88,  price:260000 },
    { id:'ram-d5-96',  name:'DDR5 96GB (48GB×2) 6000',       type:'DDR5', capacity:96, sticks:2, speed:6000, score:100, price:420000 }
  ],

  /* ===== 저장장치 ===== */
  storage: [
    { id:'ssd-500',    name:'NVMe SSD 500GB (Gen3)',         iface:'M.2 NVMe', capacity:500,  seq:3500, score:30,  price:45000 },
    { id:'ssd-1t',     name:'NVMe SSD 1TB (Gen4)',           iface:'M.2 NVMe', capacity:1000, seq:5000, score:55,  price:85000 },
    { id:'ssd-1t-fast',name:'NVMe SSD 1TB (Gen4 고성능)',    iface:'M.2 NVMe', capacity:1000, seq:7000, score:65,  price:110000 },
    { id:'ssd-2t',     name:'NVMe SSD 2TB (Gen4)',           iface:'M.2 NVMe', capacity:2000, seq:7000, score:80,  price:165000 },
    { id:'ssd-4t',     name:'NVMe SSD 4TB (Gen4)',           iface:'M.2 NVMe', capacity:4000, seq:7000, score:100, price:330000 }
  ],

  /* ===== 파워 ===== */
  psu: [
    { id:'psu-500b',   name:'500W 80PLUS 브론즈',            watt:500,  rating:'브론즈',   modular:'논모듈러',  score:30,  price:55000 },
    { id:'psu-600b',   name:'600W 80PLUS 브론즈',            watt:600,  rating:'브론즈',   modular:'논모듈러',  score:40,  price:70000 },
    { id:'psu-700b',   name:'700W 80PLUS 브론즈 풀모듈러',   watt:700,  rating:'브론즈',   modular:'풀모듈러',  score:55,  price:95000 },
    { id:'psu-750g',   name:'750W 80PLUS 골드 풀모듈러',     watt:750,  rating:'골드',     modular:'풀모듈러',  score:68,  price:125000 },
    { id:'psu-850g',   name:'850W 80PLUS 골드 ATX3.1',       watt:850,  rating:'골드',     modular:'풀모듈러',  score:80,  price:165000 },
    { id:'psu-1000g',  name:'1000W 80PLUS 골드 ATX3.1',      watt:1000, rating:'골드',     modular:'풀모듈러',  score:90,  price:230000 },
    { id:'psu-1200p',  name:'1200W 80PLUS 플래티넘 ATX3.1',  watt:1200, rating:'플래티넘', modular:'풀모듈러',  score:100, price:330000 }
  ],

  /* ===== 케이스 ===== */
  case: [
    { id:'case-mini',  name:'미니타워 M-ATX (기본형)',       forms:['M-ATX'],       maxGpu:330, maxCooler:158, rad:240, score:30,  price:45000 },
    { id:'case-mid',   name:'미들타워 ATX 강화유리',         forms:['ATX','M-ATX'], maxGpu:360, maxCooler:165, rad:240, score:48,  price:65000 },
    { id:'case-mesh',  name:'미들타워 ATX 메쉬 (쿨링형)',    forms:['ATX','M-ATX'], maxGpu:400, maxCooler:175, rad:360, score:72,  price:105000 },
    { id:'case-big',   name:'빅타워 ATX 프리미엄',           forms:['ATX','M-ATX'], maxGpu:430, maxCooler:185, rad:360, score:90,  price:160000 }
  ],

  /* ===== CPU 쿨러 ===== */
  cooler: [
    { id:'cool-stock', name:'CPU 기본(번들) 쿨러',           type:'번들', height:80,  tdpMax:95,  rad:0,   score:15,  price:0, needsBundled:true },
    { id:'cool-slim',  name:'슬림 공랭 (싱글팬)',            type:'공랭', height:130, tdpMax:120, rad:0,   score:30,  price:25000 },
    { id:'cool-tower', name:'타워형 공랭 (듀얼팬)',          type:'공랭', height:158, tdpMax:180, rad:0,   score:55,  price:45000 },
    { id:'cool-tower-p',name:'프리미엄 공랭 (듀얼타워)',     type:'공랭', height:165, tdpMax:250, rad:0,   score:78,  price:90000 },
    { id:'cool-aio240',name:'240mm 수랭 일체형',             type:'수랭', height:0,   tdpMax:250, rad:240, score:80,  price:110000 },
    { id:'cool-aio360',name:'360mm 수랭 일체형',             type:'수랭', height:0,   tdpMax:350, rad:360, score:95,  price:180000 }
  ]
};

/* ===== 카테고리 표시 정보 (견적표 출력 순서) ===== */
const CATEGORIES = [
  { key:'cpu',     label:'CPU',        icon:'🧠' },
  { key:'cooler',  label:'CPU 쿨러',   icon:'❄️' },
  { key:'board',   label:'메인보드',   icon:'🔌' },
  { key:'ram',     label:'메모리',     icon:'📊' },
  { key:'gpu',     label:'그래픽카드', icon:'🎮' },
  { key:'storage', label:'SSD',        icon:'💾' },
  { key:'psu',     label:'파워',       icon:'⚡' },
  { key:'case',    label:'케이스',     icon:'🗄️' }
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
    return { live:false, note:PRICE_BASE_DATE + ' 기준 참고용 추정치' };
  }
  Object.keys(PARTS).forEach(function (key) {
    PARTS[key].forEach(function (part) {
      const price = items[part.id];
      if (typeof price === 'number' && price >= 0) part.price = price;
    });
  });
  return { live:true, note:live.updated + ' 수집된 ' + live.source };
})();
