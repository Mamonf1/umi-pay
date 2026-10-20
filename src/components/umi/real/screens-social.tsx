"use client";

// UMI PAY — الأصدقاء والمحادثات (إعادة بناء كاملة — المهمة 25)
// • تبويب الأصدقاء: إضافة برقم الجوال + طلبات واردة (قبول/رفض) + قائمة الأصدقاء (ضغط → محادثة)
// • دعم أومي باي: محادثة مباشرة مع إدارة المحفظة مثبتة أعلى المحادثات
// • المحادثة: نص + إيموجي + صورة مضغوطة + كشف حساب PDF + طلب تقرير + تحويل مالي مضمّن
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Send as SendIcon, Wallet, UserPlus, UserCheck, UserX, Smile,
  ImageIcon, FileText, FileDown, Share2, BadgeCheck, Trash2, ChevronLeft,
} from "lucide-react";
import { StatusBar } from "@/components/umi/shell";
import { ScreenHeader, PinPad } from "@/components/umi/real/pads";
import { api } from "@/lib/umi-client";
import { sharePdfFile } from "@/components/umi/real/screens-tx";
import { useRates } from "@/lib/rates";
import { fmtSyp, usdLine, SYP_UNIT } from "@/lib/currency";
import { relTime, type Me, type MsgT, type ThreadT, type FriendT } from "@/lib/umi-types";

/* مضغوط الصورة إلى ≤800px JPEG قبل الإرسال */
async function fileToDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 800 / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  c.getContext("2d")!.drawImage(bitmap, 0, 0, w, h);
  return c.toDataURL("image/jpeg", 0.72);
}

const EMOJIS = ["😀","😂","🥰","😊","😍","🤝","👍","🙏","👏","🔥","💰","💵","🛒","✅","❌","❤️","🎉","🎁","⭐","😎","🤔","😢","😡","👋","💪","📍","⏰","📷","📞","💬","🇸🇾","🕌"];

export function ChatScreen({ me, onExit, onChanged }: { me: Me; onExit: () => void; onChanged: () => void }) {
  const [tab, setTab] = useState<"chats" | "friends">("chats");
  const [threads, setThreads] = useState<ThreadT[] | null>(null);
  const [friends, setFriends] = useState<FriendT[] | null>(null);
  const [requests, setRequests] = useState<FriendT[]>([]);
  const [sent, setSent] = useState<FriendT[]>([]);
  const [support, setSupport] = useState<{ id: string; name: string; avatar: string } | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [reqCount, setReqCount] = useState(0);

  const loadFriends = useCallback(() => {
    api<{ friends: FriendT[]; requests: FriendT[]; sent: FriendT[]; support: { id: string; name: string; avatar: string } | null }>(`/api/umi/friends?userId=${me.id}`)
      .then((d) => { setFriends(d.friends); setRequests(d.requests); setSent(d.sent); setSupport(d.support); setReqCount(d.requests.length); })
      .catch(() => setFriends([]));
  }, [me.id]);

  useEffect(() => {
    api<{ threads: ThreadT[] }>(`/api/umi/chat?userId=${me.id}`)
      .then((d) => setThreads(d.threads))
      .catch(() => setThreads([]));
    loadFriends();
  }, [me.id, loadFriends]);

  const refreshAll = () => { loadFriends(); onChanged(); };
  const openWith = async (peerId: string) => {
    try {
      const r = await api<{ threadId: string }>("/api/umi/chat", { method: "POST", body: JSON.stringify({ userId: me.id, peerId, action: "ensure" }) });
      setOpenId(r.threadId);
    } catch { /* تجاهل */ }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-umi-bg">
      <ScreenHeader
        title="الأصدقاء والمحادثات"
        subtitle="أضف أصدقاءك — دردشة وصور وكشوف حسابات وتحويلات"
        onBack={openId ? undefined : onExit}
      />

      {/* التبويبان */}
      <div className="flex gap-1.5 px-4 pb-3">
        <button type="button" onClick={() => setTab("chats")}
          className={`flex-1 h-9 rounded-full text-[11.5px] font-tajawal font-bold ${tab === "chats" ? "text-[#0a0416]" : "text-umi-muted umi-card"}`}
          style={tab === "chats" ? { background: "linear-gradient(135deg,#f5dfa0,#e8c766)" } : undefined}>
          المحادثات
        </button>
        <button type="button" onClick={() => setTab("friends")}
          className={`flex-1 h-9 rounded-full text-[11.5px] font-tajawal font-bold ${tab === "friends" ? "text-[#0a0416]" : "text-umi-muted umi-card"} relative`}
          style={tab === "friends" ? { background: "linear-gradient(135deg,#f5dfa0,#e8c766)" } : undefined}>
          الأصدقاء
          {reqCount > 0 && (
            <span className="absolute -top-1 -left-1 min-w-[16px] h-4 px-1 rounded-full bg-umi-red text-[8.5px] font-cairo text-white grid place-items-center">{reqCount}</span>
          )}
        </button>
      </div>

      {tab === "chats" && (
        <div className="flex-1 overflow-y-auto umi-scroll pb-6">
          {/* دعم أومي — محادثة الإدارة مثبتة (تُخفى عن حساب الإدارة نفسه) */}
          {support && support.id !== me.id && (
            <button type="button" onClick={() => openWith(support.id)}
              className="w-full flex items-center gap-3 px-4 py-3 active:bg-white/5 text-right border-b border-white/5">
              <span className="w-11 h-11 rounded-2xl grid place-items-center text-xl shrink-0" style={{ background: "linear-gradient(135deg,#f5dfa0,#e8c766)" }}>{support.avatar}</span>
              <span className="flex-1 min-w-0">
                <span className="block text-[13px] font-tajawal font-bold text-umi-cream truncate">{support.name} <BadgeCheck className="w-3.5 h-3.5 text-umi-gold inline -mt-0.5" /></span>
                <span className="block text-[10px] font-tajawal text-umi-gold">الدعم الرسمي — تواصل مباشر مع إدارة المحفظة</span>
              </span>
            </button>
          )}
          {threads === null && <p className="text-center text-umi-muted text-[11px] font-tajawal pt-10 animate-pulse">جارٍ التحميل…</p>}
          {threads?.length === 0 && (
            <p className="text-center text-[11px] font-tajawal text-umi-muted py-10 leading-relaxed px-8">
              لا توجد محادثات بعد — أضف أصدقاءك من تبويب «الأصدقاء» وابدأ الدردشة معهم
            </p>
          )}
          {threads?.map((t) => (
            <button key={t.id} type="button" onClick={() => setOpenId(t.id)}
              className="w-full flex items-center gap-3 px-4 py-3 active:bg-white/5 text-right">
              <span className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 grid place-items-center text-xl shrink-0">{t.peer.avatar}</span>
              <span className="flex-1 min-w-0">
                <span className="block text-[13px] font-tajawal font-bold text-umi-cream truncate">{t.peer.name}</span>
                <span className="block text-[10px] font-tajawal text-umi-muted truncate">
                  {t.last
                    ? t.last.kind === "transfer"
                      ? `${t.last.mine ? "أرسلت" : "استلمت"} ${fmtSyp(t.last.amount ?? 0)} ${SYP_UNIT}`
                      : t.last.kind === "image"
                        ? `${t.last.mine ? "أرسلت" : "استلمت"} صورة 📷`
                        : t.last.kind === "statement"
                          ? "كشف حساب 🧾"
                          : t.last.kind === "report_request"
                            ? "طلب مشاركة تقرير"
                            : t.last.text
                    : "ابدأ المحادثة"}
                </span>
              </span>
              {t.last && <span className="text-[9px] font-tajawal text-umi-muted shrink-0">{relTime(t.last.createdAt)}</span>}
            </button>
          ))}
        </div>
      )}

      {tab === "friends" && (
        <FriendsTab
          me={me}
          friends={friends}
          requests={requests}
          sent={sent}
          addOpen={addOpen}
          setAddOpen={setAddOpen}
          onOpenChat={openWith}
          reload={refreshAll}
        />
      )}

      {openId && (
        <ChatThreadView
          me={me}
          threadId={openId}
          onClose={() => { setOpenId(null); refreshAll(); }}
          onChanged={refreshAll}
        />
      )}
    </div>
  );
}

/* ============ تبويب الأصدقاء ============ */
function FriendsTab({
  me, friends, requests, sent, addOpen, setAddOpen, onOpenChat, reload,
}: {
  me: Me;
  friends: FriendT[] | null;
  requests: FriendT[];
  sent: FriendT[];
  addOpen: boolean;
  setAddOpen: (v: boolean) => void;
  onOpenChat: (peerId: string) => void;
  reload: () => void;
}) {
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const add = async () => {
    if (!phone.trim()) return;
    setBusy(true); setErr(""); setMsg("");
    try {
      const r = await api<{ message: string }>("/api/umi/friends", { method: "POST", body: JSON.stringify({ userId: me.id, phone: phone.trim() }) });
      setMsg(r.message);
      setPhone("");
      setAddOpen(false);
      reload();
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };

  const act = async (action: "accept" | "reject" | "remove", friendId: string) => {
    setErr(""); setMsg("");
    try {
      const r = await api<{ message: string }>("/api/umi/friends", { method: "PATCH", body: JSON.stringify({ userId: me.id, action, friendId }) });
      setMsg(r.message);
      reload();
    } catch (e) { setErr((e as Error).message); }
  };

  return (
    <div className="flex-1 overflow-y-auto umi-scroll pb-6">
      {/* زر إضافة صديق */}
      <div className="px-4 mb-3">
        {!addOpen ? (
          <button type="button" onClick={() => { setAddOpen(true); setErr(""); setMsg(""); }}
            className="w-full h-11 rounded-xl font-cairo font-bold text-[13px] text-[#0a0416] flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg,#f5dfa0,#e8c766)" }}>
            <UserPlus className="w-4 h-4" /> إضافة صديق جديد — برقم الجوال
          </button>
        ) : (
          <div className="rounded-2xl p-4 umi-card">
            <p className="text-[11.5px] font-cairo font-bold text-umi-cream mb-2">رقم جوال صديقك</p>
            <div className="flex gap-2">
              <input value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, "").slice(0, 15))}
                inputMode="numeric" dir="ltr" placeholder="9639XXXXXXXX"
                className="flex-1 h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-left font-cairo text-[12px] text-umi-cream placeholder:text-umi-muted/50 outline-none focus:border-umi-gold/40" />
              <button type="button" disabled={busy || !phone.trim()} onClick={add}
                className="h-10 px-4 rounded-xl font-cairo font-bold text-[12px] text-[#0a0416] disabled:opacity-40"
                style={{ background: "linear-gradient(135deg,#f5dfa0,#e8c766)" }}>
                إرسال
              </button>
              <button type="button" onClick={() => setAddOpen(false)} aria-label="إلغاء"
                className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 grid place-items-center text-umi-muted">
                <UserX className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[9px] font-tajawal text-umi-muted mt-2">اكتب الرقم مع أو بدون مفتاح الدولة — سيصل الطرف طلب صداقة يقبله ليصبحا صديقين</p>
          </div>
        )}
      </div>

      {msg && <p className="text-[10.5px] font-tajawal text-umi-teal text-center px-4 mb-2">{msg}</p>}
      {err && <p className="text-[10.5px] font-tajawal text-umi-red text-center px-4 mb-2">{err}</p>}

      {/* طلبات واردة */}
      {requests.length > 0 && (
        <div className="px-4 mb-3">
          <p className="text-[11px] font-tajawal font-bold text-umi-gold mb-2">طلبات صداقة واردة ({requests.length})</p>
          {requests.map((r) => (
            <div key={r.id} className="rounded-2xl p-3 umi-card mb-2 flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 grid place-items-center text-lg shrink-0">{r.avatar}</span>
              <span className="flex-1 min-w-0">
                <span className="block text-[12px] font-tajawal font-bold text-umi-cream truncate">{r.name}</span>
                <span className="block text-[9.5px] font-tajawal text-umi-muted" dir="ltr">{r.phone}</span>
              </span>
              <button type="button" onClick={() => act("accept", r.id)} aria-label="قبول"
                className="w-9 h-9 rounded-xl grid place-items-center text-[#0a0416]" style={{ background: "linear-gradient(135deg,#f5dfa0,#e8c766)" }}>
                <UserCheck className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => act("reject", r.id)} aria-label="رفض"
                className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 grid place-items-center text-umi-red">
                <UserX className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* طلبات أرسلتها بانتظار القبول */}
      {sent.length > 0 && (
        <div className="px-4 mb-3">
          <p className="text-[11px] font-tajawal font-bold text-umi-muted mb-2">طلبات أرسلتها — بانتظار القبول ({sent.length})</p>
          {sent.map((s) => (
            <div key={s.id} className="rounded-2xl p-3 umi-card mb-2 flex items-center gap-3 opacity-70">
              <span className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 grid place-items-center text-lg shrink-0">{s.avatar}</span>
              <span className="flex-1 min-w-0">
                <span className="block text-[12px] font-tajawal font-bold text-umi-cream truncate">{s.name}</span>
                <span className="block text-[9.5px] font-tajawal text-umi-muted" dir="ltr">{s.phone}</span>
              </span>
              <span className="text-[9px] font-tajawal text-umi-muted">معلّق ⏳</span>
              <button type="button" onClick={() => act("reject", s.id)} aria-label="إلغاء الطلب"
                className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 grid place-items-center text-umi-red">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* قائمة الأصدقاء */}
      <div className="px-4">
        <p className="text-[11px] font-tajawal font-bold text-umi-cream mb-2">أصدقائي ({friends?.length ?? 0})</p>
        {friends === null && <p className="text-center text-umi-muted text-[11px] font-tajawal py-6 animate-pulse">جارٍ التحميل…</p>}
        {friends?.length === 0 && (
          <p className="text-center text-[10.5px] font-tajawal text-umi-muted py-6 leading-relaxed">
            لا أصدقاء بعد — أضف صديقاً برقم جواله، أو أضفه من صف أي عملية في سجلك وتقاريرك
          </p>
        )}
        {friends?.map((f) => (
          <button key={f.id} type="button" onClick={() => onOpenChat(f.id)}
            className="w-full flex items-center gap-3 py-2.5 active:bg-white/5 text-right rounded-xl px-1">
            <span className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 grid place-items-center text-xl shrink-0">{f.avatar}</span>
            <span className="flex-1 min-w-0">
              <span className="block text-[13px] font-tajawal font-bold text-umi-cream truncate">{f.name}</span>
              <span className="block text-[9.5px] font-tajawal text-umi-muted" dir="ltr">{f.phone}</span>
            </span>
            <span className="text-[9.5px] font-tajawal text-umi-gold flex items-center gap-0.5">دردشة <ChevronLeft className="w-3.5 h-3.5" /></span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ============ محادثة ============ */
function ChatThreadView({ me, threadId, onClose, onChanged }: { me: Me; threadId: string; onClose: () => void; onChanged: () => void }) {
  const { rates } = useRates();
  const [msgs, setMsgs] = useState<MsgT[] | null>(null);
  const [peer, setPeer] = useState<{ id: string; name: string; avatar: string; role: string } | null>(null);
  const [text, setText] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [amountOpen, setAmountOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [pinErr, setPinErr] = useState("");
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    api<{ messages: MsgT[]; peer: { id: string; name: string; avatar: string; role: string } }>(`/api/umi/chat/${threadId}?userId=${me.id}`)
      .then((d) => { setMsgs(d.messages); setPeer(d.peer); })
      .catch(() => setMsgs([]));
  }, [threadId, me.id]);
  useEffect(load, [load]);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const send = async (payload: Record<string, unknown>) => {
    setSending(true); setErr("");
    try {
      // نقطة الإرسال هي /api/umi/chat مع threadId في الجسم — وليس /chat/[id] (GET فقط)
      await api("/api/umi/chat", {
        method: "POST",
        body: JSON.stringify({ threadId, userId: me.id, ...payload }),
      });
      load();
      onChanged();
    } catch (e) {
      setErr((e as Error).message);
    } finally { setSending(false); }
  };

  const sendText = async () => {
    if (!text.trim()) return;
    const t = text;
    setText("");
    setEmojiOpen(false);
    await send({ text: t });
  };

  const sendImage = async (file: File) => {
    setErr(""); setMsg("");
    try {
      const dataUrl = await fileToDataUrl(file);
      await send({ image: dataUrl, text: text.trim() || undefined });
      setText("");
    } catch (e) { setErr((e as Error).message); }
  };

  const sendMoney = async (code: string) => {
    setPinErr("");
    try {
      await api("/api/umi/chat", {
        method: "POST",
        body: JSON.stringify({ threadId, userId: me.id, amount: Number(amount), pin: code }),
      });
      setAmountOpen(false);
      setAmount("");
      load();
      onChanged();
    } catch (e) { setPinErr((e as Error).message); }
  };

  return (
    <div className="absolute inset-0 z-40 bg-umi-bg flex flex-col">
      <ScreenHeader title={peer ? `${peer.avatar} ${peer.name}` : "المحادثة"} subtitle="رسائل مشفرة داخل أومي باي" onBack={onClose} />
      <div className="flex-1 overflow-y-auto umi-scroll px-4 pb-4">
        {msgs?.map((m) => (
          <MessageBubble key={m.id} m={m} meId={me.id} peerId={peer?.id ?? ""} onSend={send} onReload={load} onChanged={onChanged} />
        ))}
        {msgs?.length === 0 && <p className="text-center text-[10px] font-tajawal text-umi-muted py-8">لا رسائل بعد — اكتب أول رسالة أو أرسل كشف حساب</p>}
        <div ref={bottomRef} />
      </div>

      {err && <p className="text-[10px] font-tajawal text-umi-red text-center pb-1 px-4">{err}</p>}
      {msg && <p className="text-[10px] font-tajawal text-umi-teal text-center pb-1 px-4">{msg}</p>}

      {/* منتقي الإيموجي */}
      {emojiOpen && (
        <div className="border-t border-white/10 px-3 py-2.5">
          <div className="grid grid-cols-8 gap-1">
            {EMOJIS.map((e) => (
              <button key={e} type="button" onClick={() => setText((t) => t + e)}
                className="h-9 rounded-lg text-xl active:bg-white/10">{e}</button>
            ))}
          </div>
        </div>
      )}

      {/* شريط الإدخال */}
      <div className="border-t border-white/10 p-2.5 flex items-center gap-1.5">
        <input ref={fileRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) sendImage(f); e.target.value = ""; }} />
        <button type="button" onClick={() => { setEmojiOpen((v) => !v); }} aria-label="إيموجي"
          className={`w-9 h-10 rounded-xl grid place-items-center shrink-0 ${emojiOpen ? "text-umi-gold bg-umi-gold/10" : "text-umi-muted bg-white/5 border border-white/10"}`}>
          <Smile className="w-4.5 h-4.5" />
        </button>
        <button type="button" onClick={() => fileRef.current?.click()} aria-label="إرسال صورة" disabled={sending}
          className="w-9 h-10 rounded-xl grid place-items-center text-umi-muted bg-white/5 border border-white/10 shrink-0 disabled:opacity-40">
          <ImageIcon className="w-4.5 h-4.5" />
        </button>
        <button type="button" onClick={() => send({ statement: true })} aria-label="إرسال كشف حساب" disabled={sending}
          title="كشف حساب مشترك بينكما"
          className="w-9 h-10 rounded-xl grid place-items-center text-umi-muted bg-white/5 border border-white/10 shrink-0 disabled:opacity-40">
          <FileText className="w-4.5 h-4.5" />
        </button>
        <button type="button" onClick={() => { setAmountOpen(true); setPinErr(""); }} aria-label="تحويل مالي"
          className="w-9 h-10 rounded-xl grid place-items-center text-[#0a0416] shrink-0"
          style={{ background: "linear-gradient(135deg,#f5dfa0,#e8c766)" }}>
          <Wallet className="w-4 h-4" />
        </button>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") sendText(); }}
          placeholder="اكتب رسالة أو إيموجي…"
          className="flex-1 min-w-0 h-10 rounded-xl umi-card bg-transparent px-3 font-cairo text-[12px] text-umi-cream placeholder:text-umi-muted/50 outline-none focus:border-umi-gold/40"
        />
        <button type="button" disabled={sending || !text.trim()} onClick={sendText} aria-label="إرسال"
          className="w-10 h-10 rounded-xl grid place-items-center text-umi-gold bg-white/5 border border-white/10 disabled:opacity-40 shrink-0">
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

/* ============ فقاعة رسالة تدعم كل الأنواع ============ */
function MessageBubble({
  m, meId, peerId, onSend, onReload, onChanged,
}: {
  m: MsgT;
  meId: string;
  peerId: string;
  onSend: (payload: Record<string, unknown>) => Promise<void>;
  onReload: () => void;
  onChanged: () => void;
}) {
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const { rates } = useRates();

  // كشف حساب: حمولة JSON
  let st: { count: number; totalIn: number; totalOut: number } | null = null;
  if (m.kind === "statement" && m.data) {
    try { st = JSON.parse(m.data); } catch { st = null; }
  }

  const shareStatement = async () => {
    setBusy(true); setErr("");
    try {
      const r = await sharePdfFile(`/api/umi/report-pdf?userId=${meId}&peerId=${peerId}`, `umi-statement-${Date.now()}.pdf`);
      if (r === "downloaded") { setErr(""); onChanged(); }
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };

  return (
    <div className={`flex mb-2 ${m.mine ? "justify-start" : "justify-end"}`}>
      <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 ${m.mine ? "umi-hero" : "umi-card"}`}>
        {m.kind === "transfer" && (
          <div className="text-right">
            <p className="flex items-center gap-1 text-[9px] font-tajawal text-umi-gold mb-0.5">
              <Wallet className="w-3 h-3" /> تحويل مالي {m.mine ? "صادر" : "وارد"}
            </p>
            <p className="font-cairo font-bold text-[15px] gold-text" dir="ltr">
              {fmtSyp(m.amount ?? 0)} {SYP_UNIT}
            </p>
          </div>
        )}

        {m.kind === "text" && (
          <p className="text-[12px] font-tajawal text-umi-cream leading-relaxed break-words whitespace-pre-wrap">{m.text}</p>
        )}

        {m.kind === "image" && (
          <div>
            {m.data && (
              <img src={m.data} alt="صورة مشتركة" className="rounded-xl max-w-[210px] max-h-[260px] object-cover mb-1" />
            )}
            {m.text && <p className="text-[11.5px] font-tajawal text-umi-cream leading-relaxed">{m.text}</p>}
          </div>
        )}

        {m.kind === "statement" && (
          <div className="text-right min-w-[190px]">
            <p className="flex items-center gap-1 text-[9px] font-tajawal text-umi-gold mb-1">
              <FileText className="w-3 h-3" /> كشف حساب مشترك {m.mine ? "(أرسلته)" : ""}
            </p>
            {st && (
              <div className="grid grid-cols-3 gap-1 mb-1.5">
                <span className="rounded-lg bg-black/20 px-1.5 py-1 text-center"><b className="block text-[10px] font-cairo text-umi-cream">{st.count}</b><span className="text-[7.5px] font-tajawal text-umi-muted">عملية</span></span>
                <span className="rounded-lg bg-black/20 px-1.5 py-1 text-center"><b className="block text-[9px] font-cairo text-umi-teal" dir="ltr">+{fmtSyp(st.totalIn)}</b><span className="text-[7.5px] font-tajawal text-umi-muted">وارد</span></span>
                <span className="rounded-lg bg-black/20 px-1.5 py-1 text-center"><b className="block text-[9px] font-cairo text-umi-cream" dir="ltr">−{fmtSyp(st.totalOut)}</b><span className="text-[7.5px] font-tajawal text-umi-muted">صادر</span></span>
              </div>
            )}
            <div className="flex gap-1.5">
              <a href={`/api/umi/report-pdf?userId=${meId}&peerId=${peerId}`} target="_blank" rel="noreferrer"
                className="flex-1 h-8 rounded-lg bg-white/10 text-[9.5px] font-tajawal text-umi-cream flex items-center justify-center gap-1" style={{ textDecoration: "none" }}>
                <FileDown className="w-3 h-3 text-umi-gold" /> فتح PDF
              </a>
              <button type="button" disabled={busy} onClick={shareStatement}
                className="flex-1 h-8 rounded-lg text-[9.5px] font-tajawal font-bold text-[#0a0416] flex items-center justify-center gap-1 disabled:opacity-40"
                style={{ background: "linear-gradient(135deg,#f5dfa0,#e8c766)" }}>
                <Share2 className="w-3 h-3" /> مشاركة
              </button>
            </div>
          </div>
        )}

        {m.kind === "report_request" && (
          <div className="text-right min-w-[180px]">
            <p className="flex items-center gap-1 text-[9px] font-tajawal text-umi-purplight mb-1">
              <FileText className="w-3 h-3" /> طلب مشاركة كشف الحساب
            </p>
            <p className="text-[11.5px] font-tajawal text-umi-cream leading-relaxed">
              {m.mine ? "أرسلت طلباً لمشاركة كشف الحساب المشترك — ستُعلم عند الرد" : "يريد مشاركة كشف الحساب المشترك بينكما"}
            </p>
            {!m.mine && (
              <button type="button" disabled={busy}
                onClick={async () => { setBusy(true); setErr(""); try { await onSend({ statement: true }); onReload(); onChanged(); } finally { setBusy(false); } }}
                className="mt-1.5 w-full h-8 rounded-lg text-[9.5px] font-tajawal font-bold text-[#0a0416] flex items-center justify-center gap-1 disabled:opacity-40"
                style={{ background: "linear-gradient(135deg,#f5dfa0,#e8c766)" }}>
                <Share2 className="w-3 h-3" /> مشاركة الكشف الآن
              </button>
            )}
          </div>
        )}

        <p className="text-[8.5px] font-tajawal text-umi-muted mt-0.5">{relTime(m.createdAt)}</p>
        {err && <p className="text-[8.5px] font-tajawal text-umi-red">{err}</p>}
      </div>
    </div>
  );
}
