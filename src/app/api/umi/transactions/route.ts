// GET /api/umi/transactions?userId=&filter= — سجل المعاملات مع فلاتر
// ?txId= — تفاصيل عملية مفردة (لورقة التفاصيل: مشاركة PDF / إضافة صديق / طلب تقرير)
import { db } from "@/lib/db";
import { fail, ok, r2 } from "@/lib/umi-server";
import type { TxItem } from "@/lib/umi-types";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") ?? "";
    const filter = searchParams.get("filter") ?? "all";

    // تفاصيل عملية مفردة + معرف الطرف المقابل (لطلبات الصداقة والتقرير)
    if (searchParams.get("txId")) {
      const t = await db.transaction.findUnique({
        where: { id: searchParams.get("txId") ?? "" },
        include: {
          from: { select: { name: true, avatar: true, id: true } },
          to: { select: { name: true, avatar: true, id: true } },
          merchant: { select: { name: true, emoji: true, ownerId: true } },
        },
      });
      if (!t) return fail("العملية غير موجودة", 404);
      if (t.fromUserId !== userId && t.toUserId !== userId) return fail("غير مصرح", 403);
      const isOut = t.fromUserId === userId;
      const counterparty = t.merchant ? t.merchant.name : (isOut ? t.to?.name : t.from?.name) ?? "—";
      const emoji = t.merchant ? t.merchant.emoji : (isOut ? t.to?.avatar : t.from?.avatar) ?? "👤";
      // الطرف المقابل كمستخدم — في دفع المتجر يكون صاحب المتجر (لإضافته صديقاً وطلب تقرير منه)
      const rawPeer = t.merchant ? t.merchant.ownerId : isOut ? t.toUserId : t.fromUserId;
      const peerUserId = rawPeer && rawPeer !== userId ? rawPeer : null;
      return ok({
        tx: {
          id: t.id,
          reference: t.reference,
          type: t.type as TxItem["type"],
          amount: t.amount,
          status: t.status,
          note: t.note,
          createdAt: t.createdAt.toISOString(),
          direction: isOut ? "out" : "in",
          counterparty,
          emoji,
        },
        peerUserId,
      });
    }

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
