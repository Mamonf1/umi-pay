// GET  /api/umi/admin?userId= — لوحة أدمن المحفظة: إحصاءات + تسعير العملة
// PUT  /api/umi/admin — تحديث سعر صرف الليرة السورية (عملة OMI ثابتة مقابل الدولار)
import { db } from "@/lib/db";
import { fail, ok, r2 } from "@/lib/umi-server";

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
    const [users, merchants, txs, volume, wallets] = await Promise.all([
      db.user.count(),
      db.merchant.count(),
      db.transaction.count(),
      db.transaction.aggregate({ _sum: { amount: true } }),
      db.wallet.aggregate({ _sum: { balance: true } }),
    ]);

    return ok({
      admin: { name: admin.name, avatar: admin.avatar },
      settings: { omiUsd: s.omiUsd, usdSyp: s.usdSyp, updatedAt: s.updatedAt },
      stats: {
        users,
        merchants,
        txs,
        volume: r2(volume._sum.amount ?? 0),
        balances: r2(wallets._sum.balance ?? 0),
      },
    });
  } catch {
    return fail("تعذر تحميل لوحة الأدمن", 500);
  }
}

export async function PUT(req: Request) {
  try {
    const { userId, usdSyp } = await req.json();
    const admin = await requireAdmin(userId);
    if (!admin) return fail("هذه اللوحة مخصصة لأدمن المحفظة فقط", 403);

    const rate = Number(usdSyp);
    if (!rate || rate < 100 || rate > 10_000_000)
      return fail("أدخل سعر دولار صحيح بين 100 و 10,000,000 ل.س");

    const s = await db.currencySettings.upsert({
      where: { id: "main" },
      update: { usdSyp: rate },
      create: { id: "main", usdSyp: rate },
    });
    return ok({ omiUsd: s.omiUsd, usdSyp: s.usdSyp, updatedAt: s.updatedAt });
  } catch {
    return fail("تعذر حفظ التسعير", 500);
  }
}
