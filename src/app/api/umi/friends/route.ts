// UMI PAY — الأصدقاء
// GET  ?userId=                            → {friends, requests, sent}
// POST {userId, action:"add", phone|friendId, } → إرسال طلب صداقة
// PATCH {userId, action:"accept"|"reject"|"remove", friendId} → إدارة الطلبات والقائمة
import { db } from "@/lib/db";
import { fail, ok } from "@/lib/umi-server";

const PEER = { select: { id: true, name: true, phone: true, avatar: true, role: true } };

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") ?? "";
  if (!userId) return fail("جلسة غير صالحة");

  const mine = await db.friend.findMany({
    where: { userId },
    include: { friend: PEER },
    orderBy: { createdAt: "desc" },
  });

  const incoming = await db.friend.findMany({
    where: { friendId: userId, status: "pending" },
    include: { user: PEER },
    orderBy: { createdAt: "desc" },
  });

  const friends = mine
    .filter((f) => f.status === "accepted")
    .map((f) => ({ id: f.friend.id, name: f.friend.name, phone: f.friend.phone, avatar: f.friend.avatar, role: f.friend.role, since: f.createdAt.toISOString() }));

  // طلبات أرسلتها وأنا بانتظار القبول
  const sent = mine
    .filter((f) => f.status === "pending")
    .map((f) => ({ id: f.friend.id, name: f.friend.name, phone: f.friend.phone, avatar: f.friend.avatar }));

  // دعم أومي باي — حساب الإدارة: محادثة رسمية متاحة دائماً لكل المستخدمين
  const admin = await db.user.findFirst({
    where: { role: "admin" },
    select: { id: true, name: true, avatar: true },
  });

  return ok({
    friends,
    requests: incoming.map((f) => ({ id: f.user.id, name: f.user.name, phone: f.user.phone, avatar: f.user.avatar })),
    sent,
    support: admin,
  });
}

export async function POST(req: Request) {
  try {
    const { userId, phone, friendId } = await req.json();
    if (!userId) return fail("جلسة غير صالحة");

    // تحديد الطرف: برقم الهاتف أو المعرّف (من صف عملية)
    let peer = null as any;
    if (friendId) peer = await db.user.findUnique({ where: { id: String(friendId) } });
    else if (phone) {
      const ph = String(phone).trim();
      peer = await db.user.findUnique({ where: { phone: ph } });
      if (!peer) {
        const suffix = await db.user.findFirst({ where: { phone: { endsWith: ph } } });
        peer = suffix;
      }
    }
    if (!peer) return fail("لا يوجد مستخدم بهذا الرقم — تأكد من الرقم (مع أو بدون مفتاح الدولة)");
    if (peer.id === userId) return fail("لا يمكنك إضافة نفسك كصديق");

    // موجود مسبقاً؟
    const existing = await db.friend.findUnique({ where: { userId_friendId: { userId, friendId: peer.id } } });
    if (existing) {
      if (existing.status === "accepted") return fail("هذا المستخدم صديقك بالفعل");
      return fail("طلبك السابق لا يزال بانتظار القبول");
    }
    // هل الطرف الآخر أرسل لي طلباً؟ → اقبل مباشرة (صداقة متبادلة)
    const reverse = await db.friend.findUnique({ where: { userId_friendId: { userId: peer.id, friendId: userId } } });
    if (reverse && reverse.status === "pending") {
      await db.$transaction([
        db.friend.update({ where: { id: reverse.id }, data: { status: "accepted" } }),
        db.friend.create({ data: { userId, friendId: peer.id, status: "accepted" } }),
      ]);
      return ok({ added: true, accepted: true, friend: { id: peer.id, name: peer.name, avatar: peer.avatar }, message: `أصبحتما صديقين ✓ — ${peer.name}` });
    }

    await db.friend.create({ data: { userId, friendId: peer.id, status: "pending" } });
    return ok({ added: true, accepted: false, friend: { id: peer.id, name: peer.name, avatar: peer.avatar }, message: `أُرسل طلب الصداقة إلى ${peer.name} ✓` });
  } catch {
    return fail("تعذر إرسال الطلب", 500);
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId, action, friendId } = await req.json();
    if (!userId || !friendId) return fail("بيانات ناقصة");

    if (action === "accept") {
      const reqRow = await db.friend.findUnique({ where: { userId_friendId: { userId: friendId, friendId: userId } } });
      if (!reqRow || reqRow.status !== "pending") return fail("لا يوجد طلب صداقة معلق من هذا المستخدم");
      const peer = await db.user.findUnique({ where: { id: friendId } });
      const mutual = await db.friend.findUnique({ where: { userId_friendId: { userId, friendId } } });
      await db.$transaction([
        db.friend.update({ where: { id: reqRow.id }, data: { status: "accepted" } }),
        ...(mutual
          ? [db.friend.update({ where: { id: mutual.id }, data: { status: "accepted" } })]
          : [db.friend.create({ data: { userId, friendId, status: "accepted" } })]),
      ]);
      return ok({ accepted: true, message: `تمت إضافة ${peer?.name ?? "الصديق"} إلى قائمة أصدقائك ✓` });
    }

    if (action === "reject") {
      await db.friend.deleteMany({ where: { userId: friendId, friendId: userId, status: "pending" } });
      return ok({ message: "رُفض الطلب" });
    }

    if (action === "remove") {
      await db.friend.deleteMany({ where: { OR: [{ userId, friendId }, { userId: friendId, friendId: userId }] } });
      return ok({ message: "أُزيل الصديق من قائمتك" });
    }

    return fail("إجراء غير معروف");
  } catch {
    return fail("تعذر تنفيذ الإجراء", 500);
  }
}
