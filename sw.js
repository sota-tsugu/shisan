/* 資産管理アプリ Service Worker
 * 方針：ページ（HTML）はネットワーク優先で取得し、常に最新を表示する。
 *       オフライン時のみキャッシュした最後のHTMLを返す。
 *       これにより、index.html を更新すると次回オンライン起動で自動反映される。
 */
var CACHE = "shisan-cache-v1";

self.addEventListener("install", function (e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return c.add("index.html").catch(function () {});
    })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) { if (k !== CACHE) return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  // ページ遷移（HTML）のみネットワーク優先。その他はブラウザ既定に任せる。
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).then(function (resp) {
        var copy = resp.clone();
        caches.open(CACHE).then(function (c) { c.put("index.html", copy); });
        return resp;
      }).catch(function () {
        return caches.match("index.html");
      })
    );
  }
});
