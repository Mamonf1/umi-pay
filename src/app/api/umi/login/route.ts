// POST /api/umi/login — تسجيل الدخول التجريبي (هاتف + رمز)
import { db } from "@/lib/db";
import { fail, ok } from "@/lib/umi-server";

export async function POST(req: Request) {
  try {
    const { phone, pin } = await req.json();
    if (!phone || !pin) return fail("أدخل رقم الجوال والرمز");
    const user = await db.user.findUnique({
      where: { phone: String(phone).trim() },
      include: { wallet: true },
    });
    if (!user) return fail("لا يوجد حساب بهذا الرقم — جرّب حساب تجريبي");
    if (user.pin !== String(pin)) return fail("الرمز السري غير صحيح");
    return ok({
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar,
      balance: user.wallet?.balance ?? 0,
    });
  } catch {
    return fail("تعذر تسجيل الدخول", 500);
  }
}
