// GET   /api/umi/family?userId= — الحسابات الفرعية (ولي أمر / ابن)
// POST  /api/umi/family        — مصروف أسبوعي {action:"allowance"}
// PATCH /api/umi/family        — تعديل حد أسبوعي أو تجميد/إلغاء تجميد
import { db } from "@/lib/db";
import { fail, moveMoney, ok, r2 } from "@/lib/umi-server";
import type { FamilyData, FamilyChild } from "@/lib/umi-types";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") ?? "";
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { wallet: true, familiesAsParent: true, familyLink: true },
  });
  if (!user) return fail("المستخدم غير موجود", 404);

  // ولي أمر: عرض الأبناء
  if (user.familiesAsParent.length > 0) {
    const children: FamilyChild[] = [];
    for (const link of user.familiesAsParent) {
      const child = await db.user.findUnique({
        where: { id: link.childId },
        include: { wallet: true },
      });
      if (!child) continue;
      const weekAgo = new Date(Date.now() - 7 * 86400000);
      const spent = await db.transaction.aggregate({
        _sum: { amount: true },
        where: { fromUserId: link.childId, createdAt: { gte: weekAgo } },
      });
      children.push({
        memberId: link.id,
        id: child.id,
        name: child.name,
        avatar: child.avatar,
        phone: child.phone,
        balance: r2(child.wallet?.balance ?? 0),
        weeklyLimit: link.weeklyLimit,
        frozen: link.frozen,
        weekSpent: r2(spent._sum.amount ?? 0),
      });
    }
    const data: FamilyData = { role: "individual", children };
    return ok(data);
  }

  // ابن: بطاقته الخاصة
  if (user.familyLink) {
    const parent = await db.user.findUnique({ where: { id: user.familyLink.parentId } });
    const weekAgo = new Date(Date.now() - 7 * 86400000);
    const spent = await db.transaction.aggregate({
      _sum: { amount: true },
      where: { fromUserId: userId, createdAt: { gte: weekAgo } },
    });
    const data: FamilyData = {
      role: "child",
      children: [],
      parent: { name: parent?.name ?? "ولي الأمر", avatar: parent?.avatar ?? "🧑🏻‍💼" },
      myLimit: user.familyLink.weeklyLimit,
      myWeekSpent: r2(spent._sum.amount ?? 0),
      myFrozen: user.familyLink.frozen,
      myBalance: r2(user.wallet?.balance ?? 0),
    };
    return ok(data);
  }

  return ok({ role: "individual", children: [] } satisfies FamilyData);
}

export async function POST(req: Request) {
  try {
    const { parentId, childId, amount, pin, note } = await req.json();
    const amt = r2(Number(amount));
    if (!parentId || !childId || !amt || amt <= 0) return fail("بيانات المصروف غير مكتملة");
    const parent = await db.user.findUnique({ where: { id: parentId }, include: { wallet: true } });
    if (!parent) return fail("ولي الأمر غير موجود", 404);
    if (parent.pin !== String(pin)) return fail("الرمز السري غير صحيح");
    if (r2(parent.wallet?.balance ?? 0) < amt) return fail("الرصيد غير كافٍ");
    const link = await db.familyMember.findUnique({ where: { childId } });
    if (!link || link.parentId !== parentId) return fail("الحساب الفرعي غير مرتبط بك", 403);

    const reference = await moveMoney({
      type: "allowance",
      amount: amt,
      fromUserId: parentId,
      toUserId: childId,
      note: note ? String(note).slice(0, 60) : "مصروف أسبوعي",
    });
    const balance = await db.wallet.findUnique({ where: { userId: parentId } });
    return ok({ reference, amount: amt, balance: r2(balance?.balance ?? 0) });
  } catch {
    return fail("تعذر إرسال المصروف", 500);
  }
}

export async function PATCH(req: Request) {
  try {
    const { memberId, weeklyLimit, frozen } = await req.json();
    const link = await db.familyMember.findUnique({ where: { id: memberId } });
    if (!link) return fail("الحساب الفرعي غير موجود", 404);
    const data: { weeklyLimit?: number; frozen?: boolean } = {};
    if (weeklyLimit !== undefined) {
      const lim = r2(Number(weeklyLimit));
      if (!lim || lim < 10000 || lim > 10000000)
        return fail("الحد يجب أن يكون بين 10,000 و 10,000,000 ل.س");
      data.weeklyLimit = lim;
    }
    if (frozen !== undefined) data.frozen = Boolean(frozen);
    const updated = await db.familyMember.update({ where: { id: memberId }, data });
    return ok({ memberId: updated.id, weeklyLimit: updated.weeklyLimit, frozen: updated.frozen });
  } catch {
    return fail("تعذر تحديث الإعدادات", 500);
  }
}
