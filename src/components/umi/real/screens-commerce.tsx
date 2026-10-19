"use client";

// UMI PAY — المتاجر وبوابة الدفع (بالليرة السورية + رمز دفع 4 أرقام)
import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { StatusBar } from "@/components/umi/phone-frame";
import { ScreenHeader, AmountPad, PinPad, ProcessingView, SypAmount } from "@/components/umi/real/pads";
import { api } from "@/lib/umi-client";
import { fmtSyp, usdLine, SYP_UNIT } from "@/lib/currency";
import type { Me, MerchantT } from "@/lib/umi-types";

export function StoresScreen({ me, onExit, onPaid }: { me: Me; onExit: () => void; onPaid: () => void }) {
  const [merchants, setMerchants] = useState<MerchantT[] | null>(null);
  const [picked, setPicked] = useState<MerchantT | null>(null);
  const [amount, setAmount] = useState("");
  const [stage, setStage] = useState<"pick" | "amount" | "pin" | "processing">("pick");
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState<{ ref: string; amount: number; merchant: string } | null>(null);

  useEffect(() => {
    api<{ merchants: MerchantT[] }>("/api/umi/merchants")
      .then((d) => setMerchants(d.merchants))
      .catch(() => setMerchants([]));
  }, []);

  const pay = async (code: string) => {
    setStage("processing");
    setErr("");
    try {
      const r = await api<{ reference: string; amount: number; merchant: string }>("/api/umi/checkout", {
        method: "POST",
        body: JSON.stringify({ userId: me.id, merchantId: picked?.id, amount: Number(amount), pin: code }),
      });
      setSuccess(r);
    } catch (e) {
      setErr((e as Error).message);
      setStage("pin");
    }
  };

  if (success)
    return (
      <div className="h-full flex flex-col items-center justify-center px-8 text-center bg-umi-bg">
        <div className="w-20 h-20 rounded-full grid place-items-center mb-5 umi-glow" style={{ background: "linear-gradient(135deg,#f5dfa0,#e8c766 55%,#c99b3f)" }}>
          <ShieldCheck className="w-10 h-10 text-[#0a0416]" strokeWidth={2.6} />
        </div>
        <h3 className="font-cairo font-extrabold text-xl text-umi-cream mb-1">تم الدفع بنجاح</h3>
        <SypAmount amount={success.amount} />
        <p className="text-[12px] font-tajawal text-umi-cream">{success.merchant}</p>
        <p className="text-[11px] font-tajawal text-umi-muted mt-1" dir="ltr">{success.ref}</p>
        <button
          type="button"
          onClick={() => { onPaid(); }}
          className="mt-6 h-11 px-8 rounded-xl font-cairo font-extrabold text-sm text-[#0a0416]"
          style={{ background: "linear-gradient(135deg,#f5dfa0,#e8c766 55%,#c99b3f)" }}
        >
          عودة للمحفظة
        </button>
      </div>
    );
  if (stage === "processing") return <ProcessingView label="جارٍ تنفيذ الدفع عبر بوابة أومي" />;

  return (
    <div className="h-full flex flex-col bg-umi-bg">
      <ScreenHeader
        title="المتاجر"
        subtitle={stage === "pick" ? "بوابة دفع أومي — بالليرة السورية" : stage === "amount" ? `الدفع لـ ${picked?.name}` : "أكّد برمز الدفع"}
        onBack={stage === "pick" ? onExit : stage === "amount" ? () => setStage("pick") : () => setStage("amount")}
      />
      <div className="flex-1 overflow-y-auto umi-scroll pb-24">
        {stage === "pick" && (
          <div className="px-4 grid grid-cols-2 gap-2.5">
            {merchants === null && <p className="col-span-2 text-center text-umi-muted text-[11px] font-tajawal pt-10 animate-pulse">جارٍ التحميل…</p>}
            {merchants?.length === 0 && (
              <p className="col-span-2 text-center text-[11px] font-tajawal text-umi-muted py-10 leading-relaxed">
                لا توجد متاجر بعد — سجّل حساب تاجر وسيظهر متجرك هنا تلقائياً
              </p>
            )}
            {merchants?.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => { setPicked(m); setStage("amount"); }}
                className="rounded-2xl umi-card p-3.5 text-right active:bg-white/10 transition-colors"
              >
                <span
                  className="w-11 h-11 rounded-2xl grid place-items-center text-xl mb-2"
                  style={{ background: `${m.color}22`, border: `1px solid ${m.color}55` }}
                >
                  {m.emoji}
                </span>
                <span className="block text-[12px] font-tajawal font-bold text-umi-cream truncate">{m.name}</span>
                <span className="block text-[9px] font-tajawal text-umi-muted">{m.category}</span>
              </button>
            ))}
          </div>
        )}

        {stage === "amount" && picked && (
          <div>
            <AmountPad value={amount} onChange={setAmount} accent={picked.color} hint={`الرصيد: ${fmtSyp(me.balance)} ${SYP_UNIT}`} />
            <div className="px-4">
              <button
                type="button"
                disabled={!Number(amount)}
                onClick={() => setStage("pin")}
                className="w-full h-11 mt-3 rounded-xl font-cairo font-extrabold text-sm text-[#0a0416] disabled:opacity-40 active:scale-[0.98] transition-all"
                style={{ background: "linear-gradient(135deg,#f5dfa0,#e8c766 55%,#c99b3f)" }}
              >
                متابعة — رمز الدفع
              </button>
            </div>
          </div>
        )}

        {stage === "pin" && picked && (
          <div className="px-4">
            <div className="rounded-2xl umi-card p-4 mb-2 text-center">
              <p className="text-[11px] font-tajawal text-umi-muted">دفع لـ {picked.emoji} {picked.name}</p>
              <SypAmount amount={Number(amount) || 0} />
            </div>
            <PinPad onComplete={pay} error={err} title="رمز الدفع — 4 أرقام فقط" />
          </div>
        )}
      </div>
    </div>
  );
}
