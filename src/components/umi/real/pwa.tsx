"use client";

// UMI PAY — طبقة PWA: تسجيل Service Worker + زر «ثبّت تطبيق أومي»
// عند التثبيت يعمل أومي كتطبيق مستقل على الهاتف (أيقونة على الشاشة الرئيسية)
// وتُمنح صلاحية الكاميرا مرة واحدة وتُحفظ — فتعمل الكاميرا الحية في القارئ مباشرة
import { useEffect, useState } from "react";
import { Download, Smartphone, X } from "lucide-react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let deferredPrompt: InstallPromptEvent | null = null;
const readyListeners = new Set<() => void>();

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e as InstallPromptEvent;
    readyListeners.forEach((l) => l());
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    readyListeners.forEach((l) => l());
  });
}

/** هل يعمل التطبيق حالياً كتطبيق مثبّت مستقل؟ */
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)")?.matches === true ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function useIsStandalone(): boolean {
  const [sa, setSa] = useState(false);
  useEffect(() => {
    setSa(isStandalone());
  }, []);
  return sa;
}

/** جاهزية زر التثبيت (beforeinstallprompt متوفر وليس مستقلاً بعد) */
export function useInstallReady(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const bump = () => setReady(!!deferredPrompt && !isStandalone());
    bump();
    readyListeners.add(bump);
    return () => {
      readyListeners.delete(bump);
    };
  }, []);
  return ready;
}

/** تسجيل الـ Service Worker — يُركّب مرة واحدة في الـ layout */
export function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}

/** طلب التثبيت مباشرة (يُستخدم من أي شاشة) */
export async function installNow(): Promise<boolean> {
  if (!deferredPrompt) return false;
  try {
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    deferredPrompt = null;
    readyListeners.forEach((l) => l());
    return choice.outcome === "accepted";
  } catch {
    return false;
  }
}

/**
 * زر تثبيت التطبيق — يظهر تلقائياً عندما يدعم المتصفح التثبيت
 * (لا يظهر داخل iframe لأن المتصفحات تقصر التثبيت على الإطار الأعلى،
 *  ولا يظهر إذا كان التطبيق مثبتاً أصلاً)
 */
export function InstallAppChip({
  compact = false,
  className = "",
}: {
  compact?: boolean;
  className?: string;
}) {
  const ready = useInstallReady();
  const sa = useIsStandalone();

  if (sa || !ready) return null;

  if (compact)
    return (
      <button
        type="button"
        onClick={installNow}
        className={`inline-flex items-center gap-1.5 px-3 h-8 rounded-xl font-tajawal font-bold text-[10.5px] text-[#0a0416] active:scale-[0.97] transition-all ${className}`}
        style={{ background: "linear-gradient(135deg,#f5dfa0,#e8c766)" }}
      >
        <Download className="w-3.5 h-3.5" /> ثبّت أومي
      </button>
    );

  return (
    <button
      type="button"
      onClick={installNow}
      className={`w-full inline-flex items-center justify-center gap-1.5 px-4 h-10 rounded-xl font-tajawal font-extrabold text-[11.5px] text-[#0a0416] active:scale-[0.98] transition-all ${className}`}
      style={{ background: "linear-gradient(135deg,#f5dfa0,#e8c766)" }}
    >
      <Smartphone className="w-4 h-4" /> ثبّت تطبيق أومي على هاتفك — الكاميرا بصلاحية دائمة
    </button>
  );
}

/** بانر تثبيت أنيق أسفل ترويسة الرئيسية — يختفي بعد التثبيت أو بالإغلاق اليدوي */
export function HomeInstallBanner() {
  const ready = useInstallReady();
  const sa = useIsStandalone();
  const [closed, setClosed] = useState(false);

  if (sa || !ready || closed) return null;

  return (
    <div
      className="mx-5 mb-2.5 rounded-2xl p-3 flex items-center gap-3"
      style={{
        background: "linear-gradient(135deg,rgba(245,223,160,.13),rgba(232,199,102,.05))",
        border: "1px solid rgba(232,199,102,.28)",
      }}
    >
      <span
        className="w-9 h-9 rounded-xl grid place-items-center shrink-0"
        style={{ background: "linear-gradient(135deg,#f5dfa0,#e8c766)" }}
      >
        <Smartphone className="w-4 h-4 text-[#0a0416]" />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[11.5px] font-cairo font-bold text-umi-cream">ثبّت أومي كتطبيق على هاتفك</span>
        <span className="block text-[9.5px] font-tajawal text-umi-muted leading-relaxed">أيقونة على الشاشة الرئيسية + كاميرا بصلاحية دائمة للتحويل</span>
      </span>
      <button
        type="button"
        onClick={installNow}
        className="px-3.5 h-8 rounded-xl font-tajawal font-extrabold text-[10.5px] text-[#0a0416] shrink-0 active:scale-[0.97] transition-all"
        style={{ background: "linear-gradient(135deg,#f5dfa0,#e8c766)" }}
      >
        تثبيت
      </button>
      <button
        type="button"
        onClick={() => setClosed(true)}
        aria-label="إغلاق"
        className="w-6 h-6 rounded-full grid place-items-center text-umi-muted shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
