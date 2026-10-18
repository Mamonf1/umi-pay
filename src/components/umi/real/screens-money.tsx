"use client";

// UMI PAY — شاشات المال: التحويل + شحن المحفظة
import { useEffect, useState } from "react";
import { Search, UserRound } from "lucide-react";
import { AmountPad, PinPad, ScreenHeader, SuccessView } from "@/components/umi/real/pads";
import { api } from "@/lib/umi-client";
import { useRates } from "@/lib/rates";
import { omiToSyp, fmtSyp } from "@/lib/currency";
import { fmt, type Contact, type Me } from "@/lib/umi-types";

/* ============ شاشة الإرسال (تدفق كامل) ============ */
export function SendScreen({
  me,
  onDone,
  onExit,
}: {
  me: Me;
  onDone: () => void;
  onExit: () => void;
}) {
  const [step, setStep] = useState<"pick" | "amount" | "confirm" | "success">("pick");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [q, setQ] = useState("");
  const [target, setTarget] = useState<Contact | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [pinErr, setPinErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ reference: string; amount: number } | null>(null);

  useEffect(() => {
    api<Contact[]>(`/api/umi/contacts?userId=${me.id}&q=${encodeURIComponent(q)}`)
      .then(setContacts)
      .catch(() => setContacts([]));
  }, [me.id, q]);

  const submit = async (pin: string) => {
    setBusy(true);
    setPinErr("");
    try {
      const res = await api<{ reference: string; amount: number }>("/api/umi/transfer", {
        method: "POST",
        body: JSON.stringify({ fromId: me.id, toId: target?.id, amount: Number(amount), note, pin }),
      });
      setResult(res);
      setStep("success");
    } catch (e) {
      setPinErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (step === "success" && result)
    return <SuccessView title={`تم التحويل إلى ${target?.name}`} amount={result.amount} reference={result.reference} onDone={onDone} />;

  if (step === "pick")
    return (
      <div className="h-full flex flex-col bg-umi-bg">
        <ScreenHeader title="إرسال أموال" subtitle="اختر جهة الاتصال" onBack={onExit} />
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-umi-muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ابحث بالاسم أو الجوال…"
              className="w-full h-10 rounded-xl umi-card bg-transparent pr-9 pl-3 text-[12px] font-tajawal text-umi-cream placeholder:text-umi-muted/50 outline-none focus:border-umi-gold/40"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto umi-scroll pb-24">
          {contacts.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setTarget(c);
                setStep("amount");
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 active:bg-white/5 text-right"
            >
              <span className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 grid place-items-center text-lg">{c.avatar}</span>
              <span className="flex-1 min-w-0">
                <span className="block text-[13px] font-tajawal font-bold text-umi-cream truncate">{c.name}</span>
                <span className="block text-[10px] font-tajawal text-umi-muted" dir="ltr">{c.phone}</span>
              </span>
              {c.role === "merchant" && <span className="text-[9px] font-tajawal text-umi-gold umi-card rounded-full px-2 py-0.5">تاجر</span>}
            </button>
          ))}
          {contacts.length === 0 && (
            <p className="text-center text-[11px] font-tajawal text-umi-muted py-10">لا توجد نتائج مطابقة</p>
          )}
        </div>
      </div>
    );

  if (step === "amount")
    return (
      <div className="h-full flex flex-col bg-umi-bg">
        <ScreenHeader title={`إلى ${target?.name}`} subtitle={`الرصيد: ${fmt(me.balance)} OMI`} onBack={() => setStep("pick")} />
        <div className="px-4">
          <div className="flex items-center gap-2.5 mb-2">
            <span className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 grid place-items-center">{target?.avatar}</span>
            <span className="text-[12px] font-tajawal text-umi-cream">{target?.name}</span>
          </div>
        </div>
        <div className="flex-1 flex flex-col justify-end pb-24">
          <AmountPad value={amount} onChange={setAmount} />
          <div className="px-4 mt-3">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="ملاحظة (اختياري)"
              maxLength={60}
              className="w-full h-10 rounded-xl umi-card bg-transparent px-3 text-[12px] font-tajawal text-umi-cream placeholder:text-umi-muted/50 outline-none focus:border-umi-gold/40"
            />
          </div>
          <div className="px-4 mt-3">
            <button
              type="button"
              disabled={busy || !Number(amount)}
              onClick={() => setStep("confirm")}
              className="w-full h-11 rounded-xl font-cairo font-extrabold text-sm text-[#0a0416] disabled:opacity-40 active:scale-[0.98] transition-all"
              style={{ background: "linear-gradient(135deg,#f5dfa0,#e8c766 55%,#c99b3f)" }}
            >
              متابعة
            </button>
          </div>
        </div>
      </div>
    );

  // confirm — رمز سري
  return (
    <div className="h-full flex flex-col bg-umi-bg">
      <ScreenHeader title="تأكيد التحويل" onBack={() => setStep("amount")} />
      <div className="px-6 py-3">
        <div className="rounded-2xl p-4 umi-card text-center">
          <p className="text-[11px] font-tajawal text-umi-muted mb-1">تحويل إلى {target?.name}</p>
          <ConfirmAmount amount={Number(amount) || 0} />
          {note && <p className="text-[11px] font-tajawal text-umi-muted mt-1">«{note}»</p>}
        </div>
        <p className="text-center text-[11px] font-tajawal text-umi-muted mt-5 mb-1">أدخل الرمز السري للمصادقة</p>
        <PinPad onComplete={submit} error={pinErr} />
      </div>
      <div className="pb-24" />
    </div>
  );
}

/** مبلغ التأكيد — OMI + مكافئ الليرة */
function ConfirmAmount({ amount }: { amount: number }) {
  const { rates } = useRates();
  return (
    <div>
      <p className="font-cairo font-black text-[28px] gold-text leading-tight" dir="ltr">
        {fmt(amount)}<span className="text-sm text-umi-muted"> OMI</span>
      </p>
      <p className="text-[10px] font-tajawal text-umi-muted" dir="ltr">≈ {fmtSyp(omiToSyp(amount, rates.usdSyp))} ل.س</p>
    </div>
  );
}

/* ============ ورقة شحن المحفظة ============ */
export function TopUpSheet({
  me,
  onClose,
  onDone,
}: {
  me: Me;
  onClose: () => void;
  onDone: () => void;
}) {
  const [amount, setAmount] = useState("50000");
  const [method, setMethod] = useState<"mada" | "applepay" | "card">("mada");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState<{ reference: string; amount: number } | null>(null);

  const methods = [
    { key: "mada" as const, label: "مدى", icon: "💳" },
    { key: "applepay" as const, label: "Apple Pay", icon: "" },
    { key: "card" as const, label: "بطاقة", icon: "🏦" },
  ];

  const submit = async () => {
    setBusy(true);
    setErr("");
    try {
      const res = await api<{ reference: string; amount: number }>("/api/umi/topup", {
        method: "POST",
        body: JSON.stringify({ userId: me.id, amount: Number(amount), method }),
      });
      setDone(res);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (done)
    return (
      <div className="absolute inset-0 z-40 bg-umi-bg">
        <SuccessView title="تم شحن المحفظة" amount={done.amount} reference={done.reference} onDone={onDone} />
      </div>
    );

  return (
    <div className="absolute inset-0 z-40 bg-umi-bg flex flex-col">
      <ScreenHeader title="شحن المحفظة" subtitle={`الرصيد الحالي: ${fmt(me.balance)} OMI`} onBack={onClose} />
      <div className="flex gap-1.5 px-4 pb-2">
        {methods.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setMethod(m.key)}
            className={`flex-1 h-10 rounded-xl text-[11px] font-tajawal font-bold transition-colors ${
              method === m.key ? "text-[#0a0416]" : "text-umi-muted umi-card"
            }`}
            style={method === m.key ? { background: "linear-gradient(135deg,#f5dfa0,#e8c766)" } : undefined}
          >
            {m.label}
          </button>
        ))}
      </div>
      <div className="flex-1 flex flex-col justify-end pb-24">
        <div className="flex gap-1.5 px-4 pb-2 justify-center">
          {[
            { v: 25000, label: "25 ألف" },
            { v: 50000, label: "50 ألف" },
            { v: 100000, label: "100 ألف" },
            { v: 250000, label: "250 ألف" },
          ].map(({ v, label }) => (
            <button
              key={v}
              type="button"
              onClick={() => setAmount(String(v))}
              className={`px-3 h-8 rounded-full text-[10px] font-tajawal font-bold umi-card transition-colors ${
                amount === String(v) ? "text-umi-gold border-umi-gold/40" : "text-umi-muted"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <AmountPad value={amount} onChange={setAmount} />
        {err && <p className="text-center text-[11px] font-tajawal text-umi-red mt-2">{err}</p>}
        <div className="px-4 mt-3">
          <button
            type="button"
            disabled={busy || !Number(amount)}
            onClick={submit}
            className="w-full h-11 rounded-xl font-cairo font-extrabold text-sm text-[#0a0416] disabled:opacity-40 active:scale-[0.98] transition-all"
            style={{ background: "linear-gradient(135deg,#f5dfa0,#e8c766 55%,#c99b3f)" }}
          >
            {busy ? "جارٍ الشحن…" : "شحن الآن"}
          </button>
        </div>
      </div>
    </div>
  );
}

/** أيقونة مستخدم افتراضية */
export function UnknownAvatar() {
  return (
    <span className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 grid place-items-center text-umi-muted">
      <UserRound className="w-4 h-4" />
    </span>
  );
}
