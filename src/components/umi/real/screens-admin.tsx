"use client";

// UMI PAY — لوحة أدمن المحفظة: قسم تسعير العملة + إحصاءات
// OMI عملة خاصة بالمحفظة (ليست مشفرة) سعرها ثابت مقابل الدولار
// الليرة السورية عملة بديلة — سعر الدولار يديره الأدمن من هنا
import { useCallback, useEffect, useState } from "react";
import { Check, DollarSign, Lock, RefreshCw, Users, Store, Receipt, Layers } from "lucide-react";
import { StatusBar } from "@/components/umi/phone-frame";
import { UmiLogo } from "@/components/umi/logo";
import { api } from "@/lib/umi-client";
import { omiToSyp, omiToUsd, fmtSyp, fmtOmi, USD_TO_OMI } from "@/lib/currency";
import type { Me } from "@/lib/umi-types";

interface AdminData {
  admin: { name: string; avatar: string };
  settings: { omiUsd: number; usdSyp: number; updatedAt: string };
  stats: { users: number; merchants: number; txs: number; volume: number; balances: number };
}

const PRESETS = [
  { v: 11000, label: "11,000" },
  { v: 13000, label: "13,000" },
  { v: 15000, label: "15,000" },
  { v: 18000, label: "18,000" },
];

export function AdminScreen({ me, onLogout }: { me: Me; onLogout: () => void }) {
  const [data, setData] = useState<AdminData | null>(null);
  const [rate, setRate] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");

  const load = useCallback(() => {
    api<AdminData>(`/api/umi/admin?userId=${me.id}`)
      .then((d) => {
        setData(d);
        setRate(String(d.settings.usdSyp));
      })
      .catch((e) => setErr((e as Error).message));
  }, [me.id]);
  useEffect(load, [load]);

  const save = async () => {
    setSaving(true);
    setErr("");
    setSaved(false);
    try {
      const r = await api<AdminData["settings"]>("/api/umi/admin", {
        method: "PUT",
        body: JSON.stringify({ userId: me.id, usdSyp: Number(rate) }),
      });
      setData((d) => (d ? { ...d, settings: { ...d.settings, ...r } } : d));
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const usdSyp = Number(rate) || data?.settings.usdSyp || 13000;
  const omiSyp = omiToSyp(1, usdSyp);

  if (!data)
    return (
      <div className="h-full grid place-items-center bg-umi-bg">
        {err ? (
          <p className="text-[12px] font-tajawal text-umi-red px-8 text-center">{err}</p>
        ) : (
          <div className="w-10 h-10 rounded-full border-[3px] border-umi-gold/25 border-t-umi-gold animate-spin" />
        )}
      </div>
    );

  return (
    <div className="h-full flex flex-col bg-umi-bg">
      <StatusBar />
      {/* رأس اللوحة */}
      <header className="flex items-center gap-3 px-5 pt-2 pb-3">
        <UmiLogo size={42} glow={false} />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-tajawal text-umi-muted">لوحة الأدمن</p>
          <p className="font-cairo font-bold text-[15px] text-umi-cream truncate">{data.admin.name}</p>
        </div>
        <button
          type="button"
          onClick={load}
          aria-label="تحديث"
          className="w-9 h-9 rounded-full umi-card grid place-items-center text-umi-muted"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto umi-scroll px-4 pb-8 space-y-3">
        {/* ====== قسم تسعير العملة ====== */}
        <section className="rounded-3xl p-4 umi-card" aria-label="تسعير العملة">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-8 h-8 rounded-xl grid place-items-center text-[#0a0416] umi-glow" style={{ background: "linear-gradient(135deg,#f5dfa0,#e8c766)" }}>
              <DollarSign className="w-4 h-4" strokeWidth={2.2} />
            </span>
            <div>
              <h3 className="font-cairo font-bold text-[14px] text-umi-cream leading-tight">تسعير العملة</h3>
              <p className="text-[9px] font-tajawal text-umi-muted">OMI عملة المحفظة · الليرة السورية عملة بديلة</p>
            </div>
          </div>

          {/* السعر الثابت مقابل الدولار */}
          <div className="rounded-2xl p-3.5 bg-white/5 border border-white/10 mb-2.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-tajawal font-bold text-umi-cream">سعر OMI مقابل الدولار</span>
              <span className="flex items-center gap-1 text-[9px] font-tajawal text-umi-teal">
                <Lock className="w-3 h-3" /> ثابت
              </span>
            </div>
            <div className="flex items-end justify-between" dir="ltr">
              <div>
                <p className="font-cairo font-black text-2xl gold-text leading-none">0.0005$</p>
                <p className="text-[9px] font-tajawal text-umi-muted mt-1">قيمة 1 OMI بالدولار</p>
              </div>
              <div className="text-left">
                <p className="font-cairo font-bold text-sm text-umi-cream leading-none">{USD_TO_OMI.toLocaleString("en-US")} OMI</p>
                <p className="text-[9px] font-tajawal text-umi-muted mt-1">الدولار الواحد</p>
              </div>
            </div>
            <p className="text-[9px] font-tajawal text-umi-muted/70 mt-2.5 leading-relaxed">
              OMI عملة خاصة بمحفظة أومي باي — ليست عملة مشفرة، وسعرها مثبّت من إدارة المحفظة ولا يتغير بتقلبات السوق.
            </p>
          </div>

          {/* سعر الدولار بالليرة — يتحكم به الأدمن */}
          <div className="rounded-2xl p-3.5 border border-umi-gold/25" style={{ background: "linear-gradient(135deg,rgba(232,199,102,.08),rgba(232,199,102,.02))" }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-tajawal font-bold text-umi-cream">سعر الدولار بالليرة السورية</span>
              <span className="text-[9px] font-tajawal text-umi-gold">قابل للتعديل</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                value={rate}
                onChange={(e) => setRate(e.target.value.replace(/[^\d]/g, "").slice(0, 8))}
                inputMode="numeric"
                dir="ltr"
                className="flex-1 h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-left font-cairo font-bold text-sm text-umi-cream outline-none focus:border-umi-gold/50"
                placeholder="13000"
              />
              <span className="text-[11px] font-tajawal text-umi-muted shrink-0">ل.س / 1$</span>
            </div>
            <div className="flex gap-1.5 mt-2">
              {PRESETS.map((p) => (
                <button
                  key={p.v}
                  type="button"
                  onClick={() => setRate(String(p.v))}
                  className={`flex-1 h-7 rounded-lg text-[10px] font-tajawal font-bold transition-colors ${
                    Number(rate) === p.v ? "text-[#0a0416]" : "text-umi-muted umi-card"
                  }`}
                  style={Number(rate) === p.v ? { background: "linear-gradient(135deg,#f5dfa0,#e8c766)" } : undefined}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {/* الناتج المحسوب */}
            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-white/10" dir="ltr">
              <span className="text-[10px] font-tajawal text-umi-muted">1 OMI =</span>
              <span className="font-cairo font-bold text-[15px] text-umi-gold">
                {omiSyp.toLocaleString("en-US", { maximumFractionDigits: 2 })} ل.س
              </span>
            </div>
          </div>

          {err && <p className="text-[10px] font-tajawal text-umi-red mt-2">{err}</p>}
          <button
            type="button"
            disabled={saving || !Number(rate)}
            onClick={save}
            className="w-full h-11 mt-3 rounded-xl font-cairo font-extrabold text-sm text-[#0a0416] disabled:opacity-40 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg,#f5dfa0,#e8c766 55%,#c99b3f)" }}
          >
            {saved ? (
              <>
                <Check className="w-4 h-4" strokeWidth={3} /> حُفظ التسعير — طُبّق على كل المحافظ
              </>
            ) : saving ? (
              "جارٍ الحفظ…"
            ) : (
              "حفظ التسعير"
            )}
          </button>
        </section>

        {/* ====== إحصاءات المحفظة ====== */}
        <section className="rounded-3xl p-4 umi-card" aria-label="إحصاءات">
          <h3 className="font-cairo font-bold text-[14px] text-umi-cream mb-3">إحصاءات المحفظة</h3>
          <div className="grid grid-cols-2 gap-2">
            <Stat icon={<Users className="w-3.5 h-3.5" />} label="مستخدم" value={data.stats.users.toString()} />
            <Stat icon={<Store className="w-3.5 h-3.5" />} label="متجر متصل" value={data.stats.merchants.toString()} />
            <Stat icon={<Receipt className="w-3.5 h-3.5" />} label="معاملة" value={data.stats.txs.toLocaleString("en-US")} />
            <Stat icon={<Layers className="w-3.5 h-3.5" />} label="إجمالي الأرصدة" value={`${fmtOmi(data.stats.balances)} OMI`} small />
          </div>
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-white/10" dir="ltr">
            <span className="text-[10px] font-tajawal text-umi-muted">حجم التداول</span>
            <span className="font-cairo font-bold text-[13px] text-umi-gold">
              {fmtOmi(data.stats.volume)} OMI
              <span className="text-[9px] text-umi-muted font-tajawal"> ≈ {fmtSyp(omiToSyp(data.stats.volume, data.settings.usdSyp))} ل.س</span>
            </span>
          </div>
        </section>

        {/* تسجيل الخروج */}
        <button
          type="button"
          onClick={onLogout}
          className="w-full h-11 rounded-xl umi-card flex items-center justify-center gap-2 text-umi-red font-tajawal font-bold text-[13px] active:bg-white/5"
        >
          تسجيل الخروج من لوحة الأدمن
        </button>
        <p className="text-center text-[9px] font-tajawal text-umi-muted/60">
          التسعير محفوظ في قاعدة البيانات — يُطبّق فوراً على كل الواجهات
        </p>
      </div>
    </div>
  );
}

function Stat({ icon, label, value, small }: { icon: React.ReactNode; label: string; value: string; small?: boolean }) {
  return (
    <div className="rounded-2xl p-3 bg-white/5 border border-white/10">
      <span className="flex items-center gap-1.5 text-[9px] font-tajawal text-umi-muted mb-1">
        <span className="text-umi-gold">{icon}</span> {label}
      </span>
      <span className={`font-cairo font-bold text-umi-cream ${small ? "text-[12px]" : "text-lg"}`} dir="ltr">
        {value}
      </span>
    </div>
  );
}
