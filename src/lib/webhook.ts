// UMI PAY — محرك إرسال إشعارات الدفع (Webhooks) للمتاجر
// يُرسل POST JSON إلى رابط التاجر مع توقيع أمني HMAC-SHA256 يُحسب بمفتاح API الخاص به
// فيتحقق موقع التاجر من التوقيع ويتأكد أن الإشعار جاء فعلاً من محفظة أومي ولم يُزوَّر
import crypto from "crypto";
import { db } from "@/lib/db";

export type WebhookResult = {
  delivered: boolean;
  status?: number;
  error?: string;
  ms: number;
};

export function signPayload(rawBody: string, apiKey: string): string {
  return "sha256=" + crypto.createHmac("sha256", apiKey).update(rawBody, "utf8").digest("hex");
}

/**
 * يرسل إشعاراً إلى رابط التاجر المحفوظ webhookUrl
 * event مثال: "payment.success" | "ping" (اختبار)
 */
export async function sendWebhook(
  merchantId: string,
  event: string,
  data: Record<string, unknown>,
  timeoutMs = 8000,
): Promise<WebhookResult> {
  const started = Date.now();
  const base: WebhookResult = { delivered: false, ms: 0 };
  try {
    const m = await db.merchant.findUnique({ where: { id: merchantId } });
    if (!m) return { ...base, error: "merchant_not_found" };
    if (!m.webhookUrl || !m.apiKey) return { ...base, error: "no_webhook_url" };

    const payload = {
      event,
      merchantId: m.id,
      merchantName: m.name,
      data,
      sentAt: new Date().toISOString(),
    };
    const raw = JSON.stringify(payload);
    const signature = signPayload(raw, m.apiKey);

    const res = await fetch(m.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "User-Agent": "UMI-PAY-Webhook/1.0",
        "X-UMI-Event": event,
        "X-UMI-Merchant": m.id,
        "X-UMI-Signature": signature,
      },
      body: raw,
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
    const ms = Date.now() - started;
    // نعتبر التسليم ناجحاً لأي رد 2xx — التاجر يجب أن يرد 200 بسرعة
    if (res.ok) {
      console.log(`[webhook] ${event} → ${m.name} ${m.webhookUrl} ✓ ${res.status} (${ms}ms)`);
      return { delivered: true, status: res.status, ms };
    }
    console.warn(`[webhook] ${event} → ${m.name} رفض ${res.status} (${ms}ms)`);
    return { delivered: false, status: res.status, error: `http_${res.status}`, ms };
  } catch (e) {
    const ms = Date.now() - started;
    const err = e as Error;
    const reason =
      err.name === "TimeoutError" || err.name === "AbortError"
        ? "timeout"
        : err.message?.includes("ECONNREFUSED")
          ? "connection_refused"
          : err.message?.includes("ENOTFOUND") || err.message?.includes("getaddrinfo")
            ? "dns_not_found"
            : err.message?.includes("certificate")
              ? "ssl_error"
              : "network_error";
    console.warn(`[webhook] ${event} فشل: ${reason} (${ms}ms)`);
    return { delivered: false, error: reason, ms };
  }
}
