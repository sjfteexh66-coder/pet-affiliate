/* ===== 견적 엔진 =====
 * 예산·용도를 받아 부품 조합을 만들고, 호환성과 예상 성능을 계산한다.
 * DOM에 의존하지 않으므로 parts-data.js 다음에만 로드하면 어디서든 쓸 수 있다.
 */

/* 용도별 가중치
 * weights : 견적 점수를 계산할 때 각 부품이 차지하는 비중
 * cpuGame : CPU를 평가할 때 게임 성능을 보는 비율 (나머지는 다중작업 성능)
 * gpuMix  : 그래픽카드 평가 비중 (score=연산 성능, vram=VRAM 용량 1GB당 가치)
 * min     : 반드시 충족해야 하는 최소 조건
 * sweet   : 이 용도에서 "충분한" 메모리/저장 용량. 넘어서면 체감이 적어 가치를 낮게 본다
 * share   : 업그레이드 단계에서 한 부품이 쓸 수 있는 예산 상한 (예산 대비 비율)
 */
const PURPOSES = [
  {
    id:'game', label:'게임', icon:'🎮', desc:'FPS · AAA 게임 중심',
    cpuGame:0.85, useRes:true, gpuMix:{ score:1, vram:0 },
    weights:{ cpu:20, gpu:46, ram:8, storage:7, board:7, psu:6, case:3, cooler:3 },
    min:{ ram:16, storage:500, dgpu:true },
    sweet:{ ram:32, storage:2000 },
    share:{ cpu:0.42, gpu:0.75, board:0.20, ram:0.40, storage:0.16, psu:0.13, case:0.10, cooler:0.11 }
  },
  {
    id:'office', label:'사무 · 학업', icon:'💼', desc:'문서 · 웹 · 인터넷 강의',
    cpuGame:0.3, useRes:false, gpuMix:{ score:1, vram:0 },
    weights:{ cpu:30, gpu:3, ram:16, storage:22, board:10, psu:7, case:5, cooler:4 },
    min:{ ram:16, storage:500, dgpu:false },
    sweet:{ ram:32, storage:1000 },
    share:{ cpu:0.45, gpu:0.12, board:0.22, ram:0.45, storage:0.28, psu:0.15, case:0.14, cooler:0.12 }
  },
  {
    id:'creator', label:'영상편집 · 디자인', icon:'🎬', desc:'프리미어 · 포토샵 · 3D',
    cpuGame:0.2, useRes:false, gpuMix:{ score:0.8, vram:1.2 },
    weights:{ cpu:28, gpu:22, ram:18, storage:16, board:7, psu:4, case:2, cooler:3 },
    min:{ ram:32, storage:1000, dgpu:true },
    sweet:{ ram:64, storage:4000 },
    share:{ cpu:0.45, gpu:0.55, board:0.18, ram:0.50, storage:0.26, psu:0.12, case:0.09, cooler:0.12 }
  },
  {
    id:'stream', label:'게임방송 · 스트리밍', icon:'📡', desc:'게임 + 인코딩 동시 처리',
    cpuGame:0.55, useRes:true, gpuMix:{ score:1, vram:0 },
    weights:{ cpu:26, gpu:34, ram:14, storage:9, board:7, psu:5, case:2, cooler:3 },
    min:{ ram:32, storage:1000, dgpu:true },
    sweet:{ ram:32, storage:2000 },
    share:{ cpu:0.42, gpu:0.68, board:0.20, ram:0.45, storage:0.20, psu:0.13, case:0.10, cooler:0.12 }
  },
  {
    id:'ai', label:'AI · 딥러닝', icon:'🤖', desc:'로컬 LLM · 이미지 생성',
    cpuGame:0.15, useRes:false, gpuMix:{ score:0.5, vram:2.5 },
    weights:{ cpu:16, gpu:46, ram:16, storage:12, board:4, psu:3, case:1, cooler:2 },
    min:{ ram:32, storage:1000, dgpu:true, vram:12 },
    sweet:{ ram:96, storage:4000 },
    share:{ cpu:0.18, gpu:0.80, board:0.12, ram:0.45, storage:0.14, psu:0.14, case:0.08, cooler:0.10 }
  }
];

/* 해상도·주사율별 보정
 * cpuMul/gpuMul : 가중치 보정 (고주사율은 CPU, 고해상도는 GPU 비중이 커진다)
 * bnMul         : 병목 판정 기준 보정
 * vram          : 해당 환경에서 권장하는 최소 VRAM(GB)
 */
const RESOLUTIONS = [
  { id:'fhd60',  label:'FHD 60Hz',   sub:'1920×1080 일반', cpuMul:1.00, gpuMul:1.00, bnMul:1.00, vram:6  },
  { id:'fhd144', label:'FHD 144Hz',  sub:'1920×1080 고주사율', cpuMul:1.15, gpuMul:0.95, bnMul:0.90, vram:8  },
  { id:'fhd240', label:'FHD 240Hz',  sub:'경쟁 게임 특화', cpuMul:1.35, gpuMul:0.90, bnMul:0.80, vram:8  },
  { id:'qhd144', label:'QHD 144Hz',  sub:'2560×1440 대중적', cpuMul:1.00, gpuMul:1.10, bnMul:1.15, vram:10 },
  { id:'uhd',    label:'4K UHD',     sub:'3840×2160 고화질', cpuMul:0.75, gpuMul:1.25, bnMul:1.40, vram:12 }
];

/* 단종된 소켓은 CPU 업그레이드 경로가 없어 확장성 감점을 준다.
 * 가격이 충분히 싸면 여전히 채택되지만, 예산이 넉넉할 때 최신 플랫폼에 밀린다.
 */
const LEGACY_SOCKETS = ['AM4', 'LGA1700'];

const Engine = (function () {

  /* ===== 공통 헬퍼 ===== */
  const purposeOf = id => PURPOSES.find(p => p.id === id) || PURPOSES[0];
  const resolutionOf = id => RESOLUTIONS.find(r => r.id === id) || RESOLUTIONS[3];
  const find = (key, id) => PARTS[key].find(p => p.id === id) || null;
  const cheapest = list => list.reduce((a, b) => (!a || b.price < a.price ? b : a), null);
  const rank = (key, part) => key === 'cpu' ? part.gameScore + part.workScore : part.score;

  function totalPrice(build) {
    return CATEGORIES.reduce((sum, c) => sum + (build[c.key] ? build[c.key].price : 0), 0);
  }

  /* 예상 소비전력과 권장 파워 용량 */
  function power(build) {
    const peak = Math.round(build.cpu.tdp * 1.4 + build.gpu.tdp * 1.25 + 80);
    return { peak, recommended: Math.ceil(peak * 1.15 / 50) * 50 };
  }

  /* ===== 호환성 검사 =====
   * level: ok(문제 없음) / warn(동작은 하지만 아쉬움) / error(조립·부팅 불가)
   */
  function compatibility(build, opts) {
    const { cpu, board, ram, gpu, cooler, psu } = build;
    const pcase = build.case;
    const pw = power(build);
    const res = resolutionOf(opts.res);
    const purpose = purposeOf(opts.purpose);
    const list = [];
    const add = (level, title, detail) => list.push({ level, title, detail });

    // CPU ↔ 메인보드 소켓
    cpu.socket === board.socket
      ? add('ok', 'CPU · 메인보드 소켓', `${cpu.socket} 소켓 일치`)
      : add('error', 'CPU · 메인보드 소켓 불일치', `CPU는 ${cpu.socket}, 메인보드는 ${board.socket} 입니다.`);

    // 메모리 규격
    if (!cpu.mem.includes(board.mem)) {
      add('error', '메모리 규격 불일치', `${cpu.name}은(는) ${cpu.mem.join('/')}만 지원합니다.`);
    } else if (ram.type !== board.mem) {
      add('error', '메모리 규격 불일치', `메인보드는 ${board.mem} 전용인데 메모리는 ${ram.type} 입니다.`);
    } else {
      add('ok', '메모리 규격', `${ram.type} · 메인보드 슬롯 ${board.slots}개 중 ${ram.sticks}개 사용`);
    }

    // 화면 출력 (내장그래픽 사용 시)
    if (gpu.needsIgpu && !cpu.igpu) {
      add('error', '화면 출력 불가', `${cpu.name}에는 내장그래픽이 없어 그래픽카드가 반드시 필요합니다.`);
    }

    // 쿨러
    if (cooler.needsBundled && !cpu.bundled) {
      add('error', '번들 쿨러 없음', `${cpu.name}은(는) 쿨러가 포함되지 않은 제품입니다.`);
    } else if (cooler.tdpMax < cpu.tdp) {
      add('warn', '쿨러 성능 부족', `CPU 발열 ${cpu.tdp}W > 쿨러 감당 ${cooler.tdpMax}W. 온도·소음이 올라갑니다.`);
    } else {
      add('ok', '쿨러 성능', `${cooler.type} · ${cooler.tdpMax}W 급 (CPU ${cpu.tdp}W)`);
    }

    // 케이스 ↔ 메인보드 / 그래픽카드 / 쿨러
    pcase.forms.includes(board.form)
      ? add('ok', '케이스 · 메인보드 규격', `${board.form} 장착 가능`)
      : add('error', '케이스 규격 불일치', `${board.form} 메인보드를 지원하지 않는 케이스입니다.`);

    if (!gpu.needsIgpu) {
      gpu.length <= pcase.maxGpu
        ? add('ok', '그래픽카드 길이', `${gpu.length}mm / 케이스 허용 ${pcase.maxGpu}mm`)
        : add('error', '그래픽카드가 케이스에 들어가지 않음', `카드 ${gpu.length}mm > 허용 ${pcase.maxGpu}mm`);
    }

    if (cooler.type === '수랭') {
      cooler.rad <= pcase.rad
        ? add('ok', '수랭 라디에이터', `${cooler.rad}mm / 케이스 지원 ${pcase.rad}mm`)
        : add('error', '라디에이터 장착 불가', `${cooler.rad}mm 라디에이터를 지원하지 않는 케이스입니다.`);
    } else if (cooler.height > 0) {
      cooler.height <= pcase.maxCooler
        ? add('ok', '쿨러 높이', `${cooler.height}mm / 케이스 허용 ${pcase.maxCooler}mm`)
        : add('error', '쿨러 높이 초과', `쿨러 ${cooler.height}mm > 허용 ${pcase.maxCooler}mm`);
    }

    // 파워
    if (psu.watt >= pw.recommended) {
      add('ok', '파워 용량', `${psu.watt}W (예상 최대 ${pw.peak}W · 권장 ${pw.recommended}W)`);
    } else if (psu.watt >= pw.peak) {
      add('warn', '파워 여유 부족', `${psu.watt}W로 동작은 하지만 권장 ${pw.recommended}W 이상을 추천합니다.`);
    } else {
      add('error', '파워 용량 부족', `예상 최대 소비전력 ${pw.peak}W > 파워 ${psu.watt}W`);
    }

    // VRAM (게임·방송 용도에서 해상도 대비)
    if (purpose.useRes && !gpu.needsIgpu && gpu.vram < res.vram) {
      add('warn', 'VRAM 부족 가능', `${res.label} 환경에서는 ${res.vram}GB 이상을 권장합니다 (현재 ${gpu.vram}GB).`);
    }

    // 메모리 용량
    if (ram.capacity < purpose.min.ram) {
      add('warn', '메모리 용량 부족', `${purpose.label} 용도에는 ${purpose.min.ram}GB 이상을 권장합니다.`);
    }
    if (purpose.min.vram && !gpu.needsIgpu && gpu.vram < purpose.min.vram) {
      add('warn', 'VRAM 용량 부족', `${purpose.label} 용도에는 VRAM ${purpose.min.vram}GB 이상을 권장합니다.`);
    }

    return {
      items: list,
      power: pw,
      errors: list.filter(i => i.level === 'error').length,
      warns: list.filter(i => i.level === 'warn').length
    };
  }

  /* 조립 자체가 불가능한 조합인지 (업그레이드 탐색용 빠른 판정) */
  function isValid(build) {
    const { cpu, board, ram, gpu, cooler, psu } = build;
    const pcase = build.case;
    if (!cpu || !board || !ram || !gpu || !cooler || !psu || !pcase) return false;
    if (cpu.socket !== board.socket) return false;
    if (!cpu.mem.includes(board.mem) || ram.type !== board.mem) return false;
    if (gpu.needsIgpu && !cpu.igpu) return false;
    if (cooler.needsBundled && !cpu.bundled) return false;
    if (cooler.tdpMax < cpu.tdp) return false;
    if (!pcase.forms.includes(board.form)) return false;
    if (!gpu.needsIgpu && gpu.length > pcase.maxGpu) return false;
    if (cooler.type === '수랭' ? cooler.rad > pcase.rad : cooler.height > pcase.maxCooler) return false;
    if (psu.watt < power(build).recommended) return false;
    return true;
  }

  /* ===== 점수 계산 ===== */
  function value(key, part, purpose) {
    if (!part) return 0;
    if (key === 'cpu') {
      const base = part.gameScore * purpose.cpuGame + part.workScore * (1 - purpose.cpuGame);
      return LEGACY_SOCKETS.includes(part.socket) ? base * 0.82 : base;
    }
    if (key === 'gpu') return part.score * purpose.gpuMix.score + part.vram * purpose.gpuMix.vram;
    // 용도에 비해 과한 용량은 값어치를 낮게 본다 (게임용 64GB 메모리 등)
    if (key === 'ram') return part.capacity > purpose.sweet.ram ? part.score * 0.6 : part.score;
    if (key === 'storage') return part.capacity > purpose.sweet.storage ? part.score * 0.6 : part.score;
    return part.score;
  }

  function weight(key, purpose, resId) {
    let w = purpose.weights[key] || 0;
    if (purpose.useRes) {
      const r = resolutionOf(resId);
      if (key === 'cpu') w *= r.cpuMul;
      if (key === 'gpu') w *= r.gpuMul;
    }
    return w;
  }

  /* CPU와 그래픽카드의 짝이 맞는지를 예상 프레임으로 직접 잰다.
   * waste  : 그래픽카드는 낼 수 있는데 CPU가 못 따라가 버려지는 프레임의 비율
   * spare  : 반대로 CPU만 남아도는 비율 (그래픽카드에 더 썼어야 하는 구성)
   * 점수 지표를 따로 만들지 않고 실제 프레임 모델을 쓰므로,
   * 화면에 보여주는 병목 안내와 내부 탐색이 같은 기준으로 움직인다.
   */
  function frameBalance(build, resId) {
    let gpuTotal = 0, cpuTotal = 0, wasted = 0;
    GAMES.forEach(g => {
      const gpuFps = g.base[resId] * build.gpu.score / 100;
      const cpuFps = g.cpuCap * build.cpu.gameScore / 100;
      gpuTotal += gpuFps;
      cpuTotal += cpuFps;
      wasted += Math.max(0, gpuFps - cpuFps);
    });
    return {
      waste: gpuTotal ? wasted / gpuTotal : 0,
      spare: cpuTotal ? Math.max(0, cpuTotal - gpuTotal) / cpuTotal : 0
    };
  }

  /* 한쪽에만 예산을 몰아준 구성을 감점해 탐색이 균형을 잡도록 한다 */
  function balancePenalty(build, purpose, opts) {
    if (!purpose.useRes || build.gpu.needsIgpu) return 0;
    return frameBalance(build, opts.res).waste * 5000;
  }

  function rawScore(build, purpose, opts) {
    const sum = CATEGORIES.reduce((acc, c) =>
      acc + weight(c.key, purpose, opts.res) * value(c.key, build[c.key], purpose), 0);
    return sum - balancePenalty(build, purpose, opts);
  }

  /* 화면 표시용 점수: 같은 용도에서 이론상 최고 구성을 100으로 본 상대값 */
  function scoreBuild(build, opts) {
    const purpose = purposeOf(opts.purpose);
    const rows = CATEGORIES.map(c => {
      const w = weight(c.key, purpose, opts.res);
      const max = Math.max(...PARTS[c.key].map(p => value(c.key, p, purpose)));
      const v = value(c.key, build[c.key], purpose);
      return { key:c.key, label:c.label, weight:w, percent: max ? Math.round(v / max * 100) : 0 };
    });
    const raw = rawScore(build, purpose, opts);
    const max = CATEGORIES.reduce((sum, c) =>
      sum + weight(c.key, purpose, opts.res) * Math.max(...PARTS[c.key].map(p => value(c.key, p, purpose))), 0);
    return { percent: Math.round(raw / max * 100), rows: rows.filter(r => r.weight > 0) };
  }

  /* ===== 부품 자동 보정 =====
   * 한 부품을 바꿨을 때 물리적으로 맞지 않게 된 주변 부품만 최소한으로 교체한다.
   * lockedKey : 사용자가 직접 고른 부품 (절대 바꾸지 않음)
   */
  function repair(build, lockedKey) {
    const b = Object.assign({}, build);
    const changes = [];
    const swap = (key, part, reason) => {
      if (!part || part.id === b[key].id) return;
      changes.push({ key, from:b[key], to:part, reason });
      b[key] = part;
    };
    // 현재 부품과 같은 등급 이상에서 가장 싼 것을 고른다
    const pick = (key, list, cur) => {
      if (!list.length) return null;
      const keep = list.filter(p => rank(key, p) >= rank(key, cur));
      return cheapest(keep.length ? keep : list);
    };

    // 소켓 / 메모리 규격
    const boardFits = () => b.board.socket === b.cpu.socket && b.cpu.mem.includes(b.board.mem);
    if (!boardFits()) {
      if (lockedKey === 'board') {
        const list = PARTS.cpu.filter(c => c.socket === b.board.socket && c.mem.includes(b.board.mem));
        swap('cpu', pick('cpu', list, b.cpu), '메인보드 소켓에 맞춤');
      } else {
        const list = PARTS.board.filter(m => m.socket === b.cpu.socket && b.cpu.mem.includes(m.mem));
        swap('board', pick('board', list, b.board), 'CPU 소켓에 맞춤');
      }
    }
    // 메모리
    if (b.ram.type !== b.board.mem && lockedKey !== 'ram') {
      const same = PARTS.ram.filter(r => r.type === b.board.mem);
      const big = same.filter(r => r.capacity >= b.ram.capacity);
      swap('ram', cheapest(big.length ? big : same), `${b.board.mem} 메인보드에 맞춤`);
    }
    // 쿨러
    if (lockedKey !== 'cooler' && ((b.cooler.needsBundled && !b.cpu.bundled) || b.cooler.tdpMax < b.cpu.tdp)) {
      const list = PARTS.cooler.filter(c => !c.needsBundled && c.tdpMax >= b.cpu.tdp);
      swap('cooler', pick('cooler', list, b.cooler), `CPU 발열 ${b.cpu.tdp}W 대응`);
    }
    // 케이스
    const caseFits = c =>
      c.forms.includes(b.board.form) &&
      (b.gpu.needsIgpu || b.gpu.length <= c.maxGpu) &&
      (b.cooler.type === '수랭' ? b.cooler.rad <= c.rad : b.cooler.height <= c.maxCooler);
    if (lockedKey !== 'case' && !caseFits(b.case)) {
      swap('case', pick('case', PARTS.case.filter(caseFits), b.case), '메인보드 · 부품 크기에 맞춤');
    }
    // 파워
    const need = power(b).recommended;
    if (lockedKey !== 'psu' && b.psu.watt < need) {
      const list = PARTS.psu.filter(p => p.watt >= need);
      swap('psu', pick('psu', list, b.psu), `권장 용량 ${need}W 확보`);
    }
    return { build:b, changes };
  }

  /* ===== 견적 자동 생성 ===== */

  /* 주어진 CPU를 기준으로 조건을 만족하는 가장 싼 구성 */
  function baseline(cpu, purpose) {
    const b = { cpu };
    b.board = cheapest(PARTS.board.filter(m => m.socket === cpu.socket && cpu.mem.includes(m.mem)));
    if (!b.board) return null;
    b.ram = cheapest(PARTS.ram.filter(r => r.type === b.board.mem && r.capacity >= purpose.min.ram));
    b.storage = cheapest(PARTS.storage.filter(s => s.capacity >= purpose.min.storage));
    b.gpu = cheapest(PARTS.gpu.filter(g => {
      if (g.needsIgpu) return !purpose.min.dgpu && cpu.igpu;
      return !purpose.min.vram || g.vram >= purpose.min.vram;
    }));
    b.cooler = cpu.bundled && cpu.tdp <= 95
      ? find('cooler', 'cool-stock')
      : cheapest(PARTS.cooler.filter(c => !c.needsBundled && c.tdpMax >= cpu.tdp));
    if (!b.ram || !b.storage || !b.gpu || !b.cooler) return null;
    b.case = cheapest(PARTS.case.filter(c =>
      c.forms.includes(b.board.form) &&
      (b.gpu.needsIgpu || b.gpu.length <= c.maxGpu) &&
      (b.cooler.type === '수랭' ? b.cooler.rad <= c.rad : b.cooler.height <= c.maxCooler)));
    if (!b.case) return null;
    b.psu = cheapest(PARTS.psu.filter(p => p.watt >= power(b).recommended));
    return b.psu && isValid(b) ? b : null;
  }

  /* 남은 예산으로 "1만원당 점수 상승폭"이 가장 큰 업그레이드를 반복 적용 */
  function upgrade(start, purpose, opts) {
    const brandOk = cpu => opts.brand === 'any' || cpu.brand.toLowerCase() === opts.brand;
    let cur = start;
    let curScore = rawScore(cur, purpose, opts);
    let curPrice = totalPrice(cur);

    for (let step = 0; step < 80; step++) {
      let best = null;
      CATEGORIES.forEach(({ key }) => {
        const cap = (purpose.share[key] || 0.2) * opts.budget;
        PARTS[key].forEach(part => {
          if (part.price <= cur[key].price || part.price > cap) return;
          if (key === 'gpu' && part.needsIgpu) return;
          const cand = repair(Object.assign({}, cur, { [key]:part }), key).build;
          if (!isValid(cand) || !brandOk(cand.cpu)) return;
          // 필요 용량의 1.5배를 넘게 파워를 올려도 체감이 없다 (교체 대상일 때만 판단)
          if (key === 'psu' && part.watt > power(cand).recommended * 1.5) return;
          const price = totalPrice(cand);
          if (price > opts.budget || price <= curPrice) return;
          const score = rawScore(cand, purpose, opts);
          if (score <= curScore) return;
          const ratio = (score - curScore) / ((price - curPrice) / 10000);
          if (!best || ratio > best.ratio) best = { ratio, cand, score, price };
        });
      });
      if (!best) break;
      cur = best.cand;
      curScore = best.score;
      curPrice = best.price;
    }
    return cur;
  }

  /* opts = { purpose, budget, res, brand } */
  function recommend(opts) {
    const purpose = purposeOf(opts.purpose);
    const cpus = PARTS.cpu.filter(c => opts.brand === 'any' || c.brand.toLowerCase() === opts.brand);
    const baselines = [];
    cpus.forEach(cpu => {
      const b = baseline(cpu, purpose);
      if (!b) return;
      // 소켓(플랫폼)별로 가장 싼 출발점만 남긴다
      const i = baselines.findIndex(x => x.cpu.socket === cpu.socket);
      if (i < 0) baselines.push(b);
      else if (totalPrice(b) < totalPrice(baselines[i])) baselines[i] = b;
    });
    if (!baselines.length) return null;

    const minBuild = baselines.reduce((a, b) => totalPrice(b) < totalPrice(a) ? b : a);
    const minPrice = totalPrice(minBuild);
    if (opts.budget < minPrice) return { build:minBuild, minPrice, overBudget:true };

    // 예산 안에 들어오는 플랫폼만 업그레이드를 끝까지 돌려보고 점수가 가장 높은 구성을 채택
    const best = baselines
      .filter(b => totalPrice(b) <= opts.budget)
      .map(b => upgrade(b, purpose, opts))
      .reduce((a, b) => rawScore(b, purpose, opts) > rawScore(a, purpose, opts) ? b : a);
    return { build:best, minPrice, overBudget:false };
  }

  /* ===== 예상 성능 ===== */
  function vramFactor(gpu, res) {
    if (gpu.needsIgpu) return 1;
    if (gpu.vram >= res.vram) return 1;
    return gpu.vram >= res.vram - 2 ? 0.9 : 0.75;
  }

  function fpsEstimate(build, resId) {
    const res = resolutionOf(resId);
    const vf = vramFactor(build.gpu, res);
    return GAMES.map(g => {
      const gpuFps = g.base[resId] * build.gpu.score / 100 * vf;
      const cpuFps = g.cpuCap * build.cpu.gameScore / 100;
      return {
        id:g.id, name:g.name, preset:g.preset,
        fps: Math.max(1, Math.round(Math.min(gpuFps, cpuFps))),
        limitedBy: cpuFps < gpuFps ? 'CPU' : 'GPU'
      };
    });
  }

  /* 구성 분석 : 용도에 따라 판단 기준이 다르다 */
  function bottleneck(build, opts) {
    const purpose = purposeOf(opts.purpose);

    if (build.gpu.needsIgpu) {
      return { level:'info', label:'내장 그래픽 구성',
        detail:'문서 · 웹 · 영상 시청에는 충분합니다. 게임을 할 계획이라면 그래픽카드를 추가하세요.' };
    }

    // AI 용도는 VRAM 용량이 구동 가능한 모델 크기를 결정한다
    if (purpose.id === 'ai') {
      const v = build.gpu.vram;
      const detail = v >= 32 ? '32B급 모델까지 4비트 양자화로 여유롭게 구동할 수 있습니다.'
        : v >= 24 ? '32B급 모델을 4비트로 올릴 수 있는 용량입니다.'
        : v >= 16 ? '14B급 모델까지 4비트로 구동하기 좋은 용량입니다.'
        : v >= 12 ? '8B급 모델과 이미지 생성에 적합한 용량입니다.'
        : '3~8B급 소형 모델 위주로 쓰게 됩니다. VRAM을 늘리는 편이 좋습니다.';
      return { level: v >= 16 ? 'ok' : 'warn', label:`VRAM ${v}GB 구성`, detail };
    }

    // 영상편집 · 사무 용도는 게임 프레임이 아니라 작업 성향으로 판단한다
    if (!purpose.useRes) {
      const r = build.gpu.score / (build.cpu.workScore * 1.4);
      if (r > 1.25) return { level:'info', label:'그래픽카드 위주 구성',
        detail:'3D 렌더링 · AI 보정에 유리합니다. 인코딩과 다중 작업이 많다면 CPU를 올리세요.' };
      if (r < 0.75) return { level:'info', label:'CPU 위주 구성',
        detail:'영상 인코딩 · 다중 트랙 편집에 유리합니다. 3D · 이펙트 작업이 많다면 그래픽카드를 올리세요.' };
      return { level:'ok', label:'균형 잡힌 작업용 구성', detail:'CPU와 그래픽카드 성능이 고르게 맞춰져 있습니다.' };
    }

    // 게임 · 방송 용도는 실제 예상 프레임에서 손해 보는 정도로 판정한다
    const res = resolutionOf(opts.res);
    const bal = frameBalance(build, opts.res);
    if (bal.waste > 0.15) return { level:'warn', label:'CPU 병목 가능성',
      detail:`${res.label} 기준으로 그래픽카드 성능의 약 ${Math.round(bal.waste * 100)}%를 CPU가 못 받쳐줍니다. `
        + 'CPU를 한 단계 올리면 체감이 큽니다.' };
    if (bal.spare > 0.45) return { level:'warn', label:'그래픽카드 여유 부족',
      detail:'CPU 성능이 남습니다. 예산을 그래픽카드에 더 쓰면 프레임이 크게 올라갑니다.' };
    return { level:'ok', label:'균형 잡힌 구성',
      detail:`CPU와 그래픽카드의 급이 ${res.label} 환경에 잘 맞습니다.` };
  }

  /* ===== 부품 교체 후보 목록 ===== */
  function candidates(build, key, opts) {
    const purpose = purposeOf(opts.purpose);
    const curPrice = totalPrice(build);
    const curScore = rawScore(build, purpose, opts);

    return PARTS[key].map(part => {
      let blocked = null;
      if (key === 'gpu' && part.needsIgpu && !build.cpu.igpu) blocked = '이 CPU에는 내장그래픽이 없습니다';
      if (key === 'cooler' && part.needsBundled && !build.cpu.bundled) blocked = '이 CPU는 번들 쿨러가 없습니다';
      if (key === 'cooler' && !blocked && part.tdpMax < build.cpu.tdp) blocked = `CPU 발열 ${build.cpu.tdp}W를 감당하지 못합니다`;
      if (key === 'ram' && part.type !== build.board.mem) blocked = `메인보드가 ${build.board.mem} 전용입니다`;
      if (key === 'case') {
        if (!part.forms.includes(build.board.form)) blocked = `${build.board.form} 메인보드를 지원하지 않습니다`;
        else if (!build.gpu.needsIgpu && build.gpu.length > part.maxGpu) blocked = `그래픽카드 ${build.gpu.length}mm가 들어가지 않습니다`;
        else if (build.cooler.type === '수랭' ? build.cooler.rad > part.rad : build.cooler.height > part.maxCooler) blocked = '현재 쿨러를 장착할 수 없습니다';
      }
      if (key === 'psu' && part.watt < power(build).peak) blocked = `예상 최대 소비전력 ${power(build).peak}W 미만입니다`;

      const result = blocked ? null : repair(Object.assign({}, build, { [key]:part }), key);
      return {
        part, blocked,
        current: part.id === build[key].id,
        changes: result ? result.changes : [],
        priceDiff: result ? totalPrice(result.build) - curPrice : 0,
        scoreDiff: result ? rawScore(result.build, purpose, opts) - curScore : 0
      };
    }).sort((a, b) => a.part.price - b.part.price);
  }

  /* ===== 부품 스펙 한 줄 요약 ===== */
  function specText(key, p) {
    switch (key) {
      case 'cpu': return `${p.socket} · ${p.cores}코어 ${p.threads}스레드 · ${p.tdp}W · 내장그래픽 ${p.igpu ? '있음' : '없음'}`;
      case 'gpu': return p.needsIgpu ? 'CPU 내장그래픽으로 화면 출력' : `VRAM ${p.vram}GB · ${p.tdp}W · 길이 ${p.length}mm`;
      case 'board': return `${p.chipset} · ${p.form} · ${p.mem} · M.2 ${p.m2}개${p.wifi ? ' · WiFi' : ''}`;
      case 'ram': return `${p.type} ${p.capacity}GB · ${p.speed}MHz · ${p.sticks}개 구성`;
      case 'storage': return `${p.iface} · ${p.capacity >= 1000 ? p.capacity / 1000 + 'TB' : p.capacity + 'GB'} · 읽기 ${p.seq}MB/s`;
      case 'psu': return `${p.watt}W · 80PLUS ${p.rating} · ${p.modular}`;
      case 'case': return `${p.forms.join('/')} · 그래픽카드 ${p.maxGpu}mm · 쿨러 높이 ${p.maxCooler}mm`;
      case 'cooler': return p.type === '수랭'
        ? `수랭 ${p.rad}mm · ${p.tdpMax}W급`
        : `${p.type} · 높이 ${p.height}mm · ${p.tdpMax}W급`;
      default: return '';
    }
  }

  /* 총액 기준 체급.
   * 2026년 메모리 · 저장장치 가격 상승으로 완성 견적의 하한선 자체가 100만원대로 올라
   * 구간을 그에 맞춰 잡았다. */
  function tierLabel(price) {
    if (price < 1300000) return '엔트리';
    if (price < 1900000) return '보급형';
    if (price < 2800000) return '중급';
    if (price < 4500000) return '고급';
    if (price < 8000000) return '하이엔드';
    return '익스트림';
  }

  return {
    purposeOf, resolutionOf, find, totalPrice, power, compatibility, isValid,
    scoreBuild, rawScore, repair, recommend, baseline, fpsEstimate, bottleneck,
    candidates, specText, tierLabel
  };
})();
