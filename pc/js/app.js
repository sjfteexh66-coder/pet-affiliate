/* ===== 화면 구성 및 조작 =====
 * prices.js → parts-data.js → engine.js → app.js 순서로 로드된다.
 */

const BUDGET_PRESETS = [1200000, 1500000, 2000000, 3000000, 5000000, 8000000, 12000000];
const BRANDS = [
  { id:'any',   label:'상관없음', summary:'제조사 무관' },
  { id:'amd',   label:'AMD',     summary:'AMD' },
  { id:'intel', label:'인텔',    summary:'인텔' }
];
const DEFAULTS = { purpose:'game', budget:2000000, res:'qhd144', brand:'any' };
const STORE_KEY = 'pc-quote-state';

const state = Object.assign({ build:null, minPrice:0, overBudget:false, tweakDir:null }, DEFAULTS);

/* ===== 유틸 ===== */
const el = id => document.getElementById(id);
const num = n => n.toLocaleString('ko-KR');
const won = n => num(n) + '원';
const manwon = n => num(n / 10000) + '만원';
const optsOf = () => ({ purpose:state.purpose, budget:state.budget, res:state.res, brand:state.brand });
const catLabel = key => CATEGORIES.find(c => c.key === key).label;
const capText = gb => gb >= 1000 ? gb / 1000 + 'TB' : gb + 'GB';
const danawa = name => 'https://search.danawa.com/dsearch.php?query=' + encodeURIComponent(name);

/* 금액을 문서 관례대로 한글로 적는다 (1,990,000 → 일백구십구만).
 * 고쳐 쓰기 어렵도록 십 · 백 · 천 앞의 '일'도 생략하지 않는다. */
function hangulAmount(n) {
  const digit = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
  const small = ['', '십', '백', '천'];
  const large = ['', '만', '억', '조'];
  let out = '';
  for (let g = 0; n > 0; g++, n = Math.floor(n / 10000)) {
    let chunk = n % 10000;
    let part = '';
    for (let i = 0; chunk > 0; i++, chunk = Math.floor(chunk / 10)) {
      const d = chunk % 10;
      if (d) part = digit[d] + small[i] + part;
    }
    if (part) out = part + large[g] + out;
  }
  return out || '영';
}

/* 소비자가는 부가세 포함이므로 공급가액과 세액으로 나눈다 */
const supplyOf = total => Math.round(total / 1.1);

/* 같은 구성이면 같은 번호가 나오도록 부품 조합으로 견적번호를 만든다 */
function quoteNumber(build, date) {
  const key = CATEGORIES.map(c => build[c.key].id).join('|');
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) { h ^= key.charCodeAt(i); h = Math.imul(h, 16777619); }
  const code = (h >>> 0).toString(36).toUpperCase().slice(-4).padStart(4, '0');
  const ymd = String(date.getFullYear()).slice(2) +
    String(date.getMonth() + 1).padStart(2, '0') + String(date.getDate()).padStart(2, '0');
  return `PC-${ymd}-${code}`;
}

const docDate = d => `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;

function toast(msg) {
  const t = el('toast');
  t.textContent = msg;
  t.classList.add('on');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove('on'), 2600);
}

/* 클립보드 복사 (file:// 등 보안 컨텍스트가 아닌 환경까지 대응) */
function copyText(text, okMsg) {
  const fallback = () => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    toast(ok ? okMsg : '복사하지 못했습니다. 직접 선택해서 복사해 주세요.');
  };
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => toast(okMsg), fallback);
  } else {
    fallback();
  }
}

/* ===== 견적 의뢰 : 처음 들어온 사람에게 하나씩 묻는다 ===== */
const INTAKE_RES_DESC = {
  fhd60:  '1920×1080 · 사무용 모니터에 흔한 사양',
  fhd144: '1920×1080 · 게이밍 입문',
  fhd240: '1920×1080 · 발로란트 · 배그 같은 경쟁 게임',
  qhd144: '2560×1440 · 요즘 가장 많이 쓰는 게이밍 모니터',
  uhd:    '3840×2160 · 고화질 싱글 게임'
};
const INTAKE_BRAND_DESC = {
  any:   '같은 돈이면 더 빠른 쪽으로',
  amd:   '라이젠 · 게임은 X3D 모델이 강점',
  intel: '코어 · 작업용은 코어 수가 강점'
};

const intake = { step: 0, answered: new Set(), busy: false };
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* 모니터는 게임 · 방송 용도에서만 묻는다 */
function intakeSteps() {
  const useRes = !intake.answered.has('purpose') || Engine.purposeOf(state.purpose).useRes;
  return useRes ? ['purpose', 'budget', 'res', 'brand'] : ['purpose', 'budget', 'brand'];
}

function setMode(mode) {
  const asking = mode === 'intake';
  el('intake').hidden = !asking;
  el('bench').hidden = asking;
  el('annex').hidden = asking;
  document.querySelectorAll('.nav-quote').forEach(a => { a.hidden = asking; });
}

/* 예산 버튼마다 "그 돈이면 어느 급이 들어가는지"를 실제로 계산해 보여준다 */
function budgetPreview(budget) {
  const r = Engine.recommend({
    purpose: state.purpose, budget,
    res: intake.answered.has('res') ? state.res : 'qhd144',
    brand: intake.answered.has('brand') ? state.brand : 'any'
  });
  if (!r || r.overBudget) return null;
  const b = r.build;
  switch (state.purpose) {
    case 'office':  return b.cpu.short + (b.gpu.needsIgpu ? ' · 내장그래픽' : ' · ' + b.gpu.short);
    case 'creator': return `${b.cpu.short} · ${b.gpu.short}`;
    case 'ai':      return `${b.gpu.short} · VRAM ${b.gpu.vram}GB`;
    default:        return `${b.gpu.short}급`;
  }
}

function intakeChoice(value, name, desc, pressed, descClass) {
  return `<button type="button" class="intake-choice" data-value="${value}" aria-pressed="${pressed}">
      <span class="ic-name">${name}</span><span class="ic-desc${descClass ? ' ' + descClass : ''}">${desc}</span>
    </button>`;
}

function renderIntake() {
  const steps = intakeSteps();
  const key = steps[intake.step];
  const purpose = Engine.purposeOf(state.purpose);
  const was = k => intake.answered.has(k);
  const answerText = {
    purpose: purpose.label,
    budget: manwon(state.budget),
    res: Engine.resolutionOf(state.res).label,
    brand: BRANDS.find(b => b.id === state.brand).summary
  };

  intake.busy = false;
  el('intake-count').textContent = `${intake.step + 1} / ${steps.length}`;
  el('intake-progress').innerHTML = steps.map((s, i) =>
    `<li class="${i < intake.step ? 'done' : i === intake.step ? 'now' : ''}"></li>`).join('');
  el('intake-recap').textContent = steps.slice(0, intake.step).map(k => answerText[k]).join(' · ');
  el('intake-back').hidden = intake.step === 0;

  let q, hint, body;
  if (key === 'purpose') {
    q = '어디에 쓰실 PC인가요?';
    hint = '용도에 따라 돈을 더 쓸 부품이 달라집니다.';
    body = `<div class="intake-grid">${PURPOSES.map(p =>
      intakeChoice(p.id, p.label, p.desc, was('purpose') && state.purpose === p.id)).join('')}</div>`;
  } else if (key === 'budget') {
    const min = Engine.recommend({ purpose: state.purpose, budget: 1, res: 'qhd144', brand: 'any' }).minPrice;
    q = '예산은 얼마인가요?';
    hint = `본체만 계산합니다. 모니터 · 키보드 · 마우스는 빼고 생각하세요. ` +
      `${purpose.label}용은 ${manwon(Math.ceil(min / 10000) * 10000)}부터 견적이 나옵니다.`;
    body = `<div class="intake-grid budget">${BUDGET_PRESETS.map(v => {
        const pv = budgetPreview(v);
        return intakeChoice(v, `<span class="num">${num(v / 10000)}</span>만원`,
          pv || '최소 구성보다 적음', was('budget') && state.budget === v, pv ? '' : 'is-short');
      }).join('')}</div>
      <div class="intake-custom">
        <label for="intake-range">직접 정하기</label>
        <input type="range" id="intake-range" min="1000000" max="14000000" step="100000" value="${state.budget}">
        <output id="intake-out" for="intake-range">${manwon(state.budget)}</output>
        <button type="button" class="intake-go" id="intake-go">이 금액으로</button>
      </div>`;
  } else if (key === 'res') {
    q = '어떤 모니터에서 쓰시나요?';
    hint = '해상도와 주사율에 따라 CPU와 그래픽카드에 나눌 돈이 달라집니다. 아직 없다면 QHD 144Hz를 고르세요.';
    body = `<div class="intake-grid">${RESOLUTIONS.map(r =>
      intakeChoice(r.id, r.label, INTAKE_RES_DESC[r.id], was('res') && state.res === r.id)).join('')}</div>`;
  } else {
    q = 'CPU 제조사는 어떻게 할까요?';
    hint = '특별히 원하는 쪽이 없으면 상관없음을 고르세요. 마지막 질문입니다.';
    body = `<div class="intake-grid">${BRANDS.map(b =>
      intakeChoice(b.id, b.label, INTAKE_BRAND_DESC[b.id], was('brand') && state.brand === b.id)).join('')}</div>`;
  }
  el('intake-q').textContent = q;
  el('intake-hint').textContent = hint;
  el('intake-body').innerHTML = body;
  el('intake-body').dataset.step = key;
}

function answerIntake(key, value) {
  if (key === 'budget') state.budget = Number(value);
  else state[key] = value;
  intake.answered.add(key);
  if (intake.step + 1 >= intakeSteps().length) {
    finishIntake();
    return;
  }
  intake.step += 1;
  renderIntake();
  el('intake-q').focus({ preventScroll: true });
}

function finishIntake() {
  setMode('quote');
  syncConditions();
  generate(false);
  window.scrollTo(0, 0);
}

function startIntake() {
  Object.assign(state, DEFAULTS);
  intake.step = 0;
  intake.answered.clear();
  setMode('intake');
  renderIntake();
  window.scrollTo(0, 0);
}

/* ===== 견적 조건 ===== */
function choice(name, id, value, title, desc) {
  return `<label class="choice" for="${id}">
      <input type="radio" name="${name}" id="${id}" value="${value}">
      <span><span class="choice-name">${title}</span><span class="choice-desc">${desc}</span></span>
    </label>`;
}

function renderConditions() {
  el('purpose-opts').innerHTML = PURPOSES.map(p =>
    choice('purpose', 'purpose-' + p.id, p.id, p.label, p.desc)).join('');
  el('res-opts').innerHTML = RESOLUTIONS.map(r =>
    choice('res', 'res-' + r.id, r.id, r.label, r.sub)).join('');
  el('brand-opts').innerHTML = BRANDS.map(b => `
    <label for="brand-${b.id}"><input type="radio" name="brand" id="brand-${b.id}" value="${b.id}"><span>${b.label}</span></label>`).join('');
  el('budget-presets').innerHTML = BUDGET_PRESETS.map(v =>
    `<button type="button" class="preset" data-budget="${v}" aria-pressed="false">${num(v / 10000)}만</button>`).join('');
  syncConditions();
}

function syncConditions() {
  const purpose = Engine.purposeOf(state.purpose);
  el('budget-range').value = state.budget;
  el('budget-text').innerHTML = `<span class="num">${num(state.budget / 10000)}</span>만원`;
  el('budget-tier').textContent = Engine.tierLabel(state.budget) + ' 체급';
  document.querySelectorAll('input[name="purpose"]').forEach(i => { i.checked = i.value === state.purpose; });
  document.querySelectorAll('input[name="res"]').forEach(i => { i.checked = i.value === state.res; });
  document.querySelectorAll('input[name="brand"]').forEach(i => { i.checked = i.value === state.brand; });
  document.querySelectorAll('[data-budget]').forEach(b =>
    b.setAttribute('aria-pressed', Number(b.dataset.budget) === state.budget));
  // 모니터는 게임 · 방송 용도에서만 견적에 영향을 준다
  el('step-res').hidden = !purpose.useRes;
  // 휴대폰에서 접혀 있을 때 보이는 한 줄 요약
  el('cond-summary').textContent = [
    purpose.label, manwon(state.budget),
    purpose.useRes ? Engine.resolutionOf(state.res).label : null,
    BRANDS.find(b => b.id === state.brand).summary
  ].filter(Boolean).join(' · ');
}

/* 견적서가 화면 밖에 있으면 다시 계산됐다는 사실을 알려준다 (주로 휴대폰) */
function sheetOffscreen() {
  const r = el('sheet').getBoundingClientRect();
  return r.top > window.innerHeight - 80 || r.bottom < 80;
}

function generate(notify) {
  const result = Engine.recommend(optsOf());
  if (!result) {
    toast('조건에 맞는 구성을 찾지 못했습니다.');
    return;
  }
  state.build = result.build;
  state.minPrice = result.minPrice;
  state.overBudget = result.overBudget;
  state.tweakDir = null;
  render();
  save();
  if (notify) toast(`견적을 다시 계산했습니다 · 합계 ${won(Engine.totalPrice(state.build))}`);
}

/* ===== 견적서 ===== */
function render() {
  const b = state.build;
  const opts = optsOf();
  const purpose = Engine.purposeOf(state.purpose);
  const res = Engine.resolutionOf(state.res);
  const total = Engine.totalPrice(b);
  const supply = supplyOf(total);
  const comp = Engine.compatibility(b, opts);
  const left = state.budget - total;
  const today = new Date();

  el('quote-no').textContent = quoteNumber(b, today);
  el('quote-date').textContent = docDate(today);
  el('amount-hangul').textContent = `일금 ${hangulAmount(total)}원정`;
  el('amount-num').textContent = `(₩${num(total)})`;

  el('quote-body').innerHTML = CATEGORIES.map((c, i) => {
    const p = b[c.key];
    const qty = p.qty || 1;
    const link = p.price
      ? `<span class="price-ref"> · <a class="price-link" href="${danawa(p.name)}" target="_blank" rel="noopener">다나와 시세</a></span>` : '';
    return `<tr>
      <td class="c-no num">${i + 1}</td>
      <td class="c-cat">${c.label}</td>
      <td class="c-name">
        <div class="part-name">${p.name}${qty > 1 ? `<span class="qty-note"> × ${qty}</span>` : ''}</div>
        <div class="part-spec">${Engine.specText(c.key, p)}${link}</div>
      </td>
      <td class="c-qty num">${qty}</td>
      <td class="c-unit num">${p.price ? num(p.price / qty) : '-'}</td>
      <td class="c-amt num">${p.price ? num(p.price) : '포함'}</td>
      <td class="c-act"><button type="button" class="swap-btn" data-key="${c.key}" aria-label="${c.label} 교체">교체</button></td>
    </tr>`;
  }).join('');
  el('quote-supply').textContent = num(supply);
  el('quote-vat').textContent = num(total - supply);
  el('quote-total').textContent = num(total);

  // 비고
  const notes = [`용도 ${purpose.label}${purpose.useRes ? ` · 모니터 ${res.label}` : ''} · 예산 ${manwon(state.budget)}`];
  if (state.overBudget) {
    notes.push(`예산 ${manwon(state.budget)}으로는 이 용도의 최소 구성이 맞지 않아 가장 싼 구성(${won(state.minPrice)})으로 작성함`);
  } else if (left < 0) {
    notes.push(`부품을 바꾸면서 예산을 ${won(-left)} 넘음`);
  } else {
    notes.push(`남은 예산 ${won(left)}` +
      (left > state.budget * 0.05 ? ' — 다음 등급 부품은 예산을 넘거나 이 용도에 과해서 넣지 않음' : ''));
  }
  notes.push(`최대 소비전력 약 ${comp.power.peak}W — 파워는 ${comp.power.recommended}W 이상 권장`);
  if (comp.errors) notes.push(`<span class="t-err">맞지 않는 부품 ${comp.errors}건 — 별첨 1 참조</span>`);
  notes.push(`가격은 ${PRICE_INFO.note}이며 실제 판매가와 다를 수 있음`);
  notes.push('조립비 · 운영체제 · 배송비 별도');
  el('remarks').innerHTML = notes.map(n => `<li>${n}</li>`).join('');

  renderTweaks(total);
  renderAnnex(comp);
}

/* ===== 더 보태면 · 줄이려면 ===== */
let tweakList = [];

/* 교체로 무엇이 달라지는지 한 줄로 */
function effectText(alt) {
  const purpose = Engine.purposeOf(state.purpose);
  const from = state.build[alt.key];
  const to = alt.part;
  const pct = v => (v > 0 ? '+' : '−') + Math.abs(Math.round(v * 100)) + '%';
  const out = [];

  if (purpose.useRes && (alt.key === 'cpu' || alt.key === 'gpu')) {
    out.push(Math.abs(alt.fps) > 0.01 ? `예상 FPS ${pct(alt.fps)}` : '예상 FPS 그대로');
  }
  if (alt.key === 'cpu') {
    if (from.socket !== to.socket) {
      out.push(`${from.socket} → ${to.socket}${LEGACY_SOCKETS.includes(to.socket) ? '(구형 소켓)' : ''}`);
    }
    if (!purpose.useRes) out.push(`작업 성능 ${pct(to.workScore / from.workScore - 1)}`);
  }
  if (alt.key === 'gpu' && !purpose.useRes) {
    out.push(purpose.id === 'ai' || to.vram !== from.vram
      ? `VRAM ${from.vram}GB → ${to.vram}GB`
      : `그래픽 성능 ${pct(to.score / from.score - 1)}`);
  }
  if (alt.key === 'ram') {
    out.push(from.capacity !== to.capacity
      ? `${from.capacity}GB → ${to.capacity}GB`
      : `${num(from.speed)} → ${num(to.speed)}MHz`);
  }
  if (alt.key === 'storage') {
    out.push(from.capacity !== to.capacity
      ? `${capText(from.capacity)} → ${capText(to.capacity)}`
      : `읽기 ${num(from.seq)} → ${num(to.seq)}MB/s`);
  }
  return out.join(' · ');
}

function renderTweaks(total) {
  // 예산을 넘었으면 줄이는 쪽을 먼저 보여준다
  const dir = state.tweakDir || (total > state.budget ? 'down' : 'up');
  tweakList = Engine.alternatives(state.build, optsOf(), dir, 3);

  el('tab-up').setAttribute('aria-selected', dir === 'up');
  el('tab-down').setAttribute('aria-selected', dir === 'down');
  el('tweak-list').setAttribute('aria-labelledby', 'tab-' + dir);
  el('tweaks-lede').textContent = !tweakList.length
    ? (dir === 'up' ? '이 조건에서 더 올릴 만한 교체가 없습니다.' : '용도의 최소 조건을 지키면서 줄일 곳이 없습니다.')
    : dir === 'up'
      ? '조금 더 쓸 수 있다면, 같은 돈으로 효과가 큰 순서입니다.'
      : '조금 줄여야 한다면, 아끼는 돈에 비해 손해가 적은 순서입니다.';

  el('tweak-list').innerHTML = tweakList.map((a, i) => {
    const also = a.changes.length ? `<small>${a.changes.map(c => catLabel(c.key)).join(' · ')}도 함께</small>` : '';
    return `<li class="tweak">
      <span class="tweak-cost num ${a.priceDiff > 0 ? 'is-up' : 'is-down'}">${a.priceDiff > 0 ? '+' : '−'}${num(Math.abs(a.priceDiff))}</span>
      <span class="tweak-body">
        <span class="tweak-target"><b>${catLabel(a.key)}</b> ${a.part.name}</span>
        <span class="tweak-effect">${effectText(a)}${also}</span>
      </span>
      <button type="button" class="tweak-apply" data-i="${i}">반영</button>
    </li>`;
  }).join('');
}

/* ===== 별첨 ===== */
function renderAnnex(comp) {
  const b = state.build;
  const opts = optsOf();
  const purpose = Engine.purposeOf(state.purpose);
  const res = Engine.resolutionOf(state.res);
  const score = Engine.scoreBuild(b, opts);

  // 별첨 1 — 호환성 검수
  const verdict = { ok:'적합', warn:'주의', error:'불가', info:'참고' };
  el('checks').innerHTML = comp.items.map(i => `<tr>
      <th scope="row">${i.title}</th>
      <td><span class="mark mark-${i.level}">${verdict[i.level]}</span></td>
      <td>${i.detail}</td>
    </tr>`).join('');
  el('checks-sub').textContent = comp.errors || comp.warns
    ? `${comp.items.length}개 항목 중 불가 ${comp.errors}건, 주의 ${comp.warns}건`
    : `${comp.items.length}개 항목 모두 적합 — 그대로 조립할 수 있습니다.`;

  // 별첨 2 — 예상 성능
  const bn = Engine.bottleneck(b, opts);
  el('analysis').innerHTML = `<span class="mark mark-${bn.level}">${bn.label}</span>${bn.detail}`;
  el('perf-sub').textContent =
    `${res.label} 기준${purpose.useRes ? '' : ' (참고)'} · 구성 점수 ${score.percent}점 — 같은 용도 최고 구성을 100점으로 봤을 때`;
  el('fps').innerHTML = Engine.fpsEstimate(b, state.res).map(f => `<tr class="${f.fps < 60 ? 'is-low' : ''}">
      <td>${f.name}</td>
      <td class="muted">${f.preset}</td>
      <td class="c-amt">${f.fps}</td>
      <td class="c-bar"><span class="fbar"><i style="--v:${Math.min(1, f.fps / 240).toFixed(3)}"></i></span></td>
      <td class="muted">${f.limitedBy}</td>
    </tr>`).join('');
}

/* ===== 부품 바꾸기 (교체 창 · 더 보태면 공용) ===== */
function applyPart(key, part) {
  const fixed = Engine.repair(Object.assign({}, state.build, { [key]: part }), key);
  state.build = fixed.build;
  render();
  save();
  toast(`${catLabel(key)}를 바꿨습니다` +
    (fixed.changes.length ? ` · ${fixed.changes.map(c => catLabel(c.key)).join(', ')}도 맞췄습니다` : ''));
}

let swapKey = null;

function openSwap(key) {
  swapKey = key;
  const list = Engine.candidates(state.build, key, optsOf());

  el('dlg-title').textContent = `${catLabel(key)} 교체`;
  el('dlg-desc').textContent = '오른쪽 아래 숫자는 견적 합계가 얼마나 바뀌는지입니다. 맞지 않게 되는 부품은 함께 바꿉니다.';
  el('dlg-body').innerHTML = list.map((c, i) => {
    const qty = c.part.qty || 1;
    const diff = c.blocked ? '' : c.priceDiff === 0 ? '변동 없음'
      : (c.priceDiff > 0 ? '+' : '−') + num(Math.abs(c.priceDiff));
    const diffCls = c.priceDiff > 0 ? 'diff-up' : c.priceDiff < 0 ? 'diff-down' : 'diff-same';
    const note = c.blocked
      ? `<span class="cand-block">${c.blocked}</span>`
      : c.changes.length
        ? `<span class="cand-note">함께 교체: ${c.changes.map(ch => `${catLabel(ch.key)} → ${ch.to.name}`).join(', ')}</span>`
        : '';
    return `<button type="button" class="cand${c.current ? ' current' : ''}" data-index="${i}"${c.blocked ? ' disabled' : ''}>
      <span class="cand-main">
        <span class="cand-name">${c.part.name}${qty > 1 ? ` × ${qty}` : ''}${c.current ? ' <span class="mark mark-info">현재</span>' : ''}</span>
        <span class="cand-spec">${Engine.specText(key, c.part)}</span>
        ${note}
      </span>
      <span class="cand-price">${c.part.price ? num(c.part.price) : '포함'}<span class="cand-diff ${diffCls}">${diff}</span></span>
    </button>`;
  }).join('');

  el('dlg-body').querySelectorAll('.cand').forEach(btn => {
    btn.addEventListener('click', () => {
      const cand = list[Number(btn.dataset.index)];
      el('swap-dialog').close();
      if (!cand.current) applyPart(swapKey, cand.part);
    });
  });
  el('swap-dialog').showModal();
}

/* ===== 견적서 텍스트 (메신저 · 커뮤니티에 붙여넣기 좋은 목록 형식) ===== */
function quoteText() {
  const b = state.build;
  const purpose = Engine.purposeOf(state.purpose);
  const res = Engine.resolutionOf(state.res);
  const total = Engine.totalPrice(b);
  const supply = supplyOf(total);
  const pw = Engine.power(b);
  const today = new Date();

  const items = CATEGORIES.map((c, i) => {
    const p = b[c.key];
    const qty = p.qty || 1;
    return `${i + 1}. ${c.label}  ${p.name}${qty > 1 ? ` × ${qty}` : ''}\n   ${p.price ? won(p.price) : '포함'}`;
  });

  return [
    `견적서 ${quoteNumber(b, today)} (${docDate(today)})`,
    `용도 ${purpose.label}${purpose.useRes ? ' · 모니터 ' + res.label : ''} · 예산 ${manwon(state.budget)}`,
    '',
    ...items,
    '',
    `합계 ${won(total)} (일금 ${hangulAmount(total)}원정)`,
    `공급가액 ${won(supply)} · 부가세 ${won(total - supply)}`,
    '',
    '비고',
    `- 최대 소비전력 약 ${pw.peak}W, 파워 ${pw.recommended}W 이상 권장`,
    `- 가격은 ${PRICE_INFO.note} (참고용)`,
    '- 조립비 · 운영체제 · 배송비 별도'
  ].join('\n');
}

/* ===== 저장 · 공유 ===== */
function snapshot() {
  return {
    p: state.purpose, b: state.budget, r: state.res, m: state.brand,
    ids: CATEGORIES.map(c => state.build[c.key].id)
  };
}

function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(snapshot())); } catch (e) { /* 저장할 수 없는 환경은 무시 */ }
}

function encodeState() {
  return btoa(JSON.stringify(snapshot())).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function restore(data) {
  if (!data || !Array.isArray(data.ids)) return false;
  const build = {};
  const ok = CATEGORIES.every((c, i) => (build[c.key] = Engine.find(c.key, data.ids[i])));
  if (!ok) return false;
  if (PURPOSES.some(p => p.id === data.p)) state.purpose = data.p;
  if (RESOLUTIONS.some(r => r.id === data.r)) state.res = data.r;
  if (BRANDS.some(x => x.id === data.m)) state.brand = data.m;
  if (Number.isFinite(data.b)) state.budget = Math.min(14000000, Math.max(1000000, data.b));
  state.build = build;
  state.minPrice = 0;
  state.overBudget = false;
  return true;
}

function loadInitial() {
  if (location.hash.startsWith('#q=')) {
    try {
      const json = atob(location.hash.slice(3).replace(/-/g, '+').replace(/_/g, '/'));
      if (restore(JSON.parse(json))) return true;
    } catch (e) { /* 잘못된 링크는 무시 */ }
  }
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw && restore(JSON.parse(raw))) return true;
  } catch (e) { /* 저장값이 없거나 손상된 경우 무시 */ }
  return false;
}

/* ===== 이벤트 연결 ===== */
document.addEventListener('DOMContentLoaded', () => {
  el('price-date-note').textContent = PRICE_INFO.note;
  el('faq-price-date').textContent = PRICE_INFO.note;
  el('price-basis-short').textContent = PRICE_INFO.live ? PRICE_INFO.note : `${PRICE_BASE_DATE} 조사 시세`;

  // 저장된 견적이나 공유 링크가 있으면 견적서로, 처음 들어온 사람은 질문부터
  const restored = loadInitial();
  renderConditions();
  if (restored) {
    setMode('quote');
    render();
  } else {
    startIntake();
  }

  // 견적 의뢰 : 고르면 체크 표시를 잠깐 보여주고 다음 질문으로
  el('intake-body').addEventListener('click', e => {
    if (intake.busy) return;
    const btn = e.target.closest('.intake-choice');
    if (btn) {
      intake.busy = true;
      el('intake-body').querySelectorAll('.intake-choice').forEach(b => b.setAttribute('aria-pressed', b === btn));
      const key = el('intake-body').dataset.step;
      setTimeout(() => answerIntake(key, btn.dataset.value), reduceMotion ? 0 : 180);
    } else if (e.target.closest('#intake-go')) {
      intake.busy = true;
      answerIntake('budget', el('intake-range').value);
    }
  });
  el('intake-body').addEventListener('input', e => {
    if (e.target.id !== 'intake-range') return;
    el('intake-out').textContent = manwon(Number(e.target.value));
    el('intake-body').querySelectorAll('.intake-choice').forEach(b => b.setAttribute('aria-pressed', 'false'));
  });
  el('intake-back').addEventListener('click', () => {
    intake.step = Math.max(0, intake.step - 1);
    renderIntake();
    el('intake-q').focus({ preventScroll: true });
  });

  // 조건이 바뀌면 바로 다시 계산
  const regenerate = () => generate(sheetOffscreen());
  const bindRadio = (container, key) => el(container).addEventListener('change', e => {
    state[key] = e.target.value;
    syncConditions();
    regenerate();
  });
  bindRadio('purpose-opts', 'purpose');
  bindRadio('res-opts', 'res');
  bindRadio('brand-opts', 'brand');

  el('budget-presets').addEventListener('click', e => {
    const btn = e.target.closest('[data-budget]');
    if (!btn) return;
    state.budget = Number(btn.dataset.budget);
    syncConditions();
    regenerate();
  });

  let slideTimer = null;
  el('budget-range').addEventListener('input', e => {
    state.budget = Number(e.target.value);
    syncConditions();
    clearTimeout(slideTimer);
    slideTimer = setTimeout(() => generate(false), 120);
  });
  el('budget-range').addEventListener('change', () => {
    clearTimeout(slideTimer);
    regenerate();
  });

  // 휴대폰 : 조건 접기 · 펴기
  el('cond-toggle').addEventListener('click', () => {
    const open = el('conditions').dataset.open !== 'true';
    el('conditions').dataset.open = open;
    el('cond-toggle').setAttribute('aria-expanded', open);
    el('cond-toggle-label').textContent = open ? '접기' : '조건 바꾸기';
  });

  // 부품 교체
  el('quote-body').addEventListener('click', e => {
    const btn = e.target.closest('.swap-btn');
    if (btn) openSwap(btn.dataset.key);
  });
  el('dlg-close').addEventListener('click', () => el('swap-dialog').close());

  // 더 보태면 · 줄이려면
  document.querySelector('.tweak-tabs').addEventListener('click', e => {
    const tab = e.target.closest('[data-dir]');
    if (!tab) return;
    state.tweakDir = tab.dataset.dir;
    renderTweaks(Engine.totalPrice(state.build));
  });
  el('tweak-list').addEventListener('click', e => {
    const btn = e.target.closest('.tweak-apply');
    if (!btn) return;
    const alt = tweakList[Number(btn.dataset.i)];
    applyPart(alt.key, alt.part);
  });

  // 견적서 동작
  el('copy-btn').addEventListener('click', () => copyText(quoteText(), '견적서 텍스트를 복사했습니다'));
  el('share-btn').addEventListener('click', () => {
    const hash = '#q=' + encodeState();
    history.replaceState(null, '', hash);
    copyText(location.origin + location.pathname + hash, '이 견적의 링크를 복사했습니다');
  });
  el('print-btn').addEventListener('click', () => window.print());
  el('reset-btn').addEventListener('click', () => {
    history.replaceState(null, '', location.pathname);
    try { localStorage.removeItem(STORE_KEY); } catch (e) { /* 무시 */ }
    startIntake();
    syncConditions();
  });

  // 휴대폰 메뉴
  const menuBtn = document.querySelector('.menu-btn');
  const nav = el('site-nav');
  menuBtn.addEventListener('click', () => {
    nav.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', nav.classList.contains('open'));
  });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
  }));
});
