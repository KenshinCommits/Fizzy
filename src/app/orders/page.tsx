"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AUTH_TOKEN_KEY, clearSession, getStoredUser } from "@/lib/auth";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

type OrderItem = {
  productName: string;
  productSnapshot?: { name: string; image: string; packSize: string; price: number };
  quantity: number;
  price: number;
  total: number;
};

type Order = {
  _id: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  total: number;
  discount: number;
  shipping: number;
  paymentStatus: string;
  fulfillmentStatus: string;
  createdAt: string;
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Placed", confirmed: "Confirmed", processing: "Processing",
  packed: "Packed", shipped: "Shipped", out_for_delivery: "Out for delivery",
  delivered: "Delivered", cancelled: "Cancelled",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "#1a7a50", confirmed: "#1a7a50", processing: "#b45309",
  shipped: "#1d4ed8", delivered: "#136a3b", cancelled: "#c0392b",
};

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export default function MyOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    const user = getStoredUser();
    if (!user) { router.replace("/login?next=/orders"); return; }

    const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) { router.replace("/login?next=/orders"); return; }

    fetch(`${API}/orders`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => {
        if (res.status === 401) { clearSession(); router.replace("/login?next=/orders"); return null; }
        if (!res.ok) throw new Error(`Server error ${res.status}`);
        return res.json();
      })
      .then((data) => { if (data) setOrders(data.orders ?? []); })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={page}>
      {/* Nav */}
      <nav style={nav}>
        <Link href="/" style={logo}>fizzi<span style={{ color: "#e15e43", fontSize: 13, verticalAlign: "top" }}>✦</span></Link>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/shop" style={navLink}>Shop</Link>
          <Link href="/orders" style={{ ...navLink, textDecoration: "underline", opacity: 1 }}>My Orders</Link>
          <button style={logoutBtn} onClick={() => { clearSession(); router.replace("/"); }}>Log out</button>
        </div>
      </nav>

      {/* Content */}
      <div style={content}>
        <div style={{ marginBottom: 32 }}>
          <p style={eyebrow}>✳ YOUR ORDER HISTORY</p>
          <h1 style={heading}>My Orders</h1>
        </div>

        {/* States */}
        {loading && (
          <div style={stateBox}>
            <div style={spinner} />
            <p style={{ color: "#78837b", fontSize: 15, margin: 0 }}>Loading your orders…</p>
          </div>
        )}

        {error && !loading && (
          <div style={{ ...stateBox, background: "#fdecea", border: "1px solid #f5c6c2" }}>
            <p style={{ color: "#c0392b", margin: 0, fontSize: 14 }}>⚠ {error}</p>
            <button style={retryBtn} onClick={() => window.location.reload()}>Retry</button>
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div style={emptyBox}>
            <p style={{ fontSize: 48, margin: "0 0 16px" }}>🛒</p>
            <h2 style={{ margin: "0 0 8px", fontSize: 22 }}>No orders yet</h2>
            <p style={{ color: "#78837b", margin: "0 0 24px" }}>Your order history will appear here after your first purchase.</p>
            <Link href="/shop" style={ctaBtn}>Start shopping →</Link>
          </div>
        )}

        {/* Order cards */}
        {!loading && orders.map((order) => {
          const isOpen = expanded === order._id;
          const statusColor = STATUS_COLOR[order.fulfillmentStatus] ?? "#1a7a50";
          return (
            <div key={order._id} style={card}>
              {/* Card header */}
              <div style={cardHeader}>
                <div>
                  <p style={orderNo}>{order.orderNumber}</p>
                  <p style={orderDate}>
                    {new Date(order.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric", month: "long", year: "numeric",
                    })}
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <span style={{ ...badge, background: statusColor + "18", color: statusColor }}>
                    ● {STATUS_LABEL[order.fulfillmentStatus] ?? order.fulfillmentStatus}
                  </span>
                  <strong style={{ fontSize: 18 }}>{fmt(order.total)}</strong>
                  <button
                    style={expandBtn}
                    onClick={() => setExpanded(isOpen ? null : order._id)}
                  >
                    {isOpen ? "Hide ▲" : "Details ▼"}
                  </button>
                </div>
              </div>

              {/* Product summary (always visible) */}
              <div style={itemsSummary}>
                {order.items.map((item, i) => {
                  const name = item.productSnapshot?.name ?? item.productName;
                  const pack = item.productSnapshot?.packSize;
                  return (
                    <div key={i} style={summaryItem}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{name}</span>
                      {pack && <span style={{ fontSize: 12, color: "#78837b" }}>{pack}</span>}
                      <span style={{ fontSize: 13, color: "#40564f" }}>× {item.quantity}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, marginLeft: "auto" }}>{fmt(item.total)}</span>
                    </div>
                  );
                })}
              </div>

              {/* Expanded detail */}
              {isOpen && (
                <div style={expandSection}>
                  <div style={divider} />

                  {/* Full items table */}
                  <table style={table}>
                    <thead>
                      <tr>
                        {["Product", "Pack size", "Qty", "Unit price", "Line total"].map((h) => (
                          <th key={h} style={th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item, i) => {
                        const snap = item.productSnapshot;
                        return (
                          <tr key={i}>
                            <td style={td}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                {snap?.image && (
                                  <img src={snap.image} alt="" style={{ width: 40, height: 60, objectFit: "contain", borderRadius: 6 }} />
                                )}
                                <span style={{ fontWeight: 700, fontSize: 14 }}>{snap?.name ?? item.productName}</span>
                              </div>
                            </td>
                            <td style={td}>{snap?.packSize ?? "—"}</td>
                            <td style={td}>{item.quantity}</td>
                            <td style={td}>{fmt(item.price)}</td>
                            <td style={{ ...td, fontWeight: 700 }}>{fmt(item.total)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Totals */}
                  <div style={totalsBox}>
                    {order.discount > 0 && (
                      <div style={totalRow}><span>Discount</span><span>−{fmt(order.discount)}</span></div>
                    )}
                    {order.shipping > 0 && (
                      <div style={totalRow}><span>Shipping</span><span>{fmt(order.shipping)}</span></div>
                    )}
                    <div style={{ ...totalRow, fontWeight: 800, fontSize: 17, borderTop: "1px solid #e2dece", paddingTop: 10, marginTop: 6 }}>
                      <span>Total</span><span>{fmt(order.total)}</span>
                    </div>
                  </div>

                  {/* Status row */}
                  <div style={statusRow}>
                    <div style={statusPill}>
                      <span style={{ color: "#78837b", fontSize: 12 }}>Order status</span>
                      <strong style={{ color: statusColor, fontSize: 13 }}>
                        ● {STATUS_LABEL[order.fulfillmentStatus] ?? order.fulfillmentStatus}
                      </strong>
                    </div>
                    <div style={statusPill}>
                      <span style={{ color: "#78837b", fontSize: 12 }}>Payment</span>
                      <strong style={{ fontSize: 13 }}>{order.paymentStatus}</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Inline styles ── */
const page: React.CSSProperties = {
  minHeight: "100vh", background: "#fffdf4", color: "#17352f",
  fontFamily: "'Nunito Sans', Arial, sans-serif",
};
const nav: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "space-between",
  padding: "18px clamp(20px, 5vw, 72px)", borderBottom: "1px solid #e6dfc8",
};
const logo: React.CSSProperties = {
  fontFamily: "'Caveat', cursive", fontSize: 36, fontWeight: 700,
  color: "#17352f", textDecoration: "none",
};
const navLink: React.CSSProperties = {
  fontSize: 13, fontWeight: 700, color: "#17352f", textDecoration: "none", opacity: 0.7,
};
const logoutBtn: React.CSSProperties = {
  padding: "8px 18px", border: "1px solid #17352f", borderRadius: 20,
  background: "transparent", fontSize: 13, fontWeight: 700, color: "#17352f", cursor: "pointer",
};
const content: React.CSSProperties = {
  maxWidth: 860, margin: "0 auto", padding: "48px clamp(20px,5vw,40px) 80px",
};
const eyebrow: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, letterSpacing: "1.4px", color: "#78837b", margin: "0 0 8px",
};
const heading: React.CSSProperties = {
  margin: 0, fontSize: 36, fontWeight: 900,
};
const stateBox: React.CSSProperties = {
  display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
  padding: 48, borderRadius: 14, background: "#fff", border: "1px solid #e2dece",
};
const spinner: React.CSSProperties = {
  width: 32, height: 32, border: "3px solid #e2dece",
  borderTopColor: "#17352f", borderRadius: "50%",
  animation: "spin 0.8s linear infinite",
};
const retryBtn: React.CSSProperties = {
  padding: "8px 20px", border: "1px solid #c0392b", borderRadius: 20,
  background: "transparent", color: "#c0392b", fontWeight: 700, cursor: "pointer",
};
const emptyBox: React.CSSProperties = {
  textAlign: "center", padding: "64px 32px", background: "#fff",
  border: "1px solid #e2dece", borderRadius: 14,
};
const ctaBtn: React.CSSProperties = {
  display: "inline-block", padding: "12px 28px", borderRadius: 28,
  background: "#17352f", color: "#fffdf4", fontWeight: 700, fontSize: 14, textDecoration: "none",
};
const card: React.CSSProperties = {
  border: "1px solid #e2dece", borderRadius: 14, padding: "24px",
  marginBottom: 16, background: "#fff",
};
const cardHeader: React.CSSProperties = {
  display: "flex", alignItems: "flex-start", justifyContent: "space-between",
  gap: 16, flexWrap: "wrap",
};
const orderNo: React.CSSProperties = {
  fontSize: 18, fontWeight: 800, margin: "0 0 4px", letterSpacing: "-0.3px",
};
const orderDate: React.CSSProperties = { fontSize: 13, color: "#78837b", margin: 0 };
const badge: React.CSSProperties = {
  display: "inline-block", padding: "4px 12px", borderRadius: 20,
  fontSize: 12, fontWeight: 700,
};
const expandBtn: React.CSSProperties = {
  padding: "6px 14px", border: "1px solid #e2dece", borderRadius: 20,
  background: "transparent", fontSize: 12, fontWeight: 700, cursor: "pointer", color: "#17352f",
};
const itemsSummary: React.CSSProperties = {
  display: "flex", flexDirection: "column", gap: 8, marginTop: 16,
  paddingTop: 16, borderTop: "1px solid #f0ece0",
};
const summaryItem: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
};
const expandSection: React.CSSProperties = { marginTop: 16 };
const divider: React.CSSProperties = {
  height: 1, background: "#e2dece", margin: "0 0 20px",
};
const table: React.CSSProperties = {
  width: "100%", borderCollapse: "collapse", fontSize: 13,
};
const th: React.CSSProperties = {
  textAlign: "left", padding: "8px 12px", fontSize: 11,
  fontWeight: 700, color: "#78837b", letterSpacing: "0.8px",
  borderBottom: "1px solid #e2dece", textTransform: "uppercase",
};
const td: React.CSSProperties = {
  padding: "12px", borderBottom: "1px solid #f0ece0", verticalAlign: "middle",
};
const totalsBox: React.CSSProperties = {
  marginTop: 16, padding: "16px 12px", background: "#f9f6ed", borderRadius: 10,
};
const totalRow: React.CSSProperties = {
  display: "flex", justifyContent: "space-between", fontSize: 14,
  padding: "4px 0", color: "#17352f",
};
const statusRow: React.CSSProperties = {
  display: "flex", gap: 16, marginTop: 16, flexWrap: "wrap",
};
const statusPill: React.CSSProperties = {
  display: "flex", flexDirection: "column", gap: 4,
  padding: "12px 16px", background: "#f9f6ed", borderRadius: 10, flex: 1,
};
