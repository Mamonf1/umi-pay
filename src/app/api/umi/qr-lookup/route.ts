// GET /api/umi/qr-lookup — التحقق من مستلم تحويل عبر رمز QR الممسوح أو إدخال يدوي
// ?code=umipay:<userId>  → بحث برمز المحفظة الممسوح من الكاميرا
// ?phone=<رقم>           → بحث يدوي بالرقم (بديل عند تعذر الكاميرا)
import { db } from "@/lib/db";
import { fail, ok } from "@/lib/umi-server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = (searchParams.get("code") ?? "").trim();
    const phone = (searchParams.get("phone") ?? "").trim();

    const isCode = code.startsWith("umipay:") && code.slice("umipay:".length).trim().length > 0;
    const isPhone = /^\d{5,15}$/.test(phone);
    if (!isCode && !isPhone)
      return fail("رمز غير صالح — امسح رمز QR لمحفظة أومي أو أدخل رقماً صحيحاً");

    const user = isCode
      ? await db.user.findUnique({ where: { id: code.slice("umipay:".length).trim() } })
      : await db.user.findUnique({ where: { phone } });

    if (!user) return fail("لا يوجد حساب بهذا الرمز — تأكد وحاول مجدداً", 404);
    return ok({
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      phone: user.phone,
      role: user.role,
    });
  } catch {
    return fail("تعذر التحقق من المستلم", 500);
  }
}
