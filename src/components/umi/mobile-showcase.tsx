"use client";

import { useState } from "react";
import { Check, House, QrCode, MessageCircle, Users, ArrowUpLeft, MonitorPlay } from "lucide-react";
import { PhoneFrame, ScreenKey, SCREEN_LABELS } from "./phone-frame";
import { HomeScreen, SendScreen } from "./screen-home-send";
import { StoresScreen, ChatScreen, FamilyScreen } from "./screen-stores-chat-family";

const SCREEN_META: Record<ScreenKey, { desc: string; points: string[] }> = {
  home: {
    desc: "لوحة مالية واحدة: رصيد واضح، إجراءات سريعة، وتحفيز يومي عبر عجلة الحظ.",
    points: [
      "بطاقة رصيد متدرجة بإمكانية إخفاء الخصوصية بنقرة",
      "4 إجراءات سريعة بأهداف لمس 44px+",
      "كاش باك ونقاط UMI لتعزيز الولاء والتكرار",
    ],
  },
  send: {
    desc: "تحويل في 3 نقرات: جهة اتصال ← مبلغ ← تأكيد. لوحة أرقام تفاعلية جاهزة.",
    points: [
      "جهات اتصال موثقة مع إرسال سريع بلمسة",
      "لوحة أرقام حقيقية تعمل الآن — جرّبها",
      "رسالة اختيارية مدمجة في مسار التحويل",
    ],
  },
  stores: {
    desc: "اكتشاف المتاجر القريبة والدفع بـ QR داخل الفرع دون كبائن أو أجهزة.",
    points: [
      "فئات ذكية وفلترة فورية للمتاجر",
      "بطاقات عروض مع كاش باك مرئي",
      "زر QR عائم ثابت في متناول الإبهام",
    ],
  },
  chat: {
    desc: "الميزة الأقوى: حوّل المال داخل المحادثة كما ترسل رسالة — مع قبول/رفض.",
    points: [
      "فقاعة تحويل مدمجة بأزرار قبول/رفض فورية",
      "تجربة شبيهة بتطبيقات المراسلة — منحنى تعلم صفري",
      "مرافقة صوتية ومرفقات ضمن نفس الشاشة",
    ],
  },
  family: {
    desc: "ولي الأمر يتحكم كامل: حدود شهرية، تجميد فوري، وطلبات شراء للأبناء.",
    points: [
      "أشرطة استهلاك مرئية لكل ابن",
      "تجميد البطاقة فورياً بنقرة واحدة",
      "إضافة حساب فرعي جديد خلال دقيقة",
    ],
  },
};

const SCREEN_ICONS: Record<ScreenKey, React.ReactNode> = {
  home: <House className="w-4 h-4" />,
  send: <ArrowUpLeft className="w-4 h-4" />,
  stores: <QrCode className="w-4 h-4" />,
  chat: <MessageCircle className="w-4 h-4" />,
  family: <Users className="w-4 h-4" />,
};

export function MobileShowcase() {
  const [active, setActive] = useState<ScreenKey>("home");
  const meta = SCREEN_META[active];

  const renderScreen = () => {
    switch (active) {
      case "home":
        return <HomeScreen onNavigate={setActive} />;
      case "send":
        return <SendScreen onNavigate={setActive} />;
      case "stores":
        return <StoresScreen onNavigate={setActive} />;
      case "chat":
        return <ChatScreen onNavigate={setActive} />;
      case "family":
        return <FamilyScreen onNavigate={setActive} />;
    }
  };

  return (
    <div className="grid lg:grid-cols-[1fr_auto_1fr] gap-8 lg:gap-10 items-center">
      {/* screen selector */}
      <div className="order-2 lg:order-1 min-w-0" role="tablist" aria-label="اختيار شاشة التطبيق">
        <p className="text-xs text-umi-muted font-tajawal mb-3 hidden lg:block">اختر شاشة لعرضها — كل شيء تفاعلي:</p>
        <div className="flex lg:flex-col gap-2 overflow-x-auto no-scrollbar pb-1">
          {(Object.keys(SCREEN_META) as ScreenKey[]).map((k) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={active === k}
              onClick={() => setActive(k)}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl border text-right shrink-0 min-w-[150px] lg:w-full transition-all ${
                active === k
                  ? "bg-umi-gold/12 border-umi-gold/50 text-umi-gold shadow-[0_10px_30px_-12px_rgba(232,199,102,0.4)]"
                  : "umi-card text-umi-muted hover:text-umi-cream hover:border-white/20"
              }`}
            >
              <span className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${active === k ? "bg-umi-gold/20" : "bg-white/[0.06]"}`}>
                {SCREEN_ICONS[k]}
              </span>
              <span className="text-xs font-cairo font-bold whitespace-nowrap">{SCREEN_LABELS[k]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* phone */}
      <div className="order-1 lg:order-2 relative min-w-0 w-full">
        <div className="absolute inset-0 -z-10 rounded-full bg-umi-purple/20 blur-[90px] scale-90" aria-hidden="true" />
        <PhoneFrame>
          <div key={active} className="h-full animate-in fade-in duration-300">
            {renderScreen()}
          </div>
        </PhoneFrame>
        <p className="text-center text-[11px] text-umi-muted font-tajawal mt-4 flex items-center justify-center gap-1.5">
          <MonitorPlay className="w-3.5 h-3.5 text-umi-gold" />
          تفاعلي — جرّب لوحة الأرقام والمحادثة وأزرار القبول
        </p>
      </div>

      {/* annotations */}
      <div className="order-3 min-w-0 lg:max-w-sm lg:justify-self-start">
        <span className="inline-block text-[10px] px-2.5 py-1 rounded-full bg-umi-purple/25 text-umi-purplight font-tajawal font-bold mb-3">
          {SCREEN_LABELS[active]}
        </span>
        <h3 className="text-lg font-cairo font-extrabold text-umi-cream leading-relaxed mb-2">{meta.desc}</h3>
        <ul className="space-y-2.5">
          {meta.points.map((p) => (
            <li key={p} className="flex items-start gap-2.5 text-sm text-umi-cream/80 font-tajawal leading-relaxed">
              <span className="w-5 h-5 rounded-full bg-umi-teal/15 text-umi-teal flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3 h-3" strokeWidth={2.5} />
              </span>
              {p}
            </li>
          ))}
        </ul>
        <div className="mt-5 p-3.5 rounded-2xl umi-card">
          <p className="text-[11px] text-umi-muted font-tajawal leading-relaxed">
            كل شاشة مبنية على مكونات Flutter جاهزة: <span className="text-umi-gold font-bold">Theme, Widgets, RTL-native</span> —
            التسليم من التصميم إلى الكود مباشر دون إعادة رسم.
          </p>
        </div>
      </div>
    </div>
  );
}
