"use client";

import { useState } from "react";
import {
  Check,
  ChevronRight,
  Mic,
  Paperclip,
  Pencil,
  Plus,
  QrCode,
  Search,
  Send,
  Shirt,
  ShoppingBag,
  Snowflake,
  Store,
  Utensils,
} from "lucide-react";
import { StatusBar, TabBar, ScreenKey } from "./phone-frame";

/* ================= شاشة المتاجر ================= */
export function StoresScreen({ onNavigate }: { onNavigate?: (k: ScreenKey) => void }) {
  const [cat, setCat] = useState("الكل");
  const cats = ["الكل", "مقاهي", "مطاعم", "بقالات", "أزياء"];
  const stores = [
    { name: "كافي ليّن", meta: "مقهى · 0.8 كم", cat: "مقاهي", icon: <Store className="w-5 h-5" />, off: "-20%" },
    { name: "رست هاوس", meta: "مطعم · 1.2 كم", cat: "مطاعم", icon: <Utensils className="w-5 h-5" />, off: null },
    { name: "سوبر الأصيل", meta: "بقالة · 0.4 كم", cat: "بقالات", icon: <ShoppingBag className="w-5 h-5" />, off: null },
    { name: "بوتيك سارة", meta: "أزياء · 2.1 كم", cat: "أزياء", icon: <Shirt className="w-5 h-5" />, off: "-15%" },
  ];

  return (
    <div className="h-full relative bg-umi-bg">
      <StatusBar />
      <div className="px-4 pt-1 pb-28 h-[calc(100%-24px)] overflow-y-auto no-scrollbar">
        <h2 className="text-sm font-cairo font-bold text-umi-cream mb-3">المتاجر القريبة</h2>

        {/* search */}
        <div className="flex items-center gap-2 rounded-xl bg-white/[0.05] border border-white/10 px-3 py-2.5 mb-3">
          <Search className="w-4 h-4 text-umi-muted" />
          <span className="text-[11px] text-umi-muted font-tajawal">ابحث عن متجر أو منتج…</span>
        </div>

        {/* categories */}
        <div className="flex gap-1.5 mb-3 overflow-x-auto no-scrollbar" role="tablist" aria-label="فئات المتاجر">
          {cats.map((c) => (
            <button
              key={c}
              type="button"
              role="tab"
              aria-selected={cat === c}
              onClick={() => setCat(c)}
              className={`px-3 py-1.5 rounded-full text-[10px] font-tajawal font-bold shrink-0 transition-all ${
                cat === c
                  ? "bg-umi-gold text-[#1c130a] shadow-[0_6px_18px_-6px_rgba(232,199,102,0.6)]"
                  : "bg-white/[0.05] text-umi-muted border border-white/10 hover:text-umi-cream"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* promo */}
        <div className="relative rounded-2xl p-3.5 mb-3 overflow-hidden bg-gradient-to-l from-umi-gold/25 via-umi-gold/10 to-transparent border border-umi-gold/30">
          <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-umi-gold/15 blur-xl" aria-hidden="true" />
          <p className="text-xs font-cairo font-extrabold text-umi-gold mb-0.5">خصم 20% كافي ليّن</p>
          <p className="text-[10px] text-umi-cream/75 font-tajawal leading-relaxed">ادفع بأومي باي داخل المتجر واحصل على الخصم فوراً</p>
        </div>

        {/* stores */}
        <div className="grid grid-cols-2 gap-2">
          {stores
            .filter((s) => cat === "الكل" || s.cat === cat)
            .map((s) => (
              <button
                key={s.name}
                type="button"
                className="text-right rounded-2xl p-3 bg-white/[0.04] border border-white/8 hover:border-umi-gold/40 hover:bg-white/[0.07] transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="w-9 h-9 rounded-xl bg-umi-purple/20 text-umi-purplight flex items-center justify-center">{s.icon}</span>
                  {s.off && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-umi-teal/15 text-umi-teal font-tajawal font-bold">{s.off}</span>}
                </div>
                <p className="text-[11px] font-cairo font-bold text-umi-cream mb-0.5">{s.name}</p>
                <p className="text-[9px] text-umi-muted font-tajawal mb-2">{s.meta}</p>
                <span className="inline-flex items-center gap-1 text-[9px] font-tajawal font-bold text-umi-gold">
                  <QrCode className="w-3 h-3" /> ادفع بـ QR
                </span>
              </button>
            ))}
        </div>
      </div>

      {/* QR FAB */}
      <button
        type="button"
        aria-label="مسح رمز الدفع"
        onClick={() => onNavigate?.("stores")}
        className="absolute bottom-24 left-4 z-30 w-12 h-12 rounded-2xl bg-gradient-to-br from-umi-goldsoft to-umi-golddeep text-[#1c130a] flex items-center justify-center shadow-[0_12px_28px_-8px_rgba(232,199,102,0.6)] hover:scale-105 active:scale-95 transition-transform"
      >
        <QrCode className="w-5.5 h-5.5" strokeWidth={2} />
      </button>
      <TabBar active="stores" onNavigate={onNavigate} />
    </div>
  );
}

/* ================= شاشة المحادثة مع التحويل ================= */
type Msg = { from: "me" | "them"; text: string };

export function ChatScreen({ onNavigate }: { onNavigate?: (k: ScreenKey) => void }) {
  const [msgs, setMsgs] = useState<Msg[]>([
    { from: "them", text: "سلام! تقدر ترسل لي حصة المشروع؟" },
    { from: "me", text: "أبشر، أرسلتها الآن" },
  ]);
  const [transferState, setTransferState] = useState<"pending" | "accepted" | "declined">("pending");
  const [draft, setDraft] = useState("");

  const send = () => {
    const t = draft.trim();
    if (!t) return;
    setMsgs((m) => [...m, { from: "me", text: t }]);
    setDraft("");
  };

  return (
    <div className="h-full relative bg-umi-bg">
      <StatusBar />
      <div className="h-[calc(100%-24px)] flex flex-col pb-20">
        {/* chat header */}
        <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-white/8 bg-white/[0.02]">
          <button
            type="button"
            onClick={() => onNavigate?.("home")}
            aria-label="رجوع"
            className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-umi-cream/80 hover:bg-white/10 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="w-9 h-9 rounded-full bg-umi-teal/35 flex items-center justify-center text-umi-cream font-cairo font-bold text-xs">ن</span>
          <span className="flex-1">
            <span className="block text-xs font-cairo font-bold text-umi-cream">نورة العتيبي</span>
            <span className="flex items-center gap-1 text-[9px] text-umi-teal font-tajawal">
              <span className="w-1.5 h-1.5 rounded-full bg-umi-teal animate-umi-pulse" aria-hidden="true" /> متصلة الآن
            </span>
          </span>
        </div>

        {/* messages */}
        <div className="flex-1 px-4 py-3 space-y-2.5 overflow-y-auto no-scrollbar" role="log" aria-label="سجل المحادثة">
          {msgs.map((m, i) => (
            <div key={i} className={`flex ${m.from === "me" ? "justify-start" : "justify-end"}`}>
              <p
                className={`max-w-[75%] px-3 py-2 rounded-2xl text-[11px] font-tajawal leading-relaxed ${
                  m.from === "me"
                    ? "bg-umi-purple/45 text-umi-cream rounded-br-sm"
                    : "bg-white/[0.07] border border-white/8 text-umi-cream/90 rounded-bl-sm"
                }`}
              >
                {m.text}
              </p>
            </div>
          ))}

          {/* transfer bubble */}
          <div className="flex justify-end">
            <div className="w-[80%] rounded-2xl rounded-bl-sm overflow-hidden border border-umi-gold/30 bg-[#1a0f2e]">
              <div className="flex items-center gap-2.5 p-3">
                <span className="w-9 h-9 rounded-full bg-umi-gold/15 text-umi-gold flex items-center justify-center font-cairo font-black text-sm shrink-0">
                  U
                </span>
                <span className="flex-1">
                  <span className="block text-[10px] text-umi-muted font-tajawal">تحويل عبر أومي باي</span>
                  <span className="block text-sm font-cairo font-black text-umi-gold" dir="ltr" style={{ textAlign: "right" }}>
                    500.00 <span className="text-[10px] font-tajawal">ر.س</span>
                  </span>
                </span>
              </div>
              {transferState === "pending" ? (
                <div className="grid grid-cols-2 gap-px bg-white/8">
                  <button
                    type="button"
                    onClick={() => setTransferState("accepted")}
                    className="py-2 bg-umi-gold/90 hover:bg-umi-gold text-[#1c130a] text-[11px] font-cairo font-extrabold transition-colors"
                  >
                    قبول
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransferState("declined")}
                    className="py-2 bg-[#120a20] hover:bg-[#1b1130] text-umi-muted text-[11px] font-cairo font-bold transition-colors"
                  >
                    رفض
                  </button>
                </div>
              ) : (
                <p className={`py-2 text-center text-[10px] font-tajawal font-bold ${transferState === "accepted" ? "text-umi-teal" : "text-umi-red"}`}>
                  {transferState === "accepted" ? "تم قبول التحويل" : "تم رفض التحويل"}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* input bar */}
        <div className="px-3 py-2.5 border-t border-white/8 bg-[#0d0719]/90">
          <div className="flex items-center gap-2">
            <button type="button" aria-label="إرفاق ملف" className="w-8 h-8 rounded-full bg-white/5 text-umi-muted flex items-center justify-center hover:text-umi-gold transition-colors shrink-0">
              <Paperclip className="w-4 h-4" />
            </button>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="اكتب رسالة…"
              aria-label="حقل الرسالة"
              className="flex-1 min-w-0 bg-white/[0.05] border border-white/10 rounded-full px-3.5 py-2 text-[11px] font-tajawal text-umi-cream placeholder:text-umi-muted/70 outline-none focus:border-umi-gold/50 transition-colors"
            />
            <button type="button" aria-label="رسالة صوتية" className="w-8 h-8 rounded-full bg-white/5 text-umi-muted flex items-center justify-center hover:text-umi-gold transition-colors shrink-0">
              <Mic className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={send}
              aria-label="إرسال الرسالة"
              className="w-8 h-8 rounded-full bg-umi-gold text-[#1c130a] flex items-center justify-center hover:brightness-110 active:scale-95 transition-all shrink-0"
            >
              <Send className="w-3.5 h-3.5 -scale-x-100" />
            </button>
          </div>
        </div>
      </div>
      <TabBar active="chat" onNavigate={onNavigate} />
    </div>
  );
}

/* ================= شاشة الحسابات الفرعية ================= */
export function FamilyScreen({ onNavigate }: { onNavigate?: (k: ScreenKey) => void }) {
  const [frozen, setFrozen] = useState<Record<string, boolean>>({});

  const subs = [
    { id: "sara", name: "سارة", age: 16, avatar: "bg-umi-gold/30", used: 500, limit: 800 },
    { id: "mohd", name: "محمد", age: 12, avatar: "bg-umi-purple/40", used: 200, limit: 400 },
  ];

  return (
    <div className="h-full relative bg-umi-bg">
      <StatusBar />
      <div className="px-4 pt-1 pb-28 h-[calc(100%-24px)] overflow-y-auto no-scrollbar">
        <h2 className="text-sm font-cairo font-bold text-umi-cream mb-1">الحسابات الفرعية</h2>
        <p className="text-[10px] text-umi-muted font-tajawal mb-3">أنت ولي الأمر · 2 حسابات مرتبطة</p>

        {subs.map((s) => {
          const pct = Math.round((s.used / s.limit) * 100);
          const isFrozen = !!frozen[s.id];
          return (
            <div key={s.id} className={`rounded-2xl p-3.5 mb-3 border transition-colors ${isFrozen ? "bg-white/[0.02] border-white/6 opacity-70" : "bg-white/[0.04] border-white/8"}`}>
              <div className="flex items-center gap-2.5 mb-3">
                <span className={`w-10 h-10 rounded-full ${s.avatar} flex items-center justify-center text-umi-cream font-cairo font-bold text-sm`}>
                  {s.name[0]}
                </span>
                <span className="flex-1">
                  <span className="block text-xs font-cairo font-bold text-umi-cream">{s.name}</span>
                  <span className="block text-[9px] text-umi-muted font-tajawal">{s.age} سنة · بطاقة افتراضية مرتبطة</span>
                </span>
                <button
                  type="button"
                  onClick={() => setFrozen((f) => ({ ...f, [s.id]: !f[s.id] }))}
                  aria-pressed={isFrozen}
                  className={`flex items-center gap-1 text-[9px] px-2 py-1 rounded-full font-tajawal font-bold transition-colors ${
                    isFrozen ? "bg-umi-red/15 text-umi-red" : "bg-white/[0.06] text-umi-muted hover:text-umi-cream"
                  }`}
                >
                  <Snowflake className="w-3 h-3" />
                  {isFrozen ? "مجمّد" : "تجميد"}
                </button>
              </div>

              <div className="flex items-center justify-between mb-1.5 text-[9px] font-tajawal">
                <span className="text-umi-muted">الاستهلاك الشهري</span>
                <span className="text-umi-cream font-bold" dir="ltr">
                  {s.used} / {s.limit} ر.س
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-white/8 overflow-hidden mb-3" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                <div className={`h-full rounded-full ${pct > 60 ? "bg-gradient-to-l from-umi-goldsoft to-umi-golddeep" : "bg-umi-teal/70"}`} style={{ width: `${pct}%` }} />
              </div>

              <div className="flex gap-2">
                <button type="button" className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl bg-umi-gold/12 text-umi-gold text-[10px] font-tajawal font-bold hover:bg-umi-gold/20 transition-colors">
                  <Pencil className="w-3 h-3" /> تعديل الحد
                </button>
                <button type="button" className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl bg-white/[0.05] border border-white/10 text-umi-cream/80 text-[10px] font-tajawal font-bold hover:bg-white/10 transition-colors">
                  <Check className="w-3 h-3" /> طلبات الشراء
                </button>
              </div>
            </div>
          );
        })}

        {/* add sub account */}
        <button
          type="button"
          onClick={() => onNavigate?.("family")}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-umi-gold/40 text-umi-gold text-[11px] font-cairo font-bold hover:bg-umi-gold/8 transition-colors"
        >
          <Plus className="w-4 h-4" /> إضافة حساب فرعي جديد
        </button>
      </div>
      <TabBar active="family" onNavigate={onNavigate} />
    </div>
  );
}
