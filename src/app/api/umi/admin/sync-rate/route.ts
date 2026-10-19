// POST /api/umi/admin/sync-rate — جلب سعر الدولار من مصدر موثوق (أدمن فقط)
// المصدر: open.er-api.com (Exchangerate-API)
// الوضع الآمن: يجلب السعر ويعرضه دون تطبيق — التطبيق بقرار الأدمن عبر apply:true
// (ملاحظة: المصدر يعطي السعر الرسمي وقد يختلف عن سعر السوق — لذلك لا يُطبَّق تلقائياً)
import { db } from "@/lib/db";
import { fail, ok } from "@/lib/umi-server";

const SOURCE_URL = "https://open.er-api.com/v6/latest/USD";
const SOURCE_NAME = "exchangerate-api.com";

export async function POST(req: Request) {
  try {
    const { adminId, apply, rate } = await req.json();
    const admin = await db.user.findUnique({ where: { id: String(adminId ?? "") } });
    if (!admin || admin.role !== "admin")
      return fail("المزامنة متاحة لأدمن المحفظة فقط", 403);

    const settings = async () => {
      let s = await db.currencySettings.findUnique({ where: { id: "main" } });
      if (!s) s = await db.currencySettings.create({ data: { id: "main" } });
      return s;
    };

    // ==== التطبيق النهائي بقرار الأدمن ====
    if (apply) {
      const r = Math.round(Number(rate));
      if (!r || r < 100 || r > 10_000_000) return fail("سعر غير صالح للتطبيق");
      const s = await db.currencySettings.upsert({
        where: { id: "main" },
        update: { usdSyp: r },
        create: { id: "main", usdSyp: r },
      });
      return ok({ applied: true, usdSyp: s.usdSyp, pointSyp: s.pointSyp, updatedAt: s.updatedAt });
    }

    // ==== الجلب فقط (دون تطبيق) ====
    const res = await fetch(SOURCE_URL, { cache: "no-store", signal: AbortSignal.timeout(12000) });
    if (!res.ok) return fail("تعذر الاتصال بالمصدر الموثوق — أدخل السعر يدوياً");
    const json = (await res.json()) as {
      result?: string;
      rates?: Record<string, number>;
      time_last_update_utc?: string;
    };
    if (json.result !== "success" || !json.rates?.SYP)
      return fail("المصدر لم يُرجع سعر الليرة السورية — أدخل السعر يدوياً");

    const fetched = Math.round(json.rates.SYP);
    const s = await settings();
    return ok({
      applied: false,
      fetched,
      current: s.usdSyp,
      source: SOURCE_NAME,
      sourceTime: json.time_last_update_utc ?? null,
      updatedAt: s.updatedAt,
    });
  } catch {
    return fail("تعذر جلب السعر من المصدر الموثوق — أدخل السعر يدوياً");
  }
}
