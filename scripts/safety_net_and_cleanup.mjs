// مهمة 24-e: (1) تنظيف الحساب المؤقت بعد الاختبار (2) اختبار شبكة الأمان لتاجر بلا سجل
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";

const p = new PrismaClient();

async function deleteUserDeep(id) {
  await p.tamayuzCard.deleteMany({ where: { userId: id } });
  // الحسابات المؤقتة أجرت معاملات فقط من/إلى نفسها — نحذفها بهذا الشرط الضيق حصراً
  await p.transaction.deleteMany({ where: { OR: [{ fromUserId: id }, { toUserId: id }] } });
  await p.merchant.deleteMany({ where: { ownerId: id } });
  await p.wallet.deleteMany({ where: { userId: id } });
  await p.user.delete({ where: { id } }).catch(() => {});
}

async function main() {
  console.log("— 1) اختبار شبكة الأمان: تاجر بلا سجل");
  // أنشئ مستخدماً مؤقتاً بدور merchant بلا سجل تاجر مباشرة في القاعدة
  const u = await p.user.create({
    data: {
      name: "اختبار شبكة الأمان",
      phone: "900000" + Math.floor(Math.random() * 90000 + 10000),
      pass: "Temp12345",
      pin: "1234",
      role: "merchant",
      avatar: "👤",
      wallet: { create: {} },
    },
  });
  const r = await fetch(`http://localhost:3000/api/umi/merchant-api?userId=${u.id}`);
  const j = await r.json();
  const created = j?.ok === true && (j?.data?.apiKey ?? "").startsWith("umi_live_");
  console.log(created ? "  ✓ merchant-api أنشأ سجل التاجر تلقائياً مع مفتاح" : "  ✗ فشلت شبكة الأمان: " + JSON.stringify(j).slice(0, 140));
  // تحقق من الثبات: استدعاء ثانٍ يعيد نفس المفتاح
  const r2 = await fetch(`http://localhost:3000/api/umi/merchant-api?userId=${u.id}`);
  const j2 = await r2.json();
  console.log(j2?.data?.apiKey === j?.data?.apiKey ? "  ✓ المفتاح ثابت عبر الاستدعاءات" : "  ✗ المفتاح يتغير!");

  console.log("— 2) تنظيف الحسابات المؤقتة");
  await deleteUserDeep(u.id);
  console.log("  ✓ حُذف مستخدم شبكة الأمان");
  const tempId = readFileSync("/tmp/temp_merchant_id.txt", "utf8").trim();
  if (tempId) {
    await deleteUserDeep(tempId);
    console.log("  ✓ حُذف الحساب المؤقت من اختبار API:", tempId);
  }

  console.log("— 3) سلامة القاعدة النهائية");
  const users = await p.user.findMany({ select: { phone: true, name: true, role: true } });
  for (const x of users) console.log("   ", x.phone, "|", x.name, "|", x.role);
  const merchants = await p.merchant.findMany({ select: { name: true, apiKey: true } });
  console.log("    تجار:", merchants.map((m) => `${m.name}(${m.apiKey?.slice(9, 15)}…)`).join(", "));
  const pe = await p.profitEntry.count();
  const tx = await p.transaction.count();
  console.log("    profitEntries:", pe, "| transactions:", tx);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => p.$disconnect());
