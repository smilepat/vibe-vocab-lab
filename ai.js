// Claude 호출 공급자 두 가지를 같은 모양으로 감싼다.
//   artifact : claude.ai 안에서 열렸을 때, 보는 사람의 Claude 계정 (window.claude.use('sample'))
//   key      : 학습자가 넣은 자기 Anthropic API 키로 브라우저에서 바로 호출
// 둘 다 없으면 'none' — 실습실은 예시 결과로 진행한다.
(function () {
  'use strict';

  var KEY_STORE = 'vibe-lab-api-key';
  var MODEL_STORE = 'vibe-lab-model';
  var MODELS = [
    { id: 'claude-opus-5-5', label: 'Claude Opus 5.5 (기본, 가장 정확)' },
    { id: 'claude-sonnet-5-5', label: 'Claude Sonnet 5.5 (더 빠르고 저렴)' }
  ];
  var FILE_NAMES = ['index.html', 'style.css', 'app.js', 'manifest.json', 'sw.js'];

  // 답의 모양: files 배열(이름+전체 내용), summary, try
  var SCHEMA = {
    type: 'object',
    properties: {
      files: {
        type: 'array',
        items: {
          type: 'object',
          properties: { name: { type: 'string', enum: FILE_NAMES }, content: { type: 'string' } },
          required: ['name', 'content'],
          additionalProperties: false
        }
      },
      summary: { type: 'string' },
      try: { type: 'array', items: { type: 'string' } }
    },
    required: ['files', 'summary', 'try'],
    additionalProperties: false
  };

  // ---------- 키 보관 ----------
  function read(store, k) { try { return store.getItem(k); } catch (e) { return null; } }
  function getKey() { return read(sessionStorage, KEY_STORE) || read(localStorage, KEY_STORE) || ''; }
  function setKey(key, remember) {
    clearKey();
    try { (remember ? localStorage : sessionStorage).setItem(KEY_STORE, key); } catch (e) {}
  }
  function clearKey() {
    try { localStorage.removeItem(KEY_STORE); } catch (e) {}
    try { sessionStorage.removeItem(KEY_STORE); } catch (e) {}
  }
  function keyRemembered() { return !!read(localStorage, KEY_STORE); }
  function getModel() {
    var m = read(localStorage, MODEL_STORE);
    return MODELS.some(function (x) { return x.id === m; }) ? m : MODELS[0].id;
  }
  function setModel(m) { try { localStorage.setItem(MODEL_STORE, m); } catch (e) {} }

  // ---------- 오류 ----------
  function err(code, message) { return { code: code, message: message || code }; }

  // 이전 형식(files가 객체)도 받아 준다
  function normalize(res) {
    if (!res || typeof res !== 'object') throw err('invalid_json');
    var files = {};
    if (Array.isArray(res.files)) {
      res.files.forEach(function (f) { if (f && typeof f.name === 'string' && typeof f.content === 'string') files[f.name] = f.content; });
    } else if (res.files && typeof res.files === 'object') {
      Object.keys(res.files).forEach(function (n) { if (typeof res.files[n] === 'string') files[n] = res.files[n]; });
    }
    return {
      files: files,
      summary: String(res.summary || '답을 받았습니다.'),
      tryList: Array.isArray(res.try) ? res.try.map(String).slice(0, 5) : []
    };
  }

  // 글 속에서 JSON 하나 꺼내기: 전체 → 코드 펜스 → 첫 { 부터 마지막 } 까지
  function parseJsonText(text) {
    try { return JSON.parse(text); } catch (e) {}
    var fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fence) { try { return JSON.parse(fence[1]); } catch (e) {} }
    var a = text.indexOf('{'), b = text.lastIndexOf('}');
    if (a >= 0 && b > a) { try { return JSON.parse(text.slice(a, b + 1)); } catch (e) {} }
    throw err('invalid_json');
  }

  // ---------- 자기 키로 호출 ----------
  function callWithKey(prompt, opts) {
    var key = getKey();
    if (!key) return Promise.reject(err('no_key'));
    var started = Date.now();
    var timer = setInterval(function () {
      if (opts.onProgress) opts.onProgress('Claude가 코드를 쓰는 중… ' + Math.round((Date.now() - started) / 1000) + '초');
    }, 1000);

    function send(full) {
      var body = {
        model: getModel(),
        max_tokens: 16000,
        messages: [{ role: 'user', content: prompt }]
      };
      var headers = {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      };
      if (full) {
        // JSON 모양 고정 + 안전 분류기가 거절하면 서버가 다른 모델로 다시 시도
        body.output_config = { format: { type: 'json_schema', schema: SCHEMA } };
        body.fallbacks = 'default';
        headers['anthropic-beta'] = 'server-side-fallback-2026-07-01';
      }
      return fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers: headers, body: JSON.stringify(body), signal: opts.signal
      });
    }

    function handle(resp, full) {
      return resp.json().catch(function () { return {}; }).then(function (data) {
        if (resp.ok) return data;
        var msg = (data && data.error && data.error.message) || '';
        // 추가 설정을 이 계정·모델이 받지 않으면 기본 요청으로 한 번만 다시
        if (resp.status === 400 && full) return send(false).then(function (r) { return handle(r, false); });
        if (resp.status === 401 || resp.status === 403) throw err('bad_key', msg);
        if (resp.status === 429) throw err('rate_limited', msg);
        if (resp.status === 529 || resp.status >= 500) throw err('upstream_error', msg);
        if (resp.status === 413) throw err('prompt_too_large', msg);
        throw err('invalid_request', msg);
      });
    }

    return send(true)
      .then(function (r) { return handle(r, true); }, function (e) {
        if (e && e.name === 'AbortError') throw err('cancelled');
        throw err('network', String(e && e.message));
      })
      .then(function (data) {
        if (data.stop_reason === 'refusal') throw err('refused');
        if (data.stop_reason === 'max_tokens') throw err('truncated');
        var text = (data.content || []).filter(function (b) { return b.type === 'text'; }).map(function (b) { return b.text; }).join('');
        if (!text.trim()) throw err('empty_completion');
        return normalize(parseJsonText(text));
      })
      .then(function (r) { clearInterval(timer); return r; }, function (e) { clearInterval(timer); throw e; });
  }

  // ---------- claude.ai artifact ----------
  var artifactSample = null;
  function callArtifact(prompt, opts) {
    return artifactSample.json(prompt, {
      modelTier: 'default', cache: false, signal: opts.signal,
      onText: function (u) { if (opts.onProgress) opts.onProgress('Claude가 코드를 쓰는 중… ' + u.text.length.toLocaleString() + '자'); }
    }).then(normalize);
  }

  // ---------- 공개 인터페이스 ----------
  var LabAI = {
    MODELS: MODELS,
    getKey: getKey, setKey: setKey, clearKey: clearKey, keyRemembered: keyRemembered,
    getModel: getModel, setModel: setModel,
    inArtifact: function () { return !!(window.claude && typeof window.claude.use === 'function'); },
    // artifact 안이면 sample을 받아 둔다. 결과: 'artifact' | 'key' | 'none'
    detect: function () {
      if (LabAI.inArtifact()) {
        return window.claude.use('sample').then(function (s) {
          artifactSample = s;
          return s ? 'artifact' : (getKey() ? 'key' : 'none');
        }, function () { return getKey() ? 'key' : 'none'; });
      }
      return Promise.resolve(getKey() ? 'key' : 'none');
    },
    mode: function () { return artifactSample ? 'artifact' : (getKey() ? 'key' : 'none'); },
    dropArtifact: function () { artifactSample = null; },
    ask: function (prompt, opts) {
      opts = opts || {};
      if (artifactSample) return callArtifact(prompt, opts);
      return callWithKey(prompt, opts);
    }
  };
  window.LabAI = LabAI;
})();
