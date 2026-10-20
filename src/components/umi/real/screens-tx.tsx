"use client";

// UMI PAY — تفاصيل العملية + التقارير
// • ضغط على أي عملية (أرسلت أو استلمت) → ورقة تفاصيل فيها: مشاركة إيصال PDF على وسائل التواصل
//   + إضافة الطرف إلى قائمة الأصدقاء + طلب مشاركة التقرير منه
// • شاشة التقارير: تقرير من تاريخ إلى تاريخ + تقرير آخر 10 عمليات + مشاركة التقرير PDF
import { useCallback, useEffect, useState } from "react";
import {
  FileDown, Share2, UserPlus, FileText, CalendarRange, ListOrdered,
  MessageCircleReply, ExternalLink,
} from "lucide-react";
import { ScreenHeader, TxRow } from "@/components/umi/real/pads";
import { StatusBar } from "@/components/umi/shell";
import { api } from "@/lib/umi-client";
import { fmtSyp, usdLine, SYP_UNIT } from "@/lib/currency";
import { relTime, TYPE_LABELS, type Me, type TxItem } from "@/lib/umi-types";
import { useRates } from "@/lib/rates";

/* ============ مشاركة ملف PDF: مشاركة نظام أولاً (وسائل التواصل) ثم تنزيل ============ */
export async function sharePdfFile(url: string, filename: string): Promise<"shared" | "downloaded"> {
  const res = await fetch(url);
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.error ?? "تعذر توليد الملف");
  }
  const blob = await res.blob();
  const file = new File([blob], filename, { type: "application/pdf" });
  const nav = navigator as Navigator & { canShare?: (d: unknown) => boolean; share?: (d: unknown) => Promise<void> };
  if (nav.canShare?.({ files: [file] }) && nav.share) {
    await nav.share({ files: [file], title: "أومي باي — مستند مالي", text: "مستند من محفظة أومي باي UMI PAY" });
    return "shared";
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  return "downloaded";
}

const btnGold = "w-full h-11 rounded-xl font-cairo font-bold text-[13px] text-[#0a0416] disabled:opacity-40 active:scale-[0.98] transition-all flex items-center justify-center gap-2";
const goldStyle = { background: "linear-gradient(135deg,#f5dfa0,#e8c766)" };
const btnSub = "flex-1 h-10 rounded-xl bg-white/5 border border-white/10 text-[11px] font-tajawal font-bold text-umi-cream active:bg-white/10 flex items-center justify-center gap-1.5 disabled:opacity-40";

/* ============ ورقة تفاصيل العملية ============ */
export function TransactionDetailSheet({
  me, txId, onClose, onChanged,
}: {
  me: Me;
  txId: string;
  onClose: () => void;
  onChanged?: () => void;
}) {
  const { rates } = useRates();
  const [tx, setTx] = useState<TxItem | null>(null);
  const [peerUserId, setPeerUserId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setTx(null); setMsg(""); setErr("");
    api<{ tx: TxItem; peerUserId: string | null }>(`/api/umi/transactions?userId=${me.id}&txId=${txId}`)
      .then((d) => { setTx(d.tx); setPeerUserId(d.peerUserId); })
      .catch((e) => setErr((e as Error).message));
  }, [txId, me.id]);

  const shareReceipt = async () => {
    setBusy(true); setErr(""); setMsg("");
    try {
      const r = await sharePdfFile(`/api/umi/receipt-pdf?txId=${txId}&userId=${me.id}`, `umi-receipt-${tx?.reference ?? txId}.pdf`);
      setMsg(r === "shared" ? "فُتحت مشاركة النظام — اختر التطبيق ✓" : "نُزّل الإيصال PDF إلى جهازك ✓");
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };

  const addFriend = async () => {
    if (!peerUserId) return;
    setBusy(true); setErr(""); setMsg("");
    try {
      const r = await api<{ message: string }>("/api/umi/friends", { method: "POST", body: JSON.stringify({ userId: me.id, friendId: peerUserId }) });
      setMsg(r.message); onChanged?.();
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };

  const requestReport = async () => {
    if (!peerUserId) return;
    setBusy(true); setErr(""); setMsg("");
    try {
      await api("/api/umi/chat", { method: "POST", body: JSON.stringify({ userId: me.id, peerId: peerUserId, requestReport: true }) });
      setMsg("أُرسل طلب مشاركة التقرير إلى الطرف الآخر ✓ — سيصلك كشفه في المحادثة");
      onChanged?.();
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };

  const isIn = tx?.direction === "in";
  return (
    <div className="absolute inset-0 z-50 bg-umi-bg flex flex-col">
      <StatusBar />
      <ScreenHeader title="تفاصيل العملية" subtitle="اضغط مشاركة لإرسال الإيصال PDF لأي تطبيق" onBack={onClose} />
      <div className="flex-1 overflow-y-auto umi-scroll px-4 pb-8">
        {!tx && !err && <p className="text-center text-umi-muted text-[11px] font-tajawal pt-10 animate-pulse">جارٍ التحميل…</p>}
        {err && !tx && <p className="text-center text-[11px] font-tajawal text-umi-red pt-10">{err}</p>}
        {tx && (
          <>
            <div className={`rounded-[24px] p-5 text-center mb-3 ${isIn ? "umi-card" : "umi-hero"}`}>
              <span className="w-12 h-12 mx-auto rounded-2xl bg-black/20 border border-white/10 grid place-items-center text-2xl mb-2">{tx.emoji}</span>
              <p className="text-[10px] font-tajawal text-umi-muted mb-1">{isIn ? "عملية واردة من" : "عملية صادرة إلى"} {tx.counterparty}</p>
              <p className="font-cairo font-black text-[30px] leading-tight gold-text" dir="ltr">
                {isIn ? "+" : "−"}{fmtSyp(tx.amount)} <span className="text-xs font-tajawal text-umi-cream/70">{SYP_UNIT}</span>
              </p>
              <p className="text-[10px] font-tajawal text-umi-teal" dir="ltr">{usdLine(tx.amount, rates.usdSyp)}</p>
              <span className="inline-block mt-2 px-3 py-1 rounded-full bg-black/20 text-[9.5px] font-tajawal text-umi-cream/80">
                {TYPE_LABELS[tx.type]} · {tx.status === "completed" ? "مكتملة ✓" : tx.status}
              </span>
            </div>

            <div className="rounded-2xl p-4 umi-card mb-3">
              <div className="flex justify-between items-center py-2 border-b border-white/5"><span className="text-[10px] font-tajawal text-umi-muted">رقم المرجع</span><b dir="ltr" className="text-[11px] font-tajawal text-umi-cream">{tx.reference}</b></div>
              <div className="flex justify-between items-center py-2 border-b border-white/5"><span className="text-[10px] font-tajawal text-umi-muted">الطرف</span><b className="text-[11px] font-tajawal text-umi-cream">{tx.counterparty}</b></div>
              <div className="flex justify-between items-center py-2 border-b border-white/5"><span className="text-[10px] font-tajawal text-umi-muted">التاريخ</span><b className="text-[11px] font-tajawal text-umi-cream">{relTime(tx.createdAt)}</b></div>
              {tx.note && <div className="flex justify-between items-center py-2"><span className="text-[10px] font-tajawal text-umi-muted">ملاحظة</span><b className="text-[11px] font-tajawal text-umi-cream">{tx.note}</b></div>}
            </div>

            {msg && <p className="text-[10.5px] font-tajawal text-umi-teal text-center mb-2">{msg}</p>}
            {err && <p className="text-[10.5px] font-tajawal text-umi-red text-center mb-2">{err}</p>}

            <button type="button" disabled={busy} onClick={shareReceipt} className={`${btnGold} mb-2`} style={goldStyle}>
              <Share2 className="w-4 h-4" /> مشاركة الإيصال PDF — وسائل التواصل
            </button>
            <div className="flex gap-2 mb-2">
              <a href={`/api/umi/receipt-pdf?txId=${txId}&userId=${me.id}`} target="_blank" rel="noreferrer" className={btnSub} style={{ textDecoration: "none" }}>
                <ExternalLink className="w-3.5 h-3.5 text-umi-gold" /> فتح PDF
              </a>
              {peerUserId && (
                <button type="button" disabled={busy} onClick={addFriend} className={btnSub}>
                  <UserPlus className="w-3.5 h-3.5 text-umi-gold" /> إضافة إلى الأصدقاء
                </button>
              )}
            </div>
            {peerUserId && (
              <button type="button" disabled={busy} onClick={requestReport} className={btnSub + " w-full"}>
                <MessageCircleReply className="w-3.5 h-3.5 text-umi-purplight" /> طلب مشاركة التقرير من الطرف الآخر
              </button>
            )}
            <p className="text-[9.5px] font-tajawal text-umi-muted leading-relaxed mt-3 text-center">
              الإيصال PDF بهوية أومي باي الكاملة — يمكن مشاركته على واتساب/تلغرام أو حفظه كدليل رسمي بالعملية.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

/* ============ شاشة التقارير ============ */
export function ReportsScreen({ me, onClose, onOpenTx }: { me: Me; onClose: () => void; onOpenTx?: (id: string) => void }) {
  const { rates } = useRates();
  const [mode, setMode] = useState<"range" | "last10">("range");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState<{ summary: { count: number; totalIn: number; totalOut: number; net: number }; txs: (TxItem & { peerUserId?: string | null })[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [peerNames, setPeerNames] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true); setErr(""); setMsg("");
    try {
      const q = mode === "last10" ? `last=10` : `from=${from || "2020-01-01"}&to=${to || new Date().toISOString().slice(0, 10)}`;
      const d = await api<{ summary: { count: number; totalIn: number; totalOut: number; net: number }; txs: (TxItem & { peerUserId?: string | null })[] }>(`/api/umi/reports?userId=${me.id}&${q}`);
      setData(d);
      // أسماء الأطراف المقابلة لتفعيل الإضافة كصديق من الصف
      const ids = Array.from(new Set(d.txs.map((t) => t.peerUserId).filter(Boolean))) as string[];
      if (ids.length) {
        const map: Record<string, string> = {};
        await Promise.all(ids.map(async (id) => {
          try { const r = await api<{ id: string; name: string }>(`/api/umi/qr-lookup?code=umipay:${id}`); map[id] = r.name; } catch { /* تجاهل */ }
        }));
        setPeerNames(map);
      } else setPeerNames({});
    } catch (e) {
      setErr((e as Error).message);
    } finally { setLoading(false); }
  }, [mode, from, to, me.id]);

  const reportUrl = mode === "last10"
    ? `/api/umi/report-pdf?userId=${me.id}&last=10`
    : `/api/umi/report-pdf?userId=${me.id}&from=${from || "2020-01-01"}&to=${to || new Date().toISOString().slice(0, 10)}`;

  const shareReport = async () => {
    setBusyMsg("جارٍ التوليد…"); setErr("");
    try {
      const r = await sharePdfFile(reportUrl, `umi-report-${Date.now()}.pdf`);
      setMsg(r === "shared" ? "فُتحت مشاركة النظام — اختر التطبيق ✓" : "نُزّل التقرير PDF إلى جهازك ✓");
    } catch (e) { setErr((e as Error).message); } finally { setBusyMsg(""); }
  };
  const [busyMsg, setBusyMsg] = useState("");

  const addFriendRow = async (peerId: string) => {
    setErr(""); setMsg("");
    try {
      const r = await api<{ message: string }>("/api/umi/friends", { method: "POST", body: JSON.stringify({ userId: me.id, friendId: peerId }) });
      setMsg(r.message);
    } catch (e) { setErr((e as Error).message); }
  };
  const requestReportRow = async (peerId: string) => {
    setErr(""); setMsg("");
    try {
      await api("/api/umi/chat", { method: "POST", body: JSON.stringify({ userId: me.id, peerId, requestReport: true }) });
      setMsg("أُرسل طلب مشاركة التقرير ✓");
    } catch (e) { setErr((e as Error).message); }
  };

  const rangeReady = mode === "last10" || (from || to);

  return (
    <div className="absolute inset-0 z-40 bg-umi-bg flex flex-col">
      <StatusBar />
      <ScreenHeader title="تقاريري" subtitle="كشوف عمليات قابلة للمشاركة PDF" onBack={onClose} />
      <div className="flex-1 overflow-y-auto umi-scroll px-4 pb-8">
        {/* اختيار نوع التقرير */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button type="button" onClick={() => { setMode("range"); setData(null); }}
            className={`h-11 rounded-xl flex items-center justify-center gap-1.5 text-[11.5px] font-tajawal font-bold border ${mode === "range" ? "text-[#0a0416] border-transparent" : "text-umi-muted umi-card"}`}
            style={mode === "range" ? goldStyle : undefined}>
            <CalendarRange className="w-4 h-4" /> من تاريخ إلى تاريخ
          </button>
          <button type="button" onClick={() => { setMode("last10"); setData(null); }}
            className={`h-11 rounded-xl flex items-center justify-center gap-1.5 text-[11.5px] font-tajawal font-bold border ${mode === "last10" ? "text-[#0a0416] border-transparent" : "text-umi-muted umi-card"}`}
            style={mode === "last10" ? goldStyle : undefined}>
            <ListOrdered className="w-4 h-4" /> آخر 10 عمليات
          </button>
        </div>

        {mode === "range" && (
          <div className="rounded-2xl p-4 umi-card mb-3">
            <p className="text-[11px] font-tajawal font-bold text-umi-cream mb-2.5">اختر الفترة</p>
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="text-[9.5px] font-tajawal text-umi-muted block mb-1">من تاريخ</span>
                <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
                  className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-2.5 text-[11px] font-tajawal text-umi-cream outline-none focus:border-umi-gold/40" dir="ltr" />
              </label>
              <label className="block">
                <span className="text-[9.5px] font-tajawal text-umi-muted block mb-1">إلى تاريخ</span>
                <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
                  className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-2.5 text-[11px] font-tajawal text-umi-cream outline-none focus:border-umi-gold/40" dir="ltr" />
              </label>
            </div>
            <p className="text-[9px] font-tajawal text-umi-muted mt-2">اترك الحقلين فارغين لتقرير كل العمليات</p>
          </div>
        )}

        <div className="flex gap-2 mb-3">
          <button type="button" disabled={loading || !rangeReady} onClick={load} className={btnGold} style={goldStyle}>
            <FileText className="w-4 h-4" /> {loading ? "جارٍ التحميل…" : "إنشاء التقرير"}
          </button>
          <a href={reportUrl} target="_blank" rel="noreferrer" className={btnSub} style={{ textDecoration: "none", flex: "0 0 auto", width: 56 }}>
            <ExternalLink className="w-4 h-4 text-umi-gold" />
          </a>
        </div>
        {data && (
          <button type="button" onClick={shareReport} disabled={!!busyMsg} className={`${btnGold} mb-3`} style={{ background: "linear-gradient(135deg,#b7a3e8,#7b5bc7)" }}>
            <Share2 className="w-4 h-4" /> {busyMsg || "مشاركة التقرير كاملاً PDF"}
          </button>
        )}

        {msg && <p className="text-[10.5px] font-tajawal text-umi-teal text-center mb-2">{msg}</p>}
        {err && <p className="text-[10.5px] font-tajawal text-umi-red text-center mb-2">{err}</p>}

        {/* الملخص */}
        {data && (
          <div className="grid grid-cols-4 gap-1.5 mb-3">
            <div className="rounded-xl umi-card p-2.5 text-center"><p className="text-[8.5px] font-tajawal text-umi-muted">العدد</p><p className="font-cairo font-bold text-[14px] text-umi-cream">{data.summary.count}</p></div>
            <div className="rounded-xl umi-card p-2.5 text-center"><p className="text-[8.5px] font-tajawal text-umi-muted">وارد</p><p className="font-cairo font-bold text-[12px] text-umi-teal" dir="ltr">+{fmtSyp(data.summary.totalIn)}</p></div>
            <div className="rounded-xl umi-card p-2.5 text-center"><p className="text-[8.5px] font-tajawal text-umi-muted">صادر</p><p className="font-cairo font-bold text-[12px] text-umi-cream" dir="ltr">−{fmtSyp(data.summary.totalOut)}</p></div>
            <div className="rounded-xl umi-card p-2.5 text-center"><p className="text-[8.5px] font-tajawal text-umi-muted">الصافي</p><p className="font-cairo font-bold text-[12px] gold-text" dir="ltr">{fmtSyp(data.summary.net)}</p></div>
          </div>
        )}
        {data && <p className="text-[9px] font-tajawal text-umi-muted mb-1 px-1" dir="ltr">≈ {usdLine(data.summary.net, rates.usdSyp)}</p>}

        {/* قائمة العمليات + الخيارات بجانب كل عملية */}
        {data?.txs.map((t) => (
          <div key={t.id} className="rounded-2xl umi-card mb-2 overflow-hidden">
            <TxRow
              emoji={t.emoji}
              title={t.counterparty}
              sub={`${TYPE_LABELS[t.type]}${t.note ? " · " + t.note : ""} · ${relTime(t.createdAt)}`}
              amount={t.amount}
              direction={t.direction}
              onClick={onOpenTx ? () => onOpenTx(t.id) : undefined}
            />
            <div className="flex gap-1.5 px-3 pb-2.5">
              <a href={`/api/umi/receipt-pdf?txId=${t.id}&userId=${me.id}`} target="_blank" rel="noreferrer"
                className="h-7 px-2.5 rounded-lg bg-white/5 border border-white/10 text-[9.5px] font-tajawal text-umi-cream flex items-center gap-1" style={{ textDecoration: "none" }}>
                <FileDown className="w-3 h-3 text-umi-gold" /> PDF
              </a>
              {t.peerUserId && t.peerUserId !== me.id && (
                <>
                  <button type="button" onClick={() => addFriendRow(t.peerUserId!)}
                    className="h-7 px-2.5 rounded-lg bg-white/5 border border-white/10 text-[9.5px] font-tajawal text-umi-cream flex items-center gap-1">
                    <UserPlus className="w-3 h-3 text-umi-gold" /> إضافة صديق{peerNames[t.peerUserId] ? ` (${peerNames[t.peerUserId]})` : ""}
                  </button>
                  <button type="button" onClick={() => requestReportRow(t.peerUserId!)}
                    className="h-7 px-2.5 rounded-lg bg-white/5 border border-white/10 text-[9.5px] font-tajawal text-umi-cream flex items-center gap-1">
                    <MessageCircleReply className="w-3 h-3 text-umi-purplight" /> طلب مشاركة التقرير
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
        {data?.txs.length === 0 && (
          <p className="text-center text-[11px] font-tajawal text-umi-muted py-8">لا توجد عمليات في هذه الفترة</p>
        )}
      </div>
    </div>
  );
}
