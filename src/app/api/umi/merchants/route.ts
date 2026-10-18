// GET /api/umi/merchants — قائمة التجار المتصلين بالبوابة
import { db } from "@/lib/db";
import { ok } from "@/lib/umi-server";

export async function GET() {
  const merchants = await db.merchant.findMany({
    select: { id: true, name: true, category: true, emoji: true, color: true },
    orderBy: { name: "asc" },
  });
  return ok(merchants);
}
