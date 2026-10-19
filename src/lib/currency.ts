// UMI PAY — نظام العملة
// العملة الأساسية: الليرة السورية (ل.س) لكل الأرصدة والمعاملات والقروض
// الدولار: مكافئ عرض بقيمته الحقيقية عبر سعر صرف يديره أدمن المحفظة
// نقاط أومي: محفظة مكافآت — قيمتها pointSyp يحددها الأدمن — لا تُباع ولا تُشترى

/** وحدة العملة الأساسية */
export const SYP_UNIT = "ل.س";

/** تنسيق مبلغ بالليرة السورية — أعداد صحيحة كبيرة بلا خانات عشرية */
export const fmtSyp = (n: number) =>
  Math.round(n).toLocaleString("en-US", { maximumFractionDigits: 0 });

/** تنسيق مبلغ ليرة مع إشارة موجب/سالب */
export const fmtSypSigned = (n: number, sign: "" | "+" | "−" = "") =>
  `${sign}${fmtSyp(Math.abs(n))}`;

/** تحويل الليرة إلى دولار وفق سعر الصرف */
export const sypToUsd = (syp: number, usdSyp: number) =>
  usdSyp > 0 ? syp / usdSyp : 0;

/** تحويل دولار إلى ليرة */
export const usdToSyp = (usd: number, usdSyp: number) => usd * usdSyp;

/** تنسيق دولار: $72.50 أو -$47.50 */
export const fmtUsd = (n: number) => {
  const abs = Math.abs(n).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return (n < 0 ? "-$" : "$") + abs;
};

/** سطر المكافئ بالدولار تحت الرصيد — "≈ $50.00" */
export const usdLine = (syp: number, usdSyp: number) =>
  usdSyp > 0 ? `≈ ${fmtUsd(sypToUsd(syp, usdSyp))}` : "";

/** تحويل نقاط أومي إلى ليرة وفق قيمة النقطة المحددة من الأدمن */
export const pointsToSyp = (points: number, pointSyp: number) => points * pointSyp;

/** تنسيق النقاط — أعداد صحيحة */
export const fmtPoints = (n: number) =>
  Math.round(n).toLocaleString("en-US", { maximumFractionDigits: 0 });

/** تحقق كلمة مرور المحفظة: 8 خانات أو أكثر وتحتوي حروفاً وأرقاماً */
export function validatePass(p: string): string | null {
  if (!p || p.length < 8) return "كلمة المرور يجب أن تكون 8 خانات أو أكثر";
  if (!/[a-zA-Z\u0600-\u06FF]/.test(p)) return "كلمة المرور يجب أن تحتوي حروفاً";
  if (!/\d/.test(p)) return "كلمة المرور يجب أن تحتوي أرقاماً";
  return null;
}

/** تحقق رمز الدفع: 4 أرقام فقط */
export function validatePin(p: string): string | null {
  if (!/^\d{4}$/.test(p)) return "رمز الدفع يجب أن يكون 4 أرقام فقط";
  return null;
}
