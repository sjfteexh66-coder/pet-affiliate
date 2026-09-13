#!/usr/bin/env node
/* 부품 데이터와 가격 검색 설정이 어긋나지 않았는지 확인한다.
 * 부품을 추가하고 검색 설정을 빠뜨리면 그 부품만 영영 추정 가격으로 남기 때문이다.
 */
import fs from 'node:fs';
import vm from 'node:vm';
import { PRICE_QUERIES } from './price-queries.mjs';

const src = fs.readFileSync(new URL('../pc/js/parts-data.js', import.meta.url), 'utf8');
const { PARTS } = vm.runInNewContext(src + ';({ PARTS })');
const parts = Object.values(PARTS).flat();

const missing = parts.filter(p => p.price > 0 && !PRICE_QUERIES[p.id]).map(p => p.id);
const unknown = Object.keys(PRICE_QUERIES).filter(id => !parts.some(p => p.id === id));
const dupes = parts.map(p => p.id).filter((id, i, all) => all.indexOf(id) !== i);

let failed = false;
const fail = msg => { console.error('✕ ' + msg); failed = true; };

if (missing.length) fail(`검색 설정이 없는 부품: ${missing.join(', ')} — scripts/price-queries.mjs 에 추가하세요.`);
if (unknown.length) fail(`존재하지 않는 부품의 검색 설정: ${unknown.join(', ')}`);
if (dupes.length) fail(`중복된 부품 ID: ${dupes.join(', ')}`);

if (!failed) {
  console.log(`✓ 부품 ${parts.length}개 · 검색 설정 ${Object.keys(PRICE_QUERIES).length}개 — 이상 없음`);
}
process.exit(failed ? 1 : 0);
