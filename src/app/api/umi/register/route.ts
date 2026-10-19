// POST /api/umi/register — إنشاء حساب جديد (بدون شروط معقدة)
// كلمة المرور: 8 خانات أو أكثر (حروف + أرقام) — رمز الدفع: 4 أرقام
import { db } from "@/lib/db";
import { fail, ok } from "@/lib/umi-server";
import { validatePass, validatePin } from "@/lib/currency";

const AVATARS = ["🧑🏻", "👩🏻", "🧔🏻", "👱🏻", "👨🏽", "👩🏽", "🧑🏽", "👤"];

export async function POST(req: Request) {
  try {
    const { name, phone, pass, pin, role } = await req.json();

    const nm = String(name ?? "").trim();
    const ph = String(phone ?? "").trim();
    const pw = String(pass ?? "");
    const pn = String(pin ?? "").trim();
    const rl = role === "merchant" ? "merchant" : "individual";

    if (nm.length < 2) return fail("أدخل الاسم الكامل");
    if (!/^\d{6,15}$/.test(ph)) return fail("رقم الجوال يجب أن يكون من 6 إلى 15 رقماً");

    const passErr = validatePass(pw);
    if (passErr) return fail(passErr);
    const pinErr = validatePin(pn);
    if (pinErr) return fail(pinErr);

    const exists = await db.user.findUnique({ where: { phone: ph } });
    if (exists) return fail("هذا الرقم مسجل مسبقاً — جرّب تسجيل الدخول");

    const avatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];
    const user = await db.user.create({
      data: {
        name: nm.slice(0, 40),
        phone: ph,
        pass: pw,
        pin: pn,
        role: rl,
        avatar,
        wallet: { create: {} },
        ...(rl === "merchant"
          ? {
              merchant: {
                create: { name: nm.slice(0, 40), category: "متجر عام", emoji: "🛒" },
              },
            }
          : {}),
      },
      include: { wallet: true },
    });

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
    return fail("تعذر إنشاء الحساب", 500);
  }
}
