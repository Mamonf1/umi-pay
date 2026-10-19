"use client";

// UMI PAY — مكوّنات مشتركة: لوحة أرقام (ل.س + مكافئ $)، لوحة رمز دفع، شاشة نجاح، رأس شاشة
import { useEffect, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { StatusBar } from "@/components/umi/phone-frame";
import { useRates } from "@/lib/rates";
import { fmtSyp, usdLine, SYP_UNIT } from "@/lib/currency";

/** رأس شاشة داخلي مع زر رجوع */
export function ScreenHeader({
  title,
  onBack,
  subtitle,
}: {
  title: string;
  onBack?: () => void;
  subtitle?: string;
}) {
  return (
    <div className="px-4 pt-1 pb-3">
      <StatusBar />
      <div className="flex items-center gap-2 mt-2 min-h-9">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="رجوع"
            className="w-9 h-9 rounded-full umi-card grid place-items-center text-umi-cream active:scale-95 transition-transform"
          >
            <ArrowRight className="w-[18px] h-[18px]" strokeWidth={2} />
          </button>
        )}
        <div className="min-w-0">
          <h2 className="font-cairo font-bold text-[17px] text-umi-cream leading-tight truncate">{title}</h2>
          {subtitle && <p className="text-[10px] font-tajawal text-umi-muted leading-tight truncate">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

/** لوحة إدخال المبلغ — بالليرة السورية (العملة الأساسية) + مكافئ الدولار الحي */
export function AmountPad({
  value,
  onChange,
  accent = "#e8c766",
  hint,
}: {
  value: string;
  onChange: (v: string) => void;
  accent?: string;
  hint?: string;
}) {
  const { rates } = useRates();
  const press = (k: string) => {
    if (k === "del") return onChange(value.slice(0, -1));
    if (value === "0") return onChange(k);
    if (value.replace("", "").length >= 9) return;
    onChange(value + k);
  };
  const num = Number(value) || 0;
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "000", "0", "del"];
  return (
    <div>
      <div className="text-center py-4">
        <div dir="ltr" className="flex items-baseline justify-center gap-2">
          <span className="font-cairo font-black text-[34px] tracking-tight" style={{ color: accent }}>
            {value || "0"}
          </span>
          <span className="text-umi-muted font-tajawal text-sm">{SYP_UNIT}</span>
        </div>
        <p className="text-[11px] font-tajawal text-umi-gold/80 mt-0.5" dir="ltr">
          {usdLine(num, rates.usdSyp)}
        </p>
        {hint && <p className="text-[10px] font-tajawal text-umi-muted mt-1">{hint}</p>}
      </div>
      <div className="grid grid-cols-3 gap-1.5 px-2" dir="ltr">
        {keys.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => press(k)}
            aria-label={k === "del" ? "حذف" : k}
            className="h-11 rounded-xl umi-card font-cairo font-bold text-lg text-umi-cream active:bg-white/10 active:scale-95 transition-all"
          >
            {k === "del" ? "⌫" : k}
          </button>
        ))}
      </div>
    </div>
  );
}

/** لوحة رمز الدفع (4 أرقام فقط) — لتأكيد المدفوعات */
export function PinPad({ onComplete, error, title }: { onComplete: (pin: string) => void; error?: string; title?: string }) {
  const [pin, setPin] = useState("");
  useEffect(() => {
    if (pin.length === 4) {
      const t = setTimeout(() => {
        onComplete(pin);
        setPin("");
      }, 150);
      return () => clearTimeout(t);
    }
  }, [pin, onComplete]);
  const press = (k: string) => {
    if (k === "del") return setPin(pin.slice(0, -1));
    if (pin.length >= 4) return;
    setPin(pin + k);
  };
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];
  return (
    <div>
      {title && <p className="text-center text-[12px] font-tajawal text-umi-cream mb-1">{title}</p>}
      <div className="flex justify-center gap-3 py-4" dir="ltr">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
              i < pin.length ? "bg-umi-gold border-umi-gold" : "border-umi-muted/50"
            }`}
          />
        ))}
      </div>
      {error && <p className="text-center text-[11px] font-tajawal text-umi-red mb-2">{error}</p>}
      <div className="grid grid-cols-3 gap-1.5 px-2" dir="ltr">
        {keys.map((k, i) =>
          k === "" ? (
            <span key={i} />
          ) : (
            <button
              key={i}
              type="button"
              onClick={() => press(k)}
              aria-label={k === "del" ? "حذف" : k}
              className="h-11 rounded-xl umi-card font-cairo font-bold text-lg text-umi-cream active:bg-white/10 active:scale-95 transition-all"
            >
              {k === "del" ? "⌫" : k}
            </button>
          )
        )}
      </div>
    </div>
  );
}

/** مبلغ بالليرة + مكافئ الدولار (داخل شاشات النجاح وغيرها) */
export function SypAmount({ amount, sign = "" }: { amount: number; sign?: string }) {
  const { rates } = useRates();
  return (
    <div className="mb-1">
      <p className="font-cairo font-black text-[26px] gold-text leading-tight" dir="ltr">
        {sign}{fmtSyp(amount)} <span className="text-base font-tajawal">{SYP_UNIT}</span>
      </p>
      <p className="text-[11px] font-tajawal text-umi-muted" dir="ltr">{usdLine(amount, rates.usdSyp)}</p>
    </div>
  );
}

/** شاشة نجاح العملية */
export function SuccessView({
  title,
  amount,
  reference,
  onDone,
}: {
  title: string;
  amount?: number;
  reference?: string;
  onDone: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDone, 2400);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="h-full flex flex-col items-center justify-center px-8 text-center bg-umi-bg">
      <div
        className="w-20 h-20 rounded-full grid place-items-center mb-5 umi-glow"
        style={{ background: "linear-gradient(135deg,#f5dfa0,#e8c766 55%,#c99b3f)" }}
      >
        <Check className="w-10 h-10 text-[#0a0416]" strokeWidth={3} />
      </div>
      <h3 className="font-cairo font-extrabold text-xl text-umi-cream mb-1">{title}</h3>
      {amount !== undefined && <SypAmount amount={amount} />}
      {reference && (
        <p className="text-[11px] font-tajawal text-umi-muted" dir="ltr">
          {reference}
        </p>
      )}
      <p className="text-[11px] font-tajawal text-umi-teal mt-4">تم الحفظ في قاعدة البيانات ✓</p>
    </div>
  );
}

/** معالجة جارية (بوابة الدفع) */
export function ProcessingView({ label = "جارٍ تنفيذ العملية" }: { label?: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center bg-umi-bg">
      <div className="w-14 h-14 rounded-full border-[3px] border-umi-gold/25 border-t-umi-gold animate-spin" />
      <p className="mt-5 text-sm font-tajawal text-umi-cream">{label}…</p>
      <p className="mt-1 text-[10px] font-tajawal text-umi-muted">تشفير وإرسال آمن عبر بوابة أومي</p>
    </div>
  );
}

/** صف قائمة معاملة — المبلغ بالليرة السورية */
export function TxRow({
  emoji,
  title,
  sub,
  amount,
  direction,
  onClick,
}: {
  emoji: string;
  title: string;
  sub: string;
  amount: number;
  direction: "in" | "out" | "neutral";
  onClick?: () => void;
}) {
  const sign = direction === "out" ? "−" : direction === "in" ? "+" : "";
  const color = direction === "out" ? "text-umi-cream" : "text-umi-gold";
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-2.5 active:bg-white/5 transition-colors text-right"
    >
      <span className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 grid place-items-center text-lg shrink-0">
        {emoji}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[13px] font-tajawal font-bold text-umi-cream truncate">{title}</span>
        <span className="block text-[10px] font-tajawal text-umi-muted truncate">{sub}</span>
      </span>
      <span className={`font-cairo font-bold text-[13px] shrink-0 ${color}`} dir="ltr">
        {sign}{fmtSyp(amount)}
        <span className="text-[8px] text-umi-muted font-tajawal"> {SYP_UNIT}</span>
      </span>
    </button>
  );
}
