"use client";

// UMI PAY — المتاجر وبوابة الدفع (بالليرة السورية + رمز دفع 4 أرقام)
// + لوحة معلومات API للتاجر (معرّف المتجر + مفتاح الربط + رابط الإشعارات + نقاط النهاية)
import { useCallback, useEffect, useState } from "react";
import {
  ShieldCheck, Code2, KeyRound, Copy, Eye, EyeOff, RefreshCw,
  Webhook, Check, ChevronDown, ChevronUp, Terminal,
} from "lucide-react";
import { StatusBar } from "@/components/umi/shell";
import { ScreenHeader, AmountPad, PinPad, ProcessingView, SypAmount } from "@/components/umi/real/pads";
import { api } from "@/lib/umi-client";
import { fmtSyp, usdLine, SYP_UNIT } from "@/lib/currency";
import { relTime } from "@/lib/umi-types";
import type { Me, MerchantT } from "@/lib/umi-types";

export function StoresScreen({ me, onExit, onPaid }: { me: Me; onExit: () => void; onPaid: () => void }) {
  const [merchants, setMerchants] = useState<MerchantT[] | null>(null);
  const [picked, setPicked] = useState<MerchantT | null>(null);
  const [amount, setAmount] = useState("");
  const [stage, setStage] = useState<"pick" | "amount" | "pin" | "processing">("pick");
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState<{ ref: string; amount: number; merchant: string } | null>(null);

  useEffect(() => {
    api<{ merchants: MerchantT[] }>("/api/umi/merchants")
      .then((d) => setMerchants(d.merchants))
      .catch(() => setMerchants([]));
  }, []);

  const pay = async (code: string) => {
    setStage("processing");
    setErr("");
    try {
      const r = await api<{ reference: string; amount: number; merchant: string }>("/api/umi/checkout", {
        method: "POST",
        body: JSON.stringify({ userId: me.id, merchantId: picked?.id, amount: Number(amount), pin: code }),
      });
      setSuccess({ ref: r.reference, amount: r.amount, merchant: r.merchant });
    } catch (e) {
      setErr((e as Error).message);
      setStage("pin");
    }
  };

  if (success)
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center px-8 text-center bg-umi-bg">
        <div className="w-20 h-20 rounded-full grid place-items-center mb-5 umi-glow" style={{ background: "linear-gradient(135deg,#f5dfa0,#e8c766 55%,#c99b3f)" }}>
          <ShieldCheck className="w-10 h-10 text-[#0a0416]" strokeWidth={2.6} />
        </div>
        <h3 className="font-cairo font-extrabold text-xl text-umi-cream mb-1">تم الدفع بنجاح</h3>
        <SypAmount amount={success.amount} />
        <p className="text-[12px] font-tajawal text-umi-cream">{success.merchant}</p>
        <p className="text-[11px] font-tajawal text-umi-muted mt-1" dir="ltr">{success.ref}</p>
        <button
          type="button"
          onClick={() => { onPaid(); }}
          className="mt-6 h-11 px-8 rounded-xl font-cairo font-extrabold text-sm text-[#0a0416]"
          style={{ background: "linear-gradient(135deg,#f5dfa0,#e8c766 55%,#c99b3f)" }}
        >
          عودة للمحفظة
        </button>
      </div>
    );
  if (stage === "processing") return <ProcessingView label="جارٍ تنفيذ الدفع عبر بوابة أومي" />;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-umi-bg">
      <ScreenHeader
        title="المتاجر"
        subtitle={stage === "pick" ? "بوابة دفع أومي — بالليرة السورية" : stage === "amount" ? `الدفع لـ ${picked?.name}` : "أكّد برمز الدفع"}
        onBack={stage === "pick" ? onExit : stage === "amount" ? () => setStage("pick") : () => setStage("amount")}
      />
      <div className="flex-1 overflow-y-auto umi-scroll pb-24">
        {stage === "pick" && (
          <>
            {me.role === "merchant" && <MerchantApiPanel me={me} />}
            <div className="px-4 grid grid-cols-2 gap-2.5">
            {merchants === null && <p className="col-span-2 text-center text-umi-muted text-[11px] font-tajawal pt-10 animate-pulse">جارٍ التحميل…</p>}
            {merchants?.length === 0 && (
              <p className="col-span-2 text-center text-[11px] font-tajawal text-umi-muted py-10 leading-relaxed">
                لا توجد متاجر بعد — سجّل حساب تاجر وسيظهر متجرك هنا تلقائياً
              </p>
            )}
            {merchants?.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => { setPicked(m); setStage("amount"); }}
                className="rounded-2xl umi-card p-3.5 text-right active:bg-white/10 transition-colors"
              >
                <span
                  className="w-11 h-11 rounded-2xl grid place-items-center text-xl mb-2"
                  style={{ background: `${m.color}22`, border: `1px solid ${m.color}55` }}
                >
                  {m.emoji}
                </span>
                <span className="block text-[12px] font-tajawal font-bold text-umi-cream truncate">{m.name}</span>
                <span className="block text-[9px] font-tajawal text-umi-muted">{m.category}</span>
              </button>
            ))}
            </div>
          </>
        )}

        {stage === "amount" && picked && (
          <div>
            <AmountPad value={amount} onChange={setAmount} accent={picked.color} hint={`الرصيد: ${fmtSyp(me.balance)} ${SYP_UNIT}`} />
            <div className="px-4">
              <button
                type="button"
                disabled={!Number(amount)}
                onClick={() => setStage("pin")}
                className="w-full h-11 mt-3 rounded-xl font-cairo font-extrabold text-sm text-[#0a0416] disabled:opacity-40 active:scale-[0.98] transition-all"
                style={{ background: "linear-gradient(135deg,#f5dfa0,#e8c766 55%,#c99b3f)" }}
              >
                متابعة — رمز الدفع
              </button>
            </div>
          </div>
        )}

        {stage === "pin" && picked && (
          <div className="px-4">
            <div className="rounded-2xl umi-card p-4 mb-2 text-center">
              <p className="text-[11px] font-tajawal text-umi-muted">دفع لـ {picked.emoji} {picked.name}</p>
              <SypAmount amount={Number(amount) || 0} />
            </div>
            <PinPad onComplete={pay} error={err} title="رمز الدفع — 4 أرقام فقط" />
          </div>
        )}
      </div>
    </div>
  );
}

/* ============ لوحة معلومات API — للتاجر فقط ============ */
interface MerchantApiT {
  merchantId: string;
  name: string;
  category: string;
  apiKey: string;
  keyCreatedAt: string | null;
  webhookUrl: string | null;
}

function MerchantApiPanel({ me }: { me: Me }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<MerchantApiT | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState("");
  const [webhook, setWebhook] = useState("");
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [regenArmed, setRegenArmed] = useState(false);
  const [regenBusy, setRegenBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const load = useCallback(() => {
    api<MerchantApiT>(`/api/umi/merchant-api?userId=${me.id}`)
      .then((d) => {
        setData(d);
        setWebhook(d.webhookUrl ?? "");
      })
      .catch((e) => setErr((e as Error).message));
  }, [me.id]);

  // يُحمّل عند أول توسيع — يولّد المفتاح تلقائياً عند أول مرة
  useEffect(() => {
    if (open && !data) load();
  }, [open, data, load]);

  const copy = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch { /* تجاهل */ }
      document.body.removeChild(ta);
    }
    setCopied(what);
    setTimeout(() => setCopied(""), 1600);
  };

  const regenerate = async () => {
    if (!regenArmed) {
      setRegenArmed(true);
      setTimeout(() => setRegenArmed(false), 4000);
      return;
    }
    setRegenBusy(true); setMsg(""); setErr("");
    try {
      const r = await api<MerchantApiT & { message: string }>("/api/umi/merchant-api", {
        method: "POST",
        body: JSON.stringify({ userId: me.id, action: "regenerate" }),
      });
      setData((d) => (d ? { ...d, apiKey: r.apiKey, keyCreatedAt: r.keyCreatedAt } : d));
      setMsg(r.message);
      setShowKey(true);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setRegenBusy(false);
      setRegenArmed(false);
    }
  };

  const saveWebhook = async () => {
    setSavingWebhook(true); setMsg(""); setErr(""); setTestResult(null);
    try {
      const r = await api<{ webhookUrl: string | null; message: string }>("/api/umi/merchant-api", {
        method: "POST",
        body: JSON.stringify({ userId: me.id, action: "webhook", url: webhook }),
      });
      setData((d) => (d ? { ...d, webhookUrl: r.webhookUrl } : d));
      setMsg(r.message);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSavingWebhook(false);
    }
  };

  // اختبار الرابط: يرسل إشعار ping حقيقي إلى المكتوب في الحقل ويعرض نتيجة الوصول
  const testWebhook = async () => {
    setTesting(true); setMsg(""); setErr(""); setTestResult(null);
    try {
      const r = await api<{ delivered: boolean; httpStatus: number | null; tookMs: number; message: string }>(
        "/api/umi/merchant-api",
        { method: "POST", body: JSON.stringify({ userId: me.id, action: "test", url: webhook }) },
      );
      setTestResult({ ok: r.delivered, text: r.message });
    } catch (e) {
      setTestResult({ ok: false, text: (e as Error).message });
    } finally {
      setTesting(false);
    }
  };

  const maskedKey = data ? `${data.apiKey.slice(0, 12)}${"•".repeat(18)}` : "";

  return (
    <div className="px-4 pt-4">
      <div className="rounded-2xl umi-card overflow-hidden">
        {/* رأس القسم */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center gap-3 p-4 text-right active:bg-white/5 transition-colors"
        >
          <span className="w-10 h-10 rounded-xl grid place-items-center shrink-0" style={{ background: "rgba(123,91,199,0.18)", border: "1px solid rgba(123,91,199,0.45)" }}>
            <Code2 className="w-5 h-5 text-[#b8a4e8]" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[12.5px] font-tajawal font-bold text-umi-cream">معلومات API</p>
            <p className="text-[9.5px] font-tajawal text-umi-muted">اربط متجرك ببوابة أومي — مفتاح الربط والإشعارات</p>
          </div>
          {open ? <ChevronUp className="w-4 h-4 text-umi-muted shrink-0" /> : <ChevronDown className="w-4 h-4 text-umi-muted shrink-0" />}
        </button>

        {open && (
          <div className="px-4 pb-4">
            {err && <p className="text-[10.5px] font-tajawal text-umi-red text-center mb-2">{err}</p>}
            {msg && <p className="text-[10.5px] font-tajawal text-umi-teal text-center mb-2">{msg}</p>}
            {!data && <p className="text-[10px] font-tajawal text-umi-muted text-center py-3 animate-pulse">جارٍ تجهيز مفاتيح الربط…</p>}

            {data && (
              <>
                {/* معرّف التاجر */}
                <p className="text-[10px] font-tajawal font-bold text-umi-muted mb-1">معرّف التاجر (Merchant ID)</p>
                <div className="flex items-center gap-2 mb-3">
                  <code className="flex-1 h-10 rounded-xl bg-white/5 border border-white/10 px-3 flex items-center text-[11px] text-umi-cream overflow-hidden" dir="ltr">
                    <span className="truncate">{data.merchantId}</span>
                  </code>
                  <button
                    type="button"
                    onClick={() => copy(data.merchantId, "id")}
                    className="w-10 h-10 rounded-xl umi-card grid place-items-center text-umi-gold shrink-0"
                    aria-label="نسخ المعرف"
                  >
                    {copied === "id" ? <Check className="w-4 h-4 text-umi-teal" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                {/* مفتاح API */}
                <p className="text-[10px] font-tajawal font-bold text-umi-muted mb-1">مفتاح API السري</p>
                <div className="flex items-center gap-2 mb-1.5">
                  <code className="flex-1 h-10 rounded-xl bg-white/5 border border-white/10 px-3 flex items-center text-[11px] text-umi-cream overflow-hidden" dir="ltr">
                    <span className="truncate">{showKey ? data.apiKey : maskedKey}</span>
                  </code>
                  <button
                    type="button"
                    onClick={() => setShowKey((s) => !s)}
                    className="w-10 h-10 rounded-xl umi-card grid place-items-center text-umi-gold shrink-0"
                    aria-label={showKey ? "إخفاء المفتاح" : "إظهار المفتاح"}
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => copy(data.apiKey, "key")}
                    className="w-10 h-10 rounded-xl umi-card grid place-items-center text-umi-gold shrink-0"
                    aria-label="نسخ المفتاح"
                  >
                    {copied === "key" ? <Check className="w-4 h-4 text-umi-teal" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[8.5px] font-tajawal text-umi-muted">
                    {data.keyCreatedAt ? `وُلّد ${relTime(data.keyCreatedAt)}` : ""}
                  </p>
                  <button
                    type="button"
                    onClick={regenerate}
                    disabled={regenBusy}
                    className={`h-7 px-2.5 rounded-full text-[9px] font-tajawal font-bold flex items-center gap-1 transition-colors disabled:opacity-40 ${regenArmed ? "text-umi-red" : "text-umi-muted"}`}
                    style={regenArmed ? { background: "rgba(200,123,123,0.12)", border: "1px solid rgba(200,123,123,0.45)" } : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
                  >
                    <RefreshCw className={`w-3 h-3 ${regenBusy ? "animate-spin" : ""}`} />
                    {regenArmed ? "اضغط مجدداً للتأكيد" : "توليد مفتاح جديد"}
                  </button>
                </div>

                {/* رابط الإشعارات */}
                <p className="text-[10px] font-tajawal font-bold text-umi-muted mb-1">رابط استلام الإشعارات (Webhook)</p>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="flex-1 relative">
                    <Webhook className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-umi-muted/60" />
                    <input
                      value={webhook}
                      onChange={(e) => setWebhook(e.target.value)}
                      dir="ltr"
                      placeholder="https://your-site.com/api/umi/webhook"
                      className="w-full h-10 rounded-xl bg-white/5 border border-white/10 pr-9 pl-3 text-left font-cairo text-[10.5px] text-umi-cream placeholder:text-umi-muted/40 outline-none focus:border-umi-gold/40"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={testing || savingWebhook || !webhook.trim()}
                    onClick={testWebhook}
                    className="h-10 px-3 rounded-xl font-tajawal font-bold text-[10.5px] text-umi-cream disabled:opacity-40 shrink-0"
                    style={{ background: "rgba(123,91,199,0.22)", border: "1px solid rgba(123,91,199,0.5)" }}
                  >
                    {testing ? "…" : "اختبار"}
                  </button>
                  <button
                    type="button"
                    disabled={savingWebhook}
                    onClick={saveWebhook}
                    className="h-10 px-4 rounded-xl font-tajawal font-bold text-[10.5px] text-[#0a0416] disabled:opacity-40 shrink-0"
                    style={{ background: "linear-gradient(135deg,#f5dfa0,#e8c766)" }}
                  >
                    {savingWebhook ? "…" : "حفظ"}
                  </button>
                </div>
                {testResult && (
                  <p
                    className={`text-[9.5px] font-tajawal leading-relaxed mb-2 px-3 py-2 rounded-xl ${testResult.ok ? "text-umi-teal" : "text-umi-red"}`}
                    style={{ background: testResult.ok ? "rgba(126,217,176,0.08)" : "rgba(200,123,123,0.08)", border: `1px solid ${testResult.ok ? "rgba(126,217,176,0.3)" : "rgba(200,123,123,0.3)"}` }}
                  >
                    {testResult.text}
                  </p>
                )}
                <p className="text-[8.5px] font-tajawal text-umi-muted leading-relaxed mb-3">
                  اكتب رابطاً كاملاً في موقعك يستقبل POST — مثال: https://omniastore.space-z.ai/api/umi/webhook — ويُرسل مع كل إشعار توقيع X-UMI-Signature للتحقق منه
                </p>

                {/* نقاط النهاية */}
                <p className="flex items-center gap-1.5 text-[10px] font-tajawal font-bold text-umi-muted mt-4 mb-1.5">
                  <Terminal className="w-3.5 h-3.5" /> نقاط النهاية المتاحة
                </p>
                <div className="rounded-xl overflow-hidden border border-white/10 divide-y divide-white/5">
                  {[
                    { m: "POST", p: "/api/umi/checkout", d: "الدفع لمتجرك داخل تطبيق أومي برمز الدفع" },
                    { m: "GET", p: "/api/umi/transactions?userId=…", d: "سجل معاملات المتجر الكامل" },
                    { m: "POST", p: "Webhook لديك", d: "إشعار فوري عند كل عملية دفع مع توقيع X-UMI-Signature (HMAC-SHA256 بمفتاحك)" },
                  ].map((e) => (
                    <div key={e.m + e.p} className="px-3 py-2.5 bg-white/[0.02]">
                      <p className="flex items-center gap-1.5" dir="ltr">
                        <span className="text-[8px] font-cairo font-black px-1.5 py-0.5 rounded" style={{ background: "rgba(232,199,102,0.15)", color: "#e8c766" }}>{e.m}</span>
                        <code className="text-[9.5px] text-umi-cream truncate">{e.p}</code>
                      </p>
                      <p className="text-[9px] font-tajawal text-umi-muted mt-0.5">{e.d}</p>
                    </div>
                  ))}
                </div>

                {/* تنبيه أمان */}
                <div className="rounded-xl p-3 mt-3" style={{ border: "1px solid rgba(200,123,123,0.3)", background: "rgba(200,123,123,0.06)" }}>
                  <p className="flex items-center gap-1.5 text-[9.5px] font-tajawal font-bold text-umi-red mb-0.5">
                    <KeyRound className="w-3 h-3" /> احتفظ بمفتاحك
                  </p>
                  <p className="text-[9px] font-tajawal text-umi-muted leading-relaxed">
                    لا تشارك مفتاح API مع أي أحد — يُستخدم للتحقق من هوية متجرك. إذا تسرب، ولّد مفتاحاً جديداً فوراً
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
