// UMI PAY — بيانات تجريبية واقعية
// تشغيل: bun prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const r2 = (n: number) => Math.round(n * 100) / 100;

async function main() {
  // تنظيف
  await db.chatMessage.deleteMany();
  await db.chatThread.deleteMany();
  await db.transaction.deleteMany();
  await db.familyMember.deleteMany();
  await db.merchant.deleteMany();
  await db.wallet.deleteMany();
  await db.user.deleteMany();

  // ==== المستخدمون ====
  const ahmad = await db.user.create({ data: { name: "أحمد الشمري", phone: "0551234567", pin: "1234", role: "individual", avatar: "🧑🏻‍💼" } });
  const sara = await db.user.create({ data: { name: "سارة العتيبي", phone: "0552345678", pin: "1234", role: "individual", avatar: "👩🏻" } });
  const khaled = await db.user.create({ data: { name: "خالد", phone: "0553456789", pin: "1234", role: "child", avatar: "👦🏻" } });
  const lina = await db.user.create({ data: { name: "لينا", phone: "0554567890", pin: "1234", role: "child", avatar: "👧🏻" } });
  const fahad = await db.user.create({ data: { name: "فهد الدوسري", phone: "0555678901", pin: "1234", role: "individual", avatar: "🧑🏻" } });
  const ryanOwner = await db.user.create({ data: { name: "متجر الريان", phone: "0556789012", pin: "1234", role: "merchant", avatar: "🛒" } });
  const bunOwner = await db.user.create({ data: { name: "مقهى البُن", phone: "0557890123", pin: "1234", role: "merchant", avatar: "☕" } });
  const pharmaOwner = await db.user.create({ data: { name: "صيدلية الشفاء", phone: "0558901234", pin: "1234", role: "merchant", avatar: "💊" } });

  // ==== المحافظ ====
  const mk = async (userId: string, balance: number) => db.wallet.create({ data: { userId, balance: r2(balance) } });
  await mk(ahmad.id, 2450.75);
  await mk(sara.id, 1830.2);
  await mk(khaled.id, 85);
  await mk(lina.id, 120.5);
  await mk(fahad.id, 940);
  await mk(ryanOwner.id, 12680.4);
  await mk(bunOwner.id, 7310.9);
  await mk(pharmaOwner.id, 4125.6);

  // ==== التجار ====
  const ryan = await db.merchant.create({ data: { name: "متجر الريان", category: "بقالة وسوبرماركت", emoji: "🛒", color: "#7b5bc7", ownerId: ryanOwner.id } });
  const bun = await db.merchant.create({ data: { name: "مقهى البُن", category: "قهوة ومشروبات", emoji: "☕", color: "#e8c766", ownerId: bunOwner.id } });
  const pharma = await db.merchant.create({ data: { name: "صيدلية الشفاء", category: "صيدلية", emoji: "💊", color: "#6fb5a3", ownerId: pharmaOwner.id } });

  // ==== الحسابات الفرعية (أحمد ولي أمر خالد ولينا) ====
  await db.familyMember.create({ data: { parentId: ahmad.id, childId: khaled.id, weeklyLimit: 100 } });
  await db.familyMember.create({ data: { parentId: ahmad.id, childId: lina.id, weeklyLimit: 150, frozen: true } });

  // ==== المعاملات (سجل آخر 10 أيام) ====
  const daysAgo = (d: number, h = 12) => new Date(Date.now() - d * 86400000 - h * 3600000);
  const ref = (i: number) => `UMI-${(100000 + i * 7717).toString(36).toUpperCase()}${i}`;
  let i = 0;
  const tx = (data: {
    type: string; amount: number; note?: string; fromUserId?: string; toUserId?: string; merchantId?: string; day: number; hour?: number;
  }) =>
    db.transaction.create({
      data: {
        reference: ref(++i),
        type: data.type,
        amount: r2(data.amount),
        note: data.note,
        fromUserId: data.fromUserId,
        toUserId: data.toUserId,
        merchantId: data.merchantId,
        createdAt: daysAgo(data.day, data.hour),
      },
    });

  await tx({ type: "topup", amount: 1500, note: "شحن ببطاقة مدى", toUserId: ahmad.id, day: 10 });
  await tx({ type: "merchant", amount: 64.5, note: "تسوق أسبوعي", fromUserId: ahmad.id, merchantId: ryan.id, day: 9 });
  await tx({ type: "transfer", amount: 200, note: "حجز ملاعب", fromUserId: ahmad.id, toUserId: fahad.id, day: 8 });
  await tx({ type: "topup", amount: 500, note: "شحن آبل باي", toUserId: sara.id, day: 8, hour: 9 });
  await tx({ type: "merchant", amount: 27, note: "لاتيه ومافي", fromUserId: sara.id, merchantId: bun.id, day: 7 });
  await tx({ type: "transfer", amount: 350, note: "سلفة", fromUserId: sara.id, toUserId: ahmad.id, day: 6 });
  await tx({ type: "allowance", amount: 100, note: "مصروف أسبوعي", fromUserId: ahmad.id, toUserId: khaled.id, day: 6, hour: 8 });
  await tx({ type: "allowance", amount: 150, note: "مصروف أسبوعي", fromUserId: ahmad.id, toUserId: lina.id, day: 6, hour: 8 });
  await tx({ type: "merchant", amount: 89.25, note: "أدوية وفيتامينات", fromUserId: ahmad.id, merchantId: pharma.id, day: 5 });
  await tx({ type: "merchant", amount: 18, note: "قهوة الصباح", fromUserId: fahad.id, merchantId: bun.id, day: 4 });
  await tx({ type: "topup", amount: 300, note: "شحن ببطاقة مدى", toUserId: fahad.id, day: 3 });
  await tx({ type: "transfer", amount: 75, note: "مشوار", fromUserId: fahad.id, toUserId: ahmad.id, day: 3, hour: 15 });
  await tx({ type: "merchant", amount: 132.4, note: "عشاء عائلي", fromUserId: ahmad.id, merchantId: ryan.id, day: 2 });
  await tx({ type: "merchant", amount: 42, note: "مرطبانات", fromUserId: sara.id, merchantId: pharma.id, day: 1 });
  await tx({ type: "merchant", amount: 15.75, note: "كابتشينو", fromUserId: ahmad.id, merchantId: bun.id, day: 0, hour: 3 });

  // ==== المحادثات ====
  const t1 = await db.chatThread.create({ data: { userAId: ahmad.id, userBId: sara.id } });
  const t2 = await db.chatThread.create({ data: { userAId: ahmad.id, userBId: fahad.id } });
  const t3 = await db.chatThread.create({ data: { userAId: ahmad.id, userBId: ryanOwner.id } });

  const msg = (threadId: string, senderId: string, text: string, minutesAgo: number) =>
    db.chatMessage.create({ data: { threadId, senderId, kind: "text", text, createdAt: new Date(Date.now() - minutesAgo * 60000) } });
  const tmsg = (threadId: string, senderId: string, amount: number, txReference: string, minutesAgo: number) =>
    db.chatMessage.create({ data: { threadId, senderId, kind: "transfer", amount, txId: txReference, createdAt: new Date(Date.now() - minutesAgo * 60000) } });

  await msg(t1.id, sara.id, "السلام عليكم، تذكرت أني أديك ٣٥٠ من السلفة 🌟", 240);
  await tmsg(t1.id, sara.id, 350, ref(6), 236);
  await msg(t1.id, ahmad.id, "و عليكم السلام، وصلت! الله يعطيك العافية 🙏", 230);
  await msg(t2.id, fahad.id, "خير إن شاء الله، متى نلعب؟", 1500);
  await msg(t2.id, ahmad.id, "الخميس القادم إن شاء الله", 1490);
  await tmsg(t2.id, ahmad.id, 200, ref(3), 1480);
  await msg(t2.id, fahad.id, "وصل التحويل، شكراً! 🎾", 1470);
  await msg(t3.id, ryanOwner.id, "عرض هذا الأسبوع: خصم ١٠٪ على الفواتير فوق ١٠٠ ريال 🛒", 600);
  await msg(t3.id, ahmad.id, "ممتاز، شكراً على التنبيه", 590);

  console.log("✓ Seed done:");
  console.log(`  users=8, merchants=3, txs=${i}, threads=3, family=2`);
  console.log("  ديمو: 0551234567 أحمد (ولي أمر) | 0556789012 متجر الريان (تاجر) | 0553456789 خالد (ابن) — الرمز 1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
