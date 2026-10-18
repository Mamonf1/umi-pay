"use client";

// UMI PAY — المتاجر + بوابة الدفع (Checkout)
import { useEffect, useMemo, useState } from "react";
import { Store } from "lucide-react";
import { AmountPad, PinPad, ProcessingView, ScreenHeader, SuccessView } from "@/components/umi/real/pads";
import { api } from "@/lib/umi-client";
import { omiToSyp, fmtSyp } from "@/lib/currency";
import { useRates } from "@/lib/rates";
import { fmt, type Me, type MerchantT } from "@/lib/umi-types";

export function StoresScreen({
  me,
  onExit,
  onPaid,
}: {
  me: Me;
  onExit: () => void;
  onPaid: () => void;
}) {
  const [merchants, setMerchants] = useState<MerchantT[]>([]);
  const [cat, setCat] = useState("الكل");
  const [sel, setSel] = useState<MerchantT | null>(null);

  useEffect(() => {
    api<MerchantT[]>("/api/umi/merchants")
      .then(setMerchants)
      .catch(() => setMerchants([]));
  }, []);

  const cats = useMemo(() => ["الكل", ...new Set(merchants.map((m) => m.category))], [merchants]);
  const list = cat === "الكل" ? merchants : merchants.filter((m) => m.category === cat);

  return (
    <div className="h-full flex flex-col bg-umi-bg relative">
      <ScreenHeader title="المتاجر" subtitle="متصلون ببوابة أومي للدفع بعملة OMI" onBack={onExit} />
      <div className="flex gap-1.5 px-4 pb-3 overflow-x-auto no-scrollbar">
        {cats.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCat(c)}
            className={`px-3.5 h-8 rounded-full text-[11px] font-tajawal font-bold whitespace-nowrap transition-colors ${
              cat === c ? "text-[#0a0416]" : "text-umi-muted umi-card"
            }`}
            style={cat === c ? { background: "linear-gradient(135deg,#f5dfa0,#e8c766)" } : undefined}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto umi-scroll px-4 pb-24 space-y-2.5">
        {list.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setSel(m)}
            className="w-full umi-card rounded-2xl p-3.5 flex items-center gap-3 text-right active:bg-white/5 transition-colors"
          >
            <span
              className="w-12 h-12 rounded-2xl grid place-items-center text-2xl shrink-0 border border-white/10"
              style={{ background: `${m.color}22` }}
            >
              {m.emoji}
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-[14px] font-cairo font-bold text-umi-cream truncate">{m.name}</span>
              <span className="block text-[10px] font-tajawal text-umi-muted">{m.category}</span>
            </span>
            <span className="text-[11px] font-tajawal font-bold text-umi-gold umi-card rounded-full px-3 py-1.5">ادفع</span>
          </button>
        ))}
        {list.length === 0 && (
          <p className="text-center text-[11px] font-tajawal text-umi-muted py-10 flex flex-col items-center gap-2">
            <Store className="w-6 h-6 opacity-40" /> لا يوجد تجار في هذه الفئة
          </p>
        )}
      </div>

      {sel && (
        <CheckoutSheet
          me={me}
          merchant={sel}
          onClose={() => setSel(null)}
          onPaid={() => {
            setSel(null);
            onPaid();
          }}
        />
      )}
    </div>
  );
}

/** سطر مصادقة الدفع — OMI + مكافئ الليرة */
function PinAuthAmount({ amount }: { amount: number }) {
  const { rates } = useRates();
  return (
    <div className="text-center mb-2">
      <p className="text-[11px] font-tajawal text-umi-muted">
        مصادقة الدفع — <span dir="ltr" className="font-bold text-umi-cream">{fmt(amount)} OMI</span>
      </p>
      <p className="text-[9px] font-tajawal text-umi-muted" dir="ltr">≈ {fmtSyp(omiToSyp(amount, rates.usdSyp))} ل.س</p>
    </div>
  );
}

/* ============ بوابة الدفع ============ */
function CheckoutSheet({
  me,
  merchant,
  onClose,
  onPaid,
}: {
  me: Me;
  merchant: MerchantT;
  onClose: () => void;
  onPaid: () => void;
}) {
  const [step, setStep] = useState<"amount" | "pin" | "processing" | "done">("amount");
  const [amount, setAmount] = useState("");
  const [pinErr, setPinErr] = useState("");
  const [result, setResult] = useState<{ reference: string; amount: number } | null>(null);

  const pay = async (pin: string) => {
    setStep("processing");
    try {
      const res = await api<{ reference: string; amount: number }>("/api/umi/checkout", {
        method: "POST",
        body: JSON.stringify({ userId: me.id, merchantId: merchant.id, amount: Number(amount), pin }),
      });
      setResult(res);
      setTimeout(() => setStep("done"), 900);
    } catch (e) {
      setPinErr((e as Error).message);
      setStep("pin");
    }
  };

  if (step === "processing") return <ProcessingView label={`الدفع لـ ${merchant.name}`} />;
  if (step === "done" && result)
    return (
      <div className="absolute inset-0 z-50 bg-umi-bg">
        <SuccessView title={`تم الدفع لـ ${merchant.name}`} amount={result.amount} reference={result.reference} onDone={onPaid} />
      </div>
    );

  return (
    <div className="absolute inset-0 z-40 bg-umi-bg flex flex-col">
      <ScreenHeader title="بوابة الدفع" subtitle={`${merchant.emoji} ${merchant.name}`} onBack={step === "pin" ? () => setStep("amount") : onClose} />
      <div className="px-4 pb-2">
        <div className="rounded-2xl p-3 umi-card flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl grid place-items-center text-xl border border-white/10" style={{ background: `${merchant.color}22` }}>
            {merchant.emoji}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-cairo font-bold text-umi-cream truncate">{merchant.name}</p>
            <p className="text-[9px] font-tajawal text-umi-muted">دفع آمن · محفظة أومي</p>
          </div>
          <span className="text-[9px] font-tajawal text-umi-teal flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-umi-teal animate-umi-pulse" /> متصل
          </span>
        </div>
      </div>

      {step === "amount" ? (
        <div className="flex-1 flex flex-col justify-end pb-24">
          <AmountPad value={amount} onChange={setAmount} />
          <div className="px-4 mt-3">
            <button
              type="button"
              disabled={!Number(amount)}
              onClick={() => setStep("pin")}
              className="w-full h-11 rounded-xl font-cairo font-extrabold text-sm text-[#0a0416] disabled:opacity-40 active:scale-[0.98] transition-all"
              style={{ background: "linear-gradient(135deg,#f5dfa0,#e8c766 55%,#c99b3f)" }}
            >
              الدفع عبر بوابة أومي
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 pb-20">
          <PinAuthAmount amount={Number(amount) || 0} />
          <PinPad onComplete={pay} error={pinErr} />
        </div>
      )}
    </div>
  );
}
