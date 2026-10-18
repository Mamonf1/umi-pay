// UMI PAY — نظام عملة OMI
// OMI عملة خاصة بالمحفظة (ليست عملة مشفرة) — سعرها ثابت مقابل الدولار
// العملة البديلة: الليرة السورية (SYP) — سعرها يتحكم به أدمن المحفظة

/** سعر OMI الثابت مقابل الدولار: 1 OMI = 0.0005 دولار */
export const OMI_USD = 0.0005;

/** عدد وحدات OMI في الدولار الواحد: 1 دولار = 2,000 OMI */
export const USD_TO_OMI = 1 / OMI_USD; // 2000

/** تحويل OMI إلى دولار */
export const omiToUsd = (omi: number) => omi * OMI_USD;

/** تحويل دولار إلى OMI */
export const usdToOmi = (usd: number) => usd / OMI_USD;

/** تحويل OMI إلى ليرة سورية: OMI → دولار → ليرة */
export const omiToSyp = (omi: number, usdSyp: number) => omi * OMI_USD * usdSyp;

/** تحويل ليرة سورية إلى OMI */
export const sypToOmi = (syp: number, usdSyp: number) =>
  usdSyp > 0 ? syp / (OMI_USD * usdSyp) : 0;

/** تنسيق مبلغ OMI بخانتين عشريتين */
export const fmtOmi = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** تنسيق مبلغ OMI مختصر (بدون فواصل عشرية إذا كان صحيحاً) */
export const fmtOmiShort = (n: number) =>
  n.toLocaleString("en-US", { maximumFractionDigits: 2 });

/** تنسيق الليرة السورية — أعداد كبيرة بلا خانات عشرية */
export const fmtSyp = (n: number) =>
  n.toLocaleString("en-US", { maximumFractionDigits: 0 });

/** وحدة OMI للعرض في الواجهة */
export const OMI_UNIT = "OMI";

/** وحدة الليرة السورية */
export const SYP_UNIT = "ل.س";
