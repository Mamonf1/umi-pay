// POST /api/umi/checkout — بوابة الدفع: دفع فاتورة تاجر
import { db } from "@/lib/db";
import { assertChildCanSpend, fail, moveMoney, ok, r2 } from "@/lib/umi-server";
import { sendWebhook } from "@/lib/webhook";

export async function POST(req: Request) {
  try {
    const { userId, merchantId, amount, pin } = await req.json();
    const amt = r2(Number(amount));
    if (!userId || !merchantId || !amt || amt <= 0) return fail("بيانات الدفع غير مكتملة");

    const user = await db.user.findUnique({ where: { id: userId }, include: { wallet: true } });
    const merchant = await db.merchant.findUnique({ where: { id: merchantId } });
    if (!user || !merchant) return fail("المستخدم أو التاجر غير موجود", 404);
    if (user.pin !== String(pin)) return fail("رمز الدفع غير صحيح (4 أرقام)");

    const isWallet = true; // الدفع من محفظة أومي (بطاقة مدى = محاكاة نفس المسار)
    if (isWallet && r2(user.wallet?.balance ?? 0) < amt) return fail("الرصيد غير كافٍ");

    const childErr = await assertChildCanSpend(userId, amt);
    if (childErr) return fail(childErr);

    const reference = await moveMoney({
      type: "merchant",
      amount: amt,
      fromUserId: userId,
      merchantId,
      toUserId: merchant.ownerId,
      note: `دفع لـ ${merchant.name}`,
    });

    const balance = await db.wallet.findUnique({ where: { userId } });

    // إشعار فوري لموقع التاجر (webhook) — لا يؤثر على نجاح الدفع إن فشل التسليم
    const wh = await sendWebhook(merchantId, "payment.success", {
      reference,
      amount: amt,
      currency: "SYP",
      payerName: user.name,
      payerPhone: user.phone,
      note: `دفع لـ ${merchant.name}`,
      status: "completed",
    }).catch(() => null);

    return ok({
      reference,
      amount: amt,
      merchant: merchant.name,
      balance: r2(balance?.balance ?? 0),
      notified: wh?.delivered ?? false,
    });
  } catch {
    return fail("تعذر إتمام الدفع", 500);
  }
}
