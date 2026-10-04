# vibe-vocab-lab

바이브코딩을 처음 해 보는 교사·학생이 60분 동안 영어 단어 카드 앱을 만들어 휴대폰에 설치하는 수업 자료입니다.

| 페이지 | 주소 | 하는 일 |
|---|---|---|
| 실습실 | [/](https://smilepat.github.io/vibe-vocab-lab/) | 프롬프트를 보내면 코드가 생기고 미리보기·자동 검사로 확인, 마지막에 앱 파일 zip 내려받기 |
| 강의 지도안 | [/lecture/](https://smilepat.github.io/vibe-vocab-lab/lecture/) | 60분 진행표, 강사 메모, 프롬프트, 막혔을 때, 요구사항 명세 |
| 정답 키트 | [/kit/](https://smilepat.github.io/vibe-vocab-lab/kit/) | 완성된 단어 카드 PWA. 수업 첫 데모로 바로 설치 가능 |
| 앱 포장 지침 | [/native/](https://smilepat.github.io/vibe-vocab-lab/native/) | Capacitor로 Android·iOS 앱을 만드는 따라 하기 |

## 실습실에서 Claude 쓰기

- **기본: 예시 모드.** 키 없이 단계마다 "예시 결과 적용"으로 끝까지 진행합니다.
- **자기 API 키.** Anthropic API 키를 넣으면 브라우저에서 바로 Claude를 부릅니다. 키는 그 기기에만 저장되고 서버로 가지 않으며, 사용료는 키 주인 계정에 부과됩니다.
- **claude.ai 안에서 열면** 보는 사람의 Claude 계정으로 동작합니다.

## 로컬에서 보기·시험하기

빌드 단계가 없는 정적 사이트입니다.

```bash
# GitHub Pages와 같은 하위 주소로 띄우기
cd ..            # 저장소의 부모 폴더에서
python -m http.server 8765
# http://127.0.0.1:8765/vibe-vocab-lab/

# 시험 (Chromium·Firefox·WebKit)
npm install
npx playwright install chromium firefox webkit
npm test
```

기록은 [docs/HISTORY.md](docs/HISTORY.md), 이어서 작업할 때는 [HANDOFF.md](HANDOFF.md)를 보세요.
