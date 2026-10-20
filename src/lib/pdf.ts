// UMI PAY — محرك توليد PDF عربي (HTML → PDF عبر Chromium/Playwright)
// خط Tajawal مثبت في ~/.local/share/fonts — يظهر تلقائياً في Chromium
// يُستخدم: إيصال عملية مفردة + تقرير فترة + تقرير آخر 10 عمليات + كشف حساب مشترك

type PdfBrowser = { newPage: () => Promise<any>; close: () => Promise<void> };

let browserPromise: Promise<any> | null = null;

async function getBrowser() {
  if (!browserPromise) {
    const { chromium } = await import("playwright");
    browserPromise = chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  }
  return browserPromise;
}

export async function htmlToPdf(html: string): Promise<Uint8Array> {
  const browser = await getBrowser();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.setContent(html, { waitUntil: "load" });
  const buf: Uint8Array = await page.pdf({ format: "A4", printBackground: true, margin: { top: "0", bottom: "0", left: "0", right: "0" } });
  await ctx.close();
  return buf;
}

/* ============ قالب أساسي — هوية أومي باي ============ */
const GOLD = "#e8c766";
const PURPLE = "#7b5bc7";
const INK = "#231b33";

export function baseHtml(inner: string): string {
  return `<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Tajawal', sans-serif; color:${INK}; background:#fff; width:210mm; padding:12mm 14mm; }
  .head { display:flex; align-items:center; justify-content:space-between; border-bottom:3px solid ${GOLD}; padding-bottom:12px; margin-bottom:18px; }
  .brand { display:flex; align-items:center; gap:10px; }
  .logo { width:44px; height:44px; border-radius:13px; background:linear-gradient(135deg,#f5dfa0,${GOLD} 55%,#c99b3f); display:flex; align-items:center; justify-content:center; font-weight:900; font-size:24px; color:#0a0416; }
  .brand h1 { font-size:19px; color:${INK}; }
  .brand p { font-size:10px; color:#8a829d; }
  .doc-title { text-align:left; }
  .doc-title h2 { font-size:15px; color:${PURPLE}; }
  .doc-title p { font-size:10px; color:#8a829d; direction:ltr; }
  .hero { background:linear-gradient(135deg,#f5dfa0,${GOLD} 55%,#c99b3f); border-radius:16px; padding:16px 20px; margin-bottom:18px; color:#0a0416; }
  .hero .lbl { font-size:11px; opacity:.75; }
  .hero .val { font-size:26px; font-weight:900; }
  table { width:100%; border-collapse:collapse; font-size:11.5px; }
  th { background:#f4f0fa; color:${PURPLE}; padding:8px 10px; text-align:right; border-bottom:2px solid ${PURPLE}33; font-size:11px; }
  td { padding:7.5px 10px; border-bottom:1px solid #eee; }
  tr:nth-child(even) td { background:#fbfafd; }
  .in { color:#1d8a6e; font-weight:700; }
  .out { color:#b04a4a; font-weight:700; }
  .cards { display:flex; gap:10px; margin-bottom:18px; }
  .card { flex:1; border:1.5px solid ${PURPLE}22; border-radius:14px; padding:12px 14px; }
  .card .lbl { font-size:10px; color:#8a829d; }
  .card .val { font-size:17px; font-weight:900; color:${INK}; }
  .card.g .val { color:#1d8a6e; } .card.r .val { color:#b04a4a; }
  .kv { display:flex; justify-content:space-between; padding:7px 2px; border-bottom:1px dashed #e5e0ee; font-size:12px; }
  .kv b { color:${INK}; } .kv span { color:#6d6480; }
  .foot { margin-top:22px; border-top:2px solid ${GOLD}; padding-top:10px; display:flex; justify-content:space-between; font-size:9.5px; color:#8a829d; }
  .badge { display:inline-block; background:#e8f7f1; color:#1d8a6e; border-radius:99px; padding:2px 10px; font-size:10px; font-weight:700; }
  .stamp { margin-top:14px; background:#f8f5fd; border:1.5px dashed ${PURPLE}44; border-radius:12px; padding:10px 14px; font-size:10px; color:#6d6480; line-height:1.7; }
</style></head><body>${inner}
<div class="foot"><span>أومي باي UMI PAY — بوابة الدفع الإلكتروني</span><span>وُلّد آلياً بواسطة نظام أومي باي</span></div>
</body></html>`;
}

export function docHead(docTitle: string, docSub: string): string {
  return `<div class="head">
    <div class="brand">
      <div class="logo">U</div>
      <div><h1>أومي باي UMI PAY</h1><p>محفظة إلكترونية — الليرة السورية</p></div>
    </div>
    <div class="doc-title"><h2>${docTitle}</h2><p>${docSub}</p></div>
  </div>`;
}

/* أدوات تنسيق مشتركة مع الواجهة */
export const fmtN = (n: number) => Math.round(n).toLocaleString("en-US");
const AR_MONTHS = ["كانون الثاني","شباط","آذار","نيسان","أيار","حزيران","تموز","آب","أيلول","تشرين الأول","تشرين الثاني","كانون الأول"];
export function fmtDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${AR_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
export function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${fmtDate(iso)} — ${hh}:${mm}`;
}
export const TYPE_AR: Record<string, string> = {
  transfer: "تحويل بين حسابات",
  topup: "شحن محفظة",
  merchant: "دفع لمتجر",
  allowance: "مصروف أسبوعي",
  loan: "صرف قرض",
  loan_repay: "سداد قرض",
};
