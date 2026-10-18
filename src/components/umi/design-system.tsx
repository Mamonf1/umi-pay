"use client";

import { useState } from "react";
import { Check, Copy, Apple } from "lucide-react";

const COLORS = [
  { name: "الذهبي الأساسي", hex: "#E8C766", bg: "bg-umi-gold", text: "text-[#1c130a]", usage: "أزرار رئيسية، توكيد، كاش باك" },
  { name: "الذهبي العميق", hex: "#D4A843", bg: "bg-umi-golddeep", text: "text-[#1c130a]", usage: "تدرجات وتحويم" },
  { name: "البنفسجي", hex: "#7B5BC7", bg: "bg-umi-purple", text: "text-white", usage: "فقاعات المحادثة، أفاتار" },
  { name: "البنفسجي الفاتح", hex: "#B8A4E8", bg: "bg-umi-purplight", text: "text-[#241740]", usage: "نصوص ثانوية على الداكن" },
  { name: "الخلفية الداكنة", hex: "#0A0416", bg: "bg-umi-bg", text: "text-umi-cream", usage: "خلفية التطبيق الأساسية" },
  { name: "السطح", hex: "#140B22", bg: "bg-umi-surface", text: "text-umi-cream", usage: "البطاقات والألواح" },
  { name: "النجاح", hex: "#6FB5A3", bg: "bg-umi-teal", text: "text-[#0e221d]", usage: "معاملات واردة، حالة نشط" },
  { name: "التحذير/الخطأ", hex: "#C87B7B", bg: "bg-umi-red", text: "text-[#2a0f0f]", usage: "معاملات صادرة، تجميد" },
];

const TYPO = [
  { family: "Cairo — القاهرة", role: "العناوين والأرقام الكبيرة", weight: "ExtraBold 800 / Black 900", sample: "أومني باي — محفظتك الذكية", cls: "font-cairo font-black" },
  { family: "Tajawal — تجوّل", role: "النصوص والقوائم والتسميات", weight: "Regular 400 / Bold 700", sample: "حول الأموال فوراً داخل المحادثة بضغطة واحدة", cls: "font-tajawal font-normal" },
];

export function DesignSystem() {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (hex: string) => {
    try {
      await navigator.clipboard.writeText(hex);
      setCopied(hex);
      setTimeout(() => setCopied(null), 1400);
    } catch {
      setCopied(hex);
      setTimeout(() => setCopied(null), 1400);
    }
  };

  return (
    <div className="space-y-10">
      {/* colors */}
      <div>
        <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
          <h3 className="text-lg font-cairo font-extrabold text-umi-cream">لوحة الألوان</h3>
          <p className="text-[11px] text-umi-muted font-tajawal">اضغط على أي لون لنسخ رمزه — 8 أدوار لونية فقط لضمان الاتساق</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {COLORS.map((c) => (
            <button
              key={c.hex}
              type="button"
              onClick={() => copy(c.hex)}
              className="group text-right rounded-2xl overflow-hidden umi-card hover:border-umi-gold/40 transition-all focus-visible:ring-2 focus-visible:ring-umi-gold"
              aria-label={`نسخ لون ${c.name} ${c.hex}`}
            >
              <div className={`h-16 ${c.bg} ${c.text} flex items-center justify-center`}>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] font-tajawal font-bold">
                  {copied === c.hex ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied === c.hex ? "تم النسخ" : "انسخ"}
                </span>
              </div>
              <div className="p-2.5">
                <p className="text-[11px] font-cairo font-bold text-umi-cream">{c.name}</p>
                <p className="text-[10px] text-umi-gold font-mono" dir="ltr" style={{ textAlign: "right" }}>{c.hex}</p>
                <p className="text-[9px] text-umi-muted font-tajawal mt-1 leading-relaxed">{c.usage}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* typography */}
      <div>
        <h3 className="text-lg font-cairo font-extrabold text-umi-cream mb-4">الخطوط العربية</h3>
        <div className="grid md:grid-cols-2 gap-3">
          {TYPO.map((t) => (
            <div key={t.family} className="rounded-2xl p-5 umi-card">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-1">
                <span className="text-xs font-cairo font-bold text-umi-gold">{t.family}</span>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/[0.06] text-umi-muted font-tajawal">{t.weight}</span>
              </div>
              <p className={`${t.cls} text-xl text-umi-cream leading-relaxed mb-2`}>{t.sample}</p>
              <p className="text-[11px] text-umi-muted font-tajawal">{t.role} — مُحمّلان محلياً في Flutter لضمان سرعة العرض</p>
            </div>
          ))}
        </div>
      </div>

      {/* components */}
      <div>
        <h3 className="text-lg font-cairo font-extrabold text-umi-cream mb-4">مكونات أساسية</h3>
        <div className="grid md:grid-cols-3 gap-3">
          {/* buttons */}
          <div className="rounded-2xl p-5 umi-card space-y-3">
            <p className="text-[11px] text-umi-muted font-tajawal mb-1">الأزرار</p>
            <button type="button" className="w-full py-2.5 rounded-xl bg-gradient-to-l from-umi-goldsoft via-umi-gold to-umi-golddeep text-[#1c130a] font-cairo font-extrabold text-xs hover:brightness-105 transition-all">
              إرسال الآن
            </button>
            <button type="button" className="w-full py-2.5 rounded-xl border border-umi-gold/50 text-umi-gold font-cairo font-bold text-xs hover:bg-umi-gold/10 transition-colors">
              زر ثانوي
            </button>
            <button type="button" className="w-full py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-umi-cream/80 font-cairo font-bold text-xs hover:bg-white/10 transition-colors">
              زر شبحي
            </button>
          </div>

          {/* input + chips */}
          <div className="rounded-2xl p-5 umi-card space-y-3">
            <p className="text-[11px] text-umi-muted font-tajawal mb-1">الحقول والوسوم</p>
            <div>
              <label className="block text-[10px] text-umi-cream/70 font-tajawal mb-1">رقم الجوال</label>
              <div className="rounded-xl bg-white/[0.05] border border-white/10 px-3 py-2 text-[11px] font-tajawal text-umi-cream/60 outline-none focus-within:border-umi-gold/60 transition-colors" dir="ltr" style={{ textAlign: "right" }}>
                +966 5X XXX XXXX
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[9px] px-2 py-1 rounded-full bg-umi-gold/15 text-umi-gold font-tajawal font-bold">مدى</span>
              <span className="text-[9px] px-2 py-1 rounded-full bg-white/[0.07] text-umi-cream/80 font-tajawal font-bold inline-flex items-center gap-1">
                <Apple className="w-3 h-3" /> Apple Pay
              </span>
              <span className="text-[9px] px-2 py-1 rounded-full bg-umi-teal/15 text-umi-teal font-tajawal font-bold">مكتملة</span>
              <span className="text-[9px] px-2 py-1 rounded-full bg-umi-red/15 text-umi-red font-tajawal font-bold">مجمّد</span>
            </div>
          </div>

          {/* transaction row */}
          <div className="rounded-2xl p-5 umi-card">
            <p className="text-[11px] text-umi-muted font-tajawal mb-3">صف معاملة قياسي</p>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/8">
              <span className="w-9 h-9 rounded-full bg-umi-teal/15 text-umi-teal flex items-center justify-center shrink-0 font-tajawal font-bold text-xs">+</span>
              <span className="flex-1 min-w-0">
                <span className="block text-[11px] font-tajawal font-bold text-umi-cream truncate">تحويل وارد — نورة</span>
                <span className="block text-[9px] text-umi-muted font-tajawal">اليوم 18:40 · الرصيد بعد: 12,480.50</span>
              </span>
              <span className="text-xs font-tajawal font-bold text-umi-teal shrink-0" dir="ltr">+800.00</span>
            </div>
            <p className="text-[10px] text-umi-muted font-tajawal mt-3 leading-relaxed">نمط واحد لكل المعاملات: أيقونة ملونة بالاتجاه، مبلغ بمحاذاة يمين ثابتة.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
