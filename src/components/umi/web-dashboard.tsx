"use client";

import {
  BarChart3,
  Bell,
  FileText,
  House,
  Lock,
  Search,
  Settings,
  Store,
  Users,
  Wallet,
} from "lucide-react";

const STATS = [
  { label: "إجمالي الأرصدة", value: "48,220", unit: "ر.س", delta: "+8.2%", up: true },
  { label: "معاملات اليوم", value: "312", unit: "عملية", delta: "+12", up: true },
  { label: "تجار نشطون", value: "87", unit: "متجر", delta: "+5", up: true },
  { label: "حسابات فرعية", value: "12", unit: "حساب", delta: "+2", up: true },
];

const NAV = [
  { label: "الرئيسية", icon: <House className="w-4 h-4" />, active: true },
  { label: "التحويلات", icon: <Wallet className="w-4 h-4" />, active: false },
  { label: "التجار", icon: <Store className="w-4 h-4" />, active: false },
  { label: "الحسابات الفرعية", icon: <Users className="w-4 h-4" />, active: false },
  { label: "التقارير", icon: <BarChart3 className="w-4 h-4" />, active: false },
  { label: "الإعدادات", icon: <Settings className="w-4 h-4" />, active: false },
];

const TXS = [
  { name: "كافي ليّن — فرع الملقا", type: "دفع تجاري", amount: "-1,240.50", status: "مكتملة" },
  { name: "نورة العتيبي", type: "تحويل وارد", amount: "+800.00", status: "مكتملة" },
  { name: "إيداع — عبدالله السالم", type: "شحن محفظة", amount: "+2,000.00", status: "معلقة" },
  { name: "سارة (حساب فرعي)", type: "شراء بإشراف", amount: "-350.00", status: "مكتملة" },
  { name: "فاتورة STC", type: "مدفوعات", amount: "-299.00", status: "فاشلة" },
];

const statusStyle: Record<string, string> = {
  "مكتملة": "bg-umi-teal/15 text-umi-teal",
  "معلقة": "bg-umi-gold/15 text-umi-gold",
  "فاشلة": "bg-umi-red/15 text-umi-red",
};

const CHART = {
  days: ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"],
  gold: [38, 52, 44, 66, 58, 82, 74],
  purple: [22, 30, 34, 41, 38, 55, 63],
  max: 100,
  W: 640,
  H: 190,
};

function chartPath(vals: number[]) {
  const step = CHART.W / (vals.length - 1);
  return vals.map((v, i) => `${i === 0 ? "M" : "L"} ${CHART.W - i * step} ${CHART.H - (v / CHART.max) * CHART.H}`).join(" ");
}

export function WebDashboard() {
  return (
    <div className="rounded-2xl overflow-hidden border border-white/12 bg-[#0d0719] shadow-[0_40px_100px_-30px_rgba(0,0,0,0.9)]" dir="rtl">
      {/* browser chrome */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-[#16102280] border-b border-white/8">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="w-2.5 h-2.5 rounded-full bg-umi-red/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-umi-gold/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-umi-teal/70" />
        </span>
        <span className="flex-1 max-w-md mx-auto flex items-center gap-1.5 rounded-full bg-white/[0.05] border border-white/8 px-3 py-1 text-[10px] text-umi-muted font-tajawal" dir="ltr">
          <Lock className="w-3 h-3 text-umi-teal" /> umipay.sa/dashboard
        </span>
        <span className="w-10" aria-hidden="true" />
      </div>

      <div className="flex min-h-[520px]">
        {/* sidebar */}
        <aside className="hidden md:flex w-48 shrink-0 flex-col border-l border-white/8 bg-[#100a1c] p-4" aria-label="التنقل الجانبي">
          <div className="flex items-center gap-2 mb-6">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-umi-goldsoft to-umi-golddeep text-[#1c130a] flex items-center justify-center font-cairo font-black text-sm">U</span>
            <span className="font-cairo font-extrabold text-sm text-umi-cream tracking-wide">UMI PAY</span>
          </div>
          <nav className="space-y-1 flex-1">
            {NAV.map((n) => (
              <button
                key={n.label}
                type="button"
                aria-current={n.active ? "page" : undefined}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-tajawal font-bold transition-colors ${
                  n.active ? "bg-umi-gold/12 text-umi-gold border border-umi-gold/25" : "text-umi-muted hover:text-umi-cream hover:bg-white/[0.04]"
                }`}
              >
                {n.icon} {n.label}
              </button>
            ))}
          </nav>
          <div className="p-3 rounded-xl bg-umi-purple/15 border border-umi-purple/25">
            <p className="text-[10px] font-cairo font-bold text-umi-purplight mb-0.5">باقة الأعمال</p>
            <p className="text-[9px] text-umi-muted font-tajawal leading-relaxed">رسوم التاجر 1.2% — خصم للدفعات المجدولة</p>
          </div>
        </aside>

        {/* main */}
        <div className="flex-1 min-w-0 p-4 sm:p-5">
          {/* topbar */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 max-w-sm flex items-center gap-2 rounded-xl bg-white/[0.05] border border-white/8 px-3 py-2">
              <Search className="w-3.5 h-3.5 text-umi-muted" />
              <span className="text-[11px] text-umi-muted font-tajawal">ابحث عن معاملة أو تاجر…</span>
            </div>
            <button type="button" aria-label="الإشعارات" className="relative w-9 h-9 rounded-xl bg-white/[0.05] border border-white/8 flex items-center justify-center text-umi-cream/80 hover:bg-white/10 transition-colors">
              <Bell className="w-4 h-4" strokeWidth={1.8} />
              <span className="absolute top-1.5 left-1.5 w-2 h-2 rounded-full bg-umi-gold" aria-hidden="true" />
            </button>
            <div className="flex items-center gap-2">
              <span className="w-9 h-9 rounded-full bg-gradient-to-br from-umi-purple to-[#4a3574] flex items-center justify-center text-umi-cream font-cairo font-bold text-xs">ع</span>
              <span className="hidden sm:block">
                <span className="block text-[11px] font-cairo font-bold text-umi-cream leading-tight">عبدالله السالم</span>
                <span className="block text-[9px] text-umi-muted font-tajawal">مالك الحساب</span>
              </span>
            </div>
          </div>

          {/* stats */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
            {STATS.map((s) => (
              <div key={s.label} className="rounded-2xl p-3.5 umi-card hover:border-umi-gold/30 transition-colors">
                <p className="text-[10px] text-umi-muted font-tajawal mb-1.5">{s.label}</p>
                <p className="text-lg font-cairo font-black text-umi-cream leading-none mb-1.5">
                  {s.value} <span className="text-[10px] font-tajawal font-bold text-umi-gold">{s.unit}</span>
                </p>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-umi-teal/12 text-umi-teal font-tajawal font-bold" dir="ltr">{s.delta}</span>
              </div>
            ))}
          </div>

          <div className="grid xl:grid-cols-[1.6fr_1fr] gap-3">
            {/* chart */}
            <div className="rounded-2xl p-4 umi-card">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div>
                  <h3 className="text-sm font-cairo font-bold text-umi-cream">حركة المعاملات الأسبوعية</h3>
                  <p className="text-[9px] text-umi-muted font-tajawal">بالآلاف من الريالات — آخر 7 أيام</p>
                </div>
                <div className="flex items-center gap-3 text-[9px] font-tajawal">
                  <span className="flex items-center gap-1 text-umi-cream/80"><span className="w-2 h-2 rounded-full bg-umi-gold inline-block" /> صادر</span>
                  <span className="flex items-center gap-1 text-umi-cream/80"><span className="w-2 h-2 rounded-full bg-umi-purple inline-block" /> وارد</span>
                </div>
              </div>
              <svg viewBox={`-16 0 ${CHART.W + 32} ${CHART.H + 26}`} className="w-full" role="img" aria-label="رسم بياني لحركة المعاملات الأسبوعية">
                {[0.25, 0.5, 0.75, 1].map((f) => (
                  <line key={f} x1={0} x2={CHART.W} y1={CHART.H * f} y2={CHART.H * f} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
                ))}
                <path d={`${chartPath(CHART.gold)} L 0 ${CHART.H} L ${CHART.W} ${CHART.H} Z`} fill="rgba(232,199,102,0.10)" stroke="none" />
                <path d={chartPath(CHART.gold)} fill="none" stroke="#E8C766" strokeWidth={2.5} strokeLinecap="round" />
                <path d={chartPath(CHART.purple)} fill="none" stroke="#7B5BC7" strokeWidth={2} strokeLinecap="round" strokeDasharray="1 0" />
                {CHART.days.map((d, i) => (
                  <text key={d} x={CHART.W - (i * CHART.W) / 6} y={CHART.H + 16} fontSize={11} fill="#A79BB8" textAnchor="middle" fontFamily="Tajawal, sans-serif">
                    {d}
                  </text>
                ))}
              </svg>
            </div>

            {/* quick panel */}
            <div className="rounded-2xl p-4 umi-card flex flex-col">
              <h3 className="text-sm font-cairo font-bold text-umi-cream mb-1">أحدث المعاملات</h3>
              <p className="text-[9px] text-umi-muted font-tajawal mb-3">تحديث مباشر</p>
              <ul className="space-y-1.5 flex-1">
                {TXS.slice(0, 4).map((t) => (
                  <li key={t.name + t.amount} className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.035] border border-white/6">
                    <span className="flex-1 min-w-0">
                      <span className="block text-[10px] font-tajawal font-bold text-umi-cream truncate">{t.name}</span>
                      <span className="block text-[9px] text-umi-muted font-tajawal">{t.type}</span>
                    </span>
                    <span className={`text-[10px] font-tajawal font-bold shrink-0 ${t.amount.startsWith("+") ? "text-umi-teal" : "text-umi-cream/75"}`} dir="ltr">
                      {t.amount}
                    </span>
                  </li>
                ))}
              </ul>
              <button type="button" className="mt-3 w-full py-2 rounded-xl border border-umi-gold/40 text-umi-gold text-[11px] font-cairo font-bold hover:bg-umi-gold/10 transition-colors inline-flex items-center justify-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> تصدير كشف PDF
              </button>
            </div>
          </div>

          {/* table */}
          <div className="rounded-2xl mt-3 umi-card overflow-hidden">
            <div className="px-4 py-3 border-b border-white/8">
              <h3 className="text-sm font-cairo font-bold text-umi-cream">سجل المعاملات</h3>
            </div>
            <div className="overflow-x-auto umi-scroll">
              <table className="w-full text-right min-w-[480px]">
                <thead>
                  <tr className="text-[9px] text-umi-muted font-tajawal border-b border-white/8">
                    <th className="px-4 py-2.5 font-medium">الطرف</th>
                    <th className="px-4 py-2.5 font-medium">النوع</th>
                    <th className="px-4 py-2.5 font-medium">المبلغ</th>
                    <th className="px-4 py-2.5 font-medium">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {TXS.map((t) => (
                    <tr key={t.name + t.type} className="text-[11px] font-tajawal border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-colors">
                      <td className="px-4 py-2.5 font-bold text-umi-cream">{t.name}</td>
                      <td className="px-4 py-2.5 text-umi-muted">{t.type}</td>
                      <td className={`px-4 py-2.5 font-bold ${t.amount.startsWith("+") ? "text-umi-teal" : "text-umi-cream/80"}`} dir="ltr" style={{ textAlign: "right" }}>
                        {t.amount}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${statusStyle[t.status]}`}>{t.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
