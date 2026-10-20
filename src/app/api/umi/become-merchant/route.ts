// UMI PAY — الترقية إلى حساب تاجر
// POST {userId} → يحوّل الحساب الفردي إلى حساب تاجر كامل:
//   role: individual → merchant + إنشاء سجل Merchant + توليد مفتاح API تلقائياً
// بعد الترقية يظهر لصاحب الحساب: لوحة معلومات API في تبويب المتاجر + إمكانية استقبال المدفوعات
import { db } from "@/lib/db";
import { fail, ok } from "@/lib/umi-server";
import crypto from "crypto";

const genKey = () => "umi_live_" + crypto.randomBytes(24).toString("hex");

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();
    const user = await db.user.findUnique({
      where: { id: String(userId ?? "") },
      include: { merchant: true },
    });
    if (!user) return fail("المستخدم غير موجود", 404);

    if (user.role === "admin")
      return fail("حساب الإدارة لا يحتاج ترقية — يدير المحفظة بالكامل");

    if (user.role === "merchant") {
      // تاجر بلا سجل (حالة نادرة) — أكمل سجله فقط
      const merchant =
        user.merchant ??
        (await db.merchant.create({
          data: {
            ownerId: user.id,
            name: user.name.slice(0, 40),
            category: "متجر عام",
            emoji: "🛒",
            apiKey: genKey(),
            apiKeyAt: new Date(),
          },
        }));
      return ok({
        role: "merchant",
        merchantId: merchant.id,
        apiKey: merchant.apiKey,
        message: "حسابك تاجر بالفعل — أكملنا بيانات متجرك",
      });
    }

    // الترقية الفعلية: فردي → تاجر (تحديث الدور + إنشاء السجل معاً)
    const updated = await db.user.update({
      where: { id: user.id },
      data: {
        role: "merchant",
        merchant: {
          create: {
            name: user.name.slice(0, 40),
            category: "متجر عام",
            emoji: "🛒",
            apiKey: genKey(),
            apiKeyAt: new Date(),
          },
        },
      },
      include: { merchant: true },
    });

    return ok({
      role: updated.role,
      merchantId: updated.merchant?.id ?? null,
      apiKey: updated.merchant?.apiKey ?? null,
      message: "مبروك! أصبح حسابك حساب تاجر ✓ — معلومات API متاحة الآن في تبويب المتاجر",
    });
  } catch {
    return fail("تعذر تنفيذ الترقية", 500);
  }
}
