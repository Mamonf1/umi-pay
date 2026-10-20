"use client";

// UMI PAY — قارئ رمز QR (زر المسح في منتصف الشريط السفلي)
// الكاميرا تقرأ رمز محفظة أومي (umipay:<id>) → يظهر اسم المستلم → المبلغ → رمز الدفع → إرسال
// صلاحيات الكاميرا: 3 مسارات دائماً متاحة
//   1) كاميرا حية getUserMedia (تتطلب HTTPS + صلاحية + ليست داخل iframe محجوب)
//   2) التقاط صورة للرمز بكاميرا النظام capture=environment — تعمل داخل المعاينة المدمجة أيضاً
//   3) فتح التطبيق في تبويب جديد عند كشف iframe (المعاينة المدمجة تمنع الكاميرا بسياسة الصلاحيات)
//   4) إدخال يدوي برقم المستلم بنفس المسار تماماً
import { useCallback, useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { Camera, CameraOff, ExternalLink, ImageUp, Keyboard, Loader2, RefreshCw, ScanLine, ShieldCheck } from "lucide-react";
import {
  ScreenHeader, AmountPad, PinPad, ProcessingView, SuccessView, SypAmount,
} from "@/components/umi/real/pads";
import { api } from "@/lib/umi-client";
import { fmtSyp, usdLine, SYP_UNIT } from "@/lib/currency";
import { useRates } from "@/lib/rates";
import type { Me } from "@/lib/umi-types";

type Recipient = { id: string; name: string; avatar: string; phone: string; role: string };

export function QrScannerSheet({
  me, onClose, onDone,
}: { me: Me; onClose: () => void; onDone: () => void }) {
  const { rates } = useRates();
  const [stage, setStage] = useState<"scan" | "amount" | "pin">("scan");
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [camErr, setCamErr] = useState("");
  const [scanKey, setScanKey] = useState(0); // لإعادة تشغيل الكاميرا بعد فشل رمز
  const [manual, setManual] = useState("");
  const [err, setErr] = useState("");
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState<{ ref: string; amount: number } | null>(null);
  const [inIframe, setInIframe] = useState(false); // المعاينة المدمجة تمنع الكاميرا بسياسة الصلاحيات
  const [photoBusy, setPhotoBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const inIframeRef = useRef(false); // ref لأن إغلاق الكاميرا يلتقط القيمة من أول render

  /* كشف iframe: كاميرا getUserMedia محجوبة داخل الإطارات المدمجة إلا إذا سمحت الصفحة الأم */
  useEffect(() => {
    try {
      inIframeRef.current = window.self !== window.top;
    } catch {
      inIframeRef.current = true; // فشل الوصول للأب = نحن داخل إطار بالتأكيد
    }
    setInIframe(inIframeRef.current);
  }, []);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stoppedRef = useRef(false);

  const stopCamera = useCallback(() => {
    stoppedRef.current = true;
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  /** التحقق من رمز ممسوح → إحضار المستلم */
  const resolveCode = useCallback(async (payload: string) => {
    stopCamera();
    try {
      const r = await api<Recipient>(`/api/umi/qr-lookup?code=${encodeURIComponent(payload)}`);
      setRecipient(r);
      setErr("");
      setStage("amount");
    } catch (e) {
      setCamErr((e as Error).message);
    }
  }, [stopCamera]);

  /** البحث اليدوي برقم الجوال */
  const lookupPhone = async () => {
    setErr("");
    if (!/^\d{5,15}$/.test(manual)) {
      setErr("أدخل رقم جوال صحيحاً (أرقام فقط)");
      return;
    }
    try {
      const r = await api<Recipient>(`/api/umi/qr-lookup?phone=${encodeURIComponent(manual)}`);
      stopCamera();
      setRecipient(r);
      setStage("amount");
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  /** تشخيص دقيق لسبب فشل الكاميرا — رسالة مختلفة لكل حالة */
  const describeCamError = (e: unknown): string => {
    const name = (e as DOMException)?.name ?? "";
    if (typeof window !== "undefined" && !window.isSecureContext)
      return "الكاميرا تتطلب اتصالاً آمناً (HTTPS) — افتح التطبيق عبر الرابط الآمن، أو استخدم «التقاط صورة للرمز» بالأسفل.";
    switch (name) {
      case "NotAllowedError":
        return inIframeRef.current
          ? "نافذة المعاينة المدمجة تمنع صلاحية الكاميرا (سياسة أمان المتصفح). افتح التطبيق في تبويب جديد لتفعيل الكاميرا الحية، أو التقط صورة للرمز بالأسفل — تعمل من هنا مباشرة."
          : "صلاحية الكاميرا مرفوضة — اسمح بالوصول للكاميرا لهذا الموقع من إعدادات المتصفح (أيقونة القفل بجانب العنوان)، أو التقط صورة للرمز بالأسفل.";
      case "NotFoundError":
      case "OverconstrainedError":
        return "لا توجد كاميرا متاحة على هذا الجهاز — التقط صورة للرمز أو أدخل رقم المستلم يدوياً بالأسفل.";
      case "NotReadableError":
        return "الكاميرا مستخدمة من تطبيق آخر — أغلق التطبيقات الأخرى وأعد المحاولة.";
      default:
        return "تعذر فتح الكاميرا — التقط صورة للرمز بالكاميرا أو أدخل رقم المستلم يدوياً بالأسفل.";
    }
  };

  /** فك تشفير رمز أومي من صورة ملتقطة (بكاميرا النظام — تعمل داخل المعاينة المدمجة أيضاً) */
  const decodePhoto = (file: File) => {
    setErr("");
    setPhotoBusy(true);
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const maxSide = 1200;
        const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
        const w = Math.max(1, Math.round(img.naturalWidth * scale));
        const h = Math.max(1, Math.round(img.naturalHeight * scale));
        const c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        const cx = c.getContext("2d", { willReadFrequently: true });
        if (!cx) throw new Error("تعذر معالجة الصورة على هذا الجهاز");
        cx.drawImage(img, 0, 0, w, h);

        // محاولة 1: الصورة كاملة — محاولة 2: قص المنتصف (لقطة الكاميرا غالباً تُحيط الرمز بتفاصيل)
        let code: ReturnType<typeof jsQR> = null;
        for (const region of [null, { s: 0.7 }, { s: 0.5 }]) {
          if (region) {
            const sw = Math.round(w * region.s);
            const sh = Math.round(h * region.s);
            const sx = Math.round((w - sw) / 2);
            const sy = Math.round((h - sh) / 2);
            const d = cx.getImageData(sx, sy, sw, sh);
            code = jsQR(d.data, sw, sh, { inversionAttempts: "attemptBoth" });
          } else {
            const d = cx.getImageData(0, 0, w, h);
            code = jsQR(d.data, w, h, { inversionAttempts: "attemptBoth" });
          }
          const payload = code?.data?.trim();
          if (payload?.startsWith("umipay:")) {
            void resolveCode(payload);
            return;
          }
        }
        setCamErr("لم أتعرف على رمز أومي في الصورة — اقترب من الرمز في إضاءة جيدة وأعد التصوير، أو أدخل رقم المستلم يدوياً بالأسفل.");
      } catch (e2) {
        setCamErr((e2 as Error).message || "تعذر تحليل الصورة");
      } finally {
        URL.revokeObjectURL(url);
        setPhotoBusy(false);
        if (fileRef.current) fileRef.current.value = "";
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      setPhotoBusy(false);
      setCamErr("تعذر فتح الصورة — أعد المحاولة.");
    };
    img.src = url;
  };

  const openStandalone = () => {
    try {
      window.open(window.location.href, "_blank", "noopener");
    } catch {
      /* بعض المتصفحات داخل iframe تمنع window.open — المستخدم يمكنه نسخ الرابط */
    }
  };

  /* حلقة الكاميرا والمسح — تعمل في مرحلة scan فقط */
  useEffect(() => {
    if (stage !== "scan") return;
    stoppedRef.current = false;
    let cancelled = false;

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (cancelled || stoppedRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        try { await video.play(); } catch { /* يبدأ تلقائياً عند أول إطار في بعض المتصفحات */ }

        const canvas = canvasRef.current ?? document.createElement("canvas");
        canvasRef.current = canvas;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;

        const tick = () => {
          if (stoppedRef.current) return;
          if (!video.videoWidth || !ctx) {
            rafRef.current = requestAnimationFrame(tick);
            return;
          }
          const w = 480;
          const h = Math.max(1, Math.round((video.videoHeight / video.videoWidth) * w));
          canvas.width = w;
          canvas.height = h;
          ctx.drawImage(video, 0, 0, w, h);
          const img = ctx.getImageData(0, 0, w, h);
          const code = jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" });
          const payload = code?.data?.trim();
          if (payload && payload.startsWith("umipay:")) {
            resolveCode(payload);
            return;
          }
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      } catch (e) {
        if (!cancelled) setCamErr(describeCamError(e));
      }
    };
    start();
    return () => { cancelled = true; stopCamera(); };
  }, [stage, scanKey, resolveCode, stopCamera]);

  const confirmPin = async (code: string) => {
    setProcessing(true);
    setErr("");
    try {
      const r = await api<{ reference: string; amount: number }>("/api/umi/transfer", {
        method: "POST",
        body: JSON.stringify({ fromId: me.id, toId: recipient?.id, amount: Number(amount), note, pin: code }),
      });
      setDone({ ref: r.reference, amount: r.amount });
    } catch (e) {
      setErr((e as Error).message);
      setProcessing(false);
    }
  };

  if (done)
    return (
      <SuccessView
        title="تم التحويل بنجاح"
        amount={done.amount}
        reference={done.ref}
        onDone={onDone}
      />
    );
  if (processing) return <ProcessingView label="جارٍ تنفيذ التحويل" />;

  return (
    <div className="absolute inset-0 z-40 bg-umi-bg flex flex-col">
      <ScreenHeader
        title="مسح رمز QR"
        subtitle={stage === "scan" ? "امسح رمز المستلم لإرسال الأموال" : stage === "amount" ? `إلى: ${recipient?.name}` : "أكّد برمز الدفع"}
        onBack={stage === "scan" ? onClose : stage === "amount" ? () => { setStage("scan"); setCamErr(""); setScanKey((k) => k + 1); } : () => setStage("amount")}
      />

      {/* ============ مرحلة المسح: الكاميرا ============ */}
      {stage === "scan" && (
        <div className="relative flex-1 overflow-hidden bg-black">
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* إطار المسح والتعتيم */}
          {!camErr && (
            <div className="absolute inset-0 grid place-items-center pointer-events-none">
              <div className="relative w-56 h-56">
                <div
                  className="absolute inset-0 rounded-3xl border-2 border-umi-gold/80"
                  style={{ boxShadow: "0 0 0 9999px rgba(5,3,12,0.62)" }}
                />
                <span className="absolute left-5 right-5 h-[2px] bg-umi-gold/90 rounded-full" style={{ top: "50%", animation: "umi-pulse 1.6s ease-in-out infinite" }} />
                {/* أركان الإطار */}
                <span className="absolute -top-0.5 -left-0.5 w-7 h-7 border-t-[3px] border-l-[3px] border-umi-gold rounded-tl-2xl" />
                <span className="absolute -top-0.5 -right-0.5 w-7 h-7 border-t-[3px] border-r-[3px] border-umi-gold rounded-tr-2xl" />
                <span className="absolute -bottom-0.5 -left-0.5 w-7 h-7 border-b-[3px] border-l-[3px] border-umi-gold rounded-bl-2xl" />
                <span className="absolute -bottom-0.5 -right-0.5 w-7 h-7 border-b-[3px] border-r-[3px] border-umi-gold rounded-br-2xl" />
              </div>
            </div>
          )}

          {/* تلميح */}
          {!camErr && (
            <p className="absolute top-5 inset-x-0 text-center text-[11px] font-tajawal text-umi-cream/90 px-8" style={{ textShadow: "0 1px 6px rgba(0,0,0,0.8)" }}>
              وجّه الكاميرا نحو رمز QR الخاص بمحفظة المستلم
            </p>
          )}

          {/* خطأ الكاميرا / رمز غير صالح — مع بدائل الصلاحيات الكاملة */}
          {camErr && (
            <div className="absolute inset-0 grid place-items-center px-6">
              <div className="rounded-3xl p-5 umi-card text-center w-full">
                <div className="w-12 h-12 mx-auto rounded-2xl grid place-items-center mb-3 bg-umi-red/15 border border-umi-red/30">
                  <CameraOff className="w-6 h-6 text-umi-red" />
                </div>
                <p className="text-[11px] font-tajawal text-umi-cream leading-relaxed">{camErr}</p>
                <div className="mt-4 flex flex-col gap-2">
                  <button
                    type="button"
                    disabled={photoBusy}
                    onClick={() => fileRef.current?.click()}
                    className="inline-flex items-center justify-center gap-1.5 px-4 h-10 rounded-xl font-tajawal font-extrabold text-[11.5px] text-[#0a0416] disabled:opacity-50 active:scale-[0.98] transition-all"
                    style={{ background: "linear-gradient(135deg,#f5dfa0,#e8c766)" }}
                  >
                    {photoBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                    {photoBusy ? "جارٍ قراءة الصورة…" : "التقاط صورة للرمز بكاميرا الجهاز"}
                  </button>
                  {inIframe && (
                    <button
                      type="button"
                      onClick={openStandalone}
                      className="inline-flex items-center justify-center gap-1.5 px-4 h-9 rounded-xl font-tajawal font-bold text-[11px] text-umi-teal bg-umi-teal/10 border border-umi-teal/25"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> فتح التطبيق في تبويب جديد لتفعيل الكاميرا الحية
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => { setCamErr(""); setScanKey((k) => k + 1); }}
                    className="inline-flex items-center justify-center gap-1.5 px-4 h-8 rounded-xl font-tajawal text-[10.5px] text-umi-muted"
                  >
                    <RefreshCw className="w-3 h-3" /> إعادة محاولة الكاميرا الحية
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* التقاط صورة للرمز — يعمل داخل المعاينة المدمجة (يفتح كاميرا النظام) */}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) decodePhoto(f);
            }}
          />

          {/* الإدخال اليدوي — بديل دائم أسفل الكاميرا */}
          <div className="absolute bottom-5 inset-x-0 px-5">
            <div className="rounded-2xl p-3 bg-[#0d0719]/92 backdrop-blur border border-white/10">
              <p className="flex items-center gap-1.5 text-[10px] font-tajawal text-umi-muted mb-2">
                <Keyboard className="w-3.5 h-3.5" /> أو أدخل رقم مستلم المحفظة يدوياً
              </p>
              <div className="flex gap-2">
                <input
                  value={manual}
                  onChange={(e) => setManual(e.target.value.replace(/\D/g, ""))}
                  onKeyDown={(e) => { if (e.key === "Enter") lookupPhone(); }}
                  inputMode="numeric"
                  dir="ltr"
                  placeholder="مثال: 7782416"
                  className="flex-1 h-10 rounded-xl bg-white/5 border border-white/10 px-3.5 text-left font-cairo text-[12px] text-umi-cream placeholder:text-umi-muted/50 outline-none focus:border-umi-gold/40"
                />
                <button
                  type="button"
                  onClick={lookupPhone}
                  className="px-4 h-10 rounded-xl font-tajawal font-extrabold text-[11px] text-[#0a0416] disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg,#f5dfa0,#e8c766)" }}
                >
                  تحقق
                </button>
              </div>
              {err && <p className="text-[10px] font-tajawal text-umi-red mt-1.5">{err}</p>}
            </div>
          </div>
        </div>
      )}

      {/* ============ مرحلة المبلغ: المستلم ظاهر ============ */}
      {stage === "amount" && recipient && (
        <div className="flex-1 overflow-y-auto umi-scroll pb-6">
          <div className="px-4 pt-1">
            <div className="rounded-2xl p-4 umi-card flex items-center gap-3">
              <span className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 grid place-items-center text-2xl shrink-0">{recipient.avatar}</span>
              <span className="flex-1 min-w-0">
                <span className="block text-[13.5px] font-cairo font-extrabold text-umi-cream truncate">{recipient.name}</span>
                <span className="block text-[10px] font-tajawal text-umi-muted" dir="ltr">{recipient.phone}</span>
              </span>
              <span className="text-[9px] font-tajawal text-umi-gold px-2 py-0.5 rounded-full bg-umi-gold/10 shrink-0">
                {recipient.role === "merchant" ? "تاجر" : recipient.role === "admin" ? "الإدارة" : "شخصي"}
              </span>
            </div>
            <p className="flex items-center gap-1.5 text-[10px] font-tajawal text-umi-teal mt-2 px-1">
              <ScanLine className="w-3.5 h-3.5" /> تم التحقق من المستلم بنجاح — اكتب المبلغ وأرسل
            </p>
          </div>

          <div className="mt-2">
            <AmountPad
              value={amount}
              onChange={setAmount}
              hint={`الرصيد: ${fmtSyp(me.balance)} ${SYP_UNIT} · ${usdLine(me.balance, rates.usdSyp)}`}
            />
          </div>

          <div className="px-4 mt-3">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="ملاحظة (اختياري)"
              className="w-full h-10 rounded-xl umi-card bg-transparent px-3.5 font-cairo text-[12px] text-umi-cream placeholder:text-umi-muted/50 outline-none focus:border-umi-gold/40"
            />
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

      {/* ============ مرحلة رمز الدفع ============ */}
      {stage === "pin" && recipient && (
        <div className="flex-1 overflow-y-auto umi-scroll px-4">
          <div className="rounded-2xl umi-card p-4 mb-2 text-center">
            <p className="text-[11px] font-tajawal text-umi-muted flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-umi-teal" /> تحويل إلى {recipient.name}
            </p>
            <SypAmount amount={Number(amount) || 0} />
            {note && <p className="text-[10px] font-tajawal text-umi-muted">ملاحظة: {note}</p>}
          </div>
          <PinPad onComplete={confirmPin} error={err} title="أدخل رمز الدفع (4 أرقام)" />
        </div>
      )}
    </div>
  );
}
