"use client";

// UMI PAY — قلب التطبيق: إدارة الجلسة والتنقل ولوحة الحاسوب الجانبية
import { useCallback, useEffect, useState } from "react";
import { Database, ShieldCheck, Smartphone, Zap, HandCoins, Coins } from "lucide-react";
import { PhoneFrame, TabBar, type ScreenKey } from "@/components/umi/phone-frame";
import {
  HomeScreen, HistoryScreen, LoginScreen, ProfileScreen, QrSheet, TamayuzSheet,
} from "@/components/umi/real/screens-main";
import { SendScreen, TopUpSheet, LoansScreen } from "@/components/umi/real/screens-money";
import { StoresScreen } from "@/components/umi/real/screens-commerce";
import { ChatScreen } from "@/components/umi/real/screens-social";
import { api } from "@/lib/umi-client";
import { RatesProvider, useRates } from "@/lib/rates";
import { fmtSyp, usdLine, fmtPoints, SYP_UNIT } from "@/lib/currency";
import { AdminScreen } from "@/components/umi/real/screens-admin";
import { UmiLogo } from "@/components/umi/logo";
import type { HomeData, Me } from "@/lib/umi-types";

type Overlay = "topup" | "history" | "profile" | "qr" | "tamayuz" | null;

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
          onOpenTamayuz={() => setOverlay("tamayuz")}
        />
      ) : (
        <div className="h-full grid place-items-center bg-umi-bg">
          <div className="w-10 h-10 rounded-full border-[3px] border-umi-gold/25 border-t-umi-gold animate-spin" />
        </div>
      ),
      send: <SendScreen me={meData} onDone={() => { refresh(); setTab("home"); }} onExit={() => setTab("home")} />,
      stores: <StoresScreen me={meData} onExit={() => setTab("home")} onPaid={() => { refresh(); setTab("home"); }} />,
      loans: <LoansScreen me={meData} onChanged={refresh} onExit={() => setTab("home")} />,
      chat: <ChatScreen me={meData} onExit={() => setTab("home")} onChanged={refresh} />,
    };
    screen = (
      <div className="relative h-full">
        {tabs[tab]}
        {overlay === "topup" && meData && <TopUpSheet me={meData} onClose={() => setOverlay(null)} onDone={() => { setOverlay(null); refresh(); }} />}
        {overlay === "history" && meData && <HistoryScreen meId={meData.id} onBack={() => setOverlay(null)} />}
        {overlay === "profile" && meData && <ProfileScreen me={meData} onLogout={logout} onClose={() => setOverlay(null)} />}
        {overlay === "qr" && meData && <QrSheet me={meData} onClose={() => setOverlay(null)} />}
        {overlay === "tamayuz" && meData && <TamayuzSheet me={meData} onClose={() => { setOverlay(null); refresh(); }} />}
        {!overlay && <TabBar active={tab} onNavigate={setTab} />}
      </div>
    );
  }

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
            <p className="text-[11px] font-tajawal text-umi-muted mt-1">محفظة بالليرة السورية + مكافئ الدولار + نقاط أومي</p>
          </div>
        </div>

        <h2 className="font-cairo font-extrabold text-xl text-umi-cream leading-snug mb-2">
          تطبيق موبايل حي — كل عملية تُحفظ فعلياً في قاعدة البيانات
        </h2>
        <p className="text-[13px] font-tajawal text-umi-muted leading-relaxed mb-5">
          العملة الأساسية هي الليرة السورية في كل الأرصدة والمعاملات والقروض، وتحت كل رصيد يظهر مكافئ الدولار "≈ $" بسعر صرف تديره الإدارة (مع مزامنة من مصدر موثوق)، ونقاط أومي محفظة مكافآت تُمنح من الإدارة فقط — لا بيع ولا شراء.
        </p>

        <ul className="space-y-2 mb-6 text-right">
          <li className="flex items-center gap-2.5 text-[12px] font-tajawal text-umi-cream">
            <span className="w-7 h-7 rounded-lg bg-umi-gold/10 grid place-items-center text-umi-gold shrink-0"><Zap className="w-3.5 h-3.5" /></span>
            ل.س أساسية في كل مكان + سطر "≈ $" حي تحت الرصيد
          </li>
          <li className="flex items-center gap-2.5 text-[12px] font-tajawal text-umi-cream">
            <span className="w-7 h-7 rounded-lg bg-umi-gold/10 grid place-items-center text-umi-gold shrink-0"><Coins className="w-3.5 h-3.5" /></span>
            نقاط أومي: يحدد الإدارة قيمتها ويمنحها — لا بيع ولا شراء
          </li>
          <li className="flex items-center gap-2.5 text-[12px] font-tajawal text-umi-cream">
            <span className="w-7 h-7 rounded-lg bg-umi-gold/10 grid place-items-center text-umi-gold shrink-0"><HandCoins className="w-3.5 h-3.5" /></span>
            قروض بالليرة: طلب ← موافقة الإدارة ← سداد جزئي أو كامل برمز الدفع
          </li>
          <li className="flex items-center gap-2.5 text-[12px] font-tajawal text-umi-cream">
            <span className="w-7 h-7 rounded-lg bg-umi-gold/10 grid place-items-center text-umi-gold shrink-0"><ShieldCheck className="w-3.5 h-3.5" /></span>
            دخول بكلمة مرور 8+ خانات (حروف وأرقام) ودفع برمز 4 أرقام
          </li>
          <li className="flex items-center gap-2.5 text-[12px] font-tajawal text-umi-cream">
            <span className="w-7 h-7 rounded-lg bg-umi-gold/10 grid place-items-center text-umi-gold shrink-0"><Database className="w-3.5 h-3.5" /></span>
            Prisma + SQLite: محافظ، معاملات، قروض، بطاقة تميز — كل شيء حقيقي
          </li>
          <li className="flex items-center gap-2.5 text-[12px] font-tajawal text-umi-cream">
            <span className="w-7 h-7 rounded-lg bg-umi-gold/10 grid place-items-center text-umi-gold shrink-0"><Smartphone className="w-3.5 h-3.5" /></span>
            واجهة عربية RTL جاهزة للتحويل إلى Flutter
          </li>
        </ul>

        {meData ? (
          <div className="umi-card rounded-2xl p-4 text-[12px] font-tajawal text-umi-cream">
            <span className="inline-block w-2 h-2 rounded-full bg-umi-teal animate-umi-pulse ml-1.5" />
            متصل الآن كـ <span className="font-bold text-umi-gold">{meData.name}</span>
            {isAdmin ? (
              <span> — لوحة الإدارة الكاملة</span>
            ) : (
              <span>
                {" "}· <span dir="ltr">{fmtSyp(meData.balance)} {SYP_UNIT}</span>
                <span className="text-umi-muted" dir="ltr"> {usdLine(meData.balance, rates.usdSyp)}</span>
                {" "}· {fmtPoints(meData.points)} نقطة أومي
              </span>
            )}
          </div>
        ) : (
          <div className="umi-card rounded-2xl p-4">
            <p className="text-[11.5px] font-tajawal text-umi-cream leading-relaxed">
              أنشئ حسابك الجديد من الهاتف مباشرة — بدون شروط معقدة:
              <br />
              <span className="text-umi-muted">كلمة مرور 8+ خانات (حروف وأرقام) ورمز دفع من 4 أرقام</span>
            </p>
          </div>
        )}
      </aside>
    </main>
  );
}
