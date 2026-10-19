// UMI PAY — أنواع البيانات المشتركة
export type Role = "individual" | "merchant" | "admin";

export interface Me {
  id: string;
  name: string;
  phone: string;
  role: Role;
  avatar: string;
  balance: number; // بالليرة السورية
  points: number; // نقاط أومي
}

export type TxType = "transfer" | "topup" | "merchant" | "allowance" | "loan" | "loan_repay";

export interface TxItem {
  id: string;
  reference: string;
  type: TxType;
  amount: number;
  status: string;
  note: string | null;
  createdAt: string;
  direction: "in" | "out" | "neutral";
  counterparty: string;
  emoji: string;
}

export interface HomeData {
  me: Me;
  weekIn: number;
  weekOut: number;
  txs: TxItem[];
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  role: string;
}

export interface MerchantT {
  id: string;
  name: string;
  category: string;
  emoji: string;
  color: string;
}

export interface LoanItem {
  id: string;
  amount: number;
  paidAmount: number;
  remaining: number;
  currency: string;
  status: "pending" | "approved" | "rejected" | "paid";
  note: string | null;
  createdAt: string;
  updatedAt: string;
  userName?: string;
  userPhone?: string;
  userAvatar?: string;
}

export interface LoansData {
  loans: LoanItem[];
  totalRemaining: number;
  monitoring?: {
    unpaidCount: number;
    unpaidTotal: number;
    unpaid: LoanItem[];
    pending: LoanItem[];
  };
}

export interface TamayuzCardT {
  id: string;
  number: string;
  holder: string;
  expiry: string;
  tier: string;
  status: string;
}

export interface ThreadT {
  id: string;
  peer: { id: string; name: string; avatar: string; role: string };
  last: {
    kind: string;
    text: string | null;
    amount: number | null;
    mine: boolean;
    createdAt: string;
  } | null;
}

export interface MsgT {
  id: string;
  senderId: string;
  kind: "text" | "transfer";
  text: string | null;
  amount: number | null;
  mine: boolean;
  createdAt: string;
}

export const TYPE_LABELS: Record<TxType, string> = {
  transfer: "تحويل",
  topup: "شحن محفظة",
  merchant: "دفع لمتجر",
  allowance: "مصروف",
  loan: "صرف قرض",
  loan_repay: "سداد قرض",
};

/** تنسيق عام بخانتين عشريتين (للاستخدامات الخاصة) */
export const fmt = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** وقت نسبي عربي */
export function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "الآن";
  if (m < 60) return `قبل ${m} د`;
  const h = Math.floor(m / 60);
  if (h < 24) return `قبل ${h} س`;
  const d = Math.floor(h / 24);
  if (d < 7) return `قبل ${d} يوم`;
  return new Date(iso).toLocaleDateString("ar", { day: "numeric", month: "short" });
}
