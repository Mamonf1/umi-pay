"use client";

// UMI PAY — شاشات المال: تحويل / شحن / القروض (بالليرة السورية + رمز دفع 4 أرقام)
import { useCallback, useEffect, useState } from "react";
import {
  ArrowDownLeft, HandCoins, ShieldCheck, Clock, CheckCheck, XCircle,
  Wallet, Landmark, BadgeCheck,
} from "lucide-react";
import { StatusBar } from "@/components/umi/shell";
import {
  ScreenHeader, AmountPad, PinPad, SuccessView, ProcessingView, SypAmount,
} from "@/components/umi/real/pads";
import { api } from "@/lib/umi-client";
import { useRates } from "@/lib/rates";
import { fmtSyp, usdLine, SYP_UNIT } from "@/lib/currency";
import {
  relTime, type Contact, type Me, type LoanItem, type LoansData,
} from "@/lib/umi-types";

const MIN_TOPUP = 25000;

/* ============ شاشة التحويل ============ */
export function SendScreen({ me, onDone, onExit }: { me: Me; onDone: () => void; onExit: () => void }) {
  const [contacts, setContacts] = useState<Contact[] | null>(null);
  const [to, setTo] = useState<Contact | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [stage, setStage] = useState<"pick" | "amount" | "pin">("pick");
  const [pin, setPinInput] = useState("");
  const [err, setErr] = useState("");
  const [done, setDone] = useState<{ ref: string; amount: number } | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    api<{ contacts: Contact[] }>(`/api/umi/contacts?userId=${me.id}`)
      .then((d) => setContacts(d.contacts))
      .catch(() => setContacts([]));
  }, [me.id]);

  const confirmPin = async (code: string) => {
    setPinInput(code);
    setProcessing(true);
    setErr("");
    try {
      const r = await api<{ reference: string; amount: number }>("/api/umi/transfer", {
        method: "POST",
        body: JSON.stringify({ fromId: me.id, toId: to?.id, amount: Number(amount), note, pin: code }),
      });
      setDone({ ref: r.reference, amount: r.amount });
    } catch (e) {
      setErr((e as Error).message);
      setProcessing(false);
    }
  };

  if (done)
    return (
      <SuccessView
        title="تم التحويل بنجاح"
        amount={done.amount}
        reference={done.ref}
        onDone={() => { onDone(); }}
      />
    );
  if (processing) return <ProcessingView label="جارٍ تنفيذ التحويل" />;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-umi-bg">
      <ScreenHeader
        title="تحويل أموال"
        subtitle={stage === "pick" ? "اختر المستلم" : stage === "amount" ? `إلى: ${to?.name}` : "أكّد برمز الدفع"}
        onBack={stage === "pick" ? onExit : stage === "amount" ? () => setStage("pick") : () => setStage("amount")}
      />
      <div className="flex-1 overflow-y-auto umi-scroll pb-6">
        {stage === "pick" && (
          <div className="px-4">
            {contacts === null && <p className="text-center text-umi-muted text-[11px] font-tajawal pt-10 animate-pulse">جارٍ التحميل…</p>}
            {contacts?.length === 0 && (
              <p className="text-center text-[11px] font-tajawal text-umi-muted py-10 leading-relaxed">
                لا يوجد مستخدمون آخرون بعد — شارك التطبيق ليفتح حسابه برقمه
              </p>
            )}
            {contacts?.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => { setTo(c); setStage("amount"); }}
                className="w-full flex items-center gap-3 px-2 py-3 rounded-2xl active:bg-white/5 text-right"
              >
                <span className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 grid place-items-center text-xl shrink-0">{c.avatar}</span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[13px] font-tajawal font-bold text-umi-cream truncate">{c.name}</span>
                  <span className="block text-[10px] font-tajawal text-umi-muted" dir="ltr">{c.phone}</span>
                </span>
                <span className="text-[9px] font-tajawal text-umi-gold px-2 py-0.5 rounded-full bg-umi-gold/10">
                  {c.role === "merchant" ? "تاجر" : "شخصي"}
                </span>
              </button>
            ))}
          </div>
        )}

        {stage === "amount" && to && (
          <div>
            <AmountPad value={amount} onChange={setAmount} hint={`الرصيد: ${fmtSyp(me.balance)} ${SYP_UNIT}`} />
            <div className="px-4 mt-3">
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="ملاحظة (اختياري)"
                className="w-full h-10 rounded-xl umi-card bg-transparent px-3.5 font-cairo text-[12px] text-umi-cream placeholder:text-umi-muted/50 outline-none focus:border-umi-gold/40"
              />
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

        {stage === "pin" && to && (
          <div className="px-4">
            <div className="rounded-2xl umi-card p-4 mb-2 text-center">
              <p className="text-[11px] font-tajawal text-umi-muted">تحويل إلى {to.name}</p>
              <SypAmount amount={Number(amount) || 0} />
              {note && <p className="text-[10px] font-tajawal text-umi-muted">ملاحظة: {note}</p>}
            </div>
            <PinPad onComplete={confirmPin} error={err} title="أدخل رمز الدفع (4 أرقام)" />
          </div>
        )}
      </div>
    </div>
  );
}

/* ============ شاشة شحن المحفظة (ورقة سفلية) ============ */
export function TopUpSheet({ me, onClose, onDone }: { me: Me; onClose: () => void; onDone: () => void }) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"mada" | "applepay" | "card">("mada");
  const [stage, setStage] = useState<"amount" | "processing" | "success">("amount");
  const [res, setRes] = useState<{ reference: string; amount: number } | null>(null);
  const [err, setErr] = useState("");

  const methods = [
    { key: "mada" as const, label: "بطاقة مدى", emoji: "💳" },
    { key: "applepay" as const, label: "Apple Pay", emoji: "" },
    { key: "card" as const, label: "بطاقة ائتمانية", emoji: "🏦" },
  ];

  const submit = async () => {
    setStage("processing");
    setErr("");
    try {
      const r = await api<{ reference: string; amount: number }>("/api/umi/topup", {
        method: "POST",
        body: JSON.stringify({ userId: me.id, amount: Number(amount), method }),
      });
      setRes(r);
      setStage("success");
    } catch (e) {
      setErr((e as Error).message);
      setStage("amount");
    }
  };

  return (
    <div className="absolute inset-0 z-40 bg-umi-bg flex flex-col">
      <ScreenHeader title="شحن المحفظة" subtitle={`أقل مبلغ ${MIN_TOPUP.toLocaleString("en-US")} ${SYP_UNIT}`} onBack={stage === "amount" ? onClose : undefined} />
      {stage === "amount" && (
        <div className="flex-1 overflow-y-auto umi-scroll pb-6">
          <AmountPad value={amount} onChange={setAmount} hint={`رصيدك الحالي: ${fmtSyp(me.balance)} ${SYP_UNIT}`} />
          <div className="px-4 mt-3">
            <div className="grid grid-cols-3 gap-2">
              {methods.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setMethod(m.key)}
                  className={`rounded-2xl px-2 py-3 umi-card text-center transition-colors ${method === m.key ? "border-umi-gold/50" : ""}`}
                >
                  <span className="text-lg block mb-1">{m.emoji}</span>
                  <span className="text-[9.5px] font-tajawal font-bold text-umi-cream block leading-tight">{m.label}</span>
                </button>
              ))}
            </div>
            {err && <p className="text-[11px] font-tajawal text-umi-red mt-2 text-center">{err}</p>}
            <button
              type="button"
              disabled={Number(amount) < MIN_TOPUP}
              onClick={submit}
              className="w-full h-11 mt-3 rounded-xl font-cairo font-extrabold text-sm text-[#0a0416] disabled:opacity-40 active:scale-[0.98] transition-all"
              style={{ background: "linear-gradient(135deg,#f5dfa0,#e8c766 55%,#c99b3f)" }}
            >
              شحن المحفظة
            </button>
          </div>
        </div>
      )}
      {stage === "processing" && <ProcessingView label="جارٍ شحن المحفظة" />}
      {stage === "success" && res && (
        <SuccessView title="تم شحن المحفظة" amount={res.amount} reference={res.reference} onDone={() => { onDone(); }} />
      )}
    </div>
  );
}

/* ============ شاشة القروض ============ */
function loanStatusView(s: LoanItem["status"]) {
  switch (s) {
    case "pending":
      return { label: "قيد المراجعة", color: "#e8c766", icon: <Clock className="w-3.5 h-3.5" /> };
    case "approved":
      return { label: "معتمد — غير مسدد", color: "#b8a4e8", icon: <Wallet className="w-3.5 h-3.5" /> };
    case "paid":
      return { label: "مسدد كاملاً", color: "#6fb5a3", icon: <CheckCheck className="w-3.5 h-3.5" /> };
    default:
      return { label: "مرفوض", color: "#c87b7b", icon: <XCircle className="w-3.5 h-3.5" /> };
  }
}

export function LoansScreen({ me, onChanged, onExit }: { me: Me; onChanged: () => void; onExit: () => void }) {
  const { rates } = useRates();
  const [data, setData] = useState<LoansData | null>(null);
  const [stage, setStage] = useState<"view" | "request">("view");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  // السداد
  const [repayFor, setRepayFor] = useState<LoanItem | null>(null);
  const [pinErr, setPinErr] = useState("");
  const [repayDone, setRepayDone] = useState<{ paid: number; ref: string; fullyPaid: boolean } | null>(null);

  const load = useCallback(() => {
    api<LoansData>(`/api/umi/loans?userId=${me.id}`)
      .then(setData)
      .catch(() => setData({ loans: [], totalRemaining: 0 }));
  }, [me.id]);
  useEffect(load, [load]);

  const requestLoan = async () => {
    setBusy(true);
    setErr("");
    try {
      await api("/api/umi/loans", {
        method: "POST",
        body: JSON.stringify({ userId: me.id, amount: Number(amount), note }),
      });
      setMsg("أُرسل طلب القرض — انتظر موافقة الإدارة ✓");
      setAmount("");
      setNote("");
      setStage("view");
      load();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const repay = async (loan: LoanItem, code: string) => {
    setBusy(true);
    setPinErr("");
    try {
      const r = await api<{ paid: number; reference: string; fullyPaid: boolean }>("/api/umi/loans", {
        method: "PATCH",
        body: JSON.stringify({ id: loan.id, action: "repay", pin: code }),
      });
      setRepayDone({ paid: r.paid, ref: r.reference, fullyPaid: r.fullyPaid });
      setRepayFor(null);
      load();
      onChanged();
    } catch (e) {
      setPinErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (repayDone)
    return (
      <SuccessView
        title={repayDone.fullyPaid ? "سُدّد القرض بالكامل ✓" : "تم السداد الجزئي"}
        amount={repayDone.paid}
        reference={repayDone.ref}
        onDone={() => setRepayDone(null)}
      />
    );

  return (
    <div className="min-h-[100dvh] flex flex-col bg-umi-bg">
      <ScreenHeader title="القروض" subtitle="بالليرة السورية — توافقها الإدارة وتُشحن فوراً" onBack={stage === "request" ? () => setStage("view") : onExit} />
      <div className="flex-1 overflow-y-auto umi-scroll pb-24">
        {stage === "view" && (
          <>
            {/* ملخص */}
            <section className="mx-4 rounded-[22px] p-4 umi-hero relative overflow-hidden">
              <div className="umi-shimmer-line absolute top-0 inset-x-0" />
              <div className="flex items-center gap-2.5 mb-1">
                <Landmark className="w-4 h-4 text-umi-gold" />
                <p className="text-[10.5px] font-tajawal text-umi-cream/70">إجمالي المتبقي عليك</p>
              </div>
              <p className="font-cairo font-black text-[26px] leading-none" dir="ltr" style={{ color: (data?.totalRemaining ?? 0) > 0 ? "#c87b7b" : "#6fb5a3" }}>
                {fmtSyp(data?.totalRemaining ?? 0)} <span className="text-xs font-tajawal text-umi-muted">{SYP_UNIT}</span>
              </p>
              <p className="text-[10px] font-tajawal text-umi-muted mt-1" dir="ltr">{usdLine(data?.totalRemaining ?? 0, rates.usdSyp)}</p>
              <button
                type="button"
                onClick={() => setStage("request")}
                className="w-full h-10 mt-3 rounded-xl font-cairo font-extrabold text-[12.5px] text-[#0a0416] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                style={{ background: "linear-gradient(135deg,#f5dfa0,#e8c766 55%,#c99b3f)" }}
              >
                <HandCoins className="w-4 h-4" /> طلب قرض جديد
              </button>
            </section>

            {msg && <p className="text-[11px] font-tajawal text-umi-teal text-center mt-3 px-4">{msg}</p>}

            {/* قائمة القروض */}
            <div className="mt-4 px-4 space-y-2.5">
              {data?.loans.length === 0 && (
                <p className="text-center text-[11px] font-tajawal text-umi-muted py-6 leading-relaxed">
                  لا توجد قروض بعد — اطلب قرضك الأول وستتواصل معك الإدارة
                </p>
              )}
              {data?.loans.map((l) => (
                <LoanRow
                  key={l.id}
                  loan={l}
                  onRepay={() => { setRepayFor(l); setPinErr(""); }}
                />
              ))}
            </div>
          </>
        )}

        {stage === "request" && (
          <div className="px-2">
            <AmountPad value={amount} onChange={setAmount} hint={`أقل مبلغ: 25,000 ${SYP_UNIT}`} />
            <div className="px-4 mt-3">
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="سبب القرض (اختياري)"
                className="w-full h-10 rounded-xl umi-card bg-transparent px-3.5 font-cairo text-[12px] text-umi-cream placeholder:text-umi-muted/50 outline-none focus:border-umi-gold/40"
              />
              {err && <p className="text-[11px] font-tajawal text-umi-red mt-2 text-center">{err}</p>}
              <button
                type="button"
                disabled={busy || Number(amount) < 25000}
                onClick={requestLoan}
                className="w-full h-11 mt-3 rounded-xl font-cairo font-extrabold text-sm text-[#0a0416] disabled:opacity-40 active:scale-[0.98] transition-all"
                style={{ background: "linear-gradient(135deg,#f5dfa0,#e8c766 55%,#c99b3f)" }}
              >
                {busy ? "جارٍ الإرسال…" : "إرسال الطلب للإدارة"}
              </button>
              <p className="text-[9.5px] font-tajawal text-umi-muted text-center mt-2 leading-relaxed flex items-center justify-center gap-1">
                <ShieldCheck className="w-3 h-3" /> يراجع الطلب أدمن المحفظة — عند القبول يُشحن رصيدك فوراً
              </p>
            </div>
          </div>
        )}
      </div>

      {/* تأكيد السداد برمز الدفع */}
      {repayFor && (
        <div className="absolute inset-0 z-40 bg-[#0a0416]/95 backdrop-blur-sm flex flex-col">
          <ScreenHeader title="تأكيد السداد" onBack={() => setRepayFor(null)} />
          <div className="px-4">
            <div className="rounded-2xl umi-card p-4 text-center mb-2">
              <p className="text-[11px] font-tajawal text-umi-muted">سداد قرض — المتبقي</p>
              <SypAmount amount={repayFor.remaining} />
              <p className="text-[9.5px] font-tajawal text-umi-muted">سيُخصم المبلغ كاملاً من رصيد محفظتك ({fmtSyp(me.balance)} {SYP_UNIT})</p>
            </div>
            <PinPad onComplete={(code) => repay(repayFor, code)} error={pinErr} title="أدخل رمز الدفع (4 أرقام)" />
          </div>
        </div>
      )}
    </div>
  );
}

/* صف قرض بحالته */
function LoanRow({ loan, onRepay }: { loan: LoanItem; onRepay: () => void }) {
  const { rates } = useRates();
  const st = loanStatusView(loan.status);
  const progress = loan.status === "paid" ? 100 : Math.min(100, Math.round((loan.paidAmount / loan.amount) * 100));
  return (
    <div className="rounded-2xl umi-card p-3.5">
      <div className="flex items-center justify-between mb-1.5">
        <span className="flex items-center gap-1.5 text-[10px] font-tajawal font-bold" style={{ color: st.color }}>
          {st.icon} {st.label}
        </span>
        <span className="text-[9px] font-tajawal text-umi-muted">{relTime(loan.createdAt)}</span>
      </div>
      <div className="flex items-baseline justify-between" dir="ltr">
        <p className="font-cairo font-black text-[17px] text-umi-cream">
          {fmtSyp(loan.amount)} <span className="text-[9px] font-tajawal text-umi-muted">{SYP_UNIT}</span>
        </p>
        <p className="text-[9.5px] font-tajawal text-umi-muted">{usdLine(loan.amount, rates.usdSyp)}</p>
      </div>
      {loan.status === "approved" && (
        <>
          <div className="h-1.5 rounded-full bg-white/5 mt-2 overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${progress}%`, background: "linear-gradient(90deg,#c99b3f,#f5dfa0)" }} />
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-[10px] font-tajawal text-umi-muted">
              سُدّد {fmtSyp(loan.paidAmount)} · المتبقي <b className="text-umi-red">{fmtSyp(loan.remaining)}</b> {SYP_UNIT}
            </p>
            <button
              type="button"
              onClick={onRepay}
              className="h-8 px-3.5 rounded-full font-tajawal font-bold text-[10.5px] text-[#0a0416] flex items-center gap-1"
              style={{ background: "linear-gradient(135deg,#f5dfa0,#e8c766)" }}
            >
              <ArrowDownLeft className="w-3 h-3" /> سداد
            </button>
          </div>
        </>
      )}
      {loan.status === "pending" && (
        <p className="text-[9.5px] font-tajawal text-umi-muted mt-1.5">بانتظار موافقة أدمن المحفظة — سيُشحن رصيدك عند القبول</p>
      )}
      {loan.note && <p className="text-[9px] font-tajawal text-umi-muted mt-1.5">سبب: {loan.note}</p>}
    </div>
  );
}
