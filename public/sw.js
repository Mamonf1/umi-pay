// UMI PAY — Service Worker (pass-through بلا تخزين مؤقت)
// الغرض: استيفاء شرط التثبيت PWA في المتصفحات الأقدم + بقاء التطبيق قابلاً للتحديث فوراً
// ملاحظة: لا نعترض الطلبات بتخزين (cache) حتى لا يتعارض مع وضع التطوير والتحديثات الحية
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // تمرير مباشر — نفس سلوك الشبكة العادي تماماً
  if (event.request.method !== "GET") return;
  event.respondWith(fetch(event.request).catch(() => event.request));
});
