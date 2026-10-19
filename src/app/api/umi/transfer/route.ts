// POST /api/umi/transfer — تحويل بين المحافظ (مع تحقق الرمز والحدود)
import { db } from "@/lib/db";
import { assertChildCanSpend, fail, moveMoney, ok, r2 } from "@/lib/umi-server";

export async function POST(req: Request) {
  try {
    const { fromId, toId, amount, note, pin } = await req.json();
    const amt = r2(Number(amount));
    if (!fromId || !toId || !amt || amt <= 0) return fail("بيانات التحويل غير مكتملة");
    if (fromId === toId) return fail("لا يمكن التحويل لنفسك");

    const from = await db.user.findUnique({ where: { id: fromId }, include: { wallet: true } });
    const to = await db.user.findUnique({ where: { id: toId }, include: { wallet: true } });
    if (!from || !to) return fail("أحد الطرفين غير موجود", 404);
    if (from.pin !== String(pin)) return fail("رمز الدفع غير صحيح (4 أرقام)");
    if (r2(from.wallet?.balance ?? 0) < amt) return fail("الرصيد غير كافٍ");

    const childErr = await assertChildCanSpend(fromId, amt);
    if (childErr) return fail(childErr);

    const reference = await moveMoney({
      type: "transfer",
      amount: amt,
      fromUserId: fromId,
      toUserId: toId,
      note: note ? String(note).slice(0, 80) : undefined,
    });

    const balance = await db.wallet.findUnique({ where: { userId: fromId } });
    return ok({ reference, amount: amt, balance: r2(balance?.balance ?? 0) });
  } catch {
    return fail("تعذر تنفيذ التحويل", 500);
  }
}
