"use client";

// UMI PAY — قلب التطبيق: جلسة واحدة + تنقل + تراكبات — موبايل بملء الشاشة
// تصميم مخصص للموبايل: العمود يتمدد بعرض الشاشة كاملاً (100dvh)، وعلى الشاشات
// الكبيرة يبقى نفس النسخة كعمود مركزي بعرض هاتف — لا يوجد إطار هاتف ولا لوحة حاسوب.
import { useCallback, useEffect, useState } from "react";
import { TabBar, type ScreenKey } from "@/components/umi/shell";
import {
  HomeScreen, HistoryScreen, LoginScreen, ProfileScreen, QrSheet, TamayuzSheet,
} from "@/components/umi/real/screens-main";
import { SendScreen, TopUpSheet, LoansScreen } from "@/components/umi/real/screens-money";
import { StoresScreen } from "@/components/umi/real/screens-commerce";
import { ChatScreen } from "@/components/umi/real/screens-social";
import { QrScannerSheet } from "@/components/umi/real/screens-scan";
import { AboutScreen } from "@/components/umi/real/screens-about";
import { api } from "@/lib/umi-client";
import { RatesProvider } from "@/lib/rates";
import { AdminScreen } from "@/components/umi/real/screens-admin";
import { UmiLogo } from "@/components/umi/logo";
import type { HomeData, Me } from "@/lib/umi-types";

type Overlay = "topup" | "history" | "profile" | "qr" | "tamayuz" | "about" | "scan" | null;

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
  const isAdmin = meData?.role === "admin";

  /* ============ الشاشة الحالية ============ */
  let screen: React.ReactNode;
  if (booting) {
    screen = (
      <div className="min-h-[100dvh] grid place-items-center bg-umi-bg">
        <UmiLogo size={72} />
      </div>
    );
  } else if (!meData) {
    screen = <LoginScreen onLogin={login} onOpenAbout={() => setOverlay("about")} />;
  } else if (isAdmin) {
    screen = (
      <AdminScreen me={meData} onLogout={logout} onOpenAbout={() => setOverlay("about")} />
    );
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
          onOpenAbout={() => setOverlay("about")}
        />
      ) : (
        <div className="min-h-[100dvh] grid place-items-center bg-umi-bg">
          <div className="w-10 h-10 rounded-full border-[3px] border-umi-gold/25 border-t-umi-gold animate-spin" />
        </div>
      ),
      send: <SendScreen me={meData} onDone={() => { refresh(); setTab("home"); }} onExit={() => setTab("home")} />,
      stores: <StoresScreen me={meData} onExit={() => setTab("home")} onPaid={() => { refresh(); setTab("home"); }} />,
      loans: <LoansScreen me={meData} onChanged={refresh} onExit={() => setTab("home")} />,
      chat: <ChatScreen me={meData} onExit={() => setTab("home")} onChanged={refresh} />,
    };
    screen = (
      <div className="relative min-h-[100dvh]">
        {tabs[tab]}
        {overlay === "topup" && meData && <TopUpSheet me={meData} onClose={() => setOverlay(null)} onDone={() => { setOverlay(null); refresh(); }} />}
        {overlay === "history" && meData && <HistoryScreen meId={meData.id} onBack={() => setOverlay(null)} />}
        {overlay === "profile" && meData && (
          <ProfileScreen me={meData} onLogout={logout} onClose={() => setOverlay(null)} onOpenAbout={() => setOverlay("about")} />
        )}
        {overlay === "qr" && meData && <QrSheet me={meData} onClose={() => setOverlay(null)} />}
        {overlay === "scan" && meData && (
          <QrScannerSheet me={meData} onClose={() => setOverlay(null)} onDone={() => { setOverlay(null); refresh(); }} />
        )}
        {overlay === "tamayuz" && meData && <TamayuzSheet me={meData} onClose={() => { setOverlay(null); refresh(); }} />}
        {!overlay && <TabBar active={tab} onNavigate={setTab} onScan={() => setOverlay("scan")} />}
      </div>
    );
  }

  return (
    <main dir="rtl" className="min-h-[100dvh] w-full bg-[#05030c] flex justify-center">
      {/* توهجات خلفية خفيفة خلف عمود التطبيق */}
      <div className="pointer-events-none fixed -top-40 right-0 w-[70vw] max-w-[520px] h-[420px] rounded-full blur-3xl opacity-20" style={{ background: "radial-gradient(circle,#7b5bc7,transparent 70%)" }} aria-hidden="true" />
      <div className="pointer-events-none fixed -bottom-48 left-0 w-[70vw] max-w-[520px] h-[460px] rounded-full blur-3xl opacity-15" style={{ background: "radial-gradient(circle,#e8c766,transparent 70%)" }} aria-hidden="true" />

      {/* عمود التطبيق — بعرض الشاشة الكامل على الموبايل */}
      <div className="relative w-full max-w-[480px] min-h-[100dvh] bg-umi-bg overflow-x-hidden sm:shadow-[0_0_90px_rgba(0,0,0,0.75)] sm:border-x sm:border-white/5">
        {screen}
        {/* تراكب «من نحن» عام — يعمل من شاشة الدخول والرئيسية والملف الشخصي ولوحة الأدمن */}
        {overlay === "about" && <AboutScreen onClose={() => setOverlay(null)} />}
      </div>
    </main>
  );
}
