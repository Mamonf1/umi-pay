// المهمة 23 — تغيير كلمة مرور حساب المتجر (7782416) بناءً على طلب أدمن المحفظة
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

const NEW_PASS = "UmiMarket26"; // 11 خانة — حروف وأرقام

const u = await db.user.update({
  where: { phone: "7782416" },
  data: { pass: NEW_PASS },
  select: { id: true, name: true, phone: true, pass: true, role: true },
});
console.log("UPDATED:", JSON.stringify(u));

// تحقق فوري بقراءة الحساب بعد التحديث
const check = await db.user.findUnique({ where: { phone: "7782416" }, select: { pass: true } });
console.log("VERIFY:", check?.pass === NEW_PASS ? "OK — كلمة المرور الجديدة مطبقة" : "FAILED");
await db.$disconnect();
