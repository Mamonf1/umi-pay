// POST /api/umi/admin/points — منح نقاط أومي (للأدمن فقط)
// النقاط محفظة مكافآت: تُمنح من الإدارة فقط — لا بيع ولا شراء
import { db } from "@/lib/db";
import { fail, ok } from "@/lib/umi-server";

export async function POST(req: Request) {
  try {
    const { adminId, phone, points, note } = await req.json();
    const admin = await db.user.findUnique({ where: { id: String(adminId ?? "") } });
    if (!admin || admin.role !== "admin")
      return fail("منح النقاط متاح لأدمن المحفظة فقط", 403);

    const pts = Number(points);
    if (!pts || pts <= 0 || pts > 1_000_000) return fail("أدخل عدد نقاط صحيح (1 - 1,000,000)");
    const ph = String(phone ?? "").trim();
    const user = await db.user.findUnique({ where: { phone: ph }, include: { wallet: true } });
    if (!user) return fail("لا يوجد مستخدم بهذا الرقم");
    if (!user.wallet) return fail("لا توجد محفظة لهذا المستخدم", 404);

    await db.wallet.update({
      where: { userId: user.id },
      data: { points: { increment: pts } },
    });

    const w = await db.wallet.findUnique({ where: { userId: user.id } });
    return ok({
      granted: pts,
      userName: user.name,
      totalPoints: w?.points ?? 0,
      note: note ? String(note).slice(0, 80) : null,
    });
  } catch {
    return fail("تعذر منح النقاط", 500);
  }
}
