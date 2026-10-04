import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newCard, review, dueCards, masteredCount, INTERVAL_DAYS } from './srs.ts';

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 9, 4);

test('새 카드는 바로 복습 대상', () => {
  const c = newCard('abandon', 'dev1', NOW);
  assert.equal(c.box, 1);
  assert.deepEqual(dueCards([c], NOW).map(x => x.id), ['abandon']);
});

test('알았으면 상자가 오르고 그만큼 뒤로 미뤄진다', () => {
  const c = review(newCard('abandon', 'dev1', NOW), true, NOW);
  assert.equal(c.box, 2);
  assert.equal(c.dueAt, NOW + INTERVAL_DAYS[1] * DAY);
  assert.equal(dueCards([c], NOW).length, 0);
});

test('몰랐으면 1번 상자로 돌아간다', () => {
  let c = newCard('ability', 'dev1', NOW);
  c = review(review(c, true, NOW), true, NOW);
  assert.equal(c.box, 3);
  assert.equal(review(c, false, NOW).box, 1);
});

test('5번 상자 위로는 올라가지 않고, 다 익힌 수에 들어간다', () => {
  let c = newCard('abroad', 'dev1', NOW);
  for (let i = 0; i < 8; i++) c = review(c, true, NOW);
  assert.equal(c.box, 5);
  assert.equal(masteredCount([c]), 1);
});

test('복습할 카드는 오래된 것부터', () => {
  const a = { ...newCard('a', 'd', NOW), dueAt: NOW - 2 * DAY };
  const b = { ...newCard('b', 'd', NOW), dueAt: NOW - 5 * DAY };
  assert.deepEqual(dueCards([a, b], NOW).map(x => x.id), ['b', 'a']);
});

test('기록마다 동기화용 updatedAt·deviceId가 남는다', () => {
  const c = review(newCard('accept', 'phone-1', NOW), true, NOW + 1000);
  assert.equal(c.updatedAt, NOW + 1000);
  assert.equal(c.deviceId, 'phone-1');
});
