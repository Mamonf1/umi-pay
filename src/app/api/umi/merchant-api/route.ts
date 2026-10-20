// UMI PAY — معلومات API الخاصة بالتاجر
// GET  ?userId=                        → بيانات ربط المتجر (يولّد المفتاح تلقائياً عند أول استدعاء)
// POST {userId, action: regenerate}    → توليد مفتاح API جديد (يُبطل المفتاح السابق)
// POST {userId, action: webhook, url}  → تحديث رابط استلام الإشعارات (webhook)
import { db } from "@/lib/db";
import { fail, ok } from "@/lib/umi-server";
import crypto from "crypto";

const genKey = () => "umi_live_" + crypto.randomBytes(24).toString("hex");

async function ownMerchant(userId: string) {
  if (!userId) return null;
  const m = await db.merchant.findUnique({ where: { ownerId: userId } });
  return m;
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

    return fail("إجراء غير معروف");
  } catch {
    return fail("تعذر تنفيذ الإجراء", 500);
  }
}
