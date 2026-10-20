// GET /api/umi/chat/[id]?userId= — رسائل محادثة محددة
import { db } from "@/lib/db";
import { fail, ok } from "@/lib/umi-server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") ?? "";

  const thread = await db.chatThread.findUnique({
    where: { id },
    include: {
      userA: { select: { id: true, name: true, avatar: true, role: true } },
      userB: { select: { id: true, name: true, avatar: true, role: true } },
    },
  });
  if (!thread) return fail("المحادثة غير موجودة", 404);
  if (thread.userAId !== userId && thread.userBId !== userId) return fail("غير مصرح", 403);
  const peer = thread.userAId === userId ? thread.userB : thread.userA;

  const messages = await db.chatMessage.findMany({
    where: { threadId: id },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  return ok({
    peer: { id: peer.id, name: peer.name, avatar: peer.avatar, role: peer.role },
    messages: messages.map((m) => ({
      id: m.id,
      senderId: m.senderId,
      kind: m.kind,
      text: m.text,
      data: m.data,
      amount: m.amount,
      txId: m.txId,
      mine: m.senderId === userId,
      createdAt: m.createdAt.toISOString(),
    })),
  });
}
