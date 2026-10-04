# HANDOFF

이 한 장으로 이어서 작업할 수 있게 정리했습니다. 기록은 [docs/HISTORY.md](docs/HISTORY.md).

## 지금 상태 (2026-10-04)
- 공개 주소 https://smilepat.github.io/vibe-vocab-lab/ (GitHub Pages, main / root, 빌드 없음)
- 시험: 엔진 6개 + 133개 통과 (`npm test`), push마다 GitHub Actions `test` 워크플로가 돌림
- 자기 API 키는 Claude·Gemini 두 가지. **둘 다 아직 진짜 키로 한 번도 안 해 봄**. 가짜 응답으로만 시험함 → 남은 일 1

## 파일 지도
| 파일 | 하는 일 |
|---|---|
| `index.html` `lab.css` `lab.js` | 실습실. 단계 정의(STEPS)·자동 검사(autoChecks)·미리보기(buildDoc)·zip(downloadZip) 모두 lab.js |
| `ai.js` | AI 호출. `PROVIDERS`(anthropic·gemini: 키 저장 위치·모델·키 검사)와 `REQUESTS`(서비스별 요청·응답 읽기). `LabAI.detect()` → 'artifact' / 'key' / 'none', `LabAI.ask(prompt)` → `{files, summary, tryList}` |
| `sw.js` `manifest.webmanifest` `icons/` | 실습실 PWA. 같은 출처 GET만 캐시 |
| `glossary.js` | 용어 풀이. TERMS 배열에 [표기들, 영어, 설명]. 새 용어는 여기만 추가. 붙이지 않을 곳은 SKIP 또는 `data-no-gloss` |
| `vendor/jszip.min.js` | zip 만들기 (3.10.1, 오프라인 위해 저장소에 포함) |
| `kit/` | 정답 키트 7파일. 실습실의 "예시 결과"가 여기를 fetch함 → **kit을 고치면 예시도 바뀜** |
| `lecture/index.html` | 강의 지도안 (artifact 빌드본에 문서 골격만 붙인 것. 정답 키트 코드가 본문에 복사돼 있음) |
| `native/index.html` | Capacitor 포장 지침 |
| `native/demo/index.html` | 포장 데모 재생기. 터미널 출력은 2026-10-04 Windows에서 실제 실행한 것(STEPS 배열). Capacitor 버전이 바뀌면 다시 실행해 갈아 끼울 것. 단계마다 "Claude Code로 하면" 상자(CC 배열, `run`=시험이 대조하는 핵심 명령) |
| `path/index.html` | 개발 순서 흐름도(학생용). 상자·버튼은 HTML에 직접, 진행 체크는 localStorage `vibe-lab-path` |
| `mobile/index.html` | 모바일 우선 데모(9단계). 재생기는 native/demo와 같고 데이터(STEPS·CC)만 다름 |
| `mobile/project/` | 실제 Expo SDK 57 프로젝트(결정 문서·학습 엔진·저장소 연결부·화면). `npm i` 후 `npx expo start` |
| `mobile/app/` | mobile/project를 `npx expo export --platform web`한 결과(baseUrl `/vibe-vocab-lab/mobile/app`). 데모 휴대폰 화면에 뜸 |
| `tests/run.mjs` `tests/serve.mjs` | 시험과 하위 주소 정적 서버 |

## 자주 하는 일
```bash
npm run serve        # http://127.0.0.1:8765/vibe-vocab-lab/
npm test             # 먼저 한 번: npx playwright install chromium firefox webkit
```
- 실습실·키트 파일을 고치면 **`sw.js`의 `CACHE_NAME`(지금 lab-v8)을 올린다.** 키트를 고치면 `kit/sw.js`의 `vocab-v1`도.
- 저장 키: 실습 상태 `vibe-lab-v1`, 서비스 `vibe-lab-provider`, Claude 키·모델 `vibe-lab-api-key`·`vibe-lab-model`, Gemini 키·모델 `vibe-lab-gemini-key`·`vibe-lab-gemini-model`. `vibe-lab-`로 시작하는 설정은 "앱 기록 지우기"·"처음부터 다시"에서 보존됨.

## 함정
- 위쪽 메뉴는 페이지마다 HTML에 들어 있다. 페이지를 추가하면 모든 페이지 메뉴에 같은 순서로 넣는다(시험이 맨 앞 "개발 순서"와 항목 수를 확인)
- `mobile/app/`은 빌드 결과물이다. `mobile/project`를 고치면 그 폴더에서 `npx expo export --platform web` 후 `dist/`를 `mobile/app/`으로 복사해야 데모 화면이 바뀐다. 웹 미리보기는 SQLite 대신 localStorage(storage.web.ts) — 웹 SQLite는 GitHub Pages가 못 주는 COOP/COEP 헤더가 필요
- Expo 프로젝트는 TypeScript 6이라 tsconfig에 `"types": ["node"]`가 있어야 엔진 시험 파일이 타입 검사를 통과한다
- 홈의 "claude.ai 데모" 링크는 artifact `7PstFyrwRJArghKjV5xt8G`(실습실 1판). 보는 사람의 Claude 계정으로 동작하고 키 설정·Gemini는 없다. **artifact가 비공개라 학생은 못 연다** → 쓰려면 artifact Share 메뉴에서 링크 공유를 켠다.
- WebKit은 Playwright `setOffline`에서 내부 오류가 난다. 오프라인 확인은 서버를 실제로 끄는 방식(tests/run.mjs 6번).
- 자기 키 요청은 `output_config.format`(JSON 스키마) + `fallbacks: "default"`를 함께 보낸다. 400이 오면 둘 다 빼고 한 번 재시도한다. 진짜 API가 둘 중 무엇을 거부하는지는 미확인.
- 모델: Claude `claude-opus-5-5`(기본)·`claude-sonnet-5-5`, Gemini `gemini-3.8-flash`(기본)·`gemini-3.5-flash-lite` (2026-10-04 Google 문서 확인). 목록은 `ai.js`의 `PROVIDERS`.
- Gemini는 틀린 키도 400(메시지에 "API key")으로 돌려준다 → 재시도 없이 키 오류로 처리. 키는 주소(?key=)가 아니라 `x-goog-api-key` 헤더로 보낸다.
- 강의 지도안의 정답 키트 코드는 `kit/`과 별개 사본이다. kit을 고치면 지도안의 정답 키트 섹션도 맞춰야 한다.

## 남은 일
1. **진짜 API 키(Claude 또는 Gemini)로 실습실 1~3단계 한 번 돌리기** (키는 대화에 붙여 넣지 말고 브라우저 키 설정에 직접 입력). 400 재시도가 일어나는지 개발자 도구 Network에서 확인
2. 휴대폰 실기기: Android Chrome·iPhone Safari에서 실습실과 /kit/ 설치 → 비행기 모드
3. 데모로 쓸 때: claude.ai artifact 공유 켜기 (Share → 링크가 있는 모든 사람)
4. (선택) claude.ai artifact 2개를 이 저장소 내용으로 다시 올릴지 결정
