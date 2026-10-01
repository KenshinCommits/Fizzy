"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
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
  discount: number;
  shipping: number;
  total: number;
  paymentStatus: string;
  fulfillmentStatus: string;
  shippingAddress: Record<string, string>;
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

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    const user = getStoredUser();
    if (!user) { router.replace("/login?next=/orders"); return; }

    const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) { router.replace("/login?next=/orders"); return; }

    fetch(`${API}/orders/${params.id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => {
        if (res.status === 401) { clearSession(); router.replace("/login?next=/orders"); return null; }
        if (res.status === 404) { setError("Order not found."); return null; }
        if (!res.ok) throw new Error(`Server error ${res.status}`);
        return res.json();
      })
      .then((data) => { if (data) setOrder(data.order); })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusColor = order ? (STATUS_COLOR[order.fulfillmentStatus] ?? "#1a7a50") : "#1a7a50";

  return (
    <div style={page}>
      <nav style={nav}>
        <Link href="/" style={logo}>fizzi<span style={{ color: "#e15e43", fontSize: 13, verticalAlign: "top" }}>✦</span></Link>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/shop" style={navLink}>Shop</Link>
          <Link href="/orders" style={navLink}>My Orders</Link>
          <button style={logoutBtn} onClick={() => { clearSession(); router.replace("/"); }}>Log out</button>
        </div>
      </nav>

      <div style={content}>
        <Link href="/orders" style={{ ...navLink, display: "inline-block", marginBottom: 28, fontSize: 13 }}>
          ← Back to orders
        </Link>

        {loading && <p style={{ color: "#78837b", fontSize: 15 }}>Loading order…</p>}
        {error && (
          <div style={{ padding: 24, background: "#fdecea", borderRadius: 12, color: "#c0392b", fontSize: 14 }}>
            ⚠ {error}
          </div>
        )}

        {order && (
          <>
            <div style={{ marginBottom: 28 }}>
              <p style={eyebrow}>ORDER DETAILS</p>
              <h1 style={{ margin: "0 0 4px", fontSize: 28, fontWeight: 900 }}>{order.orderNumber}</h1>
              <p style={{ margin: 0, fontSize: 14, color: "#78837b" }}>
                {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>

            {/* Status bar */}
            <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" as const }}>
              <div style={statusPill}>
                <span style={{ fontSize: 11, color: "#78837b", fontWeight: 700, letterSpacing: "0.8px" }}>ORDER STATUS</span>
                <strong style={{ fontSize: 14, color: statusColor }}>
                  ● {STATUS_LABEL[order.fulfillmentStatus] ?? order.fulfillmentStatus}
                </strong>
              </div>
              <div style={statusPill}>
                <span style={{ fontSize: 11, color: "#78837b", fontWeight: 700, letterSpacing: "0.8px" }}>PAYMENT</span>
                <strong style={{ fontSize: 14 }}>{order.paymentStatus}</strong>
              </div>
              <div style={statusPill}>
                <span style={{ fontSize: 11, color: "#78837b", fontWeight: 700, letterSpacing: "0.8px" }}>TOTAL</span>
                <strong style={{ fontSize: 14 }}>{fmt(order.total)}</strong>
              </div>
            </div>

            {/* Items table */}
            <div style={card}>
              <h3 style={{ margin: "0 0 18px", fontSize: 13, fontWeight: 700, color: "#78837b", letterSpacing: "0.8px" }}>
                ORDER ITEMS
              </h3>
              <table style={{ width: "100%", borderCollapse: "collapse" as const }}>
                <thead>
                  <tr>
                    {["Product", "Pack size", "Qty", "Unit price", "Total"].map((h) => (
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
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            {snap?.image && (
                              <img src={snap.image} alt="" style={{ width: 44, height: 66, objectFit: "contain", borderRadius: 6 }} />
                            )}
                            <span style={{ fontWeight: 700, fontSize: 14 }}>{snap?.name ?? item.productName}</span>
                          </div>
                        </td>
                        <td style={td}>{snap?.packSize ?? "—"}</td>
                        <td style={td}>{item.quantity}</td>
                        <td style={td}>{fmt(item.price)}</td>
                        <td style={{ ...td, fontWeight: 800 }}>{fmt(item.total)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Totals */}
              <div style={{ borderTop: "1px solid #e2dece", marginTop: 16, paddingTop: 16 }}>
                <div style={totalRow}><span>Subtotal</span><span>{fmt(order.subtotal)}</span></div>
                {order.discount > 0 && <div style={totalRow}><span>Discount</span><span>−{fmt(order.discount)}</span></div>}
                {order.shipping > 0 && <div style={totalRow}><span>Shipping</span><span>{fmt(order.shipping)}</span></div>}
                <div style={{ ...totalRow, fontWeight: 800, fontSize: 18, marginTop: 8, paddingTop: 10, borderTop: "1px solid #e2dece" }}>
                  <span>Total</span><span>{fmt(order.total)}</span>
                </div>
              </div>
            </div>

            {/* Shipping address */}
            {order.shippingAddress?.name && (
              <div style={{ ...card, marginTop: 16 }}>
                <h3 style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 700, color: "#78837b", letterSpacing: "0.8px" }}>
                  SHIPPING ADDRESS
                </h3>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.8, color: "#40564f" }}>
                  {order.shippingAddress.name}<br />
                  {order.shippingAddress.street}<br />
                  {order.shippingAddress.city}{order.shippingAddress.state ? `, ${order.shippingAddress.state}` : ""} {order.shippingAddress.zip}<br />
                  {order.shippingAddress.country}
                  {order.shippingAddress.phone && <><br />{order.shippingAddress.phone}</>}
                </p>
              </div>
            )}
          </>
        )}
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
  fontSize: 13, fontWeight: 700, color: "#17352f", textDecoration: "none", opacity: 0.75,
};
const logoutBtn: React.CSSProperties = {
  padding: "8px 18px", border: "1px solid #17352f", borderRadius: 20,
  background: "transparent", fontSize: 13, fontWeight: 700, color: "#17352f", cursor: "pointer",
};
const content: React.CSSProperties = {
  maxWidth: 820, margin: "0 auto", padding: "48px clamp(20px,5vw,40px) 80px",
};
const eyebrow: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, letterSpacing: "1.4px", color: "#78837b", margin: "0 0 8px",
};
const statusPill: React.CSSProperties = {
  display: "flex", flexDirection: "column", gap: 4,
  padding: "12px 20px", background: "#fff", border: "1px solid #e2dece",
  borderRadius: 12, flex: 1, minWidth: 120,
};
const card: React.CSSProperties = {
  border: "1px solid #e2dece", borderRadius: 14, padding: 24, background: "#fff",
};
const th: React.CSSProperties = {
  textAlign: "left", padding: "8px 12px", fontSize: 11, fontWeight: 700,
  color: "#78837b", borderBottom: "1px solid #e2dece", textTransform: "uppercase", letterSpacing: "0.6px",
};
const td: React.CSSProperties = {
  padding: "12px", borderBottom: "1px solid #f0ece0", verticalAlign: "middle", fontSize: 14,
};
const totalRow: React.CSSProperties = {
  display: "flex", justifyContent: "space-between", fontSize: 14,
  padding: "4px 0", color: "#17352f",
};
