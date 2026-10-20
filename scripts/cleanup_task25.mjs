// مهمة 25 — تنظيف الحسابات المؤقتة (اختبار الأصدقاء والدردشة) + سلامة القاعدة
import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

async function deleteUserDeep(id) {
  await p.tamayuzCard.deleteMany({ where: { userId: id } });
  await p.transaction.deleteMany({ where: { OR: [{ fromUserId: id }, { toUserId: id }] } });
  // محادثاته (الرسائل تُحذف بالتسلسل Cascade من Thread)
  const threads = await p.chatThread.findMany({ where: { OR: [{ userAId: id }, { userBId: id }] }, select: { id: true } });
  for (const t of threads) {
    await p.chatMessage.deleteMany({ where: { threadId: t.id } });
    await p.chatThread.delete({ where: { id: t.id } }).catch(() => {});
  }
  await p.friend.deleteMany({ where: { OR: [{ userId: id }, { friendId: id }] } });
  await p.merchant.deleteMany({ where: { ownerId: id } });
  await p.wallet.deleteMany({ where: { userId: id } });
  await p.user.delete({ where: { id } }).catch((e) => console.log("  user delete err:", String(e).slice(0, 80)));
}

async function main() {
  const temps = await p.user.findMany({ where: { name: { contains: "اختبار" } }, select: { id: true, name: true, phone: true } });
  console.log("مؤقتون للحذف:", temps.length);
  for (const u of temps) {
    console.log("  —", u.phone, u.name);
    await deleteUserDeep(u.id);
  }

  console.log("--- الحالة النهائية:");
  const users = await p.user.findMany({ select: { phone: true, name: true, role: true } });
  for (const x of users) console.log("   ", x.phone, "|", x.name, "|", x.role);
  const w = await p.wallet.findMany({ include: { user: { select: { phone: true } } } });
  for (const x of w) console.log("    💰", x.user?.phone, "| رصيد:", x.balance);
  const friends = await p.friend.count();
  const threads = await p.chatThread.count();
  const msgs = await p.chatMessage.count();
  const txs = await p.transaction.count();
  console.log("    friends:", friends, "| threads:", threads, "| msgs:", msgs, "| txs:", txs);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => p.$disconnect());
