"use client";

import { ReactNode } from "react";
import { BatteryFull, House, QrCode, MessageCircle, Users, ArrowUpLeft } from "lucide-react";

export type ScreenKey = "home" | "send" | "stores" | "chat" | "family";

export const SCREEN_LABELS: Record<ScreenKey, string> = {
  home: "الرئيسية",
  send: "إرسال أموال",
  stores: "المتاجر",
  chat: "المحادثات",
  family: "الحسابات الفرعية",
};

/** iOS-style status bar rendered at top of every screen */
export function StatusBar() {
  return (
    <div className="flex items-center justify-between px-5 pt-3 pb-1 text-[11px] font-tajawal font-bold text-umi-cream/90 select-none">
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

/** Bottom tab bar — the app's primary navigation (interactive in showcase) */
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
    { key: "chat", label: "المحادثات", icon: <MessageCircle className="w-5 h-5" strokeWidth={1.8} /> },
    { key: "family", label: "العائلة", icon: <Users className="w-5 h-5" strokeWidth={1.8} /> },
  ];
  return (
    <nav
      aria-label="التنقل الرئيسي للتطبيق"
      className="absolute bottom-0 inset-x-0 z-30 border-t border-white/10 bg-[#0d0719]/95 backdrop-blur-md"
    >
      <ul className="grid grid-cols-5 px-2 pt-1.5 pb-4">
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

/** Physical phone frame with notch — content scrolls inside */
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative w-[300px] sm:w-[326px] shrink-0 mx-auto" dir="rtl">
      {/* hardware */}
      <div className="absolute -left-[13px] top-24 w-[3px] h-14 rounded-full bg-[#2b2338]" aria-hidden="true" />
      <div className="absolute -right-[13px] top-28 w-[3px] h-20 rounded-full bg-[#2b2338]" aria-hidden="true" />
      <div className="relative rounded-[2.9rem] p-[9px] bg-gradient-to-b from-[#2e2542] via-[#171021] to-[#241a38] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]">
        <div className="relative rounded-[2.35rem] overflow-hidden bg-umi-bg h-[632px]">
          {/* dynamic island */}
          <div
            className="absolute top-2.5 left-1/2 -translate-x-1/2 w-28 h-[22px] bg-black rounded-full z-40 border border-white/5"
            aria-hidden="true"
          />
          {children}
        </div>
      </div>
    </div>
  );
}
