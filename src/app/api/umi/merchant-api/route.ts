// UMI PAY — معلومات API الخاصة بالتاجر
// GET  ?userId=                        → بيانات ربط المتجر (يولّد المفتاح تلقائياً عند أول استدعاء)
// POST {userId, action: regenerate}    → توليد مفتاح API جديد (يُبطل المفتاح السابق)
// POST {userId, action: webhook, url}  → تحديث رابط استلام الإشعارات (webhook)
import { db } from "@/lib/db";
import { fail, ok } from "@/lib/umi-server";
import { sendWebhook } from "@/lib/webhook";
import crypto from "crypto";

const genKey = () => "umi_live_" + crypto.randomBytes(24).toString("hex");

async function ownMerchant(userId: string) {
  if (!userId) return null;
  const m = await db.merchant.findUnique({ where: { ownerId: userId } });
  if (m) return m;
  // شبكة أمان: مستخدم دوره «تاجر» بلا سجل (مثل حساب سُجّل قبل ربط التسجيل بالتاجر) — ينشأ له سجل كامل بمفتاح
  const u = await db.user.findUnique({ where: { id: userId } });
  if (!u || u.role !== "merchant") return null;
  return db.merchant.create({
    data: {
      ownerId: u.id,
      name: u.name.slice(0, 40),
      category: "متجر عام",
      emoji: "🛒",
      apiKey: genKey(),
      apiKeyAt: new Date(),
    },
  });
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const m = await ownMerchant(String(searchParams.get("userId") ?? ""));
    if (!m) return fail("لا يوجد حساب تاجر مرتبط بهذا المستخدم", 404);

    // توليد المفتاح تلقائياً عند أول فتح للقسم
    const merchant = m.apiKey
      ? m
      : await db.merchant.update({
          where: { id: m.id },
          data: { apiKey: genKey(), apiKeyAt: new Date() },
        });

    return ok({
      merchantId: merchant.id,
      name: merchant.name,
      category: merchant.category,
      apiKey: merchant.apiKey,
      keyCreatedAt: merchant.apiKeyAt?.toISOString() ?? null,
      webhookUrl: merchant.webhookUrl,
    });
  } catch {
    return fail("تعذر تحميل معلومات API", 500);
  }
}

export async function POST(req: Request) {
  try {
    const { userId, action, url } = await req.json();
    const m = await ownMerchant(String(userId ?? ""));
    if (!m) return fail("لا يوجد حساب تاجر مرتبط بهذا المستخدم", 404);

    // إعادة توليد المفتاح
    if (action === "regenerate") {
      const merchant = await db.merchant.update({
        where: { id: m.id },
        data: { apiKey: genKey(), apiKeyAt: new Date() },
      });
      return ok({
        merchantId: merchant.id,
        apiKey: merchant.apiKey,
        keyCreatedAt: merchant.apiKeyAt?.toISOString() ?? null,
        message: "وُلّد مفتاح API جديد — أي تكامل يستخدم المفتاح السابق سيتوقف",
      });
    }

    // تحديث رابط الإشعارات
    if (action === "webhook") {
      const clean = String(url ?? "").trim();
      if (clean && !/^https?:\/\/.+/i.test(clean))
        return fail("أدخل رابطاً صحيحاً يبدأ بـ http:// أو https://");
      const merchant = await db.merchant.update({
        where: { id: m.id },
        data: { webhookUrl: clean || null },
      });
      return ok({
        webhookUrl: merchant.webhookUrl,
        message: clean ? "حُفظ رابط الإشعارات ✓" : "أُزيل رابط الإشعارات",
      });
    }

    // اختبار رابط الإشعارات — يرسل ping حقيقي ويعيد نتيجة التسليم
    if (action === "test") {
      const target = String(url ?? "").trim() || m.webhookUrl;
      if (!target) return fail("أدخل رابط الإشعارات أولاً ثم جرّبه");
      if (!/^https?:\/\/.+/i.test(target))
        return fail("الرابط غير صحيح — يجب أن يبدأ بـ http:// أو https://");
      // نختبر على رابط مؤقت دون تعديل المحفوظ: نضبط الرابط ثم نعيد الحالة الأصلية
      const original = m.webhookUrl;
      const tmp = await db.merchant.update({
        where: { id: m.id },
        data: { webhookUrl: target },
      });
      const res = await sendWebhook(m.id, "ping", {
        message: "هذا إشعار اختبار من محفظة أومي — إذا وصلتك هذه الرسالة فالربط يعمل ✓",
        amount: 0,
        currency: "SYP",
        reference: "TEST-" + crypto.randomBytes(4).toString("hex").toUpperCase(),
      });
      if (tmp.webhookUrl !== original)
        await db.merchant.update({ where: { id: m.id }, data: { webhookUrl: original } });
      return ok({
        delivered: res.delivered,
        httpStatus: res.status ?? null,
        tookMs: res.ms,
        error: res.error ?? null,
        message: res.delivered
          ? `وصل الإشعار لموقعك بنجاح ✓ (HTTP ${res.status} خلال ${res.ms} مللي ثانية)`
          : `فشل الوصول: ${describeError(res.error, res.status)} — تأكد أن المسار موجود في موقعك ويستقبل POST`,
      });
    }

    return fail("إجراء غير معروف");
  } catch {
    return fail("تعذر تنفيذ الإجراء", 500);
  }
}

function describeError(err: string | undefined, status?: number): string {
  if (err === "timeout") return "انتهت المهلة (8 ثوانٍ) دون رد من موقعك";
  if (err === "connection_refused") return "الموقع رفض الاتصال";
  if (err === "dns_not_found") return "تعذر العثور على العنوان (تحقق من كتابة الرابط)";
  if (err === "ssl_error") return "مشكلة في شهادة الأمان SSL";
  if (status) return `موقعك رد بـ HTTP ${status} (المطلوب 200)`;
  return "تعذر الوصول للموقع";
}
