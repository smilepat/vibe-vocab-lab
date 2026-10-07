// 용어 풀이: 초보 바이브코더에게 낯선 기술 용어가 처음 나올 때 "(English: 쉬운 설명)"을 붙인다.
// - 한 페이지에서 같은 용어는 한 번만. 단계마다 내용이 바뀌는 칸(data-gloss-scope)은 그 칸 안에서 한 번씩
// - 코드·터미널·복사할 프롬프트·버튼·메뉴·제목에는 붙이지 않는다 (복사되는 글이 바뀌면 안 되므로)
// - 페이지마다 뜻이 다른 말("저장소")은 <script data-storage="device">로 고른다
// - 바로 뒤에 우리말 설명이 이미 있는 곳(data-gloss-short)은 영어 이름만 붙인다
// - 위쪽 설명 상자(data-gloss-collect)는 문장에는 영어 이름만, 설명은 상자 아래 용어 목록으로 모은다
(function () {
  'use strict';

  var me = document.currentScript;
  var storageMeaning = (me && me.dataset.storage) || 'repository';

  // [표기들(길이가 긴 것부터 찾음), 영어, 설명]
  var TERMS = [
    [['바이브코딩'], 'Vibe Coding', '원하는 결과를 말로 설명하고, AI가 쓴 코드를 실행해 보며 고쳐 나가는 개발 방식'],
    [['프롬프트'], 'Prompt', 'AI에게 보내는 요청 글'],
    [['Claude Code'], 'AI coding agent', '터미널·VS Code에서 코드를 읽고 쓰고 명령을 실행하는 Anthropic의 AI 도구'],
    [['VS Code'], 'Visual Studio Code', '무료 코드 편집 프로그램'],
    [['터미널'], 'Terminal', '글자로 명령을 입력해 컴퓨터를 다루는 창'],
    [['HTML'], 'HyperText Markup Language', '화면에 무엇이 있는지 적는 언어'],
    [['CSS'], 'Cascading Style Sheets', '색·크기·배치처럼 어떻게 보이는지 정하는 언어'],
    [['JavaScript', 'JS'], 'JavaScript', '버튼을 누르면 무슨 일이 일어나는지 정하는 프로그래밍 언어'],
    [['TypeScript'], 'TypeScript', '자료의 종류(타입)를 함께 적어 실수를 미리 잡는 JavaScript'],
    [['localStorage'], 'Local Storage', '브라우저 안에 작은 기록을 저장하는 곳. 그 기기·그 브라우저에만 남음'],
    [['PWA'], 'Progressive Web App', '홈 화면에 설치되고 인터넷이 끊겨도 열리는 웹앱'],
    [['manifest.json', 'manifest'], 'Web App Manifest', '앱 이름·아이콘·시작 주소를 휴대폰에 알려 주는 파일'],
    [['서비스 워커', 'sw.js'], 'Service Worker', '앱 파일을 저장해 두었다가 인터넷이 끊기면 저장본을 보여 주는 스크립트'],
    [['캐시'], 'Cache', '다시 받지 않도록 저장해 둔 파일 사본'],
    [['오프라인'], 'Offline', '인터넷에 연결되지 않은 상태'],
    [['배포'], 'Deployment', '만든 앱을 다른 사람이 쓸 수 있게 인터넷 주소나 스토어에 올리는 일'],
    [['GitHub Pages'], 'GitHub Pages', 'GitHub 저장소의 파일을 무료 웹사이트로 띄워 주는 기능'],
    [['GitHub'], 'GitHub', '코드를 저장하고 공유하는 웹 서비스'],
    [['git'], 'Git', '파일이 바뀐 기록을 관리하는 도구'],
    [['커밋', 'Commit changes'], 'Commit', '바뀐 내용을 하나의 기록으로 저장하는 일'],
    [['API 키'], 'API Key', '내 계정으로 AI를 부를 수 있게 해 주는 비밀 문자열. 남에게 보이면 안 됨'],
    [['예시 모드'], 'Example mode', 'AI를 부르지 않고 미리 준비한 결과로 진행하는 방식'],
    [['zip'], 'ZIP file', '여러 파일을 하나로 묶은 압축 파일'],
    [['인앱 브라우저', '카카오톡 안 브라우저', '카톡 안 브라우저', '앱 안 브라우저', '카톡 안의 브라우저'], 'In-app browser', '다른 앱 안에서 열리는 브라우저. 홈 화면 설치 기능이 없음'],
    [['상대경로'], 'Relative path', '지금 파일 위치를 기준으로 적는 경로. 예: ./style.css'],
    [['절대경로'], 'Absolute path', '사이트 맨 위를 기준으로 적는 경로. 예: /저장소이름/sw.js'],
    [['개발자 도구'], 'Developer Tools (F12)', '브라우저에 들어 있는 오류·구조 확인 도구'],
    [['반응형'], 'Responsive design', '화면 크기에 맞춰 배치가 바뀌게 만드는 설계'],
    [['서버'], 'Server', '요청을 받아 답을 돌려주는 컴퓨터나 프로그램'],
    [['라이브러리'], 'Library', '다른 사람이 만들어 둔 코드 묶음'],
    [['Web Speech API'], 'Web Speech API', '브라우저에 들어 있는 음성 읽기·인식 기능'],
    [['스토어'], 'App Store · Google Play', '심사를 거쳐 앱을 올리고 검색·설치하는 공식 장터'],
    [['심사'], 'App review', '스토어가 앱을 올리기 전에 규정에 맞는지 확인하는 과정'],
    [['Capacitor'], 'Capacitor', '웹앱을 Android·iOS 앱 안에 넣어 주는 도구'],
    [['네이티브 플러그인', '플러그인'], 'Native plugin', '웹 코드에서 휴대폰 기능(알림·음성 등)을 쓰게 이어 주는 부품'],
    [['네이티브'], 'Native', '휴대폰 운영체제(Android·iOS)가 직접 제공하는 기능이나 앱'],
    [['웹뷰'], 'WebView', '앱 안에서 웹페이지를 띄워 보여 주는 화면'],
    [['Android Studio'], 'Android Studio', 'Google의 Android 앱 개발 프로그램'],
    [['Xcode'], 'Xcode', 'Apple의 iOS 앱 개발 프로그램. Mac 전용'],
    [['SDK'], 'Software Development Kit', '개발에 필요한 도구 묶음'],
    [['에뮬레이터'], 'Emulator', '컴퓨터 안에서 휴대폰을 흉내 내는 프로그램'],
    [['USB 디버깅'], 'USB debugging', '컴퓨터가 USB로 휴대폰에 앱을 설치·시험하도록 허락하는 설정'],
    [['앱 ID'], 'App ID · Bundle ID', '전 세계에서 하나뿐인 앱 이름표(com.example.vocab 형태). 출시 뒤 못 바꿈'],
    [['서명 키'], 'Signing key', '이 앱을 내가 만들었음을 증명하는 비밀 파일. 잃으면 업데이트 불가'],
    [['동기화'], 'Sync', '두 곳의 내용을 같게 맞추는 일'],
    [['결정 문서'], 'Decision Record', '나중에 바꾸기 어려운 선택을 코드보다 먼저 적어 두는 한 장짜리 문서'],
    [['React Native'], 'React Native', 'JavaScript로 Android·iOS 앱 화면을 만드는 도구'],
    [['Expo Go'], 'Expo Go', 'QR을 찍으면 개발 중인 앱을 바로 열어 보는 휴대폰 앱'],
    [['Expo'], 'Expo', 'React Native 앱을 쉽게 만들고 빌드·배포하게 돕는 도구 모음'],
    [['타입 검사'], 'Type check', '실행하기 전에 자료의 종류가 맞는지 확인하는 검사'],
    [['SQLite'], 'SQLite', '기기 안에 들어가는 작은 데이터베이스'],
    [['데이터베이스'], 'Database', '기록을 표 형태로 저장하고 찾는 곳'],
    [['학습 엔진'], 'Learning engine', '복습 시점과 진도를 계산하는 부분. 화면 코드와 분리'],
    [['간격 반복'], 'Spaced repetition', '잊을 때쯤 다시 복습하도록 간격을 늘려 가는 학습법'],
    [['의존성'], 'Dependency', '내 프로젝트가 가져다 쓰는 다른 사람의 프로그램 부품'],
    [['npm'], 'Node Package Manager', '프로그램 부품을 내려받아 설치하는 도구'],
    [['Node.js', 'Node'], 'Node.js', '브라우저 밖에서 JavaScript를 실행하는 프로그램'],
    [['빌드'], 'Build', '코드를 설치·실행할 수 있는 앱 파일로 만드는 일'],
    [['EAS'], 'Expo Application Services', 'Expo의 클라우드 빌드·스토어 제출 서비스'],
    [['TestFlight'], 'TestFlight', 'Apple의 iOS 앱 시험 배포 서비스'],
    [['내부 테스트'], 'Internal testing', 'Google Play에서 정한 사람에게만 앱을 먼저 배포하는 기능'],
    [['OTA'], 'Over-the-air update', '스토어 심사 없이 앱의 화면·로직을 업데이트하는 방식'],
    [['권한'], 'Permission', '앱이 알림·마이크 등을 쓰려고 사용자에게 받는 허락'],
    [['푸시 알림'], 'Push notification', '앱을 열지 않아도 휴대폰에 뜨는 알림'],
    [['딥링크'], 'Deep link', '누르면 앱의 특정 화면이 바로 열리는 주소'],
    [['MDM'], 'Mobile Device Management', '학교·회사가 기기에 앱을 한꺼번에 설치·관리하는 시스템'],
    [['생성형 AI'], 'Generative AI', '글·코드·그림을 새로 만들어 내는 AI. ChatGPT·Claude·Gemini 등'],
    [['ChatGPT'], 'ChatGPT', 'OpenAI의 생성형 AI 채팅 서비스'],
    [['Gemini'], 'Gemini', 'Google의 생성형 AI'],
    [['Netlify'], 'Netlify', '파일이나 폴더를 올리면 웹사이트로 띄워 주는 서비스'],
    [['Vercel'], 'Vercel', 'GitHub 저장소를 연결하면 웹사이트로 띄워 주는 서비스'],
    [['UTF-8'], 'UTF-8', '한글이 깨지지 않게 글자를 저장하는 방식'],
    [['인코딩'], 'Encoding', '글자를 파일에 저장하는 방식. 보통 UTF-8을 고름'],
    [['메모장'], 'Notepad', 'Windows에 기본으로 들어 있는 글 편집 프로그램'],
    [['확장명'], 'File extension', '파일 이름 끝의 .html, .css 같은 부분. 파일 종류를 알려 줌'],
    [['압축'], 'Compression', '여러 파일을 zip 하나로 묶는 일. 압축을 풀면 안의 파일이 다시 나옴(오른쪽 클릭 → 모두 압축 풀기)'],
    [['https'], 'HTTPS', 'https://로 시작하는 안전한 주소. 휴대폰 설치·오프라인은 https 주소에서만 됨'],
    [['404'], 'HTTP 404', '그 주소에 파일이 없다는 뜻. 올린 직후이거나 파일 위치가 틀렸을 때 나옴'],
    [['비행기 모드'], 'Airplane mode', '휴대폰의 인터넷 연결을 모두 끄는 설정. 오프라인 시험에 씀'],
    [['Public'], 'Public repository', '누구나 볼 수 있는 저장소. GitHub Pages를 무료로 쓰려면 필요'],
    [['README'], 'README', '저장소를 소개하는 설명 파일'],
    [['QR 코드'], 'QR code', '휴대폰 카메라로 찍으면 주소가 열리는 네모 무늬'],
    [['UX'], 'User Experience', '사용자가 앱을 쓰면서 느끼는 편함과 불편함'],
    [['Flash-Lite'], 'Gemini Flash-Lite', '더 빠르고 저렴한 Gemini 모델. 사람이 몰려도 덜 막힘'],
    [['미리보기'], 'Preview', '만든 앱을 실습실 안에서 바로 눌러 보는 화면'],
    [['저장소'], storageMeaning === 'device' ? 'Storage' : 'Repository',
      storageMeaning === 'device' ? '앱이 기록을 남겨 두는 곳 (휴대폰은 SQLite, 웹은 localStorage)' : 'GitHub에서 한 프로젝트의 파일과 기록을 모아 두는 곳']
  ];

  // 붙이지 않는 곳
  var SKIP = 'pre, code, script, style, textarea, select, option, button, a, nav, h1, h2, h3, h4, svg, iframe, kbd, th, summary, label, ' +
    '.gloss, .gloss-list, .term-note, .chip, .label, .pill, .tab, .step-tab, .rail, .terminal, .term-body, .cc-body, .cc-prompt, .prompt, ' +
    '.tree, .peek, .checks, #checks, #log, .files, .time, .legend, .kbd, .ai-state, .status, .dims, .branch-label, .phone, ' +
    '.mark, .coach, [data-no-gloss]';

  // 찾기 규칙: 영어 용어는 앞뒤가 글자·숫자·밑줄·점이 아닐 때만 (JSON 속 JS, node_modules 속 node 방지)
  var MATCHERS = [];
  TERMS.forEach(function (t, idx) {
    t[0].forEach(function (form) {
      var esc = form.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      var latin = /^[A-Za-z]/.test(form);
      var re = latin ? new RegExp('(^|[^A-Za-z0-9_./-])(' + esc + ')(?![A-Za-z0-9_])') : new RegExp('()(' + esc + ')');
      MATCHERS.push({ idx: idx, form: form, re: re });
    });
  });
  MATCHERS.sort(function (a, b) { return b.form.length - a.form.length; });

  function scopeOf(node) {
    var el = node.nodeType === 1 ? node : node.parentElement;
    return (el && el.closest('[data-gloss-scope]')) || document.body;
  }
  // 이 범위(scope)에서 이미 풀이를 단 용어
  function usedIn(scope) {
    var used = {};
    scope.querySelectorAll('.gloss').forEach(function (g) { if (scopeOf(g) === scope) used[g.dataset.term] = true; });
    if (scope === document.body) {
      // 페이지에 이미 PWA 풀이 상자(.term-note)가 있으면 다시 달지 않는다
      document.querySelectorAll('.term-note b').forEach(function (b) {
        TERMS.forEach(function (t, i) { if (t[0].indexOf(b.textContent.trim()) >= 0) used[i] = true; });
      });
    }
    return used;
  }

  function annotateNode(textNode, used) {
    var text = textNode.nodeValue;
    var best = null;
    MATCHERS.forEach(function (m) {
      if (used[m.idx]) return;
      var r = m.re.exec(text);
      if (!r) return;
      var start = r.index + r[1].length;
      if (!best || start < best.start || (start === best.start && m.form.length > best.len)) best = { start: start, len: r[2].length, m: m };
    });
    if (!best) return;
    used[best.m.idx] = true;
    var t = TERMS[best.m.idx];
    var after = textNode.splitText(best.start + best.len);
    var span = document.createElement('span');
    span.className = 'gloss';
    span.dataset.term = String(best.m.idx);
    var host = after.parentElement;
    var collect = host && host.closest('[data-gloss-collect]');
    var short = collect || (host && host.closest('[data-gloss-short]'));
    // 영어 이름이 표기와 같으면(Expo, SQLite …) 이름을 되풀이하지 않는다
    var same = t[1].toLowerCase() === best.m.form.toLowerCase();
    if (short) span.textContent = same ? '' : ' (' + t[1] + ')';
    else span.textContent = same ? ' (' + t[2] + ')' : ' (' + t[1] + ': ' + t[2] + ')';
    after.parentNode.insertBefore(span, after);
    if (collect) addToList(collect, best.m.form, t);
    annotateNode(after, used); // 같은 글의 뒷부분에서 다른 용어 계속
  }

  // 설명 상자 아래 용어 목록: [용어] English · 설명
  function addToList(box, form, t) {
    var list = box.querySelector(':scope > .gloss-list');
    if (!list) {
      list = document.createElement('div');
      list.className = 'gloss-list';
      list.setAttribute('aria-label', '용어 풀이');
      box.appendChild(list);
    }
    var item = document.createElement('p');
    item.className = 'term-note';
    var b = document.createElement('b');
    b.textContent = form;
    item.appendChild(b);
    item.appendChild(document.createTextNode(t[1].toLowerCase() === form.toLowerCase() ? t[2] : t[1] + ' · ' + t[2]));
    list.appendChild(item);
  }

  function annotate(root) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        if (!n.nodeValue || !/\S/.test(n.nodeValue)) return NodeFilter.FILTER_REJECT;
        var p = n.parentElement;
        if (!p || p.closest(SKIP)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var list = [];
    while (walker.nextNode()) list.push(walker.currentNode);
    var cache = new Map();
    list.forEach(function (n) {
      if (!n.parentNode) return;
      var sc = scopeOf(n);
      if (!cache.has(sc)) cache.set(sc, usedIn(sc));
      annotateNode(n, cache.get(sc));
    });
  }

  var style = document.createElement('style');
  style.textContent = '.gloss { font-size: 0.86em; font-weight: 400; opacity: 0.78; font-style: normal; }';
  document.head.appendChild(style);

  // 화면이 다시 그려지면(단계 이동 등) 새 글에도 단다
  var pending = false, observer = null;
  function run() {
    pending = false;
    if (observer) observer.disconnect();
    annotate(document.body);
    if (observer) observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  }
  function schedule() { if (!pending) { pending = true; requestAnimationFrame(run); } }

  function start() {
    observer = new MutationObserver(function (records) {
      for (var i = 0; i < records.length; i++) {
        var t = records[i].target;
        var el = t.nodeType === 1 ? t : t.parentElement;
        if (el && el.closest && el.closest('.gloss')) continue;
        schedule(); return;
      }
    });
    run();
  }
  window.GLOSSARY = TERMS;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
