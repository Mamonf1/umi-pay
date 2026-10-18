"use client";

// UMI PAY — شعار المحفظة الرسمي: أحرف U على بلاطة ذهبية متدرجة
// حجم قابل للتوسيع — يُستخدم كبيراً في شاشة الدخول

export function UmiLogo({
  size = 64,
  glow = true,
}: {
  size?: number;
  glow?: boolean;
}) {
  return (
    <div
      className={`relative rounded-[28%] grid place-items-center font-cairo font-black text-[#0a0416] select-none ${
        glow ? "umi-glow" : ""
      }`}
      style={{
        width: size,
        height: size,
        background: "linear-gradient(135deg,#f5dfa0,#e8c766 55%,#c99b3f)",
        boxShadow: glow
          ? "0 0 calc(var(--s) * 0.28) rgba(232,199,102,.45), inset 0 2px 0 rgba(255,255,255,.45), inset 0 -3px 8px rgba(120,80,10,.28)"
            .replace("var(--s)", `${size}px`)
          : "inset 0 2px 0 rgba(255,255,255,.45), inset 0 -3px 8px rgba(120,80,10,.28)",
      }}
      role="img"
      aria-label="شعار UMI PAY"
    >
      {/* لمعة علوية */}
      <span
        className="absolute rounded-[28%] pointer-events-none"
        style={{
          inset: size * 0.05,
          background:
            "linear-gradient(160deg,rgba(255,255,255,.38) 0%,transparent 42%)",
        }}
      />
      <span
        style={{ fontSize: size * 0.54, lineHeight: 1, marginTop: -size * 0.02 }}
      >
        U
      </span>
    </div>
  );
}
