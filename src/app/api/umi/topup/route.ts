// POST /api/umi/topup — شحن المحفظة (مدى / Apple Pay / بطاقة)
import { db } from "@/lib/db";
import { fail, moveMoney, ok, r2 } from "@/lib/umi-server";

const MIN_TOPUP = 25000; // 25,000 OMI ≈ 12.5 دولار

const METHODS: Record<string, string> = {
  mada: "بطاقة مدى",
  applepay: "Apple Pay",
  card: "بطاقة ائتمانية",
};

export async function POST(req: Request) {
  try {
    const { userId, amount, method } = await req.json();
    const amt = r2(Number(amount));
    if (!userId || !amt || amt < MIN_TOPUP)
      return fail(`أقل مبلغ للشحن ${MIN_TOPUP.toLocaleString("en-US")} OMI`);
    const methodLabel = METHODS[method] ?? "بطاقة مدى";
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) return fail("المستخدم غير موجود", 404);

    const reference = await moveMoney({
      type: "topup",
      amount: amt,
      toUserId: userId,
      note: `شحن عبر ${methodLabel}`,
    });
    const balance = await db.wallet.findUnique({ where: { userId } });
    return ok({ reference, amount: amt, balance: r2(balance?.balance ?? 0) });
  } catch {
    return fail("تعذر تنفيذ الشحن", 500);
  }
}
