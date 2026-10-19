// UMI PAY — بيانات فعلية فقط (لا مستخدمين وهميين)
// الحسابات: أدمن مأمون الخضر + ماركت (تاجر) + قرض ماركت المعتمد غير المسدد بالكامل
// تشغيل: bun prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  // تنظيف شامل — إزالة كل المستخدمين الوهميين وبياناتهم
  await db.chatMessage.deleteMany();
  await db.chatThread.deleteMany();
  await db.transaction.deleteMany();
  await db.familyMember.deleteMany();
  await db.tamayuzCard.deleteMany();
  await db.loanRequest.deleteMany();
  await db.merchant.deleteMany();
  await db.wallet.deleteMany();
  await db.user.deleteMany();
  await db.currencySettings.deleteMany();

  // ==== الحسابات الفعلية ====
  // أدمن المحفظة — كلمة مرور 8 خانات (حروف + أرقام) + رمز دفع 4 أرقام
  const admin = await db.user.create({
    data: {
      name: "مأمون الخضر",
      phone: "0969748865",
      pass: "Mam27372",
      pin: "1234",
      role: "admin",
      avatar: "👑",
    },
  });
  await db.wallet.create({ data: { userId: admin.id, balance: -617500, points: 0 } });

  // ماركت — حساب تاجر فعلي
  const market = await db.user.create({
    data: {
      name: "ماركت",
      phone: "7782416",
      pass: "Market1234",
      pin: "1234",
      role: "merchant",
      avatar: "🛒",
    },
  });
  await db.wallet.create({ data: { userId: market.id, balance: 842500, points: 0 } });
  await db.merchant.create({
    data: {
      name: "ماركت",
      category: "متجر عام",
      emoji: "🛒",
      color: "#7b5bc7",
      ownerId: market.id,
    },
  });

  // قرض ماركت المعتمد — 425,000 ل.س سُدّد منها 100,000 — المتبقي 325,000 ل.س
  await db.loanRequest.create({
    data: {
      userId: market.id,
      amount: 425000,
      paidAmount: 100000,
      currency: "SYP",
      status: "approved",
      note: "قرض تشغيلي",
    },
  });

  // ==== تسعير الصرف ====
  await db.currencySettings.create({
    data: { id: "main", usdSyp: 13000, pointSyp: 10 },
  });

  console.log("✓ الحسابات الفعلية جاهزة: مأمون الخضر (أدمن) + ماركت (تاجر) + قرض 325,000 ل.س متبقٍ");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
