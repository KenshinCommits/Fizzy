"use client";

import Link from "next/link";
import { CSSProperties, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AUTH_TOKEN_KEY, clearSession, getStoredUser, type FizziUser } from "@/lib/auth";
import { Product3D } from "@/components/Product3D";
import styles from "./shop.module.css";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";
const basketKey = "fizzy-basket-v1";

type Product = { _id: string; name: string; description: string; price: number; currency?: string; packSize?: string; tone?: string };

export default function ShopPage() {
  const router = useRouter();
  const [user, setUser] = useState<FizziUser | null>(null);
  const [notice, setNotice] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [productsError, setProductsError] = useState("");

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) {
      router.replace("/login?next=/shop");
      return;
    }
    setUser(stored);
    const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
    fetch(`${apiUrl}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
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
  }, [router]);

  function addToBasket(id: string) {
    const current = JSON.parse(window.localStorage.getItem(basketKey) ?? "[]") as Array<{ id: string; quantity: number }>;
    const existing = current.find((item) => item.id === id);
    const next = existing ? current.map((item) => item.id === id ? { ...item, quantity: item.quantity + 1 } : item) : [...current, { id, quantity: 1 }];
    window.localStorage.setItem(basketKey, JSON.stringify(next));
    setNotice("Added to your basket.");
  }

  if (!user) return <div className={styles.loading}>Opening the good stuff…</div>;

  return <main className={styles.page}>
    <nav className={styles.nav}><Link href="/" className={styles.logo}>fizzi<span>✦</span></Link><span className={styles.tag}>THE GOOD STUFF / 001</span><div><span className={styles.hello}>Hey, {user.firstName || "friend"}</span><button onClick={() => { clearSession(); router.replace("/"); }}>Log out</button></div></nav>
    <section className={styles.hero}><div><p className={styles.eyebrow}>✳ MEMBERS’ FRIDGE</p><h1>Pick your<br /><em>good thing.</em></h1><p className={styles.lede}>Four sparkling fruit sodas. Real ingredients. A seriously good day in every case.</p></div><div className={styles.heroCan}><img src="/textures/Watermelon.png" alt="Watermelon Crush can" /></div></section>
    <section className={styles.products} aria-label="Fizzi products"><div className={styles.productsTitle}><p className={styles.eyebrow}>THE FULL FRIDGE</p><h2>Find your fizz.</h2>{notice && <span role="status">{notice}</span>}</div>{productsError ? <p className={styles.empty}>{productsError}</p> : products.length === 0 ? <p className={styles.empty}>No active products are in the fridge yet.</p> : <div className={styles.grid}>{products.map((product) => <article className={styles.card} key={product._id} style={{ "--flavor": product.tone || "#159bd7" } as CSSProperties}><div className={styles.art}><Product3D product={{ id: product._id, name: product.name, tone: product.tone }} /></div><p className={styles.cardNo}>{product.packSize || "24 CANS · 330ML"}</p><h3>{product.name}</h3><p>{product.description}</p><div className={styles.buy}><strong>{new Intl.NumberFormat("en-IN", { style: "currency", currency: product.currency || "INR" }).format(product.price)}</strong><button onClick={() => addToBasket(product._id)}>Add a case <b>→</b></button></div></article>)}</div>}</section>
    <footer className={styles.footer}><span>FULL OF FIZZ. FULL OF FEELING.</span><Link href="/">Back to Fizzi ↗</Link></footer>
  </main>;
}
