// 기기 기능 연결부: 저장소 (웹 미리보기 = localStorage)
// 웹의 SQLite는 특별한 서버 설정이 필요해서, 미리보기에서는 같은 함수 이름으로 localStorage를 쓴다.
import type { Card } from '../engine/srs';

const KEY = 'vocab-mobile-cards';

function read(): Record<string, Card> {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; }
}

export async function loadCards(): Promise<Card[]> {
  return Object.values(read());
}

export async function saveCard(c: Card): Promise<void> {
  const all = read();
  all[c.id] = c;
  try { localStorage.setItem(KEY, JSON.stringify(all)); } catch {}
}

export async function clearCards(): Promise<void> {
  try { localStorage.removeItem(KEY); } catch {}
}

export const storageName = 'localStorage (웹 미리보기)';
