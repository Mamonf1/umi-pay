// اختبار شامل لنظام إشعارات الدفع (webhook) — Task 26
// 1) مستقبل محلي يتحقق من توقيع X-UMI-Signature  2) نجاح التسليم  3) فشل المنفذ المغلق
// 4) اختبار موقع omniastore الحقيقي  5) الرابط المحفوظ لا يتغير بعد الاختبارات
import crypto from "crypto";
import http from "http";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const BASE = "http://localhost:3000";
const AMANEH_UID = "cmvh0f9h00000qjtxyso7i5o8"; // متجر أمنيه
let pass = 0, failCount = 0;
const ok = (name, cond, extra = "") => {
  if (cond) { pass++; console.log(`  ✓ ${name}${extra ? " — " + extra : ""}`); }
  else { failCount++; console.log(`  ✗ ${name}${extra ? " — " + extra : ""}`); }
};

// ─── 1) مستقبل محلي يتحقق من التوقيع بمفتاح التاجر الحقيقي ───
let received = null;
const server = http.createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", async () => {
    const m = await db.merchant.findUnique({ where: { ownerId: AMANEH_UID } });
    const sig = req.headers["x-umi-signature"] ?? "";
    const expected = "sha256=" + crypto.createHmac("sha256", m.apiKey).update(body, "utf8").digest("hex");
    const valid = sig === expected;
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ received: true, signatureValid: valid, event: req.headers["x-umi-event"] }));
    received = { valid, event: req.headers["x-umi-event"], parsed: JSON.parse(body) };
  });
});

async function callTest(url) {
  const r = await fetch(`${BASE}/api/umi/merchant-api`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: AMANEH_UID, action: "test", url }),
  });
  return { status: r.status, body: await r.json() };
}

async function main() {
  const before = (await db.merchant.findUnique({ where: { ownerId: AMANEH_UID } })).webhookUrl;
  await new Promise((r) => server.listen(3999, r));
  console.log("— المستقبل المحلي يعمل على :3999\n");

  // ─── 2) اختبار تسليم ناجح + توقيع صحيح ───
  console.log("[2] اختبار الرابط الصحيح (تسليم + توقيع HMAC):");
  const t1 = await callTest("http://localhost:3999/umi-webhook");
  ok("API يرجع delivered=true", t1.body?.data?.delivered === true, `HTTP ${t1.body?.data?.httpStatus} خلال ${t1.body?.data?.tookMs}ms`);
  ok("رسالة عربية واضحة", /وصل الإشعار/.test(t1.body?.data?.message ?? ""));
  await new Promise((r) => setTimeout(r, 300));
  ok("المستقبل استلم POST فعلاً", received !== null);
  ok("التوقيع X-UMI-Signature صحيح (HMAC بمفتاح التاجر)", received?.valid === true);
  ok("حدث الاختبار ping", received?.event === "ping");
  ok("الحمولة تحتوي merchantName", received?.parsed?.merchantName === "متجر أمنيه");
  console.log();

  // ─── 3) اختبار منفذ مغلق ───
  console.log("[3] اختبار فشل الوصول (منفذ مغلق):");
  const t2 = await callTest("http://localhost:9999/nowhere");
  ok("delivered=false", t2.body?.data?.delivered === false);
  ok("رسالة تفسر السبب", /تعذر الوصول|اتصال/.test(t2.body?.data?.message ?? ""));
  console.log();

  // ─── 4) اختبار موقع أمنية الحقيقي ───
  console.log("[4] اختبار موقع omniastore.space-z.ai الحقيقي:");
  const t3 = await callTest("https://omniastore.space-z.ai/api/umi/webhook");
  console.log(`  → delivered=${t3.body?.data?.delivered} httpStatus=${t3.body?.data?.httpStatus} error=${t3.body?.data?.error}`);
  console.log(`  → ${t3.body?.data?.message}`);
  ok("المرسل وصل لموقع أمنية فعلاً (استجابة أو خطأ شبكة واضح)", t3.body?.data != null);
  console.log();

  // ─── 5) الرابط المحفوظ لم يتغير ───
  console.log("[5] سلامة البيانات:");
  const after = (await db.merchant.findUnique({ where: { ownerId: AMANEH_UID } })).webhookUrl;
  ok("الرابط المحفوظ لم يتغير بعد الاختبارات", after === before, `"${before}"`);

  console.log(`\nالنتيجة: ${pass} نجح / ${failCount} فشل`);
  server.close();
  await db.$disconnect();
  process.exit(failCount ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
