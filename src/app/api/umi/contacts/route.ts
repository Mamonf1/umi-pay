// GET /api/umi/contacts?userId=&q= — البحث عن مستخدمين للتحويل
import { db } from "@/lib/db";
import { ok } from "@/lib/umi-server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") ?? "";
  const q = (searchParams.get("q") ?? "").trim();
  const users = await db.user.findMany({
    where: {
      id: { not: userId },
      ...(q ? { OR: [{ name: { contains: q } }, { phone: { contains: q } }] } : {}),
    },
    select: { id: true, name: true, phone: true, avatar: true, role: true },
    take: 12,
    orderBy: { name: "asc" },
  });
  return ok(users);
}
