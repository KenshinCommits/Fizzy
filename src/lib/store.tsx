import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { AppData, Event, PipelineStage, Product } from "../data/models";
import { intentFromScore, seed } from "../data/seed";
const KEY = "fizzi-admin-v1";
export const money = (v: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(v);
export const shortMoney = (v: number) =>
  v >= 100000 ? `₹${(v / 100000).toFixed(2)}L` : money(v);
export const initials = (s: string) =>
  s
    .split(" ")
    .map((x) => x[0])
    .slice(0, 2)
    .join("");
export const date = (s: string) =>
  new Date(s).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
export const time = (s: string) =>
  new Date(s).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Kolkata",
  });
export const duration = (n: number) => `${Math.floor(n / 60)}m ${n % 60}s`;
// Replace this adapter with authenticated HTTP calls; UI consumes the same AppData contract.
export const adminRepository = {
  async load(): Promise<AppData> {
    await new Promise((r) => setTimeout(r, 420));
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(seed);
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.customers) || !Array.isArray(parsed.products))
      throw new Error("Saved workspace data could not be read.");
    return parsed;
  },
  save(data: AppData) {
    localStorage.setItem(KEY, JSON.stringify(data));
  },
};
type Store = {
  data: AppData;
  loading: boolean;
  error: string;
  retry: () => void;
  update: (fn: (d: AppData) => AppData) => void;
  toast: (s: string) => void;
  message: string;
  live: boolean;
  setLive: (v: boolean) => void;
  moveLead: (id: string, stage: PipelineStage) => void;
  addEvent: (event: Omit<Event, "id" | "timestamp">) => void;
  addProduct: (p: Product) => void;
};
const Context = createContext<Store>(null!);
export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(structuredClone(seed));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [live, setLive] = useState(false);
  const toast = useCallback((s: string) => setMessage(s), []);
  const retry = useCallback(() => {
    setError("");
    setLoading(true);
    adminRepository
      .load()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  useEffect(retry, [retry]);
  useEffect(() => {
    if (message) {
      const t = setTimeout(() => setMessage(""), 4500);
      return () => clearTimeout(t);
    }
  }, [message]);
  const update = useCallback(
    (fn: (d: AppData) => AppData) =>
      setData((prev) => {
        const next = fn(prev);
        try {
          adminRepository.save(next);
        } catch {
          setTimeout(
            () =>
              toast(
                "Changes are in memory. Browser storage is unavailable or full.",
              ),
            0,
          );
        }
        return next;
      }),
    [toast],
  );
  const addEvent = useCallback(
    (input: Omit<Event, "id" | "timestamp">) =>
      update((d) => {
        const event = {
          ...input,
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
        };
        const c = d.customers.find((x) => x.userId === input.customerId);
        if (!c) return d;
        const score = Math.max(0, Math.min(100, c.leadScore + input.impact));
        const stage: PipelineStage =
          input.type === "Quote request"
            ? "Bulk Quote"
            : input.type === "Cart abandoned"
              ? "Cart Abandoned"
              : score > 80 &&
                  ![
                    "Closed Won",
                    "Closed Lost",
                    "Negotiation",
                    "Bulk Quote",
                  ].includes(c.leadStage)
                ? "High Intent"
                : c.leadStage;
        return {
          ...d,
          events: [event, ...d.events].slice(0, 100),
          customers: d.customers.map((x) =>
            x.userId === c.userId
              ? {
                  ...x,
                  leadScore: score,
                  intent: intentFromScore(score),
                  leadStage: stage,
                  lastActive: "Just now",
                  productViews:
                    x.productViews + (input.type === "Product view" ? 1 : 0),
                  mostViewedProducts:
                    input.type === "Product view"
                      ? (x.mostViewedProducts.some(
                          (p) => p.productId === input.productId,
                        )
                          ? x.mostViewedProducts.map((p) =>
                              p.productId === input.productId
                                ? { ...p, views: p.views + 1 }
                                : p,
                            )
                          : [
                              ...x.mostViewedProducts,
                              { productId: input.productId, views: 1 },
                            ]
                        ).sort((a, b) => b.views - a.views)
                      : x.mostViewedProducts,
                  recentlyViewedProducts:
                    input.type === "Product view"
                      ? [
                          input.productId,
                          ...x.recentlyViewedProducts.filter(
                            (p) => p !== input.productId,
                          ),
                        ].slice(0, 5)
                      : x.recentlyViewedProducts,
                  pricingViews:
                    x.pricingViews + (input.type === "Pricing view" ? 1 : 0),
                  cartInteractions:
                    x.cartInteractions + (input.type === "Cart update" ? 1 : 0),
                  checkoutAttempts:
                    x.checkoutAttempts + (input.type === "Checkout" ? 1 : 0),
                }
              : x,
          ),
          products: d.products.map((p) =>
            p.id === input.productId && input.type === "Product view"
              ? { ...p, views: p.views + 1 }
              : p,
          ),
          leads: d.leads.map((l) =>
            l.customerId === c.userId
              ? { ...l, stage, lastActivity: "Just now" }
              : l,
          ),
          scoreHistory: [
            ...d.scoreHistory,
            {
              id: crypto.randomUUID(),
              customerId: c.userId,
              delta: score - c.leadScore,
              reason: input.description,
              timestamp: event.timestamp,
            },
          ],
        };
      }),
    [update],
  );
  useEffect(() => {
    if (!live) return;
    let i = 0;
    const t = setInterval(() => {
      const c = seed.customers[i++ % 5];
      const type = i % 2 ? "Product view" : "Pricing view";
      addEvent({
        customerId: c.userId,
        productId: c.currentProduct,
        type,
        impact: data.rules.find((r) => r.event === type)?.weight ?? 3,
        description:
          type === "Product view"
            ? "explored a product"
            : "checked pack pricing",
      });
    }, 9000);
    return () => clearInterval(t);
  }, [live, addEvent, data.rules]);
  const moveLead = (id: string, stage: PipelineStage) => {
    update((d) => {
      const lead = d.leads.find((l) => l.id === id);
      return {
        ...d,
        leads: d.leads.map((l) => (l.id === id ? { ...l, stage } : l)),
        customers: d.customers.map((c) =>
          c.userId === lead?.customerId ? { ...c, leadStage: stage } : c,
        ),
      };
    });
    toast(`Opportunity moved to ${stage}`);
  };
  return (
    <Context.Provider
      value={{
        data,
        loading,
        error,
        retry,
        update,
        toast,
        message,
        live,
        setLive,
        moveLead,
        addEvent,
        addProduct: (p) => {
          update((d) => ({ ...d, products: [p, ...d.products] }));
          toast("Product added to your catalog");
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const useStore = () => useContext(Context);
export function exportCsv(name: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [
    keys.map(escape).join(","),
    ...rows.map((r) => keys.map((k) => escape(r[k])).join(",")),
  ].join("\r\n");
  const url = URL.createObjectURL(
    new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `fizzi-${name}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
