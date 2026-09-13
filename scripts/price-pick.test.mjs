/* 가격 선정 로직 테스트 — 네트워크 없이 실행된다.
 *   node --test scripts/
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { pickPrice, normalize } from './price-pick.mjs';
import { updatePrices } from './update-prices.mjs';
import { PRICE_QUERIES } from './price-queries.mjs';

const item = (title, lprice) => ({ title, lprice: String(lprice) });

test('공백과 하이픈 표기가 달라도 같은 이름으로 본다', () => {
  assert.equal(normalize('DDR5-5600'), normalize('DDR5 5600'));
  assert.equal(normalize('<b>코어i5</b>-12400F'), normalize('코어 i5 12400F'));
});

test('유효 상품 중 싼 쪽 5건의 중앙값을 고른다', () => {
  const items = [180000, 186000, 188000, 190000, 195000, 240000]
    .map(p => item('AMD 라이젠5 7500F 정품', p));
  const r = pickPrice(items, PRICE_QUERIES['cpu-r5-7500f'], 175000);
  assert.equal(r.price, 188000);        // 싼 쪽 5건 [180·186·188·190·195]의 중앙값
  assert.equal(r.samples, 6);           // 240,000원도 유효 표본이지만 중앙값 계산에는 빠진다
});

test('중고 · 조립PC 완본체는 제외한다', () => {
  const items = [
    item('AMD 라이젠5 7500F 중고 A급', 120000),
    item('조립PC 라이젠5 7500F RTX 5070 완본체', 1290000),
    item('AMD 라이젠5 7500F 정품', 185000),
    item('AMD 라이젠5 7500F 벌크', 188000),
    item('AMD 라이젠5 7500F 멀티팩', 192000)
  ];
  const r = pickPrice(items, PRICE_QUERIES['cpu-r5-7500f'], 175000);
  assert.equal(r.price, 188000);
  assert.deepEqual(r.dropped.map(d => d.why), ['견적용 상품 아님', '견적용 상품 아님']);
});

test('상위 모델(9070 XT)은 9070 가격에 섞이지 않는다', () => {
  // 'RX 9070 XT' 는 'RX 9070' 을 그대로 포함하므로 제외 토큰이 없으면 걸러지지 않는다
  const items = [
    item('SAPPHIRE 라데온 RX 9070 XT 16GB', 1050000),
    item('ASUS 라데온 RX 9070 16GB PRIME', 890000),
    item('GIGABYTE 라데온 RX 9070 16GB', 905000),
    item('POWERCOLOR 라데온 RX 9070 16GB', 915000)
  ];
  const r = pickPrice(items, PRICE_QUERIES['gpu-9070'], 880000);
  assert.equal(r.price, 905000);
  assert.equal(r.dropped[0].why, '다른 모델');
});

test('모델명이 들어간 주변기기는 가격 범위에서 걸러진다', () => {
  const items = [
    item('RTX 5070 12GB 그래픽카드 지지대 브라켓', 9000),   // 이름은 통과하지만 가격이 부품이 아님
    item('RTX 5070 12GB 전용 백플레이트', 25000),
    item('ASUS 지포스 RTX 5070 12GB', 880000),
    item('MSI 지포스 RTX 5070 12GB', 890000),
    item('GIGABYTE 지포스 RTX 5070 12GB', 900000)
  ];
  const r = pickPrice(items, PRICE_QUERIES['gpu-5070'], 830000);
  assert.equal(r.price, 890000);
  assert.deepEqual(r.dropped.map(d => d.why), ['지나치게 저렴', '지나치게 저렴']);
});

test('기준가에서 크게 벗어난 가격은 버린다', () => {
  const items = [
    item('AMD 라이젠5 7500F 정품', 1000),          // 미끼 · 오타
    item('AMD 라이젠5 7500F 정품 10개 세트', 1800000),
    item('AMD 라이젠5 7500F 정품', 185000),
    item('AMD 라이젠5 7500F 벌크', 187000),
    item('AMD 라이젠5 7500F 멀티팩', 189000)
  ];
  const r = pickPrice(items, PRICE_QUERIES['cpu-r5-7500f'], 175000);
  assert.equal(r.price, 187000);
  assert.equal(r.samples, 3);
});

test('표본이 모자라면 가격을 고르지 않는다', () => {
  const items = [item('AMD 라이젠5 7500F 정품', 185000), item('엉뚱한 상품', 5000)];
  const r = pickPrice(items, PRICE_QUERIES['cpu-r5-7500f'], 175000);
  assert.equal(r.price, null);
  assert.match(r.reason, /최소 3건/);
});

test('메모리는 단품 가격을 2개 구성으로 환산한다', () => {
  const items = [
    item('삼성전자 DDR5-5600 16GB', 52000),
    item('SK하이닉스 DDR5 5600 16GB', 54000),
    item('마이크론 DDR5-5600 16GB', 56000)
  ];
  const r = pickPrice(items, PRICE_QUERIES['ram-d5-32'], 105000);
  assert.equal(r.price, 108000);        // 54,000 × 2
});

test('가격이 없는 항목은 세지 않는다', () => {
  const items = [
    item('AMD 라이젠5 7500F 정품', ''),
    item('AMD 라이젠5 7500F 벌크', 186000),
    item('AMD 라이젠5 7500F 멀티팩', 188000)
  ];
  const r = pickPrice(items, PRICE_QUERIES['cpu-r5-7500f'], 175000);
  assert.equal(r.price, null);          // 유효 2건 → 신뢰하지 않음
});

test('전체 갱신 흐름 — 생성된 파일이 사이트에 그대로 적용된다', async () => {
  const fakeFetch = async url => {
    const query = decodeURIComponent(new URL(url).searchParams.get('query'));
    if (query.includes('5070')) throw new Error('일시적 오류');   // 실패 시 기존 가격 유지 확인
    return { ok: true, json: async () => ({ items: [
      item(query + ' 판매상품 A', 999999999),   // 범위를 벗어나 모두 탈락 → 기존 가격 유지
    ] }) };
  };
  const out = await updatePrices({ fetchImpl: fakeFetch, dryRun: true, log: () => {},
    only: ['cpu-r5-7500f', 'gpu-5070'] });

  assert.equal(out.report.failed.length, 1);
  assert.equal(out.report.failed[0].id, 'gpu-5070');
  assert.equal(out.results['cpu-r5-7500f'], 175000);   // 기존 가격 유지
  assert.equal(out.results['gpu-5070'], 830000);

  // 생성된 파일이 parts-data.js 와 합쳐졌을 때 정상 동작하는지
  const tmp = path.join(os.tmpdir(), 'prices-test.js');
  fs.writeFileSync(tmp, out.output.replace(/'cpu-r5-7500f': \d+/, "'cpu-r5-7500f': 187000"));
  const src = fs.readFileSync(tmp, 'utf8') + '\n' +
    fs.readFileSync(new URL('../pc/js/parts-data.js', import.meta.url), 'utf8');
  const ctx = vm.runInNewContext(src + ';({ PARTS, PRICE_INFO })');
  assert.equal(ctx.PARTS.cpu.find(c => c.id === 'cpu-r5-7500f').price, 187000);
  assert.equal(ctx.PRICE_INFO.live, true);
  assert.match(ctx.PRICE_INFO.note, /네이버 쇼핑 최저가/);
  fs.unlinkSync(tmp);
});
