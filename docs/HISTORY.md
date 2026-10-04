# 기록

## 2026-10-04 처음 만든 날

### 출발점
[`docs/origin/1HOUR_PWA_SIMPLE_PLAN.md`](origin/1HOUR_PWA_SIMPLE_PLAN.md) — HTML·CSS·JS·localStorage·GitHub Pages로 1시간 안에 어휘 PWA를 만드는 실습 계획.
이것을 바이브코딩 초보자용 60분 강의 + 실습으로 바꾸는 과정에서 아래 문제를 고쳤다.

### 원본 계획에서 고친 것
| 문제 | 수업에서 생기는 일 | 고친 방법 |
|---|---|---|
| 필드명 뒤바뀜 (`korean: 'abandon'`) | 코드를 읽는 학생이 헷갈림 | `word` / `meaning` |
| 경로에 저장소 이름 고정 (`/1hour-vocab-pwa/`) | 저장소 이름이 다른 학생은 오프라인·설치가 깨짐 | 모든 경로를 `./` 상대경로로 |
| data URI SVG·이모지 아이콘 | iPhone 홈 화면 아이콘으로 쓸 수 없음 | `icon-192.png`, `icon-512.png` 파일 |
| 터미널 git push를 기본 배포로 | git 로그인 문제로 10분 이상 소모 | 기본은 GitHub 웹 업로드, git은 심화 트랙 |
| `confirm()` 대화상자 | 일부 화면(인앱·임베드)에서 안 뜸 | 두 번 누르면 지워지는 버튼 |
| 카카오톡 인앱 브라우저 언급 없음 | QR·링크를 카톡으로 열면 설치 불가 | 수업 안내에 "Chrome·Safari로 열기" 추가 |
| 서비스 워커가 POST까지 캐시 시도 | 오류 | GET만 처리, 옛 캐시 정리 추가 |

### 추가 요구사항 (사용자 제공, 같은 날)
반응형 단일 코드베이스, 지원 브라우저 정의와 주요 흐름 시험, 오프라인 범위 명시, Capacitor 호환, 플랫폼별 코드 회피,
모바일 우선 + 넓은 화면 확장, 푸시 알림 명세(보장된 전달로 취급하지 않기).
- 키트에 860px 이상에서 보이는 단어 목록(넓은 화면 레이아웃) 추가
- 강의 지도안에 "요구사항 명세" 부록: 지원 브라우저 표, 오프라인 범위 표, Capacitor 손볼 곳 표, 푸시 알림 설계
- 원문 프롬프트는 지도안에 그대로 실음

### 정답 키트 시험 결과 (Playwright, 하위 주소 `/…/` 구조)
| 흐름 | Chrome 데스크톱 | Chrome Android 화면 | Firefox 데스크톱 | Safari iPhone 화면 | Safari iPad 가로 |
|---|---|---|---|---|---|
| F1 카드 뒤집기 | 통과 | 통과 | 통과 | 통과 | 통과 |
| F2 이전·다음 | 통과 | 통과 | 통과 | 통과 | 통과 |
| F3 외웠어요 → 진도 | 통과 | 통과 | 통과 | 통과 | 통과 |
| F4 새로고침 후 유지 | 통과 | 통과 | 통과 | 통과 | 통과 |
| F5 오프라인 재실행 | 통과 | 통과 | 통과 | 통과* | 통과* |
| F6 넓은 화면 목록·가로 스크롤 없음 | 통과 | 통과 | 통과 | 통과 | 통과 |

\* WebKit은 Playwright의 오프라인 흉내(`setOffline`)에서 내부 오류가 나서, 서버를 실제로 끄고 다시 열어 확인했다.
홈 화면 설치는 자동 시험이 안 되므로 실제 기기로 확인한다.

### 만든 것
1. 강의 지도안 (claude.ai artifact로 먼저 공개: https://claude.ai/artifact/RQYorVfZ9R4NvKKVG2EZq7)
2. 실습실 (claude.ai artifact: https://claude.ai/artifact/7PstFyrwRJArghKjV5xt8G) — claude.ai 안에서는 보는 사람의 Claude 계정으로 코드를 생성
3. 이 저장소: 위 두 페이지 + 정답 키트를 GitHub Pages로 공개

### 저장소로 옮기며 내린 결정
| 질문 | 결정 | 이유 |
|---|---|---|
| 범위 | 실습실·지도안·키트를 한 저장소에 | 수업 자료가 한 주소에 모임 |
| claude.ai 밖에서 Claude 호출 | 기본 예시 모드 + 원하는 사람만 자기 API 키 | 서버·강사 비용 없음, 키는 그 기기에만 |
| 공개 | Public + GitHub Pages | 학생이 로그인 없이 접속, 개인정보·비공개 데이터 없음 |
| 앱 수준 | 실습실을 PWA로, Android·iOS 포장은 지침 페이지만 | 스토어 계정·네이티브 빌드는 수업 범위 밖 |

### 저장소로 옮기며 바뀐 것
| 바뀐 것 | 이유 |
|---|---|
| `ai.js`에 자기 API 키 공급자 추가 (브라우저에서 Messages API 직접 호출, `anthropic-dangerous-direct-browser-access`) | claude.ai 밖에는 보는 사람의 Claude 계정이 없음 |
| 자기 키 요청에 JSON 스키마(`output_config.format`)와 `fallbacks: "default"`, 400이면 둘 다 빼고 한 번 재시도 | 답 모양을 고정하되, 계정·모델이 받지 않아도 동작하게 |
| 키는 기본 sessionStorage, "이 기기에 기억"일 때만 localStorage | 공용 PC에서 키가 남지 않게 |
| "앱 기록 지우기"·"처음부터 다시"가 키를 지우지 않게 수정 | artifact 판에서는 모든 localStorage를 지웠음 |
| 예시 결과를 내장 JSON 대신 `kit/`에서 fetch | 키트를 고치면 예시도 자동으로 따라옴 |
| zip은 artifact면 downloads 기능, 아니면 일반 링크 | 일반 브라우저에는 artifact 기능이 없음 |
| JSZip을 `vendor/`에 포함, 실습실도 PWA로 | 오프라인에서도 예시 모드로 실습 가능 |
| `native/` 앱 포장 지침 추가 | Capacitor 8 공식 문서를 2026-10-04에 확인하고 작성 |

### 저장소 시험 (2026-10-04, `npm test`, 59개 전부 통과)
- 정답 키트: 위 표의 5환경 × F1~F6 + 스크립트 오류 없음
- 실습실 예시 모드: 1~3단계 예시, 자동 검사, zip 7파일
- 실습실 자기 키: api.anthropic.com을 가짜 응답으로 바꿔 헤더 3개, 기본 모델·스키마·fallbacks, 400 재시도 1회, 키 보관 방식 확인
- 실습실 claude.ai: `window.claude` 흉내로 연결 표시와 응답 적용
- 실습실 PWA: manifest, 오프라인 재실행(Chromium 흉내 + WebKit 서버 종료)
- 시험이 실제로 잡는지 확인: API 헤더를 일부러 바꾸자 2개가 실패하는 것을 보고 되돌림

**아직 확인 못 한 것:** 진짜 API 키로 Claude 호출, 휴대폰 실기기 설치.

## 2026-10-04 (오후) Gemini 키 지원
사용자 요청: Gemini API 키로도 실습실을 쓰고 싶다.
- 키 설정 상자에 서비스 선택(Claude / Gemini) 추가. 키·모델은 서비스별로 따로 저장
- Gemini: `generateContent`를 브라우저에서 직접 호출, 키는 `x-goog-api-key` 헤더, `responseMimeType: application/json` + `responseJsonSchema`, 스키마 거부(400)면 스키마 없이 한 번 재시도, 틀린 키(400 "API key")는 재시도 없이 안내
- 모델: `gemini-3.8-flash`(기본), `gemini-3.5-flash-lite` — Google 모델 문서 2026-10-04 확인
- 시험 11개 추가(가짜 응답) → 70개 전부 통과. 진짜 Gemini 키 호출은 아직 미확인
