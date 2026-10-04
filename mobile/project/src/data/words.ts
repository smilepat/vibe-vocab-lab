// 단어 데이터는 앱에 포함 (결정 문서 ②)
export type Word = { id: string; word: string; meaning: string };

export const WORDS: Word[] = [
  { id: 'abandon', word: 'abandon', meaning: '버리다, 포기하다' },
  { id: 'ability', word: 'ability', meaning: '능력' },
  { id: 'abroad', word: 'abroad', meaning: '해외로' },
  { id: 'absence', word: 'absence', meaning: '부재, 결석' },
  { id: 'accept', word: 'accept', meaning: '받아들이다' }
];
