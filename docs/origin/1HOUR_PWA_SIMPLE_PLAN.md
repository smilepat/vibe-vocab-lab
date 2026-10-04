# ⚡ 1시간 PWA 어휘학습앱 실습 계획
## 가장 심플한 방식: HTML + CSS + JS + localStorage + GitHub Pages

> **없음**: 서버, 데이터베이스, 배포 복잡성
> **있음**: 프론트엔드 코드 3개 파일 + PWA 설정 2개 = 5개 파일로 끝!

---

## 📊 시간 배분 (60분 = 정확한 실행)

```
┌─────────────────────────────────────────────────────────┐
│  00:00-02:00  │  프로젝트 폴더 생성 + 파일 준비         │ 2분  │
├─────────────────────────────────────────────────────────┤
│  02:00-20:00  │  Claude Code로 5개 파일 생성            │ 18분 │
│               │  1. index.html                          │      │
│               │  2. style.css                           │      │
│               │  3. app.js                              │      │
│               │  4. manifest.json (PWA)                 │      │
│               │  5. sw.js (Service Worker - 오프라인)   │      │
├─────────────────────────────────────────────────────────┤
│  20:00-35:00  │  GitHub에 푸시 + Pages 배포 설정        │ 15분 │
├─────────────────────────────────────────────────────────┤
│  35:00-50:00  │  모바일에 PWA 설치 + 테스트              │ 15분 │
├─────────────────────────────────────────────────────────┤
│  50:00-60:00  │  버퍼 & 학생 질문                        │ 10분 │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 핵심 개념: 왜 PWA인가?

| 항목 | 기존 (Express + Deploy) | PWA (GitHub Pages) |
|------|------------------------|-------------------|
| **서버 필요** | ✅ (Vercel) | ❌ (GitHub Pages 무료) |
| **배포 시간** | 5-10분 | 1-2분 |
| **모바일 설치** | 복잡 (Expo, EAS) | 간단 (QR 스캔) |
| **개발 시간** | 30-40분 | 15-20분 |
| **오프라인 지원** | ❌ | ✅ (Service Worker) |
| **학생 체감도** | "앱처럼" | "진짜 앱" (홈 화면 설치) |

---

## 📁 최종 파일 구조 (5개만!)

```
1hour-vocab-pwa/
├── index.html          ← 메인 페이지 (어휘 카드 표시)
├── style.css           ← 디자인 (카드 스타일)
├── app.js              ← 로직 (어휘 추가/삭제, localStorage)
├── manifest.json       ← PWA 설정 (홈 화면 설치 가능)
└── sw.js               ← Service Worker (오프라인 작동)
```

---

## 🔧 Step 1: VS Code에서 폴더 생성 (2분)

```bash
# VS Code 터미널에서
mkdir ~/Desktop/1hour-vocab-pwa
cd ~/Desktop/1hour-vocab-pwa
```

---

## 💡 Step 2: Claude Code로 5개 파일 자동 생성 (18분)

### Claude Code에 이 지침을 복사 & 붙여넣기:

```
작업: 1시간 PWA 어휘학습앱 생성

현재 폴더: ~/Desktop/1hour-vocab-pwa
목표: 5개 파일 생성 → GitHub Pages 배포 가능한 PWA

**생성할 파일**:

📄 1. index.html
내용:
```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="1시간에 배우는 영어 어휘앱">
    <meta name="theme-color" content="#6366f1">
    
    <title>📚 1Hour Vocab - 영어 어휘 학습</title>
    
    <link rel="manifest" href="manifest.json">
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 192 192'><rect fill='%236366f1' width='192' height='192'/><text x='96' y='140' font-size='100' fill='white' text-anchor='middle' font-weight='bold'>📚</text></svg>">
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <!-- 헤더 -->
        <header>
            <h1>📚 1Hour Vocab</h1>
            <p>영어 어휘 학습 - 0/5 완료</p>
        </header>

        <!-- 어휘 카드 영역 -->
        <main id="card-container">
            <div class="card">
                <div class="front">보기</div>
                <div class="back">로딩 중...</div>
            </div>
        </main>

        <!-- 진도 표시 -->
        <section class="progress">
            <div class="progress-bar">
                <div class="progress-fill" id="progress-fill"></div>
            </div>
            <p id="progress-text">0 / 5 어휘 학습함</p>
        </section>

        <!-- 컨트롤 버튼 -->
        <section class="controls">
            <button id="prev-btn" class="btn btn-secondary">← 이전</button>
            <button id="next-btn" class="btn btn-primary">다음 →</button>
            <button id="mark-btn" class="btn btn-success">✓ 완료!</button>
        </section>

        <!-- 추가 기능 -->
        <section class="extra">
            <button id="reset-btn" class="btn-small">초기화</button>
            <button id="install-btn" class="btn-small" style="display:none;">📱 앱 설치</button>
        </section>
    </div>

    <script>
        // Service Worker 등록
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js');
        }

        // 설치 버튼
        let deferredPrompt;
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            document.getElementById('install-btn').style.display = 'block';
        });

        document.getElementById('install-btn').addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                deferredPrompt = null;
            }
        });
    </script>
    <script src="app.js"></script>
</body>
</html>
```

📄 2. style.css
내용:
```css
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    padding: 20px;
}

.container {
    max-width: 500px;
    margin: 0 auto;
    background: white;
    border-radius: 20px;
    padding: 30px 20px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
}

/* 헤더 */
header {
    text-align: center;
    margin-bottom: 30px;
}

header h1 {
    font-size: 32px;
    color: #667eea;
    margin-bottom: 5px;
}

header p {
    color: #999;
    font-size: 14px;
}

/* 카드 */
#card-container {
    perspective: 1000px;
    margin-bottom: 30px;
}

.card {
    position: relative;
    width: 100%;
    height: 250px;
    cursor: pointer;
    transform-style: preserve-3d;
    transition: transform 0.6s;
}

.card.flipped {
    transform: rotateY(180deg);
}

.front, .back {
    position: absolute;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 15px;
    font-size: 28px;
    font-weight: bold;
    backface-visibility: hidden;
}

.front {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}

.back {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    color: white;
    transform: rotateY(180deg);
}

/* 진도 바 */
.progress {
    margin-bottom: 30px;
    text-align: center;
}

.progress-bar {
    width: 100%;
    height: 10px;
    background: #eee;
    border-radius: 10px;
    overflow: hidden;
    margin-bottom: 10px;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #667eea, #764ba2);
    width: 0%;
    transition: width 0.3s;
}

#progress-text {
    font-size: 14px;
    color: #666;
}

/* 버튼 */
.controls {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 10px;
    margin-bottom: 20px;
}

.btn {
    padding: 12px;
    border: none;
    border-radius: 10px;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s;
}

.btn-primary {
    background: #667eea;
    color: white;
}

.btn-primary:hover {
    background: #5568d3;
    transform: translateY(-2px);
}

.btn-secondary {
    background: #e0e0e0;
    color: #333;
}

.btn-secondary:hover {
    background: #d0d0d0;
}

.btn-success {
    background: #48bb78;
    color: white;
}

.btn-success:hover {
    background: #38a169;
}

.extra {
    display: flex;
    gap: 10px;
    justify-content: center;
}

.btn-small {
    padding: 8px 12px;
    background: #f0f0f0;
    border: 1px solid #ddd;
    border-radius: 8px;
    cursor: pointer;
    font-size: 12px;
}

.btn-small:hover {
    background: #e0e0e0;
}

/* 모바일 최적화 */
@media (max-width: 600px) {
    .container {
        padding: 20px 15px;
    }
    
    header h1 {
        font-size: 24px;
    }
    
    .front, .back {
        font-size: 24px;
    }
}
```

📄 3. app.js
내용:
```javascript
// 어휘 데이터 (기본값)
const defaultVocabs = [
    { korean: 'abandon', english: '버리다', learned: false },
    { korean: 'ability', english: '능력', learned: false },
    { korean: 'about', english: '약', learned: false },
    { korean: 'abroad', english: '해외로', learned: false },
    { korean: 'absence', english: '부재', learned: false }
];

let vocabs = [];
let currentIndex = 0;

// localStorage에서 로드
function loadVocabs() {
    const saved = localStorage.getItem('vocabs');
    vocabs = saved ? JSON.parse(saved) : defaultVocabs;
}

// localStorage에 저장
function saveVocabs() {
    localStorage.setItem('vocabs', JSON.stringify(vocabs));
}

// 카드 렌더링
function renderCard() {
    if (vocabs.length === 0) return;
    
    const card = document.querySelector('.card');
    const vocab = vocabs[currentIndex];
    
    card.classList.remove('flipped');
    card.querySelector('.front').textContent = vocab.korean;
    card.querySelector('.back').textContent = vocab.english;
    
    updateProgress();
}

// 진도 업데이트
function updateProgress() {
    const learned = vocabs.filter(v => v.learned).length;
    const total = vocabs.length;
    const percent = (learned / total) * 100;
    
    document.getElementById('progress-fill').style.width = percent + '%';
    document.getElementById('progress-text').textContent = 
        `${learned} / ${total} 어휘 학습함`;
    
    // 타이틀도 업데이트
    document.querySelector('header p').textContent = 
        `영어 어휘 학습 - ${learned}/${total} 완료`;
}

// 카드 클릭으로 뒤집기
document.querySelector('.card').addEventListener('click', () => {
    document.querySelector('.card').classList.toggle('flipped');
});

// 이전 버튼
document.getElementById('prev-btn').addEventListener('click', () => {
    currentIndex = (currentIndex - 1 + vocabs.length) % vocabs.length;
    renderCard();
});

// 다음 버튼
document.getElementById('next-btn').addEventListener('click', () => {
    currentIndex = (currentIndex + 1) % vocabs.length;
    renderCard();
});

// 완료 버튼
document.getElementById('mark-btn').addEventListener('click', () => {
    vocabs[currentIndex].learned = !vocabs[currentIndex].learned;
    saveVocabs();
    renderCard();
    
    // 자동으로 다음으로
    currentIndex = (currentIndex + 1) % vocabs.length;
    renderCard();
});

// 초기화 버튼
document.getElementById('reset-btn').addEventListener('click', () => {
    if (confirm('모든 진도를 초기화하시겠습니까?')) {
        vocabs = defaultVocabs.map(v => ({ ...v, learned: false }));
        saveVocabs();
        currentIndex = 0;
        renderCard();
    }
});

// 초기화
loadVocabs();
renderCard();
```

📄 4. manifest.json (PWA 설정)
내용:
```json
{
  "name": "1Hour Vocab - 영어 어휘 학습앱",
  "short_name": "1Hour Vocab",
  "description": "1시간에 배우는 영어 어휘 학습 앱",
  "start_url": "/1hour-vocab-pwa/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#6366f1",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 192 192'><rect fill='%236366f1' width='192' height='192'/><text x='96' y='140' font-size='100' fill='white' text-anchor='middle' font-weight='bold'>📚</text></svg>",
      "sizes": "192x192",
      "type": "image/svg+xml",
      "purpose": "any"
    },
    {
      "src": "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'><rect fill='%236366f1' width='512' height='512'/><text x='256' y='380' font-size='280' fill='white' text-anchor='middle' font-weight='bold'>📚</text></svg>",
      "sizes": "512x512",
      "type": "image/svg+xml",
      "purpose": "any maskable"
    }
  ],
  "categories": ["education", "productivity"],
  "screenshots": [
    {
      "src": "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 540 720'><rect fill='%23667eea' width='540' height='720'/><text x='270' y='200' font-size='60' fill='white' text-anchor='middle' font-weight='bold'>영어 어휘</text><text x='270' y='400' font-size='120' fill='white' text-anchor='middle'>📚</text></svg>",
      "sizes": "540x720",
      "type": "image/svg+xml",
      "form_factor": "narrow"
    }
  ]
}
```

📄 5. sw.js (Service Worker - 오프라인 지원)
내용:
```javascript
const CACHE_NAME = 'vocab-v1';
const urlsToCache = [
  '/1hour-vocab-pwa/',
  '/1hour-vocab-pwa/index.html',
  '/1hour-vocab-pwa/style.css',
  '/1hour-vocab-pwa/app.js',
  '/1hour-vocab-pwa/manifest.json'
];

// 설치
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache).catch(() => {
        // 캐싱 실패해도 계속 진행
        return Promise.resolve();
      });
    })
  );
  self.skipWaiting();
});

// 활성화
self.addEventListener('activate', event => {
  event.waitUntil(clients.claim());
});

// 요청 처리 (네트워크 우선, 그 다음 캐시)
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, response.clone());
          return response;
        });
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
```

**작업 완료**:
- 5개 파일이 생성됨
- 각 파일이 ~/Desktop/1hour-vocab-pwa 폴더에 저장됨
- 로컬에서 테스트 가능: index.html을 브라우저에서 열기
```

---

## 🚀 Step 3: GitHub에 푸시 & Pages 배포 (15분)

### 3-1. GitHub에 리포지토리 생성

```bash
# Terminal에서
cd ~/Desktop/1hour-vocab-pwa

# Git 초기화
git init
git add .
git commit -m "Initial commit: PWA vocab app"

# GitHub에 푸시 (웹에서 repo 생성 후)
git remote add origin https://github.com/smilepat/1hour-vocab-pwa.git
git branch -M main
git push -u origin main
```

### 3-2. GitHub Pages 활성화

1. GitHub repo 설정 → "Pages"
2. Source: "Deploy from branch"
3. Branch: `main` / Folder: `/ (root)`
4. Save

**배포 URL**: `https://smilepat.github.io/1hour-vocab-pwa/`

---

## 📱 Step 4: 모바일에서 PWA 설치 & 테스트 (15분)

### Android (Chrome)
```
1. Chrome에서 https://smilepat.github.io/1hour-vocab-pwa/ 열기
2. 주소창 옆 "설치" 아이콘 클릭 (또는 메뉴 → "앱 설치")
3. 확인
4. 홈 화면에 "1Hour Vocab" 아이콘 생김 ✅
5. 카드 넘기며 학습 테스트
```

### iOS (Safari)
```
1. Safari에서 URL 열기
2. 공유 버튼 → "홈 화면에 추가"
3. 추가
4. 홈 화면의 아이콘에서 앱처럼 실행 ✅
```

### 테스트 체크리스트
- [ ] 카드 클릭으로 뒤집기
- [ ] 이전/다음 버튼 작동
- [ ] 완료 버튼으로 진도 업데이트
- [ ] 새로고침 후에도 진도 유지
- [ ] 오프라인 상태에서도 작동
- [ ] 홈 화면에 설치 가능

---

## 🎓 학생용 실습 시나리오

### 역할분담
```
강사: 시간 관리 + 트러블슈팅
학생: VS Code + Claude Code 직접 코딩
```

### 시간별 진행

| 시간 | 강사 | 학생 |
|------|------|------|
| 00:00-02:00 | 개념 설명 (PWA란?) | 폴더 생성 |
| 02:00-20:00 | 화면 공유 & 질문 대답 | Claude Code로 5개 파일 생성 |
| 20:00-35:00 | GitHub Pages 배포 가이드 | 푸시 & 설정 |
| 35:00-50:00 | 모바일 설치 가이드 | 핸드폰에 설치 & 테스트 |
| 50:00-60:00 | Q&A + 축하 | 완성 앱 체험 |

---

## 🛠 심플함의 비결

| 항목 | 기존 버전 | PWA 버전 |
|------|---------|---------|
| **파일 수** | 15개+ | 5개 |
| **코드 줄 수** | 500+ | 250 |
| **서버 필요** | ✅ (Express) | ❌ |
| **배포 복잡도** | 높음 (Vercel) | 낮음 (GitHub Pages) |
| **개발 시간** | 35-40분 | 15-20분 |
| **학생 이해도** | 중간 | 높음 (직관적) |
| **모바일 설치** | 복잡 (Expo) | 간단 (PWA) |

---

## 💾 localStorage 데이터 구조

```javascript
// 브라우저 개발자 도구 → Application → Local Storage
vocabs: [
  { korean: 'abandon', english: '버리다', learned: false },
  { korean: 'ability', english: '능력', learned: true },
  ...
]
```

학생들이 직접 추가한 어휘도 저장 가능!

---

## 🎯 확장 아이디어 (다음 시간)

이 기본 버전 이후 학생들이 할 수 있는 것들:

```
Level 1 (30분 추가): 
  - 어휘 추가 기능 추가
  - 카테고리 분류
  - 발음 버튼 (Web Speech API)

Level 2 (1시간 추가):
  - Backend 추가 (Node.js + Express)
  - 데이터베이스 동기화 (Supabase)
  - 학생들 간 어휘 공유

Level 3 (2시간 추가):
  - React로 리팩토링
  - Tailwind CSS로 고급 디자인
  - 게임화 (퀴즈, 랭킹)
```

---

## ✅ 완료 체크리스트

- [ ] 5개 파일 생성됨
- [ ] 로컬에서 index.html 열려서 작동함
- [ ] GitHub repo 생성 & 푸시됨
- [ ] GitHub Pages 활성화됨
- [ ] 모바일에서 PWA 설치 가능
- [ ] 오프라인에서도 작동함
- [ ] 진도 저장이 유지됨
- [ ] 학생들이 완성한 앱을 홈 화면에서 실행함 ✅

---

## 🎉 왜 이 방식이 최고?

**학생 관점**:
- ✅ "진짜 앱 만들었다!" (PWA는 진짜 앱)
- ✅ 홈 화면에 설치됨 (심리적 만족감 ⬆️)
- ✅ 오프라인에서도 작동 (마법 같음)
- ✅ 코드가 짧아서 이해 가능 (250줄)

**강사 관점**:
- ✅ 1시간 안에 100% 완성 가능
- ✅ 복잡한 배포 없음 (GitHub Pages)
- ✅ 트러블슈팅 최소화
- ✅ 학생들의 성취감 최대화
- ✅ "이거 진짜 앱이야?" → "응, 이게 PWA야!" (교육 효과 ⬆️)

