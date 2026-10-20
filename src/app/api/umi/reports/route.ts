// GET /api/umi/reports — تقارير المستخدم
// ?userId=&from=YYYY-MM-DD&to=YYYY-MM-DD  → تقرير فترة مخصصة (شامل الطرفين)
// ?userId=&last=10                        → آخر N عمليات
// تعيد ملخصاً (عدد/وارد/صادر) + قائمة العمليات مع الطرف المقابل
import { db } from "@/lib/db";
import { fail, ok } from "@/lib/umi-server";

function mapTx(t: any, userId: string) {
  const isOut = t.fromUserId === userId;
  const isIn = t.toUserId === userId;
  let counterparty = "شحن المحفظة";
  let emoji = "⚡";
  if (t.merchant) {
    counterparty = t.merchant.name;
    emoji = t.merchant.emoji;
  } else if (t.type === "topup") {
    counterparty = "شحن مباشر";
    emoji = "⚡";
  } else if (t.type === "allowance") {
    counterparty = "ولي الأمر";
    emoji = "👨‍👩‍👦";
  } else if (isOut && t.to) {
    counterparty = t.to.name;
    emoji = t.to.avatar;
  } else if (isIn && t.from) {
    counterparty = t.from.name;
    emoji = t.from.avatar;
  }
  return {
    id: t.id,
    reference: t.reference,
    type: t.type,
    amount: t.amount,
    direction: isOut ? ("out" as const) : isIn ? ("in" as const) : ("neutral" as const),
    counterparty,
    emoji,
    note: t.note,
    peerUserId: t.merchant ? (t.merchant.ownerId !== userId ? t.merchant.ownerId : null) : isOut ? t.toUserId : t.fromUserId,
    createdAt: t.createdAt.toISOString(),
  };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") ?? "";
    if (!userId) return fail("جلسة غير صالحة");

    const include = {
      from: { select: { name: true, avatar: true } },
      to: { select: { name: true, avatar: true } },
      merchant: { select: { name: true, emoji: true, ownerId: true } },
    };

    let rows: any[];
    if (searchParams.get("last")) {
      const n = Math.min(Math.max(parseInt(searchParams.get("last") ?? "10", 10) || 10, 1), 100);
      rows = await db.transaction.findMany({
        where: { OR: [{ fromUserId: userId }, { toUserId: userId }] },
        orderBy: { createdAt: "desc" },
        take: n,
        include,
      });
    } else {
      const from = searchParams.get("from");
      const to = searchParams.get("to");
      const where: any = { OR: [{ fromUserId: userId }, { toUserId: userId }] };
      if (from || to) {
        where.createdAt = {};
        if (from) where.createdAt.gte = new Date(`${from}T00:00:00.000Z`);
        if (to) where.createdAt.lte = new Date(`${to}T23:59:59.999Z`);
      }
      rows = await db.transaction.findMany({ where, orderBy: { createdAt: "desc" }, take: 500, include });
    }

    const txs = rows.map((t) => mapTx(t, userId));
    const totalIn = txs.filter((t) => t.direction === "in").reduce((s, t) => s + t.amount, 0);
    const totalOut = txs.filter((t) => t.direction === "out").reduce((s, t) => s + t.amount, 0);
    return ok({
      summary: { count: txs.length, totalIn, totalOut, net: totalIn - totalOut },
      txs,
    });
  } catch {
    return fail("تعذر إنشاء التقرير", 500);
  }
}
