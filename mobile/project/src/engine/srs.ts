// 학습 엔진: 간격 반복(라이트너 상자). 화면·기기와 상관없는 순수 TypeScript.
// 휴대폰 없이 `node --test`로 시험한다.

export type Card = {
  id: string;          // 단어 id
  box: number;         // 1~5. 맞힐수록 올라감
  dueAt: number;       // 다음 복습 시각 (ms)
  updatedAt: number;   // 나중에 서버 동기화할 때 쓸 수정 시각
  deviceId: string;    // 어느 기기에서 바뀌었는지
};

// 상자별 다음 복습까지의 날 수
export const INTERVAL_DAYS = [0, 1, 3, 7, 14];
const DAY = 24 * 60 * 60 * 1000;

export function newCard(id: string, deviceId: string, now: number): Card {
  return { id, box: 1, dueAt: now, updatedAt: now, deviceId };
}

// 알았으면 상자를 올리고, 몰랐으면 1번 상자로
export function review(card: Card, knew: boolean, now: number): Card {
  const box = knew ? Math.min(card.box + 1, 5) : 1;
  return { ...card, box, dueAt: now + INTERVAL_DAYS[box - 1] * DAY, updatedAt: now };
}

// 지금 복습할 카드 (복습 시각이 지난 것, 오래된 것부터)
export function dueCards(cards: Card[], now: number): Card[] {
  return cards.filter(c => c.dueAt <= now).sort((a, b) => a.dueAt - b.dueAt);
}

// 다 익힌 카드 수 (5번 상자)
export function masteredCount(cards: Card[]): number {
  return cards.filter(c => c.box === 5).length;
}
