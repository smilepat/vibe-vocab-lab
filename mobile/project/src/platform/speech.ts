// 기기 기능 연결부: 발음 듣기 (휴대폰·웹 모두 expo-speech)
import * as Speech from 'expo-speech';

export function speak(word: string) {
  Speech.stop();
  Speech.speak(word, { language: 'en-US' });
}
