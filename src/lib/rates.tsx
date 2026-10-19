"use client";

// UMI PAY — مزوّد تسعير الصرف: يجلب التسعير مرة واحدة ويوزّعه على كل الشاشات
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "@/lib/umi-client";

export interface Rates {
  usdSyp: number; // سعر الدولار بالليرة السورية — يديره الأدمن أو يُزامَن من مصدر موثوق
  pointSyp: number; // قيمة نقطة أومي الواحدة بالليرة — يحددها الأدمن
  updatedAt?: string;
}

interface RatesCtx {
  rates: Rates;
  loading: boolean;
  refresh: () => void;
}

const DEFAULT_RATES: Rates = { usdSyp: 13000, pointSyp: 10 };

const Ctx = createContext<RatesCtx>({
  rates: DEFAULT_RATES,
  loading: true,
  refresh: () => {},
});

export function RatesProvider({ children }: { children: React.ReactNode }) {
  const [rates, setRates] = useState<Rates>(DEFAULT_RATES);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    api<Rates>("/api/umi/currency")
      .then((r) =>
        setRates({
          usdSyp: r.usdSyp ?? DEFAULT_RATES.usdSyp,
          pointSyp: r.pointSyp ?? DEFAULT_RATES.pointSyp,
          updatedAt: r.updatedAt,
        })
      )
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(refresh, [refresh]);

  return <Ctx.Provider value={{ rates, loading, refresh }}>{children}</Ctx.Provider>;
}

export const useRates = () => useContext(Ctx);
