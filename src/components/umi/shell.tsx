"use client";

// UMI PAY — غلاف التطبيق بملء الشاشة (موبايل فقط)
// لا يوجد إطار هاتف ولا نسخة سطح مكتب: العمود يتمدد بعرض الشاشة الكامل على الموبايل
// وعلى الشاشات الكبيرة يبقى عموداً مركزياً بعرض هاتف (نفس النسخة، لا نسخ ثانية)
import { ReactNode } from "react";
import { BatteryFull, House, QrCode, MessageCircle, HandCoins, Store } from "lucide-react";

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

/** شريط التبويب السفلي — زر مسح QR بارز في المنتصف (يفتح الكاميرا للقراءة) */
export function TabBar({
  active,
  onNavigate,
  onScan,
}: {
  active: ScreenKey;
  onNavigate?: (k: ScreenKey) => void;
  onScan?: () => void;
}) {
  const items: { key: ScreenKey; label: string; icon: ReactNode }[] = [
    { key: "home", label: "الرئيسية", icon: <House className="w-5 h-5" strokeWidth={1.8} /> },
    { key: "stores", label: "المتاجر", icon: <Store className="w-5 h-5" strokeWidth={1.8} /> },
  ];
  const rightItems: { key: ScreenKey; label: string; icon: ReactNode }[] = [
    { key: "loans", label: "القروض", icon: <HandCoins className="w-5 h-5" strokeWidth={1.8} /> },
    { key: "chat", label: "المحادثات", icon: <MessageCircle className="w-5 h-5" strokeWidth={1.8} /> },
  ];
  const tabBtn = (it: { key: ScreenKey; label: string; icon: ReactNode }) => {
    const isActive = it.key === active;
    return (
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
    );
  };
  return (
    <nav
      aria-label="التنقل الرئيسي للتطبيق"
      className="absolute bottom-0 inset-x-0 z-30 border-t border-white/10 bg-[#0d0719]/95 backdrop-blur-md"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
    >
      <ul className="grid grid-cols-5 px-2 pt-1.5 items-end">
        {items.map((it) => <li key={it.key}>{tabBtn(it)}</li>)}

        {/* زر المسح — في المنتصف تماماً */}
        <li className="flex flex-col items-center">
          <button
            type="button"
            data-testid="tab-scan"
            onClick={onScan}
            aria-label="مسح رمز QR للتحويل"
            className="-mt-9 w-14 h-14 rounded-2xl grid place-items-center active:scale-95 transition-transform"
            style={{
              background: "linear-gradient(135deg,#f5dfa0,#e8c766 55%,#c99b3f)",
              boxShadow: "0 12px 28px -8px rgba(232,199,102,0.55), inset 0 1px 0 rgba(255,255,255,0.4)",
            }}
          >
            <QrCode className="w-7 h-7 text-[#0a0416]" strokeWidth={2.2} />
          </button>
          <span className="text-[9px] font-tajawal font-bold text-umi-gold mt-1">مسح رمز</span>
        </li>

        {rightItems.map((it) => <li key={it.key}>{tabBtn(it)}</li>)}
      </ul>
    </nav>
  );
}
