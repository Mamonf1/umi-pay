// GET /api/umi/currency — تسعير الصرف الحالي (عام): سعر الدولار + قيمة نقطة أومي
import { db } from "@/lib/db";
import { ok } from "@/lib/umi-server";

export async function GET() {
  let s = await db.currencySettings.findUnique({ where: { id: "main" } });
  if (!s) s = await db.currencySettings.create({ data: { id: "main" } });
  return ok({ usdSyp: s.usdSyp, pointSyp: s.pointSyp, updatedAt: s.updatedAt });
}
