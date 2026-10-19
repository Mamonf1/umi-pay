"use client";

// UMI PAY — شاشة «من نحن»: كل المعلومات والوقفات والشروط في مكان تعريفي واحد
import { useEffect, useState } from "react";
import {
  Info, ShieldCheck, Lock, HandCoins, Sparkles, Store, Coins, ArrowDownToLine,
  Scale, LifeBuoy, ChevronDown, BadgeCheck, RefreshCw,
} from "lucide-react";
import { ScreenHeader } from "@/components/umi/real/pads";
import { UmiLogo } from "@/components/umi/logo";
import { useRates } from "@/lib/rates";
import { fmtSyp, SYP_UNIT } from "@/lib/currency";

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl umi-card p-4 mb-3">
      <h3 className="flex items-center gap-2 font-cairo font-extrabold text-[14px] text-umi-gold mb-2.5">
        <span className="w-7 h-7 rounded-lg bg-umi-gold/10 grid place-items-center shrink-0">{icon}</span>
        {title}
      </h3>
      <div className="text-[12px] font-tajawal text-umi-cream/85 leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

function Accordion({ q, children, open: o = false }: { q: string; children: React.ReactNode; open?: boolean }) {
  const [open, setOpen] = useState(o);
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-3.5 py-3 text-right"
      >
        <span className="text-[12px] font-tajawal font-bold text-umi-cream">{q}</span>
        <ChevronDown className={`w-4 h-4 text-umi-muted shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-3.5 pb-3 text-[11.5px] font-tajawal text-umi-muted leading-relaxed">{children}</div>}
    </div>
  );
}

export function AboutScreen({ onClose }: { onClose: () => void }) {
  const { rates } = useRates();
  const [openFaq, setOpenFaq] = useState(true);

  return (
    <div className="absolute inset-0 z-40 bg-umi-bg flex flex-col">
      <ScreenHeader title="من نحن" onBack={onClose} />
      <div className="flex-1 overflow-y-auto umi-scroll px-5 pb-10">
        {/* ترويسة تعريفية */}
        <div className="text-center mt-1 mb-5">
          <div className="flex justify-center mb-3"><UmiLogo size={84} /></div>
          <h2 className="font-cairo font-black text-[26px] leading-none gold-text">UMI PAY</h2>
          <p className="text-[11.5px] font-tajawal text-umi-muted mt-2">
            محفظة دفع رقمية سورية — بالليرة السورية أولاً، وبمكافئ الدولار دائماً أمام عينك
          </p>
        </div>

        {/* نبذة */}
        <Section title="من نحن" icon={<Info className="w-4 h-4 text-umi-gold" />}>
          <p>
            أومي باي (UMI PAY) محفظة دفع رقمية عربية مصممة لتكون واجهتك المالية اليومية داخل سوريا.
            انطلقت بفكرة بسيطة: المال يجب أن يتحرك بسرعة رسالة، وبشكل يفهمه الجميع — رقم واضح، وواجهة عربية بالكامل،
            وعمليات تُحفظ فعلياً في قاعدة بيانات حقيقية لا مجرد عرض تجميلي.
          </p>
          <p>
            العملة الأساسية في المحفظة هي <b className="text-umi-gold">الليرة السورية (ل.س)</b> في كل الأرصدة والتحويلات
            والقروض والمدفوعات، وتحت كل رصيد يظهر مكافئ الدولار «≈ $» محسوباً لحظياً بسعر الصرف الذي تديره الإدارة —
            مع إمكانية مزامنته من مصدر موثوق. إلى جانب ذلك تعمل <b className="text-umi-gold">نقاط أومي</b> كمحفظة مكافآت
            خاصة تُمنح من الإدارة فقط، ولا تُباع ولا تُشترى إطلاقاً.
          </p>
        </Section>

        {/* ماذا نقدم */}
        <Section title="ما الذي نقدمه" icon={<Sparkles className="w-4 h-4 text-umi-gold" />}>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: <ArrowDownToLine className="w-4 h-4 text-umi-gold" />, t: "محفظة ل.س فورية", d: "شحن وتحويل واستلام بالليرة السورية في ثوانٍ" },
              { icon: <Coins className="w-4 h-4 text-umi-gold" />, t: "نقاط أومي", d: "مكافآت تُمنح من الإدارة بقيمة يحددها" },
              { icon: <HandCoins className="w-4 h-4 text-umi-gold" />, t: "قروض مرنة", d: "طلب قرض بالليرة وسداد جزئي أو كامل" },
              { icon: <Store className="w-4 h-4 text-umi-gold" />, t: "دفع المتاجر", d: "ادفع في المتاجر المتصلة برمز 4 أرقام" },
              { icon: <BadgeCheck className="w-4 h-4 text-umi-gold" />, t: "بطاقة تميز", d: "بطاقة أمريكان إكسبريس 15 خانة لحاملي الرصيد" },
              { icon: <RefreshCw className="w-4 h-4 text-umi-gold" />, t: "سعر حي", d: "مكافئ الدولار يُحدّث بسعر الصرف المُدار" },
            ].map((f) => (
              <div key={f.t} className="rounded-xl bg-white/5 border border-white/10 p-3">
                <div className="flex items-center gap-1.5 mb-1">{f.icon}
                  <span className="text-[11.5px] font-cairo font-bold text-umi-cream">{f.t}</span>
                </div>
                <p className="text-[10px] font-tajawal text-umi-muted leading-snug">{f.d}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* العملات والتسعير */}
        <Section title="العملات والتسعير" icon={<Coins className="w-4 h-4 text-umi-gold" />}>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-umi-gold mt-1.5 shrink-0" />
              <span>الليرة السورية هي عملة الحساب الوحيدة: الأرصدة، التحويلات، القروض، المدفوعات — كلها بـ<b className="text-umi-cream">ل.س</b>.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-umi-gold mt-1.5 shrink-0" />
              <span>مكافئ الدولار يظهر تلقائياً تحت كل رصيد بصيغة «≈ $» بسعر الصرف الحالي:
                <b className="text-umi-cream" dir="ltr"> $1 = {fmtSyp(rates.usdSyp)} {SYP_UNIT}</b>.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-umi-gold mt-1.5 shrink-0" />
              <span>نقطة أومي الواحدة قيمتها
                <b className="text-umi-cream"> {fmtSyp(rates.pointSyp)} {SYP_UNIT} </b>
                ويحددها أدمن المحفظة، وتظهر قيمتها المكافئة في محفظتك.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-umi-red mt-1.5 shrink-0" />
              <span>نقاط أومي <b className="text-umi-red">غير قابلة للبيع أو الشراء أو التحويل</b> — تُمنح من الإدارة فقط كمكافآت وحوافز.</span>
            </li>
          </ul>
        </Section>

        {/* الأمان */}
        <Section title="الأمان وأسرارك" icon={<ShieldCheck className="w-4 h-4 text-umi-gold" />}>
          <div className="space-y-2.5">
            <div className="flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-umi-gold shrink-0 mt-0.5" />
              <p><b className="text-umi-cream">كلمة مرور المحفظة:</b> 8 خانات أو أكثر تجمع حروفًا وأرقامًا — تُستخدم لتسجيل الدخول وتأكيد العمليات الحساسة.</p>
            </div>
            <div className="flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-umi-purplight shrink-0 mt-0.5" />
              <p><b className="text-umi-cream">رمز الدفع للمتجر:</b> 4 أرقام فقط — رمز سري مخصص حصرياً لتأكيد المدفوعات في المتاجر، منفصل تماماً عن كلمة المرور.</p>
            </div>
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-umi-teal shrink-0 mt-0.5" />
              <p><b className="text-umi-cream">فصل الصلاحيات:</b> تسعير الصرف، منح النقاط، والموافقة على القروض — كلها صلاحيات إدارية لا يستطيع تنفيذها إلا أدمن المحفظة.</p>
            </div>
          </div>
        </Section>

        {/* الوقفات: الحدود والرسوم */}
        <Section title="الحدود والوقفات المالية" icon={<Scale className="w-4 h-4 text-umi-gold" />}>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-umi-gold mt-1.5 shrink-0" />
              <span>أدنى مبلغ للشحن: <b className="text-umi-cream">25,000 ل.س</b> للعملية الواحدة.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-umi-gold mt-1.5 shrink-0" />
              <span>شرط إصدار بطاقة التميز: رصيد <b className="text-umi-cream">50,000 ل.س</b> فأكثر في لحظة الطلب.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-umi-gold mt-1.5 shrink-0" />
              <span>سداد القرض يقبل جزئياً أو كاملاً، <b className="text-umi-cream">ويرفض النظام أي مبلغ يتجاوز المتبقي</b> تلقائياً.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-umi-gold mt-1.5 shrink-0" />
              <span>القروض بالليرة السورية فقط، ولا يُصرف أي قرض قبل موافقة الإدارة صراحة.</span>
            </li>
          </ul>
        </Section>

        {/* القروض */}
        <Section title="كيف تعمل القروض؟" icon={<HandCoins className="w-4 h-4 text-umi-gold" />}>
          <div className="space-y-2">
            {[
              "تقدّم بطلب قرض من تبويب القروض محدداً المبلغ بالليرة وسبب الطلب.",
              "يراجع أدمن المحفظة الطلب: قبول (يُشحن رصيدك فوراً) أو رفض مع إشعارك.",
              "سدّد متى شئت: مبلغاً جزئياً أو كامل المتبقي — برمز الدفع الخاص بك.",
              "عند اكتمال السداد يُغلق القرض تلقائياً ويظهر في سجلك كمكتمل.",
            ].map((s, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-umi-gold/15 text-umi-gold text-[10px] font-cairo font-black grid place-items-center shrink-0 mt-0.5">{i + 1}</span>
                <p>{s}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* الشروط والأحكام */}
        <Section title="الشروط والأحكام" icon={<Scale className="w-4 h-4 text-umi-gold" />}>
          <ol className="space-y-2 list-decimal pr-4 marker:text-umi-gold/70">
            <li>المحفظة أداة دفع شخصية: المسؤولية عن حماية كلمة المرور ورمز الدفع تقع على صاحب الحساب.</li>
            <li>كل عملية تُنفذ برمز الدفع أو كلمة المرور تُعد منفذة بصلاحية صاحب الحساب ولا يمكن التراجع عنها إلا بقرار من الإدارة.</li>
            <li>نقاط أومي مكافآت ترويجية بلا قيمة نقدية خارج التطبيق، ولا يجوز بيعها أو شراؤها أو تحويلها بين المستخدمين.</li>
            <li>يحق للإدارة تحديث سعر الصرف وقيمة نقطة أومي وأي حد مالي عند الحاجة، مع انعكاسه فوراً على الواجهات.</li>
            <li>القروض امتياز يمنحه أدمن المحفظة وتقديره، والامتناع عن السداد قد يعرض الحساب للتجميد.</li>
            <li>يُمنع استخدام المحفظة لأي غرض غير قانوني، ويحق للإدارة تعليق أي حساب يخالف ذلك.</li>
            <li>بيانات العمليات محفوظة في سجل معاملات دائم يمكن لصاحب الحساب مراجعته في أي وقت.</li>
            <li>باستخدامك المحفظة فأنت توافق على هذه الشروط وأي تحديثات لاحقة تُنشر داخل التطبيق.</li>
          </ol>
        </Section>

        {/* أسئلة شائعة */}
        <section className="rounded-2xl umi-card p-4 mb-3">
          <button type="button" onClick={() => setOpenFaq((v) => !v)} className="w-full flex items-center gap-2 font-cairo font-extrabold text-[14px] text-umi-gold mb-1">
            <span className="w-7 h-7 rounded-lg bg-umi-gold/10 grid place-items-center"><LifeBuoy className="w-4 h-4" /></span>
            أسئلة يسألها الجميع
            <ChevronDown className={`w-4 h-4 ms-auto transition-transform ${openFaq ? "rotate-180" : ""}`} />
          </button>
          {openFaq && (
            <div className="space-y-2 mt-2.5">
              <Accordion q="هل أستطيع شراء نقاط أومي بالليرة أو الدولار؟" open>
                لا. النقاط تُمنح من الإدارة فقط كمكافآت، وهي غير معروضة للبيع أو الشراء مطلقاً — وقيمتها الليرية للعرض التقديري فقط.
              </Accordion>
              <Accordion q="لماذا يختلف مكافئ الدولار بين فترة وأخرى؟">
                لأن سعر الصرف يديره أدمن المحفظة ويُحدّثه عند الحاجة (أو يزامنه من مصدر موثوق)، فتتغير قيمة «≈ $» لحظة التحديث.
              </Accordion>
              <Accordion q="رمز الدفع وكلمة المرور — ما الفرق؟">
                كلمة المرور (8+ خانات حروف وأرقام) للدخول والعمليات الحساسة، بينما رمز الدفع (4 أرقام) مخصص لتأكيد الدفع في المتاجر والسداد فقط.
              </Accordion>
              <Accordion q="ماذا يحدث لو سددت أكثر من المتبقي على قرضي؟">
                النظام يرفض العملية تلقائياً ويخبرك بالمتبقي الدقيق — لا يمكن دفع زيادة عن دينك.
              </Accordion>
            </div>
          )}
        </section>

        {/* تواصل */}
        <Section title="تواصل مع الإدارة" icon={<LifeBuoy className="w-4 h-4 text-umi-gold" />}>
          <p>
            لأي استفسار أو شكوى تواصل مع أدمن المحفظة مباشرة عبر المحادثات داخل التطبيق،
            أو على رقم الإدارة <b className="text-umi-cream" dir="ltr">963 969 748 865</b>.
            نرحب بملاحظاتكم لتطوير المحفظة، ونرد عادة خلال ساعات النهار.
          </p>
        </Section>

        <p className="text-center text-[9.5px] font-tajawal text-umi-muted/60 mt-6">
          UMI PAY · الإصدار 2.0 — محفظة بالليرة السورية + مكافئ الدولار + نقاط أومي
        </p>
      </div>
    </div>
  );
}

/** تُستخدم داخل LoginScreen كرابط سفلي */
export function AboutFooterLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      data-testid="about-link"
      onClick={onClick}
      className="mx-auto mt-4 inline-flex items-center gap-1.5 text-[11px] font-tajawal font-bold text-umi-muted hover:text-umi-gold transition-colors"
    >
      <Info className="w-3.5 h-3.5" />
      من نحن — تعرّف على المحفظة وشروطها وحدودها
    </button>
  );
}
