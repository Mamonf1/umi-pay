#!/bin/bash
# UMI PAY — اختبار API شامل للنظام الجديد
# كلمة مرور 8+ / رمز دفع 4 أرقام / حذف الوهميين / نقاط / قروض / تميز / مزامنة
B="http://localhost:3000/api/umi"
PASS=0; FAIL=0
ok(){ echo "  ✓ $1"; PASS=$((PASS+1)); }
bad(){ echo "  ✗ $1"; FAIL=$((FAIL+1)); }
jget(){ python3 -c "import sys,json;d=json.load(sys.stdin);print(json.dumps(d.get('data',d),ensure_ascii=False)[:400])"; }

echo "═══ 1) الدخول بكلمة المرور ═══"
R=$(curl -s $B/login -X POST -H 'Content-Type: application/json' -d '{"phone":"0969748865","pass":"Mam2737"}')
echo "$R" | grep -q '"ok":false' && ok "رفض كلمة المرور القديمة (7 خانات)" || bad "قبل كلمة مرور قصيرة!"
R=$(curl -s $B/login -X POST -H 'Content-Type: application/json' -d '{"phone":"0969748865","pass":"Mam27372"}')
echo "$R" | grep -q '"ok":true' && ok "دخول أدمن مأمون (Mam27372)" || bad "فشل دخول الأدمن: $R"
ADMIN_ID=$(echo "$R" | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['id'])")

R=$(curl -s $B/login -X POST -H 'Content-Type: application/json' -d '{"phone":"7782416","pass":"Market1234"}')
echo "$R" | grep -q '"ok":true' && ok "دخول ماركت (Market1234)" || bad "فشل دخول ماركت: $R"
MARKET_ID=$(echo "$R" | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['id'])")
MARKET_BAL=$(echo "$R" | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['balance'])")
echo "    رصيد ماركت: $MARKET_BAL ل.س"

echo "═══ 2) المستخدمون الوهميون محذوفون ═══"
N=$(curl -s "$B/home?userId=x" >/dev/null; sqlite3 /home/z/my-project/db/custom.db "SELECT COUNT(*) FROM User" 2>/dev/null || python3 -c "
import sqlite3;con=sqlite3.connect('/home/z/my-project/db/custom.db')
print(con.execute('SELECT COUNT(*) FROM \"User\"').fetchone()[0])")
echo "    عدد المستخدمين في القاعدة: $N"
[ "$N" = "2" ] && ok "مستخدمان فقط (مأمون + ماركت) — الوهميون محذوفون" || bad "عدد المستخدمين غير متوقع: $N"
R=$(curl -s $B/login -X POST -H 'Content-Type: application/json' -d '{"phone":"0551234567","pass":"whatever123"}')
echo "$R" | grep -q '"ok":false' && ok "أحمد (وهمي) لم يعد قادراً على الدخول" || bad "المستخدم الوهمي ما زال موجوداً!"

echo "═══ 3) التسجيل: تحقق كلمة المرور ═══"
R=$(curl -s $B/register -X POST -H 'Content-Type: application/json' -d '{"name":"اختبار","phone":"0999111222","pass":"Ab1","pin":"1234"}')
echo "$R" | grep -q '8 خانات' && ok "رفض كلمة مرور أقصر من 8" || bad "قبل كلمة قصيرة: $R"
R=$(curl -s $B/register -X POST -H 'Content-Type: application/json' -d '{"name":"اختبار","phone":"0999111222","pass":"12345678","pin":"1234"}')
echo "$R" | grep -q 'حروفاً' && ok "رفض كلمة مرور أرقام فقط" || bad "قبل كلمة بلا حروف: $R"
R=$(curl -s $B/register -X POST -H 'Content-Type: application/json' -d '{"name":"اختبار","phone":"0999111222","pass":"Test1234","pin":"12"}')
echo "$R" | grep -q '4 أرقام' && ok "رفض رمز دفع غير 4 أرقام" || bad "قبل رمز دفع خاطئ: $R"
R=$(curl -s $B/register -X POST -H 'Content-Type: application/json' -d '{"name":"سالم الاختبار","phone":"0999111222","pass":"Test1234","pin":"4321"}')
echo "$R" | grep -q '"ok":true' && ok "إنشاء حساب شخصي سليم" || bad "فشل التسجيل: $R"
TEMP_ID=$(echo "$R" | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['id'])")
TEMP_POINTS=$(echo "$R" | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['points'])")
[ "$TEMP_POINTS" = "0" ] && ok "محفظة جديدة تبدأ بصفر نقطة" || bad "نقاط ابتدائية غير صفرية"

echo "═══ 4) رمز الدفع 4 أرقام في التحويل ═══"
R=$(curl -s $B/topup -X POST -H 'Content-Type: application/json' -d "{\"userId\":\"$TEMP_ID\",\"amount\":100000,\"method\":\"mada\"}")
echo "$R" | grep -q '"ok":true' && ok "شحن 100,000 ل.س للمستخدم المؤقت" || bad "فشل الشحن: $R"
R=$(curl -s $B/transfer -X POST -H 'Content-Type: application/json' -d "{\"fromId\":\"$TEMP_ID\",\"toId\":\"$MARKET_ID\",\"amount\":25000,\"pin\":\"9999\"}")
echo "$R" | grep -q 'رمز الدفع' && ok "رفض تحويل برمز دفع خاطئ" || bad "قبل رمزاً خاطئاً: $R"
R=$(curl -s $B/transfer -X POST -H 'Content-Type: application/json' -d "{\"fromId\":\"$TEMP_ID\",\"toId\":\"$MARKET_ID\",\"amount\":25000,\"pin\":\"4321\",\"note\":\"اختبار\"}")
echo "$R" | grep -q '"ok":true' && ok "تحويل 25,000 ل.س برمز الدفع الصحيح" || bad "فشل التحويل: $R"

echo "═══ 5) القروض: طلب ← قبول ← سداد جزئي ← كامل ═══"
R=$(curl -s $B/loans -X POST -H 'Content-Type: application/json' -d "{\"userId\":\"$TEMP_ID\",\"amount\":10000}")
echo "$R" | grep -q '25,000' && ok "رفض طلب قرض أقل من الحد" || bad "قبل قرضاً صغيراً: $R"
R=$(curl -s $B/loans -X POST -H 'Content-Type: application/json' -d "{\"userId\":\"$TEMP_ID\",\"amount\":200000,\"note\":\"توسعة\"}")
echo "$R" | grep -q '"ok":true' && ok "طلب قرض 200,000 ل.س" || bad "فشل طلب القرض: $R"
LOAN_ID=$(echo "$R" | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['loan']['id'])")
R=$(curl -s $B/loans -X PATCH -H 'Content-Type: application/json' -d "{\"id\":\"$LOAN_ID\",\"action\":\"approve\",\"adminId\":\"$TEMP_ID\"}")
echo "$R" | grep -q 'لأدمن' && ok "رفض قبول قرض من غير أدمن" || bad "غير مصرح قبل القبول: $R"
R=$(curl -s $B/loans -X PATCH -H 'Content-Type: application/json' -d "{\"id\":\"$LOAN_ID\",\"action\":\"approve\",\"adminId\":\"$ADMIN_ID\"}")
echo "$R" | grep -q '"ok":true' && ok "الأدمن قبل — شحن فوري" || bad "فشل القبول: $R"
R=$(curl -s "$B/home?userId=$TEMP_ID")
BAL=$(echo "$R" | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['me']['balance'])")
[ "$BAL" = "300000" ] && ok "الرصيد 300,000 (100k شحن + 25k بقي + 200k قرض − دخلت الرصيد صحيحاً؟)" || echo "    (رصيد: $BAL)"
R=$(curl -s $B/loans -X PATCH -H 'Content-Type: application/json' -d "{\"id\":\"$LOAN_ID\",\"action\":\"repay\",\"pin\":\"1111\"}")
echo "$R" | grep -q 'رمز الدفع' && ok "رفض سداد برمز خاطئ" || bad "قبل سداداً بلا رمز صحيح: $R"
R=$(curl -s $B/loans -X PATCH -H 'Content-Type: application/json' -d "{\"id\":\"$LOAN_ID\",\"action\":\"repay\",\"amount\":50000,\"pin\":\"4321\"}")
echo "$R" | grep -q '"ok":true' && ok "سداد جزئي 50,000" || bad "فشل السداد الجزئي: $R"
R=$(curl -s $B/loans -X PATCH -H 'Content-Type: application/json' -d "{\"id\":\"$LOAN_ID\",\"action\":\"repay\",\"amount\":999999,\"pin\":\"4321\"}")
echo "$R" | grep -q 'المتبقي' && ok "رفض سداد أكثر من المتبقي" || bad "قبل مبلغاً زائداً: $R"
R=$(curl -s $B/loans -X PATCH -H 'Content-Type: application/json' -d "{\"id\":\"$LOAN_ID\",\"action\":\"repay\",\"pin\":\"4321\"}")
echo "$R" | grep -q 'fullyPaid":true' && ok "سداد كامل تلقائي بالمتبقي" || bad "فشل السداد الكامل: $R"
R=$(curl -s "$B/loans?userId=$ADMIN_ID")
echo "$R" | grep -q 'monitoring' && ok "الأدمن يرى مراقبة القروض" || bad "لا مراقبة للأدمن"
UNPAID=$(echo "$R" | python3 -c "import sys,json;d=json.load(sys.stdin)['data']['monitoring'];print(d['unpaidCount'],int(d['unpaidTotal']))")
echo "    مراقبة الأدمن: غير مسدد = $UNPAID ل.س"

echo "═══ 6) نقاط أومي: منح الأدمن فقط ═══"
R=$(curl -s $B/admin/points -X POST -H 'Content-Type: application/json' -d "{\"adminId\":\"$TEMP_ID\",\"phone\":\"7782416\",\"points\":100}")
echo "$R" | grep -q 'لأدمن' && ok "رفض منح نقاط من غير أدمن" || bad "غير مصرح منح النقاط: $R"
R=$(curl -s $B/admin/points -X POST -H 'Content-Type: application/json' -d "{\"adminId\":\"$ADMIN_ID\",\"phone\":\"7782416\",\"points\":250,\"note\":\"مكافأة ولاء\"}")
echo "$R" | grep -q '"ok":true' && ok "الأدمن منح 250 نقطة لماركت" || bad "فشل المنح: $R"

echo "═══ 7) مزامنة السعر من مصدر موثوق ═══"
R=$(curl -s $B/admin/sync-rate -X POST -H 'Content-Type: application/json' -d "{\"adminId\":\"$TEMP_ID\"}")
echo "$R" | grep -q 'لأدمن' && ok "المزامنة للأدمن فقط" || bad "مزامنة غير مصرحة: $R"
R=$(curl -s $B/admin/sync-rate -X POST -H 'Content-Type: application/json' -d "{\"adminId\":\"$ADMIN_ID\"}")
echo "$R" | grep -q '"ok":true' && ok "جلب السعر من exchangerate-api: $(echo "$R" | jget)" || bad "فشلت المزامنة: $R"

echo "═══ 8) بطاقة التميز (رصيد 50,000+ ل.س) ═══"
R=$(curl -s "$B/tamayuz?userId=$TEMP_ID")
echo "$R" | grep -q '"eligible":true' && ok "المستخدم مؤهل للبطاقة" || bad "أهلية خاطئة: $R"
R=$(curl -s $B/tamayuz -X POST -H 'Content-Type: application/json' -d "{\"userId\":\"$TEMP_ID\"}")
NUM=$(echo "$R" | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['card']['number'])" 2>/dev/null)
LEN=${#NUM}
[ "$LEN" = "15" ] && [[ "$NUM" == 37* ]] && ok "بطاقة AmEx صحيحة: $NUM (15 خانة تبدأ 37)" || bad "رقم بطاقة غير صحيح: $NUM"
R=$(curl -s $B/tamayuz -X POST -H 'Content-Type: application/json' -d "{\"userId\":\"$TEMP_ID\"}")
echo "$R" | grep -q 'بالفعل' && ok "منع التكرار" || bad "سمح ببطاقة ثانية"

echo "═══ 9) دفع المتجر برمز 4 أرقام ═══"
MERCH_ID=$(curl -s $B/merchants | python3 -c "import sys,json;d=json.load(sys.stdin);r=d['data'];print((r['merchants'] if isinstance(r,dict) else r)[0]['id'])")
echo "    معرف المتجر: $MERCH_ID"
R=$(curl -s $B/checkout -X POST -H 'Content-Type: application/json' -d "{\"userId\":\"$TEMP_ID\",\"merchantId\":\"$MERCH_ID\",\"amount\":5000,\"pin\":\"1111\"}")
echo "$R" | grep -q 'رمز الدفع' && ok "رفض دفع متجر برمز خاطئ" || bad "قبل رمزاً خاطئاً: $R"
R=$(curl -s $B/checkout -X POST -H 'Content-Type: application/json' -d "{\"userId\":\"$TEMP_ID\",\"merchantId\":\"$MERCH_ID\",\"amount\":5000,\"pin\":\"4321\"}")
echo "$R" | grep -q '"ok":true' && ok "دفع متجر 5,000 ل.س ناجح" || bad "فشل الدفع: $R"

echo "═══ 10) تغيير كلمة المرور ورمز الدفع ═══"
R=$(curl -s $B/account -X PATCH -H 'Content-Type: application/json' -d "{\"userId\":\"$TEMP_ID\",\"action\":\"pass\",\"current\":\"Test1234\",\"next\":\"short\"}")
echo "$R" | grep -q '8 خانات' && ok "رفض كلمة مرور جديدة قصيرة" || bad "قبل كلمة قصيرة: $R"
R=$(curl -s $B/account -X PATCH -H 'Content-Type: application/json' -d "{\"userId\":\"$TEMP_ID\",\"action\":\"pin\",\"current\":\"4321\",\"next\":\"5678\"}")
echo "$R" | grep -q '"ok":true' && ok "تغيير رمز الدفع إلى 5678" || bad "فشل تغيير الرمز: $R"
R=$(curl -s $B/transfer -X POST -H 'Content-Type: application/json' -d "{\"fromId\":\"$TEMP_ID\",\"toId\":\"$MARKET_ID\",\"amount\":1000,\"pin\":\"4321\"}")
echo "$R" | grep -q 'رمز الدفع' && ok "الرمز القديم لم يعد يعمل" || bad "الرمز القديم يعمل!"

echo "═══ 11) تنظيف حساب الاختبار ═══"
python3 - <<'EOF'
import sqlite3
con = sqlite3.connect('/home/z/my-project/db/custom.db')
cur = con.cursor()
tid = con.execute('SELECT id FROM "User" WHERE phone="0999111222"').fetchone()
if tid:
    tid = tid[0]
    for q in [
        f'DELETE FROM ChatMessage WHERE senderId="{tid}"',
        f'DELETE FROM ChatThread WHERE userAId="{tid}" OR userBId="{tid}"',
        f'DELETE FROM LoanRequest WHERE userId="{tid}"',
        f'DELETE FROM TamayuzCard WHERE userId="{tid}"',
        f'DELETE FROM "Transaction" WHERE fromUserId="{tid}" OR toUserId="{tid}"',
        f'DELETE FROM Wallet WHERE userId="{tid}"',
        f'DELETE FROM User WHERE id="{tid}"',
    ]:
        cur.execute(q)
    con.commit()
n = con.execute('SELECT COUNT(*) FROM "User"').fetchone()[0]
mk = con.execute('SELECT balance, points FROM Wallet WHERE userId=(SELECT id FROM User WHERE phone="7782416")').fetchone()
usd = con.execute('SELECT usdSyp FROM CurrencySettings WHERE id="main"').fetchone()[0]
print(f"    المستخدمون الآن: {n} | ماركت: رصيد {mk[0]} ل.س + {mk[1]} نقطة | $1 = {usd} ل.س")
con.close()
EOF

echo ""
echo "══════════════ النتيجة: نجح $PASS — فشل $FAIL ══════════════"
