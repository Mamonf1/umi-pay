"use client";

// UMI PAY — غلاف التطبيق بملء الشاشة (موبايل فقط)
// لا يوجد إطار هاتف ولا نسخة سطح مكتب: العمود يتمدد بعرض الشاشة الكامل على الموبايل
// وعلى الشاشات الكبيرة يبقى عموداً مركزياً بعرض هاتف (نفس النسخة، لا نسخ ثانية)
import { ReactNode } from "react";
import { BatteryFull, House, QrCode, MessageCircle, HandCoins, ArrowUpLeft } from "lucide-react";

export type ScreenKey = "home" | "send" | "stores" | "loans" | "chat";

export const SCREEN_LABELS: Record<ScreenKey, string> = {
  home: "الرئيسية",
  send: "إرسال أموال",
  stores: "المتاجر",
  loans: "القروض",
  chat: "المحادثات",
};

/** شريط علوي رفيع يتكيف مع حواف الشاشة (safe-area) */
export function StatusBar() {
  return (
    <div
      className="flex items-center justify-between px-5 pt-2.5 pb-1 text-[11px] font-tajawal font-bold text-umi-cream/90 select-none"
      style={{ paddingTop: "max(0.625rem, env(safe-area-inset-top))" }}
    >
      <span>9:41</span>
      <span className="flex items-center gap-1" aria-hidden="true">
        <span className="flex items-end gap-[2px]">
          <span className="w-[3px] h-[5px] rounded-sm bg-umi-cream/80" />
          <span className="w-[3px] h-[7px] rounded-sm bg-umi-cream/80" />
          <span className="w-[3px] h-[9px] rounded-sm bg-umi-cream/80" />
        </span>
        <BatteryFull className="w-4 h-4" strokeWidth={1.8} />
      </span>
    </div>
  );
}

/** شريط التبويب السفلي — بعرض التطبيق الكامل مع مراعاة حواف الجهاز */
export function TabBar({
  active,
  onNavigate,
}: {
  active: ScreenKey;
  onNavigate?: (k: ScreenKey) => void;
}) {
  const items: { key: ScreenKey; label: string; icon: ReactNode }[] = [
    { key: "home", label: "الرئيسية", icon: <House className="w-5 h-5" strokeWidth={1.8} /> },
    { key: "stores", label: "المتاجر", icon: <QrCode className="w-5 h-5" strokeWidth={1.8} /> },
    { key: "send", label: "إرسال", icon: <ArrowUpLeft className="w-5 h-5" strokeWidth={1.8} /> },
    { key: "loans", label: "القروض", icon: <HandCoins className="w-5 h-5" strokeWidth={1.8} /> },
    { key: "chat", label: "المحادثات", icon: <MessageCircle className="w-5 h-5" strokeWidth={1.8} /> },
  ];
  return (
    <nav
      aria-label="التنقل الرئيسي للتطبيق"
      className="absolute bottom-0 inset-x-0 z-30 border-t border-white/10 bg-[#0d0719]/95 backdrop-blur-md"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
    >
      <ul className="grid grid-cols-5 px-2 pt-1.5">
        {items.map((it) => {
          const isActive = it.key === active;
          return (
            <li key={it.key}>
              <button
                type="button"
                onClick={() => onNavigate?.(it.key)}
                aria-current={isActive ? "page" : undefined}
                className={`w-full flex flex-col items-center gap-0.5 py-1 rounded-xl transition-colors ${
                  isActive ? "text-umi-gold" : "text-umi-muted hover:text-umi-cream"
                }`}
              >
                {it.icon}
                <span className="text-[9px] font-tajawal font-medium">{it.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
