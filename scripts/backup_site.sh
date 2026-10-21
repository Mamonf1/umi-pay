#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# نسخة احتياطية كاملة لموقع محفظة أومي — UMI PAY Backup
# تُنتج: download/umi-pay-backup-YYYY-MM-DD.zip
# ═══════════════════════════════════════════════════════════════
set -e
PROJ=/home/z/my-project
DATE=$(date +%Y-%m-%d)
NAME="umi-pay-backup-$DATE"
STAGE="$PROJ/.backup-staging/$NAME"
OUT="$PROJ/download/$NAME.zip"

rm -rf "$PROJ/.backup-staging"; mkdir -p "$STAGE"

echo "[1/5] تصوير قاعدة البيانات المتسق (الخادم يعمل الآن)..."
python3 - <<PYEOF
import sqlite3, os
os.makedirs("$STAGE/db", exist_ok=True)
src = sqlite3.connect("$PROJ/db/custom.db")
dst = sqlite3.connect("$STAGE/db/custom.db")
src.backup(dst)
n_user = dst.execute("select count(*) from User").fetchone()[0]
n_tx   = dst.execute('select count(*) from "Transaction"').fetchone()[0]
n_mer  = dst.execute("select count(*) from Merchant").fetchone()[0]
print(f"  قاعدة البيانات المصوّرة: مستخدمون={n_user} عمليات={n_tx} تجار={n_mer}")
dst.close(); src.close()
PYEOF

echo "[2/5] نسخ الشيفرة والإعدادات والخطوط..."
mkdir -p "$STAGE"
cp -r "$PROJ/src" "$STAGE/src"
cp -r "$PROJ/prisma" "$STAGE/prisma"
cp -r "$PROJ/public" "$STAGE/public"
cp -r "$PROJ/scripts" "$STAGE/scripts"
cp -r "$PROJ/tests" "$STAGE/tests" 2>/dev/null || true
# ملفات الإعدادات الجذرية
for f in package.json package-lock.json bun.lock next.config.ts tsconfig.json \
         tailwind.config.ts postcss.config.mjs eslint.config.mjs components.json \
         next-env.d.ts .env .gitignore Caddyfile worklog.md; do
  [ -f "$PROJ/$f" ] && cp "$PROJ/$f" "$STAGE/$f"
done
# الخطوط العربية (محرك PDF يعتمد عليها)
cp "$PROJ"/Tajawal-*.ttf "$STAGE/" 2>/dev/null || true

echo "[3/5] كتابة دليل الاستعادة..."
cat > "$STAGE/README-استعادة.txt" << 'READMEEOF'
═══════════════════════════════════════════════════════════════
 نسخة احتياطية — محفظة أومي UMI PAY
═══════════════════════════════════════════════════════════════

محتويات هذه النسخة:
- db/custom.db          قاعدة البيانات الكاملة (الحسابات الحقيقية + العمليات + الأصدقاء + الرسائل)
- src/                  شيفرة التطبيق كاملة (Next.js + واجهات أومي)
- prisma/               مخطط قاعدة البيانات + بذرة seed
- public/               الأيقونات وشعار PWA
- scripts/              سكربتات الاختبار والصيانة
- tests/                سكربتات فحص البنية
- Tajawal-*.ttf         الخطوط العربية (يعتمد عليها محرك PDF للإيصالات والتقارير)
- .env                  إعداد اتصال قاعدة البيانات
- next.config.ts وغيره  ملفات الإعدادات الجذرية
- worklog.md            سجل تطوير الموقع الكامل

خطوات الاستعادة على أي جهاز:

1) فك الضغط والدخول للمجلد:
     unzip umi-pay-backup-DATE.zip && cd umi-pay-backup-DATE

2) تثبيت الحزم:
     npm install        (أو bun install)

3) تعديل مسار قاعدة البيانات في ملف .env:
     DATABASE_URL=file:/المسار/إلى/المجلد/db/custom.db
   (المسار الحالي يشير لجهاز التطوير الأصلي — غيّره للمسار الجديد)

4) توليد عميل Prisma:
     npx prisma generate

5) تثبيت الخطوط العربية (لإيصالات PDF):
     mkdir -p ~/.local/share/fonts
     cp Tajawal-*.ttf ~/.local/share/fonts/
     fc-cache -f

6) تشغيل الموقع:
     npm run dev        ← http://localhost:3000

التحقق بعد التشغيل: سجّل الدخول بحسابك — إن ظهر الرصيد والعمليات فالاستعادة نجحت.

ملاحظات أمنية:
- ملف .env ومفتاح API داخل القاعدة حساسان — لا تشارك النسخة مع أحد
- إن شككت بتسرب المفتاح: ولّد مفتاحاً جديداً من لوحة معلومات API في التطبيق
READMEEOF

echo "[4/5] ضغط النسخة..."
mkdir -p "$PROJ/download"
rm -f "$OUT"
cd "$PROJ/.backup-staging" && zip -rq "$OUT" "$NAME" -x "*.DS_Store"

echo "[5/5] التحقق من السلامة..."
unzip -t "$OUT" > /tmp/ziptest.txt 2>&1 && grep -q "No errors" /tmp/ziptest.txt \
  && echo "  سلامة الأرشيف: ✓ لا أخطاء" || { echo "  ✗ أرشيف تالف!"; exit 1; }
FILES=$(unzip -l "$OUT" | tail -1 | awk '{print $2}')
echo "  عدد الملفات داخل الأرشيف: $FILES"
unzip -l "$OUT" | rg "custom.db|README" | head -3
ls -lh "$OUT" | awk '{print "  الحجم النهائي: "$5" → "$NF}'

rm -rf "$PROJ/.backup-staging"
echo "تم ✓ → $OUT"
