"use client";

// UMI PAY — لوحة أدمن المحفظة
// نظرة عامة / تسعير الصرف (دولار + نقاط + مزامنة من مصدر موثوق) / منح نقاط أومي / مراقبة القروض
import { useCallback, useEffect, useState } from "react";
import {
  LogOut, Users, Store, ArrowLeftRight, Coins, RefreshCw, Check, X,
  HandCoins, Landmark, Globe, Save, Clock, Wallet, Info,
  PiggyBank, Percent, Hourglass, Plus, TrendingUp,
} from "lucide-react";
import { StatusBar } from "@/components/umi/shell";
import { CoinIcon } from "@/components/umi/real/screens-main";
import { api } from "@/lib/umi-client";
import { useRates } from "@/lib/rates";
import { fmtSyp, fmtUsd, sypToUsd, fmtPoints, pointsToSyp, SYP_UNIT } from "@/lib/currency";
import { relTime, type Me } from "@/lib/umi-types";
import type { LoanItem } from "@/lib/umi-types";

interface AdminData {
  admin: { name: string; avatar: string };
  settings: { usdSyp: number; pointSyp: number; loanMonthlyRate: number; cardFeeRate: number; updatedAt: string };
  stats: { users: number; merchants: number; txs: number; volume: number; balances: number; pointsTotal: number };
  pointsHolders: { name: string; phone: string; avatar: string; points: number }[];
  loans: {
    pending: LoanItem[];
    unpaid: LoanItem[];
    unpaidCount: number;
    unpaidTotal: number;
  };
  fund: {
    total: number;
    month: number;
    byKind: { loan_fee: number; card_fee: number; manual: number };
    dueCount: number;
    dueTotal: number;
  };
}

type Tab = "overview" | "pricing" | "points" | "loans" | "fund";

export function AdminScreen({ me, onLogout, onOpenAbout }: { me: Me; onLogout: () => void; onOpenAbout?: () => void }) {
  const [tab, setTab] = useState<Tab>("overview");
  const [data, setData] = useState<AdminData | null>(null);

  const load = useCallback(() => {
    api<AdminData>(`/api/umi/admin?userId=${me.id}`)
      .then(setData)
      .catch(() => {});
  }, [me.id]);
  useEffect(load, [load]);

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "overview", label: "نظرة عامة", icon: <Users className="w-4 h-4" /> },
    { key: "pricing", label: "تسعير الصرف", icon: <Globe className="w-4 h-4" /> },
    { key: "points", label: "نقاط أومي", icon: <Coins className="w-4 h-4" /> },
    { key: "loans", label: "القروض", icon: <Landmark className="w-4 h-4" /> },
    { key: "fund", label: "صندوق الأرباح", icon: <PiggyBank className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-umi-bg">
      <StatusBar />
      <header className="flex items-center gap-3 px-5 pt-2 pb-3">
        <span className="w-11 h-11 rounded-2xl bg-white/5 border border-umi-gold/30 grid place-items-center text-xl">{me.avatar}</span>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-tajawal text-umi-muted">لوحة أدمن المحفظة</p>
          <p className="font-cairo font-bold text-[15px] text-umi-cream truncate">{me.name}</p>
        </div>
        {onOpenAbout && (
          <button
            type="button"
            onClick={onOpenAbout}
            aria-label="من نحن"
            className="w-9 h-9 rounded-full bg-white/5 border border-white/10 grid place-items-center text-umi-gold"
          >
            <Info className="w-4 h-4" />
          </button>
        )}
        <button
          type="button"
          onClick={onLogout}
          aria-label="خروج"
          className="w-9 h-9 rounded-full bg-white/5 border border-white/10 grid place-items-center text-umi-red"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </header>

      <div className="flex gap-1.5 px-4 pb-2.5 overflow-x-auto no-scrollbar">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`h-8 px-3 rounded-full text-[10.5px] font-tajawal font-bold whitespace-nowrap flex items-center gap-1 transition-colors ${
              tab === t.key ? "text-[#0a0416]" : "text-umi-muted umi-card"
            }`}
            style={tab === t.key ? { background: "linear-gradient(135deg,#f5dfa0,#e8c766)" } : undefined}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto umi-scroll pb-6">
        {tab === "overview" && <OverviewTab data={data} />}
        {tab === "pricing" && <PricingTab me={me} data={data} reload={load} />}
        {tab === "points" && <PointsTab me={me} data={data} reload={load} />}
        {tab === "loans" && <LoansTab me={me} data={data} reload={load} />}
        {tab === "fund" && <FundTab me={me} reload={load} />}
      </div>
    </div>
  );
}

/* ==== نظرة عامة ==== */
function OverviewTab({ data }: { data: AdminData | null }) {
  const { rates } = useRates();
  if (!data) return <p className="text-center text-umi-muted text-[11px] font-tajawal pt-10 animate-pulse">جارٍ التحميل…</p>;
  const cards = [
    { label: "المستخدمون", value: String(data.stats.users), icon: <Users className="w-4 h-4" />, color: "#e8c766" },
    { label: "المتاجر", value: String(data.stats.merchants), icon: <Store className="w-4 h-4" />, color: "#b8a4e8" },
    { label: "المعاملات", value: String(data.stats.txs), icon: <ArrowLeftRight className="w-4 h-4" />, color: "#6fb5a3" },
    { label: "نقاط أومي المتداولة", value: fmtPoints(data.stats.pointsTotal), icon: <Coins className="w-4 h-4" />, color: "#e8c766" },
    { label: "صندوق أرباح المحفظة", value: fmtSyp(data.fund.total), icon: <PiggyBank className="w-4 h-4" />, color: "#6fb5a3" },
    { label: "رسوم شهرية مستحقة", value: fmtSyp(data.fund.dueTotal), icon: <Hourglass className="w-4 h-4" />, color: data.fund.dueCount > 0 ? "#c87b7b" : "#b8a4e8" },
  ];
  return (
    <div className="px-4 space-y-2.5">
      <div className="grid grid-cols-2 gap-2.5">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl umi-card p-3.5">
            <span className="w-8 h-8 rounded-xl grid place-items-center mb-2" style={{ background: `${c.color}18`, color: c.color }}>
              {c.icon}
            </span>
            <p className="font-cairo font-black text-xl text-umi-cream" dir="ltr">{c.value}</p>
            <p className="text-[9.5px] font-tajawal text-umi-muted">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl umi-card p-4">
        <p className="text-[10px] font-tajawal text-umi-muted mb-1">إجمالي أرصدة المحافظ</p>
        <p className="font-cairo font-black text-[22px] gold-text" dir="ltr">
          {fmtSyp(data.stats.balances)} <span className="text-[11px] font-tajawal text-umi-muted">{SYP_UNIT}</span>
        </p>
        <p className="text-[10px] font-tajawal text-umi-teal" dir="ltr">≈ {fmtUsd(sypToUsd(data.stats.balances, rates.usdSyp))}</p>
        <div className="umi-shimmer-line my-3" />
        <p className="text-[10px] font-tajawal text-umi-muted mb-1">حجم التداول الكلي</p>
        <p className="font-cairo font-bold text-[16px] text-umi-cream" dir="ltr">
          {fmtSyp(data.stats.volume)} <span className="text-[10px] font-tajawal text-umi-muted">{SYP_UNIT}</span>
        </p>
        <p className="text-[9.5px] font-tajawal text-umi-muted mt-1">
          آخر تحديث للتسعير: {relTime(data.settings.updatedAt)}
        </p>
      </div>

      {(data.loans.unpaidCount > 0 || data.loans.pending.length > 0) && (
        <div className="rounded-2xl p-4" style={{ border: "1px solid rgba(200,123,123,0.35)", background: "rgba(200,123,123,0.07)" }}>
          <p className="flex items-center gap-1.5 text-[11px] font-tajawal font-bold text-umi-red mb-1">
            <HandCoins className="w-4 h-4" /> تنبيه القروض
          </p>
          <p className="text-[10.5px] font-tajawal text-umi-cream leading-relaxed">
            {data.loans.pending.length > 0 && `${data.loans.pending.length} طلب بانتظار الموافقة · `}
            {data.loans.unpaidCount} قرض غير مسدد — المتبقي {fmtSyp(data.loans.unpaidTotal)} {SYP_UNIT}
          </p>
        </div>
      )}
    </div>
  );
}

/* ==== تسعير الصرف ==== */
function PricingTab({ me, data, reload }: { me: Me; data: AdminData | null; reload: () => void }) {
  const { rates } = useRates();
  const [usd, setUsd] = useState("");
  const [point, setPoint] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncData, setSyncData] = useState<{ fetched: number; current: number; source: string; sourceTime: string | null } | null>(null);

  useEffect(() => {
    if (data) { setUsd(String(Math.round(data.settings.usdSyp))); setPoint(String(Math.round(data.settings.pointSyp))); }
  }, [data]);

  const save = async () => {
    setBusy(true); setErr(""); setMsg("");
    try {
      await api("/api/umi/admin", {
        method: "PUT",
        body: JSON.stringify({ userId: me.id, usdSyp: Number(usd), pointSyp: Number(point) }),
      });
      setMsg("تم حفظ التسعير ✓");
      reload();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const fetchFromSource = async () => {
    setSyncing(true); setErr(""); setMsg(""); setSyncData(null);
    try {
      const r = await api<{ fetched: number; current: number; source: string; sourceTime: string | null }>("/api/umi/admin/sync-rate", {
        method: "POST",
        body: JSON.stringify({ adminId: me.id }),
      });
      setSyncData(r);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSyncing(false);
    }
  };

  const applyFetched = async (rate: number) => {
    setSyncing(true); setErr(""); setMsg("");
    try {
      await api("/api/umi/admin/sync-rate", {
        method: "POST",
        body: JSON.stringify({ adminId: me.id, apply: true, rate }),
      });
      setUsd(String(rate));
      setMsg(`تم تطبيق السعر المجلوب: $1 = ${fmtSyp(rate)} ${SYP_UNIT} ✓`);
      setSyncData(null);
      reload();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSyncing(false);
    }
  };

  const usdPresets = [11000, 12500, 13000, 15000];
  const pointPresets = [5, 10, 25, 50];

  return (
    <div className="px-4 space-y-3">
      {/* سعر الدولار */}
      <div className="rounded-2xl umi-card p-4">
        <p className="flex items-center gap-1.5 text-[12px] font-cairo font-bold text-umi-cream mb-1">
          <Globe className="w-4 h-4 text-umi-gold" /> سعر الدولار مقابل الليرة
        </p>
        <p className="text-[10px] font-tajawal text-umi-muted mb-3 leading-relaxed">
          يُستخدم لحساب مكافئ الدولار "≈ $" تحت كل رصيد — يمكنك الإدخال اليدوي أو المزامنة من مصدر موثوق
        </p>

        <button
          type="button"
          onClick={fetchFromSource}
          disabled={syncing}
          className="w-full h-11 rounded-xl font-cairo font-extrabold text-[12.5px] text-umi-cream flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50"
          style={{ background: "linear-gradient(135deg,#3a2a5e,#2a1c48)", border: "1px solid rgba(232,199,102,0.35)" }}
        >
          <RefreshCw className={`w-4 h-4 text-umi-gold ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "جارٍ الجلب من المصدر الموثوق…" : "جلب سعر الصرف من مصدر موثوق"}
        </button>

        {/* مقارنة السعر المجلوب بالحالي — التطبيق بقرار الأدمن */}
        {syncData && (
          <div className="mt-3 rounded-xl p-3" style={{ border: "1px solid rgba(111,181,163,0.35)", background: "rgba(111,181,163,0.07)" }}>
            <p className="text-[10.5px] font-tajawal text-umi-teal font-bold mb-1">
              المصدر: {syncData.source} {syncData.sourceTime ? `· آخر تحديث: ${syncData.sourceTime.slice(5, 16)}` : ""}
            </p>
            <div className="flex items-center justify-between text-[11px] font-tajawal text-umi-cream" dir="ltr">
              <span>المجلوب: <b className="text-umi-gold">${syncData.fetched.toLocaleString("en-US")}</b></span>
              <span>الحالي: {syncData.current.toLocaleString("en-US")}</span>
            </div>
            {syncData.fetched !== Math.round(syncData.current) && (
              <p className="text-[9.5px] font-tajawal text-umi-muted mt-1.5 leading-relaxed">
                تنبيه: المصدر يعطي السعر الرسمي وقد يختلف كثيراً عن سعر السوق لديك — طبّقه فقط إذا كان مناسباً
              </p>
            )}
            <div className="flex gap-2 mt-2.5">
              <button
                type="button"
                onClick={() => applyFetched(syncData.fetched)}
                className="flex-1 h-9 rounded-lg font-tajawal font-bold text-[11px] text-[#0a0416]"
                style={{ background: "linear-gradient(135deg,#f5dfa0,#e8c766)" }}
              >
                تطبيق السعر المجلوب
              </button>
              <button
                type="button"
                onClick={() => setSyncData(null)}
                className="flex-1 h-9 rounded-lg font-tajawal font-bold text-[11px] text-umi-muted umi-card"
              >
                إبقاء السعر الحالي
              </button>
            </div>
          </div>
        )}

        <div className="umi-shimmer-line my-3.5" />

        <div className="flex gap-2 mb-2">
          {usdPresets.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setUsd(String(p))}
              className="flex-1 h-8 rounded-lg umi-card text-[10px] font-tajawal font-bold text-umi-cream active:bg-white/10"
              dir="ltr"
            >
              {p.toLocaleString("en-US")}
            </button>
          ))}
        </div>
        <label className="text-[10.5px] font-tajawal font-bold text-umi-muted block mb-1">إدخال يدوي — $1 = ؟ ل.س</label>
        <input
          value={usd}
          onChange={(e) => setUsd(e.target.value.replace(/\D/g, "").slice(0, 8))}
          inputMode="numeric"
          dir="ltr"
          className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-center font-cairo font-bold text-umi-cream outline-none focus:border-umi-gold/40"
        />
        <p className="text-[9.5px] font-tajawal text-umi-muted mt-2 text-center" dir="ltr">
          100,000 {SYP_UNIT} ≈ {fmtUsd(sypToUsd(100000, Number(usd) || rates.usdSyp))}
        </p>
      </div>

      {/* قيمة نقطة أومي */}
      <div className="rounded-2xl umi-card p-4">
        <p className="flex items-center gap-1.5 text-[12px] font-cairo font-bold text-umi-cream mb-1">
          <Coins className="w-4 h-4 text-umi-gold" /> قيمة نقطة أومي
        </p>
        <p className="text-[10px] font-tajawal text-umi-muted mb-3 leading-relaxed">
          النقاط محفظة مكافآت تُمنح من الإدارة فقط — لا بيع ولا شراء. القيمة هنا للعرض وحساب المكافئ بالليرة
        </p>
        <div className="flex gap-2 mb-2">
          {pointPresets.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPoint(String(p))}
              className="flex-1 h-8 rounded-lg umi-card text-[10px] font-tajawal font-bold text-umi-cream active:bg-white/10"
              dir="ltr"
            >
              {p}
            </button>
          ))}
        </div>
        <label className="text-[10.5px] font-tajawal font-bold text-umi-muted block mb-1">قيمة النقطة الواحدة — ل.س</label>
        <input
          value={point}
          onChange={(e) => setPoint(e.target.value.replace(/\D/g, "").slice(0, 7))}
          inputMode="numeric"
          dir="ltr"
          className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-center font-cairo font-bold text-umi-cream outline-none focus:border-umi-gold/40"
        />
        <p className="text-[9.5px] font-tajawal text-umi-muted mt-2 text-center">
          100 نقطة ≈ {fmtSyp(pointsToSyp(100, Number(point) || rates.pointSyp))} {SYP_UNIT}
        </p>
      </div>

      {err && <p className="text-[11px] font-tajawal text-umi-red text-center">{err}</p>}
      {msg && <p className="text-[11px] font-tajawal text-umi-teal text-center">{msg}</p>}
      <button
        type="button"
        disabled={busy}
        onClick={save}
        className="w-full h-11 rounded-xl font-cairo font-extrabold text-sm text-[#0a0416] disabled:opacity-40 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        style={{ background: "linear-gradient(135deg,#f5dfa0,#e8c766 55%,#c99b3f)" }}
      >
        <Save className="w-4 h-4" /> {busy ? "جارٍ الحفظ…" : "حفظ التسعير"}
      </button>
    </div>
  );
}

/* ==== نقاط أومي ==== */
function PointsTab({ me, data, reload }: { me: Me; data: AdminData | null; reload: () => void }) {
  const { rates } = useRates();
  const [phone, setPhone] = useState("");
  const [points, setPoints] = useState("");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const grant = async () => {
    setBusy(true); setErr(""); setMsg("");
    try {
      const r = await api<{ granted: number; userName: string; totalPoints: number }>("/api/umi/admin/points", {
        method: "POST",
        body: JSON.stringify({ adminId: me.id, phone: phone.trim(), points: Number(points), note }),
      });
      setMsg(`منحت ${fmtPoints(r.granted)} نقطة لـ ${r.userName} — رصيده الآن ${fmtPoints(r.totalPoints)} نقطة ✓`);
      setPhone(""); setPoints(""); setNote("");
      reload();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="px-4 space-y-3">
      <div className="rounded-2xl umi-card p-4">
        <p className="flex items-center gap-1.5 text-[12px] font-cairo font-bold text-umi-cream mb-1">
          <CoinIcon className="w-4.5 h-4.5" /> منح نقاط أومي
        </p>
        <p className="text-[10px] font-tajawal text-umi-muted mb-3 leading-relaxed">
          النقاط تُمنح مجاناً من الإدارة كمكافآت — لا يمكن شراؤها أو بيعها من داخل المحفظة
        </p>
        <label className="text-[10.5px] font-tajawal font-bold text-umi-muted block mb-1">رقم جوال المستخدم</label>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, ""))}
          inputMode="tel"
          dir="ltr"
          placeholder="7782416"
          className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-left font-cairo text-[13px] text-umi-cream placeholder:text-umi-muted/50 outline-none focus:border-umi-gold/40 mb-2.5"
        />
        <div className="flex gap-2 mb-2.5">
          {[50, 100, 250, 1000].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPoints(String(p))}
              className="flex-1 h-8 rounded-lg umi-card text-[10px] font-tajawal font-bold text-umi-gold active:bg-white/10"
              dir="ltr"
            >
              +{p}
            </button>
          ))}
        </div>
        <label className="text-[10.5px] font-tajawal font-bold text-umi-muted block mb-1">عدد النقاط</label>
        <input
          value={points}
          onChange={(e) => setPoints(e.target.value.replace(/\D/g, "").slice(0, 7))}
          inputMode="numeric"
          dir="ltr"
          placeholder="0"
          className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-center font-cairo font-bold text-umi-cream placeholder:text-umi-muted/50 outline-none focus:border-umi-gold/40 mb-2.5"
        />
        <label className="text-[10.5px] font-tajawal font-bold text-umi-muted block mb-1">سبب المنح (اختياري)</label>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="مثال: مكافأة ولاء"
          className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 font-cairo text-[12px] text-umi-cream placeholder:text-umi-muted/50 outline-none focus:border-umi-gold/40"
        />
        {err && <p className="text-[11px] font-tajawal text-umi-red mt-2 text-center">{err}</p>}
        {msg && <p className="text-[11px] font-tajawal text-umi-teal mt-2 text-center">{msg}</p>}
        <button
          type="button"
          disabled={busy || !phone || !Number(points)}
          onClick={grant}
          className="w-full h-11 mt-3 rounded-xl font-cairo font-extrabold text-sm text-[#0a0416] disabled:opacity-40 active:scale-[0.98] transition-all"
          style={{ background: "linear-gradient(135deg,#f5dfa0,#e8c766 55%,#c99b3f)" }}
        >
          {busy ? "جارٍ المنح…" : "منح النقاط"}
        </button>
      </div>

      {/* حاملو النقاط */}
      <div className="rounded-2xl umi-card p-4">
        <p className="flex items-center gap-1.5 text-[12px] font-cairo font-bold text-umi-cream mb-2.5">
          <Coins className="w-4 h-4 text-umi-gold" /> حاملو النقاط
          {data && <span className="text-[9.5px] font-tajawal text-umi-muted">({fmtPoints(data.stats.pointsTotal)} نقطة متداولة)</span>}
        </p>
        {data?.pointsHolders.length === 0 && <p className="text-[10px] font-tajawal text-umi-muted text-center py-3">لا يوجد حاملو نقاط بعد</p>}
        {data?.pointsHolders.map((h) => (
          <div key={h.phone} className="flex items-center gap-2.5 py-2 border-b border-white/5 last:border-0">
            <span className="w-8 h-8 rounded-xl bg-white/5 grid place-items-center text-sm">{h.avatar}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-tajawal font-bold text-umi-cream truncate">{h.name}</p>
              <p className="text-[9px] font-tajawal text-umi-muted" dir="ltr">{h.phone}</p>
            </div>
            <div className="text-left shrink-0">
              <p className="font-cairo font-bold text-[13px] gold-text" dir="ltr">{fmtPoints(h.points)}</p>
              <p className="text-[8.5px] font-tajawal text-umi-muted" dir="ltr">≈ {fmtSyp(pointsToSyp(h.points, rates.pointSyp))} {SYP_UNIT}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ==== مراقبة القروض ==== */
function LoansTab({ me, data, reload }: { me: Me; data: AdminData | null; reload: () => void }) {
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loanRate, setLoanRate] = useState("");
  const [cardRate, setCardRate] = useState("");
  const [savingRates, setSavingRates] = useState(false);
  const [accruing, setAccruing] = useState(false);

  useEffect(() => {
    if (data) {
      setLoanRate(String(data.settings.loanMonthlyRate));
      setCardRate(String(data.settings.cardFeeRate));
    }
  }, [data]);

  const saveRates = async () => {
    setSavingRates(true); setMsg(""); setErr("");
    try {
      await api("/api/umi/admin", {
        method: "PUT",
        body: JSON.stringify({ userId: me.id, loanMonthlyRate: Number(loanRate), cardFeeRate: Number(cardRate) }),
      });
      setMsg("حُفظت نسب التطبيق ✓");
      reload();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSavingRates(false);
    }
  };

  const accrue = async () => {
    setAccruing(true); setMsg(""); setErr("");
    try {
      const r = await api<{ applied: number; message: string }>("/api/umi/fund", {
        method: "POST",
        body: JSON.stringify({ userId: me.id, action: "accrue" }),
      });
      setMsg(r.message);
      reload();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setAccruing(false);
    }
  };

  const decide = async (id: string, action: "approve" | "reject") => {
    setBusyId(id);
    setMsg(""); setErr("");
    try {
      await api("/api/umi/loans", {
        method: "PATCH",
        body: JSON.stringify({ id, action, adminId: me.id }),
      });
      setMsg(action === "approve" ? "تم قبول الطلب وشحن الرصيد ✓" : "تم رفض الطلب");
      reload();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  if (!data) return <p className="text-center text-umi-muted text-[11px] font-tajawal pt-10 animate-pulse">جارٍ التحميل…</p>;

  return (
    <div className="px-4 space-y-3">
      {err && <p className="text-[11px] font-tajawal text-umi-red text-center">{err}</p>}
      {msg && <p className="text-[11px] font-tajawal text-umi-teal text-center">{msg}</p>}

      {/* نسب التطبيق على القروض والبطاقات */}
      <div className="rounded-2xl umi-card p-4">
        <p className="flex items-center gap-1.5 text-[12px] font-cairo font-bold text-umi-cream mb-1">
          <Percent className="w-4 h-4 text-umi-gold" /> نسب التطبيق
        </p>
        <p className="text-[10px] font-tajawal text-umi-muted mb-3 leading-relaxed">
          رسوم شهرية على المتبقي من كل قرض معتمد (كل دورة 30 يوماً) تدخل صندوق أرباح المحفظة وتُضاف إلى متبقي المقترض
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="text-[9.5px] font-tajawal font-bold text-umi-muted block mb-1">رسوم القروض — شهرياً %</label>
            <input
              value={loanRate}
              onChange={(e) => setLoanRate(e.target.value.replace(/[^\d.]/g, "").slice(0, 5))}
              inputMode="decimal"
              dir="ltr"
              className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-center font-cairo font-bold text-umi-cream outline-none focus:border-umi-gold/40"
            />
          </div>
          <div>
            <label className="text-[9.5px] font-tajawal font-bold text-umi-muted block mb-1">استعمال بطاقة الاعتماد %</label>
            <input
              value={cardRate}
              onChange={(e) => setCardRate(e.target.value.replace(/[^\d.]/g, "").slice(0, 5))}
              inputMode="decimal"
              dir="ltr"
              className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-center font-cairo font-bold text-umi-cream outline-none focus:border-umi-gold/40"
            />
          </div>
        </div>
        <button
          type="button"
          disabled={savingRates}
          onClick={saveRates}
          className="w-full h-10 mt-3 rounded-xl font-cairo font-extrabold text-[12px] text-[#0a0416] disabled:opacity-40 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
          style={{ background: "linear-gradient(135deg,#f5dfa0,#e8c766 55%,#c99b3f)" }}
        >
          <Save className="w-3.5 h-3.5" /> {savingRates ? "جارٍ الحفظ…" : "حفظ النسب"}
        </button>
      </div>

      {/* الرسوم الشهرية المستحقة الآن */}
      <div className="rounded-2xl p-4" style={{ border: "1px solid rgba(232,199,102,0.35)", background: "rgba(232,199,102,0.06)" }}>
        <p className="flex items-center gap-1.5 text-[11.5px] font-cairo font-bold text-umi-cream mb-1">
          <Hourglass className="w-4 h-4 text-umi-gold" /> الرسوم الشهرية المستحقة
        </p>
        {data.fund.dueCount > 0 ? (
          <p className="text-[10.5px] font-tajawal text-umi-cream leading-relaxed mb-2">
            مستحقة على <b className="text-umi-gold">{data.fund.dueCount}</b> {data.fund.dueCount === 1 ? "قرض" : "قروض"} غير مسددة — الإجمالي{" "}
            <b className="gold-text" dir="ltr">{fmtSyp(data.fund.dueTotal)} {SYP_UNIT}</b>
          </p>
        ) : (
          <p className="text-[10px] font-tajawal text-umi-muted leading-relaxed mb-2">
            لا رسوم مستحقة الآن — تُحتسب كل دورة 30 يوماً منذ آخر احتساب
          </p>
        )}
        <button
          type="button"
          disabled={accruing || data.fund.dueCount === 0}
          onClick={accrue}
          className="w-full h-10 rounded-xl font-tajawal font-bold text-[11.5px] text-umi-cream disabled:opacity-40 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
          style={{ background: "linear-gradient(135deg,#3a2a5e,#2a1c48)", border: "1px solid rgba(232,199,102,0.35)" }}
        >
          <PiggyBank className="w-4 h-4 text-umi-gold" />
          {accruing ? "جارٍ الاحتساب…" : "احتساب الرسوم وإضافتها للصندوق"}
        </button>
      </div>

      {/* طلبات بانتظار الموافقة */}
      <div>
        <p className="flex items-center gap-1.5 text-[12px] font-cairo font-bold text-umi-cream mb-2">
          <Clock className="w-4 h-4 text-umi-gold" /> طلبات بانتظار الموافقة ({data.loans.pending.length})
        </p>
        {data.loans.pending.length === 0 && (
          <p className="text-[10px] font-tajawal text-umi-muted umi-card rounded-xl p-3 text-center">لا توجد طلبات جديدة</p>
        )}
        <div className="space-y-2">
          {data.loans.pending.map((l) => (
            <div key={l.id} className="rounded-2xl umi-card p-3.5">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-white/5 grid place-items-center text-base">{l.userAvatar}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-tajawal font-bold text-umi-cream truncate">{l.userName}</p>
                  <p className="text-[9px] font-tajawal text-umi-muted" dir="ltr">{l.userPhone}</p>
                </div>
                <p className="font-cairo font-black text-[15px] gold-text shrink-0" dir="ltr">
                  {fmtSyp(l.amount)} <span className="text-[8px] font-tajawal text-umi-muted">{SYP_UNIT}</span>
                </p>
              </div>
              {l.note && <p className="text-[9.5px] font-tajawal text-umi-muted mt-1.5">سبب: {l.note}</p>}
              <p className="text-[9px] font-tajawal text-umi-muted mt-0.5">{relTime(l.createdAt)}</p>
              <div className="flex gap-2 mt-2.5">
                <button
                  type="button"
                  disabled={busyId === l.id}
                  onClick={() => decide(l.id, "approve")}
                  className="flex-1 h-9 rounded-xl font-tajawal font-bold text-[11px] text-[#0a0416] flex items-center justify-center gap-1 disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg,#f5dfa0,#e8c766)" }}
                >
                  <Check className="w-3.5 h-3.5" /> قبول وشحن الرصيد
                </button>
                <button
                  type="button"
                  disabled={busyId === l.id}
                  onClick={() => decide(l.id, "reject")}
                  className="flex-1 h-9 rounded-xl font-tajawal font-bold text-[11px] text-umi-red umi-card flex items-center justify-center gap-1 disabled:opacity-40"
                >
                  <X className="w-3.5 h-3.5" /> رفض
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* غير المسددة */}
      <div>
        <p className="flex items-center gap-1.5 text-[12px] font-cairo font-bold text-umi-cream mb-2">
          <Wallet className="w-4 h-4 text-umi-red" /> قروض غير مسددة ({data.loans.unpaidCount})
        </p>
        {data.loans.unpaid.length > 0 && (
          <div className="rounded-2xl p-3.5 mb-2" style={{ border: "1px solid rgba(200,123,123,0.35)", background: "rgba(200,123,123,0.07)" }}>
            <p className="text-[10px] font-tajawal text-umi-muted">إجمالي المتبقي على الجميع</p>
            <p className="font-cairo font-black text-xl text-umi-red" dir="ltr">
              {fmtSyp(data.loans.unpaidTotal)} <span className="text-[10px] font-tajawal text-umi-muted">{SYP_UNIT}</span>
            </p>
          </div>
        )}
        {data.loans.unpaid.length === 0 && (
          <p className="text-[10px] font-tajawal text-umi-muted umi-card rounded-xl p-3 text-center">لا توجد قروض غير مسددة ✓</p>
        )}
        <div className="space-y-2">
          {data.loans.unpaid.map((l) => (
            <div key={l.id} className="rounded-2xl umi-card p-3.5">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-white/5 grid place-items-center text-base">{l.userAvatar}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-tajawal font-bold text-umi-cream truncate">{l.userName}</p>
                  <p className="text-[9px] font-tajawal text-umi-muted" dir="ltr">{l.userPhone}</p>
                </div>
                <div className="text-left shrink-0">
                  <p className="font-cairo font-bold text-[13px] text-umi-red" dir="ltr">
                    {fmtSyp(l.remaining)} <span className="text-[8px] font-tajawal text-umi-muted">متبقي</span>
                  </p>
                  <p className="text-[8.5px] font-tajawal text-umi-muted" dir="ltr">
                    من {fmtSyp(l.amount)} · سُدّد {fmtSyp(l.paidAmount)}
                  </p>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-white/5 mt-2 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.round((l.paidAmount / (l.amount + l.feesAccrued)) * 100))}%`, background: "linear-gradient(90deg,#c99b3f,#f5dfa0)" }} />
              </div>
              {l.feesAccrued > 0 && (
                <p className="text-[9px] font-tajawal mt-1.5" style={{ color: "#e8c766" }}>
                  منها رسوم تطبيق متراكمة: {fmtSyp(l.feesAccrued)} {SYP_UNIT}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ==== صندوق أرباح المحفظة ==== */
interface FundEntryT {
  id: string;
  kind: "loan_fee" | "card_fee" | "manual";
  title: string;
  amount: number;
  createdAt: string;
}

interface FundFull {
  rates: { loanMonthlyRate: number; cardFeeRate: number };
  total: number;
  month: number;
  byKind: { loan_fee: number; card_fee: number; manual: number };
  monthly: { ym: string; label: string; total: number }[];
  entries: FundEntryT[];
  due: { count: number; total: number };
}

function kindView(k: FundEntryT["kind"]) {
  switch (k) {
    case "loan_fee":
      return { label: "رسوم قروض", color: "#e8c766" };
    case "card_fee":
      return { label: "بطاقة اعتماد", color: "#b8a4e8" };
    default:
      return { label: "إدخال يدوي", color: "#6fb5a3" };
  }
}

function FundTab({ me, reload }: { me: Me; reload: () => void }) {
  const { rates } = useRates();
  const [fund, setFund] = useState<FundFull | null>(null);
  const [kind, setKind] = useState<"card_fee" | "manual">("card_fee");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [accruing, setAccruing] = useState(false);

  const load = useCallback(() => {
    api<FundFull>(`/api/umi/fund?userId=${me.id}`)
      .then(setFund)
      .catch(() => {});
  }, [me.id]);
  useEffect(load, [load]);

  const accrue = async () => {
    setAccruing(true); setMsg(""); setErr("");
    try {
      const r = await api<{ message: string }>("/api/umi/fund", {
        method: "POST",
        body: JSON.stringify({ userId: me.id, action: "accrue" }),
      });
      setMsg(r.message);
      load();
      reload();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setAccruing(false);
    }
  };

  const addEntry = async () => {
    setBusy(true); setMsg(""); setErr("");
    try {
      await api("/api/umi/fund", {
        method: "POST",
        body: JSON.stringify({ userId: me.id, action: "entry", kind, title, amount: Number(amount) }),
      });
      setMsg("أُضيف الإدخال إلى الصندوق ✓");
      setTitle(""); setAmount("");
      load();
      reload();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (!fund) return <p className="text-center text-umi-muted text-[11px] font-tajawal pt-10 animate-pulse">جارٍ التحميل…</p>;

  const maxMonth = Math.max(...fund.monthly.map((m) => m.total), 1);
  const kindCards = [
    { label: "رسوم القروض", value: fund.byKind.loan_fee, icon: <Landmark className="w-4 h-4" />, color: "#e8c766" },
    { label: "رسوم بطاقات الاعتماد", value: fund.byKind.card_fee, icon: <Percent className="w-4 h-4" />, color: "#b8a4e8" },
    { label: "إدخالات يدوية", value: fund.byKind.manual, icon: <Plus className="w-4 h-4" />, color: "#6fb5a3" },
  ];

  return (
    <div className="px-4 space-y-3">
      {err && <p className="text-[11px] font-tajawal text-umi-red text-center">{err}</p>}
      {msg && <p className="text-[11px] font-tajawal text-umi-teal text-center">{msg}</p>}

      {/* الإجمالي */}
      <div className="rounded-[22px] umi-hero p-5 relative overflow-hidden">
        <div className="umi-shimmer-line absolute top-0 inset-x-0" />
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-9 h-9 rounded-xl grid place-items-center" style={{ background: "rgba(111,181,163,0.15)", border: "1px solid rgba(111,181,163,0.4)" }}>
            <PiggyBank className="w-5 h-5 text-umi-teal" />
          </span>
          <p className="text-[10.5px] font-tajawal text-umi-cream/70">صندوق أرباح المحفظة</p>
        </div>
        <p className="font-cairo font-black text-[28px] leading-none gold-text" dir="ltr">
          {fmtSyp(fund.total)} <span className="text-xs font-tajawal text-umi-muted">{SYP_UNIT}</span>
        </p>
        <p className="text-[10px] font-tajawal text-umi-teal mt-1" dir="ltr">≈ {fmtUsd(sypToUsd(fund.total, rates.usdSyp))}</p>
        <div className="umi-shimmer-line my-3" />
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-tajawal text-umi-muted">أرباح هذا الشهر</p>
          <p className="font-cairo font-bold text-[13px] text-umi-cream" dir="ltr">{fmtSyp(fund.month)} {SYP_UNIT}</p>
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <p className="text-[10px] font-tajawal text-umi-muted">نسبة القروض الحالية</p>
          <p className="font-cairo font-bold text-[13px] text-umi-gold" dir="ltr">{fund.rates.loanMonthlyRate}% شهرياً</p>
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <p className="text-[10px] font-tajawal text-umi-muted">نسبة بطاقة الاعتماد</p>
          <p className="font-cairo font-bold text-[13px] text-umi-gold" dir="ltr">{fund.rates.cardFeeRate}%</p>
        </div>
      </div>

      {/* الإيرادات حسب النوع */}
      <div className="grid grid-cols-3 gap-2">
        {kindCards.map((c) => (
          <div key={c.label} className="rounded-2xl umi-card p-3 text-center">
            <span className="w-7 h-7 rounded-lg grid place-items-center mx-auto mb-1.5" style={{ background: `${c.color}18`, color: c.color }}>
              {c.icon}
            </span>
            <p className="font-cairo font-bold text-[12px] text-umi-cream" dir="ltr">{fmtSyp(c.value)}</p>
            <p className="text-[8px] font-tajawal text-umi-muted leading-tight mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      {/* الرسوم المستحقة + الاحتساب */}
      <div className="rounded-2xl p-4" style={{ border: "1px solid rgba(232,199,102,0.35)", background: "rgba(232,199,102,0.06)" }}>
        <p className="flex items-center gap-1.5 text-[11.5px] font-cairo font-bold text-umi-cream mb-1">
          <Hourglass className="w-4 h-4 text-umi-gold" /> الرسوم الشهرية المستحقة من القروض
        </p>
        <p className="text-[10px] font-tajawal text-umi-muted leading-relaxed mb-2">
          {fund.due.count > 0
            ? `${fund.due.count > 1 ? `${fund.due.count} قروض` : "قرض واحد"} بلغت دورتها الشهرية — إجمالي ${fmtSyp(fund.due.total)} ${SYP_UNIT} بانتظار الاحتساب`
            : "لا رسوم مستحقة الآن — كل قرض يُحتسب كل 30 يوماً على المتبقي منه"}
        </p>
        <button
          type="button"
          disabled={accruing || fund.due.count === 0}
          onClick={accrue}
          className="w-full h-10 rounded-xl font-tajawal font-bold text-[11.5px] text-umi-cream disabled:opacity-40 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
          style={{ background: "linear-gradient(135deg,#3a2a5e,#2a1c48)", border: "1px solid rgba(232,199,102,0.35)" }}
        >
          <PiggyBank className="w-4 h-4 text-umi-gold" />
          {accruing ? "جارٍ الاحتساب…" : "احتساب الرسوم وإضافتها للصندوق"}
        </button>
      </div>

      {/* تقرير آخر 6 أشهر */}
      <div className="rounded-2xl umi-card p-4">
        <p className="flex items-center gap-1.5 text-[12px] font-cairo font-bold text-umi-cream mb-3">
          <TrendingUp className="w-4 h-4 text-umi-teal" /> تقرير الأرباح — آخر 6 أشهر
        </p>
        <div className="space-y-2.5">
          {[...fund.monthly].reverse().map((m) => (
            <div key={m.ym} className="flex items-center gap-2">
              <span className="w-[92px] shrink-0 text-[9.5px] font-tajawal text-umi-muted">{m.label.trim()}</span>
              <div className="flex-1 h-4 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(4, Math.round((m.total / maxMonth) * 100))}%`,
                    background: m.total > 0 ? "linear-gradient(90deg,#c99b3f,#f5dfa0)" : "transparent",
                  }}
                />
              </div>
              <span className="w-[86px] shrink-0 text-left font-cairo font-bold text-[10.5px] text-umi-cream" dir="ltr">
                {fmtSyp(m.total)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* إدخال يدوي للصندوق */}
      <div className="rounded-2xl umi-card p-4">
        <p className="flex items-center gap-1.5 text-[12px] font-cairo font-bold text-umi-cream mb-1">
          <Plus className="w-4 h-4 text-umi-gold" /> إدخال يدوي إلى الصندوق
        </p>
        <p className="text-[10px] font-tajawal text-umi-muted mb-3 leading-relaxed">
          لتسجيل إيراد محصّل خارج التطبيق — مثل رسوم بطاقات اعتماد محصّلة يدوياً
        </p>
        <div className="flex gap-2 mb-2.5">
          <button
            type="button"
            onClick={() => setKind("card_fee")}
            className={`flex-1 h-9 rounded-xl text-[10px] font-tajawal font-bold transition-colors ${kind === "card_fee" ? "text-[#0a0416]" : "text-umi-cream umi-card"}`}
            style={kind === "card_fee" ? { background: "linear-gradient(135deg,#b8a4e8,#9d84d6)" } : undefined}
          >
            رسوم بطاقة اعتماد
          </button>
          <button
            type="button"
            onClick={() => setKind("manual")}
            className={`flex-1 h-9 rounded-xl text-[10px] font-tajawal font-bold transition-colors ${kind === "manual" ? "text-[#0a0416]" : "text-umi-cream umi-card"}`}
            style={kind === "manual" ? { background: "linear-gradient(135deg,#6fb5a3,#579985)" } : undefined}
          >
            إيراد آخر
          </button>
        </div>
        <label className="text-[10px] font-tajawal font-bold text-umi-muted block mb-1">الوصف (اختياري)</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={kind === "card_fee" ? "رسوم بطاقات — تشرين الأول" : "مثال: عمولة خدمة"}
          className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 font-cairo text-[12px] text-umi-cream placeholder:text-umi-muted/50 outline-none focus:border-umi-gold/40 mb-2.5"
        />
        <label className="text-[10px] font-tajawal font-bold text-umi-muted block mb-1">المبلغ — {SYP_UNIT}</label>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/\D/g, "").slice(0, 10))}
          inputMode="numeric"
          dir="ltr"
          placeholder="0"
          className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-center font-cairo font-bold text-umi-cream placeholder:text-umi-muted/50 outline-none focus:border-umi-gold/40"
        />
        <button
          type="button"
          disabled={busy || !Number(amount)}
          onClick={addEntry}
          className="w-full h-11 mt-3 rounded-xl font-cairo font-extrabold text-sm text-[#0a0416] disabled:opacity-40 active:scale-[0.98] transition-all"
          style={{ background: "linear-gradient(135deg,#f5dfa0,#e8c766 55%,#c99b3f)" }}
        >
          {busy ? "جارٍ الإضافة…" : "إضافة إلى الصندوق"}
        </button>
      </div>

      {/* سجل الإيرادات */}
      <div className="rounded-2xl umi-card p-4">
        <p className="flex items-center gap-1.5 text-[12px] font-cairo font-bold text-umi-cream mb-2.5">
          <PiggyBank className="w-4 h-4 text-umi-teal" /> سجل إيرادات الصندوق
          <span className="text-[9.5px] font-tajawal text-umi-muted">({fund.entries.length} إدخال)</span>
        </p>
        {fund.entries.length === 0 && (
          <p className="text-[10px] font-tajawal text-umi-muted text-center py-3 leading-relaxed">
            الصندوق فارغ بعد — تُقيّد هنا رسوم القروض الشهرية ورسوم البطاقات والإدخالات اليدوية
          </p>
        )}
        {fund.entries.map((e) => {
          const kv = kindView(e.kind);
          return (
            <div key={e.id} className="flex items-center gap-2.5 py-2.5 border-b border-white/5 last:border-0">
              <span
                className="shrink-0 h-6 px-2 rounded-full flex items-center text-[8.5px] font-tajawal font-bold"
                style={{ background: `${kv.color}15`, border: `1px solid ${kv.color}55`, color: kv.color }}
              >
                {kv.label}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[10.5px] font-tajawal text-umi-cream truncate">{e.title}</p>
                <p className="text-[8.5px] font-tajawal text-umi-muted">{relTime(e.createdAt)}</p>
              </div>
              <p className="font-cairo font-bold text-[12.5px] gold-text shrink-0" dir="ltr">
                +{fmtSyp(e.amount)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
