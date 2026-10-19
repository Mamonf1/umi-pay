// POST /api/umi/login — دخول المحفظة: رقم الجوال + كلمة المرور (8+ خانات حروف وأرقام)
import { db } from "@/lib/db";
import { fail, ok } from "@/lib/umi-server";

export async function POST(req: Request) {
  try {
    const { phone, pass } = await req.json();
    if (!phone || !pass) return fail("أدخل رقم الجوال وكلمة المرور");
    const user = await db.user.findUnique({
      where: { phone: String(phone).trim() },
      include: { wallet: true },
    });
    if (!user) return fail("لا يوجد حساب بهذا الرقم — أنشئ حساباً جديداً");
    if (user.pass !== String(pass)) return fail("كلمة المرور غير صحيحة");
    return ok({
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar,
      balance: user.wallet?.balance ?? 0,
      points: user.wallet?.points ?? 0,
    });
  } catch {
    return fail("تعذر تسجيل الدخول", 500);
  }
}
