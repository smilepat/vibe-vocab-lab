// 화면: 학습 엔진(src/engine)과 기기 기능 연결부(src/platform)만 부른다.
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { WORDS } from './src/data/words';
import { Card, dueCards, masteredCount, newCard, review } from './src/engine/srs';
import { clearCards, loadCards, saveCard, storageName } from './src/platform/storage';
import { speak } from './src/platform/speech';

const DEVICE_ID = Platform.OS + '-1';

export default function App() {
  const [cards, setCards] = useState<Card[] | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [askNotice, setAskNotice] = useState(false);

  // 처음 열 때: 저장된 기록을 읽고, 없는 단어는 새 카드로
  useEffect(() => {
    loadCards().then(saved => {
      // 새 카드와 "지금"을 같은 시각으로 맞춰야 새 카드가 바로 복습 대상이 된다
      const t = Date.now();
      const byId = new Map(saved.map(c => [c.id, c]));
      setCards(WORDS.map(w => byId.get(w.id) ?? newCard(w.id, DEVICE_ID, t)));
      setNow(t);
    });
  }, []);

  const due = useMemo(() => (cards ? dueCards(cards, now) : []), [cards, now]);
  const current = due[0];
  const word = current && WORDS.find(w => w.id === current.id);

  async function answer(knew: boolean) {
    if (!cards || !current) return;
    const t = Date.now();
    const next = review(current, knew, t);
    await saveCard(next);
    setCards(cards.map(c => (c.id === next.id ? next : c)));
    setFlipped(false);
    setNow(t);
  }

  async function resetAll() {
    await clearCards();
    const t = Date.now();
    setCards(WORDS.map(w => newCard(w.id, DEVICE_ID, t)));
    setNow(t);
  }

  if (!cards) return <SafeAreaView style={s.screen}><Text style={s.dim}>불러오는 중…</Text></SafeAreaView>;

  return (
    <SafeAreaView style={s.screen}>
      <View style={s.wrap}>
        <Text style={s.title}>1Hour Vocab</Text>
        <Text style={s.dim}>오늘 복습 {due.length}개 · 다 익힘 {masteredCount(cards)} / {cards.length}</Text>

        {word ? (
          <>
            <Pressable accessibilityRole="button" accessibilityLabel="카드 뒤집기" onPress={() => setFlipped(f => !f)} style={[s.card, flipped && s.cardBack]}>
              <Text style={s.cardText}>{flipped ? word.meaning : word.word}</Text>
              <Text style={s.cardHint}>상자 {current.box} · 눌러서 뒤집기</Text>
            </Pressable>
            <View style={s.row}>
              <Pressable style={[s.btn, s.btnGray]} onPress={() => answer(false)}><Text style={s.btnDark}>몰라요</Text></Pressable>
              <Pressable style={[s.btn, s.btnGreen]} onPress={() => answer(true)}><Text style={s.btnLight}>알아요</Text></Pressable>
            </View>
            <Pressable style={s.small} onPress={() => speak(word.word)}><Text>🔊 발음 듣기</Text></Pressable>
          </>
        ) : (
          <View style={s.done}>
            <Text style={s.doneTitle}>오늘 복습 끝!</Text>
            <Text style={s.dim}>알아요를 누른 단어는 1·3·7·14일 뒤에 다시 나옵니다.</Text>
          </View>
        )}

        {/* 권한은 누를 때, 이유를 먼저 설명하고 묻는다 (결정 문서 ④) */}
        <Pressable style={s.small} onPress={() => setAskNotice(true)}><Text>🔔 복습 알림 받기</Text></Pressable>
        {askNotice && (
          <Text style={s.notice}>
            {Platform.OS === 'web'
              ? '웹 미리보기에서는 알림을 쓸 수 없습니다. 휴대폰 앱에서는 여기서 이유를 설명한 뒤 알림 권한을 묻습니다.'
              : '매일 저녁 복습할 단어가 있으면 알려 드립니다. 허락하지 않아도 앱은 그대로 쓸 수 있습니다.'}
          </Text>
        )}

        <Pressable style={s.small} onPress={resetAll}><Text style={s.dim}>처음부터</Text></Pressable>
        <Text style={s.foot}>저장소: {storageName}</Text>
      </View>
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#eef2ff' },
  wrap: { flex: 1, padding: 20, gap: 14, alignItems: 'stretch', justifyContent: 'center', maxWidth: 480, width: '100%', alignSelf: 'center' },
  title: { fontSize: 28, fontWeight: '700', color: '#4f46e5', textAlign: 'center' },
  dim: { color: '#5d6480', textAlign: 'center' },
  card: { height: 220, borderRadius: 18, backgroundColor: '#4f46e5', alignItems: 'center', justifyContent: 'center', padding: 16 },
  cardBack: { backgroundColor: '#059669' },
  cardText: { color: '#fff', fontSize: 30, fontWeight: '700', textAlign: 'center' },
  cardHint: { color: '#e0e7ff', marginTop: 8, fontSize: 12 },
  row: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  btnGray: { backgroundColor: '#e5e7eb' },
  btnGreen: { backgroundColor: '#059669' },
  btnDark: { color: '#1f2937', fontWeight: '700', fontSize: 16 },
  btnLight: { color: '#fff', fontWeight: '700', fontSize: 16 },
  small: { alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#fff' },
  done: { height: 220, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', padding: 16, gap: 8 },
  doneTitle: { fontSize: 24, fontWeight: '700', color: '#059669' },
  notice: { backgroundColor: '#fbf0e1', padding: 10, borderRadius: 8, color: '#1c2033', fontSize: 13 },
  foot: { textAlign: 'center', color: '#9ca3af', fontSize: 11 }
});
