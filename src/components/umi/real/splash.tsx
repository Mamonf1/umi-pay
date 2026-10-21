"use client";

// UMI PAY — شاشة البداية (Splash) عند إقلاع التطبيق
// شعار نابض + الاسم الذهبي + سطر التعريف + حالة اتصال متحركة تتغير مع الإقلاع
// كل النصوص ضمن عرض الشاشة (max-w + px) — لا قصّ من أي جهة على أي مقاس جهاز
import { useEffect, useState } from "react";
import { UmiLogo } from "@/components/umi/logo";

const STEPS = ["جارٍ الاتصال بمنصة أومي", "استعادة جلستك", "تجهيز المحفظة"];

export function SplashScreen() {
  const [step, setStep] = useState(0);

  // تدوير حالات الإقلاع كل 700 مللي ثانية — يتوقف تلقائياً عند آخر حالة
  useEffect(() => {
    const iv = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 700);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-umi-bg px-8 text-center relative overflow-hidden">
      {/* توهج خلفي خافت خلف الشعار */}
      <div
        className="absolute w-64 h-64 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(232,199,102,0.14) 0%, transparent 65%)",
          transform: "translateY(-40px)",
        }}
      />

      {/* الشعار النابض */}
      <div style={{ animation: "umi-pulse 2.4s ease-in-out infinite" }}>
        <UmiLogo size={88} />
      </div>

      {/* الاسم والتعريف — داخل عرض الشاشة دائماً */}
      <h1
        className="mt-6 font-tajawal font-black text-[28px] leading-tight text-umi-gold"
        style={{ textShadow: "0 2px 18px rgba(232,199,102,0.35)" }}
      >
        أومي باي
      </h1>
      <p className="mt-1.5 font-tajawal text-[11px] text-umi-muted max-w-[280px] leading-relaxed">
        محفظة الدفع وبوابة أومي — من تشغيل UMI PAY
      </p>

      {/* حالة الاتصال المتحركة */}
      <div className="absolute bottom-24 flex flex-col items-center gap-2">
        <p key={step} className="font-tajawal text-[12px] text-umi-cream/80 flex items-center gap-0.5">
          {STEPS[step]}
          <span className="inline-flex gap-0.5 mr-1" aria-hidden>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-1 h-1 rounded-full bg-umi-gold inline-block"
                style={{
                  animation: `umi-pulse 1s ease-in-out ${i * 0.18}s infinite`,
                }}
              />
            ))}
          </span>
        </p>
        {/* شريط تقدم رفيع ذهبي */}
        <div className="w-36 h-[3px] rounded-full overflow-hidden bg-white/[0.06]">
          <div
            className="h-full rounded-full"
            style={{
              width: `${((step + 1) / STEPS.length) * 100}%`,
              background: "linear-gradient(90deg,#c99b3f,#f5dfa0)",
              transition: "width .5s ease",
            }}
          />
        </div>
      </div>

      {/* توقيع أسفل الشاشة */}
      <p className="absolute bottom-8 font-cairo text-[9px] tracking-widest text-umi-muted/50" dir="ltr">
        UMI PAY · v1.0
      </p>
    </div>
  );
}
