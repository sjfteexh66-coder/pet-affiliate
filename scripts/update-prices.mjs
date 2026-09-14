#!/usr/bin/env node
/* ===== 부품 가격 자동 갱신 =====
 * 네이버 쇼핑 검색 API로 부품 시세를 받아 pc/js/prices.js 를 새로 쓴다.
 *
 *   NAVER_CLIENT_ID / NAVER_CLIENT_SECRET 환경변수 필요
 *   (https://developers.naver.com 에서 애플리케이션 등록 후 발급, 검색 API 선택)
 *
 * 사용법
 *   node scripts/update-prices.mjs            가격을 받아 파일까지 갱신
 *   node scripts/update-prices.mjs --dry-run  받아만 보고 파일은 건드리지 않음
 *   node scripts/update-prices.mjs --only cpu-r5-7500f,gpu-5070   일부만 갱신
 *
 * 키가 없으면 아무것도 하지 않고 정상 종료한다. 자동화가 설정되기 전에도
 * 워크플로가 빨간불로 실패하지 않게 하기 위해서다.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { PRICE_QUERIES } from './price-queries.mjs';
import { pickPrice } from './price-pick.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PARTS_FILE = path.join(ROOT, 'pc/js/parts-data.js');
const PRICES_FILE = path.join(ROOT, 'pc/js/prices.js');
const API = 'https://openapi.naver.com/v1/search/shop.json';
const DISPLAY = 50;          // 한 부품당 받아볼 검색 결과 수
const DELAY_MS = 150;        // 호출 간격 (하루 25,000회 제한에는 여유가 충분하다)
const SOURCE_NAME = '네이버 쇼핑 최저가';

const sleep = ms => new Promise(r => setTimeout(r, ms));
const won = n => n.toLocaleString('ko-KR') + '원';

/* 사이트에 들어 있는 현재 가격을 읽는다 (자동 수집분이 있으면 그것을 기준으로) */
export function loadCurrentPrices() {
  const src = fs.readFileSync(PARTS_FILE, 'utf8');
  const overrides = fs.existsSync(PRICES_FILE) ? fs.readFileSync(PRICES_FILE, 'utf8') : '';
  const { PARTS, PRICE_OVERRIDES } = vm.runInNewContext(
    overrides + '\n' + src + '\n;({ PARTS, PRICE_OVERRIDES: typeof PRICE_OVERRIDES === "undefined" ? null : PRICE_OVERRIDES })'
  );
  const base = {};
  Object.values(PARTS).flat().forEach(p => { base[p.id] = { name: p.name, price: p.price }; });
  const live = (PRICE_OVERRIDES && PRICE_OVERRIDES.items) || {};
  Object.entries(live).forEach(([id, price]) => {
    if (base[id] && typeof price === 'number' && price > 0) base[id].price = price;
  });
  return base;
}

async function search(query, fetchImpl) {
  const url = `${API}?query=${encodeURIComponent(query)}&display=${DISPLAY}&sort=sim&exclude=used:rental:cbshop`;
  const res = await fetchImpl(url, {
    headers: {
      'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID,
      'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET
    }
  });
  if (!res.ok) throw new Error(`검색 실패 ${res.status} ${await res.text().catch(() => '')}`.trim());
  return (await res.json()).items || [];
}

function render(items, updated) {
  const lines = Object.entries(items).map(([id, p]) => `    '${id}': ${p}`).join(',\n');
  return `/* ===== 자동 수집된 부품 가격 =====
 * scripts/update-prices.mjs 가 생성하는 파일입니다. 직접 수정하지 마세요.
 * 값을 손보고 싶다면 pc/js/parts-data.js 의 price 를 고치거나,
 * 검색 조건(scripts/price-queries.mjs)을 조정한 뒤 스크립트를 다시 실행하세요.
 *
 * items 가 비어 있으면 사이트는 parts-data.js 의 추정 가격을 그대로 사용합니다.
 */
const PRICE_OVERRIDES = {
  updated: '${updated}',
  source: '${SOURCE_NAME}',
  items: {
${lines}
  }
};
`;
}

export async function updatePrices({ fetchImpl = fetch, dryRun = false, only = null, log = console.log } = {}) {
  const current = loadCurrentPrices();
  const targets = Object.entries(PRICE_QUERIES)
    .filter(([id]) => current[id] && (!only || only.includes(id)));

  const results = {};
  const report = { updated: [], kept: [], failed: [] };

  for (const [id, cfg] of targets) {
    const before = current[id].price;
    try {
      const items = await search(cfg.q, fetchImpl);
      const picked = pickPrice(items, cfg, before);
      if (picked.price === null) {
        results[id] = before;
        report.kept.push({ id, price: before, reason: picked.reason });
        log(`  · ${id.padEnd(16)} 유지 ${won(before).padStart(12)}  (${picked.reason})`);
      } else {
        results[id] = picked.price;
        const gap = picked.price - before;
        const tag = gap === 0 ? '동일' : (gap > 0 ? '▲' : '▼') + won(Math.abs(gap));
        (gap === 0 ? report.kept : report.updated).push({ id, before, after: picked.price });
        log(`  · ${id.padEnd(16)} ${won(before).padStart(12)} → ${won(picked.price).padStart(12)}  ${tag} (표본 ${picked.samples})`);
      }
    } catch (err) {
      results[id] = before;
      report.failed.push({ id, message: err.message });
      log(`  · ${id.padEnd(16)} 실패 — ${err.message} (기존 가격 유지)`);
    }
    if (DELAY_MS) await sleep(DELAY_MS);
  }

  const updated = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10); // KST 기준 날짜
  const output = render(results, updated);
  if (!dryRun) fs.writeFileSync(PRICES_FILE, output, 'utf8');

  log(`\n갱신 ${report.updated.length}건 · 유지 ${report.kept.length}건 · 실패 ${report.failed.length}건`);
  if (dryRun) log('(--dry-run 이므로 파일은 변경하지 않았습니다)');
  return { results, report, output, updated };
}

/* 직접 실행했을 때만 동작 */
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const onlyArg = args.indexOf('--only');
  const only = onlyArg >= 0 && args[onlyArg + 1] ? args[onlyArg + 1].split(',').map(s => s.trim()) : null;

  if (!process.env.NAVER_CLIENT_ID || !process.env.NAVER_CLIENT_SECRET) {
    console.log('NAVER_CLIENT_ID / NAVER_CLIENT_SECRET 이 없어 가격 갱신을 건너뜁니다.');
    console.log('https://developers.naver.com 에서 검색 API 키를 발급받아 환경변수(또는 GitHub Secrets)에 등록하세요.');
    process.exit(0);
  }
  console.log(`부품 가격을 ${SOURCE_NAME} 기준으로 갱신합니다.\n`);
  updatePrices({ dryRun: args.includes('--dry-run'), only })
    .catch(err => { console.error('갱신 중 오류:', err); process.exit(1); });
}
