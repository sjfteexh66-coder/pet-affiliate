/* ===== 화면 구성 및 조작 =====
 * parts-data.js → engine.js → app.js 순서로 로드된다.
 */

const BUDGET_PRESETS = [600000, 800000, 1000000, 1500000, 2000000, 3000000, 4000000];
const BRANDS = [
  { id:'any',   label:'상관없음', sub:'가성비 우선' },
  { id:'amd',   label:'AMD',     sub:'라이젠' },
  { id:'intel', label:'인텔',    sub:'코어' }
];
const STORE_KEY = 'pc-quote-state';

const state = {
  purpose: 'game',
  budget: 1500000,
  res: 'qhd144',
  brand: 'any',
  build: null,
  minPrice: 0,
  overBudget: false
};

/* ===== 유틸 ===== */
const el = id => document.getElementById(id);
const won = n => n.toLocaleString('ko-KR') + '원';
const manwon = n => (n % 10000 === 0 ? n / 10000 : (n / 10000).toFixed(1)) + '만원';

function toast(msg) {
  const t = el('toast');
  t.textContent = msg;
  t.classList.add('on');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove('on'), 2800);
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
    toast(ok ? okMsg : '복사에 실패했습니다. 직접 선택해 복사해 주세요.');
  };
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => toast(okMsg), fallback);
  } else {
    fallback();
  }
}

/* ===== 조건 선택 UI ===== */
function renderWizard() {
  el('purpose-opts').innerHTML = PURPOSES.map(p => `
    <button type="button" class="opt-card" data-purpose="${p.id}" aria-pressed="${state.purpose === p.id}">
      <span class="ico">${p.icon}</span>
      <strong>${p.label}</strong>
      <small>${p.desc}</small>
    </button>`).join('');

  el('budget-presets').innerHTML = BUDGET_PRESETS.map(v => `
    <button type="button" class="chip" data-budget="${v}" aria-pressed="${state.budget === v}">
      ${manwon(v)}
    </button>`).join('');

  el('res-opts').innerHTML = RESOLUTIONS.map(r => `
    <button type="button" class="chip" data-res="${r.id}" aria-pressed="${state.res === r.id}">
      <b>${r.label}</b><small>${r.sub}</small>
    </button>`).join('');

  el('brand-opts').innerHTML = BRANDS.map(b => `
    <button type="button" class="chip" data-brand="${b.id}" aria-pressed="${state.brand === b.id}">
      <b>${b.label}</b><small>${b.sub}</small>
    </button>`).join('');

  syncWizard();
}

function syncWizard() {
  el('budget-range').value = state.budget;
  el('budget-text').textContent = manwon(state.budget);
  el('budget-sub').textContent = `· ${Engine.tierLabel(state.budget)} 체급`;
  document.querySelectorAll('[data-purpose]').forEach(b =>
    b.setAttribute('aria-pressed', b.dataset.purpose === state.purpose));
  document.querySelectorAll('[data-budget]').forEach(b =>
    b.setAttribute('aria-pressed', Number(b.dataset.budget) === state.budget));
  document.querySelectorAll('[data-res]').forEach(b =>
    b.setAttribute('aria-pressed', b.dataset.res === state.res));
  document.querySelectorAll('[data-brand]').forEach(b =>
    b.setAttribute('aria-pressed', b.dataset.brand === state.brand));
  // 해상도는 게임 · 방송 용도에서만 의미가 있다
  el('step-res').hidden = !Engine.purposeOf(state.purpose).useRes;
}

/* ===== 견적 생성 ===== */
function generate() {
  const result = Engine.recommend({
    purpose: state.purpose, budget: state.budget, res: state.res, brand: state.brand
  });
  if (!result) {
    toast('조건을 만족하는 구성을 찾지 못했습니다.');
    return;
  }
  state.build = result.build;
  state.minPrice = result.minPrice;
  state.overBudget = result.overBudget;
  renderResult();
  save();
  el('result').scrollIntoView({ behavior:'smooth', block:'start' });
}

/* ===== 결과 렌더링 ===== */
function renderResult() {
  const b = state.build;
  const opts = { purpose:state.purpose, budget:state.budget, res:state.res, brand:state.brand };
  const purpose = Engine.purposeOf(state.purpose);
  const total = Engine.totalPrice(b);
  const comp = Engine.compatibility(b, opts);
  const score = Engine.scoreBuild(b, opts);
  const left = state.budget - total;

  el('result').classList.add('on');
  el('result-sub').textContent =
    `${purpose.label}${purpose.useRes ? ' · ' + Engine.resolutionOf(state.res).label : ''}` +
    ` · 예산 ${manwon(state.budget)} → ${Engine.tierLabel(total)} 체급`;

  // 요약
  el('summary').innerHTML = `
    <div class="stat"><dt>총 견적가</dt><dd class="total num">${won(total)}</dd></div>
    <div class="stat"><dt>${left >= 0 ? '남은 예산' : '예산 초과'}</dt>
      <dd class="num">${won(Math.abs(left))}</dd></div>
    <div class="stat"><dt>구성 점수</dt><dd class="num">${score.percent}<small>/ 100</small></dd></div>
    <div class="stat"><dt>예상 최대 소비전력</dt>
      <dd class="num">${comp.power.peak}<small>W · 권장 ${comp.power.recommended}W</small></dd></div>`;

  // 안내 문구
  const notices = [];
  if (state.overBudget) {
    notices.push(['warn', `예산 ${manwon(state.budget)}으로는 <strong>${purpose.label}</strong> 용도의 최소 구성을
      맞출 수 없습니다. 아래는 최소 요구 조건을 만족하는 가장 저렴한 구성(${won(state.minPrice)})입니다.`]);
  } else if (left < 0) {
    notices.push(['warn', `부품을 바꾸면서 예산을 <strong>${won(-left)}</strong> 초과했습니다.`]);
  } else if (left > state.budget * 0.05) {
    notices.push(['info', `남은 예산 <strong>${won(left)}</strong> — 다음 등급 부품이 예산을 넘거나,
      이 용도에 과한 부품(게임용 64GB 메모리 등)이라 제외했습니다. 예산을 조금 올려 다시 계산해 보세요.`]);
  }
  if (comp.errors > 0) {
    notices.push(['warn', `호환되지 않는 조합이 <strong>${comp.errors}건</strong> 있습니다. 아래 호환성 검사를 확인하세요.`]);
  }
  el('notices').innerHTML = notices.map(([lv, msg]) =>
    `<div class="notice notice-${lv}"><span>${lv === 'warn' ? '⚠️' : '💡'}</span><div>${msg}</div></div>`).join('');

  // 견적표
  el('quote-body').innerHTML = CATEGORIES.map(c => {
    const p = b[c.key];
    return `<tr>
      <td class="cat-cell"><i>${c.icon}</i>${c.label}</td>
      <td>
        <div class="part-name">${p.name}</div>
        <div class="part-spec">${Engine.specText(c.key, p)}</div>
      </td>
      <td class="right price-cell num">${p.price ? won(p.price) : '별도 구매 없음'}</td>
      <td class="right"><button class="btn-sm swap-btn" data-key="${c.key}">변경</button></td>
    </tr>`;
  }).join('');
  el('quote-total').textContent = won(total);

  // 호환성
  const marks = { ok:'✓', warn:'⚠', error:'✕', info:'•' };
  el('checks').innerHTML = comp.items.map(i => `
    <div class="check ${i.level}">
      <span class="mark">${marks[i.level]}</span>
      <div><strong>${i.title}</strong><span>${i.detail}</span></div>
    </div>`).join('');
  el('checks-sub').textContent = comp.errors
    ? `조립 불가 ${comp.errors}건, 확인 필요 ${comp.warns}건이 발견되었습니다.`
    : comp.warns
      ? `조립에 문제는 없지만 확인이 필요한 항목이 ${comp.warns}건 있습니다.`
      : '소켓 · 규격 · 전력 · 크기 모두 문제없이 조립됩니다.';

  // 구성 분석
  const bn = Engine.bottleneck(b, opts);
  el('analysis').innerHTML = `
    <div class="notice notice-${bn.level === 'warn' ? 'warn' : 'info'}">
      <span>${bn.level === 'warn' ? '⚠️' : bn.level === 'ok' ? '✅' : '💡'}</span>
      <div><strong>${bn.label}</strong> — ${bn.detail}</div>
    </div>`;

  // 부품별 점수
  el('meters').innerHTML = score.rows
    .slice()
    .sort((x, y) => y.weight - x.weight)
    .map(r => `
      <div class="meter">
        <div class="meter-top"><span>${r.label}</span><b>${r.percent}</b></div>
        <div class="bar"><i style="width:${r.percent}%"></i></div>
      </div>`).join('');

  // 예상 프레임
  el('fps-head').textContent = purpose.useRes
    ? `${Engine.resolutionOf(state.res).label} 예상 프레임`
    : '게임별 예상 프레임 (참고)';
  el('fps').innerHTML = Engine.fpsEstimate(b, state.res).map(f => {
    const cls = f.fps >= 144 ? 'fps-good' : f.fps >= 100 ? 'fps-mid' : f.fps >= 60 ? 'fps-low' : 'fps-bad';
    return `<div class="fps-row ${cls}">
      <div>
        <div class="fps-name">${f.name}<small>${f.preset} · ${f.limitedBy} 제한</small></div>
        <div class="fps-bar"><i style="width:${Math.min(100, f.fps / 200 * 100)}%"></i></div>
      </div>
      <div class="fps-num">${f.fps}</div>
    </div>`;
  }).join('');
}

/* ===== 부품 교체 ===== */
let swapKey = null;

function openSwap(key) {
  swapKey = key;
  const cat = CATEGORIES.find(c => c.key === key);
  const opts = { purpose:state.purpose, budget:state.budget, res:state.res, brand:state.brand };
  const list = Engine.candidates(state.build, key, opts);

  el('dlg-title').textContent = `${cat.icon} ${cat.label} 변경`;
  el('dlg-desc').textContent = '가격 차이는 견적 총액 기준입니다. 함께 바뀌는 부품도 안내됩니다.';
  el('dlg-body').innerHTML = list.map((c, i) => {
    const diffCls = c.priceDiff > 0 ? 'diff-up' : c.priceDiff < 0 ? 'diff-down' : 'diff-same';
    const diffTxt = c.blocked ? '&nbsp;'
      : c.priceDiff === 0 ? '총액 동일'
      : (c.priceDiff > 0 ? '+' : '−') + Math.abs(c.priceDiff).toLocaleString('ko-KR');
    const note = c.changes.length
      ? `<div class="cand-note">함께 변경: ${c.changes.map(ch =>
          `${CATEGORIES.find(x => x.key === ch.key).label} → ${ch.to.name}`).join(', ')}</div>`
      : '';
    return `<button type="button" class="cand ${c.current ? 'current' : ''}" data-index="${i}"
              ${c.blocked ? 'disabled' : ''}>
      <div>
        <div class="cand-name">${c.part.name}${c.current ? '<span class="tag-cur">현재</span>' : ''}</div>
        <div class="cand-spec">${Engine.specText(key, c.part)}</div>
        ${c.blocked ? `<div class="cand-block">${c.blocked}</div>` : note}
      </div>
      <div class="cand-price">
        <b class="num">${c.part.price ? won(c.part.price) : '0원'}</b>
        <span class="cand-diff ${diffCls} num">${diffTxt}</span>
      </div>
    </button>`;
  }).join('');

  el('dlg-body').querySelectorAll('.cand').forEach(btn => {
    btn.addEventListener('click', () => applySwap(list[Number(btn.dataset.index)]));
  });
  el('swap-dialog').showModal();
}

function applySwap(cand) {
  if (cand.current) { el('swap-dialog').close(); return; }
  const next = Object.assign({}, state.build, { [swapKey]: cand.part });
  const fixed = Engine.repair(next, swapKey);
  state.build = fixed.build;
  el('swap-dialog').close();
  renderResult();
  save();
  toast(fixed.changes.length
    ? `${cand.part.name}(으)로 변경 · ${fixed.changes.map(c =>
        CATEGORIES.find(x => x.key === c.key).label).join(', ')}도 함께 조정했습니다`
    : `${cand.part.name}(으)로 변경했습니다`);
}

/* ===== 견적표 텍스트 내보내기 ===== */
/* 한글은 폭이 2칸이므로 실제 표시 폭을 계산해 맞춘다 */
function padTo(str, width) {
  let w = 0;
  for (const ch of str) w += /[ᄀ-ᇿ　-〿가-힣一-鿿＀-｠]/.test(ch) ? 2 : 1;
  return str + ' '.repeat(Math.max(1, width - w));
}

function quoteText() {
  const b = state.build;
  const opts = { purpose:state.purpose, budget:state.budget, res:state.res, brand:state.brand };
  const purpose = Engine.purposeOf(state.purpose);
  const total = Engine.totalPrice(b);
  const pw = Engine.power(b);
  const line = '─'.repeat(30);
  const rows = CATEGORIES.map(c =>
    ' ' + padTo(c.label, 11) + padTo(b[c.key].name, 30) + won(b[c.key].price));

  return [
    line,
    ` 조립PC 견적서 · ${purpose.label}${purpose.useRes ? ' / ' + Engine.resolutionOf(state.res).label : ''}`,
    ` 예산 ${manwon(state.budget)} · ${Engine.tierLabel(total)} 체급`,
    line,
    ...rows,
    line,
    ' ' + padTo('합계', 11) + padTo('', 30) + won(total),
    ` 예상 최대 소비전력 ${pw.peak}W · 권장 파워 ${pw.recommended}W`,
    line,
    ` ※ 가격은 ${PRICE_INFO.note}입니다.`,
    ' ※ 조립 비용은 포함되어 있지 않습니다.'
  ].join('\n');
}

/* ===== 상태 저장 · 공유 ===== */
function snapshot() {
  return {
    p: state.purpose, b: state.budget, r: state.res, m: state.brand,
    ids: CATEGORIES.map(c => state.build[c.key].id)
  };
}

function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(snapshot())); } catch (e) { /* 저장 불가 환경 무시 */ }
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
  if (Number.isFinite(data.b)) state.budget = Math.min(6000000, Math.max(500000, data.b));
  state.build = build;
  state.minPrice = 0;
  state.overBudget = false;
  return true;
}

function loadInitial() {
  const hash = location.hash.replace(/^#q=/, '');
  if (location.hash.startsWith('#q=')) {
    try {
      const json = atob(hash.replace(/-/g, '+').replace(/_/g, '/'));
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
  // 가격 기준 표기 (자동 수집된 가격이 있으면 수집 시점 · 출처를 보여준다)
  el('price-date-note').textContent = PRICE_INFO.note;
  el('faq-price-date').textContent = PRICE_INFO.note;
  el('price-basis').textContent =
    `가격 기준: ${PRICE_INFO.note} · 조립 비용은 포함되어 있지 않습니다.`;

  renderWizard();

  // 조건 선택
  el('purpose-opts').addEventListener('click', e => {
    const btn = e.target.closest('[data-purpose]');
    if (!btn) return;
    state.purpose = btn.dataset.purpose;
    syncWizard();
  });
  el('budget-presets').addEventListener('click', e => {
    const btn = e.target.closest('[data-budget]');
    if (!btn) return;
    state.budget = Number(btn.dataset.budget);
    syncWizard();
  });
  el('res-opts').addEventListener('click', e => {
    const btn = e.target.closest('[data-res]');
    if (!btn) return;
    state.res = btn.dataset.res;
    syncWizard();
  });
  el('brand-opts').addEventListener('click', e => {
    const btn = e.target.closest('[data-brand]');
    if (!btn) return;
    state.brand = btn.dataset.brand;
    syncWizard();
  });
  el('budget-range').addEventListener('input', e => {
    state.budget = Number(e.target.value);
    syncWizard();
  });

  el('build-btn').addEventListener('click', generate);

  // 부품 변경
  el('quote-body').addEventListener('click', e => {
    const btn = e.target.closest('.swap-btn');
    if (btn) openSwap(btn.dataset.key);
  });
  el('dlg-close').addEventListener('click', () => el('swap-dialog').close());

  // 호환성 정상 항목 접기 · 펴기
  el('toggle-checks').addEventListener('click', e => {
    const box = el('checks');
    box.classList.toggle('checks-collapsed');
    e.target.textContent = box.classList.contains('checks-collapsed')
      ? '정상 항목까지 모두 보기' : '문제 항목만 보기';
  });

  // 내보내기
  el('copy-btn').addEventListener('click', () => copyText(quoteText(), '견적표를 복사했습니다'));
  el('share-btn').addEventListener('click', () => {
    const url = location.origin + location.pathname + '#q=' + encodeState();
    history.replaceState(null, '', '#q=' + encodeState());
    copyText(url, '견적 링크를 복사했습니다');
  });
  el('print-btn').addEventListener('click', () => window.print());
  el('reset-btn').addEventListener('click', () => {
    el('result').classList.remove('on');
    history.replaceState(null, '', location.pathname);
    try { localStorage.removeItem(STORE_KEY); } catch (e) { /* 무시 */ }
    el('wizard-section').scrollIntoView({ behavior:'smooth', block:'start' });
  });

  // 저장된 견적 또는 공유 링크 복원
  if (loadInitial()) {
    syncWizard();
    renderResult();
  }

  // 모바일 메뉴
  const hamburger = document.querySelector('.hamburger');
  const nav = document.querySelector('nav');
  hamburger.addEventListener('click', () => {
    nav.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', nav.classList.contains('open'));
  });
  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => nav.classList.remove('open'));
  });
});
