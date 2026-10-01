"use client";

import Link from "next/link";
import { CSSProperties, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AUTH_TOKEN_KEY, clearSession, getStoredUser, type FizziUser } from "@/lib/auth";
import { Product3D } from "@/components/Product3D";
import { FulkyVoiceAssistant } from "@/components/FulkyVoiceAssistant";
import styles from "./shop.module.css";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";
type Product = { _id: string; name: string; description: string; price: number; currency?: string; packSize?: string; tone?: string };
type Cart = { items: Array<{ productId: Product | string; quantity: number; unitPrice: number }>; subtotal: number };

export default function ShopPage() {
  const router = useRouter();
  const [user, setUser] = useState<FizziUser | null>(null);
  const [notice, setNotice] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [productsError, setProductsError] = useState("");
  const [cart, setCart] = useState<Cart | null>(null);
  const authHeaders = useCallback(() => {
    const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
    return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  }, []);

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) {
      router.replace("/login?next=/shop");
      return;
    }
    setUser(stored);
    fetch(`${apiUrl}/auth/me`, { headers: authHeaders() })
      .then((response) => {
        if (response.status === 401) {
          clearSession();
          router.replace("/login?next=/shop");
        }
      })
      .catch(() => undefined);
    fetch(`${apiUrl}/products?status=Active`)
      .then(async (response) => {
        if (!response.ok) throw new Error("The fridge is taking a moment to rest.");
        return response.json();
      })
      .then((data) => setProducts(data.products ?? []))
      .catch((error: Error) => setProductsError(error.message));
    fetch(`${apiUrl}/cart`, { headers: authHeaders() })
      .then(async (response) => { if (!response.ok) throw new Error("Your basket could not be loaded."); return response.json(); })
      .then((data) => setCart(data.cart))
      .catch((error: Error) => setNotice(error.message));
  }, [authHeaders, router]);

  async function addToBasket(productId: string) {
    setNotice("");
    try {
      const response = await fetch(`${apiUrl}/cart/items`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ productId, quantity: 1 }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || data.error || "This product could not be added.");
      setCart(data.cart); setNotice("Added to your basket.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "This product could not be added."); }
  }

  async function trackProductView(productId: string) {
    try { await fetch(`${apiUrl}/events`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ eventType: "product_viewed", productId, sessionId: `shop_${user?.id}` }) }); } catch { /* Tracking must not interrupt shopping. */ }
  }

  async function logout() {
    try { await fetch(`${apiUrl}/auth/logout`, { method: "POST", headers: authHeaders() }); } finally { clearSession(); router.replace("/login"); }
  }

  if (!user) return <div className={styles.loading}>Opening the good stuff…</div>;

  return <main className={styles.page}>
    <nav className={styles.nav}><Link href="/" className={styles.logo}>fizzi<span>✦</span></Link><span className={styles.tag}>THE GOOD STUFF / 001</span><div><span className={styles.hello}>Hey, {user.firstName || "friend"}</span><span className={styles.basket}>my basket ({cart?.items.reduce((count, item) => count + item.quantity, 0) ?? 0})</span><FulkyVoiceAssistant /><button onClick={() => void logout()}>Log out</button></div></nav>
    <section className={styles.hero}><div><p className={styles.eyebrow}>✳ MEMBERS’ FRIDGE</p><h1>Pick your<br /><em>good thing.</em></h1><p className={styles.lede}>Four sparkling fruit sodas. Real ingredients. A seriously good day in every case.</p></div><div className={styles.heroCan}><img src="/textures/Watermelon.png" alt="Watermelon Crush can" /></div></section>
    <section className={styles.products} aria-label="Fizzi products"><div className={styles.productsTitle}><p className={styles.eyebrow}>THE FULL FRIDGE</p><h2>Find your fizz.</h2>{notice && <span role="status">{notice}</span>}</div>{productsError ? <p className={styles.empty}>{productsError}</p> : products.length === 0 ? <p className={styles.empty}>No active products are in the fridge yet.</p> : <div className={styles.grid}>{products.map((product) => <article className={styles.card} key={product._id} style={{ "--flavor": product.tone || "#159bd7" } as CSSProperties}><div className={styles.art} onClick={() => void trackProductView(product._id)}><Product3D product={{ id: product._id, name: product.name, tone: product.tone }} /></div><p className={styles.cardNo}>{product.packSize || "24 CANS · 330ML"}</p><h3>{product.name}</h3><p>{product.description}</p><div className={styles.buy}><strong>{new Intl.NumberFormat("en-IN", { style: "currency", currency: product.currency || "INR" }).format(product.price)}</strong><button onClick={() => void addToBasket(product._id)}>Add a case <b>→</b></button></div></article>)}</div>}</section>
    <footer className={styles.footer}><span>FULL OF FIZZ. FULL OF FEELING.</span><Link href="/">Back to Fizzi ↗</Link></footer>
  </main>;
}
