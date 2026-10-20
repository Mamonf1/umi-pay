// مهمة 24-a: ترقية «متجر أمنيه» من حساب فردي إلى حساب تاجر كامل
// — role: individual → merchant + إنشاء سجل Merchant بمفتاح API
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const p = new PrismaClient();
const genKey = () => "umi_live_" + crypto.randomBytes(24).toString("hex");

async function main() {
  const phone = "963317782466";
  const user = await p.user.findUnique({ where: { phone }, include: { merchant: true, wallet: true } });
  if (!user) throw new Error("user not found: " + phone);

  console.log("قبل:", user.phone, "|", user.name, "| role:", user.role, "| merchant:", user.merchant ? user.merchant.id : "لا يوجد");

  if (user.role === "merchant" && user.merchant) {
    console.log("الحساب تاجر بالفعل — لا تغيير");
    return;
  }

  const updated = await p.user.update({
    where: { id: user.id },
    data: {
      role: "merchant",
      ...(user.merchant
        ? {}
        : {
            merchant: {
              create: {
                name: user.name.slice(0, 40),
                category: "متجر عام",
                emoji: "🛒",
                apiKey: genKey(),
                apiKeyAt: new Date(),
              },
            },
          }),
    },
    include: { merchant: true },
  });

  console.log("بعد :", updated.phone, "|", updated.name, "| role:", updated.role);
  console.log("تاجر:", updated.merchant?.id, "| اسم:", updated.merchant?.name);
  console.log("مفتاح API:", updated.merchant?.apiKey);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => p.$disconnect());
