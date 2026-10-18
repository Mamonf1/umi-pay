"use client";

// UMI PAY — الشاشات الرئيسية: دخول / محفظة / سجل / ملف شخصي / QR
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bell, ChevronLeft, Eye, EyeOff, LogOut, QrCode, ShieldCheck,
  Smartphone, ArrowDownLeft, ArrowUpRight, Store,
} from "lucide-react";
import { StatusBar } from "@/components/umi/phone-frame";
import { ScreenHeader, TxRow } from "@/components/umi/real/pads";
import { api } from "@/lib/umi-client";
import {
  fmt, relTime, TYPE_LABELS, type HomeData, type Me, type TxItem,
} from "@/lib/umi-types";

/* ============ شاشة الدخول ============ */
export function LoginScreen({ onLogin }: { onLogin: (me: Me) => void }) {
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const doLogin = useCallback(
    async (p: string, c: string) => {
      setBusy(true);
      setErr("");
      try {
        const me = await api<Me>("/api/umi/login", {
          method: "POST",
          body: JSON.stringify({ phone: p, pin: c }),
        });
        onLogin(me);
      } catch (e) {
        setErr((e as Error).message);
      } finally {
        setBusy(false);
      }
    },
    [onLogin]
  );

  const demo = [
    { label: "أحمد — ولي أمر", phone: "0551234567", avatar: "🧑🏻‍💼" },
    { label: "متجر الريان — تاجر", phone: "0556789012", avatar: "🛒" },
    { label: "خالد — حساب فرعي", phone: "0553456789", avatar: "👦🏻" },
    { label: "سارة — مستخدمة", phone: "0552345678", avatar: "👩🏻" },
  ];

  return (
    <div className="h-full flex flex-col bg-umi-bg px-6 pt-8 pb-6 overflow-y-auto no-scrollbar">
      <StatusBar />
      <div className="text-center mt-6 mb-7">
        <div
          className="w-16 h-16 mx-auto rounded-3xl grid place-items-center font-cairo font-black text-3xl text-[#0a0416] umi-glow"
          style={{ background: "linear-gradient(135deg,#f5dfa0,#e8c766 55%,#c99b3f)" }}
        >
          U
        </div>
        <h1 className="font-cairo font-black text-2xl gold-text mt-3">UMI PAY</h1>
        <p className="text-[11px] font-tajawal text-umi-muted mt-1">محفظتك وبوابة الدفع — كل عميلة تُحفظ في قاعدة البيانات</p>
      </div>

      <label className="text-[11px] font-tajawal font-bold text-umi-muted mb-1 block">رقم الجوال</label>
      <input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        inputMode="tel"
        dir="ltr"
        placeholder="05xxxxxxxx"
        className="w-full h-11 rounded-xl umi-card bg-transparent px-4 text-left font-cairo text-sm text-umi-cream placeholder:text-umi-muted/50 outline-none focus:border-umi-gold/40 mb-3"
      />
      <label className="text-[11px] font-tajawal font-bold text-umi-muted mb-1 block">الرمز السري</label>
      <input
        value={pin}
        onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
        inputMode="numeric"
        type="password"
        dir="ltr"
        placeholder="••••"
        className="w-full h-11 rounded-xl umi-card bg-transparent px-4 text-left font-cairo text-sm tracking-[0.4em] text-umi-cream placeholder:text-umi-muted/50 outline-none focus:border-umi-gold/40 mb-3"
      />
      {err && <p className="text-[11px] font-tajawal text-umi-red mb-2 text-center">{err}</p>}
      <button
        type="button"
        disabled={busy || !phone || pin.length < 4}
        onClick={() => doLogin(phone, pin)}
        className="w-full h-11 rounded-xl font-cairo font-extrabold text-sm text-[#0a0416] disabled:opacity-40 active:scale-[0.98] transition-all"
        style={{ background: "linear-gradient(135deg,#f5dfa0,#e8c766 55%,#c99b3f)" }}
      >
        {busy ? "جارٍ التحقق…" : "تسجيل الدخول"}
      </button>

      <div className="flex items-center gap-3 my-5">
        <span className="flex-1 h-px bg-white/10" />
        <span className="text-[10px] font-tajawal text-umi-muted">حسابات تجريبية — الرمز 1234</span>
        <span className="flex-1 h-px bg-white/10" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {demo.map((d) => (
          <button
            key={d.phone}
            type="button"
            disabled={busy}
            onClick={() => doLogin(d.phone, "1234")}
            className="umi-card rounded-xl px-2.5 py-2.5 text-right active:bg-white/10 transition-colors"
          >
            <span className="text-lg block mb-0.5">{d.avatar}</span>
            <span className="block text-[11px] font-tajawal font-bold text-umi-cream leading-tight">{d.label}</span>
            <span className="block text-[9px] font-tajawal text-umi-muted" dir="ltr">{d.phone}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ============ الشاشة الرئيسية (المحفظة) ============ */
export function HomeScreen({
  data,
  hidden,
  onToggleHidden,
  onQuick,
  onOpenHistory,
  onOpenProfile,
}: {
  data: HomeData;
  hidden: boolean;
  onToggleHidden: () => void;
  onQuick: (a: "send" | "topup" | "qr" | "stores") => void;
  onOpenHistory: () => void;
  onOpenProfile: () => void;
}) {
  const { me, weekIn, weekOut, txs } = data;
  const isMerchant = me.role === "merchant";
  const actions = [
    { key: "send" as const, label: "تحويل", icon: <ArrowUpRight className="w-5 h-5" strokeWidth={1.9} /> },
    { key: "topup" as const, label: "شحن", icon: <ArrowDownLeft className="w-5 h-5" strokeWidth={1.9} /> },
    { key: "qr" as const, label: "QR", icon: <QrCode className="w-5 h-5" strokeWidth={1.9} /> },
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
            {isMerchant ? "أهلاً بك في" : "مساء الخير،"}
          </p>
          <p className="font-cairo font-bold text-[15px] text-umi-cream truncate">{me.name}</p>
        </div>
        <button
          type="button"
          aria-label="التنبيهات"
          className="w-9 h-9 rounded-full bg-white/5 border border-white/10 grid place-items-center text-umi-muted"
        >
          <Bell className="w-4 h-4" strokeWidth={1.8} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto umi-scroll pb-24">
        {/* بطاقة الرصيد */}
        <section className="mx-4 rounded-3xl p-5 relative overflow-hidden umi-card" aria-label="رصيد المحفظة">
          <div
            className="absolute -top-14 -left-14 w-40 h-40 rounded-full blur-3xl opacity-25"
            style={{ background: "radial-gradient(circle,#7b5bc7,transparent 70%)" }}
          />
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-tajawal text-umi-muted">
              {isMerchant ? "رصيد المتجر" : "الرصيد المتاح"}
            </span>
            <button type="button" onClick={onToggleHidden} aria-label="إظهار/إخفاء الرصيد" className="text-umi-muted">
              {hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="font-cairo font-black text-[34px] leading-none gold-text" dir="ltr">
            {hidden ? "••••" : fmt(me.balance)}
            <span className="text-sm text-umi-muted mr-2">ر.س</span>
          </p>
          <div className="flex gap-2 mt-4">
            <span className="flex-1 rounded-xl bg-white/5 border border-white/10 px-3 py-2">
              <span className="flex items-center gap-1 text-[9px] font-tajawal text-umi-muted mb-0.5">
                <ArrowDownLeft className="w-3 h-3 text-umi-gold" /> وارد (7 أيام)
              </span>
              <span className="font-cairo font-bold text-[13px] text-umi-gold" dir="ltr">{fmt(weekIn)}</span>
            </span>
            <span className="flex-1 rounded-xl bg-white/5 border border-white/10 px-3 py-2">
              <span className="flex items-center gap-1 text-[9px] font-tajawal text-umi-muted mb-0.5">
                <ArrowUpRight className="w-3 h-3 text-umi-purplight" /> صادر (7 أيام)
              </span>
              <span className="font-cairo font-bold text-[13px] text-umi-cream" dir="ltr">{fmt(weekOut)}</span>
            </span>
          </div>
        </section>

        {/* الإجراءات السريعة */}
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

        {/* آخر العمليات */}
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
      <ScreenHeader title="سجل المعاملات" subtitle="محفوظ في قاعدة البيانات" onBack={onBack} />
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
        const core = r >= 2 && r <= 4 && c >= 2 && c <= 4;
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

/* ============ الملف الشخصي ============ */
export function ProfileScreen({ me, onLogout, onClose }: { me: Me; onLogout: () => void; onClose: () => void }) {
  const roleLabel = me.role === "merchant" ? "حساب تاجر" : me.role === "child" ? "حساب فرعي" : "حساب شخصي";
  return (
    <div className="absolute inset-0 z-40 bg-umi-bg flex flex-col">
      <ScreenHeader title="حسابي" onBack={onClose} />
      <div className="flex-1 overflow-y-auto umi-scroll px-5 pb-8">
        <div className="text-center mt-2 mb-6">
          <div className="w-20 h-20 mx-auto rounded-3xl grid place-items-center text-4xl bg-white/5 border border-white/10">{me.avatar}</div>
          <h3 className="font-cairo font-extrabold text-lg text-umi-cream mt-3">{me.name}</h3>
          <p className="text-[11px] font-tajawal text-umi-muted" dir="ltr">{me.phone}</p>
          <span className="inline-block mt-2 px-3 py-1 rounded-full text-[10px] font-tajawal font-bold text-[#0a0416]" style={{ background: "linear-gradient(135deg,#f5dfa0,#e8c766)" }}>
            {roleLabel}
          </span>
        </div>

        <div className="rounded-2xl p-4 umi-card mb-3 flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl grid place-items-center text-umi-gold bg-white/5"><Smartphone className="w-5 h-5" /></span>
          <div className="flex-1">
            <p className="text-[12px] font-tajawal font-bold text-umi-cream">المحفظة الرئيسية</p>
            <p className="text-[10px] font-tajawal text-umi-muted">أومي باي · ر.س</p>
          </div>
          <p className="font-cairo font-bold text-umi-gold text-sm" dir="ltr">{fmt(me.balance)}</p>
        </div>

        <div className="rounded-2xl p-4 umi-card mb-6">
          <p className="flex items-center gap-1.5 text-[11px] font-tajawal text-umi-teal mb-1">
            <ShieldCheck className="w-4 h-4" /> جلسة موثوقة
          </p>
          <p className="text-[10px] font-tajawal text-umi-muted leading-relaxed">
            هذا نموذج حي: الأرصدة والمعاملات تُقرأ وتُكتب فعلياً في قاعدة بيانات SQLite عبر Prisma، مع تحقق الرمز السري وحدود الإنفاق للأبناء.
          </p>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="w-full h-11 rounded-xl umi-card flex items-center justify-center gap-2 text-umi-red font-tajawal font-bold text-[13px] active:bg-white/5"
        >
          <LogOut className="w-4 h-4" /> تسجيل الخروج
        </button>
        <p className="text-center text-[9px] font-tajawal text-umi-muted/60 mt-4">UMI PAY · نسخة تجريبية حية v1.0</p>
      </div>
    </div>
  );
}
