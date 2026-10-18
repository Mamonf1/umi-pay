"use client";

// UMI PAY — مزوّد أسعار الصرف: يجلب تسعير العملة مرة واحدة ويوزّعه على كل الشاشات
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "@/lib/umi-client";

export interface Rates {
  omiUsd: number; // سعر OMI الثابت مقابل الدولار (0.0005)
  usdSyp: number; // سعر الدولار بالليرة السورية — يديره الأدمن
  updatedAt?: string;
}

interface RatesCtx {
  rates: Rates;
  loading: boolean;
  refresh: () => void;
}

const DEFAULT_RATES: Rates = { omiUsd: 0.0005, usdSyp: 13000 };

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
      .then((r) => setRates({ omiUsd: r.omiUsd, usdSyp: r.usdSyp, updatedAt: r.updatedAt }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(refresh, [refresh]);

  return <Ctx.Provider value={{ rates, loading, refresh }}>{children}</Ctx.Provider>;
}

export const useRates = () => useContext(Ctx);
