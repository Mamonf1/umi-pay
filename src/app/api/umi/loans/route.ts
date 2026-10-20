// UMI PAY — نظام القروض (بالليرة السورية)
// GET   ?userId=          → قروض المستخدم + إجمالي المتبقي (وللأدمن: مراقبة الكل)
// POST  {userId, amount}  → طلب قرض جديد (قيد المراجعة)
// PATCH {id, action}      → approve/reject (أدمن) أو repay (المستخدم — جزئي أو كامل)
import { db } from "@/lib/db";
import { fail, ok, r2, genRef } from "@/lib/umi-server";
import { loanTotalDue } from "@/lib/fund";

const MIN_LOAN = 25000;

function mapLoan(l: {
  id: string;
  amount: number;
  paidAmount: number;
  feesAccrued: number;
  currency: string;
  status: string;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
  user?: { name: string; phone: string; avatar: string };
}) {
  return {
    id: l.id,
    amount: l.amount,
    paidAmount: l.paidAmount,
    feesAccrued: l.feesAccrued,
    remaining: loanTotalDue(l.amount, l.paidAmount, l.feesAccrued),
    currency: l.currency,
    status: l.status as "pending" | "approved" | "rejected" | "paid",
    note: l.note,
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
    ...(l.user ? { userName: l.user.name, userPhone: l.user.phone, userAvatar: l.user.avatar } : {}),
  };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") ?? "";
    const user = await db.user.findUnique({ where: { id: userId }, include: { wallet: true } });
    if (!user) return fail("المستخدم غير موجود", 404);

    const loans = await db.loanRequest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    const mapped = loans.map(mapLoan);
    const totalRemaining = r2(
      mapped.filter((l) => l.status === "approved").reduce((a, l) => a + l.remaining, 0)
    );

    // للأدمن: مراقبة جميع القروض غير المسددة والمعلّقة
    if (user.role === "admin") {
      const [pending, approved] = await Promise.all([
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
      const unpaid = approved.map(mapLoan);
      return ok({
        loans: mapped,
        totalRemaining,
        monitoring: {
          pending: pending.map(mapLoan),
          unpaid,
          unpaidCount: unpaid.length,
          unpaidTotal: r2(unpaid.reduce((a, l) => a + l.remaining, 0)),
        },
      });
    }

    return ok({ loans: mapped, totalRemaining });
  } catch {
    return fail("تعذر تحميل القروض", 500);
  }
}

export async function POST(req: Request) {
  try {
    const { userId, amount, note } = await req.json();
    const amt = r2(Number(amount));
    if (!userId || !amt) return fail("بيانات الطلب غير مكتملة");
    if (amt < MIN_LOAN) return fail(`أقل مبلغ لطلب قرض ${MIN_LOAN.toLocaleString("en-US")} ل.س`);
    if (amt > 50_000_000) return fail("المبلغ كبير جداً — راجع الإدارة");

    const user = await db.user.findUnique({ where: { id: String(userId) } });
    if (!user) return fail("المستخدم غير موجود", 404);

    // لا يُسمح بطلب جديد إذا كان لديه طلب معلّق
    const pending = await db.loanRequest.findFirst({ where: { userId, status: "pending" } });
    if (pending) return fail("لديك طلب قرض قيد المراجعة — انتظر قرار الإدارة");

    const loan = await db.loanRequest.create({
      data: {
        userId,
        amount: amt,
        currency: "SYP",
        note: note ? String(note).slice(0, 80) : null,
      },
    });
    return ok({ loan: mapLoan(loan) });
  } catch {
    return fail("تعذر إرسال الطلب", 500);
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, action, adminId, amount, pin } = await req.json();
    if (!id || !action) return fail("بيانات ناقصة");

    const loan = await db.loanRequest.findUnique({ where: { id: String(id) } });
    if (!loan) return fail("القرض غير موجود", 404);

    // ==== قرار الإدارة: قبول / رفض ====
    if (action === "approve" || action === "reject") {
      const admin = await db.user.findUnique({ where: { id: String(adminId ?? "") } });
      if (!admin || admin.role !== "admin") return fail("قرار القروض متاح لأدمن المحفظة فقط", 403);
      if (loan.status !== "pending") return fail("هذا الطلب عولج مسبقاً");

      if (action === "reject") {
        const updated = await db.loanRequest.update({
          where: { id: loan.id },
          data: { status: "rejected" },
        });
        return ok({ loan: mapLoan(updated) });
      }

      // القبول: شحن الرصيد فوراً + قيد معاملة صرف قرض
      const reference = genRef();
      await db.$transaction([
        db.wallet.upsert({
          where: { userId: loan.userId },
          update: { balance: { increment: loan.amount } },
          create: { userId: loan.userId, balance: loan.amount },
        }),
        db.loanRequest.update({ where: { id: loan.id }, data: { status: "approved" } }),
        db.transaction.create({
          data: {
            reference,
            type: "loan",
            amount: loan.amount,
            toUserId: loan.userId,
            note: loan.note ?? "صرف قرض موافق عليه",
          },
        }),
      ]);
      const updated = await db.loanRequest.findUnique({ where: { id: loan.id } });
      return ok({ loan: updated ? mapLoan(updated) : null });
    }

    // ==== السداد: جزئي أو كامل من رصيد المحفظة (رمز الدفع 4 أرقام) ====
    if (action === "repay") {
      if (loan.status !== "approved") return fail("هذا القرض غير قابل للسداد حالياً");
      if (String(pin ?? "") !== (await db.user.findUnique({ where: { id: loan.userId } }))?.pin)
        return fail("رمز الدفع غير صحيح");

      const remaining = loanTotalDue(loan.amount, loan.paidAmount, loan.feesAccrued);
      const requested = amount === undefined || amount === null ? remaining : r2(Number(amount));
      if (!requested || requested <= 0) return fail("أدخل مبلغ سداد صحيح");
      if (requested > remaining) return fail(`المتبقي على القرض ${remaining.toLocaleString("en-US")} ل.س فقط`);

      const wallet = await db.wallet.findUnique({ where: { userId: loan.userId } });
      if (!wallet || wallet.balance < requested)
        return fail("الرصيد غير كافٍ للسداد — اشحن محفظتك أولاً");

      const newPaid = r2(loan.paidAmount + requested);
      const fullyPaid = newPaid >= r2(loan.amount + loan.feesAccrued);
      const reference = genRef();

      await db.$transaction([
        db.wallet.update({
          where: { userId: loan.userId },
          data: { balance: { decrement: requested } },
        }),
        db.loanRequest.update({
          where: { id: loan.id },
          data: { paidAmount: newPaid, status: fullyPaid ? "paid" : "approved" },
        }),
        db.transaction.create({
          data: {
            reference,
            type: "loan_repay",
            amount: requested,
            fromUserId: loan.userId,
            note: fullyPaid ? "سداد كامل للقرض" : "سداد جزئي للقرض",
          },
        }),
      ]);

      const updated = await db.loanRequest.findUnique({ where: { id: loan.id } });
      const w = await db.wallet.findUnique({ where: { userId: loan.userId } });
      return ok({
        loan: updated ? mapLoan(updated) : null,
        reference,
        paid: requested,
        balance: r2(w?.balance ?? 0),
        fullyPaid,
      });
    }

    return fail("إجراء غير معروف");
  } catch {
    return fail("تعذر تنفيذ الإجراء", 500);
  }
}
