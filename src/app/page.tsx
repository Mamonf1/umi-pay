import { ArrowDownLeft, Fingerprint, Monitor, Sparkles, Smartphone } from "lucide-react";
import { HomeScreen } from "@/components/umi/screen-home-send";
import { PhoneFrame } from "@/components/umi/phone-frame";
import { DesignSystem } from "@/components/umi/design-system";
import { MobileShowcase } from "@/components/umi/mobile-showcase";
import { WebDashboard } from "@/components/umi/web-dashboard";

function SectionHeader({
  kicker,
  title,
  desc,
}: {
  kicker: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="text-center max-w-2xl mx-auto mb-10">
      <span className="inline-block text-[11px] px-3 py-1 rounded-full bg-umi-gold/12 text-umi-gold font-tajawal font-bold mb-3 border border-umi-gold/25">
        {kicker}
      </span>
      <h2 className="text-2xl sm:text-3xl font-cairo font-black text-umi-cream mb-3 leading-snug">{title}</h2>
      <p className="text-sm text-umi-muted font-tajawal leading-relaxed">{desc}</p>
    </div>
  );
}

export default function Page() {
  return (
    <div className="min-h-screen flex flex-col bg-umi-bg text-umi-cream font-tajawal overflow-x-clip">
      {/* ============ NAV ============ */}
      <header className="sticky top-0 z-50 glass border-b border-white/8">
        <nav className="max-w-6xl mx-auto flex items-center gap-4 px-4 sm:px-6 py-3" aria-label="التنقل الرئيسي">
          <a href="#" className="flex items-center gap-2 shrink-0">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-umi-goldsoft via-umi-gold to-umi-golddeep text-[#1c130a] flex items-center justify-center font-cairo font-black text-base shadow-[0_8px_20px_-6px_rgba(232,199,102,0.5)]">
              U
            </span>
            <span className="font-cairo font-black text-base tracking-wide text-umi-cream">
              UMI <span className="gold-text">PAY</span>
            </span>
          </a>
          <div className="hidden sm:flex items-center gap-1 mx-auto text-xs font-tajawal font-medium">
            <a href="#design-system" className="px-3 py-2 rounded-lg text-umi-muted hover:text-umi-gold transition-colors">نظام التصميم</a>
            <a href="#mobile" className="px-3 py-2 rounded-lg text-umi-muted hover:text-umi-gold transition-colors">تطبيق الموبايل</a>
            <a href="#web" className="px-3 py-2 rounded-lg text-umi-muted hover:text-umi-gold transition-colors">لوحة الويب</a>
          </div>
          <a
            href="#mobile"
            className="ms-auto sm:ms-0 shrink-0 px-4 py-2 rounded-xl bg-gradient-to-l from-umi-goldsoft via-umi-gold to-umi-golddeep text-[#1c130a] font-cairo font-extrabold text-xs hover:brightness-105 active:scale-95 transition-all"
          >
            استعرض التصميم
          </a>
        </nav>
      </header>

      <main className="flex-1">
        {/* ============ HERO ============ */}
        <section className="relative" aria-labelledby="hero-title">
          <div className="absolute top-0 inset-x-0 h-[420px] bg-[radial-gradient(60%_80%_at_50%_0%,rgba(123,91,199,0.22),transparent_70%)]" aria-hidden="true" />
          <div className="absolute top-40 right-[10%] w-40 h-40 rounded-full bg-umi-gold/10 blur-3xl" aria-hidden="true" />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-14 pb-16 grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex flex-wrap gap-2 mb-5">
                <span className="text-[11px] px-3 py-1 rounded-full bg-umi-gold/12 text-umi-gold font-tajawal font-bold border border-umi-gold/25">Flutter جاهز</span>
                <span className="text-[11px] px-3 py-1 rounded-full bg-umi-purple/20 text-umi-purplight font-tajawal font-bold border border-umi-purple/30">عربي RTL أولاً</span>
                <span className="text-[11px] px-3 py-1 rounded-full bg-umi-teal/12 text-umi-teal font-tajawal font-bold border border-umi-teal/25">وصولية AA</span>
              </div>
              <h1 id="hero-title" className="text-4xl sm:text-5xl font-cairo font-black leading-[1.25] mb-5">
                أومني باي —
                <br />
                <span className="gold-text">هوية ذهبية</span> على أسودٍ ملكي
              </h1>
              <p className="text-base text-umi-muted leading-relaxed mb-7 max-w-lg">
                طوّرنا نموذجك الأولي إلى نظام تصميم متكامل: 5 شاشات موبايل تفاعلية تغطي المحفظة والتحويلات والمتاجر والمحادثة والحسابات العائلية،
                بالإضافة إلى لوحة تحكم ويب — كلها بهويتك الأصلية الذهبية الداكنة، جاهزة للتسليم لمطوّر Flutter مباشرة.
              </p>
              <div className="flex flex-wrap gap-3 mb-9">
                <a
                  href="#mobile"
                  className="px-6 py-3 rounded-2xl bg-gradient-to-l from-umi-goldsoft via-umi-gold to-umi-golddeep text-[#1c130a] font-cairo font-extrabold text-sm shadow-[0_14px_36px_-10px_rgba(232,199,102,0.55)] hover:brightness-105 active:scale-95 transition-all"
                >
                  شاشات التطبيق التفاعلية
                </a>
                <a
                  href="#web"
                  className="px-6 py-3 rounded-2xl border border-white/15 text-umi-cream font-cairo font-bold text-sm hover:border-umi-gold/50 hover:text-umi-gold transition-colors"
                >
                  لوحة تحكم الويب
                </a>
              </div>
              <dl className="grid grid-cols-4 gap-3 max-w-md">
                {[
                  { n: "5", l: "شاشات تفاعلية" },
                  { n: "+40", l: "مكوّن UI" },
                  { n: "100%", l: "دعم RTL" },
                  { n: "8", l: "أدوار لونية" },
                ].map((s) => (
                  <div key={s.l} className="text-center rounded-2xl py-3 umi-card">
                    <dt className="sr-only">{s.l}</dt>
                    <dd className="text-lg font-cairo font-black text-umi-gold leading-none mb-1">{s.n}</dd>
                    <dd className="text-[9px] text-umi-muted font-tajawal">{s.l}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* hero phone */}
            <div className="relative justify-self-center lg:justify-self-end">
              <div className="absolute inset-0 -z-10 bg-umi-purple/25 blur-[100px] rounded-full" aria-hidden="true" />
              <div className="animate-umi-float">
                <PhoneFrame>
                  <HomeScreen />
                </PhoneFrame>
              </div>
              {/* floating chips */}
              <div className="absolute -right-7 sm:-right-16 top-14 glass border border-umi-teal/30 rounded-2xl px-3.5 py-2.5 shadow-xl z-10">
                <p className="text-[9px] text-umi-muted font-tajawal mb-0.5">تحويل وارد</p>
                <p className="text-sm font-cairo font-black text-umi-teal flex items-center gap-1" dir="ltr">
                  +500.00 <ArrowDownLeft className="w-3.5 h-3.5" />
                </p>
              </div>
              <div className="absolute -left-7 sm:-left-16 bottom-24 glass border border-umi-gold/30 rounded-2xl px-3.5 py-2.5 shadow-xl z-10">
                <p className="text-[9px] text-umi-muted font-tajawal mb-0.5 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-umi-gold" /> كاش باك اليوم
                </p>
                <p className="text-sm font-cairo font-black gold-text" dir="ltr">+27.45</p>
              </div>
            </div>
          </div>
        </section>

        {/* ============ DESIGN SYSTEM ============ */}
        <section id="design-system" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 border-t border-white/6" aria-labelledby="ds-title">
          <SectionHeader
            kicker="01 · نظام التصميم"
            title="لغة بصرية واحدة — من الشاشة إلى الكود"
            desc="ثمانية أدوار لونية مستمدة من هوية نموذجك الأصلي، خطان عربيان مُحسَّنان للقراءة على الداكن، ومكونات قابلة لإعادة الاستخدام في Flutter."
          />
          <div id="ds-title" className="sr-only">قسم نظام التصميم</div>
          <DesignSystem />
        </section>

        {/* ============ MOBILE ============ */}
        <section id="mobile" className="relative py-16 border-t border-white/6 bg-[linear-gradient(180deg,rgba(123,91,199,0.06),transparent_40%)]" aria-labelledby="mob-title">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <SectionHeader
              kicker="02 · تطبيق الموبايل"
              title="خمس شاشات تحكي قصة المستخدم كاملة"
              desc="من فتح المحفظة إلى تحويل ابنك مصروفاً — كل شاشة تعمل الآن داخل المتصفح. اضغط، اكتب، وجرّب بنفسك."
            />
            <div id="mob-title" className="sr-only">قسم تطبيق الموبايل</div>
            <MobileShowcase />

            {/* feature coverage strip */}
            <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { icon: <Smartphone className="w-5 h-5" />, t: "المحفظة والتحويلات", d: "رصيد موحد، إرسال بلوحة أرقام، طلب وسحب" },
                { icon: <Monitor className="w-5 h-5" />, t: "المتاجر والتجار", d: "QR داخل الفرع، عروض، وكاش باك فوري" },
                { icon: <Sparkles className="w-5 h-5" />, t: "الشات مع التحويل", d: "أموال داخل المحادثة بقبول ورفض" },
                { icon: <Fingerprint className="w-5 h-5" />, t: "الحسابات الفرعية", d: "حدود، تجميد، وإشراف كامل لولي الأمر" },
              ].map((f) => (
                <div key={f.t} className="rounded-2xl p-4 umi-card hover:border-umi-gold/35 transition-colors">
                  <span className="w-10 h-10 rounded-xl bg-umi-gold/12 text-umi-gold flex items-center justify-center mb-3">{f.icon}</span>
                  <h3 className="text-sm font-cairo font-bold text-umi-cream mb-1">{f.t}</h3>
                  <p className="text-[11px] text-umi-muted font-tajawal leading-relaxed">{f.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============ WEB ============ */}
        <section id="web" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 border-t border-white/6" aria-labelledby="web-title">
          <SectionHeader
            kicker="03 · تصميم الويب"
            title="لوحة تحكم للويب تكمل التطبيق"
            desc="نفس الهوية واللغة البصرية على شاشة كبيرة: متابعة المعاملات، إدارة التجار والحسابات الفرعية، وتقارير قابلة للتصدير."
          />
          <div id="web-title" className="sr-only">قسم لوحة تحكم الويب</div>
          <WebDashboard />
        </section>
      </main>

      {/* ============ FOOTER ============ */}
      <footer className="mt-auto border-t border-white/8 bg-[#080310]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-umi-goldsoft to-umi-golddeep text-[#1c130a] flex items-center justify-center font-cairo font-black text-sm">U</span>
            <div>
              <p className="font-cairo font-extrabold text-sm text-umi-cream">
                UMI <span className="gold-text">PAY</span>
              </p>
              <p className="text-[10px] text-umi-muted font-tajawal">نظام تصميم جاهز للتنفيذ في Flutter — نسخة 1.0</p>
            </div>
          </div>
          <nav className="flex items-center gap-4 text-[11px] font-tajawal text-umi-muted" aria-label="روابط التذييل">
            <a href="#design-system" className="hover:text-umi-gold transition-colors">نظام التصميم</a>
            <a href="#mobile" className="hover:text-umi-gold transition-colors">الموبايل</a>
            <a href="#web" className="hover:text-umi-gold transition-colors">الويب</a>
          </nav>
          <p className="text-[10px] text-umi-muted/70 font-tajawal">© 2026 UMI PAY — تصميم تجربة المستخدم</p>
        </div>
      </footer>
    </div>
  );
}
