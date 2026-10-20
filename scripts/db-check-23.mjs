// فحص حالة قاعدة البيانات قبل المهمة 23
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

const users = await db.user.findMany({
  select: { id: true, name: true, phone: true, pass: true, role: true, wallet: { select: { balance: true, points: true } } },
});
console.log("USERS:", JSON.stringify(users, null, 1));

const loans = await db.loanRequest.findMany();
console.log("LOANS:", JSON.stringify(loans, null, 1));

const settings = await db.currencySettings.findUnique({ where: { id: "main" } });
console.log("SETTINGS:", JSON.stringify(settings));

const txCount = await db.transaction.count();
console.log("TX_COUNT:", txCount);

await db.$disconnect();
