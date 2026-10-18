// GET /api/umi/currency — تسعير العملة الحالي (عام): OMI ثابت مقابل الدولار + سعر الدولار بالليرة
import { db } from "@/lib/db";
import { ok } from "@/lib/umi-server";

export async function GET() {
  let s = await db.currencySettings.findUnique({ where: { id: "main" } });
  if (!s) s = await db.currencySettings.create({ data: { id: "main" } });
  return ok({ omiUsd: s.omiUsd, usdSyp: s.usdSyp, updatedAt: s.updatedAt });
}
