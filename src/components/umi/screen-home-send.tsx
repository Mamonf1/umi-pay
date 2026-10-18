"use client";

import { useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpLeft,
  Bell,
  Delete,
  Eye,
  EyeOff,
  Gift,
  Phone,
  Plus,
  QrCode,
  Sparkles,
  Store,
} from "lucide-react";
import { StatusBar, TabBar, ScreenKey } from "./phone-frame";

/* ================= الشاشة الرئيسية ================= */
export function HomeScreen({ onNavigate }: { onNavigate?: (k: ScreenKey) => void }) {
  const [hideBalance, setHideBalance] = useState(false);

  const actions = [
    { label: "إرسال", icon: <ArrowUpLeft className="w-5 h-5" />, key: "send" as ScreenKey },
    { label: "طلب", icon: <ArrowDownLeft className="w-5 h-5" />, key: "home" as ScreenKey },
    { label: "شحن", icon: <Plus className="w-5 h-5" />, key: "home" as ScreenKey },
    { label: "رمز QR", icon: <QrCode className="w-5 h-5" />, key: "stores" as ScreenKey },
  ];

  const txs = [
    { icon: <Store className="w-4 h-4" />, name: "ستاربكس — القهوة", time: "اليوم 14:22", amount: "-34.00", pos: false },
    { icon: <ArrowDownLeft className="w-4 h-4" />, name: "تحويل من أحمد", time: "أمس 20:05", amount: "+500.00", pos: true },
    { icon: <Phone className="w-4 h-4" />, name: "شحن رصيد اتصالات", time: "أمس 09:12", amount: "-55.00", pos: false },
    { icon: <Gift className="w-4 h-4" />, name: "كاش باك متجر", time: "الأحد", amount: "+12.75", pos: true },
  ];

  return (
    <div className="h-full relative bg-umi-bg">
      <StatusBar />
      <div className="px-4 pb-28 pt-1 overflow-y-auto no-scrollbar h-[calc(100%-24px)]">
        {/* header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-umi-purple to-[#4a3574] flex items-center justify-center text-umi-cream font-cairo font-bold text-sm">
              ع
            </div>
            <div>
              <p className="text-[10px] text-umi-muted font-tajawal">صباح الخير</p>
              <p className="text-sm font-cairo font-bold text-umi-cream">عبدالله السالم</p>
            </div>
          </div>
          <button
            type="button"
            aria-label="الإشعارات"
            className="relative w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-umi-cream/80 hover:bg-white/10 transition-colors"
          >
            <Bell className="w-4.5 h-4.5" strokeWidth={1.8} />
            <span className="absolute top-2 left-2.5 w-2 h-2 rounded-full bg-umi-gold animate-umi-pulse" aria-hidden="true" />
          </button>
        </div>

        {/* balance card */}
        <div className="relative rounded-2xl p-4 overflow-hidden bg-gradient-to-br from-[#3a2a5e] via-[#241740] to-[#160d28] border border-umi-gold/25 mb-4">
          <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full bg-umi-gold/10 blur-2xl" aria-hidden="true" />
          <div className="flex items-center justify-between mb-1">
            <p className="text-[11px] text-umi-purplight font-tajawal">الإجمالي المتاح</p>
            <button
              type="button"
              onClick={() => setHideBalance((v) => !v)}
              aria-label={hideBalance ? "إظهار الرصيد" : "إخفاء الرصيد"}
              className="text-umi-purplight/80 hover:text-umi-gold transition-colors"
            >
              {hideBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[26px] font-cairo font-black text-umi-cream tracking-tight leading-none mb-2" dir="ltr" style={{ textAlign: "right" }}>
            {hideBalance ? "•••••" : "12,480.50"} <span className="text-sm font-tajawal font-bold text-umi-gold">ر.س</span>
          </p>
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-umi-teal/15 text-umi-teal font-tajawal font-bold">+12.5% هذا الشهر</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-umi-gold/15 text-umi-gold font-tajawal font-bold">نقاط UMI · 1,240</span>
          </div>
        </div>

        {/* quick actions */}
        <div className="grid grid-cols-4 gap-2 mb-4" role="group" aria-label="إجراءات سريعة">
          {actions.map((a) => (
            <button
              key={a.label}
              type="button"
              onClick={() => a.key !== "home" && onNavigate?.(a.key)}
              className="group flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-white/[0.04] border border-white/8 hover:border-umi-gold/40 hover:bg-white/[0.07] transition-all"
            >
              <span className="w-9 h-9 rounded-full bg-umi-gold/12 text-umi-gold flex items-center justify-center group-hover:scale-110 transition-transform">
                {a.icon}
              </span>
              <span className="text-[10px] font-tajawal font-medium text-umi-cream/85">{a.label}</span>
            </button>
          ))}
        </div>

        {/* gamification banner */}
        <button
          type="button"
          className="w-full flex items-center gap-3 rounded-2xl p-3 mb-4 bg-gradient-to-l from-umi-gold/15 via-umi-purple/10 to-transparent border border-umi-gold/25 hover:border-umi-gold/50 transition-colors text-right"
        >
          <span className="w-10 h-10 rounded-full bg-umi-gold/15 text-umi-gold flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </span>
          <span className="flex-1">
            <span className="block text-xs font-cairo font-bold text-umi-cream">عجلة الحظ الأسبوعية</span>
            <span className="block text-[10px] text-umi-muted font-tajawal">لُفّ مرة واحدة يومياً واكسب حتى 500 ر.س</span>
          </span>
          <span className="text-[10px] px-2.5 py-1 rounded-full bg-umi-gold text-[#1c130a] font-tajawal font-bold shrink-0">لُفّ الآن</span>
        </button>

        {/* transactions */}
        <div className="flex items-center justify-between mb-2 px-1">
          <h3 className="text-xs font-cairo font-bold text-umi-cream">آخر المعاملات</h3>
          <button type="button" className="text-[10px] text-umi-gold font-tajawal font-medium hover:underline">
            عرض الكل
          </button>
        </div>
        <ul className="space-y-1.5">
          {txs.map((t) => (
            <li
              key={t.name}
              className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.035] border border-white/6 hover:bg-white/[0.06] transition-colors"
            >
              <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${t.pos ? "bg-umi-teal/15 text-umi-teal" : "bg-umi-purple/20 text-umi-purplight"}`}>
                {t.icon}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-[11px] font-tajawal font-bold text-umi-cream truncate">{t.name}</span>
                <span className="block text-[9px] text-umi-muted font-tajawal">{t.time}</span>
              </span>
              <span className={`text-[11px] font-tajawal font-bold shrink-0 ${t.pos ? "text-umi-teal" : "text-umi-cream/80"}`} dir="ltr">
                {t.amount}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <TabBar active="home" onNavigate={onNavigate} />
    </div>
  );
}

/* ================= شاشة الإرسال ================= */
export function SendScreen({ onNavigate }: { onNavigate?: (k: ScreenKey) => void }) {
  const [amount, setAmount] = useState("250");

  const press = (k: string) => {
    if (k === "del") {
      setAmount((a) => (a.length <= 1 ? "0" : a.slice(0, -1)));
    } else if (k === ".") {
      setAmount((a) => (a.includes(".") ? a : a + "."));
    } else {
      setAmount((a) => {
        if (a === "0") return k;
        if (a.replace(".", "").length >= 6) return a;
        return a + k;
      });
    }
  };

  const contacts = [
    { name: "أحمد", color: "bg-umi-purple/40" },
    { name: "نورة", color: "bg-umi-teal/35" },
    { name: "سارة", color: "bg-umi-gold/30" },
    { name: "محمد", color: "bg-umi-red/30" },
  ];

  return (
    <div className="h-full relative bg-umi-bg">
      <StatusBar />
      <div className="px-4 pt-1 pb-28 h-[calc(100%-24px)] flex flex-col">
        {/* header */}
        <div className="flex items-center gap-3 mb-3">
          <button
            type="button"
            onClick={() => onNavigate?.("home")}
            aria-label="رجوع"
            className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-umi-cream/80 hover:bg-white/10 transition-colors"
          >
            <ArrowUpLeft className="w-4 h-4 rotate-45" />
          </button>
          <h2 className="text-sm font-cairo font-bold text-umi-cream">تحويل أموال</h2>
        </div>

        {/* contacts */}
        <p className="text-[10px] text-umi-muted font-tajawal mb-2 px-1">إرسال سريع إلى</p>
        <div className="flex gap-3 mb-3 overflow-x-auto no-scrollbar">
          {contacts.map((c) => (
            <button key={c.name} type="button" className="flex flex-col items-center gap-1 shrink-0 group">
              <span className={`w-11 h-11 rounded-full ${c.color} flex items-center justify-center text-umi-cream font-cairo font-bold text-sm ring-2 ring-transparent group-hover:ring-umi-gold/60 transition-all`}>
                {c.name[0]}
              </span>
              <span className="text-[9px] text-umi-muted font-tajawal">{c.name}</span>
            </button>
          ))}
          <button type="button" className="flex flex-col items-center gap-1 shrink-0 group">
            <span className="w-11 h-11 rounded-full border border-dashed border-umi-gold/50 text-umi-gold flex items-center justify-center group-hover:bg-umi-gold/10 transition-colors">
              <Plus className="w-4 h-4" />
            </span>
            <span className="text-[9px] text-umi-muted font-tajawal">جديد</span>
          </button>
        </div>

        {/* recipient */}
        <div className="flex items-center gap-2.5 rounded-xl p-2.5 bg-white/[0.04] border border-white/8 mb-3">
          <span className="w-9 h-9 rounded-full bg-umi-purple/40 flex items-center justify-center text-umi-cream font-cairo font-bold text-xs">أ</span>
          <span className="flex-1">
            <span className="block text-[11px] font-tajawal font-bold text-umi-cream">أحمد الغامدي</span>
            <span className="block text-[9px] text-umi-muted font-tajawal" dir="ltr" style={{ textAlign: "right" }}>+966 5•• ••• 4471</span>
          </span>
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-umi-teal/15 text-umi-teal font-tajawal font-bold">موثّق</span>
        </div>

        {/* amount display */}
        <div className="text-center py-3 mb-2">
          <p className="text-[10px] text-umi-muted font-tajawal mb-1">المبلغ</p>
          <p className="text-[34px] leading-none font-cairo font-black text-umi-cream tracking-tight" dir="ltr">
            {amount}
            <span className="text-base font-tajawal font-bold text-umi-gold mr-1"> ر.س</span>
          </p>
        </div>

        {/* note */}
        <div className="rounded-xl bg-white/[0.04] border border-white/8 px-3 py-2 mb-3 text-[10px] text-umi-muted font-tajawal">
          رسالة (اختياري) — "حصة المشروع"
        </div>

        {/* keypad */}
        <div className="grid grid-cols-3 gap-1.5 flex-1" role="group" aria-label="لوحة الأرقام">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "del"].map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => press(k)}
              aria-label={k === "del" ? "حذف" : k}
              className="rounded-xl bg-white/[0.04] border border-white/6 text-umi-cream font-cairo font-bold text-base hover:bg-umi-gold/15 hover:border-umi-gold/40 active:scale-95 transition-all flex items-center justify-center"
            >
              {k === "del" ? <Delete className="w-5 h-5" strokeWidth={1.6} /> : k}
            </button>
          ))}
        </div>

        {/* CTA */}
        <button
          type="button"
          className="mt-3 w-full py-3 rounded-2xl bg-gradient-to-l from-umi-goldsoft via-umi-gold to-umi-golddeep text-[#1c130a] font-cairo font-extrabold text-sm shadow-[0_10px_30px_-8px_rgba(232,199,102,0.5)] hover:brightness-105 active:scale-[0.98] transition-all"
        >
          إرسال {amount} ر.س
        </button>
      </div>
      <TabBar active="send" onNavigate={onNavigate} />
    </div>
  );
}
