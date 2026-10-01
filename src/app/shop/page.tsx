"use client";

import Link from "next/link";
import { CSSProperties, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AUTH_TOKEN_KEY, clearSession, getStoredUser, type FizziUser } from "@/lib/auth";
import { useCart } from "@/hooks/useCart";
import { Product3D } from "@/components/Product3D";
import { FulkyVoiceAssistant } from "@/components/FulkyVoiceAssistant";
import styles from "./shop.module.css";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

type Product = {
  _id: string;
  name: string;
  description: string;
  price: number;
  currency?: string;
  packSize?: string;
  tone?: string;
};

const fmt = (n: number, currency = "INR") =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);

export default function ShopPage() {
  const router = useRouter();
  const [user, setUser] = useState<FizziUser | null>(null);
  const [notice, setNotice] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [productsError, setProductsError] = useState("");
  const [basketOpen, setBasketOpen] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  const { cart, totalItems, addItem, updateItem, removeItem } = useCart();

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) { router.replace("/login?next=/shop"); return; }
    setUser(stored);

    const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
    fetch(`${apiUrl}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => { if (res.status === 401) { clearSession(); router.replace("/login?next=/shop"); } })
      .catch(() => undefined);

    fetch(`${apiUrl}/products?status=Active`)
      .then(async (res) => {
        if (!res.ok) throw new Error("The fridge is taking a moment to rest.");
        return res.json();
      })
      .then((data) => setProducts(data.products ?? []))
      .catch((e: Error) => setProductsError(e.message));
  }, [router]);

  async function handleAddToCart(productId: string, productName: string) {
    try {
      await addItem(productId, 1);
      setNotice(`${productName} added to your basket.`);
      setTimeout(() => setNotice(""), 2500);
    } catch (e: any) {
      setNotice(e.message ?? "Could not add to basket.");
      setTimeout(() => setNotice(""), 3000);
    }
  }

  async function handleCheckout() {
    if (cart.items.length === 0) return;
    setCheckingOut(true);
    try {
      const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
      const res = await fetch(`${apiUrl}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          shippingAddress: {
            name: `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || "Fizzi Customer",
            street: "123 Good Street",
            city: "Mumbai",
            state: "Maharashtra",
            zip: "400001",
            country: "IN",
          },
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Checkout failed.");
      }
      const data = await res.json();
      setBasketOpen(false);
      setNotice(`Order ${data.order.orderNumber} placed!`);
      setTimeout(() => setNotice(""), 4000);
      router.push("/orders");
    } catch (e: any) {
      setNotice(e.message ?? "Checkout failed.");
      setTimeout(() => setNotice(""), 4000);
    } finally {
      setCheckingOut(false);
    }
  }

  if (!user) return <div className={styles.loading}>Opening the good stuff…</div>;

  return (
    <main className={styles.page}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.logo}>fizzi<span>✦</span></Link>
        <span className={styles.tag}>THE GOOD STUFF / 001</span>
        <div className={styles.navActions}>
          <span className={styles.hello}>Hey, {user.firstName || "friend"}</span>
          <Link href="/orders" className={styles.ordersLink}>My Orders</Link>
          <FulkyVoiceAssistant />
          <button
            className={styles.basketBtn}
            onClick={() => setBasketOpen(true)}
            aria-label={`Open basket, ${totalItems} items`}
          >
            🛒 my basket ({totalItems})
          </button>
          <button className={styles.logoutBtn} onClick={() => { clearSession(); router.replace("/"); }}>
            Log out
          </button>
        </div>
      </nav>

      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>✳ MEMBERS' FRIDGE</p>
          <h1>Pick your<br /><em>good thing.</em></h1>
          <p className={styles.lede}>Four sparkling fruit sodas. Real ingredients. A seriously good day in every case.</p>
        </div>
        <div className={styles.heroCan}>
          <img src="/textures/Watermelon.png" alt="Watermelon Crush can" />
        </div>
      </section>

      <section className={styles.products} aria-label="Fizzi products">
        <div className={styles.productsTitle}>
          <p className={styles.eyebrow}>THE FULL FRIDGE</p>
          <h2>Find your fizz.</h2>
          {notice && <span className={styles.notice} role="status">{notice}</span>}
        </div>

        {productsError ? (
          <p className={styles.empty}>{productsError}</p>
        ) : products.length === 0 ? (
          <p className={styles.empty}>No active products are in the fridge yet.</p>
        ) : (
          <div className={styles.grid}>
            {products.map((product) => {
              const inCart = cart.items.find((i) => i.product._id === product._id);
              return (
                <article
                  key={product._id}
                  className={styles.card}
                  style={{ "--flavor": product.tone || "#159bd7" } as CSSProperties}
                >
                  <div className={styles.art}>
                    <Product3D product={{ id: product._id, name: product.name, tone: product.tone }} />
                  </div>
                  <p className={styles.cardNo}>{product.packSize || "24 CANS · 330ML"}</p>
                  <h3>{product.name}</h3>
                  <p>{product.description}</p>
                  {inCart && (
                    <p className={styles.inCart}>In basket: {inCart.quantity}</p>
                  )}
                  <div className={styles.buy}>
                    <strong>{fmt(product.price, product.currency || "INR")}</strong>
                    <button onClick={() => handleAddToCart(product._id, product.name)}>
                      {inCart ? "Add another →" : "Add a case →"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Basket drawer */}
      {basketOpen && (
        <>
          <div className={styles.backdrop} onClick={() => setBasketOpen(false)} aria-hidden="true" />
          <aside className={styles.drawer} role="dialog" aria-modal="true" aria-label="Your basket">
            <div className={styles.drawerTop}>
              <h2>My basket ({totalItems})</h2>
              <button className={styles.drawerClose} onClick={() => setBasketOpen(false)} aria-label="Close basket">×</button>
            </div>

            {cart.items.length === 0 ? (
              <p className={styles.emptyBasket}>Your basket is empty.</p>
            ) : (
              <>
                {cart.items.map((item) => {
                  const p = item.product;
                  return (
                    <div key={p._id} className={styles.basketItem}>
                      {p.images?.[0] && (
                        <img src={p.images[0]} alt={p.name} className={styles.basketImg} />
                      )}
                      <div className={styles.basketInfo}>
                        <p className={styles.basketName}>{p.name}</p>
                        {p.packSize && <p className={styles.basketPack}>{p.packSize}</p>}
                        <p className={styles.basketPrice}>{fmt(item.price)}</p>
                        <div className={styles.qtyControl}>
                          <button
                            onClick={() => updateItem(p._id, item.quantity - 1)}
                            aria-label="Remove one"
                          >−</button>
                          <span>{item.quantity}</span>
                          <button
                            onClick={() => updateItem(p._id, item.quantity + 1)}
                            aria-label="Add one"
                          >+</button>
                        </div>
                      </div>
                      <div className={styles.basketLine}>
                        <strong>{fmt(item.price * item.quantity)}</strong>
                        <button
                          className={styles.removeBtn}
                          onClick={() => removeItem(p._id)}
                          aria-label={`Remove ${p.name}`}
                        >Remove</button>
                      </div>
                    </div>
                  );
                })}

                <div className={styles.basketSummary}>
                  <span>Subtotal</span>
                  <strong>{fmt(cart.subtotal)}</strong>
                </div>

                <button
                  className={styles.checkoutBtn}
                  onClick={handleCheckout}
                  disabled={checkingOut}
                >
                  {checkingOut ? "Placing order…" : "Continue to checkout →"}
                </button>
              </>
            )}

            <Link href="/orders" className={styles.ordersLink} onClick={() => setBasketOpen(false)}>
              View my orders →
            </Link>
          </aside>
        </>
      )}

      <footer className={styles.footer}>
        <span>FULL OF FIZZ. FULL OF FEELING.</span>
        <Link href="/">Back to Fizzi ↗</Link>
      </footer>
    </main>
  );
}
