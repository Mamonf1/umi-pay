// UMI PAY — صندوق أرباح المحفظة
// GET  ?userId=            → ملخص الصندوق (أدمن): الإجمالي + هذا الشهر + حسب النوع + تقرير 6 أشهر + آخر الإدخالات + الرسوم المستحقة الآن
// POST {userId, action}    → accrue: احتساب الرسوم الشهرية المستحقة من القروض وإضافتها للصندوق
//                            entry: إدخال يدوي (رسوم بطاقة اعتماد محصّلة خارجياً / إيراد آخر)
import { db } from "@/lib/db";
import { fail, ok, r2 } from "@/lib/umi-server";
import { accrueLoanFees, accruePreview, fundSummary, loadSettings } from "@/lib/fund";

async function requireAdmin(userId: string | null | undefined) {
  if (!userId) return null;
  const u = await db.user.findUnique({ where: { id: userId } });
  return u && u.role === "admin" ? u : null;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const admin = await requireAdmin(searchParams.get("userId"));
    if (!admin) return fail("صندوق الأرباح مخصص لأدمن المحفظة فقط", 403);

    const [settings, summary, due] = await Promise.all([
      loadSettings(),
      fundSummary(),
      accruePreview(),
    ]);
    return ok({
      rates: { loanMonthlyRate: settings.loanMonthlyRate, cardFeeRate: settings.cardFeeRate },
      ...summary,
      due: { count: due.count, total: due.total },
    });
  } catch {
    return fail("تعذر تحميل صندوق الأرباح", 500);
  }
}

export async function POST(req: Request) {
  try {
    const { userId, action, kind, title, amount } = await req.json();
    const admin = await requireAdmin(userId);
    if (!admin) return fail("صندوق الأرباح مخصص لأدمن المحفظة فقط", 403);

    // ==== احتساب الرسوم الشهرية المستحقة من القروض ====
    if (action === "accrue") {
      const r = await accrueLoanFees();
      if (!r.count)
        return ok({ applied: 0, total: 0, message: "لا توجد رسوم مستحقة الآن — تُحتسب كل دورة 30 يوماً على المتبقي من كل قرض معتمد" });
      return ok({
        applied: r.applied,
        total: r.total,
        rate: r.rate,
        message: `تم احتساب رسوم ${r.count > 1 ? `${r.count} قروض` : "قرض واحد"} — دخلت للصندوق ${r.total.toLocaleString("en-US")} ل.س`,
      });
    }

    // ==== إدخال يدوي للصندوق ====
    if (action === "entry") {
      const amt = r2(Number(amount));
      if (!amt || amt <= 0) return fail("أدخل مبلغاً صحيحاً");
      if (amt > 1_000_000_000) return fail("المبلغ كبير جداً");
      const k = kind === "card_fee" ? "card_fee" : "manual";
      const t = String(title ?? "").trim() || (k === "card_fee" ? "رسوم استعمال بطاقات اعتماد" : "إيراد يدوي");
      const e = await db.profitEntry.create({
        data: { kind: k, title: t.slice(0, 80), amount: amt },
      });
      return ok({
        entry: { id: e.id, kind: k, title: e.title, amount: e.amount, createdAt: e.createdAt.toISOString() },
        message: "أُضيف الإدخال إلى الصندوق ✓",
      });
    }

    return fail("إجراء غير معروف");
  } catch {
    return fail("تعذر تنفيذ الإجراء", 500);
  }
}
