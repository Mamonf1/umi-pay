// UMI PAY — بطاقة التميز (نظام أمريكان إكسبريس: 15 خانة)
// GET  ?userId= → حالة البطاقة + الأهلية (رصيد 50,000 ل.س فأكثر)
// POST {userId} → إصدار البطاقة إن كان مستحقاً لها
import { db } from "@/lib/db";
import { fail, ok } from "@/lib/umi-server";

const MIN_BALANCE = 50000;

function genAmexNumber(): string {
  // 15 خانة بنمط AmEx: تبدأ بـ 37 ثم 13 خانة عشوائية
  let n = "37";
  for (let i = 0; i < 13; i++) n += Math.floor(Math.random() * 10);
  return n;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") ?? "";
    const user = await db.user.findUnique({ where: { id: userId }, include: { wallet: true } });
    if (!user) return fail("المستخدم غير موجود", 404);

    const card = await db.tamayuzCard.findUnique({ where: { userId } });
    const balance = user.wallet?.balance ?? 0;
    return ok({
      card,
      eligible: balance >= MIN_BALANCE,
      minBalance: MIN_BALANCE,
      balance,
    });
  } catch {
    return fail("تعذر تحميل بيانات البطاقة", 500);
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();
    const user = await db.user.findUnique({ where: { id: String(userId ?? "") }, include: { wallet: true } });
    if (!user) return fail("المستخدم غير موجود", 404);
    if (user.role === "admin") return fail("بطاقة التميز للحسابات الشخصية والتجارية");

    const existing = await db.tamayuzCard.findUnique({ where: { userId } });
    if (existing) return fail("لديك بطاقة تميز بالفعل");

    const balance = user.wallet?.balance ?? 0;
    if (balance < MIN_BALANCE)
      return fail(
        `إصدار بطاقة التميز يتطلب رصيد ${MIN_BALANCE.toLocaleString("en-US")} ل.س فأكثر — رصيدك ${Math.round(balance).toLocaleString("en-US")} ل.س`
      );

    const now = new Date();
    const expiry = new Date(now.getFullYear() + 4, now.getMonth());
    const mm = String(expiry.getMonth() + 1).padStart(2, "0");
    const yy = String(expiry.getFullYear()).slice(-2);

    const card = await db.tamayuzCard.create({
      data: {
        userId,
        number: genAmexNumber(),
        holder: user.name,
        expiry: `${mm}/${yy}`,
        tier: "GOLD",
      },
    });
    return ok({ card });
  } catch {
    return fail("تعذر إصدار البطاقة", 500);
  }
}
