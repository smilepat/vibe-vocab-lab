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
  const demo = await page.$eval('#demo-link', a => ({ href: a.href, target: a.target, rel: a.rel }));
  check('[실습실 홈] claude.ai 데모 링크 (새 탭)', demo.href === 'https://claude.ai/artifact/7PstFyrwRJArghKjV5xt8G' && demo.target === '_blank' && demo.rel.includes('noopener') && await page.isVisible('#demo-link'));
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
  check('[PWA 용어] 실습실 3단계에 Progressive Web App 설명', await has() && await page.isVisible('#mission .term-note'));
  await page.goto(BASE + 'lecture/'); check('[PWA 용어] 강의 지도안에 설명', await has());
  await page.goto(BASE + 'native/'); check('[PWA 용어] 포장 지침에 설명 + 데모 링크', await has() && await page.isVisible('a[href="demo/"].go'));
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
