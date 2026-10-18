"use client";

// UMI PAY — المحادثات (تحويل مضمّن) + الحسابات الفرعية
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, MessageCircle, Plus, Send, Snowflake, UserRound } from "lucide-react";
import { AmountPad, PinPad, ScreenHeader } from "@/components/umi/real/pads";
import { api } from "@/lib/umi-client";
import {
  fmt, relTime, type FamilyChild, type FamilyData, type Me, type MsgT, type ThreadT,
} from "@/lib/umi-types";
import { useRates } from "@/lib/rates";
import { omiToSyp, fmtSyp } from "@/lib/currency";

/* ============ المحادثات ============ */
export function ChatScreen({
  me,
  onExit,
  onChanged,
}: {
  me: Me;
  onExit: () => void;
  onChanged: () => void;
}) {
  const [threads, setThreads] = useState<ThreadT[] | null>(null);
  const [openThread, setOpenThread] = useState<ThreadT | null>(null);

  const load = useCallback(() => {
    api<ThreadT[]>(`/api/umi/chat?userId=${me.id}`)
      .then(setThreads)
      .catch(() => setThreads([]));
  }, [me.id]);

  useEffect(load, [load]);

  if (openThread)
    return (
      <ThreadView
        me={me}
        thread={openThread}
        onBack={() => {
          setOpenThread(null);
          load();
          onChanged();
        }}
      />
    );

  return (
    <div className="h-full flex flex-col bg-umi-bg">
      <ScreenHeader title="المحادثات" subtitle="حوّل المال داخل المحادثة" onBack={onExit} />
      <div className="flex-1 overflow-y-auto umi-scroll pb-24">
        {threads === null && <p className="text-center text-umi-muted text-[11px] font-tajawal pt-10 animate-pulse">جارٍ التحميل…</p>}
        {threads?.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setOpenThread(t)}
            className="w-full flex items-center gap-3 px-4 py-3 active:bg-white/5 text-right"
          >
            <span className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 grid place-items-center text-xl shrink-0">
              {t.peer.avatar}
            </span>
            <span className="flex-1 min-w-0">
              <span className="flex items-baseline justify-between gap-2">
                <span className="text-[13px] font-tajawal font-bold text-umi-cream truncate">{t.peer.name}</span>
                <span className="text-[9px] font-tajawal text-umi-muted shrink-0">{t.last ? relTime(t.last.createdAt) : ""}</span>
              </span>
              <span className="block text-[10px] font-tajawal text-umi-muted truncate mt-0.5">
                {t.last
                  ? t.last.kind === "transfer"
                    ? `${t.last.mine ? "أرسلت" : "استلمت"} ${fmt(t.last.amount ?? 0)} OMI 💸`
                    : `${t.last.mine ? "أنت: " : ""}${t.last.text}`
                  : "ابدأ المحادثة"}
              </span>
            </span>
          </button>
        ))}
        {threads?.length === 0 && (
          <p className="text-center text-[11px] font-tajawal text-umi-muted py-10 flex flex-col items-center gap-2">
            <MessageCircle className="w-6 h-6 opacity-40" /> لا توجد محادثات بعد
          </p>
        )}
      </div>
    </div>
  );
}

/* محادثة فردية */
function ThreadView({
  me,
  thread,
  onBack,
}: {
  me: Me;
  thread: ThreadT;
  onBack: () => void;
}) {
  const { rates } = useRates();
  const [msgs, setMsgs] = useState<MsgT[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<"amount" | "pin">("amount");
  const [pinErr, setPinErr] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    api<{ messages: MsgT[] }>(`/api/umi/chat/${thread.id}?userId=${me.id}`)
      .then((d) => setMsgs(d.messages))
      .catch(() => setMsgs([]));
  }, [thread.id, me.id]);

  useEffect(load, [load]);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs.length]);

  const sendText = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await api("/api/umi/chat", {
        method: "POST",
        body: JSON.stringify({ threadId: thread.id, userId: me.id, text }),
      });
      setText("");
      load();
    } catch {
      /* تجاهل */
    } finally {
      setSending(false);
    }
  };

  const sendTransfer = async (pin: string) => {
    setBusy(true);
    setPinErr("");
    try {
      await api("/api/umi/chat", {
        method: "POST",
        body: JSON.stringify({ threadId: thread.id, userId: me.id, amount: Number(amount), pin }),
      });
      setTransferOpen(false);
      setStep("amount");
      setAmount("");
      load();
    } catch (e) {
      setPinErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-umi-bg relative">
      <ScreenHeader
        title={thread.peer.name}
        subtitle={thread.peer.role === "merchant" ? "حساب تاجر موثّق" : "متصل"}
        onBack={onBack}
      />
      <div className="flex-1 overflow-y-auto umi-scroll px-4 py-3 space-y-2.5">
        {msgs.map((m) => (
          <div key={m.id} className={`flex ${m.mine ? "justify-start" : "justify-end"}`}>
            {m.kind === "transfer" ? (
              <div className={`max-w-[75%] rounded-2xl p-3 border ${m.mine ? "border-umi-gold/40" : "border-white/10"}`}
                style={{ background: m.mine ? "linear-gradient(135deg,rgba(232,199,102,.14),rgba(232,199,102,.05))" : "rgba(255,255,255,.04)" }}>
                <p className="text-[9px] font-tajawal text-umi-muted mb-0.5">{m.mine ? "أرسلت تحويلاً" : "استلمت تحويلاً"}</p>
                <p className="font-cairo font-black text-lg gold-text" dir="ltr">{fmt(m.amount ?? 0)}<span className="text-[11px] text-umi-muted"> OMI</span></p>
                <p className="text-[9px] font-tajawal text-umi-muted" dir="ltr">≈ {fmtSyp(omiToSyp(m.amount ?? 0, rates.usdSyp))} ل.س</p>
                <p className="text-[9px] font-tajawal text-umi-teal mt-0.5">مكتمل ✓ · محفوظ في القاعدة</p>
              </div>
            ) : (
              <div
                className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-[12px] font-tajawal leading-relaxed ${
                  m.mine ? "text-[#0a0416] rounded-br-md" : "text-umi-cream umi-card rounded-bl-md"
                }`}
                style={m.mine ? { background: "linear-gradient(135deg,#f5dfa0,#e8c766)" } : undefined}
              >
                {m.text}
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* شريط الإدخال */}
      <div className="px-3 pb-24 pt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setTransferOpen(true)}
          aria-label="إرسال مبلغ"
          className="w-10 h-10 rounded-full grid place-items-center text-[#0a0416] shrink-0 umi-glow"
          style={{ background: "linear-gradient(135deg,#f5dfa0,#e8c766 55%,#c99b3f)" }}
        >
          <Plus className="w-4.5 h-4.5" strokeWidth={2.4} />
        </button>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendText()}
          placeholder="اكتب رسالة…"
          className="flex-1 h-10 rounded-full umi-card bg-transparent px-4 text-[12px] font-tajawal text-umi-cream placeholder:text-umi-muted/50 outline-none focus:border-umi-gold/40"
        />
        <button
          type="button"
          onClick={sendText}
          disabled={sending || !text.trim()}
          aria-label="إرسال"
          className="w-10 h-10 rounded-full umi-card grid place-items-center text-umi-gold disabled:opacity-40 shrink-0"
        >
          <Send className="w-4 h-4 -scale-x-100" strokeWidth={1.9} />
        </button>
      </div>

      {/* ورقة التحويل داخل الشات */}
      {transferOpen && (
        <div className="absolute inset-0 z-40 bg-umi-bg flex flex-col">
          <ScreenHeader
            title="تحويل داخل المحادثة"
            subtitle={`إلى ${thread.peer.name}`}
            onBack={() => {
              setTransferOpen(false);
              setStep("amount");
              setPinErr("");
            }}
          />
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
                  متابعة
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 pt-2 pb-20">
              <p className="text-center text-[11px] font-tajawal text-umi-muted">
                مصادقة التحويل — <span dir="ltr" className="font-bold text-umi-cream">{fmt(Number(amount) || 0)} OMI</span>
              </p>
              <PinPad onComplete={sendTransfer} error={pinErr} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ============ الحسابات الفرعية ============ */
export function FamilyScreen({
  me,
  onExit,
  onChanged,
}: {
  me: Me;
  onExit: () => void;
  onChanged: () => void;
}) {
  const { rates } = useRates();
  const [data, setData] = useState<FamilyData | null>(null);
  const [allowChild, setAllowChild] = useState<FamilyChild | null>(null);
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<"amount" | "pin">("amount");
  const [pinErr, setPinErr] = useState("");
  const [limitChild, setLimitChild] = useState<FamilyChild | null>(null);
  const [limitVal, setLimitVal] = useState("");

  const load = useCallback(() => {
    api<FamilyData>(`/api/umi/family?userId=${me.id}`)
      .then(setData)
      .catch(() => setData(null));
  }, [me.id]);
  useEffect(load, [load]);

  const sendAllowance = async (pin: string) => {
    try {
      await api("/api/umi/family", {
        method: "POST",
        body: JSON.stringify({ parentId: me.id, childId: allowChild?.id, amount: Number(amount), pin }),
      });
      setAllowChild(null);
      setStep("amount");
      setAmount("");
      load();
      onChanged();
    } catch (e) {
      setPinErr((e as Error).message);
    }
  };

  const saveLimit = async () => {
    if (!limitChild) return;
    try {
      await api("/api/umi/family", {
        method: "PATCH",
        body: JSON.stringify({ memberId: limitChild.memberId, weeklyLimit: Number(limitVal) }),
      });
      setLimitChild(null);
      load();
    } catch {
      /* رسالة عبر النبضة لاحقاً */
    }
  };

  const toggleFreeze = async (c: FamilyChild) => {
    await api("/api/umi/family", {
      method: "PATCH",
      body: JSON.stringify({ memberId: c.memberId, frozen: !c.frozen }),
    });
    load();
  };

  if (allowChild) {
    return (
      <div className="h-full flex flex-col bg-umi-bg">
        <ScreenHeader
          title={`مصروف ${allowChild.name}`}
          onBack={() => {
            setAllowChild(null);
            setStep("amount");
          }}
        />
        {step === "amount" ? (
          <div className="flex-1 flex flex-col justify-end pb-24">
            <AmountPad value={amount} onChange={setAmount} accent="#b8a4e8" />
            <div className="px-4 mt-3">
              <button
                type="button"
                disabled={!Number(amount)}
                onClick={() => setStep("pin")}
                className="w-full h-11 rounded-xl font-cairo font-extrabold text-sm text-[#0a0416] disabled:opacity-40 active:scale-[0.98] transition-all"
                style={{ background: "linear-gradient(135deg,#f5dfa0,#e8c766 55%,#c99b3f)" }}
              >
                متابعة
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 pt-2 pb-20">
            <div className="text-center mb-2">
              <p className="text-[11px] font-tajawal text-umi-muted">
                إرسال مصروف — <span dir="ltr" className="font-bold text-umi-cream">{fmt(Number(amount) || 0)} OMI</span>
              </p>
              <p className="text-[9px] font-tajawal text-umi-muted" dir="ltr">≈ {fmtSyp(omiToSyp(Number(amount) || 0, rates.usdSyp))} ل.س</p>
            </div>
            <PinPad onComplete={sendAllowance} error={pinErr} />
          </div>
        )}
      </div>
    );
  }

  if (limitChild) {
    return (
      <div className="h-full flex flex-col bg-umi-bg">
        <ScreenHeader title={`الحد الأسبوعي — ${limitChild.name}`} onBack={() => setLimitChild(null)} />
        <div className="flex-1 flex flex-col justify-center px-6 pb-20">
          <p className="text-[11px] font-tajawal text-umi-muted text-center mb-3">اختر الحد الجديد (OMI / أسبوع)</p>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { v: 25000, label: "25 ألف" },
              { v: 50000, label: "50 ألف" },
              { v: 100000, label: "100 ألف" },
              { v: 150000, label: "150 ألف" },
              { v: 200000, label: "200 ألف" },
              { v: 500000, label: "500 ألف" },
            ].map(({ v, label }) => (
              <button
                key={v}
                type="button"
                onClick={() => setLimitVal(String(v))}
                className={`h-10 rounded-xl text-[11px] font-cairo font-bold umi-card transition-colors ${
                  limitVal === String(v) ? "text-umi-gold border-umi-gold/50" : "text-umi-cream"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled={!Number(limitVal)}
            onClick={saveLimit}
            className="w-full h-11 rounded-xl font-cairo font-extrabold text-sm text-[#0a0416] disabled:opacity-40"
            style={{ background: "linear-gradient(135deg,#f5dfa0,#e8c766 55%,#c99b3f)" }}
          >
            حفظ الحد
          </button>
        </div>
      </div>
    );
  }

  // ابن: بطاقته
  if (data?.role === "child") {
    const pct = Math.min(100, Math.round(((data.myWeekSpent ?? 0) / (data.myLimit || 1)) * 100));
    return (
      <div className="h-full flex flex-col bg-umi-bg">
        <ScreenHeader title="حسابي الفرعي" subtitle={`تحت إشراف ${data.parent?.name}`} onBack={onExit} />
        <div className="px-4 pb-24 space-y-3">
          <div className="rounded-3xl p-5 umi-card">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 grid place-items-center text-2xl">{me.avatar}</span>
              <div>
                <p className="font-cairo font-bold text-umi-cream text-sm">{me.name}</p>
                <p className="text-[10px] font-tajawal text-umi-muted" dir="ltr">{me.phone}</p>
              </div>
            </div>
            <p className="text-[10px] font-tajawal text-umi-muted">رصيدي</p>
            <p className="font-cairo font-black text-3xl gold-text" dir="ltr">{fmt(data.myBalance ?? 0)}<span className="text-sm"> OMI</span></p>
            <p className="text-[10px] font-tajawal text-umi-muted" dir="ltr">≈ {fmtSyp(omiToSyp(data.myBalance ?? 0, rates.usdSyp))} ل.س</p>
          </div>
          <div className="rounded-2xl p-4 umi-card">
            <div className="flex justify-between text-[11px] font-tajawal mb-2">
              <span className="text-umi-muted">إنفاق هذا الأسبوع</span>
              <span className="text-umi-cream font-bold" dir="ltr">{fmt(data.myWeekSpent ?? 0)} / {fmt(data.myLimit ?? 0)} OMI</span>
            </div>
            <div className="h-2 rounded-full bg-white/8 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "linear-gradient(90deg,#c99b3f,#e8c766,#f5dfa0)" }} />
            </div>
            {data.myFrozen && (
              <p className="flex items-center gap-1.5 text-[10px] font-tajawal text-umi-red mt-3">
                <Snowflake className="w-3.5 h-3.5" /> الحساب مجمّد مؤقتاً من ولي الأمر
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ولي أمر أو فارغ
  const children = data?.children ?? [];
  return (
    <div className="h-full flex flex-col bg-umi-bg">
      <ScreenHeader title="الحسابات الفرعية" subtitle="مصروف وحدود إنفاق الأبناء" onBack={onExit} />
      <div className="flex-1 overflow-y-auto umi-scroll px-4 pb-24 space-y-3">
        {children.map((c) => {
          const pct = Math.min(100, Math.round((c.weekSpent / (c.weeklyLimit || 1)) * 100));
          return (
            <div key={c.memberId} className="rounded-2xl p-4 umi-card">
              <div className="flex items-center gap-3">
                <span className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 grid place-items-center text-xl">{c.avatar}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-cairo font-bold text-umi-cream truncate">{c.name}</p>
                  <p className="text-[10px] font-tajawal text-umi-muted" dir="ltr">{c.phone}</p>
                </div>
                <p className="font-cairo font-bold text-umi-gold text-sm" dir="ltr">{fmt(c.balance)}<span className="text-[9px] text-umi-muted"> OMI</span></p>
              </div>
              <div className="flex justify-between text-[10px] font-tajawal mt-3 mb-1.5">
                <span className="text-umi-muted">إنفاق الأسبوع</span>
                <span className="text-umi-cream font-bold" dir="ltr">{fmt(c.weekSpent)} / {fmt(c.weeklyLimit)}</span>
              </div>
              <div className="h-2 rounded-full bg-white/8 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: c.frozen ? "#c87b7b" : "linear-gradient(90deg,#c99b3f,#e8c766,#f5dfa0)" }} />
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => {
                    setAllowChild(c);
                    setAmount("");
                  }}
                  className="flex-1 h-9 rounded-xl text-[11px] font-tajawal font-bold text-[#0a0416] flex items-center justify-center gap-1"
                  style={{ background: "linear-gradient(135deg,#f5dfa0,#e8c766)" }}
                >
                  <Plus className="w-3.5 h-3.5" /> مصروف
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLimitChild(c);
                    setLimitVal(String(c.weeklyLimit));
                  }}
                  className="flex-1 h-9 rounded-xl text-[11px] font-tajawal font-bold text-umi-cream umi-card"
                >
                  الحد الأسبوعي
                </button>
                <button
                  type="button"
                  onClick={() => toggleFreeze(c)}
                  aria-label={c.frozen ? "إلغاء التجميد" : "تجميد الحساب"}
                  className={`w-9 h-9 rounded-xl umi-card grid place-items-center ${c.frozen ? "text-umi-red" : "text-umi-muted"}`}
                >
                  <Snowflake className="w-4 h-4" />
                </button>
              </div>
              {c.frozen && <p className="text-[9px] font-tajawal text-umi-red mt-2">مجمّد — لا يمكن الإنفاق حتى إلغاء التجميد</p>}
            </div>
          );
        })}
        {children.length === 0 && (
          <div className="text-center py-12 flex flex-col items-center gap-3">
            <span className="w-14 h-14 rounded-full umi-card grid place-items-center text-umi-muted"><UserRound className="w-6 h-6" /></span>
            <p className="text-[12px] font-tajawal text-umi-cream font-bold">لا توجد حسابات فرعية مرتبطة</p>
            <p className="text-[10px] font-tajawal text-umi-muted leading-relaxed px-8">
              سجّل الدخول كـ «أحمد — ولي أمر» لاستعراض إدارة الأبناء: مصروف أسبوعي، حدود إنفاق، وتجميد فوري.
            </p>
          </div>
        )}
      </div>
      <div className="absolute bottom-24 right-4 text-[9px] font-tajawal text-umi-muted/50 flex items-center gap-1">
        <ArrowRight className="w-3 h-3" /> جرّب دورة كاملة: ولي أمر ← مصروف ← حساب الابن
      </div>
    </div>
  );
}
