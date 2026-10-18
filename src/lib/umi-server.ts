// UMI PAY — أدوات مشتركة للخادم
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const r2 = (n: number) => Math.round(n * 100) / 100;

export const genRef = () =>
  "UMI-" +
  Math.random().toString(36).slice(2, 7).toUpperCase() +
  Date.now().toString(36).slice(-4).toUpperCase();

export const ok = (data: unknown) => NextResponse.json({ ok: true, data });
export const fail = (error: string, status = 400) =>
  NextResponse.json({ ok: false, error }, { status });

/** التحقق من قدرة الابن على الإنفاق (حد أسبوعي + تجميد) */
export async function assertChildCanSpend(childId: string, amount: number) {
  const link = await db.familyMember.findUnique({ where: { childId } });
  if (!link) return null; // ليس حساباً فرعياً
  if (link.frozen) return "الحساب مجمّد من ولي الأمر مؤقتاً";
  const weekAgo = new Date(Date.now() - 7 * 86400000);
  const spent = await db.transaction.aggregate({
    _sum: { amount: true },
    where: { fromUserId: childId, createdAt: { gte: weekAgo } },
  });
  const weekSpent = spent._sum.amount ?? 0;
  if (r2(weekSpent + amount) > link.weeklyLimit)
    return `تجاوزت الحد الأسبوعي (${link.weeklyLimit.toLocaleString("en-US")} OMI) — المتبقي ${r2(Math.max(0, link.weeklyLimit - weekSpent)).toLocaleString("en-US")} OMI`;
  return null;
}

/** تنفيذ حركة مالية ذرّية: خصم من + إضافة إلى + قيد معاملة */
export async function moveMoney(opts: {
  type: string;
  amount: number;
  fromUserId?: string;
  toUserId?: string;
  merchantId?: string;
  note?: string;
}) {
  const amount = r2(opts.amount);
  const ops: Parameters<typeof db.$transaction>[0] = [];
  if (opts.fromUserId)
    ops.push(
      db.wallet.update({
        where: { userId: opts.fromUserId },
        data: { balance: { decrement: amount } },
      })
    );
  if (opts.toUserId)
    ops.push(
      db.wallet.update({
        where: { userId: opts.toUserId },
        data: { balance: { increment: amount } },
      })
    );
  const reference = genRef();
  ops.push(
    db.transaction.create({
      data: {
        reference,
        type: opts.type,
        amount,
        note: opts.note,
        fromUserId: opts.fromUserId,
        toUserId: opts.toUserId,
        merchantId: opts.merchantId,
      },
    })
  );
  await db.$transaction(ops);
  return reference;
}
