// UMI PAY — صندوق أرباح المحفظة (مكتبة مشتركة للخادم)
// الإيرادات: رسوم القروض الشهرية (loanMonthlyRate 1.5%) + رسوم استعمال بطاقة الاعتماد (cardFeeRate 3.5%) + إدخالات يدوية من الأدمن
// الرسوم الشهرية تُحتسب على المتبقي من كل قرض معتمد، كل دورة 30 يوماً، وتُضاف إلى متبقي المقترض وتُقيّد في الصندوق
import { db } from "@/lib/db";
import { r2 } from "@/lib/umi-server";

export async function loadSettings() {
  let s = await db.currencySettings.findUnique({ where: { id: "main" } });
  if (!s)
    s = await db.currencySettings.create({
      data: { id: "main", loanMonthlyRate: 1.5, cardFeeRate: 3.5 },
    });
  return s;
}

/** المتبقي الكلي على المقترض = أصل القرض + رسوم التطبيق المتراكمة − ما سُدّد */
export const loanTotalDue = (amount: number, paidAmount: number, feesAccrued: number) =>
  r2(amount + feesAccrued - paidAmount);

/** كم دورة شهرية (30 يوماً) مستحقة منذ آخر احتساب */
function dueCycles(lastFeeAt: Date | null, createdAt: Date): number {
  const start = (lastFeeAt ?? createdAt).getTime();
  const days = Math.floor((Date.now() - start) / 86_400_000);
  return Math.floor(days / 30);
}

/** معاينة الرسوم المستحقة الآن دون تطبيق — للعرض في لوحة الأدمن */
export async function accruePreview(rateOverride?: number) {
  const s = await loadSettings();
  const rate = rateOverride ?? s.loanMonthlyRate;
  const loans = await db.loanRequest.findMany({
    where: { status: "approved" },
    include: { user: { select: { name: true } } },
  });
  const lines: { loanId: string; userId: string; userName: string; months: number; fee: number; base: number }[] = [];
  for (const l of loans) {
    const base = r2(l.amount - l.paidAmount);
    if (base <= 0) continue;
    const months = dueCycles(l.lastFeeAt, l.createdAt);
    if (months <= 0) continue;
    const fee = r2(base * (rate / 100) * months);
    lines.push({ loanId: l.id, userId: l.userId, userName: l.user.name, months, fee, base });
  }
  return {
    rate,
    count: lines.length,
    total: r2(lines.reduce((a, l) => a + l.fee, 0)),
    lines,
  };
}

/** احتساب الرسوم المستحقة وتسجيلها في الصندوق وإضافتها لمتبقي المقترضين */
export async function accrueLoanFees(rateOverride?: number) {
  const preview = await accruePreview(rateOverride);
  if (!preview.count) return { ...preview, applied: 0 };
  const now = new Date();
  for (const line of preview.lines) {
    await db.$transaction([
      db.profitEntry.create({
        data: {
          kind: "loan_fee",
          title: `رسوم شهرية ${preview.rate}% × ${line.months} ${line.months === 1 ? "شهر" : "أشهر"} — قرض ${line.userName}`,
          amount: line.fee,
          loanId: line.loanId,
          userId: line.userId,
        },
      }),
      db.loanRequest.update({
        where: { id: line.loanId },
        data: { feesAccrued: { increment: line.fee }, lastFeeAt: now },
      }),
    ]);
  }
  return { ...preview, applied: preview.count };
}

/** ملخص الصندوق: الإجمالي + هذا الشهر + حسب النوع + تقرير آخر 6 أشهر + آخر الإدخالات */
export async function fundSummary() {
  const entries = await db.profitEntry.findMany({ orderBy: { createdAt: "desc" } });

  const byKind = {
    loan_fee: r2(entries.filter((e) => e.kind === "loan_fee").reduce((a, e) => a + e.amount, 0)),
    card_fee: r2(entries.filter((e) => e.kind === "card_fee").reduce((a, e) => a + e.amount, 0)),
    manual: r2(entries.filter((e) => e.kind === "manual").reduce((a, e) => a + e.amount, 0)),
  };
  const total = r2(entries.reduce((a, e) => a + e.amount, 0));

  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const month = r2(
    entries
      .filter((e) => e.createdAt.toISOString().slice(0, 7) === monthKey)
      .reduce((a, e) => a + e.amount, 0)
  );

  // تقرير آخر 6 أشهر — بأسماء الأشهر السورية
  const MONTHS_AR = ["كانون الثاني", "شباط", "آذار", "نيسان", "أيار", "حزيران", "تموز", "آب", "أيلول", "تشرين الأول", "تشرين الثاني", "كانون الأول"];
  const monthly: { ym: string; label: string; total: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthly.push({
      ym,
      label: `${MONTHS_AR[d.getMonth()]} ${d.getFullYear() === now.getFullYear() ? "" : String(d.getFullYear()).slice(2)}`,
      total: r2(entries.filter((e) => e.createdAt.toISOString().slice(0, 7) === ym).reduce((a, e) => a + e.amount, 0)),
    });
  }

  return {
    total,
    month,
    byKind,
    monthly,
    entries: entries.slice(0, 40).map((e) => ({
      id: e.id,
      kind: e.kind as "loan_fee" | "card_fee" | "manual",
      title: e.title,
      amount: e.amount,
      createdAt: e.createdAt.toISOString(),
    })),
  };
}
