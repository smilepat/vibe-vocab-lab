(function () {
  'use strict';
  // 예시 결과는 kit/ 폴더의 정답 키트를 읽어 만든다 (1단계용 index는 PWA 연결을 뺀 것)
  var kitPromise = null;
  function loadKit() {
    if (kitPromise) return kitPromise;
    var names = { index_pwa: 'index.html', style: 'style.css', app: 'app.js', manifest: 'manifest.json', sw: 'sw.js' };
    var keys = Object.keys(names);
    kitPromise = Promise.all(keys.map(function (k) {
      return fetch('kit/' + names[k]).then(function (r) { if (!r.ok) throw new Error(names[k]); return r.text(); });
    })).then(function (texts) {
      var kit = {};
      keys.forEach(function (k, i) { kit[k] = texts[i]; });
      kit.index_basic = kit.index_pwa
        .replace(/\s*<link rel="(manifest|icon|apple-touch-icon)"[^>]*>/g, '')
        .replace(/\s*<script>\s*\/\/ Service Worker[\s\S]*?<\/script>/, '');
      return kit;
    });
    kitPromise.catch(function () { kitPromise = null; });
    return kitPromise;
  }
  var FILE_ORDER = ['index.html', 'style.css', 'app.js', 'manifest.json', 'sw.js'];
  var STORE = 'vibe-lab-v1';

  // ---------- 상태 ----------
  function freshState() {
    return { step: 1, files: {}, history: [], manual: {}, base: { 2: null }, zipSaved: false, tab: 'index.html', dev: 'phone' };
  }
  var state = freshState();
  try {
    var saved = JSON.parse(localStorage.getItem(STORE));
    if (saved && saved.files) state = Object.assign(freshState(), saved);
  } catch (e) {}
  function save() { try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) {} }

  // ---------- 단계 정의 ----------
  var P1 = '영어 단어 카드 앱을 만들어 줘.\n\n' +
    '- 파일은 index.html, style.css, app.js 세 개로 나눠 줘.\n' +
    '- 화면 가운데에 카드가 하나 있어. 앞면에는 영어 단어가 보이고, 카드를 누르면 뒤집혀서 한국어 뜻이 보여.\n' +
    '- 카드 아래에 [이전] [외웠어요] [다음] 버튼을 둬 줘. [외웠어요]를 누르면 그 단어를 외운 단어로 표시하고 다음 카드로 넘어가.\n' +
    '- 진도 막대와 "외운 단어 수 / 전체 단어 수"를 보여 줘.\n' +
    '- 외운 기록은 localStorage에 저장해서 새로고침해도 남게 해 줘.\n' +
    '- 단어는 abandon(버리다), ability(능력), abroad(해외로), absence(부재), accept(받아들이다) 5개로 시작해 줘.\n' +
    '- 휴대폰 화면을 먼저 생각해서 만들어 줘. 화면 폭이 860px 이상이면 오른쪽에 전체 단어 목록을 보여 주고, 목록에서 단어를 누르면 그 카드로 이동하게 해 줘.\n' +
    '- 휴대폰, 태블릿, 컴퓨터가 모두 같은 파일 하나로 동작해야 해.\n' +
    '- 서버나 외부 라이브러리 없이 HTML, CSS, JavaScript만 써 줘.';
  var P2a = '단어 목록을 아래 10개로 바꿔 줘. 형식은 지금과 똑같이 영어 단어와 한국어 뜻이야.\n\n' +
    'curious - 호기심 많은\nhabit - 습관\nborrow - 빌리다\nsilent - 조용한\nexplain - 설명하다\n' +
    'protect - 보호하다\nhonest - 정직한\nfreeze - 얼다\nnervous - 긴장한\nharvest - 수확';
  var P2b = '카드 아래에 [발음 듣기] 버튼을 추가해 줘. 누르면 지금 카드의 영어 단어를 브라우저에 내장된 음성(Web Speech API)으로 미국 영어 발음으로 읽어 줘.';
  var P2c = '카드 앞면 색을 짙은 초록색으로, 뒷면 색을 주황색으로 바꿔 줘. 글자는 지금보다 조금 더 크게 해 줘.';
  var P3 = '이 앱을 휴대폰 홈 화면에 설치할 수 있는 PWA로 만들어 줘.\n\n' +
    '- manifest.json을 만들어 줘. 앱 이름은 "1Hour Vocab", start_url과 scope는 "./", display는 standalone, 아이콘은 icon-192.png와 icon-512.png를 써.\n' +
    '- sw.js(서비스 워커)를 만들어 줘. 앱 파일과 아이콘을 저장해 두고, 인터넷이 끊기면 저장해 둔 파일로 열리게 해 줘.\n' +
    '- 모든 경로는 "./"로 시작하는 상대경로로 써 줘. GitHub Pages의 하위 주소에서 동작해야 해.\n' +
    '- index.html에 manifest 연결, apple-touch-icon 연결, 서비스 워커 등록 코드를 추가해 줘.\n' +
    '- 끝나면 오프라인에서 되는 것과 안 되는 것을 짧게 정리해 줘.';

  var STEPS = {
    1: {
      title: '앱 만들기', goal: '말로 설명해서 단어 카드 앱을 만듭니다. 미리보기에서 직접 눌러 보며 확인합니다.',
      tip: '프롬프트를 그대로 보내도 되고, 단어나 색을 바꿔서 보내도 됩니다. AI가 쓰는 데 30초~1분쯤 걸립니다.',
      chips: [['기본 프롬프트', P1]], prompt: P1
    },
    2: {
      title: '내 앱으로', goal: '하나만 골라서 고칩니다. 보내고, 미리보기에서 확인하고, 다음 것을 보냅니다.',
      tip: '세 가지를 한 번에 시키지 마세요. 한 번에 하나씩 해야 어디서 틀렸는지 찾기 쉽습니다.',
      chips: [['내 단어로', P2a], ['발음 듣기', P2b], ['색 바꾸기', P2c]], prompt: P2b
    },
    3: {
      title: 'PWA로', goal: '휴대폰에 설치되고 인터넷이 끊겨도 열리게 하는 파일 두 개를 더합니다.',
      tip: '아이콘 그림(icon-192.png, icon-512.png)은 4단계에서 내려받을 때 실습실이 자동으로 만들어 넣습니다. 서비스 워커는 실제 https 주소에서만 동작하므로 여기 미리보기에서는 오프라인을 시험할 수 없습니다.',
      chips: [['PWA 프롬프트', P3]], prompt: P3
    },
    4: {
      title: '내려받아 배포', goal: '앱 파일 7개를 zip으로 받아 GitHub Pages에 올리고 휴대폰에 설치합니다.',
      tip: '', chips: [], prompt: ''
    }
  };

  // ---------- 자동 검사 ----------
  function has(name) { return typeof state.files[name] === 'string' && state.files[name].trim().length > 0; }
  function f(name) { return state.files[name] || ''; }
  function check(label, pass, why) { return { label: label, pass: !!pass, why: why }; }

  function autoChecks(step) {
    var idx = f('index.html'), css = f('style.css'), js = f('app.js');
    if (step === 1) return [
      check('파일 3개가 있다', has('index.html') && has('style.css') && has('app.js'), 'index.html, style.css, app.js'),
      check('index.html이 style.css와 app.js를 연결한다', /href=["'](\.\/)?style\.css["']/i.test(idx) && /src=["'](\.\/)?app\.js["']/i.test(idx), '두 파일을 상대경로로 불러와야 합니다'),
      check('외운 기록을 localStorage에 저장한다', /localStorage\.setItem/.test(js), 'app.js 안에 localStorage.setItem'),
      check('넓은 화면용 레이아웃이 있다', /@media[^{]*min-width/i.test(css), 'style.css 안에 @media (min-width: …)'),
      check('외부 라이브러리를 쓰지 않는다', has('index.html') && !/(src|href)=["']https?:/i.test(idx), '인터넷에서 불러오는 파일이 없어야 오프라인에서도 열립니다')
    ];
    if (step === 2) {
      var base = state.base[2];
      var changed = base && FILE_ORDER.some(function (n) { return (base[n] || '') !== f(n); });
      return [
        check('1단계 앱이 있다', has('index.html') && has('app.js'), '먼저 1단계를 마쳐 주세요'),
        check('2단계에서 코드가 바뀌었다', changed, '프롬프트를 하나 보내면 통과합니다')
      ];
    }
    if (step === 3) {
      var man = null; try { man = JSON.parse(f('manifest.json')); } catch (e) {}
      var sw = f('sw.js');
      var icons = man && Array.isArray(man.icons) ? man.icons.map(function (i) { return String(i.src || ''); }).join(' ') : '';
      return [
        check('manifest.json이 올바른 JSON이다', !!man, '쉼표나 따옴표가 하나만 틀려도 휴대폰이 읽지 못합니다'),
        check('시작 주소가 상대경로다', man && /^\.\/?$/.test(String(man.start_url || '')), 'start_url이 "./" 이어야 저장소 이름과 상관없이 열립니다'),
        check('아이콘 두 개를 가리킨다', /icon-192\.png/.test(icons) && /icon-512\.png/.test(icons), 'icon-192.png, icon-512.png'),
        check('sw.js가 요청을 가로채 저장본을 쓴다', /addEventListener\(\s*['"]fetch['"]/.test(sw) && /caches/.test(sw), "fetch 이벤트와 caches 사용"),
        check('sw.js에 / 로 시작하는 절대경로가 없다', has('sw.js') && !/['"]\/[A-Za-z0-9_-]/.test(sw), "'/1hour-vocab/…' 처럼 쓰면 다른 저장소 이름에서 깨집니다"),
        check('index.html이 manifest를 연결하고 서비스 워커를 등록한다', /rel=["']manifest["']/i.test(idx) && /serviceWorker\.register/.test(idx + js), '<link rel="manifest"> 와 navigator.serviceWorker.register')
      ];
    }
    if (step === 4) return [
      check('앱 파일 zip을 내려받았다', state.zipSaved, '아래 버튼으로 내려받습니다')
    ];
    return [];
  }

  var MANUAL = {
    1: ['카드를 누르면 뜻이 보인다', '이전·다음 버튼으로 단어를 오간다', '외웠어요를 누르면 진도가 오른다', '새로고침해도 진도가 남아 있다', '컴퓨터 화면에서 단어 목록이 보이고, 휴대폰 화면에서는 사라진다'],
    2: ['내가 고른 변화가 미리보기에 보인다', '1단계에서 되던 기능이 그대로 된다'],
    3: ['미리보기의 앱이 3단계 전과 똑같이 동작한다'],
    4: ['GitHub 저장소에 파일 7개를 올렸다', 'Settings → Pages를 main / root로 켰다', '내 주소에서 앱이 열린다', '휴대폰 홈 화면에 설치했다', '비행기 모드에서도 열린다']
  };

  function stepDone(n) {
    var autos = autoChecks(n).every(function (c) { return c.pass; });
    var manual = (MANUAL[n] || []).every(function (_, i) { return state.manual[n + ':' + i]; });
    return autos && manual;
  }

  // ---------- 화면 그리기 ----------
  var $ = function (id) { return document.getElementById(id); };
  function el(tag, attrs, kids) {
    var node = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'text') node.textContent = attrs[k];
      else if (k === 'html') node.innerHTML = attrs[k];
      else if (k.slice(0, 2) === 'on') node.addEventListener(k.slice(2), attrs[k]);
      else node.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c) node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return node;
  }

  function renderSteps() {
    var nav = $('steps'); nav.innerHTML = '';
    [1, 2, 3, 4].forEach(function (n) {
      var done = stepDone(n);
      var autoOk = autoChecks(n).every(function (c) { return c.pass; });
      var pill = done ? ['done', '완료'] : autoOk && (n !== 2 || state.base[2]) && has('index.html') ? ['mid', '확인 남음'] : ['todo', '진행 전'];
      nav.appendChild(el('button', {
        type: 'button', class: 'step-tab', 'aria-current': state.step === n ? 'step' : 'false',
        onclick: function () { goStep(n); }
      }, [
        el('span', { class: 'n' }, ['STEP ' + n, el('span', { class: 'pill ' + pill[0], text: pill[1] })]),
        el('span', { class: 't', text: STEPS[n].title })
      ]));
    });
  }

  function renderMission() {
    var s = STEPS[state.step], box = $('mission');
    box.innerHTML = '';
    box.appendChild(el('span', { class: 'label', text: 'STEP ' + state.step + ' / 4' }));
    box.appendChild(el('h2', { text: s.title }));
    box.appendChild(el('p', { class: 'goal', text: s.goal }));
    if (s.tip) box.appendChild(el('p', { class: 'notice', text: s.tip }));
    if (state.step === 4) {
      var hasPwa = has('manifest.json') && has('sw.js');
      if (!hasPwa) box.appendChild(el('p', { class: 'notice', text: '아직 manifest.json이나 sw.js가 없습니다. 3단계를 먼저 마치면 설치와 오프라인이 됩니다.' }));
      box.appendChild(el('div', { class: 'row' }, [
        el('button', { type: 'button', class: 'btn primary', id: 'zip', onclick: downloadZip, text: '앱 파일 내려받기 (vocab-app.zip)' }),
        el('span', { class: 'status', id: 'zip-status' })
      ]));
      box.appendChild(el('h3', { text: 'GitHub Pages에 올리기', style: 'font-size:15px' }));
      box.appendChild(el('ol', { class: 'howto', html:
        '<li>zip을 풀어 파일 7개를 확인합니다.</li>' +
        '<li>github.com 오른쪽 위 <b>+ → New repository</b>, 이름 <code>vocab-app</code>, <b>Public</b> → Create</li>' +
        '<li><b>uploading an existing file</b>을 눌러 <b>파일 7개만</b> 끌어다 놓고 Commit changes (폴더째 올리지 않기)</li>' +
        '<li><b>Settings → Pages</b> → Deploy from a branch → <b>main</b> / <b>/ (root)</b> → Save</li>' +
        '<li>1~3분 뒤 <code>https://아이디.github.io/vocab-app/</code> 을 엽니다.</li>' }));
      box.appendChild(el('h3', { text: '휴대폰에 설치하기', style: 'font-size:15px' }));
      box.appendChild(el('ol', { class: 'howto', html:
        '<li>컴퓨터 브라우저 주소창의 <b>공유 → QR 코드 만들기</b>로 휴대폰에 주소를 옮깁니다. 카카오톡 안 브라우저에서는 설치가 안 됩니다.</li>' +
        '<li><b>Android</b> Chrome 메뉴 ⋮ → 앱 설치 · <b>iPhone</b> Safari 공유 → 홈 화면에 추가</li>' +
        '<li>앱을 한 번 열어 카드를 넘긴 뒤, 비행기 모드에서 다시 열어 봅니다.</li>' }));
    }
    $('composer').hidden = state.step === 4;
    var chips = $('chips'); chips.innerHTML = '';
    s.chips.forEach(function (c) {
      chips.appendChild(el('button', { type: 'button', class: 'chip', text: c[0], onclick: function () { $('prompt').value = c[1]; coach(); } }));
    });
  }

  function renderChecks() {
    var box = $('checks'); box.innerHTML = '';
    var autos = autoChecks(state.step);
    if (autos.length) {
      box.appendChild(el('p', { class: 'sub', text: '코드 자동 검사' }));
      var ul = el('ul', { class: 'checks' });
      var any = has('index.html') || state.step === 4;
      autos.forEach(function (c) {
        var cls = c.pass ? 'pass' : (any ? 'fail' : 'wait');
        ul.appendChild(el('li', null, [
          el('span', { class: 'mark ' + cls, 'aria-label': c.pass ? '통과' : '아직', text: c.pass ? '✓' : (any ? '✗' : '·') }),
          el('span', null, [c.label, el('span', { class: 'why', text: c.why })])
        ]));
      });
      box.appendChild(ul);
    }
    var man = MANUAL[state.step] || [];
    if (man.length) {
      box.appendChild(el('p', { class: 'sub', text: state.step === 4 ? '직접 해 보고 체크' : '미리보기에서 직접 눌러 보고 체크' }));
      var ul2 = el('ul', { class: 'checks' });
      man.forEach(function (label, i) {
        var key = state.step + ':' + i, id = 'm-' + state.step + '-' + i;
        var cb = el('input', { type: 'checkbox', id: id });
        cb.checked = !!state.manual[key];
        cb.addEventListener('change', function () { state.manual[key] = cb.checked; save(); renderSteps(); });
        ul2.appendChild(el('li', null, [cb, el('label', { for: id, text: label })]));
      });
      box.appendChild(ul2);
    }
  }

  function renderLog() {
    var log = $('log'); log.innerHTML = '';
    if (!state.history.length) {
      log.appendChild(el('p', { class: 'log-empty', text: '아직 보낸 프롬프트가 없습니다. 위에서 프롬프트를 보내면 AI의 답과 바뀐 파일이 여기에 쌓입니다.' }));
      return;
    }
    state.history.forEach(function (h) {
      if (h.role === 'me') {
        log.appendChild(el('div', { class: 'msg me' }, [el('span', { class: 'who', text: 'STEP ' + h.step + ' · 나' }), h.text]));
      } else {
        var kids = [el('span', { class: 'who', text: h.example ? '예시 결과' : (h.ai || 'Claude') }), el('p', { text: h.summary || '' })];
        if (h.files && h.files.length) kids.push(el('div', { class: 'files-changed' }, h.files.map(function (n) { return el('span', { text: n }); })));
        if (h.tryList && h.tryList.length) {
          kids.push(el('span', { class: 'who', text: '이렇게 확인해 보세요' }));
          kids.push(el('ul', null, h.tryList.map(function (t) { return el('li', { text: t }); })));
        }
        log.appendChild(el('div', { class: 'msg ai' }, kids));
      }
    });
    log.scrollTop = log.scrollHeight;
  }

  var lastChanged = [];
  function renderFiles() {
    var tabs = $('tabs'); tabs.innerHTML = '';
    var names = FILE_ORDER.filter(has);
    if (!names.length) {
      $('code').textContent = '아직 파일이 없습니다. 1단계 프롬프트를 보내면 index.html, style.css, app.js가 생깁니다.';
      return;
    }
    if (!has(state.tab)) state.tab = names[0];
    names.forEach(function (n) {
      var b = el('button', { type: 'button', class: 'tab', role: 'tab', 'aria-selected': String(n === state.tab), onclick: function () { state.tab = n; save(); renderFiles(); } }, [n]);
      if (lastChanged.indexOf(n) >= 0) b.appendChild(el('span', { class: 'dot', text: ' ●', 'aria-label': '방금 바뀜' }));
      tabs.appendChild(b);
    });
    $('code').textContent = state.files[state.tab];
  }

  // ---------- 미리보기 ----------
  var DEVICES = { phone: [390, 760, '휴대폰 390px'], tablet: [820, 1000, '태블릿 820px'], desktop: [1280, 800, '컴퓨터 1280px'] };
  var SHIM = '<script>(function(){try{Object.defineProperty(navigator,"serviceWorker",{configurable:true,value:{register:function(){return Promise.resolve({})},ready:new Promise(function(){}),addEventListener:function(){}}})}catch(e){}})();<\/script>';

  function buildDoc() {
    var html = f('index.html');
    var css = f('style.css').replace(/<\/style/gi, '<\\/style');
    var js = f('app.js').replace(/<\/script/gi, '<\\/script');
    html = html.replace(/<link[^>]*rel=["'](manifest|icon|apple-touch-icon)["'][^>]*>/gi, '');
    html = html.replace(/<link[^>]*href=["'](\.\/)?style\.css["'][^>]*>/i, function () { return '<style>' + css + '</style>'; });
    html = html.replace(/<script[^>]*src=["'](\.\/)?app\.js["'][^>]*>\s*<\/script>/i, function () { return '<script>' + js + '<\/script>'; });
    if (/<head[^>]*>/i.test(html)) html = html.replace(/<head[^>]*>/i, function (m) { return m + SHIM; });
    else html = SHIM + html;
    return html;
  }

  var frame = null;
  function renderPreview(rebuild) {
    var stage = $('stage');
    var d = DEVICES[state.dev];
    document.querySelectorAll('[data-dev]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.dev === state.dev)); });
    if (!has('index.html')) {
      stage.innerHTML = '';
      frame = null;
      stage.appendChild(el('div', { class: 'empty-preview' }, [
        el('b', { text: '여기에 앱이 나타납니다' }),
        el('span', { text: '1단계 프롬프트를 보내거나 예시 결과를 적용해 보세요.' })
      ]));
      $('dims').textContent = '';
      return;
    }
    var avail = Math.max(200, stage.clientWidth - 24);
    var scale = Math.min(1, avail / d[0]);
    if (!frame || rebuild) {
      stage.innerHTML = '';
      var box = el('div', { class: 'frame-box' });
      frame = el('iframe', { title: '앱 미리보기' });
      box.appendChild(frame);
      stage.appendChild(box);
      frame.srcdoc = buildDoc();
    }
    frame.style.width = d[0] + 'px';
    frame.style.height = d[1] + 'px';
    frame.style.transform = 'scale(' + scale + ')';
    frame.parentNode.style.width = Math.round(d[0] * scale) + 'px';
    frame.parentNode.style.height = Math.round(d[1] * scale) + 'px';
    $('dims').textContent = d[2] + (scale < 1 ? ' · ' + Math.round(scale * 100) + '%로 축소해서 보는 중' : '');
  }

  function renderAll(rebuild) {
    renderSteps(); renderMission(); renderChecks(); renderLog(); renderFiles(); renderPreview(rebuild);
  }

  function goStep(n) {
    state.step = n;
    if (n === 2 && !state.base[2]) state.base[2] = Object.assign({}, state.files);
    $('prompt').value = STEPS[n].prompt;
    save(); coach(); renderAll(false);
  }

  // ---------- 프롬프트 코치 ----------
  function coach() {
    var t = $('prompt').value.trim(), tips = [];
    if (t && t.length < 15) tips.push('조금 더 구체적으로: 무엇이, 어디에, 어떻게 보이면 되는지 적어 보세요.');
    if (state.step === 2) {
      var asks = (t.match(/(추가해|바꿔|만들어|넣어|고쳐|지워)\s*줘/g) || []).length;
      if (asks > 1) tips.push('2단계에서는 한 번에 하나씩 시켜 보세요. 지금 ' + asks + '가지를 한꺼번에 시키고 있습니다.');
    }
    if (state.step === 3 && t && !/상대경로|\.\//.test(t)) tips.push('경로를 "./" 상대경로로 써 달라고 하면 GitHub Pages에서 안전합니다.');
    var box = $('coach'); box.innerHTML = '';
    tips.forEach(function (x) { box.appendChild(el('span', { text: '• ' + x })); });
  }
  $('prompt').addEventListener('input', coach);

  // ---------- 결과 적용 ----------
  function applyFiles(newFiles, entry) {
    var changed = [];
    Object.keys(newFiles).forEach(function (n) {
      if (FILE_ORDER.indexOf(n) < 0 || typeof newFiles[n] !== 'string') return;
      if (state.files[n] !== newFiles[n]) changed.push(n);
      state.files[n] = newFiles[n];
    });
    lastChanged = changed;
    if (changed.length) state.tab = changed[0];
    entry.files = changed;
    state.history.push(entry);
    save();
    renderAll(true);
  }

  function exampleFor(step, KIT) {
    if (step === 1) return { files: { 'index.html': KIT.index_basic, 'style.css': KIT.style, 'app.js': KIT.app },
      summary: '카드 앱의 기본 파일 세 개를 넣었습니다. 카드 뒤집기, 이전·다음, 외웠어요, 진도 저장, 넓은 화면의 단어 목록이 들어 있습니다.',
      tryList: ['카드를 눌러 뜻 보기', '외웠어요 누른 뒤 새로고침', '미리보기를 컴퓨터로 바꿔 단어 목록 보기'] };
    if (step === 2) {
      var app = f('app.js') || KIT.app;
      var words = "const defaultWords = [\n    { word: 'curious', meaning: '호기심 많은' },\n    { word: 'habit', meaning: '습관' },\n    { word: 'borrow', meaning: '빌리다' },\n    { word: 'silent', meaning: '조용한' },\n    { word: 'explain', meaning: '설명하다' },\n    { word: 'protect', meaning: '보호하다' },\n    { word: 'honest', meaning: '정직한' },\n    { word: 'freeze', meaning: '얼다' },\n    { word: 'nervous', meaning: '긴장한' },\n    { word: 'harvest', meaning: '수확' }\n];";
      var next = app.replace(/const defaultWords = \[[\s\S]*?\];/, words);
      if (next === app) return null;
      return { files: { 'app.js': next }, summary: '단어 목록을 10개로 바꿨습니다. 나머지 기능은 그대로입니다.', tryList: ['진도가 0 / 10으로 바뀌었는지 보기', '다음 버튼으로 10개 단어 넘겨 보기'] };
    }
    if (step === 3) return { files: { 'index.html': KIT.index_pwa, 'manifest.json': KIT.manifest, 'sw.js': KIT.sw },
      summary: 'manifest.json과 sw.js를 만들고 index.html에 연결했습니다. 경로는 모두 ./ 상대경로입니다. 오프라인에서는 카드 화면·단어·외운 기록이 열리고, 처음 방문과 새 버전 받기는 인터넷이 필요합니다.',
      tryList: ['코드 탭에서 manifest.json의 start_url 확인', 'sw.js의 FILES 목록 확인'] };
    return null;
  }

  $('example').addEventListener('click', function () {
    var step = state.step;
    loadKit().then(function (KIT) {
      var ex = exampleFor(step, KIT);
      if (!ex) { setStatus(step === 2 ? '이 예시는 1단계 예시 앱에만 적용됩니다. 프롬프트를 보내 보세요.' : '이 단계에는 예시가 없습니다.'); return; }
      if (step === 2 && !state.base[2]) state.base[2] = Object.assign({}, state.files);
      state.history.push({ role: 'me', step: step, text: '(예시 결과 적용)' });
      applyFiles(ex.files, { role: 'ai', example: true, summary: ex.summary, tryList: ex.tryList });
      setStatus('예시 결과를 적용했습니다.');
    }, function () {
      setStatus('예시 파일을 불러오지 못했습니다. 인터넷 연결을 확인하고 다시 눌러 주세요.');
    });
  });

  // ---------- AI 호출 ----------
  var ctl = null;
  function setStatus(t) { $('status').textContent = t; }

  function buildRequest(userText) {
    var current = {};
    FILE_ORDER.forEach(function (n) { if (has(n)) current[n] = state.files[n]; });
    return [
      '너는 코딩 초보자를 위한 바이브코딩 실습실에서 코드를 쓰는 역할이야. 학습자는 영어 단어 카드 웹앱을 만들고 있어.',
      '',
      '규칙:',
      '- 순수 HTML, CSS, JavaScript만 쓴다. 외부 라이브러리, CDN, 서버, 빌드 도구는 쓰지 않는다.',
      '- 파일 이름은 index.html, style.css, app.js, manifest.json, sw.js 중에서만 쓴다. 아이콘 PNG는 만들지 않는다 (icon-192.png, icon-512.png는 실습실이 따로 넣는다).',
      '- index.html은 style.css와 app.js를 상대경로로 연결한다. 모든 경로는 상대경로로 쓴다.',
      '- 학습자가 요청하지 않은 기능은 바꾸지 않는다. 지금 되는 기능은 그대로 유지한다.',
      '- 휴대폰 화면을 먼저 생각하고, 넓은 화면에서도 보기 좋게 만든다. alert, confirm, prompt 대화상자는 쓰지 않는다.',
      '- 코드 안의 주석은 짧은 한국어로 쓴다.',
      '',
      '현재 단계: ' + state.step + '단계 (' + STEPS[state.step].title + ')',
      '현재 파일(JSON): ' + (Object.keys(current).length ? JSON.stringify(current) : '없음'),
      '',
      '학습자의 요청:',
      userText,
      '',
      '답은 JSON 하나로만 한다. 형식:',
      '{"files": [{"name": "파일이름", "content": "파일 전체 내용"}], "summary": "무엇을 바꿨는지 쉬운 한국어 2~3문장", "try": ["미리보기에서 확인할 일 1", "확인할 일 2"]}',
      'files에는 새로 만들거나 바꾼 파일만, 각 파일의 전체 내용을 넣는다.'
    ].join('\n');
  }

  function errorCopy(code) {
    switch (code) {
      case 'rate_limited': return '요청이 많습니다. 잠시 뒤에 다시 보내 주세요.';
      case 'invalid_json': return LabAI.name() + '의 답을 코드로 읽지 못했습니다. 한 번 더 보내 보세요.';
      case 'refused': return LabAI.name() + '가 이 요청은 하지 않겠다고 했습니다. 요청 내용을 바꿔 보세요.';
      case 'session_expired': return 'claude.ai에 다시 로그인한 뒤 보내 주세요.';
      case 'prompt_too_large': return '파일이 너무 커졌습니다. 처음부터 다시 하거나 요청을 줄여 보세요.';
      case 'empty_completion': return LabAI.name() + '가 아무것도 쓰지 않았습니다. 요청을 조금 더 구체적으로 바꿔 보세요.';
      case 'model_not_found': return '이 키로는 고른 모델을 쓸 수 없습니다. 키 설정에서 다른 모델을 골라 보세요.';
      case 'bad_key': return 'API 키가 맞지 않습니다. 키 설정에서 다시 확인해 주세요.';
      case 'truncated': return '답이 너무 길어 중간에 끊겼습니다. 요청을 나눠서 보내 보세요.';
      case 'network': return '인터넷에 연결되지 않았습니다. 연결을 확인하고 다시 보내 주세요.';
      case 'invalid_request': return LabAI.name() + '가 요청을 받지 않았습니다. 처음부터 다시 하거나 요청을 줄여 보세요.';
      default: return '연결이 끊겼습니다. 다시 보내 주세요.';
    }
  }
  var HIDE_CODES = ['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed'];

  function setAi() {
    var mode = LabAI.mode(), on = mode !== 'none';
    $('ai-state').textContent = mode === 'artifact' ? 'Claude 연결됨 (claude.ai)' : mode === 'key' ? LabAI.name() + ' 연결됨 (내 API 키)' : '예시 모드';
    $('ai-state').className = 'ai-state ' + (on ? 'on' : 'off');
    $('send').hidden = !on;
    $('ai-off-note').hidden = on;
    $('key-open').hidden = mode === 'artifact';
  }

  $('send').addEventListener('click', function () {
    var text = $('prompt').value.trim();
    if (!text) { setStatus('프롬프트를 먼저 적어 주세요.'); return; }
    if (LabAI.mode() === 'none') return;
    if (state.step === 2 && !state.base[2]) state.base[2] = Object.assign({}, state.files);
    state.history.push({ role: 'me', step: state.step, text: text });
    save(); renderLog();
    ctl = new AbortController();
    $('send').disabled = true; $('example').disabled = true; $('stop').hidden = false;
    var aiName = LabAI.name();
    setStatus(aiName + '가 생각하는 중…');
    LabAI.ask(buildRequest(text), {
      signal: ctl.signal,
      onProgress: function (t) { setStatus(t); }
    }).then(function (res) {
      applyFiles(res.files, { role: 'ai', ai: aiName, summary: res.summary, tryList: res.tryList });
      setStatus(lastChanged.length ? '적용했습니다. 미리보기에서 확인해 보세요.' : '바뀐 파일이 없습니다.');
    }).catch(function (e) {
      var code = e && e.code;
      if (code === 'cancelled') { setStatus('멈췄습니다.'); return; }
      if (HIDE_CODES.indexOf(code) >= 0) { LabAI.dropArtifact(); setAi(); setStatus(''); return; }
      setStatus(errorCopy(code));
    }).then(function () {
      $('send').disabled = false; $('example').disabled = false; $('stop').hidden = true; ctl = null;
    });
  });
  $('stop').addEventListener('click', function () { if (ctl) ctl.abort(); });

  // ---------- zip 내려받기 ----------
  function makeIcon(size) {
    return new Promise(function (resolve) {
      var c = document.createElement('canvas'); c.width = c.height = size;
      var g = c.getContext('2d');
      g.fillStyle = '#4f46e5'; g.fillRect(0, 0, size, size);
      var m = size * 0.22, r = size * 0.06, w = size - 2 * m;
      g.fillStyle = '#ffffff'; g.beginPath();
      g.moveTo(m + r, m); g.arcTo(m + w, m, m + w, m + w, r); g.arcTo(m + w, m + w, m, m + w, r);
      g.arcTo(m, m + w, m, m, r); g.arcTo(m, m, m + w, m, r); g.closePath(); g.fill();
      g.fillStyle = '#4f46e5'; g.font = 'bold ' + Math.round(size * 0.28) + 'px Arial, sans-serif';
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('Aa', size / 2, size / 2 + size * 0.01);
      c.toBlob(resolve, 'image/png');
    });
  }

  var downloads = null;
  function downloadZip() {
    var st = $('zip-status');
    if (!has('index.html')) { st.textContent = '먼저 1단계에서 앱을 만들어 주세요.'; return; }
    if (typeof JSZip === 'undefined') { st.textContent = 'zip 도구를 불러오지 못했습니다. 새로고침해 주세요.'; return; }
    if (LabAI.inArtifact() && !downloads) { st.textContent = '이 화면에서는 파일을 내려받을 수 없습니다. 코드 탭의 내용을 복사해 같은 이름의 파일로 저장해 주세요.'; return; }
    st.textContent = '파일을 묶는 중…';
    var zip = new JSZip();
    FILE_ORDER.forEach(function (n) { if (has(n)) zip.file(n, state.files[n]); });
    Promise.all([makeIcon(192), makeIcon(512)]).then(function (icons) {
      zip.file('icon-192.png', icons[0]); zip.file('icon-512.png', icons[1]);
      return zip.generateAsync({ type: 'blob' });
    }).then(function (blob) {
      if (downloads) return downloads.save({ filename: 'vocab-app.zip', data: blob });
      // 일반 브라우저: 링크를 만들어 눌러 준다
      var url = URL.createObjectURL(blob);
      var a = el('a', { href: url, download: 'vocab-app.zip' });
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 10000);
    }).then(function () {
      state.zipSaved = true; save();
      st.textContent = '내려받았습니다. 압축을 풀고 GitHub에 올려 주세요.';
      renderSteps(); renderChecks();
    }).catch(function (e) {
      var code = e && e.code;
      st.textContent = code === 'declined' ? '내려받기를 취소했습니다.' : code === 'rate_limited' ? '이미 내려받기 창이 열려 있습니다.' : '내려받지 못했습니다. 코드 탭의 내용을 복사해 저장해 주세요.';
    });
  }

  // ---------- API 키 설정 ----------
  function setupKeyPanel() {
    var prov = $('provider-select'), sel = $('model-select');
    function keyStatus(t) { $('key-status').textContent = t; }
    function fillProvider() {
      var p = prov.value, c = LabAI.PROVIDERS[p];
      sel.innerHTML = '';
      c.models.forEach(function (m) { sel.appendChild(el('option', { value: m.id, text: m.label })); });
      sel.value = LabAI.getModel(p);
      $('key-input').value = '';
      $('key-input').placeholder = LabAI.getKey(p) ? '저장된 ' + c.name + ' 키가 있습니다. 바꾸려면 새로 입력' : c.keyHint;
      $('key-remember').checked = LabAI.keyRemembered(p);
      $('key-page').href = c.keyPage;
      $('key-page').textContent = c.keyPageLabel;
    }
    prov.value = LabAI.getProvider();
    fillProvider();
    prov.addEventListener('change', function () {
      LabAI.setProvider(prov.value);
      fillProvider(); keyStatus(''); setAi();
    });
    sel.addEventListener('change', function () { LabAI.setModel(sel.value, prov.value); });
    $('key-open').addEventListener('click', function () {
      var p = $('key-panel');
      p.hidden = !p.hidden;
      $('key-open').setAttribute('aria-expanded', String(!p.hidden));
      if (!p.hidden) { prov.value = LabAI.getProvider(); fillProvider(); keyStatus(''); $('key-input').focus(); }
    });
    $('key-save').addEventListener('click', function () {
      var p = prov.value, k = $('key-input').value.trim();
      var problem = LabAI.PROVIDERS[p].checkKey(k);
      if (problem) { keyStatus(problem); return; }
      LabAI.setProvider(p);
      LabAI.setKey(k, $('key-remember').checked, p);
      $('key-input').value = '';
      keyStatus('저장했습니다. 이제 보내기를 누르면 ' + LabAI.PROVIDERS[p].name + '가 코드를 씁니다.');
      fillProvider(); setAi();
    });
    $('key-clear').addEventListener('click', function () {
      LabAI.clearKey(prov.value);
      keyStatus(LabAI.PROVIDERS[prov.value].name + ' 키를 지웠습니다.');
      fillProvider(); setAi();
    });
  }

  // ---------- 기타 버튼 ----------
  document.querySelectorAll('[data-dev]').forEach(function (b) {
    b.addEventListener('click', function () { state.dev = b.dataset.dev; save(); renderPreview(true); });
  });
  $('reload').addEventListener('click', function () { renderPreview(true); });
  $('copy-code').addEventListener('click', function () {
    var b = $('copy-code'), text = has(state.tab) ? state.files[state.tab] : '';
    if (!text) return;
    function selectAll() {
      var r = document.createRange(); r.selectNodeContents($('code'));
      var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
      b.textContent = 'Ctrl+C로 복사';
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        b.textContent = state.tab + ' 복사됨';
        setTimeout(function () { b.textContent = '이 파일 복사'; }, 1500);
      }, selectAll);
    } else selectAll();
  });
  $('clear-app').addEventListener('click', function () {
    try {
      Object.keys(localStorage).forEach(function (k) { if (k.indexOf('vibe-lab') !== 0) localStorage.removeItem(k); });
    } catch (e) {}
    renderPreview(true);
    setStatus('앱의 외운 기록을 지웠습니다.');
  });
  var resetArmed = false;
  $('reset-all').addEventListener('click', function () {
    var b = $('reset-all');
    if (!resetArmed) {
      resetArmed = true; b.textContent = '한 번 더 누르면 모두 지워집니다';
      setTimeout(function () { resetArmed = false; b.textContent = '처음부터 다시'; }, 3000);
      return;
    }
    resetArmed = false; b.textContent = '처음부터 다시';
    // API 키·서비스·모델 설정(vibe-lab-…)은 남기고 실습 기록과 앱 기록만 지운다
    try {
      Object.keys(localStorage).forEach(function (k) {
        if (k.indexOf('vibe-lab-') !== 0 || k === STORE) localStorage.removeItem(k);
      });
    } catch (e) {}
    state = freshState(); lastChanged = [];
    $('prompt').value = STEPS[1].prompt;
    save(); coach(); renderAll(true);
  });
  var rT = null;
  window.addEventListener('resize', function () { clearTimeout(rT); rT = setTimeout(function () { renderPreview(false); }, 120); });

  // ---------- 시작 ----------
  $('prompt').value = STEPS[state.step].prompt;
  coach();
  renderAll(true);
  $('send').hidden = true;
  setupKeyPanel();
  LabAI.detect().then(setAi, setAi);
  if (LabAI.inArtifact()) {
    window.claude.use('downloads').then(function (d) { downloads = d; }, function () {});
  }
  if ('serviceWorker' in navigator && window.isSecureContext && !LabAI.inArtifact()) {
    navigator.serviceWorker.register('sw.js').catch(function () {});
  }
})();
