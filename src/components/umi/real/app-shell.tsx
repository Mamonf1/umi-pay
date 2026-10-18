"use client";

// UMI PAY — قلب التطبيق: إدارة الجلسة والتنقل ولوحة الحاسوب الجانبية
import { useCallback, useEffect, useState } from "react";
import { Database, ShieldCheck, Smartphone, Zap } from "lucide-react";
import { PhoneFrame, TabBar, type ScreenKey } from "@/components/umi/phone-frame";
import { HomeScreen, HistoryScreen, LoginScreen, ProfileScreen, QrSheet } from "@/components/umi/real/screens-main";
import { SendScreen, TopUpSheet } from "@/components/umi/real/screens-money";
import { StoresScreen } from "@/components/umi/real/screens-commerce";
import { ChatScreen, FamilyScreen } from "@/components/umi/real/screens-social";
import { api } from "@/lib/umi-client";
import { RatesProvider, useRates } from "@/lib/rates";
import { omiToSyp, fmtSyp } from "@/lib/currency";
import { AdminScreen } from "@/components/umi/real/screens-admin";
import { UmiLogo } from "@/components/umi/logo";
import type { HomeData, Me } from "@/lib/umi-types";

type Overlay = "topup" | "history" | "profile" | "qr" | null;

export function UmiApp() {
  return (
    <RatesProvider>
      <UmiAppInner />
    </RatesProvider>
  );
}

function UmiAppInner() {
  const [me, setMe] = useState<Me | null>(null);
  const [home, setHome] = useState<HomeData | null>(null);
  const [tab, setTab] = useState<ScreenKey>("home");
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [hidden, setHidden] = useState(false);
  const [booting, setBooting] = useState(true);

  const loadHome = useCallback(async (uid: string) => {
    try {
      const d = await api<HomeData>(`/api/umi/home?userId=${uid}`);
      setHome(d);
      setMe(d.me);
      return true;
    } catch {
      localStorage.removeItem("umi_uid");
      setMe(null);
      setHome(null);
      return false;
    }
  }, []);

  // استعادة الجلسة
  useEffect(() => {
    const t = setTimeout(() => {
      const uid = localStorage.getItem("umi_uid");
      if (uid) loadHome(uid).finally(() => setBooting(false));
      else setBooting(false);
    }, 0);
    return () => clearTimeout(t);
  }, [loadHome]);

  const login = useCallback(
    (user: Me) => {
      localStorage.setItem("umi_uid", user.id);
      setMe(user);
      setTab("home");
      setOverlay(null);
      loadHome(user.id);
    },
    [loadHome]
  );

  const logout = useCallback(() => {
    localStorage.removeItem("umi_uid");
    setMe(null);
    setHome(null);
    setTab("home");
    setOverlay(null);
  }, []);

  const refresh = useCallback(() => {
    const uid = localStorage.getItem("umi_uid");
    if (uid) loadHome(uid);
  }, [loadHome]);

  const quick = useCallback(
    (a: "send" | "topup" | "qr" | "stores") => {
      if (a === "topup") return setOverlay("topup");
      if (a === "qr") return setOverlay("qr");
      setTab(a);
    },
    []
  );

  const meData = home?.me ?? me;
  const { rates } = useRates();
  const isAdmin = meData?.role === "admin";

  /* ============ محتوى الهاتف ============ */
  let screen: React.ReactNode;
  if (booting) {
    screen = (
      <div className="h-full grid place-items-center bg-umi-bg">
        <UmiLogo size={64} />
      </div>
    );
  } else if (!meData) {
    screen = <LoginScreen onLogin={login} />;
  } else if (isAdmin) {
    screen = <AdminScreen me={meData} onLogout={logout} />;
  } else {
    const tabs: Record<ScreenKey, React.ReactNode> = {
      home: home ? (
        <HomeScreen
          data={home}
          hidden={hidden}
          onToggleHidden={() => setHidden((h) => !h)}
          onQuick={quick}
          onOpenHistory={() => setOverlay("history")}
          onOpenProfile={() => setOverlay("profile")}
        />
      ) : (
        <div className="h-full grid place-items-center bg-umi-bg">
          <div className="w-10 h-10 rounded-full border-[3px] border-umi-gold/25 border-t-umi-gold animate-spin" />
        </div>
      ),
      send: <SendScreen me={meData} onDone={() => { refresh(); setTab("home"); }} onExit={() => setTab("home")} />,
      stores: <StoresScreen me={meData} onExit={() => setTab("home")} onPaid={() => { refresh(); setTab("home"); }} />,
      chat: <ChatScreen me={meData} onExit={() => setTab("home")} onChanged={refresh} />,
      family: <FamilyScreen me={meData} onExit={() => setTab("home")} onChanged={refresh} />,
    };
    screen = (
      <div className="relative h-full">
        {tabs[tab]}
        {overlay === "topup" && meData && <TopUpSheet me={meData} onClose={() => setOverlay(null)} onDone={() => { setOverlay(null); refresh(); }} />}
        {overlay === "history" && meData && <HistoryScreen meId={meData.id} onBack={() => setOverlay(null)} />}
        {overlay === "profile" && meData && <ProfileScreen me={meData} onLogout={logout} onClose={() => setOverlay(null)} />}
        {overlay === "qr" && meData && <QrSheet me={meData} onClose={() => setOverlay(null)} />}
        {!overlay && <TabBar active={tab} onNavigate={setTab} />}
      </div>
    );
  }

  const demoAccounts = [
    { label: "أحمد — ولي أمر", phone: "0551234567", avatar: "🧑🏻‍💼", wide: false },
    { label: "متجر الريان — تاجر", phone: "0556789012", avatar: "🛒", wide: false },
    { label: "خالد — حساب فرعي", phone: "0553456789", avatar: "👦🏻", wide: false },
    { label: "سارة — مستخدمة", phone: "0552345678", avatar: "👩🏻", wide: false },
    { label: "إدارة UMI — أدمن المحفظة (تسعير العملة)", phone: "0500000000", avatar: "👑", wide: true },
  ];

  const demoLogin = async (phone: string) => {
    const user = await api<Me>("/api/umi/login", { method: "POST", body: JSON.stringify({ phone, pin: "1234" }) });
    login(user);
  };

  return (
    <main className="min-h-screen flex flex-col lg:flex-row items-center justify-center gap-10 lg:gap-20 px-4 py-10 relative overflow-hidden">
      {/* توهجات الخلفية */}
      <div className="pointer-events-none absolute -top-32 -right-32 w-[420px] h-[420px] rounded-full blur-3xl opacity-30" style={{ background: "radial-gradient(circle,#7b5bc7,transparent 70%)" }} />
      <div className="pointer-events-none absolute -bottom-40 -left-24 w-[460px] h-[460px] rounded-full blur-3xl opacity-25" style={{ background: "radial-gradient(circle,#e8c766,transparent 70%)" }} />

      {/* الهاتف */}
      <PhoneFrame>{screen}</PhoneFrame>

      {/* لوحة الحاسوب */}
      <aside className="max-w-md w-full text-center lg:text-right">
        <div className="flex items-center gap-3 justify-center lg:justify-start mb-4">
          <UmiLogo size={52} />
          <div>
            <h1 className="font-cairo font-black text-2xl gold-text leading-none">UMI PAY</h1>
            <p className="text-[11px] font-tajawal text-umi-muted mt-1">محفظة عملة OMI + بوابة دفع</p>
          </div>
        </div>

        <h2 className="font-cairo font-extrabold text-xl text-umi-cream leading-snug mb-2">
          تطبيق موبايل حي — كل عملية تُحفظ فعلياً في قاعدة البيانات
        </h2>
        <p className="text-[13px] font-tajawal text-umi-muted leading-relaxed mb-5">
          محفظة بعملة OMI الثابتة (1 OMI = 0.0005$) والليرة السورية عملة بديلة يدير سعرها أدمن المحفظة — تحويلات فورية، دفع للتجار عبر بوابة أومي، تحويل داخل المحادثات، وحسابات أبناء بحدود أسبوعية — ببيانات حقيقية في SQLite عبر Prisma.
        </p>

        <ul className="space-y-2 mb-6 text-right">
          <li className="flex items-center gap-2.5 text-[12px] font-tajawal text-umi-cream">
            <span className="w-7 h-7 rounded-lg bg-umi-gold/10 grid place-items-center text-umi-gold shrink-0"><Zap className="w-3.5 h-3.5" /></span>
            عملة OMI ثابتة مقابل الدولار + الليرة السورية بديل يديره الأدمن
          </li>
          <li className="flex items-center gap-2.5 text-[12px] font-tajawal text-umi-cream">
            <span className="w-7 h-7 rounded-lg bg-umi-gold/10 grid place-items-center text-umi-gold shrink-0"><Database className="w-3.5 h-3.5" /></span>
            Prisma + SQLite: مستخدمون، محافظ، معاملات، محادثات، عائلة
          </li>
          <li className="flex items-center gap-2.5 text-[12px] font-tajawal text-umi-cream">
            <span className="w-7 h-7 rounded-lg bg-umi-gold/10 grid place-items-center text-umi-gold shrink-0"><ShieldCheck className="w-3.5 h-3.5" /></span>
            رمز سري لكل عملية + حدود أسبوعية للأبناء + تجميد فوري
          </li>
          <li className="flex items-center gap-2.5 text-[12px] font-tajawal text-umi-cream">
            <span className="w-7 h-7 rounded-lg bg-umi-gold/10 grid place-items-center text-umi-gold shrink-0"><Smartphone className="w-3.5 h-3.5" /></span>
            واجهة عربية RTL جاهزة للتحويل إلى Flutter
          </li>
        </ul>

        {!meData && (
          <div className="umi-card rounded-2xl p-4">
            <p className="text-[11px] font-tajawal text-umi-muted mb-2.5">دخول سريع — اختر دوراً (الرمز 1234):</p>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((d) => (
                <button
                  key={d.phone}
                  type="button"
                  onClick={() => demoLogin(d.phone)}
                  className={`umi-card rounded-xl px-3 py-2 text-right active:bg-white/10 transition-colors ${d.wide ? "col-span-2" : ""}`}
                >
                  <span className="text-base block">{d.avatar}</span>
                  <span className="block text-[11px] font-tajawal font-bold text-umi-cream leading-tight">{d.label}</span>
                  <span className="block text-[9px] font-tajawal text-umi-muted" dir="ltr">{d.phone}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        {meData && (
          <div className="umi-card rounded-2xl p-4 text-[12px] font-tajawal text-umi-cream">
            <span className="inline-block w-2 h-2 rounded-full bg-umi-teal animate-umi-pulse ml-1.5" />
            متصل الآن كـ <span className="font-bold text-umi-gold">{meData.name}</span>
            {isAdmin ? (
              <span> — لوحة تسعير العملة</span>
            ) : (
              <span dir="ltr">
                {" "}{meData.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })} OMI
                <span className="text-umi-muted"> ≈ {fmtSyp(omiToSyp(meData.balance, rates.usdSyp))} ل.س</span>
              </span>
            )}
          </div>
        )}
      </aside>
    </main>
  );
}
