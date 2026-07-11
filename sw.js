/* 資産管理アプリ Service Worker
 * 方針：ページ（HTML）はキャッシュを経由せず毎回サーバーから最新を取得（no-store）。
 *       取得できたら次回オフライン用にキャッシュも更新。オフライン時のみ最後のHTMLを返す。
 *       これにより index.html を更新すると、次回オンライン起動でほぼ即座に反映される。
 */
var CACHE = "shisan-cache-v2";

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
  if (req.mode === "navigate") {
    // HTMLはキャッシュを使わず常に最新を取得
    e.respondWith(
      fetch(req.url, { cache: "no-store" }).then(function (resp) {
        var copy = resp.clone();
        caches.open(CACHE).then(function (c) { c.put("index.html", copy); });
        return resp;
      }).catch(function () {
        return caches.match("index.html");
      })
    );
  }
});
