// GET /api/umi/report-pdf — تقرير PDF عربي
// ?userId=&from=&to=     → تقرير فترة مخصصة (ملخص + جدول عمليات)
// ?userId=&last=10       → تقرير آخر N عمليات
// ?userId=&peerId=       → كشف حساب مشترك بين المستخدم والطرف (يُستخدم في الدردشة)
import { db } from "@/lib/db";
import { fail } from "@/lib/umi-server";
import { baseHtml, docHead, fmtDate, fmtDateTime, fmtN, TYPE_AR, htmlToPdf } from "@/lib/pdf";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") ?? "";
    if (!userId) return fail("جلسة غير صالحة");

    const me = await db.user.findUnique({ where: { id: userId }, select: { name: true, phone: true } });
    if (!me) return fail("المستخدم غير موجود", 404);

    const peerId = searchParams.get("peerId");
    const last = searchParams.get("last");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const include = {
      from: { select: { name: true, avatar: true } },
      to: { select: { name: true, avatar: true } },
      merchant: { select: { name: true, emoji: true } },
    };

    // كشف حساب مشترك بين طرفين
    let where: any = peerId
      ? {
          OR: [
            { fromUserId: userId, toUserId: peerId },
            { fromUserId: peerId, toUserId: userId },
          ],
        }
      : { OR: [{ fromUserId: userId }, { toUserId: userId }] };

    let title = "تقرير عمليات";
    let sub = new Date().toISOString().slice(0, 10);
    if (peerId) {
      const peer = await db.user.findUnique({ where: { id: peerId }, select: { name: true, phone: true } });
      title = "كشف حساب مشترك";
      sub = `${me.name} ↔ ${peer?.name ?? "—"}`;
      if (!peer) return fail("الطرف غير موجود", 404);
    } else if (last) {
      title = `تقرير آخر ${last} عمليات`;
    } else if (from || to) {
      title = "تقرير فترة مخصصة";
      sub = `${from ? fmtDate(`${from}T00:00:00Z`) : "البداية"} — ${to ? fmtDate(`${to}T00:00:00Z`) : "اليوم"}`;
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(`${from}T00:00:00.000Z`);
      if (to) where.createdAt.lte = new Date(`${to}T23:59:59.999Z`);
    }

    const rows = await db.transaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: last ? Math.min(parseInt(last, 10) || 10, 100) : 500,
      include,
    });

    const items = rows.map((t) => {
      const isOut = t.fromUserId === userId;
      let counterparty = "شحن المحفظة";
      if (t.merchant) counterparty = `${t.merchant.emoji} ${t.merchant.name}`;
      else if (t.type === "topup") counterparty = "شحن مباشر";
      else if (t.type === "allowance") counterparty = "ولي الأمر";
      else if (isOut && t.to) counterparty = t.to.name;
      else if (!isOut && t.from) counterparty = t.from.name;
      return { t, isOut, counterparty };
    });

    const totalIn = items.filter((x) => !x.isOut).reduce((s, x) => s + x.t.amount, 0);
    const totalOut = items.filter((x) => x.isOut).reduce((s, x) => s + x.t.amount, 0);

    const tableRows = items
      .map(
        ({ t, isOut, counterparty }) => `<tr>
          <td style="direction:ltr">${t.reference}</td>
          <td>${TYPE_AR[t.type] ?? t.type}</td>
          <td>${counterparty}</td>
          <td>${fmtDateTime(t.createdAt.toISOString())}</td>
          <td class="${isOut ? "out" : "in"}" style="direction:ltr">${isOut ? "−" : "+"}${fmtN(t.amount)}</td>
        </tr>`
      )
      .join("");

    const html = baseHtml(`
      ${docHead(title, sub)}
      <div class="cards">
        <div class="card"><p class="lbl">عدد العمليات</p><p class="val">${items.length}</p></div>
        <div class="card g"><p class="lbl">إجمالي الوارد</p><p class="val" style="direction:ltr">+${fmtN(totalIn)} SYP</p></div>
        <div class="card r"><p class="lbl">إجمالي الصادر</p><p class="val" style="direction:ltr">−${fmtN(totalOut)} SYP</p></div>
        <div class="card"><p class="lbl">الصافي</p><p class="val" style="direction:ltr">${totalIn - totalOut >= 0 ? "+" : "−"}${fmtN(Math.abs(totalIn - totalOut))} SYP</p></div>
      </div>

      ${items.length === 0 ? `<p style="text-align:center; color:#8a829d; padding:30px 0; font-size:13px">لا توجد عمليات في هذا النطاق</p>` : `
      <table>
        <thead><tr><th>المرجع</th><th>النوع</th><th>الطرف</th><th>التاريخ</th><th>المبلغ (ل.س)</th></tr></thead>
        <tbody>${tableRows}</tbody>
      </table>`}

      <div class="stamp">
        صاحب التقرير: ${me.name}${me.phone ? ` — <span style="direction:ltr">${me.phone}</span>` : ""} ·
        التقرير صادر إلكترونياً من نظام أومي باي ويعكس جميع العمليات المسجلة حتى لحظة التوليد.
      </div>
    `);

    const buf = await htmlToPdf(html);
    return new Response(Buffer.from(buf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="umi-report-${Date.now()}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return fail("تعذر توليد التقرير", 500);
  }
}
