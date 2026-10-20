// GET /api/umi/receipt-pdf?txId=&userId= — إيصال عملية PDF عربي قابل للمشاركة
// المستخدم يجب أن يكون طرفاً في العملية — الإيصال بهوية أومي باي كاملة
import { db } from "@/lib/db";
import { fail } from "@/lib/umi-server";
import { baseHtml, docHead, fmtDateTime, fmtN, TYPE_AR, htmlToPdf } from "@/lib/pdf";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const txId = searchParams.get("txId") ?? "";
    const userId = searchParams.get("userId") ?? "";

    const tx = await db.transaction.findUnique({
      where: { id: txId },
      include: {
        from: { select: { name: true, phone: true, avatar: true } },
        to: { select: { name: true, phone: true, avatar: true } },
        merchant: { select: { name: true, emoji: true, category: true } },
      },
    });
    if (!tx) return fail("العملية غير موجودة", 404);
    if (userId && tx.fromUserId !== userId && tx.toUserId !== userId)
      return fail("لا تملك صلاحية عرض إيصال هذه العملية", 403);

    const isOut = tx.fromUserId === userId;
    const viewer = isOut ? tx.from : tx.to;
    const counterparty = tx.merchant
      ? `${tx.merchant.emoji ?? "🛒"} ${tx.merchant.name}`
      : tx.type === "topup"
        ? "شحن مباشر"
        : (isOut ? tx.to?.name : tx.from?.name) ?? "—";
    const counterpartyPhone = tx.merchant ? "" : (isOut ? tx.to?.phone : tx.from?.phone) ?? "";
    const dirAr = isOut ? "مبلغ صادر" : "مبلغ وارد";

    const html = baseHtml(`
      ${docHead("إيصال عملية مالية", `مرجع: ${tx.reference}`)}
      <div class="hero">
        <p class="lbl">${dirAr} — ${TYPE_AR[tx.type] ?? tx.type}</p>
        <p class="val" style="direction:ltr">${isOut ? "−" : "+"}${fmtN(tx.amount)} SYP</p>
        <p class="lbl" style="margin-top:4px">الحالة: <b>${tx.status === "completed" ? "مكتملة وناجحة ✓" : tx.status}</b></p>
      </div>

      <div class="kv"><span>رقم المرجع</span><b style="direction:ltr">${tx.reference}</b></div>
      <div class="kv"><span>نوع العملية</span><b>${TYPE_AR[tx.type] ?? tx.type}</b></div>
      <div class="kv"><span>الطرف الآخر</span><b>${counterparty}${counterpartyPhone ? ` — <span style="direction:ltr">${counterpartyPhone}</span>` : ""}</b></div>
      <div class="kv"><span>حساب صاحب الإيصال</span><b>${viewer?.name ?? "—"}${viewer?.phone ? ` — <span style="direction:ltr">${viewer.phone}</span>` : ""}</b></div>
      <div class="kv"><span>التاريخ والوقت</span><b>${fmtDateTime(tx.createdAt.toISOString())}</b></div>
      ${tx.note ? `<div class="kv"><span>ملاحظة</span><b>${tx.note}</b></div>` : ""}

      <div class="stamp">
        هذا الإيصال صادر إلكترونياً من نظام أومي باي وهو دليل رسمي لإتمام العملية أعلاه.
        يمكنك مشاركته مع الطرف الآخر أو مع جهة أخرى للتحقق — رقم المرجع يكفي للتحقق من العملية لدى إدارة المحفظة.
      </div>
    `);

    const buf = await htmlToPdf(html);
    return new Response(Buffer.from(buf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="umi-receipt-${tx.reference}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return fail("تعذر توليد الإيصال", 500);
  }
}
