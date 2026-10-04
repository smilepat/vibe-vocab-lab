// 실습실 서비스 워커. 파일을 고치면 숫자를 올린다 (lab-v1 → lab-v2)
const CACHE_NAME = 'lab-v8';

// 오프라인에서도 열려야 하는 것: 실습실, 강의 지도안, 포장 지침, 예시용 정답 키트
const FILES = [
  './',
  './index.html',
  './lab.css',
  './lab.js',
  './ai.js',
  './glossary.js',
  './vendor/jszip.min.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './lecture/',
  './native/',
  './native/demo/',
  './mobile/',
  './path/',
  './kit/index.html',
  './kit/style.css',
  './kit/app.js',
  './kit/manifest.json',
  './kit/sw.js'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k.startsWith('lab-') && k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// 같은 출처 GET만 다룬다. Claude API(api.anthropic.com)나 글꼴 같은 다른 출처는 건드리지 않는다.
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    fetch(req)
      .then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        }
        return response;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }))
  );
});
