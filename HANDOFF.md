# HANDOFF

이 한 장으로 어느 PC에서든 이어서 작업할 수 있게 정리했습니다. 날짜별 기록은 [docs/HISTORY.md](docs/HISTORY.md).

## 지금 상태 (2026-10-07)
- 공개 주소 https://smilepat.github.io/vibe-vocab-lab/ (GitHub Pages, main / root, 빌드 없음, push하면 자동 배포)
- 시험: 엔진 6개 + 사이트 169개 통과 (`npm test`). push마다 GitHub Actions `test` 워크플로가 같은 시험을 돌림
- 대상: 코딩 처음인 **대학생·성인**. 이번 강의는 **강사 수업용 Gemini 키를 학생에게 나눠 주는 방식**
- 진짜 API 확인: **Gemini 키로 실습실 1~3단계 통과**(2026-10-06, 매번 fetch 1줄·200, 10~15초, JSON 스키마 수락). Claude 키는 가짜 응답으로만 시험함
- 실제 휴대폰 설치·비행기 모드: **2026-10-06 확인**(설치 앱으로 열림, 비행기 모드에서 열림·진도 유지·발음 소리)
- 쉬운 버전 `/easy/`(2026-10-06~07): 코딩 처음인 사람용 그림 안내. 실습실을 페이지 안에서 열기, 올릴 곳 세 가지(GitHub Pages·Netlify·Vercel), "생성형 AI 채팅으로 하기" 선택, 예시 모드로 학생 걷기 점검(컴퓨터·휴대폰) 반영
- 수업 전 점검 A·B 모두 통과 → **수업에 바로 쓸 수 있는 상태**. 남은 것은 수업 운영(수업용 키 만들기·삭제)과 선택 항목

## 다른 PC에서 시작하기
```bash
# 1. 받기 (이미 있으면 git pull)
git clone https://github.com/smilepat/vibe-vocab-lab.git C:/tmp/vibe-vocab-lab
cd C:/tmp/vibe-vocab-lab

# 2. 시험 도구 (Node 22 이상)
npm install
npx playwright install chromium firefox webkit

# 3. 확인
npm test             # 엔진 6개 + 사이트 169개가 모두 통과하면 준비 끝
npm run serve        # http://127.0.0.1:8765/vibe-vocab-lab/ 로 로컬 확인
```
- 모바일 우선 Expo 프로젝트를 만질 때만: `cd mobile/project && npm install && npx expo start`
- gh CLI로 배포 상태 확인: `gh run list --limit 3`, `gh api repos/smilepat/vibe-vocab-lab/pages/builds/latest --jq .status`
- 작업 규칙: 고치면 `npm test` → 커밋 → push (= 배포). push 전에 `git pull --rebase` (다른 도구가 STATUS.md를 넣는 일이 있음)

## 페이지
| 주소 | 대상 | 내용 |
|---|---|---|
| `/` | 학생 | 실습실. 4단계(앱 만들기 → 내 앱으로 → PWA → 내려받아 배포), 예시 모드 / 자기 Claude·Gemini 키 |
| `/path/` | 학생 | 개발 순서 흐름도. 준비 → 4단계 → 갈림길(PWA 계속·앱 포장·모바일 우선), 진행 체크 |
| `/easy/` | 학생 | 쉬운 버전. 코딩 처음인 사람용 준비+4단계, 단계마다 "누를 곳"과 "성공 화면" 그림, 진행 체크(`vibe-lab-easy`). 실습실을 페이지 안 iframe으로 열기(넓으면 나란히, 좁으면 덮어 열기) |
| `/lecture/` | 강사 (`?student`면 학생용) | 60분 강의 지도안, 강사 준비 목록, 요구사항 명세 |
| `/kit/` | 모두 | 정답 키트 PWA (수업 첫 데모) |
| `/native/` `/native/demo/` | 학생 | Capacitor 포장 지침과 실제 출력 데모 |
| `/mobile/` | 학생 | 모바일 우선(Expo) 데모 9단계 + 명령 모아 보기 |
| `/check/` | 강사 | 수업 전 점검표 (진짜 키·실제 휴대폰, QR, 결과 복사) |

## 파일 지도
| 파일 | 하는 일 |
|---|---|
| `index.html` `lab.css` `lab.js` | 실습실. 단계(STEPS)·자동 검사(autoChecks)·예시(exampleFor)·미리보기(buildDoc)·zip(downloadZip) |
| `ai.js` | AI 호출. `PROVIDERS`(anthropic·gemini: 키 저장 위치·모델·키 검사)와 `REQUESTS`(서비스별 요청·응답 읽기). `LabAI.ask(prompt)` → `{files, summary, tryList}` |
| `glossary.js` | 용어 풀이 86개. TERMS에 [표기들, 영어, 설명]. 새 용어는 여기만 추가 |
| `easy/index.html` | 쉬운 버전. 실습실 칸(iframe, `#stepN`으로 단계 이동), 올릴 곳·만들 곳 고르기, 생성형 AI 쪽 프롬프트 사본(lab.js P1~P3과 같아야 함) |
| `ui.css` | 모든 페이지 공통: 위쪽 설명 상자 `.intro`, 용어 상자 `.term-note`, 용어 목록 `.gloss-list` |
| `sw.js` `manifest.webmanifest` `icons/` | 실습실 PWA. 같은 출처 GET만 캐시 |
| `vendor/jszip.min.js` | zip 만들기 (3.10.1, 오프라인 위해 포함) |
| `kit/` | 정답 키트 7파일. 실습실의 예시 결과가 여기를 fetch → **kit을 고치면 예시도 바뀜** |
| `lecture/index.html` | 강의 지도안. 정답 키트 코드가 본문에 별도 사본으로 들어 있음 |
| `native/demo/index.html` `mobile/index.html` | 데모 재생기. 터미널 출력은 실제 실행 결과(STEPS), 단계별 Claude Code 상자(CC, `run`=시험이 대조하는 명령) |
| `mobile/project/` | 실제 Expo SDK 57 프로젝트 (DECISIONS.md·src/engine·src/platform·App.tsx) |
| `mobile/app/` | mobile/project의 웹 내보내기 결과 (데모 휴대폰 화면) |
| `path/index.html` `check/index.html` | 흐름도(학생), 수업 전 점검(강사) |
| `tests/run.mjs` `tests/serve.mjs` | 시험과 하위 주소 정적 서버 |
| `docs/HISTORY.md` `docs/origin/` | 날짜별 기록, 출발점이 된 원본 계획 |

## 함정
- 실습실·키트 파일을 고치면 **`sw.js`의 `CACHE_NAME`(지금 lab-v16)을 올린다.** 키트를 고치면 `kit/sw.js`의 `vocab-v1`도
- 저장 키: 실습 상태 `vibe-lab-v1`, 흐름도 `vibe-lab-path`, 쉬운 버전 `vibe-lab-easy`·`vibe-lab-easy-host`·`vibe-lab-easy-mode`·`vibe-lab-easy-big`, 점검 `vibe-lab-check`, 서비스 `vibe-lab-provider`, Claude 키·모델 `vibe-lab-api-key`·`vibe-lab-model`, Gemini 키·모델 `vibe-lab-gemini-key`·`vibe-lab-gemini-model`. `vibe-lab-` 설정은 "처음부터 다시"에서 보존
- 예시 결과는 `exampleFor`가 단계별 파일 세트를 만든다. 정답 키트 모양(`kitShaped`)이 아니면 키트 파일로 통째로 바꾸고, AI가 쓴 파일이면 두 번 눌러야 적용
- 1·2단계에 manifest/sw가 있으면 "이전 실습 파일이 남아 있습니다" 안내. AI 규칙에도 1·2단계 PWA 파일 금지가 있음
- **실습실 프롬프트(lab.js P1~P3)를 바꾸면 `easy/index.html`의 생성형 AI 쪽 사본도 고친다** (시험이 비교함)
- 쉬운 버전의 그림·복사할 글·버튼 이름에는 `data-no-gloss`, 실습실/생성형 AI 칸은 `data-gloss-scope`. 새 그림이나 말풍선을 넣으면 같은 표시를 단다 (시험이 확인)
- 위쪽 메뉴는 페이지마다 HTML에 들어 있다. 페이지를 추가하면 모든 메뉴에 같은 순서로(시험이 확인)
- 강의 지도안은 `?student`로 열면 학생용 화면. 흐름도 링크가 이것을 쓴다
- 모바일 우선의 "명령 모아 보기"는 STEPS의 `$` 줄에서 자동 생성 → 명령을 바꾸면 STEPS만 고친다
- `mobile/app/`은 빌드 결과물. `mobile/project`를 고치면 `npx expo export --platform web` 후 `dist/`를 `mobile/app/`으로 복사. 웹 미리보기는 localStorage(storage.web.ts) — 웹 SQLite는 Pages가 못 주는 COOP/COEP 헤더 필요
- Expo 프로젝트는 TypeScript 6이라 tsconfig에 `"types": ["node"]` 필요
- 자기 키 요청은 JSON 스키마(+ Claude는 `fallbacks: "default"`)를 함께 보내고, 400이면 빼고 한 번 재시도. Gemini는 스키마를 받아들임(재시도 안 일어남). Claude 쪽은 미확인
- Gemini는 틀린 키도 400("API key")으로 돌려준다 → 재시도 없이 키 오류. 키는 `x-goog-api-key` 헤더로
- 모델: Claude `claude-opus-5-5`(기본)·`claude-sonnet-5-5`, Gemini `gemini-3.8-flash`(기본)·`gemini-3.5-flash-lite`. 목록은 `ai.js`의 `PROVIDERS`
- 한 키로 동시 요청이 많으면 429("요청이 많습니다") → 학생들에게 Flash-Lite로 바꾸게
- 화면 공유 중 F12 Network 요청 Headers·Application 저장 공간에 키가 그대로 보인다
- `smilepat.github.io`의 다른 Pages 사이트와 브라우저 저장 공간을 함께 쓴다(같은 출처)
- Network에서 AI 요청을 셀 때 Type `preflight` 줄은 세지 않는다
- WebKit은 Playwright `setOffline`에서 내부 오류 → 오프라인 시험은 서버를 실제로 끄는 방식
- claude.ai 데모(artifact `7PstFyrwRJArghKjV5xt8G`, 실습실 1판)는 비공개. 강의 지도안 강사 준비 목록에만 링크. 학생에게 보이려면 Share에서 공유 켜기

## 남은 일
1. ~~실제 휴대폰 점검(점검 B)~~ 완료(2026-10-06). (선택) iPhone Safari에서도 한 번, 쉬운 버전을 실제 학생 한 명에게 처음부터 따라 하게 해 보기(예시 모드 걷기 점검은 자동으로 했음)
2. **수업 전날**: Google AI Studio에서 수업용 키 새로 만들기 + 사용 한도 + 분당 요청 한도 확인
3. **수업 직후**: 그 키를 AI Studio에서 삭제
4. (선택) Claude 키로 실습실 1~3단계 점검 — 400 재시도가 일어나는지 Network에서 확인
5. (선택) 학생 각자 키 없이 AI를 쓰게 하려면 서버 중계(강사 키는 서버에만, 수업 코드·횟수 제한) — 지금 구조에는 없음
6. (선택) claude.ai artifact 2개를 이 저장소 내용으로 다시 올릴지 결정
