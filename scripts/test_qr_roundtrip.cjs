// اختبار دورة QR الكاملة: qrcode (توليد كما في QrSheet) → sharp (بكسلات) → jsQR (القارئ كما في الكاميرا)
const QRCode = require("qrcode");
const sharp = require("sharp");
const jsQR = require("jsqr");

async function roundtrip(payload) {
  // نفس إعدادات QrSheet
  const png = await QRCode.toBuffer(payload, {
    type: "png",
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#0a0416", light: "#f5dfa0" },
    width: 300,
  });
  // محاكاة كاميرا: تحويل ل RGBA ثم تصغير لعرض 480 كما في حلقة المسح
  const { data, info } = await sharp(png)
    .resize({ width: 480 })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const clamped = new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength);
  const code = jsQR(clamped, info.width, info.height, { inversionAttempts: "dontInvert" });
  return code?.data?.trim() ?? null;
}

(async () => {
  const cases = [
    "umipay:cmvfhf3ib0003rjiqav7qc9df",
    "umipay:cmvfs33qq0000ptk9hysc48la",
    "umipay:cmvfhf3i90000rjiq17kdyuk1",
  ];
  let pass = 0;
  for (const c of cases) {
    const out = await roundtrip(c);
    const ok = out === c;
    console.log(ok ? "✓" : "✗", c.slice(0, 24) + "…", "→", out ? out.slice(0, 24) + "…" : "null");
    if (ok) pass++;
  }
  // رمز غريب لا يبدأ بـ umipay → القارئ يتجاهله (لا يُقبل كتحويل)
  const foreign = await roundtrip("https://example.com/pay");
  console.log(foreign && !foreign.startsWith("umipay:") ? "✓ رمز خارجي يُقرأ لكن يُتجاهل" : "✗ معالجة الرمز الخارجي");
  console.log(`النتيجة: ${pass}/${cases.length} حالة نجحت`);
  process.exit(pass === cases.length ? 0 : 1);
})();
