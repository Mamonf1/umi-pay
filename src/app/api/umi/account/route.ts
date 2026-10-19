// PATCH /api/umi/account — تغيير كلمة مرور المحفظة أو رمز الدفع
// pass: كلمة مرور جديدة 8+ خانات (حروف وأرقام) — تتحقق من الحالية
// pin: رمز دفع جديد 4 أرقام — يتحقق من رمز الدفع الحالي
import { db } from "@/lib/db";
import { fail, ok } from "@/lib/umi-server";
import { validatePass, validatePin } from "@/lib/currency";

export async function PATCH(req: Request) {
  try {
    const { userId, action, current, next } = await req.json();
    const user = await db.user.findUnique({ where: { id: String(userId ?? "") } });
    if (!user) return fail("المستخدم غير موجود", 404);

    if (action === "pass") {
      if (user.pass !== String(current ?? ""))
        return fail("كلمة المرور الحالية غير صحيحة");
      const err = validatePass(String(next ?? ""));
      if (err) return fail(err);
      if (String(next) === user.pass) return fail("كلمة المرور الجديدة مطابقة للحالية");
      await db.user.update({ where: { id: user.id }, data: { pass: String(next) } });
      return ok({ changed: "pass" });
    }

    if (action === "pin") {
      if (user.pin !== String(current ?? "").trim())
        return fail("رمز الدفع الحالي غير صحيح");
      const err = validatePin(String(next ?? "").trim());
      if (err) return fail(err);
      if (String(next).trim() === user.pin) return fail("رمز الدفع الجديد مطابق للحالي");
      await db.user.update({ where: { id: user.id }, data: { pin: String(next).trim() } });
      return ok({ changed: "pin" });
    }

    return fail("إجراء غير معروف");
  } catch {
    return fail("تعذر تنفيذ التغيير", 500);
  }
}
