// مهمة 24-e: اختبار API — ترقية حساب مؤقت إلى تاجر + لوحة API لمتجر أمنيه + شبكة الأمان
const BASE = "http://localhost:3000";
let pass = 0, failN = 0;
const ok = (name, cond, extra = "") => {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { failN++; console.log(`  ✗ ${name} ${extra}`); }
};
const api = async (path, opts = {}) => {
  const r = await fetch(BASE + path, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
  });
  const j = await r.json().catch(() => ({}));
  return { status: r.status, ...j };
};

(async () => {
  console.log("— متجر أمنيه: الحساب المُرقّى");
  const login = await api("/api/umi/login", { method: "POST", body: JSON.stringify({ phone: "963317782466", pass: "Mam2737@" }) });
  ok("دخول متجر أمنيه", login.ok === true, JSON.stringify(login));
  ok("الدور أصبح merchant", login?.data?.role === "merchant", "role=" + login?.data?.role);
  const amanehId = login?.data?.id;

  const mapi = await api(`/api/umi/merchant-api?userId=${amanehId}`);
  ok("لوحة API تعمل لمتجر أمنيه", mapi.ok === true && typeof mapi?.data?.apiKey === "string", JSON.stringify(mapi).slice(0, 120));
  ok("المفتاح يبدأ umi_live_", (mapi?.data?.apiKey ?? "").startsWith("umi_live_"));
  console.log("    مفتاح أمنيه:", mapi?.data?.apiKey?.slice(0, 20) + "…", "| merchantId:", mapi?.data?.merchantId);

  console.log("— حساب مؤقت: دورة الترقية الكاملة");
  const suffix = Math.floor(Math.random() * 900000 + 100000);
  const phone = "900" + suffix; // 12 خانة مؤقت
  const reg = await api("/api/umi/register", { method: "POST", body: JSON.stringify({ name: "متجر اختبار مؤقت", phone, pass: "Temp12345", pin: "1234", role: "individual" }) });
  ok("تسجيل حساب فردي مؤقت", reg.ok === true, JSON.stringify(reg));
  const tempId = reg?.data?.id;
  ok("الدور فردي", reg?.data?.role === "individual");

  // لوحة API قبل الترقية يجب أن ترفض (لا يوجد سجل تاجر)
  const before = await api(`/api/umi/merchant-api?userId=${tempId}`);
  ok("قبل الترقية: لا لوحة API (404)", before.ok === false, JSON.stringify(before).slice(0, 100));

  const up = await api("/api/umi/become-merchant", { method: "POST", body: JSON.stringify({ userId: tempId }) });
  ok("الترقية نجحت", up.ok === true && up?.data?.role === "merchant", JSON.stringify(up).slice(0, 140));
  ok("أُنشئ مفتاح API تلقائياً", (up?.data?.apiKey ?? "").startsWith("umi_live_"));

  const after = await api(`/api/umi/merchant-api?userId=${tempId}`);
  ok("بعد الترقية: لوحة API تعمل بنفس المفتاح", after.ok === true && after?.data?.apiKey === up?.data?.apiKey);

  const dup = await api("/api/umi/become-merchant", { method: "POST", body: JSON.stringify({ userId: tempId }) });
  ok("تكرار الترقية آمن (رسالة أكملنا بياناتك)", dup.ok === true && /تاجر بالفعل/.test(dup?.data?.message ?? ""), JSON.stringify(dup).slice(0, 120));

  console.log("— شبكة الأمان: تاجر بلا سجل");
  // أنشئ مستخدماً بدور تاجر دون سجل مباشرة في القاعدة عبر dev endpoint غير موجود — نستخدم سكربت node منفصل
  // هنا نكتفي بالتحقق: merchant-api لحساب غير موجود يرفض
  const ghost = await api(`/api/umi/merchant-api?userId=nonexistent-id`);
  ok("مستخدم غير موجود: رفض 404", ghost.ok === false);

  console.log("— حماية حساب الإدارة");
  const adm = await api("/api/umi/login", { method: "POST", body: JSON.stringify({ phone: "963969748865", pass: "M2737@" }) });
  const admUp = await api("/api/umi/become-merchant", { method: "POST", body: JSON.stringify({ userId: adm?.data?.id }) });
  ok("رفض ترقية حساب الإدارة", admUp.ok === false && /الإدارة/.test(admUp?.error ?? ""), JSON.stringify(admUp).slice(0, 100));

  console.log("— سلامة القاعدة");
  const cur = await api("/api/umi/currency");
  ok("currency يعمل", cur.ok === true);

  console.log(`\nالنتيجة: ${pass} نجح / ${failN} فشل`);
  if (tempId) (await import("fs")).writeFileSync("/tmp/temp_merchant_id.txt", tempId);
  process.exit(failN ? 1 : 0);
})();
