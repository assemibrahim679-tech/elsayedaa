/* ============================================================
   Service Worker — صدقة جارية / السيدة عبدالعاطي
   الاستراتيجية:
   - "قشرة" الموقع (الصفحة، الأيقونات، صفحة الأوفلاين) بتتخزّن
     كاش عشان الموقع يفتح فورًا وحتى من غير نت.
   - أي طلب لملفات صوت/بث مباشر/APIs خارجية (قرآن، أذكار، مواقيت
     صلاة، Firebase، نماذج التواصل) بيروح للنت مباشرة من غير كاش،
     عشان البيانات تفضل حية ومحدّثة ومنعرفش نخزن ملفات صوت كبيرة.
   ============================================================ */

const HH_CACHE_VERSION = "hh-v3";
const HH_PRESERVED_CACHES = new Set([HH_CACHE_VERSION, "quran-audio-v1"]);
const HH_APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./offline.html",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-512-maskable.png"
];

// دومينات لازم تروح للنت مباشرة دايمًا (بث/صوت/APIs ديناميكية) وميتخزنش منها حاجة
const HH_NETWORK_ONLY_HOSTS = [
  "stream.radiojar.com",
  "archive.org",
  "islamweb.net",
  "tvquran.com",
  "everyayah.com",
  "mp3quran.net",
  "api.aladhan.com",
  "api.web3forms.com",
  "countapi.mileshilliard.com",
  "firestore.googleapis.com",
  "firebaseinstallations.googleapis.com",
  "identitytoolkit.googleapis.com",
  "www.gstatic.com",
  "api.qrserver.com"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(HH_CACHE_VERSION).then(function (cache) {
      return cache.addAll(HH_APP_SHELL);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys
          .filter(function (key) {
            return !HH_PRESERVED_CACHES.has(key);
          })
          .map(function (key) {
            return caches.delete(key);
          })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function (event) {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // 1) بث الصوت والـ APIs الخارجية: نتها مباشرة، من غير أي تدخل من الكاش
  if (HH_NETWORK_ONLY_HOSTS.some(function (h) { return url.hostname.includes(h); })) {
    return; // خليه يمر عادي (default browser handling)
  }

  // 2) طلبات التنقّل بين الصفحات (فتح الموقع نفسه): نت أولًا، وإلا كاش، وإلا صفحة الأوفلاين
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then(function (res) {
          const resClone = res.clone();
          caches.open(HH_CACHE_VERSION).then(function (cache) {
            cache.put(req, resClone);
          });
          return res;
        })
        .catch(function () {
          return caches.match(req).then(function (cached) {
            return cached || caches.match("./index.html") || caches.match("./offline.html");
          });
        })
    );
    return;
  }

  // 3) باقي الملفات الثابتة (خطوط جوجل، صور، إلخ): كاش أولًا مع تحديث في الخلفية
  event.respondWith(
    caches.match(req).then(function (cached) {
      const fetchPromise = fetch(req)
        .then(function (res) {
          if (res && res.status === 200) {
            const resClone = res.clone();
            caches.open(HH_CACHE_VERSION).then(function (cache) {
              cache.put(req, resClone);
            });
          }
          return res;
        })
        .catch(function () {
          return cached;
        });
      return cached || fetchPromise;
    })
  );
});
