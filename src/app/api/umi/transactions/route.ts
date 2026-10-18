// GET /api/umi/transactions?userId=&filter= — سجل المعاملات مع فلاتر
import { db } from "@/lib/db";
import { fail, ok, r2 } from "@/lib/umi-server";
import type { TxItem } from "@/lib/umi-types";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") ?? "";
    const filter = searchParams.get("filter") ?? "all";

    const where =
      filter === "in"
        ? { toUserId: userId, NOT: { type: "topup" } }
        : filter === "out"
          ? { fromUserId: userId, NOT: { type: "allowance" } }
          : filter === "merchant"
            ? { merchantId: { not: null }, OR: [{ fromUserId: userId }, { toUserId: userId }] }
            : { OR: [{ fromUserId: userId }, { toUserId: userId }] };

    const rows = await db.transaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 60,
      include: {
        from: { select: { name: true, avatar: true } },
        to: { select: { name: true, avatar: true } },
        merchant: { select: { name: true, emoji: true } },
      },
    });

    const txs: TxItem[] = rows.map((t) => {
      const isOut = t.fromUserId === userId;
      const isIn = t.toUserId === userId;
      let counterparty = "شحن المحفظة";
      let emoji = "⚡";
      if (t.merchant) {
        counterparty = t.merchant.name;
        emoji = t.merchant.emoji;
      } else if (t.type === "topup") {
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
    });

    const sum = txs.reduce((a, t) => a + t.amount, 0);
    return ok({ txs, count: txs.length, sum: r2(sum) });
  } catch {
    return fail("تعذر تحميل السجل", 500);
  }
}
