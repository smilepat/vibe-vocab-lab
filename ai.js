// AI 호출 공급자를 같은 모양으로 감싼다.
//   artifact : claude.ai 안에서 열렸을 때, 보는 사람의 Claude 계정 (window.claude.use('sample'))
//   key      : 학습자가 넣은 자기 API 키로 브라우저에서 바로 호출 (Claude 또는 Gemini)
// 둘 다 없으면 'none' — 실습실은 예시 결과로 진행한다.
(function () {
  'use strict';

  var PROVIDER_STORE = 'vibe-lab-provider';
  var PROVIDERS = {
    anthropic: {
      name: 'Claude',
      keyStore: 'vibe-lab-api-key',
      modelStore: 'vibe-lab-model',
      keyHint: 'sk-ant-…',
      keyPage: 'https://console.anthropic.com/settings/keys',
      keyPageLabel: 'console.anthropic.com → API Keys',
      models: [
        { id: 'claude-opus-5-5', label: 'Claude Opus 5.5 (기본, 가장 정확)' },
        { id: 'claude-sonnet-5-5', label: 'Claude Sonnet 5.5 (더 빠르고 저렴)' }
      ],
      checkKey: function (k) { return /^sk-ant-/.test(k) ? '' : 'Claude API 키는 sk-ant- 로 시작합니다.'; }
    },
    gemini: {
      name: 'Gemini',
      keyStore: 'vibe-lab-gemini-key',
      modelStore: 'vibe-lab-gemini-model',
      keyHint: 'AIza…',
      keyPage: 'https://aistudio.google.com/app/apikey',
      keyPageLabel: 'Google AI Studio → Get API key',
      models: [
        { id: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash (기본, 가장 정확)' },
        { id: 'gemini-3.5-flash-lite', label: 'Gemini 3.5 Flash-Lite (더 빠르고 저렴)' }
      ],
      checkKey: function (k) {
        if (/^sk-ant-/.test(k)) return '이것은 Claude 키입니다. 위에서 서비스를 Claude로 바꾸세요.';
        return k.length >= 20 ? '' : 'Gemini API 키가 너무 짧습니다. 보통 AIza 로 시작합니다.';
      }
    }
  };
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

  // ---------- 설정 보관 ----------
  function read(store, k) { try { return store.getItem(k); } catch (e) { return null; } }
  function getProvider() { var p = read(localStorage, PROVIDER_STORE); return PROVIDERS[p] ? p : 'anthropic'; }
  function setProvider(p) { if (PROVIDERS[p]) try { localStorage.setItem(PROVIDER_STORE, p); } catch (e) {} }
  function cfg(p) { return PROVIDERS[p || getProvider()]; }
  function getKey(p) { var s = cfg(p).keyStore; return read(sessionStorage, s) || read(localStorage, s) || ''; }
  function setKey(key, remember, p) {
    clearKey(p);
    try { (remember ? localStorage : sessionStorage).setItem(cfg(p).keyStore, key); } catch (e) {}
  }
  function clearKey(p) {
    var s = cfg(p).keyStore;
    try { localStorage.removeItem(s); } catch (e) {}
    try { sessionStorage.removeItem(s); } catch (e) {}
  }
  function keyRemembered(p) { return !!read(localStorage, cfg(p).keyStore); }
  function getModel(p) {
    var c = cfg(p), m = read(localStorage, c.modelStore);
    return c.models.some(function (x) { return x.id === m; }) ? m : c.models[0].id;
  }
  function setModel(m, p) { try { localStorage.setItem(cfg(p).modelStore, m); } catch (e) {} }

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

  // ---------- 서비스별 요청 ----------
  // build(full) → {url, headers, body}, read(data) → 답 글 (실패면 throw)
  var REQUESTS = {
    anthropic: {
      build: function (prompt, key, model, full) {
        var body = { model: model, max_tokens: 16000, messages: [{ role: 'user', content: prompt }] };
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
        return { url: 'https://api.anthropic.com/v1/messages', headers: headers, body: body };
      },
      isKeyError: function (status) { return status === 401 || status === 403; },
      read: function (data) {
        if (data.stop_reason === 'refusal') throw err('refused');
        if (data.stop_reason === 'max_tokens') throw err('truncated');
        return (data.content || []).filter(function (b) { return b.type === 'text'; }).map(function (b) { return b.text; }).join('');
      }
    },
    gemini: {
      build: function (prompt, key, model, full) {
        var generationConfig = { responseMimeType: 'application/json', maxOutputTokens: 16000 };
        if (full) generationConfig.responseJsonSchema = SCHEMA;
        return {
          url: 'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent',
          headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
          body: { contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: generationConfig }
        };
      },
      // Gemini는 틀린 키도 400으로 돌려준다 (메시지에 "API key")
      isKeyError: function (status, msg) { return status === 401 || status === 403 || (status === 400 && /api key/i.test(msg)); },
      read: function (data) {
        if (data.promptFeedback && data.promptFeedback.blockReason) throw err('refused');
        var c = (data.candidates || [])[0];
        if (!c) throw err('empty_completion');
        if (c.finishReason === 'MAX_TOKENS') throw err('truncated');
        if (/SAFETY|PROHIBITED|BLOCKLIST|SPII|RECITATION/.test(c.finishReason || '')) throw err('refused');
        return ((c.content && c.content.parts) || []).filter(function (p) { return p.text && !p.thought; }).map(function (p) { return p.text; }).join('');
      }
    }
  };

  // ---------- 자기 키로 호출 ----------
  function callWithKey(prompt, opts) {
    var p = getProvider(), key = getKey(p), model = getModel(p), R = REQUESTS[p], name = cfg(p).name;
    if (!key) return Promise.reject(err('no_key'));
    var started = Date.now();
    var timer = setInterval(function () {
      if (opts.onProgress) opts.onProgress(name + '가 코드를 쓰는 중… ' + Math.round((Date.now() - started) / 1000) + '초');
    }, 1000);

    function send(full) {
      var r = R.build(prompt, key, model, full);
      return fetch(r.url, { method: 'POST', headers: r.headers, body: JSON.stringify(r.body), signal: opts.signal });
    }

    function handle(resp, full) {
      return resp.json().catch(function () { return {}; }).then(function (data) {
        if (resp.ok) return data;
        var msg = (data && data.error && data.error.message) || '';
        if (R.isKeyError(resp.status, msg)) throw err('bad_key', msg);
        // 추가 설정(JSON 스키마 등)을 이 계정·모델이 받지 않으면 기본 요청으로 한 번만 다시
        if (resp.status === 400 && full) return send(false).then(function (r) { return handle(r, false); });
        if (resp.status === 429) throw err('rate_limited', msg);
        if (resp.status === 404) throw err('model_not_found', msg);
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
        var text = R.read(data);
        if (!text || !text.trim()) throw err('empty_completion');
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
    PROVIDERS: PROVIDERS,
    getProvider: getProvider, setProvider: setProvider,
    getKey: getKey, setKey: setKey, clearKey: clearKey, keyRemembered: keyRemembered,
    getModel: getModel, setModel: setModel,
    inArtifact: function () { return !!(window.claude && typeof window.claude.use === 'function'); },
    // artifact 안이면 sample을 받아 둔다. 결과: 'artifact' | 'key' | 'none'
    detect: function () {
      if (LabAI.inArtifact()) {
        return window.claude.use('sample').then(function (s) {
          artifactSample = s;
          return LabAI.mode();
        }, function () { return LabAI.mode(); });
      }
      return Promise.resolve(LabAI.mode());
    },
    mode: function () { return artifactSample ? 'artifact' : (getKey() ? 'key' : 'none'); },
    // 지금 답을 쓰는 AI 이름 (화면 문구용)
    name: function () { return artifactSample ? 'Claude' : cfg().name; },
    dropArtifact: function () { artifactSample = null; },
    ask: function (prompt, opts) {
      opts = opts || {};
      if (artifactSample) return callArtifact(prompt, opts);
      return callWithKey(prompt, opts);
    }
  };
  window.LabAI = LabAI;
})();
