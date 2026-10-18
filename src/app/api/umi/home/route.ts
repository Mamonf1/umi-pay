// GET /api/umi/home?userId= — بطاقة المحفظة + إحصاءات الأسبوع + آخر المعاملات
import { db } from "@/lib/db";
import { fail, ok, r2 } from "@/lib/umi-server";
import type { TxItem } from "@/lib/umi-types";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") ?? "";
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });
    if (!user) return fail("المستخدم غير موجود", 404);

    const rows = await db.transaction.findMany({
      where: { OR: [{ fromUserId: userId }, { toUserId: userId }] },
      orderBy: { createdAt: "desc" },
      take: 12,
      include: {
        from: { select: { name: true, avatar: true } },
        to: { select: { name: true, avatar: true } },
        merchant: { select: { name: true, emoji: true } },
      },
    });

    const mapTx = (t: (typeof rows)[number]): TxItem => {
      const isOut = t.fromUserId === userId;
      const isIn = t.toUserId === userId;
      let counterparty = "شحن المحفظة";
      let emoji = "⚡";
      if (t.merchant) {
        counterparty = t.merchant.name;
        emoji = t.merchant.emoji;
      } else if (t.type === "topup") {
        counterparty = "شحن المحفظة";
        emoji = "⚡";
      } else {
        const other = isOut ? t.to : t.from;
        counterparty = other?.name ?? "مستخدم";
        emoji = other?.avatar ?? "👤";
      }
      return {
        id: t.id,
        reference: t.reference,
        type: t.type as TxItem["type"],
        amount: t.amount,
        status: t.status,
        note: t.note,
        createdAt: t.createdAt.toISOString(),
        direction: isOut ? "out" : isIn ? "in" : "neutral",
        counterparty,
        emoji,
      };
    };

    // إحصاءات آخر 7 أيام
    const weekAgo = new Date(Date.now() - 7 * 86400000);
    const [inAgg, outAgg] = await Promise.all([
      db.transaction.aggregate({
        _sum: { amount: true },
        where: { toUserId: userId, createdAt: { gte: weekAgo } },
      }),
      db.transaction.aggregate({
        _sum: { amount: true },
        where: { fromUserId: userId, createdAt: { gte: weekAgo } },
      }),
    ]);

    return ok({
      me: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        balance: r2(user.wallet?.balance ?? 0),
      },
      weekIn: r2(inAgg._sum.amount ?? 0),
      weekOut: r2(outAgg._sum.amount ?? 0),
      txs: rows.map(mapTx),
    });
  } catch {
    return fail("تعذر تحميل البيانات", 500);
  }
}
