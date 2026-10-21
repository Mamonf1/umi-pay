// POST /api/umi/admin/sync-rate — جلب سعر الدولار مقابل الليرة السورية (أدمن فقط)
// سلسلة المصادر:
//   1) SP-Today (api-v2.sp-today.com) — إن وُجد مفتاح محفوظ — السعر السوري الموازي/السوق
//   2) open.er-api.com (Exchangerate-API) — المصدر المجاني الموثوق (السعر الرسمي العالمي)
// الوضع الآمن: يجلب السعر ويعرضه دون تطبيق — التطبيق بقرار الأدمن عبر apply:true
// إجراءات: saveKey (حفظ مفتاح SP-Today) | clearKey (إزالته)
import { db } from "@/lib/db";
import { fail, ok } from "@/lib/umi-server";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";
const FREE_URL = "https://open.er-api.com/v6/latest/USD";

// مسارات SP-Today المرشحة — أول مسار يعمل ويُرجع سعراً منطقياً يُعتمد
// (التوثيق الرسمي داخل لوحة التاجر يحدد المسار الفعلي — يُكمل هذا الترتيب الاحتياطي)
const SPT_BASE = "https://api-v2.sp-today.com";
const SPT_PATHS = [
  "/api/exchange-rates",
  "/api/latest",
  "/api/rates",
  "/api/exchange_rates",
];

async function settingsRow() {
  let s = await db.currencySettings.findUnique({ where: { id: "main" } });
  if (!s) s = await db.currencySettings.create({ data: { id: "main" } });
  return s;
}

/** استخراج سعر SYP من أي JSON — بحث عميق عن مفتاح يحوي syp مع قيمة رقمية منطقية */
function extractSyp(obj: unknown, depth = 0): number | null {
  if (depth > 6 || obj == null) return null;
  if (Array.isArray(obj)) {
    for (const it of obj) { const v = extractSyp(it, depth + 1); if (v) return v; }
    return null;
  }
  if (typeof obj !== "object") return null;
  const rec = obj as Record<string, unknown>;
  for (const [k, v] of Object.entries(rec)) {
    if (/syp/i.test(k)) {
      if (typeof v === "number" && v > 500 && v < 5_000_000) return Math.round(v);
      if (typeof v === "string" && /^\d+(\.\d+)?$/.test(v)) {
        const n = Math.round(Number(v));
        if (n > 500 && n < 5_000_000) return n;
      }
      // كائن مثل syp: {usd: ..., buy: ..., sell: ...}
      if (typeof v === "object") {
        const inner = v as Record<string, unknown>;
        for (const iv of Object.values(inner)) {
          const n = typeof iv === "number" ? iv : typeof iv === "string" && /^\d+(\.\d+)?$/.test(iv) ? Number(iv) : 0;
          if (n > 500 && n < 5_000_000) return Math.round(n);
        }
      }
    }
  }
  for (const v of Object.values(rec)) {
    const found = extractSyp(v, depth + 1);
    if (found) return found;
  }
  return null;
}

/** محاولة جلب السعر من SP-Today بالمفتاح — يُرجع السعر أو null */
async function fetchSpToday(key: string): Promise<{ rate: number | null; path: string | null; httpStatus: number | null }> {
  const headers = {
    "User-Agent": UA,
    Accept: "application/json",
    Authorization: `Bearer ${key}`,
    "X-API-KEY": key,
  };
  for (const p of SPT_PATHS) {
    try {
      const res = await fetch(SPT_BASE + p, { headers, cache: "no-store", signal: AbortSignal.timeout(10000) });
      if (!res.ok) continue;
      const txt = await res.text();
      if (txt.trim().startsWith("<")) continue; // صفحة Cloudflare — تجاوز
      let json: unknown;
      try { json = JSON.parse(txt); } catch { continue; }
      const rate = extractSyp(json);
      if (rate) return { rate, path: p, httpStatus: res.status };
    } catch { /* المصدر التالي */ }
  }
  return { rate: null, path: null, httpStatus: null };
}

export async function POST(req: Request) {
  try {
    const { adminId, apply, rate, action, apiKey } = await req.json();
    const admin = await db.user.findUnique({ where: { id: String(adminId ?? "") } });
    if (!admin || admin.role !== "admin")
      return fail("المزامنة متاحة لأدمن المحفظة فقط", 403);

    const settings = settingsRow;

    // ==== إدارة مفتاح SP-Today ====
    if (action === "saveKey") {
      const clean = String(apiKey ?? "").trim();
      if (!clean || clean.length < 8) return fail("مفتاح غير صالح");
      await db.currencySettings.update({ where: { id: "main" }, data: { rateApiKey: clean } });
      return ok({ message: "حُفظ مفتاح SP-Today ✓ — سيعتمد أولاً عند المزامنة" });
    }
    if (action === "clearKey") {
      await db.currencySettings.update({ where: { id: "main" }, data: { rateApiKey: null } });
      return ok({ message: "أُزيل المفتاح — ستُستخدم المصادر المجانية" });
    }

    // ==== التطبيق النهائي بقرار الأدمن ====
    if (apply) {
      const r = Math.round(Number(rate));
      if (!r || r < 100 || r > 10_000_000) return fail("سعر غير صالح للتطبيق");
      const s = await db.currencySettings.update({ where: { id: "main" }, data: { usdSyp: r } });
      return ok({ applied: true, usdSyp: s.usdSyp, pointSyp: s.pointSyp, updatedAt: s.updatedAt });
    }

    // ==== الجلب فقط (دون تطبيق) — سلسلة المصادر ====
    const s = await settings();
    let fetched: number | null = null;
    let source = "";
    let sourceTime: string | null = null;
    let note = "";

    // 1) SP-Today بالمفتاح المحفوظ — السعر السوري (السوق)
    if (s.rateApiKey) {
      const sp = await fetchSpToday(s.rateApiKey);
      if (sp.rate) {
        fetched = sp.rate;
        source = "SP-Today (السوق السوري)";
        sourceTime = new Date().toISOString();
        note = `عبر ${sp.path}`;
      } else {
        note = "مفتاح SP-Today لم يُرجع سعراً (المسار الرسمي يُحدَّث من لوحة التاجر) — استُخدم المصدر الاحتياطي";
      }
    }

    // 2) المصدر المجاني الموثوق — احتياطي دائم
    if (!fetched) {
      const res = await fetch(FREE_URL, { cache: "no-store", signal: AbortSignal.timeout(12000) });
      if (!res.ok) {
        if (note) return fail(`تعذر الجلب: ${note}`);
        return fail("تعذر الاتصال بالمصدر الموثوق — أدخل السعر يدوياً");
      }
      const json = (await res.json()) as { result?: string; rates?: Record<string, number>; time_last_update_utc?: string };
      if (json.result !== "success" || !json.rates?.SYP)
        return fail("المصدر لم يُرجع سعر الليرة السورية — أدخل السعر يدوياً");
      fetched = Math.round(json.rates.SYP);
      source = "exchangerate-api.com (رسمي)";
      sourceTime = json.time_last_update_utc ?? null;
    }

    return ok({
      applied: false,
      fetched,
      current: s.usdSyp,
      source,
      sourceTime,
      note: note || null,
      hasKey: Boolean(s.rateApiKey),
      updatedAt: s.updatedAt,
    });
  } catch {
    return fail("تعذر جلب السعر من المصادر — أدخل السعر يدوياً");
  }
}
