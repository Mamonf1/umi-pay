// GET  /api/umi/admin?userId= — لوحة أدمن المحفظة: إحصاءات + تسعير + نقاط + قروض
// PUT  /api/umi/admin — تحديث سعر الدولار (usdSyp) وقيمة نقطة أومي (pointSyp)
import { db } from "@/lib/db";
import { fail, ok, r2 } from "@/lib/umi-server";
import { accruePreview, fundSummary, loanTotalDue } from "@/lib/fund";

async function requireAdmin(userId: string | null | undefined) {
  if (!userId) return null;
  const u = await db.user.findUnique({ where: { id: userId } });
  return u && u.role === "admin" ? u : null;
}

async function loadSettings() {
  let s = await db.currencySettings.findUnique({ where: { id: "main" } });
  if (!s) s = await db.currencySettings.create({ data: { id: "main" } });
  return s;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const admin = await requireAdmin(searchParams.get("userId"));
    if (!admin) return fail("هذه اللوحة مخصصة لأدمن المحفظة فقط", 403);

    const s = await loadSettings();
    const [users, merchants, txs, volume, wallets, pointsAgg, pointHolders] = await Promise.all([
      db.user.count(),
      db.merchant.count(),
      db.transaction.count(),
      db.transaction.aggregate({ _sum: { amount: true } }),
      db.wallet.aggregate({ _sum: { balance: true } }),
      db.wallet.aggregate({ _sum: { points: true } }),
      db.wallet.findMany({
        where: { points: { gt: 0 } },
        take: 10,
        orderBy: { points: "desc" },
        include: { user: { select: { name: true, phone: true, avatar: true } } },
      }),
    ]);

    // مراقبة القروض: المعلّقة + غير المسددة
    const [pendingLoans, unpaidLoans] = await Promise.all([
      db.loanRequest.findMany({
        where: { status: "pending" },
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, phone: true, avatar: true } } },
      }),
      db.loanRequest.findMany({
        where: { status: "approved" },
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, phone: true, avatar: true } } },
      }),
    ]);

    const mapLoan = (l: (typeof unpaidLoans)[number]) => ({
      id: l.id,
      amount: l.amount,
      paidAmount: l.paidAmount,
      feesAccrued: l.feesAccrued,
      remaining: loanTotalDue(l.amount, l.paidAmount, l.feesAccrued),
      currency: l.currency,
      status: l.status,
      note: l.note,
      createdAt: l.createdAt.toISOString(),
      updatedAt: l.updatedAt.toISOString(),
      userName: l.user.name,
      userPhone: l.user.phone,
      userAvatar: l.user.avatar,
    });

    const unpaid = unpaidLoans.map(mapLoan);
    const [fund, due] = await Promise.all([fundSummary(), accruePreview()]);

    return ok({
      admin: { name: admin.name, avatar: admin.avatar },
      settings: {
        usdSyp: s.usdSyp,
        pointSyp: s.pointSyp,
        loanMonthlyRate: s.loanMonthlyRate,
        cardFeeRate: s.cardFeeRate,
        updatedAt: s.updatedAt,
      },
      stats: {
        users,
        merchants,
        txs,
        volume: r2(volume._sum.amount ?? 0),
        balances: r2(wallets._sum.balance ?? 0),
        pointsTotal: pointsAgg._sum.points ?? 0,
      },
      pointsHolders: pointHolders.map((w) => ({
        name: w.user.name,
        phone: w.user.phone,
        avatar: w.user.avatar,
        points: w.points,
      })),
      loans: {
        pending: pendingLoans.map(mapLoan),
        unpaid,
        unpaidCount: unpaid.length,
        unpaidTotal: r2(unpaid.reduce((a, l) => a + l.remaining, 0)),
      },
      fund: {
        total: fund.total,
        month: fund.month,
        byKind: fund.byKind,
        dueCount: due.count,
        dueTotal: due.total,
      },
    });
  } catch {
    return fail("تعذر تحميل لوحة الأدمن", 500);
  }
}

export async function PUT(req: Request) {
  try {
    const { userId, usdSyp, pointSyp, loanMonthlyRate, cardFeeRate } = await req.json();
    const admin = await requireAdmin(userId);
    if (!admin) return fail("هذه اللوحة مخصصة لأدمن المحفظة فقط", 403);

    const data: { usdSyp?: number; pointSyp?: number; loanMonthlyRate?: number; cardFeeRate?: number } = {};

    if (usdSyp !== undefined) {
      const rate = Number(usdSyp);
      if (!rate || rate < 100 || rate > 10_000_000)
        return fail("أدخل سعر دولار صحيح بين 100 و 10,000,000 ل.س");
      data.usdSyp = rate;
    }
    if (pointSyp !== undefined) {
      const pr = Number(pointSyp);
      if (!pr || pr < 1 || pr > 1_000_000)
        return fail("أدخل قيمة نقطة صحيحة بين 1 و 1,000,000 ل.س");
      data.pointSyp = pr;
    }
    if (loanMonthlyRate !== undefined) {
      const lr = Number(loanMonthlyRate);
      if (isNaN(lr) || lr < 0.1 || lr > 100)
        return fail("أدخل نسبة القروض الشهرية صحيحة بين 0.1 و 100 بالمئة");
      data.loanMonthlyRate = lr;
    }
    if (cardFeeRate !== undefined) {
      const cf = Number(cardFeeRate);
      if (isNaN(cf) || cf < 0 || cf > 100)
        return fail("أدخل نسبة بطاقة الاعتماد صحيحة بين 0 و 100 بالمئة");
      data.cardFeeRate = cf;
    }
    if (!Object.keys(data).length) return fail("لا يوجد تغيير للحفظ");

    const s = await db.currencySettings.upsert({
      where: { id: "main" },
      update: data,
      create: { id: "main", ...data },
    });
    return ok({
      usdSyp: s.usdSyp,
      pointSyp: s.pointSyp,
      loanMonthlyRate: s.loanMonthlyRate,
      cardFeeRate: s.cardFeeRate,
      updatedAt: s.updatedAt,
    });
  } catch {
    return fail("تعذر حفظ التسعير", 500);
  }
}
