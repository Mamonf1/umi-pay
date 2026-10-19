"use client";

// UMI PAY — المحادثات + تحويل مالي مضمّن (بالليرة السورية + رمز دفع 4 أرقام)
import { useCallback, useEffect, useRef, useState } from "react";
import { Send as SendIcon, Wallet } from "lucide-react";
import { StatusBar } from "@/components/umi/phone-frame";
import { ScreenHeader, PinPad, SypAmount } from "@/components/umi/real/pads";
import { api } from "@/lib/umi-client";
import { useRates } from "@/lib/rates";
import { fmtSyp, usdLine, SYP_UNIT } from "@/lib/currency";
import { relTime, type Me, type MsgT, type ThreadT } from "@/lib/umi-types";

export function ChatScreen({ me, onExit, onChanged }: { me: Me; onExit: () => void; onChanged: () => void }) {
  const [threads, setThreads] = useState<ThreadT[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    api<{ threads: ThreadT[] }>(`/api/umi/chat?userId=${me.id}`)
      .then((d) => setThreads(d.threads))
      .catch(() => setThreads([]));
  }, [me.id]);

  return (
    <div className="h-full flex flex-col bg-umi-bg">
      <ScreenHeader title="المحادثات" subtitle="أرسل رسالة أو حوّل مالاً داخل المحادثة" onBack={openId ? undefined : onExit} />
      <div className="flex-1 overflow-y-auto umi-scroll pb-6">
        {threads === null && <p className="text-center text-umi-muted text-[11px] font-tajawal pt-10 animate-pulse">جارٍ التحميل…</p>}
        {threads?.length === 0 && (
          <p className="text-center text-[11px] font-tajawal text-umi-muted py-10 leading-relaxed px-8">
            لا توجد محادثات بعد — ستبدأ المحادثات تلقائياً عند توفر مستخدمين آخرين
          </p>
        )}
        {threads?.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setOpenId(t.id)}
            className="w-full flex items-center gap-3 px-4 py-3 active:bg-white/5 text-right"
          >
            <span className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 grid place-items-center text-xl shrink-0">{t.peer.avatar}</span>
            <span className="flex-1 min-w-0">
              <span className="block text-[13px] font-tajawal font-bold text-umi-cream truncate">{t.peer.name}</span>
              <span className="block text-[10px] font-tajawal text-umi-muted truncate">
                {t.last
                  ? t.last.kind === "transfer"
                    ? `${t.last.mine ? "أرسلت" : "استلمت"} ${fmtSyp(t.last.amount ?? 0)} ${SYP_UNIT}`
                    : t.last.text
                  : "ابدأ المحادثة"}
              </span>
            </span>
            {t.last && <span className="text-[9px] font-tajawal text-umi-muted shrink-0">{relTime(t.last.createdAt)}</span>}
          </button>
        ))}
      </div>

      {openId && (
        <ChatThreadView
          me={me}
          threadId={openId}
          onClose={() => setOpenId(null)}
          onChanged={() => { onChanged(); }}
        />
      )}
    </div>
  );
}

function ChatThreadView({ me, threadId, onClose, onChanged }: { me: Me; threadId: string; onClose: () => void; onChanged: () => void }) {
  const { rates } = useRates();
  const [msgs, setMsgs] = useState<MsgT[] | null>(null);
  const [text, setText] = useState("");
  const [amountOpen, setAmountOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [pinErr, setPinErr] = useState("");
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    api<{ msgs: MsgT[] }>(`/api/umi/chat/${threadId}?userId=${me.id}`)
      .then((d) => setMsgs(d.msgs))
      .catch(() => setMsgs([]));
  }, [threadId, me.id]);
  useEffect(load, [load]);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const sendText = async () => {
    if (!text.trim()) return;
    setSending(true);
    setErr("");
    try {
      await api(`/api/umi/chat/${threadId}`, {
        method: "POST",
        body: JSON.stringify({ threadId, userId: me.id, text }),
      });
      setText("");
      load();
      onChanged();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSending(false);
    }
  };

  const sendMoney = async (code: string) => {
    setPinErr("");
    try {
      await api(`/api/umi/chat/${threadId}`, {
        method: "POST",
        body: JSON.stringify({ threadId, userId: me.id, amount: Number(amount), pin: code }),
      });
      setAmountOpen(false);
      setAmount("");
      load();
      onChanged();
    } catch (e) {
      setPinErr((e as Error).message);
    }
  };

  return (
    <div className="absolute inset-0 z-40 bg-umi-bg flex flex-col">
      <ScreenHeader title="المحادثة" onBack={onClose} />
      <div className="flex-1 overflow-y-auto umi-scroll px-4 pb-4">
        {msgs?.map((m) => (
          <div key={m.id} className={`flex mb-2 ${m.mine ? "justify-start" : "justify-end"}`}>
            <div
              className={`max-w-[78%] rounded-2xl px-3.5 py-2 ${
                m.mine ? "umi-hero" : "umi-card"
              }`}
            >
              {m.kind === "transfer" ? (
                <div className="text-right">
                  <p className="flex items-center gap-1 text-[9px] font-tajawal text-umi-gold mb-0.5">
                    <Wallet className="w-3 h-3" /> تحويل مالي {m.mine ? "صادر" : "وارد"}
                  </p>
                  <p className="font-cairo font-bold text-[15px] gold-text" dir="ltr">
                    {fmtSyp(m.amount ?? 0)} {SYP_UNIT}
                  </p>
                </div>
              ) : (
                <p className="text-[12px] font-tajawal text-umi-cream leading-relaxed">{m.text}</p>
              )}
              <p className="text-[8.5px] font-tajawal text-umi-muted mt-0.5">{relTime(m.createdAt)}</p>
            </div>
          </div>
        ))}
        {msgs?.length === 0 && <p className="text-center text-[10px] font-tajawal text-umi-muted py-8">لا رسائل بعد — اكتب أول رسالة</p>}
        <div ref={bottomRef} />
      </div>

      {err && <p className="text-[10px] font-tajawal text-umi-red text-center pb-1">{err}</p>}

      {/* شريط الإدخال */}
      <div className="border-t border-white/10 p-2.5 flex items-center gap-2">
        <button
          type="button"
          onClick={() => { setAmountOpen(true); setPinErr(""); }}
          aria-label="تحويل مالي"
          className="w-10 h-10 rounded-xl grid place-items-center text-[#0a0416] shrink-0"
          style={{ background: "linear-gradient(135deg,#f5dfa0,#e8c766)" }}
        >
          <Wallet className="w-4.5 h-4.5" />
        </button>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") sendText(); }}
          placeholder="اكتب رسالة…"
          className="flex-1 h-10 rounded-xl umi-card bg-transparent px-3.5 font-cairo text-[12px] text-umi-cream placeholder:text-umi-muted/50 outline-none focus:border-umi-gold/40"
        />
        <button
          type="button"
          disabled={sending || !text.trim()}
          onClick={sendText}
          aria-label="إرسال"
          className="w-10 h-10 rounded-xl grid place-items-center text-umi-gold bg-white/5 border border-white/10 disabled:opacity-40 shrink-0"
        >
          <SendIcon className="w-4 h-4 -scale-x-100" />
        </button>
      </div>

      {/* تحويل مالي داخل الشات */}
      {amountOpen && (
        <div className="absolute inset-0 z-40 bg-[#0a0416]/95 backdrop-blur-sm flex flex-col">
          <ScreenHeader title="تحويل داخل المحادثة" onBack={() => setAmountOpen(false)} />
          <div className="px-4">
            <div className="rounded-2xl umi-card p-4 text-center mb-3">
              <p className="text-[11px] font-tajawal text-umi-muted mb-1">المبلغ المطلوب تحويله</p>
              <p className="font-cairo font-black text-[28px] gold-text" dir="ltr">
                {fmtSyp(Number(amount) || 0)} <span className="text-xs font-tajawal text-umi-muted">{SYP_UNIT}</span>
              </p>
              <p className="text-[10px] font-tajawal text-umi-teal" dir="ltr">{usdLine(Number(amount) || 0, rates.usdSyp)}</p>
            </div>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/\D/g, "").slice(0, 9))}
              inputMode="numeric"
              dir="ltr"
              placeholder="0"
              className="w-full h-11 rounded-xl umi-card bg-transparent px-4 text-center font-cairo text-lg text-umi-cream placeholder:text-umi-muted/50 outline-none focus:border-umi-gold/40 mb-3"
            />
            {amount.length > 0 && <PinPad onComplete={sendMoney} error={pinErr} title="رمز الدفع — 4 أرقام" />}
          </div>
        </div>
      )}
    </div>
  );
}
