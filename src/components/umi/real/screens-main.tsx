"use client";

// UMI PAY — الشاشات الرئيسية: دخول/تسجيل / محفظة (تصميم جديد) / سجل / ملف شخصي / QR
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bell, ChevronLeft, Eye, EyeOff, LogOut, QrCode, ShieldCheck,
  Smartphone, ArrowDownLeft, ArrowUpRight, Store, HandCoins, Sparkles,
  KeyRound, Lock, BadgeCheck,
} from "lucide-react";
import { StatusBar } from "@/components/umi/phone-frame";
import { ScreenHeader, TxRow, SypAmount } from "@/components/umi/real/pads";
import { UmiLogo } from "@/components/umi/logo";
import { api } from "@/lib/umi-client";
import { useRates } from "@/lib/rates";
import {
  fmtSyp, usdLine, fmtUsd, sypToUsd, pointsToSyp, fmtPoints,
  SYP_UNIT, validatePass, validatePin,
} from "@/lib/currency";
import {
  relTime, TYPE_LABELS, type HomeData, type Me, type TxItem, type TamayuzCardT,
} from "@/lib/umi-types";

/* ============ شاشة الدخول / إنشاء الحساب ============ */
export function LoginScreen({ onLogin }: { onLogin: (me: Me) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [phone, setPhone] = useState("");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  // حقول التسجيل
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [asMerchant, setAsMerchant] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const doLogin = useCallback(async () => {
    setBusy(true);
    setErr("");
    try {
      const me = await api<Me>("/api/umi/login", {
        method: "POST",
        body: JSON.stringify({ phone: phone.trim(), pass }),
      });
      onLogin(me);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, [phone, pass, onLogin]);

  const doRegister = useCallback(async () => {
    setBusy(true);
    setErr("");
    try {
      const me = await api<Me>("/api/umi/register", {
        method: "POST",
        body: JSON.stringify({ name, phone: phone.trim(), pass, pin, role: asMerchant ? "merchant" : "individual" }),
      });
      onLogin(me);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, [name, phone, pass, pin, asMerchant, onLogin]);

  const passErr = mode === "register" && pass ? validatePass(pass) : null;
  const pinErr = mode === "register" && pin.length === 4 ? validatePin(pin) : null;
  const canSubmit =
    mode === "login"
      ? phone.trim().length >= 6 && pass.length >= 8
      : name.trim().length >= 2 && phone.trim().length >= 6 && pass.length >= 8 && pin.length === 4;

  return (
    <div className="h-full flex flex-col bg-umi-bg px-6 pt-6 pb-6 overflow-y-auto no-scrollbar">
      <StatusBar />
      <div className="text-center mt-3 mb-5">
        <div className="flex justify-center mb-3">
          <UmiLogo size={110} />
        </div>
        <h1 className="font-cairo font-black text-[36px] leading-none gold-text tracking-tight">UMI PAY</h1>
        <p className="text-[11.5px] font-tajawal text-umi-muted mt-2">
          محفظتك بالليرة السورية — ومكافئ الدولار دائماً أمامك
        </p>
      </div>

      {/* مبدّل: دخول / حساب جديد */}
      <div className="flex umi-card rounded-2xl p-1 mb-4" role="tablist">
        {(["login", "register"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => { setMode(m); setErr(""); }}
            className={`flex-1 h-9 rounded-xl text-[12px] font-tajawal font-bold transition-all ${
              mode === m ? "text-[#0a0416]" : "text-umi-muted"
            }`}
            style={mode === m ? { background: "linear-gradient(135deg,#f5dfa0,#e8c766)" } : undefined}
          >
            {m === "login" ? "تسجيل الدخول" : "حساب جديد"}
          </button>
        ))}
      </div>

      {mode === "register" && (
        <>
          <label className="text-[11px] font-tajawal font-bold text-umi-muted mb-1 block">الاسم الكامل</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="مثال: مأمون الخضر"
            className="w-full h-11 rounded-xl umi-card bg-transparent px-4 font-cairo text-sm text-umi-cream placeholder:text-umi-muted/50 outline-none focus:border-umi-gold/40 mb-3"
          />
        </>
      )}

      <label className="text-[11px] font-tajawal font-bold text-umi-muted mb-1 block">رقم الجوال</label>
      <input
        value={phone}
        onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, ""))}
        inputMode="tel"
        dir="ltr"
        placeholder="09xxxxxxxx"
        className="w-full h-11 rounded-xl umi-card bg-transparent px-4 text-left font-cairo text-sm text-umi-cream placeholder:text-umi-muted/50 outline-none focus:border-umi-gold/40 mb-3"
      />

      <label className="text-[11px] font-tajawal font-bold text-umi-muted mb-1 block">
        {mode === "login" ? "كلمة مرور المحفظة" : "كلمة المرور (8 خانات أو أكثر — حروف وأرقام)"}
      </label>
      <div className="relative mb-1.5">
        <input
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          type={showPass ? "text" : "password"}
          dir="ltr"
          placeholder="••••••••"
          className="w-full h-11 rounded-xl umi-card bg-transparent px-4 pl-11 text-left font-cairo text-sm tracking-widest text-umi-cream placeholder:text-umi-muted/50 outline-none focus:border-umi-gold/40"
        />
        <button
          type="button"
          onClick={() => setShowPass((s) => !s)}
          aria-label="إظهار كلمة المرور"
          className="absolute left-3 top-1/2 -translate-y-1/2 text-umi-muted"
        >
          {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {passErr && <p className="text-[10px] font-tajawal text-umi-red mb-1">{passErr}</p>}

      {mode === "register" && (
        <>
          <label className="text-[11px] font-tajawal font-bold text-umi-muted mb-1 mt-1 block">
            رمز الدفع — 4 أرقام (يُطلب عند كل عملية دفع)
          </label>
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
            inputMode="numeric"
            type="password"
            dir="ltr"
            placeholder="••••"
            className="w-full h-11 rounded-xl umi-card bg-transparent px-4 text-left font-cairo text-sm tracking-[0.5em] text-umi-cream placeholder:text-umi-muted/50 outline-none focus:border-umi-gold/40 mb-1"
          />
          {pinErr && <p className="text-[10px] font-tajawal text-umi-red mb-1">{pinErr}</p>}
          <button
            type="button"
            onClick={() => setAsMerchant((v) => !v)}
            className={`w-full h-11 rounded-xl umi-card px-4 flex items-center gap-2.5 mb-3 transition-colors ${asMerchant ? "border-umi-gold/40" : ""}`}
          >
            <span className={`w-5 h-5 rounded-md grid place-items-center border ${asMerchant ? "bg-umi-gold border-umi-gold text-[#0a0416]" : "border-umi-muted/40"}`}>
              {asMerchant && <BadgeCheck className="w-3.5 h-3.5" />}
            </span>
            <span className="text-[12px] font-tajawal font-bold text-umi-cream flex-1 text-right">
              حساب تاجر — أستلم مدفوعات في متجري
            </span>
            <Store className="w-4 h-4 text-umi-gold" />
          </button>
        </>
      )}

      {err && <p className="text-[11px] font-tajawal text-umi-red mb-2 text-center">{err}</p>}

      <button
        type="button"
        disabled={busy || !canSubmit}
        onClick={mode === "login" ? doLogin : doRegister}
        className="w-full h-11 rounded-xl font-cairo font-extrabold text-sm text-[#0a0416] disabled:opacity-40 active:scale-[0.98] transition-all"
        style={{ background: "linear-gradient(135deg,#f5dfa0,#e8c766 55%,#c99b3f)" }}
      >
        {busy ? "جارٍ المعالجة…" : mode === "login" ? "تسجيل الدخول" : "إنشاء المحفظة"}
      </button>

      <div className="flex items-center gap-3 my-4">
        <span className="flex-1 h-px bg-white/10" />
        <span className="text-[10px] font-tajawal text-umi-muted">أمان متدرج</span>
        <span className="flex-1 h-px bg-white/10" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="umi-card rounded-xl px-3 py-2.5 flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-umi-gold shrink-0" />
          <p className="text-[9.5px] font-tajawal text-umi-muted leading-snug">
            دخول بكلمة مرور <b className="text-umi-cream">8+ خانات</b> حروف وأرقام
          </p>
        </div>
        <div className="umi-card rounded-xl px-3 py-2.5 flex items-center gap-2">
          <Lock className="w-4 h-4 text-umi-purplight shrink-0" />
          <p className="text-[9.5px] font-tajawal text-umi-muted leading-snug">
            دفع برمز سري <b className="text-umi-cream">4 أرقام</b> فقط
          </p>
        </div>
      </div>
      <RateChip />
    </div>
  );
}

/* شريحة تسعير الصرف — الدولار + نقطة أومي */
export function RateChip() {
  const { rates } = useRates();
  return (
    <div className="flex justify-center">
      <div className="inline-flex items-center gap-2 mt-3.5 px-3.5 py-1.5 rounded-full umi-card">
        <span className="w-1.5 h-1.5 rounded-full bg-umi-teal animate-umi-pulse" />
        <span className="text-[10px] font-tajawal font-bold text-umi-cream" dir="ltr">
          $1 = {fmtSyp(rates.usdSyp)} {SYP_UNIT}
        </span>
        <span className="w-px h-3 bg-white/10" />
        <span className="text-[10px] font-tajawal text-umi-muted">
          نقطة أومي = {fmtSyp(rates.pointSyp)} {SYP_UNIT}
        </span>
      </div>
    </div>
  );
}

/* عملة ذهبية لنقاط أومي */
export function CoinIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="coin-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f5dfa0" />
          <stop offset="55%" stopColor="#e8c766" />
          <stop offset="100%" stopColor="#c99b3f" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="10" fill="url(#coin-g)" />
      <circle cx="12" cy="12" r="7.2" fill="none" stroke="#8a6a24" strokeOpacity="0.55" strokeWidth="1.1" />
      <path d="M12 6.8v10.4M9.4 9.2h5.2M9.4 12h5.2M9.4 14.8h5.2" stroke="#6b4f1a" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
    </svg>
  );
}

/* ============ الشاشة الرئيسية (المحفظة) — التصميم الجديد ============ */
export function HomeScreen({
  data,
  hidden,
  onToggleHidden,
  onQuick,
  onOpenHistory,
  onOpenProfile,
  onOpenTamayuz,
}: {
  data: HomeData;
  hidden: boolean;
  onToggleHidden: () => void;
  onQuick: (a: "send" | "topup" | "qr" | "stores") => void;
  onOpenHistory: () => void;
  onOpenProfile: () => void;
  onOpenTamayuz: () => void;
}) {
  const { me, weekIn, weekOut, txs } = data;
  const { rates } = useRates();
  const isMerchant = me.role === "merchant";
  const actions = [
    { key: "send" as const, label: "تحويل", icon: <ArrowUpRight className="w-5 h-5" strokeWidth={1.9} /> },
    { key: "topup" as const, label: "شحن", icon: <ArrowDownLeft className="w-5 h-5" strokeWidth={1.9} /> },
    { key: "qr" as const, label: "رمزي QR", icon: <QrCode className="w-5 h-5" strokeWidth={1.9} /> },
    { key: "stores" as const, label: "المتاجر", icon: <Store className="w-5 h-5" strokeWidth={1.9} /> },
  ];
  return (
    <div className="h-full flex flex-col bg-umi-bg">
      <StatusBar />
      <header className="flex items-center gap-3 px-5 pt-2 pb-3">
        <button
          type="button"
          onClick={onOpenProfile}
          aria-label="الملف الشخصي"
          className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 grid place-items-center text-xl active:scale-95 transition-transform"
        >
          {me.avatar}
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-tajawal text-umi-muted">
            {isMerchant ? "أهلاً بك في" : "أهلاً بعودتك،"}
          </p>
          <p className="font-cairo font-bold text-[15px] text-umi-cream truncate">{me.name}</p>
        </div>
        <button
          type="button"
          onClick={onOpenHistory}
          aria-label="التنبيهات"
          className="w-9 h-9 rounded-full bg-white/5 border border-white/10 grid place-items-center text-umi-muted"
        >
          <Bell className="w-4 h-4" strokeWidth={1.8} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto umi-scroll pb-24">
        {/* ==== بطاقة الرصيد البطلة ==== */}
        <section className="mx-4 rounded-[26px] p-5 relative overflow-hidden umi-hero" aria-label="رصيد المحفظة">
          <div className="umi-shimmer-line absolute top-0 inset-x-0" />
          <div className="absolute -bottom-10 -left-6 opacity-[0.06] pointer-events-none">
            <UmiLogo size={130} />
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10.5px] font-tajawal text-umi-cream/70">
              {isMerchant ? "رصيد المتجر" : "الرصيد المتاح"}
            </span>
            <button type="button" onClick={onToggleHidden} aria-label="إظهار/إخفاء الرصيد" className="text-umi-cream/60">
              {hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex items-baseline gap-2" dir="ltr">
            <span className="font-cairo font-black text-[34px] leading-none gold-text tracking-tight">
              {hidden ? "••••••" : fmtSyp(me.balance)}
            </span>
            <span className="text-sm font-tajawal text-umi-cream/70">{SYP_UNIT}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="w-4 h-4 rounded-full bg-umi-teal/15 grid place-items-center text-[8px] font-cairo font-bold text-umi-teal">$</span>
            <span className="text-[11px] font-tajawal font-bold text-umi-teal" dir="ltr">
              {hidden ? "≈ ••••" : usdLine(me.balance, rates.usdSyp)}
            </span>
            <span className="text-[9px] font-tajawal text-umi-muted">مكافئ دولار حسب سعر الصرف</span>
          </div>

          <div className="flex gap-2 mt-4">
            <span className="flex-1 rounded-2xl bg-black/25 border border-white/5 px-3 py-2">
              <span className="flex items-center gap-1 text-[9px] font-tajawal text-umi-cream/60 mb-0.5">
                <ArrowDownLeft className="w-3 h-3 text-umi-gold" /> وارد (7 أيام)
              </span>
              <span className="font-cairo font-bold text-[13px] text-umi-gold" dir="ltr">
                {fmtSyp(weekIn)} <span className="text-[9px] text-umi-muted font-tajawal">{SYP_UNIT}</span>
              </span>
            </span>
            <span className="flex-1 rounded-2xl bg-black/25 border border-white/5 px-3 py-2">
              <span className="flex items-center gap-1 text-[9px] font-tajawal text-umi-cream/60 mb-0.5">
                <ArrowUpRight className="w-3 h-3 text-umi-purplight" /> صادر (7 أيام)
              </span>
              <span className="font-cairo font-bold text-[13px] text-umi-cream" dir="ltr">
                {fmtSyp(weekOut)} <span className="text-[9px] text-umi-muted font-tajawal">{SYP_UNIT}</span>
              </span>
            </span>
          </div>
        </section>

        {/* ==== شريط نقاط أومي ==== */}
        <section className="mx-4 mt-3 rounded-2xl px-4 py-3 umi-card flex items-center gap-3" aria-label="نقاط أومي">
          <span className="w-10 h-10 rounded-2xl grid place-items-center bg-umi-gold/10 shrink-0">
            <CoinIcon className="w-6 h-6" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-tajawal font-bold text-umi-cream">
              نقاط أومي
              <span className="text-[8.5px] font-tajawal text-umi-muted mr-1.5 px-1.5 py-0.5 rounded-full bg-white/5 border border-white/10">
                تُمنح من الإدارة فقط
              </span>
            </p>
            <p className="text-[9.5px] font-tajawal text-umi-muted">
              ≈ {fmtSyp(pointsToSyp(me.points, rates.pointSyp))} {SYP_UNIT} · للهدايا والمزايا — لا تُباع ولا تُشترى
            </p>
          </div>
          <p className="font-cairo font-black text-lg gold-text shrink-0" dir="ltr">
            {hidden ? "•••" : fmtPoints(me.points)}
          </p>
        </section>

        {/* ==== الإجراءات السريعة ==== */}
        <nav aria-label="إجراءات سريعة" className="grid grid-cols-4 gap-2 px-4 mt-4">
          {actions.map((a) => (
            <button
              key={a.key}
              type="button"
              onClick={() => onQuick(a.key)}
              className="flex flex-col items-center gap-1.5 py-2 rounded-2xl active:bg-white/5 transition-colors"
            >
              <span className="w-12 h-12 rounded-2xl grid place-items-center text-[#0a0416] umi-glow" style={{ background: "linear-gradient(135deg,#f5dfa0,#e8c766 60%,#c99b3f)" }}>
                {a.icon}
              </span>
              <span className="text-[10px] font-tajawal font-bold text-umi-cream">{a.label}</span>
            </button>
          ))}
        </nav>

        {/* ==== لافتة بطاقة التميز ==== */}
        <button
          type="button"
          onClick={onOpenTamayuz}
          className="mx-4 mt-3 w-[calc(100%-32px)] rounded-2xl p-3.5 relative overflow-hidden umi-shimmer flex items-center gap-3 text-right"
          style={{ background: "linear-gradient(120deg,#241536 0%,#160c28 60%,#1c1033 100%)", border: "1px solid rgba(232,199,102,0.28)" }}
        >
          <span className="w-11 h-11 rounded-2xl grid place-items-center shrink-0" style={{ background: "linear-gradient(135deg,#f5dfa0,#c99b3f)" }}>
            <Sparkles className="w-5 h-5 text-[#0a0416]" />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block font-cairo font-extrabold text-[13px] gold-text">بطاقة التميز UMI</span>
            <span className="block text-[9.5px] font-tajawal text-umi-muted leading-snug">
              بطاقة ذهبية بنظام أمريكان إكسبريس — تتطلب رصيد 50,000 {SYP_UNIT} فأكثر
            </span>
          </span>
          <ChevronLeft className="w-4 h-4 text-umi-gold shrink-0" />
        </button>

        {/* ==== آخر العمليات ==== */}
        <section className="mt-4" aria-label="آخر العمليات">
          <div className="flex items-center justify-between px-5 mb-1">
            <h3 className="font-cairo font-bold text-[14px] text-umi-cream">آخر العمليات</h3>
            <button type="button" onClick={onOpenHistory} className="flex items-center text-[10px] font-tajawal text-umi-gold">
              عرض الكل <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>
          <div>
            {txs.slice(0, 6).map((t) => (
              <TxRow
                key={t.id}
                emoji={t.emoji}
                title={t.counterparty}
                sub={`${TYPE_LABELS[t.type]}${t.note ? " · " + t.note : ""} · ${relTime(t.createdAt)}`}
                amount={t.amount}
                direction={t.direction}
                onClick={onOpenHistory}
              />
            ))}
            {txs.length === 0 && (
              <p className="text-center text-[11px] font-tajawal text-umi-muted py-8">لا توجد عمليات بعد — ابدأ بشحن محفظتك</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

/* ============ شاشة السجل ============ */
export function HistoryScreen({ meId, onBack }: { meId: string; onBack: () => void }) {
  const [filter, setFilter] = useState<"all" | "in" | "out" | "merchant">("all");
  const [txs, setTxs] = useState<TxItem[] | null>(null);

  useEffect(() => {
    api<{ txs: TxItem[] }>(`/api/umi/transactions?userId=${meId}&filter=${filter}`)
      .then((d) => setTxs(d.txs))
      .catch(() => setTxs([]));
  }, [meId, filter]);

  const pickFilter = (f: "all" | "in" | "out" | "merchant") => {
    setFilter(f);
    setTxs(null);
  };

  const filters = [
    { key: "all" as const, label: "الكل" },
    { key: "in" as const, label: "وارد" },
    { key: "out" as const, label: "صادر" },
    { key: "merchant" as const, label: "المتاجر" },
  ];

  return (
    <div className="absolute inset-0 z-40 bg-umi-bg flex flex-col">
      <ScreenHeader title="سجل المعاملات" subtitle="بالليرة السورية — محفوظ في قاعدة البيانات" onBack={onBack} />
      <div className="flex gap-1.5 px-4 pb-3">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => pickFilter(f.key)}
            className={`px-3.5 h-8 rounded-full text-[11px] font-tajawal font-bold transition-colors ${
              filter === f.key ? "text-[#0a0416]" : "text-umi-muted umi-card"
            }`}
            style={filter === f.key ? { background: "linear-gradient(135deg,#f5dfa0,#e8c766)" } : undefined}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto umi-scroll pb-6">
        {txs === null && <p className="text-center text-umi-muted text-[11px] font-tajawal pt-10 animate-pulse">جارٍ التحميل…</p>}
        {txs?.map((t) => (
          <TxRow
            key={t.id}
            emoji={t.emoji}
            title={t.counterparty}
            sub={`${TYPE_LABELS[t.type]}${t.note ? " · " + t.note : ""} · ${relTime(t.createdAt)} · ${t.reference}`}
            amount={t.amount}
            direction={t.direction}
          />
        ))}
        {txs?.length === 0 && <p className="text-center text-[11px] font-tajawal text-umi-muted py-10">لا توجد نتائج</p>}
      </div>
    </div>
  );
}

/* ============ بطاقة QR ============ */
function qrCells(seedStr: string): boolean[][] {
  const n = 21;
  let seed = [...seedStr].reduce((a, c) => a + c.charCodeAt(0) * 31, 7);
  const rnd = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  const g: boolean[][] = Array.from({ length: n }, () => Array.from({ length: n }, () => rnd() > 0.52));
  const finder = (r0: number, c0: number) => {
    for (let r = 0; r < 7; r++)
      for (let c = 0; c < 7; c++) {
        const edge = r === 0 || r === 6 || c === 0 || c === 6;
        const core = r >= 2 && r <= 4 && c <= 4 && c >= 2;
        if (r0 + r < n && c0 + c < n) g[r0 + r][c0 + c] = edge || core;
      }
  };
  finder(0, 0);
  finder(0, n - 7);
  finder(n - 7, 0);
  return g;
}

export function QrSheet({ me, onClose }: { me: Me; onClose: () => void }) {
  const grid = useMemo(() => qrCells(me.id + me.phone), [me.id, me.phone]);
  return (
    <div className="absolute inset-0 z-40 bg-umi-bg flex flex-col">
      <ScreenHeader title="الرمز السريع" subtitle="اعرضه لاستلام أموال" onBack={onClose} />
      <div className="flex-1 grid place-items-center px-8 pb-8">
        <div className="w-full rounded-3xl p-6 umi-card text-center">
          <div className="w-12 h-12 mx-auto rounded-2xl grid place-items-center text-xl bg-white/5 border border-white/10 mb-3">{me.avatar}</div>
          <p className="font-cairo font-bold text-umi-cream text-sm">{me.name}</p>
          <svg viewBox="0 0 21 21" className="w-44 h-44 mx-auto my-4" role="img" aria-label="رمز QR للمحفظة">
            {grid.flatMap((row, r) =>
              row.map((on, c) =>
                on ? <rect key={`${r}-${c}`} x={c} y={r} width={1} height={1} rx={0.25} fill="#e8c766" /> : null
              )
            )}
          </svg>
          <p className="text-[10px] font-tajawal text-umi-muted" dir="ltr">{me.phone}</p>
          <p className="flex items-center justify-center gap-1 text-[10px] font-tajawal text-umi-teal mt-3">
            <ShieldCheck className="w-3.5 h-3.5" /> مرتبط بمحفظتك في قاعدة البيانات
          </p>
        </div>
      </div>
    </div>
  );
}

/* ============ بطاقة التميز — نظام أمريكان إكسبريس (15 خانة) ============ */
export function TamayuzCardView({ card, compact }: { card: TamayuzCardT; compact?: boolean }) {
  const groups = [card.number.slice(0, 4), card.number.slice(4, 10), card.number.slice(10, 15)];
  return (
    <div
      className={`relative overflow-hidden rounded-3xl umi-shimmer ${compact ? "p-4" : "p-5"} w-full`}
      style={{
        background: "radial-gradient(130% 150% at 80% -10%, rgba(123,91,199,0.6), transparent 55%), linear-gradient(150deg,#2a1a44 0%,#170d2b 55%,#0d0719 100%)",
        border: "1px solid rgba(232,199,102,0.35)",
        boxShadow: "0 20px 50px -20px rgba(0,0,0,0.9), inset 0 1px 0 rgba(245,223,160,0.2)",
      }}
    >
      <div className="umi-shimmer-line absolute top-0 inset-x-0" />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[9px] font-tajawal text-umi-gold/80 tracking-widest">UMI PAY · بطاقة التميز</p>
          <p className="font-cairo font-black text-lg gold-text leading-tight">TAMAYUZ</p>
        </div>
        <span className="px-2 py-0.5 rounded-full text-[8.5px] font-cairo font-black text-[#0a0416]" style={{ background: "linear-gradient(135deg,#f5dfa0,#c99b3f)" }}>
          {card.tier}
        </span>
      </div>
      <div className="mt-4 flex items-center gap-3" dir="ltr">
        <span className="w-8 h-6 rounded-md grid place-items-center bg-gradient-to-br from-[#f5dfa0] to-[#c99b3f] text-[9px] font-cairo font-black text-[#0a0416]">
          U
        </span>
        <p className="font-cairo font-bold tracking-[0.12em] text-umi-cream text-[15px]">
          {groups[0]} <span className="tracking-[0.18em]">{groups[1]}</span> {groups[2]}
        </p>
      </div>
      <div className="mt-2.5 flex items-end justify-between" dir="ltr">
        <div>
          <p className="text-[8px] font-tajawal text-umi-muted tracking-widest">CARD MEMBER</p>
          <p className="text-[12px] font-tajawal font-bold text-umi-cream">{card.holder}</p>
        </div>
        <div className="text-left">
          <p className="text-[8px] font-tajawal text-umi-muted tracking-widest">VALID THRU</p>
          <p className="text-[12px] font-tajawal font-bold text-umi-cream">{card.expiry}</p>
        </div>
      </div>
    </div>
  );
}

/* شاشة بطاقة التميز — الأهلية والإصدار */
export function TamayuzSheet({ me, onClose }: { me: Me; onClose: () => void }) {
  const [data, setData] = useState<{ card: TamayuzCardT | null; eligible: boolean; minBalance: number; balance: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const load = useCallback(() => {
    api<{ card: TamayuzCardT | null; eligible: boolean; minBalance: number; balance: number }>(`/api/umi/tamayuz?userId=${me.id}`)
      .then(setData)
      .catch(() => setData(null));
  }, [me.id]);
  useEffect(load, [load]);

  const issue = async () => {
    setBusy(true);
    setErr("");
    try {
      await api("/api/umi/tamayuz", { method: "POST", body: JSON.stringify({ userId: me.id }) });
      setOkMsg("تم إصدار بطاقة التميز بنجاح ✓");
      load();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="absolute inset-0 z-40 bg-umi-bg flex flex-col">
      <ScreenHeader title="بطاقة التميز" subtitle="نظام أمريكان إكسبريس — 15 خانة" onBack={onClose} />
      <div className="flex-1 overflow-y-auto umi-scroll px-5 pb-8">
        {data?.card ? (
          <>
            <div className="mt-2"><TamayuzCardView card={data.card} /></div>
            <div className="rounded-2xl p-4 umi-card mt-4 flex items-center gap-3">
              <BadgeCheck className="w-5 h-5 text-umi-gold shrink-0" />
              <p className="text-[11px] font-tajawal text-umi-cream leading-relaxed">
                بطاقتك فعّالة — اعرضها عند الدفع واستمتع بمزايا التميز. رقمها مُصدَّر في قاعدة البيانات ومرتبط بمحفظتك.
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="mt-2 rounded-3xl p-5 umi-card text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl grid place-items-center mb-3" style={{ background: "linear-gradient(135deg,#f5dfa0,#c99b3f)" }}>
                <Sparkles className="w-7 h-7 text-[#0a0416]" />
              </div>
              <h3 className="font-cairo font-extrabold text-umi-cream">بطاقة ذهبية لأصحاب التميز</h3>
              <p className="text-[11px] font-tajawal text-umi-muted leading-relaxed mt-2">
                تُصدَر البطاقة تلقائياً لحسابك عند وصول رصيد محفظتك إلى {data ? data.minBalance.toLocaleString("en-US") : "50,000"} {SYP_UNIT} فأكثر.
              </p>
              {data && (
                <p className="text-[11px] font-tajawal mt-3" style={{ color: data.eligible ? "#6fb5a3" : "#c87b7b" }}>
                  رصيدك الحالي: {fmtSyp(data.balance)} {SYP_UNIT}
                  {data.eligible ? " — أنت مؤهل ✓" : ` — يتبقى ${fmtSyp(data.minBalance - data.balance)} ${SYP_UNIT}`}
                </p>
              )}
              {err && <p className="text-[11px] font-tajawal text-umi-red mt-2">{err}</p>}
              {okMsg && <p className="text-[11px] font-tajawal text-umi-teal mt-2">{okMsg}</p>}
              <button
                type="button"
                disabled={busy || !(data?.eligible)}
                onClick={issue}
                className="w-full h-11 mt-4 rounded-xl font-cairo font-extrabold text-sm text-[#0a0416] disabled:opacity-40 active:scale-[0.98] transition-all"
                style={{ background: "linear-gradient(135deg,#f5dfa0,#e8c766 55%,#c99b3f)" }}
              >
                {busy ? "جارٍ الإصدار…" : "اطلب إصدار البطاقة"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ============ الملف الشخصي — المحفظة + الأمان + البطاقات ============ */
export function ProfileScreen({ me, onLogout, onClose }: { me: Me; onLogout: () => void; onClose: () => void }) {
  const { rates } = useRates();
  const roleLabel =
    me.role === "merchant" ? "حساب تاجر" : me.role === "admin" ? "أدمن المحفظة" : "حساب شخصي";

  const [card, setCard] = useState<TamayuzCardT | null>(null);
  useEffect(() => {
    api<{ card: TamayuzCardT | null }>(`/api/umi/tamayuz?userId=${me.id}`)
      .then((d) => setCard(d.card))
      .catch(() => {});
  }, [me.id]);

  return (
    <div className="absolute inset-0 z-40 bg-umi-bg flex flex-col">
      <ScreenHeader title="حسابي" onBack={onClose} />
      <div className="flex-1 overflow-y-auto umi-scroll px-5 pb-8">
        <div className="text-center mt-1 mb-5">
          <div className="w-20 h-20 mx-auto rounded-3xl grid place-items-center text-4xl bg-white/5 border border-white/10">{me.avatar}</div>
          <h3 className="font-cairo font-extrabold text-lg text-umi-cream mt-3">{me.name}</h3>
          <p className="text-[11px] font-tajawal text-umi-muted" dir="ltr">{me.phone}</p>
          <span className="inline-block mt-2 px-3 py-1 rounded-full text-[10px] font-tajawal font-bold text-[#0a0416]" style={{ background: "linear-gradient(135deg,#f5dfa0,#e8c766)" }}>
            {roleLabel}
          </span>
        </div>

        {/* المحفظة */}
        <div className="rounded-2xl p-4 umi-hero mb-3">
          <p className="text-[10px] font-tajawal text-umi-cream/70 mb-1">رصيد المحفظة</p>
          <p className="font-cairo font-black text-[24px] gold-text leading-tight" dir="ltr">
            {fmtSyp(me.balance)} <span className="text-xs font-tajawal text-umi-cream/70">{SYP_UNIT}</span>
          </p>
          <p className="text-[10px] font-tajawal text-umi-teal" dir="ltr">{usdLine(me.balance, rates.usdSyp)}</p>
          <div className="umi-shimmer-line my-3" />
          <div className="flex items-center gap-2.5">
            <CoinIcon className="w-5 h-5" />
            <p className="text-[11px] font-tajawal text-umi-cream flex-1">
              نقاط أومي: <b className="gold-text">{fmtPoints(me.points)}</b>
              <span className="text-umi-muted"> ≈ {fmtSyp(pointsToSyp(me.points, rates.pointSyp))} {SYP_UNIT}</span>
            </p>
          </div>
        </div>

        {/* بطاقة التميز إن وُجدت */}
        {card && (
          <div className="mb-3">
            <p className="text-[11px] font-tajawal font-bold text-umi-muted mb-2">بطاقاتي</p>
            <TamayuzCardView card={card} compact />
          </div>
        )}

        {/* الأمان */}
        <SecuritySection me={me} />

        <div className="rounded-2xl p-4 umi-card mb-3">
          <p className="flex items-center gap-1.5 text-[11px] font-tajawal text-umi-teal mb-1">
            <ShieldCheck className="w-4 h-4" /> جلسة موثوقة
          </p>
          <p className="text-[10px] font-tajawal text-umi-muted leading-relaxed">
            عملتك الأساسية الليرة السورية — مكافئ الدولار يُحسب من سعر الصرف الذي تديره الإدارة، ونقاط أومي محفظة مكافآت تُمنح من الإدارة فقط.
          </p>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="w-full h-11 rounded-xl umi-card flex items-center justify-center gap-2 text-umi-red font-tajawal font-bold text-[13px] active:bg-white/5"
        >
          <LogOut className="w-4 h-4" /> تسجيل الخروج
        </button>
        <p className="text-center text-[9px] font-tajawal text-umi-muted/60 mt-4">UMI PAY · v2.0 — ل.س أساسية + دولار + نقاط أومي</p>
      </div>
    </div>
  );
}

/* قسم الأمان: تغيير كلمة المرور / رمز الدفع */
function SecuritySection({ me }: { me: Me }) {
  const [openPass, setOpenPass] = useState(false);
  const [openPin, setOpenPin] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (action: "pass" | "pin") => {
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      await api("/api/umi/account", {
        method: "PATCH",
        body: JSON.stringify({ userId: me.id, action, current, next }),
      });
      setMsg(action === "pass" ? "تم تغيير كلمة المرور ✓" : "تم تغيير رمز الدفع ✓");
      setCurrent("");
      setNext("");
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const passHint = next && validatePass(next);
  const pinHint = next.length > 0 && !/^\d{4}$/.test(next) ? "4 أرقام فقط" : null;

  return (
    <div className="rounded-2xl p-4 umi-card mb-3">
      <p className="flex items-center gap-1.5 text-[11px] font-tajawal font-bold text-umi-cream mb-2.5">
        <Lock className="w-4 h-4 text-umi-gold" /> أمان الحساب
      </p>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => { setOpenPass((v) => !v); setOpenPin(false); setMsg(""); setErr(""); }}
          className="h-10 rounded-xl bg-white/5 border border-white/10 text-[11px] font-tajawal font-bold text-umi-cream active:bg-white/10 flex items-center justify-center gap-1.5"
        >
          <KeyRound className="w-3.5 h-3.5 text-umi-gold" /> كلمة المرور
        </button>
        <button
          type="button"
          onClick={() => { setOpenPin((v) => !v); setOpenPass(false); setMsg(""); setErr(""); }}
          className="h-10 rounded-xl bg-white/5 border border-white/10 text-[11px] font-tajawal font-bold text-umi-cream active:bg-white/10 flex items-center justify-center gap-1.5"
        >
          <Smartphone className="w-3.5 h-3.5 text-umi-purplight" /> رمز الدفع
        </button>
      </div>

      {(openPass || openPin) && (
        <div className="mt-3 space-y-2">
          <input
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            type="password"
            dir="ltr"
            placeholder={openPass ? "كلمة المرور الحالية" : "رمز الدفع الحالي (4 أرقام)"}
            className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-left font-cairo text-[12px] text-umi-cream placeholder:text-umi-muted/50 outline-none focus:border-umi-gold/40"
          />
          <input
            value={next}
            onChange={(e) => setNext(openPass ? e.target.value : e.target.value.replace(/\D/g, "").slice(0, 4))}
            type="password"
            dir="ltr"
            placeholder={openPass ? "كلمة المرور الجديدة (8+ حروف وأرقام)" : "رمز الدفع الجديد (4 أرقام)"}
            className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-left font-cairo text-[12px] tracking-widest text-umi-cream placeholder:text-umi-muted/50 outline-none focus:border-umi-gold/40"
          />
          {openPass && passHint && <p className="text-[9.5px] font-tajawal text-umi-red">{passHint}</p>}
          {!openPass && pinHint && <p className="text-[9.5px] font-tajawal text-umi-red">{pinHint}</p>}
          {err && <p className="text-[10px] font-tajawal text-umi-red">{err}</p>}
          {msg && <p className="text-[10px] font-tajawal text-umi-teal">{msg}</p>}
          <button
            type="button"
            disabled={busy || !current || !next}
            onClick={() => submit(openPass ? "pass" : "pin")}
            className="w-full h-10 rounded-xl font-cairo font-bold text-[12px] text-[#0a0416] disabled:opacity-40"
            style={{ background: "linear-gradient(135deg,#f5dfa0,#e8c766)" }}
          >
            {busy ? "جارٍ الحفظ…" : openPass ? "حفظ كلمة المرور" : "حفظ رمز الدفع"}
          </button>
        </div>
      )}
    </div>
  );
}
