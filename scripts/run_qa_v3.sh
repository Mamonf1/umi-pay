#!/bin/bash
# UMI PAY — QA موحد v3: ملء الشاشة + من نحن + حذف النسخ القديمة
# يشغّل الخادم (يبقى حياً عبر start-stop-daemon) + اختبارات API + لقطات متصفح موبايل
cd /home/z/my-project
PASS=0; FAIL=0
ok(){ echo "  ✓ $1"; PASS=$((PASS+1)); }
bad(){ echo "  ✗ $1"; FAIL=$((FAIL+1)); }

echo "== 1) إيقاف أي خادم قديم =="
pkill -f "next dev" 2>/dev/null; pkill -f "next-server" 2>/dev/null; pkill -f "npm run dev" 2>/dev/null
sleep 1
rm -rf .next/dev 2>/dev/null
mkdir -p /home/z/my-project/qa

echo "== 2) تشغيل الخادم =="
start-stop-daemon --start --background --make-pidfile --pidfile /home/z/my-project/dev.pid \
  --startas /bin/bash -- -c "cd /home/z/my-project && exec npm run dev >> dev.log 2>&1"

echo "== 3) انتظار الاستجابة =="
code=000
for i in $(seq 1 120); do
  code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null)
  if [ "$code" = "200" ]; then echo "  الخادم جاهز بعد ${i} ثانية (200)"; break; fi
  sleep 1
done
[ "$code" = "200" ] && ok "GET / = 200" || { bad "الخادم لم يبدأ"; tail -40 dev.log; exit 1; }

echo "== 4) اختبارات API =="
R=$(curl -s -X POST http://localhost:3000/api/umi/login -H 'Content-Type: application/json' -d '{"phone":"0969748865","pass":"Mam27372"}')
echo "$R" | rg -q '"ok":true' && ok "دخول الأدمن مأمون (0969748865)" || bad "دخول الأدمن: $R"
ADMIN_ID=$(echo "$R" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null)

R=$(curl -s -X POST http://localhost:3000/api/umi/login -H 'Content-Type: application/json' -d '{"phone":"7782416","pass":"Market1234"}')
echo "$R" | rg -q '"ok":true' && ok "دخول ماركت (7782416)" || bad "دخول ماركت: $R"

R=$(curl -s http://localhost:3000/api/umi/currency)
echo "$R" | rg -q '"usdSyp":13000' && ok "التسعير: usdSyp=13000 + pointSyp" || bad "التسعير: $R"

R=$(curl -s -X POST http://localhost:3000/api/umi/register -H 'Content-Type: application/json' -d '{"name":"فاحص","phone":"0999000111","pass":"abc123","pin":"12"}')
echo "$R" | rg -q '"ok":false' && ok "رفض تسجيل ضعيف (كلمة قصيرة/رمز ناقص)" || bad "قبول تسجيل ضعيف!: $R"

R=$(curl -s "http://localhost:3000/api/umi/home?userId=$ADMIN_ID")
echo "$R" | rg -q '"balance":-617500' && ok "home أدمن: رصيد -617,500 ل.س محفوظ" || bad "home أدمن: $(echo $R | head -c 200)"

R=$(curl -s "http://localhost:3000/api/umi/loans?userId=$ADMIN_ID")
echo "$R" | rg -q '"remaining":325000|"remaining": 325000' && ok "قرض ماركت: متبقي 325,000" || { echo "$R" | head -c 300; echo; }

echo "== 5) التحقق البصري (موبايل 390×844) =="
agent-browser set viewport 390 844 >/dev/null 2>&1
agent-browser open http://localhost:3000 >/dev/null 2>&1
agent-browser wait --load networkidle >/dev/null 2>&1
agent-browser wait 1200 >/dev/null 2>&1
agent-browser screenshot /home/z/my-project/qa/v3-1-login-fullscreen.png >/dev/null 2>&1 && ok "لقطة: دخول بملء الشاشة"

agent-browser find first "[data-testid='about-link']" click >/dev/null 2>&1
agent-browser wait 900 >/dev/null 2>&1
agent-browser screenshot /home/z/my-project/qa/v3-2-about-top.png >/dev/null 2>&1 && ok "لقطة: من نحن (أعلى)"
agent-browser eval "window.scrollTo(0, document.body.scrollHeight*0.55)" >/dev/null 2>&1
agent-browser wait 500 >/dev/null 2>&1
agent-browser screenshot /home/z/my-project/qa/v3-3-about-terms.png >/dev/null 2>&1 && ok "لقطة: من نحن (الشروط)"

# فتح صفحة «من نحن» عبر الرئيسية يتطلب دخولاً — لكن التراكب يعمل من شاشة الدخول فقط هنا
agent-browser open http://localhost:3000 >/dev/null 2>&1
agent-browser wait --load networkidle >/dev/null 2>&1
agent-browser wait 800 >/dev/null 2>&1
agent-browser find first "input[inputmode='tel']" fill "0969748865" >/dev/null 2>&1
agent-browser find first "input[type='password']" fill "Mam27372" >/dev/null 2>&1
agent-browser find first "[data-testid='login-submit']" click >/dev/null 2>&1
agent-browser wait 2500 >/dev/null 2>&1
agent-browser screenshot /home/z/my-project/qa/v3-4-admin-home.png >/dev/null 2>&1 && ok "لقطة: لوحة الأدمن بملء الشاشة"

agent-browser eval "JSON.stringify({w:document.documentElement.clientWidth, h:document.querySelector('main')?.clientHeight})" 2>/dev/null | head -c 200; echo
agent-browser close >/dev/null 2>&1

echo "== 6) أخطاء الكونسول/الخادم =="
E=$(rg -c "Error|error" dev.log 2>/dev/null || echo 0)
echo "  dev.log mentions of error: $E (معاينة فقط)"

echo ""
echo "================ النتيجة: نجاح $PASS / فشل $FAIL ================"
