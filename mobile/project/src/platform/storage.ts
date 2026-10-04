// 기기 기능 연결부: 저장소 (휴대폰 = SQLite)
// 웹 미리보기에서는 같은 이름의 storage.web.ts가 대신 쓰인다.
import * as SQLite from 'expo-sqlite';
import type { Card } from '../engine/srs';

let db: SQLite.SQLiteDatabase | null = null;

async function open() {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('vocab.db');
  // 동기화를 나중에 붙일 수 있게 updatedAt·deviceId를 처음부터 둔다
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS cards (
      id TEXT PRIMARY KEY NOT NULL,
      box INTEGER NOT NULL,
      dueAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      deviceId TEXT NOT NULL
    );
  `);
  return db;
}

export async function loadCards(): Promise<Card[]> {
  const d = await open();
  return d.getAllAsync<Card>('SELECT id, box, dueAt, updatedAt, deviceId FROM cards');
}

export async function saveCard(c: Card): Promise<void> {
  const d = await open();
  await d.runAsync(
    'INSERT OR REPLACE INTO cards (id, box, dueAt, updatedAt, deviceId) VALUES (?, ?, ?, ?, ?)',
    c.id, c.box, c.dueAt, c.updatedAt, c.deviceId
  );
}

export async function clearCards(): Promise<void> {
  const d = await open();
  await d.runAsync('DELETE FROM cards');
}

export const storageName = 'SQLite (기기 안 데이터베이스)';
