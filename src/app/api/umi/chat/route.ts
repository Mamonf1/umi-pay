// GET  /api/umi/chat?userId=      — قائمة المحادثات
// POST /api/umi/chat             — إرسال رسالة أو تحويل داخل المحادثة
import { db } from "@/lib/db";
import { assertChildCanSpend, fail, moveMoney, ok, r2 } from "@/lib/umi-server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") ?? "";
  const threads = await db.chatThread.findMany({
    where: { OR: [{ userAId: userId }, { userBId: userId }] },
    include: {
      userA: { select: { id: true, name: true, avatar: true, role: true } },
      userB: { select: { id: true, name: true, avatar: true, role: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  const data = threads.map((t) => {
    const peer = t.userAId === userId ? t.userB : t.userA;
    const last = t.messages[0];
    return {
      id: t.id,
      peer: { id: peer.id, name: peer.name, avatar: peer.avatar, role: peer.role },
      last: last
        ? {
            kind: last.kind,
            text: last.text,
            amount: last.amount,
            mine: last.senderId === userId,
            createdAt: last.createdAt.toISOString(),
          }
        : null,
    };
  });
  // الأحدث أولاً حسب آخر رسالة
  data.sort((a, b) => {
    const ta = a.last ? new Date(a.last.createdAt).getTime() : 0;
    const tb = b.last ? new Date(b.last.createdAt).getTime() : 0;
    return tb - ta;
  });
  return ok({ threads: data });
}

export async function POST(req: Request) {
  try {
    const { threadId, userId, peerId, text, amount, pin, image, statement, requestReport, action } = await req.json();
    if (!userId) return fail("جلسة غير صالحة");

    // فتح محادثة مع صديق دون رسالة — يعيد معرف المحادثة (ينشئها إن لم توجد)
    if (action === "ensure") {
      if (!peerId) return fail("حدد المستلم");
      if (peerId === userId) return fail("لا يمكن محادثة نفسك");
      let th = await db.chatThread.findFirst({
        where: { OR: [{ userAId: userId, userBId: peerId }, { userAId: peerId, userBId: userId }] },
      });
      if (!th) th = await db.chatThread.create({ data: { userAId: userId, userBId: peerId } });
      return ok({ threadId: th.id });
    }

    // إيجاد المحادثة أو إنشاؤها
    let tid = threadId as string | undefined;
    if (!tid) {
      if (!peerId) return fail("حدد المستلم");
      if (peerId === userId) return fail("لا يمكن محادثة نفسك");
      let th = await db.chatThread.findFirst({
        where: { OR: [{ userAId: userId, userBId: peerId }, { userAId: peerId, userBId: userId }] },
      });
      if (!th) th = await db.chatThread.create({ data: { userAId: userId, userBId: peerId } });
      tid = th.id;
    }

    // طلب مشاركة كشف الحساب — رسالة من نوع report_request
    if (requestReport) {
      const m = await db.chatMessage.create({
        data: { threadId: tid, senderId: userId, kind: "report_request", text: "طلب مشاركة كشف الحساب المشترك" },
      });
      return ok({ message: { ...m, mine: true, createdAt: m.createdAt.toISOString() } });
    }

    // إرسال كشف حساب مشترك — يولّد الخادم ملخص العمليات بين الطرفين
    if (statement) {
      const thread = await db.chatThread.findUnique({ where: { id: tid } });
      if (!thread) return fail("المحادثة غير موجودة", 404);
      const peerId2 = thread.userAId === userId ? thread.userBId : thread.userAId;
      const rows = await db.transaction.findMany({
        where: { OR: [{ fromUserId: userId, toUserId: peerId2 }, { fromUserId: peerId2, toUserId: userId }] },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          from: { select: { name: true } },
          to: { select: { name: true } },
        },
      });
      const txs = rows.map((t) => ({
        reference: t.reference,
        amount: t.amount,
        dir: t.fromUserId === userId ? "out" : "in",
        createdAt: t.createdAt.toISOString(),
      }));
      const totalIn = txs.filter((t) => t.dir === "in").reduce((s, t) => s + t.amount, 0);
      const totalOut = txs.filter((t) => t.dir === "out").reduce((s, t) => s + t.amount, 0);
      const payload = JSON.stringify({ count: txs.length, totalIn, totalOut, txs });
      const m = await db.chatMessage.create({
        data: { threadId: tid, senderId: userId, kind: "statement", text: "كشف حساب مشترك", data: payload },
      });
      return ok({ message: { ...m, mine: true, createdAt: m.createdAt.toISOString() } });
    }

    // صورة (dataURL مضغوط من العميل ≤ ~200KB) مع تعليق اختياري
    if (image) {
      const img = String(image);
      if (!img.startsWith("data:image/")) return fail("صيغة الصورة غير مدعومة");
      if (img.length > 400_000) return fail("الصورة كبيرة جداً — جرّب صورة أصغر");
      const m = await db.chatMessage.create({
        data: {
          threadId: tid,
          senderId: userId,
          kind: "image",
          text: text ? String(text).trim().slice(0, 200) : null,
          data: img,
        },
      });
      return ok({ message: { ...m, mine: true, createdAt: m.createdAt.toISOString() } });
    }

    const amt = amount ? r2(Number(amount)) : 0;

    // تحويل مالي داخل الشات
    if (amt > 0) {
      const sender = await db.user.findUnique({ where: { id: userId }, include: { wallet: true } });
      if (!sender) return fail("المرسل غير موجود", 404);
      if (sender.pin !== String(pin)) return fail("رمز الدفع غير صحيح (4 أرقام)");
      if (r2(sender.wallet?.balance ?? 0) < amt) return fail("الرصيد غير كافٍ");
      const thread = await db.chatThread.findUnique({ where: { id: tid } });
      if (!thread) return fail("المحادثة غير موجودة", 404);
      const peerId2 = thread.userAId === userId ? thread.userBId : thread.userAId;
      const childErr = await assertChildCanSpend(userId, amt);
      if (childErr) return fail(childErr);
      const reference = await moveMoney({
        type: "transfer",
        amount: amt,
        fromUserId: userId,
        toUserId: peerId2,
        note: "تحويل عبر المحادثة",
      });
      const m = await db.chatMessage.create({
        data: { threadId: tid, senderId: userId, kind: "transfer", amount: amt, txId: reference },
      });
      return ok({ message: { ...m, mine: true, createdAt: m.createdAt.toISOString() }, reference });
    }

    // رسالة نصية
    if (!text || !String(text).trim()) return fail("الرسالة فارغة");
    const m = await db.chatMessage.create({
      data: { threadId: tid, senderId: userId, kind: "text", text: String(text).trim().slice(0, 300) },
    });
    return ok({ message: { ...m, mine: true, createdAt: m.createdAt.toISOString() } });
  } catch {
    return fail("تعذر إرسال الرسالة", 500);
  }
}
