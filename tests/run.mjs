// 시험 전체: 정답 키트 주요 흐름(3엔진·5환경) + 실습실(예시 모드·자기 키·claude.ai·오프라인)
// 실행: npm test   (먼저 npx playwright install chromium firefox webkit)
import { chromium, firefox, webkit, devices } from 'playwright';
import { startServer } from './serve.mjs';

const PORT = Number(process.env.PORT || 8765);
const BASE = `http://127.0.0.1:${PORT}/vibe-vocab-lab/`;
const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok: !!ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
}

let server = await startServer(PORT);
async function stopServer() {
  server.closeAllConnections?.();
  await new Promise(r => server.close(r));
}

async function waitForSW(page) {
  return page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return false;
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise(res => navigator.serviceWorker.addEventListener('controllerchange', res, { once: true }));
    }
    return true;
  }).catch(() => false);
}

// ---------- 1. 정답 키트 ----------
const KIT_TARGETS = [
  ['Chrome 데스크톱', chromium, { viewport: { width: 1280, height: 800 } }],
  ['Chrome Android 화면', chromium, devices['Pixel 7']],
  ['Firefox 데스크톱', firefox, { viewport: { width: 1280, height: 800 } }],
  ['Safari iPhone 화면', webkit, devices['iPhone 14']],
  ['Safari iPad 가로', webkit, devices['iPad Pro 11 landscape']],
];

for (const [name, type, opts] of KIT_TARGETS) {
  const browser = await type.launch();
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(BASE + 'kit/');
  await page.click('#card');
  check(`[키트 ${name}] F1 카드 뒤집기`, await page.evaluate(() => document.getElementById('card').classList.contains('flipped')));
  await page.click('#next-btn');
  const n = await page.textContent('#card-front');
  await page.click('#prev-btn');
  check(`[키트 ${name}] F2 이전·다음`, n === 'ability' && (await page.textContent('#card-front')) === 'abandon');
  await page.click('#mark-btn');
  check(`[키트 ${name}] F3 외웠어요 → 진도`, (await page.textContent('#progress-text')).startsWith('1 / 5'));
  await page.reload();
  check(`[키트 ${name}] F4 새로고침 후 유지`, (await page.textContent('#progress-text')).startsWith('1 / 5'));
  const wide = (opts.viewport?.width ?? 0) >= 860;
  const listVisible = await page.isVisible('.word-list');
  const noHScroll = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
  check(`[키트 ${name}] F6 넓은 화면 목록·가로 스크롤 없음`, (wide ? listVisible : !listVisible) && noHScroll);
  if (type !== webkit) {
    // WebKit은 Playwright 오프라인 흉내에서 내부 오류가 나서 마지막에 서버를 실제로 끄고 확인
    const sw = await waitForSW(page);
    await ctx.setOffline(true);
    let ok = false;
    try { await page.reload(); ok = sw && (await page.textContent('#progress-text')).startsWith('1 / 5'); } catch {}
    await ctx.setOffline(false);
    check(`[키트 ${name}] F5 오프라인 재실행`, ok);
  }
  check(`[키트 ${name}] 스크립트 오류 없음`, errors.length === 0, errors.join(' | '));
  await browser.close();
}

// ---------- 2. 실습실: 예시 모드 ----------
{
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 }, acceptDownloads: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(BASE);
  await page.waitForTimeout(300);
  check('[실습실 홈] 학생이 못 여는 claude.ai 데모 링크 없음', (await page.$$('a[href*="claude.ai/artifact"]')).length === 0);
  check('[실습실 예시] 시작 시 보내기 숨김·예시 모드 표시', await page.isHidden('#send') && (await page.textContent('#ai-state')).includes('예시'));
  await page.click('#example');
  await page.waitForSelector('#stage iframe');
  const fr = () => page.frameLocator('#stage iframe');
  check('[실습실 예시] 1단계 예시가 kit/ 파일로 미리보기에 뜸', (await fr().locator('#card-front').textContent()) === 'abandon');
  check('[실습실 예시] 1단계 자동 검사 5개 통과', (await page.$$eval('#checks .mark.pass', n => n.length)) === 5);
  check('[실습실 예시] 1단계용 index에는 manifest 연결이 없음', !(await page.evaluate(() => JSON.parse(localStorage.getItem('vibe-lab-v1')).files['index.html'].includes('manifest'))));
  await page.click('.step-tab >> nth=1');
  await page.click('#example');
  await page.waitForTimeout(200);
  check('[실습실 예시] 2단계 단어 10개로 바뀜', (await fr().locator('#progress-text').textContent()).startsWith('0 / 10'));
  await page.click('.step-tab >> nth=2');
  await page.click('#example');
  await page.waitForTimeout(200);
  check('[실습실 예시] 3단계 자동 검사 6개 통과', (await page.$$eval('#checks .mark.pass', n => n.length)) === 6);
  await page.click('.step-tab >> nth=3');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#zip')]);
  const zipPath = await dl.path();
  const names = await page.evaluate(async (b64) => {
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const z = await JSZip.loadAsync(bytes);
    return Object.keys(z.files).sort();
  }, (await import('node:fs')).readFileSync(zipPath).toString('base64'));
  check('[실습실 예시] zip 내려받기에 파일 7개', names.length === 7 && names.includes('icon-512.png') && names.includes('sw.js'), names.join(','));
  check('[실습실 예시] 스크립트 오류 없음', errors.length === 0, errors.join(' | '));
  await browser.close();
}

// ---------- 3. 실습실: 자기 API 키 (api.anthropic.com 가짜 응답) ----------
{
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const calls = [];
  let failFirst = true;
  await page.route('https://api.anthropic.com/v1/messages', async (route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors() });
    const body = JSON.parse(req.postData());
    calls.push({ headers: req.headers(), body });
    if (failFirst) { failFirst = false; return route.fulfill({ status: 400, headers: cors(), contentType: 'application/json', body: JSON.stringify({ type: 'error', error: { type: 'invalid_request_error', message: 'fallbacks not supported' } }) }); }
    const kitIdx = await (await fetch(BASE + 'kit/index.html')).text();
    const files = [
      { name: 'index.html', content: kitIdx.replace(/\s*<link rel="(manifest|icon|apple-touch-icon)"[^>]*>/g, '') },
      { name: 'style.css', content: await (await fetch(BASE + 'kit/style.css')).text() },
      { name: 'app.js', content: await (await fetch(BASE + 'kit/app.js')).text() },
    ];
    const text = JSON.stringify({ files, summary: '만들었습니다', try: ['카드 눌러 보기'] });
    return route.fulfill({ status: 200, headers: cors(), contentType: 'application/json', body: JSON.stringify({ content: [{ type: 'text', text }], stop_reason: 'end_turn' }) });
  });
  await page.goto(BASE);
  await page.click('#key-open');
  await page.fill('#key-input', 'not-a-key');
  await page.click('#key-save');
  check('[실습실 키] 형식이 틀린 키는 거절', (await page.textContent('#key-status')).includes('sk-ant-'));
  await page.fill('#key-input', 'sk-ant-test-123');
  await page.click('#key-save');
  check('[실습실 키] 저장 후 보내기 버튼·연결 표시', await page.isVisible('#send') && (await page.textContent('#ai-state')).includes('API 키'));
  check('[실습실 키] "기억" 끄면 localStorage에 키 없음', await page.evaluate(() => !localStorage.getItem('vibe-lab-api-key') && sessionStorage.getItem('vibe-lab-api-key') === 'sk-ant-test-123'));
  await page.click('#send');
  await page.waitForSelector('#stage iframe', { timeout: 15000 });
  await page.waitForTimeout(300);
  check('[실습실 키] 응답 파일이 미리보기에 적용', (await page.frameLocator('#stage iframe').locator('#card-front').textContent()) === 'abandon');
  const h = calls[0]?.headers || {};
  check('[실습실 키] 헤더 3개 전송', h['x-api-key'] === 'sk-ant-test-123' && h['anthropic-version'] === '2023-06-01' && h['anthropic-dangerous-direct-browser-access'] === 'true');
  check('[실습실 키] 첫 요청: 기본 모델·JSON 스키마·fallbacks', calls[0]?.body.model === 'claude-opus-5-5' && !!calls[0]?.body.output_config?.format && calls[0]?.body.fallbacks === 'default');
  check('[실습실 키] 400이면 추가 설정 없이 한 번만 재시도', calls.length === 2 && !calls[1].body.fallbacks && !calls[1].body.output_config);
  // 처음부터 다시 해도 키는 남음
  await page.click('#reset-all'); await page.click('#reset-all');
  check('[실습실 키] 처음부터 다시 해도 키 유지', await page.evaluate(() => sessionStorage.getItem('vibe-lab-api-key') === 'sk-ant-test-123') && await page.isVisible('#send'));
  check('[실습실 키] 스크립트 오류 없음', errors.length === 0, errors.join(' | '));
  await browser.close();
}

// ---------- 3b. 실습실: 자기 Gemini 키 (generativelanguage.googleapis.com 가짜 응답) ----------
{
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const calls = [];
  let mode = 'badkey';
  await page.route('https://generativelanguage.googleapis.com/**', async (route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors() });
    calls.push({ url: req.url(), headers: req.headers(), body: JSON.parse(req.postData()) });
    const json = (status, obj) => route.fulfill({ status, headers: cors(), contentType: 'application/json', body: JSON.stringify(obj) });
    if (mode === 'badkey') return json(400, { error: { code: 400, message: 'API key not valid. Please pass a valid API key.', status: 'INVALID_ARGUMENT' } });
    if (mode === 'schema400') { mode = 'ok'; return json(400, { error: { code: 400, message: 'Invalid JSON payload received. Unknown name "responseJsonSchema"', status: 'INVALID_ARGUMENT' } }); }
    const files = [
      { name: 'index.html', content: '<!doctype html><html><head><link rel="stylesheet" href="style.css"></head><body><h1 id="g">gemini</h1><script src="app.js"></script></body></html>' },
      { name: 'style.css', content: 'h1{color:green}' },
      { name: 'app.js', content: 'localStorage.setItem("g","1")' }
    ];
    return json(200, { candidates: [{ content: { role: 'model', parts: [{ text: JSON.stringify({ files, summary: '제미나이가 만들었습니다', try: [] }) }] }, finishReason: 'STOP' }] });
  });
  await page.goto(BASE);
  await page.click('#key-open');
  await page.selectOption('#provider-select', 'gemini');
  check('[실습실 Gemini] 서비스를 바꾸면 Gemini 모델 목록', (await page.$$eval('#model-select option', o => o.map(x => x.value))).join() === 'gemini-3.8-flash,gemini-3.5-flash-lite');
  await page.fill('#key-input', 'sk-ant-wrong-service-key');
  await page.click('#key-save');
  check('[실습실 Gemini] Claude 키를 넣으면 알려 줌', (await page.textContent('#key-status')).includes('Claude 키'));
  await page.fill('#key-input', 'AIzaSyTEST_KEY_1234567890');
  await page.click('#key-save');
  check('[실습실 Gemini] 저장 후 Gemini 연결 표시', (await page.textContent('#ai-state')).includes('Gemini') && await page.isVisible('#send'));
  await page.click('#send');
  await page.waitForFunction(() => /키가 맞지 않습니다/.test(document.getElementById('status').textContent), null, { timeout: 10000 });
  check('[실습실 Gemini] 틀린 키(400 "API key")는 재시도 없이 키 오류', calls.length === 1);
  mode = 'schema400';
  await page.click('#send');
  await page.waitForSelector('#stage iframe', { timeout: 15000 });
  await page.waitForTimeout(300);
  check('[실습실 Gemini] 응답 파일이 미리보기에 적용', (await page.frameLocator('#stage iframe').locator('#g').textContent()) === 'gemini');
  const first = calls[1], second = calls[2];
  check('[실습실 Gemini] 헤더 x-goog-api-key·주소에 키 없음', first?.headers['x-goog-api-key'] === 'AIzaSyTEST_KEY_1234567890' && !first.url.includes('key='));
  check('[실습실 Gemini] 기본 모델·JSON 출력·스키마', first?.url.includes('/models/gemini-3.8-flash:generateContent') && first.body.generationConfig.responseMimeType === 'application/json' && !!first.body.generationConfig.responseJsonSchema);
  check('[실습실 Gemini] 스키마 400이면 스키마 없이 한 번 재시도', calls.length === 3 && !second.body.generationConfig.responseJsonSchema && second.body.generationConfig.responseMimeType === 'application/json');
  check('[실습실 Gemini] 대화 기록에 Gemini로 표시', (await page.$$eval('#log .msg.ai .who', n => n.map(x => x.textContent))).includes('Gemini'));
  check('[실습실 Gemini] Claude 키 저장소는 비어 있음', await page.evaluate(() => !sessionStorage.getItem('vibe-lab-api-key') && !localStorage.getItem('vibe-lab-api-key')));
  check('[실습실 Gemini] 스크립트 오류 없음', errors.length === 0, errors.join(' | '));
  await browser.close();
}

// ---------- 4. 실습실: claude.ai 안 (window.claude 흉내) ----------
{
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(() => {
    const sample = async () => ({});
    sample.json = async () => ({ files: [{ name: 'index.html', content: '<!doctype html><html><head><link rel="stylesheet" href="style.css"></head><body><h1 id="t">hi</h1><script src="app.js"></script></body></html>' }, { name: 'style.css', content: 'h1{color:red}' }, { name: 'app.js', content: 'localStorage.setItem("x","1")' }], summary: 'ok', try: [] });
    window.claude = { use: async (n) => n === 'sample' ? sample : null };
  });
  await page.goto(BASE);
  await page.waitForTimeout(400);
  check('[실습실 claude.ai] 연결 표시·키 버튼 숨김', (await page.textContent('#ai-state')).includes('claude.ai') && await page.isHidden('#key-open'));
  await page.click('#send');
  await page.waitForSelector('#stage iframe');
  check('[실습실 claude.ai] 응답 적용', (await page.frameLocator('#stage iframe').locator('#t').textContent()) === 'hi');
  check('[실습실 claude.ai] 스크립트 오류 없음', errors.length === 0, errors.join(' | '));
  await browser.close();
}

// ---------- 5. 실습실 PWA: 오프라인 (Chromium 흉내) ----------
{
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 } });
  const page = await ctx.newPage();
  await page.goto(BASE);
  const sw = await waitForSW(page);
  const manifest = await page.evaluate(async () => (await fetch('manifest.webmanifest')).json()).catch(() => null);
  check('[실습실 PWA] manifest start_url ./ · 아이콘 2개', manifest && manifest.start_url === './' && manifest.icons?.length >= 2);
  await ctx.setOffline(true);
  let ok = false;
  try {
    await page.reload();
    await page.click('#example');
    await page.waitForSelector('#stage iframe', { timeout: 5000 });
    ok = sw && (await page.frameLocator('#stage iframe').locator('#card-front').textContent()) === 'abandon';
  } catch {}
  await ctx.setOffline(false);
  check('[실습실 PWA] 오프라인에서 열리고 예시 모드 동작', ok);
  for (const path of ['lecture/', 'native/']) {
    const r = await page.goto(BASE + path);
    check(`[페이지] /${path} 열림`, r && r.status() === 200 && (await page.title()).length > 0);
  }
  await browser.close();
}

// ---------- 5b. 앱 포장 데모 + PWA 용어 설명 ----------
{
  const browser = await chromium.launch();
  for (const [name, vp] of [['컴퓨터', { width: 1400, height: 1000 }], ['휴대폰', { width: 390, height: 900 }]]) {
    const page = await browser.newPage({ viewport: vp, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(BASE + 'native/demo/');
    check(`[포장 데모 ${name}] 첫 단계 터미널에 npm init`, (await page.textContent('#term')).includes('npm init -y'));
    for (let i = 0; i < 7; i++) await page.click('#next');
    check(`[포장 데모 ${name}] 8단계까지 진행·실제 오류 출력`, (await page.textContent('#ex-step')).includes('8 / 8') && (await page.textContent('#term')).includes('ERR_SDK_NOT_FOUND'));
    check(`[포장 데모 ${name}] 폴더에 android·ios`, (await page.textContent('#tree')).includes('android/') && (await page.textContent('#tree')).includes('ios/'));
    const front = await page.frameLocator('#phone-screen iframe').locator('#card-front').textContent({ timeout: 8000 }).catch(() => null);
    check(`[포장 데모 ${name}] 휴대폰 화면에 키트 앱`, front === 'abandon');
    await page.click('#rail button >> nth=2');
    check(`[포장 데모 ${name}] 단계 띠로 이동 (3단계 cap init)`, (await page.textContent('#term')).includes('cap init') && await page.isVisible('#peek'));
    // Claude Code 상자: 8단계 모두 보이고, 그 단계의 핵심 명령이 터미널과 Claude Code 화면 양쪽에 있다
    const ccBad = [];
    for (let i = 0; i < 8; i++) {
      await page.click(`#rail button >> nth=${i}`);
      const r = await page.evaluate((i) => {
        const s = window.demoSteps[i];
        const termCmds = s.lines.filter(l => l[0] === '$').map(l => l[1]).join('\n');
        return {
          visible: !!document.getElementById('cc-body').offsetParent,
          prompt: document.getElementById('cc-prompt').textContent.trim().length,
          inTerm: termCmds.includes(s.cc.run),
          inCC: document.getElementById('cc-body').textContent.includes(s.cc.run)
        };
      }, i);
      if (!(r.visible && r.prompt > 10 && r.inTerm && r.inCC)) ccBad.push(i + 1 + ':' + JSON.stringify(r));
    }
    check(`[포장 데모 ${name}] 8단계 모두 Claude Code 상자·명령 일치`, ccBad.length === 0, ccBad.join(' '));
    check(`[포장 데모 ${name}] 가로 스크롤 없음`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    check(`[포장 데모 ${name}] 스크립트 오류 없음`, errors.length === 0, errors.join(' | '));
    await page.close();
  }
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  const has = async () => (await page.textContent('body')).includes('Progressive Web App');
  await page.goto(BASE); await page.click('.step-tab >> nth=2');
  check('[PWA 용어] 실습실 3단계에 Progressive Web App 설명', await has() && (await page.locator('#mission-ref .term-note').count()) > 0);
  await page.goto(BASE + 'lecture/'); check('[PWA 용어] 강의 지도안에 설명', await has());
  await page.goto(BASE + 'native/'); check('[PWA 용어] 포장 지침에 설명 + 데모 링크', await has() && await page.isVisible('a[href="demo/"].go'));
  // "모바일 우선" 버튼
  check('[모바일 우선 버튼] 포장 지침', await page.isVisible('#mobile-first') && (await page.getAttribute('#mobile-first', 'href')) === '../mobile/');
  await page.goto(BASE + 'native/demo/');
  check('[모바일 우선 버튼] 포장 데모', await page.isVisible('#mobile-first') && (await page.getAttribute('#mobile-first', 'href')) === '../../mobile/');
  await page.goto(BASE);
  check('[모바일 우선 버튼] 실습실 메뉴', await page.isVisible('nav.links a[href="mobile/"]'));
  await browser.close();
}

// ---------- 5d. 개발 순서 흐름도 + 메뉴 ----------
{
  const browser = await chromium.launch();
  for (const [name, vp] of [['컴퓨터', { width: 1400, height: 1000 }], ['휴대폰', { width: 390, height: 900 }]]) {
    const page = await browser.newPage({ viewport: vp });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(BASE + 'path/');
    const total = await page.$$eval('.node[data-id]', n => n.length);
    check(`[개발 순서 ${name}] 상자 ${total}개·처음 다음 표시는 준비`, total === 15 && (await page.getAttribute('.node.is-next', 'data-id')) === 'prep');
    // 버튼이 가리키는 페이지와 #앵커가 실제로 있는지
    const links = await page.$$eval('.node a.go', as => [...new Set(as.map(a => a.href))]);
    const broken = [];
    const probe = await browser.newPage();
    for (const href of links) {
      const u = new URL(href);
      const r = await probe.goto(u.origin + u.pathname);
      if (!r || r.status() !== 200) { broken.push(href + ' ' + (r && r.status())); continue; }
      if (u.hash && !/^#step\d$/.test(u.hash)) {
        if (!(await probe.$(u.hash))) broken.push(href + ' (앵커 없음)');
      }
    }
    await probe.close();
    check(`[개발 순서 ${name}] 버튼 ${links.length}개가 모두 있는 페이지·앵커로`, broken.length === 0, broken.join(' | '));
    // 체크하면 진행이 오르고, 다음 표시가 넘어가고, 다시 열어도 남는다
    await page.click('.node[data-id="prep"] input');
    await page.click('.node[data-id="s1"] input');
    const c1 = await page.textContent('#count');
    const next1 = await page.getAttribute('.node.is-next', 'data-id');
    await page.reload();
    check(`[개발 순서 ${name}] 체크 저장·다음 표시 이동`, c1 === '2 / 15' && next1 === 's2' && (await page.textContent('#count')) === '2 / 15');
    check(`[개발 순서 ${name}] 갈림길 그림 (넓으면 보이고 좁으면 갈래 이름)`, vp.width > 860 ? await page.isVisible('svg.fork') : (await page.isHidden('svg.fork')) && await page.isVisible('.branch-label'));
    check(`[개발 순서 ${name}] 가로 스크롤 없음`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    check(`[개발 순서 ${name}] 스크립트 오류 없음`, errors.length === 0, errors.join(' | '));
    await page.close();
  }
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  const navBad = [];
  for (const path of ['', 'lecture/', 'native/', 'native/demo/', 'mobile/', 'easy/']) {
    await page.goto(BASE + path);
    const href = await page.$eval('nav.links .nav-path, nav.top .nav-path', a => a.href || '').catch(() => null);
    const items = await page.$$eval('nav[aria-label="수업 자료"] a, nav[aria-label="수업 자료"] b', n => n.map(x => x.textContent.trim()));
    if (!href || !href.endsWith('/vibe-vocab-lab/path/') || items[0] !== '개발 순서' || items.length < 8) navBad.push(path + ':' + items.join('|'));
  }
  check('[메뉴] 모든 페이지 맨 앞에 개발 순서 버튼', navBad.length === 0, navBad.join(' / '));
  // 쉬운 버전: 모든 메뉴에 있고, 페이지의 링크가 살아 있고, 체크가 저장된다
  const easyMissing = [];
  for (const path of ['', 'lecture/', 'native/', 'native/demo/', 'mobile/', 'path/', 'check/']) {
    await page.goto(BASE + path);
    const ok = await page.$$eval('nav[aria-label="수업 자료"] a', as => as.some(a => a.textContent.trim() === '쉬운 버전' && a.href.endsWith('/vibe-vocab-lab/easy/')));
    if (!ok) easyMissing.push(path || '/');
  }
  check('[쉬운 버전] 모든 페이지 메뉴에 쉬운 버전 링크', easyMissing.length === 0, easyMissing.join(', '));
  for (const [name, vp] of [['컴퓨터', { width: 1400, height: 1000 }], ['휴대폰', { width: 390, height: 900 }]]) {
    const ep = await browser.newPage({ viewport: vp });
    const errs = [];
    ep.on('pageerror', e => errs.push(e.message));
    await ep.goto(BASE + 'easy/');
    check(`[쉬운 버전 ${name}] 단계 5개·가로 스크롤 없음·스크립트 오류 없음`, (await ep.$$eval('.step', n => n.length)) === 5 && await ep.evaluate(() => document.documentElement.scrollWidth <= innerWidth) && errs.length === 0, errs.join(' | '));
    await ep.close();
  }
  const ep = await browser.newPage();
  await ep.goto(BASE + 'easy/');
  const easyLinks = await ep.$$eval('a[href]', as => [...new Set(as.map(a => a.href).filter(h => h.includes('/vibe-vocab-lab/')))]);
  const easyBroken = [];
  for (const href of easyLinks) {
    const u = new URL(href);
    const r = await page.goto(u.origin + u.pathname + u.search);
    if (!r || r.status() !== 200) easyBroken.push(href + ' ' + (r && r.status()));
    else if (u.hash && !/^#step\d$/.test(u.hash) && u.pathname.endsWith('/easy/') && !(await page.$(u.hash))) easyBroken.push(href + ' (앵커 없음)');
  }
  check(`[쉬운 버전] 링크 ${easyLinks.length}개가 모두 열림`, easyBroken.length === 0, easyBroken.join(' | '));
  await ep.click('#k1');
  await ep.reload();
  check('[쉬운 버전] 체크가 저장되고 진행 표시가 오름', (await ep.isChecked('#k1')) && (await ep.textContent('#p-lab')) === '1 / 5 완료');
  // 4단계 올릴 곳 세 가지: 처음은 GitHub, 고르면 안내·그림이 함께 바뀌고 다시 열어도 남음
  const hostState = () => ep.evaluate(() => ['github', 'netlify', 'vercel'].map(h =>
    [h, document.querySelector(`.host-pick button[data-host="${h}"]`).getAttribute('aria-pressed'),
      !document.querySelector(`.host-panel[data-host="${h}"]`).hidden, !document.querySelector(`.host-art[data-host="${h}"]`).hidden].join(':')).join(' '));
  const h0 = await hostState();
  await ep.click('.host-pick button[data-host="netlify"]');
  const h1 = await hostState();
  await ep.reload();
  const h2 = await hostState();
  // 만들 곳: 생성형 AI를 고르면 0~3단계가 채팅 방식으로, 실습실 칸은 숨고, 다시 열어도 남음
  {
    const ap = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
    await ap.goto(BASE + 'easy/');
    const lab0 = (await ap.isVisible('#e1 .m-lab')) && (await ap.isHidden('#e1 .m-ai')) && (await ap.isVisible('#labframe'));
    await ap.click('.mode-pick button[data-mode="ai"]');
    await ap.reload();
    const ai1 = (await ap.isHidden('#e1 .m-lab')) && (await ap.isVisible('#e1 .m-ai')) && (await ap.isHidden('#labpane')) && (await ap.isHidden('#e4 a.go-lab'))
      && (await ap.getAttribute('.mode-pick button[data-mode="ai"]', 'aria-pressed')) === 'true';
    const wideOk = await ap.evaluate(() => document.querySelector('.guide').getBoundingClientRect().width > 1300);
    // 쉬운 버전 프롬프트 = 실습실 프롬프트(+ "전체 코드" 한 줄)
    const easyP = await ap.$$eval('.m-ai .bubble .txt', n => n.map(x => x.textContent));
    const labP = [];
    for (const n of [1, 2, 3]) { await ap.goto(BASE + '#step' + n); await ap.waitForTimeout(200); labP.push(await ap.inputValue('#prompt')); }
    const same = labP.every(p => p.length > 40 && easyP.some(e => e.startsWith(p + '\n\n')));
    check('[쉬운 버전] 생성형 AI로 하기: 안내 바뀜·실습실 칸 숨김·기억·프롬프트가 실습실과 같음', lab0 && ai1 && wideOk && same, JSON.stringify({ lab0, ai1, wideOk, same }));
    await ap.close();
  }
  check('[쉬운 버전] 4단계 올릴 곳 세 가지 고르기', h0 === 'github:true:true:true netlify:false:false:false vercel:false:false:false' && h1 === 'github:false:false:false netlify:true:true:true vercel:false:false:false' && h2 === h1, [h0, h1, h2].join(' / '));
  await ep.close();
  // 실습실을 쉬운 버전 안에서 연다: 넓으면 오른쪽에 늘, 좁으면 덮어 열고 닫으면 보던 자리로
  const labTitle = async (pg) => {
    const fr = pg.frame({ url: /\/vibe-vocab-lab\/(#step\d)?$/ });
    if (!fr) return null;
    await fr.waitForFunction(() => document.querySelector('#mission h2'), null, { timeout: 5000 }).catch(() => {});
    return fr.textContent('#mission h2').catch(() => null);
  };
  {
    const wp = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
    await wp.goto(BASE + 'easy/');
    const shown = await wp.isVisible('#labframe');
    await wp.click('#e2 a.go-lab');
    await wp.waitForTimeout(800);
    const t2 = await labTitle(wp);
    const box = await wp.$eval('#labframe', f => { const r = f.getBoundingClientRect(); return { x: r.x, w: r.width }; });
    check('[쉬운 버전 컴퓨터] 실습실이 오른쪽에 함께 보이고 2단계 버튼으로 2단계', shown && t2 === '내 앱으로' && box.x > 600 && box.w >= 560 && wp.url().endsWith('/easy/'), JSON.stringify({ shown, t2, box, url: wp.url() }));
    await wp.close();
  }
  {
    const mp = await browser.newPage({ viewport: { width: 390, height: 900 } });
    await mp.goto(BASE + 'easy/');
    const hidden0 = await mp.isHidden('#labpane');
    await mp.$eval('#e3', el => el.scrollIntoView());
    const y0 = await mp.evaluate(() => scrollY);
    await mp.click('#e3 a.go-lab');
    await mp.waitForTimeout(800);
    const open = await mp.isVisible('#labframe');
    const t3 = await labTitle(mp);
    await mp.click('#lab-close');
    const y1 = await mp.evaluate(() => scrollY);
    check('[쉬운 버전 휴대폰] 버튼 → 실습실 3단계가 위에 열림 → 돌아가기로 보던 자리', hidden0 && open && t3 === 'PWA로' && (await mp.isHidden('#labpane')) && Math.abs(y1 - y0) < 5 && mp.url().endsWith('/easy/'), JSON.stringify({ hidden0, open, t3, y0, y1 }));
    await mp.close();
  }
  // 학생 걷기 점검에서 고친 것들
  {
    const wp = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await wp.goto(BASE + 'easy/');
    await wp.waitForTimeout(400);
    // 실습실 칸 안 메뉴의 "쉬운 버전"을 눌러도 쉬운 버전이 겹쳐 열리지 않고 실습실로 돌아옴
    const lab = wp.frame({ url: /\/vibe-vocab-lab\/(#step\d)?$/ });
    await lab.click('nav.links a[href="easy/"]');
    await wp.waitForTimeout(1500);
    const nested = wp.frames().some(f => /\/easy\/$/.test(f.url()) && f !== wp.mainFrame());
    const back = wp.frames().some(f => /\/vibe-vocab-lab\/#step1$/.test(f.url()));
    // 크게 보기: 실습실 칸이 980px를 넘어 두 칸 배치가 됨, 다시 열어도 남음
    const w0 = await wp.$eval('#labframe', f => f.getBoundingClientRect().width);
    await wp.click('#lab-big');
    await wp.reload(); await wp.waitForTimeout(300);
    const w1 = await wp.$eval('#labframe', f => f.getBoundingClientRect().width);
    const noScroll = await wp.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
    // 완성된 앱 보기: 페이지를 떠나지 않고 오른쪽 칸에 키트
    await wp.click('a[data-pane-url]');
    await wp.waitForTimeout(800);
    const kitIn = wp.frames().some(f => /\/kit\/$/.test(f.url())) && wp.url().endsWith('/easy/');
    // 생성형 AI 쪽에서는 키트가 위에 덮여 열리고 돌아가기로 닫힘
    await wp.click('.mode-pick button[data-mode="ai"]');
    const hiddenAi = await wp.isHidden('#labpane');
    await wp.click('a[data-pane-url]');
    await wp.waitForTimeout(500);
    const overAi = await wp.isVisible('#labframe') && await wp.isVisible('#lab-close');
    await wp.click('#lab-close');
    const closedAi = await wp.isHidden('#labpane');
    check('[쉬운 버전] 겹쳐 열림 막기·크게 보기·완성 앱을 페이지 안에서', !nested && back && w0 < 980 && w1 > 980 && noScroll && kitIn && hiddenAi && overAi && closedAi, JSON.stringify({ nested, back, w0, w1, noScroll, kitIn, hiddenAi, overAi, closedAi }));
    // 용어 풀이: 그림·복사할 글·버튼 이름에는 없고, 보이는 칸마다 있음 (생성형 AI 쪽 포함)
    const inNo = await wp.$$eval('[data-no-gloss] .gloss, .bubble .gloss, .lab .gloss, .chatmock .gloss, .foldermock .gloss, .press .gloss', n => n.length);
    const aiVis = await wp.$$eval('.m-ai .gloss', n => n.filter(g => g.offsetParent !== null && g.textContent).map(g => g.textContent));
    await wp.click('.mode-pick button[data-mode="lab"]');
    await wp.waitForTimeout(200);
    const labVis = await wp.$$eval('.gloss', n => n.filter(g => g.offsetParent !== null && g.textContent).length);
    check('[용어 풀이] 쉬운 버전: 그림·프롬프트에 없음, 실습실 쪽·생성형 AI 쪽 모두 보임', inNo === 0 && labVis >= 10 && aiVis.length >= 3, JSON.stringify({ inNo, labVis, ai: aiVis.length }));
    await wp.close();
  }
  await page.goto(BASE + '#step3');
  check('[실습실] #step3 으로 3단계 바로 열기', (await page.textContent('#mission h2')) === 'PWA로');
  await page.goto(BASE);
  check('[실습실 홈] 개발 순서 버튼', (await page.getAttribute('#path-btn', 'href')) === 'path/' && await page.isVisible('#path-btn'));
  await browser.close();
}

// ---------- 5e. 용어 풀이 (glossary.js) ----------
{
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 }, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  // 한 범위에서 같은 용어는 한 번, 금지 구역에는 없음
  const audit = () => page.evaluate(() => {
    const bad = [], seen = new Map();
    document.querySelectorAll('.gloss').forEach(g => {
      const scope = g.closest('[data-gloss-scope]') || document.body;
      const key = g.dataset.term;
      if (!seen.has(scope)) seen.set(scope, new Set());
      if (seen.get(scope).has(key)) bad.push('중복 ' + window.GLOSSARY[key][1]);
      seen.get(scope).add(key);
      if (g.parentElement.closest('pre, code, button, nav, h1, h2, h3, textarea, .cc-prompt, .terminal, .cc-body, .tree, a')) bad.push('금지 구역 ' + window.GLOSSARY[key][1]);
      if (g.textContent !== '' && !/^ \(.+\)$/.test(g.textContent)) bad.push('모양 ' + g.textContent); // 빈 것 = 상자 안에서 이름이 같아 생략
    });
    return { n: document.querySelectorAll('.gloss').length, bad };
  });
  const pages = [['', '실습실'], ['lecture/', '강의 지도안'], ['native/', '포장 지침'], ['native/demo/', '포장 데모'], ['mobile/', '모바일 우선'], ['path/', '개발 순서'], ['easy/', '쉬운 버전']];
  const res = [];
  for (const [path, name] of pages) {
    await page.goto(BASE + path); await page.waitForTimeout(250);
    const r = await audit();
    res.push(name + ' ' + r.n + '개');
    check(`[용어 풀이] ${name}: 풀이 있음·범위마다 한 번·금지 구역 없음`, r.n >= 3 && r.bad.length === 0, r.bad.join(' | '));
  }
  console.log('      (' + res.join(', ') + ')');
  // 강의 지도안 개념 카드: 바로 뒤에 설명이 있으니 영어 이름만
  await page.goto(BASE + 'lecture/'); await page.waitForTimeout(250);
  const concept = await page.$$eval('.concept .file', n => n.map(x => x.textContent));
  check('[용어 풀이] 개념 카드는 영어 이름만', concept[0] === '바이브코딩 (Vibe Coding)' && concept[1].includes('HTML (HyperText Markup Language)') && concept[1].includes('JS (JavaScript)') && concept[2] === 'PWA' && (await page.textContent('.concept:nth-child(3) .term-note')).includes('Progressive Web App'), concept.join(' / ')); // PWA 카드는 바로 아래 풀이 상자가 있어 겹쳐 달지 않음
  // 복사하는 프롬프트는 그대로
  const pre = await page.$$eval('.prompt pre', n => n.map(x => x.textContent).join('\n'));
  check('[용어 풀이] 지도안 프롬프트에 풀이가 섞이지 않음', !pre.includes('(Prompt:') && !pre.includes('(Web App Manifest'));
  await page.goto(BASE + '#step3'); await page.waitForTimeout(250);
  check('[용어 풀이] 실습실 프롬프트 칸은 그대로', (await page.inputValue('#prompt')).startsWith('이 앱을 휴대폰 홈 화면에 설치할 수 있는 PWA로 만들어 줘.') && !(await page.inputValue('#prompt')).includes('(Service Worker'));
  check('[용어 풀이] 실습실 3단계 설명에 서비스 워커 풀이', (await page.textContent('#mission')).includes('Service Worker'));
  // 단계를 옮기면 그 단계 설명 칸에 다시 붙는다
  await page.goto(BASE + 'mobile/'); await page.waitForTimeout(250);
  for (let i = 0; i < 5; i++) await page.click('#next');
  await page.waitForTimeout(250);
  check('[용어 풀이] 모바일 우선 6단계 설명 칸에도 풀이', (await page.$$eval('.explain .gloss', n => n.length)) >= 1 && (await audit()).bad.length === 0);
  await page.goto(BASE + 'native/demo/'); await page.waitForTimeout(250);
  const copyText = await page.textContent('#cc-prompt');
  check('[용어 풀이] 포장 데모 Claude Code 프롬프트는 그대로', copyText.startsWith('vocab-native라는 새 폴더를') && !/\((Terminal|Node Package Manager|AI coding agent):/.test(copyText));
  check('[용어 풀이] 스크립트 오류 없음', errors.length === 0, errors.join(' | '));
  await browser.close();
}

// ---------- 5f. 위쪽 설명 상자 + 페이지 기본 정보 ----------
{
  const browser = await chromium.launch();
  const bad = [];
  for (const [vw, scheme] of [[1280, 'light'], [360, 'dark']]) {
    const page = await browser.newPage({ viewport: { width: vw, height: 800 }, colorScheme: scheme, reducedMotion: 'reduce' });
    for (const path of ['', 'lecture/', 'native/', 'native/demo/', 'mobile/', 'path/']) {
      await page.goto(BASE + path); await page.waitForTimeout(300);
      const r = await page.evaluate(() => {
        document.querySelectorAll('header details').forEach(d => { d.open = true; });
        const box = document.querySelector('header .intro');
        if (!box) return { box: false };
        const inline = [...box.querySelectorAll(':scope > :not(.gloss-list) .gloss')].map(g => g.dataset.term);
        const listed = box.querySelectorAll('.gloss-list .term-note').length;
        // 용어 상자 안의 이름 알약과 설명이 한 덩어리로 이어지는지(링크가 섞여도 줄이 깨지지 않음)
        const notes = [...box.querySelectorAll('.term-note')].every(n => getComputedStyle(n).display === 'block');
        return { box: box.offsetHeight > 0, inline: inline.length, listed, notes, desc: !!document.querySelector('meta[name=description]'), icon: !!document.querySelector('link[rel=icon]'), noScroll: document.documentElement.scrollWidth <= innerWidth };
      });
      if (!(r.box && r.inline === r.listed && r.notes && r.desc && r.icon && r.noScroll)) bad.push(`${vw}${scheme[0]} /${path} ${JSON.stringify(r)}`);
    }
    await page.close();
  }
  check('[설명 상자] 모든 페이지 위쪽 상자·용어 목록 개수 일치·기본 정보·가로 스크롤 없음', bad.length === 0, bad.join(' | '));
  await browser.close();
}

// ---------- 5f2. 실습실 간결 화면: 할 일 목록 + 접힌 참고 ----------
{
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
  await page.goto(BASE); await page.waitForTimeout(400);
  const r = await page.evaluate(() => ({
    steps: document.querySelectorAll('#mission ol.do-steps li').length,
    exampleFirst: document.querySelector('#mission ol.do-steps').textContent.includes('예시 결과 적용'),
    primary: document.getElementById('example').classList.contains('primary'),
    closed: ['about-ref', 'mission-ref', 'log-ref'].every(id => { const d = document.getElementById(id); return d && !d.open; }),
    noScroll: document.documentElement.scrollWidth <= innerWidth
  }));
  check('[간결 화면] 예시 모드: 할 일 목록·예시 버튼 강조·참고는 접힘', r.steps >= 1 && r.steps <= 3 && r.exampleFirst && r.primary && r.closed && r.noScroll, JSON.stringify(r));
  await page.click('#example'); await page.waitForSelector('#stage iframe'); await page.waitForTimeout(600);
  const sum = await page.textContent('#auto-checks > summary');
  check('[간결 화면] 코드 자동 검사는 한 줄 요약', /통과/.test(sum), sum);
  await page.click('#mission-ref > summary');
  check('[간결 화면] 참고를 열면 용어 목록', (await page.locator('#mission-ref [data-gloss-list] .term-note').count()) > 0);
  await browser.close();
}

// ---------- 5f3. 개발 순서 읽기 쉽게: 설명 문장에는 영어 이름만, 풀이는 상자 아래 접힘 ----------
{
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
  await page.goto(BASE + 'path/'); await page.waitForTimeout(400);
  const r = await page.evaluate(() => {
    const long = [...document.querySelectorAll('.node .what .gloss, .branch .head .gloss, .decision .q .gloss')].filter(g => g.textContent.includes(':')).length;
    const shown = [...document.querySelectorAll('details.terms')].filter(d => !d.hidden);
    return { long, shown: shown.length, empty: shown.filter(d => !d.querySelector('.term-note')).length, closed: shown.every(d => !d.open) };
  });
  check('[개발 순서 읽기] 설명 문장에 긴 풀이 없음·용어 풀이는 상자마다 접힘', r.long === 0 && r.shown >= 10 && r.empty === 0 && r.closed, JSON.stringify(r));
  await browser.close();
}

// ---------- 5g. 학습자 흐름 개선 ----------
{
  const browser = await chromium.launch();
  // AI로 만든 앱 → 3단계 예시: 한 번 더 눌러야 바뀌고, 바뀐 뒤 앱이 동작한다
  {
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
    await page.addInitScript(() => {
      const sample = async () => ({});
      sample.json = async () => ({ files: [
        { name: 'index.html', content: '<!doctype html><html><head><link rel="stylesheet" href="style.css"></head><body><h1 id="w">apple</h1><script src="app.js"></script></body></html>' },
        { name: 'style.css', content: '@media (min-width:860px){h1{color:red}}' },
        { name: 'app.js', content: 'localStorage.setItem("x","1")' }
      ], summary: 'ok', try: [] });
      window.claude = { use: async n => n === 'sample' ? sample : null };
    });
    await page.goto(BASE); await page.waitForTimeout(400);
    await page.click('#send'); await page.waitForSelector('#stage iframe'); await page.waitForTimeout(300);
    await page.click('.step-tab >> nth=2');
    await page.click('#example'); await page.waitForTimeout(300);
    const armed = await page.textContent('#example');
    const still = await page.frameLocator('#stage iframe').locator('#w').count();
    await page.click('#example'); await page.waitForTimeout(500);
    const card = await page.frameLocator('#stage iframe').locator('#card-front').textContent({ timeout: 4000 }).catch(() => '');
    const pass = await page.$$eval('#checks .mark.pass', n => n.length);
    check('[흐름 개선] AI 코드 위에 예시: 한 번 더 눌러 확인', armed.includes('한 번 더') && still === 1);
    check('[흐름 개선] 바꾼 뒤 앱이 동작하고 3단계 검사 통과', card === 'abandon' && pass === 6, `card=${card} pass=${pass}`);
    // 예시 모양 앱에서는 2단계 예시가 이전 변화(단어 10개)를 살린 채 3단계로
    await page.click('.step-tab >> nth=1'); await page.click('#example'); await page.waitForTimeout(300);
    await page.click('.step-tab >> nth=2'); await page.click('#example'); await page.waitForTimeout(400);
    const prog = await page.frameLocator('#stage iframe').locator('#progress-text').textContent({ timeout: 4000 }).catch(() => '');
    check('[흐름 개선] 2단계 단어 10개가 3단계 예시 뒤에도 남음', prog.startsWith('0 / 10'), prog);
    await page.close();
  }
  // 휴대폰: 예시를 누르면 미리보기로 내려가고, 할 일로 돌아가는 버튼이 있다
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    await page.goto(BASE); await page.waitForTimeout(300);
    await page.click('#example'); await page.waitForTimeout(600);
    const top = await page.evaluate(() => document.getElementById('stage').getBoundingClientRect().top);
    check('[흐름 개선] 휴대폰: 결과가 나오면 미리보기가 화면 안으로', top >= 0 && top < 844, 'stage top ' + Math.round(top));
    await page.click('#back-to-task'); await page.waitForTimeout(300);
    const mt = await page.evaluate(() => document.getElementById('mission').getBoundingClientRect().top);
    check('[흐름 개선] 휴대폰: 할 일로 돌아가기', mt >= 0 && mt < 100, 'mission top ' + Math.round(mt));
    await page.close();
  }
  // 4단계 끝 다음 목표 링크, 실습실 단계 완료 → 흐름도 자동 체크
  {
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
    await page.goto(BASE); await page.click('#example'); await page.waitForTimeout(300);
    for (const cb of await page.$$('#checks input[type=checkbox]')) await cb.check();
    await page.click('.step-tab >> nth=3'); await page.waitForTimeout(200);
    check('[흐름 개선] 4단계 끝에 갈림길 링크', (await page.getAttribute('#next-goal', 'href')) === 'path/#fork');
    await page.click('#next-goal'); await page.waitForTimeout(400);
    const atFork = await page.evaluate(() => { const r = document.getElementById('fork').getBoundingClientRect(); return r.top >= 0 && r.top < innerHeight; });
    check('[흐름 개선] 실습실 1단계 완료 → 흐름도 1단계 자동 체크·갈림길로 이동', (await page.isChecked('.node[data-id="s1"] input')) && atFork);
    await page.close();
  }
  // 이전 실습이 남은 채 1단계: 안내와 새로 시작하기, AI 규칙에 1·2단계 PWA 파일 금지
  {
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
    let sent = '';
    await page.addInitScript(() => {
      const sample = async () => ({});
      sample.json = async (input) => { window.__sent = input; return { files: [], summary: 'ok', try: [] }; };
      window.claude = { use: async n => n === 'sample' ? sample : null };
    });
    await page.goto(BASE + '#step3'); await page.waitForTimeout(400);
    await page.click('#example'); await page.waitForTimeout(400); // 3단계 파일까지 생김
    await page.click('.step-tab >> nth=0'); await page.waitForTimeout(200);
    const shown = await page.isVisible('#leftover');
    await page.click('#send'); await page.waitForTimeout(300);
    sent = await page.evaluate(() => window.__sent || '');
    await page.click('#leftover-reset'); await page.waitForTimeout(200);
    const armed = (await page.textContent('#reset-all')).includes('한 번 더');
    await page.click('#reset-all'); await page.waitForTimeout(300);
    const gone = !(await page.isVisible('#leftover'));
    check('[흐름 개선] 이전 실습이 남은 채 1단계: 안내 → 새로 시작하기 → 안내 사라짐', shown && armed && gone);
    check('[흐름 개선] AI 규칙: 1·2단계에서 manifest.json·sw.js 새로 만들지 않기', sent.includes('1·2단계에서는 manifest.json과 sw.js를 새로 만들지 않는다'));
    await page.goto(BASE + '#step1'); await page.waitForTimeout(300);
    check('[흐름 개선] 깨끗한 1단계에는 안내 없음', !(await page.isVisible('#leftover')));
    await page.close();
  }
  // 첫 화면: 컴퓨터에서 할 일(단계·설명)이 첫 화면 안에
  {
    const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    await page.goto(BASE); await page.waitForTimeout(300);
    const r = await page.evaluate(() => ({ steps: document.getElementById('steps').getBoundingClientRect().top, mission: document.getElementById('mission').getBoundingClientRect().top }));
    check('[흐름 개선] 컴퓨터 첫 화면에 단계와 할 일', r.steps < 768 && r.mission < 768, JSON.stringify(r));
    await page.close();
  }
  await browser.close();
}

// ---------- 5h. 학생용 지도안 링크 · 갈래 준비물 · 모바일 우선 명령 모아 보기 ----------
{
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(BASE + 'path/');
  const lec = await page.$$eval('.flow a[href*="lecture/"], .side-notes a[href*="lecture/"]', as => as.map(a => a.getAttribute('href')));
  check('[흐름 개선] 흐름도 상자·안내의 지도안 링크는 모두 학생용(?student)', lec.length >= 7 && lec.every(h => h.includes('?student')), lec.join(' '));
  const heads = await page.$$eval('.branch .needs', n => n.map(x => x.textContent));
  check('[흐름 개선] 갈래 2·3 머리에 Node.js 준비물', heads.length === 3 && heads[1].includes('Node.js') && heads[2].includes('Node.js'));
  // 학생용으로 열면 강사 메모가 안 보이고, 강사의 저장된 설정은 그대로
  await page.evaluate(() => localStorage.setItem('lecture-mode', 'teacher'));
  await page.goto(BASE + 'lecture/?student#s3'); await page.waitForTimeout(300);
  const r = await page.evaluate(() => ({ student: document.body.classList.contains('student'), notes: [...document.querySelectorAll('.teacher')].filter(e => e.offsetParent).length, saved: localStorage.getItem('lecture-mode'), atS3: (() => { const top = document.getElementById('s3').getBoundingClientRect().top, bar = document.querySelector('.bar').offsetHeight; return top >= bar - 2 && top < bar + 120; })() }));
  check('[흐름 개선] 지도안 ?student: 학생용·강사 메모 숨김·강사 설정 유지·#s3 위치', r.student && r.notes === 0 && r.saved === 'teacher' && r.atS3, JSON.stringify(r));
  await page.goto(BASE + 'lecture/'); await page.waitForTimeout(200);
  check('[흐름 개선] 지도안 그냥 열면 강사용 그대로', !(await page.evaluate(() => document.body.classList.contains('student'))));
  // 모바일 우선: 명령 모아 보기가 단계의 실제 명령과 같다
  await page.goto(BASE + 'mobile/'); await page.waitForTimeout(300);
  await page.click('#cmds > summary');
  const c = await page.evaluate(() => {
    const items = [...document.querySelectorAll('#cmds-list > li')];
    const all = items.map(li => (li.querySelector('pre') || {}).textContent || '').join('\n');
    const expected = window.demoSteps.flatMap(s => s.lines.filter(l => l[0] === '$').map(l => l[1])).filter(x => !/whoami|--non-interactive/.test(x));
    return { n: items.length, missing: expected.filter(x => !all.includes(x)), eas: ['npx eas-cli login', 'npx eas-cli build:configure', 'npx eas-cli submit --platform ios', 'npx eas-cli submit --platform android'].filter(x => !all.includes(x)), copies: document.querySelectorAll('#cmds-list .copy').length, dup: items.some(li => { const p = li.querySelector('pre'); if (!p) return false; const ls = p.textContent.split('\n'); return new Set(ls).size !== ls.length; }), before: document.querySelectorAll('#cmds-list .before').length };
  });
  check('[흐름 개선] 모바일 우선 명령 모아 보기: 9단계·실제 명령 전부·계정 단계 명령·복사 버튼', c.n === 9 && c.missing.length === 0 && c.eas.length === 0 && c.copies >= 6 && !c.dup && c.before === 5, JSON.stringify(c));
  check('[흐름 개선] 6·8 스크립트 오류 없음', errors.length === 0, errors.join(' | '));
  await page.close();
  const phone = await browser.newPage({ viewport: { width: 360, height: 800 } });
  await phone.goto(BASE + 'mobile/'); await phone.click('#cmds > summary'); await phone.waitForTimeout(200);
  check('[흐름 개선] 휴대폰: 명령 모아 보기 가로 스크롤 없음', await phone.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await browser.close();
}

// ---------- 5i. 수업 전 점검 페이지 (강사용) ----------
{
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(BASE + 'check/'); await page.waitForTimeout(600);
  const qr = await page.evaluate(() => ['qr-kit', 'qr-lab'].every(id => document.getElementById(id).querySelector('img, canvas')));
  check('[수업 전 점검] QR 두 개(정답 키트·실습실)', qr);
  await page.click('.result[data-id="a1"] button[data-v="ok"]');
  await page.check('input[data-id="a5-preview"]');
  await page.selectOption('#a6-pattern', '400-200');
  await page.click('.result[data-id="b2"] button[data-v="bad"]');
  await page.fill('#memo', '메모 시험');
  await page.reload(); await page.waitForTimeout(400);
  const r = await page.evaluate(() => ({ a: document.getElementById('cnt-a').textContent, dotB: document.getElementById('dot-b').className, sum: document.getElementById('summary').textContent }));
  const sumOk = r.sum.includes('1. 키 만들기: ✓ 됨') && r.sum.includes('6. Network에서 요청 횟수 보기') && r.sum.includes('요청 모양: fetch 2줄 · 400 다음 200') && r.sum.includes('2. 홈 화면에 설치: ✗ 안 됨') && r.sum.includes('메모: 메모 시험');
  check('[수업 전 점검] 결과 표시 저장·진행 수·결과 요약', r.a === '1 / 7' && r.dotB.includes('part') && sumOk, r.a + ' ' + r.dotB);
  await page.goto(BASE + 'lecture/'); await page.waitForTimeout(200);
  check('[수업 전 점검] 강의 지도안 강사 준비 목록에서 링크', await page.isVisible('.teacher-panel a[href="../check/"]'));
  check('[수업 전 점검] 스크립트 오류 없음', errors.length === 0, errors.join(' | '));
  const phone = await browser.newPage({ viewport: { width: 360, height: 800 } });
  await phone.goto(BASE + 'check/'); await phone.waitForTimeout(400);
  check('[수업 전 점검] 휴대폰 가로 스크롤 없음', await phone.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await browser.close();
}

// ---------- 5c. 모바일 우선 데모 ----------
{
  const browser = await chromium.launch();
  for (const [name, vp] of [['컴퓨터', { width: 1400, height: 1000 }], ['휴대폰', { width: 390, height: 900 }]]) {
    const page = await browser.newPage({ viewport: vp, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(BASE + 'mobile/');
    check(`[모바일 우선 ${name}] 1단계 결정 문서`, (await page.textContent('#ex-title')).includes('결정 문서') && (await page.textContent('#peek')).includes('com.example.vocab1h'));
    const bad = [];
    for (let i = 0; i < 9; i++) {
      await page.click(`#rail button >> nth=${i}`);
      const r = await page.evaluate((i) => {
        const s = window.demoSteps[i];
        const termCmds = s.lines.filter(l => l[0] === '$').map(l => l[1]).join('\n');
        return {
          visible: !!document.getElementById('cc-body').offsetParent,
          prompt: document.getElementById('cc-prompt').textContent.trim().length,
          inTerm: termCmds.includes(s.cc.run),
          inCC: document.getElementById('cc-body').textContent.includes(s.cc.run),
          noScroll: document.documentElement.scrollWidth <= innerWidth
        };
      }, i);
      if (!(r.visible && r.prompt > 10 && r.inTerm && r.inCC && r.noScroll)) bad.push(i + 1 + ':' + JSON.stringify(r));
    }
    check(`[모바일 우선 ${name}] 9단계 모두 Claude Code 상자·명령 일치·가로 스크롤 없음`, bad.length === 0, bad.join(' '));
    check(`[모바일 우선 ${name}] 9단계: 계정 없음 실제 출력`, (await page.textContent('#ex-step')).includes('9 / 9') && (await page.textContent('#term')).includes('Not logged in'));
    check(`[모바일 우선 ${name}] 폴더에 학습 엔진·저장소 연결부`, (await page.textContent('#tree')).includes('src/engine/srs.ts') && (await page.textContent('#tree')).includes('storage.web.ts'));
    // 휴대폰 화면: Expo 앱을 웹으로 내보낸 것. 알아요를 누르면 복습 수가 줄어든다
    const fr = page.frameLocator('#phone-screen iframe');
    const front = await fr.getByLabel('카드 뒤집기').textContent({ timeout: 15000 }).catch(() => '');
    const before = await fr.getByText(/^오늘 복습 \d/).textContent().catch(() => '');
    await fr.getByText('알아요', { exact: true }).click().catch(() => {});
    const after = await fr.getByText(/^오늘 복습 \d/).textContent().catch(() => '');
    check(`[모바일 우선 ${name}] 휴대폰 화면의 Expo 앱 동작`, front.startsWith('abandon') && before.startsWith('오늘 복습 5개') && after.startsWith('오늘 복습 4개'), `${front} / ${before} → ${after}`);
    check(`[모바일 우선 ${name}] 스크립트 오류 없음`, errors.length === 0, errors.join(' | '));
    await page.close();
  }
  await browser.close();
}

// ---------- 6. WebKit: 서버를 실제로 끄고 오프라인 확인 ----------
{
  const browser = await webkit.launch();
  const ctx = await browser.newContext(devices['iPhone 14']);
  const kit = await ctx.newPage();
  await kit.goto(BASE + 'kit/');
  await kit.click('#mark-btn');
  const kitSw = await waitForSW(kit);
  const lab = await ctx.newPage();
  await lab.goto(BASE);
  const labSw = await waitForSW(lab);
  await stopServer();
  let kitOk = false, labOk = false;
  try { await kit.reload(); kitOk = kitSw && (await kit.textContent('#progress-text')).startsWith('1 / 5'); } catch {}
  try { await lab.reload(); labOk = labSw && (await lab.isVisible('#example')); } catch {}
  check('[키트 Safari iPhone 화면] F5 오프라인 재실행 (서버 종료)', kitOk);
  check('[실습실 Safari iPhone 화면] 오프라인 재실행 (서버 종료)', labOk);
  await browser.close();
}

const failed = results.filter(r => !r.ok);
console.log(`\n${results.length - failed.length} / ${results.length} 통과`);
process.exit(failed.length ? 1 : 0);

function cors() {
  return {
    'access-control-allow-origin': '*',
    'access-control-allow-headers': '*',
    'access-control-allow-methods': 'POST, OPTIONS'
  };
}
