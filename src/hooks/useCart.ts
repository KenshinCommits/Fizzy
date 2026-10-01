"use client";
import { useCallback, useEffect, useState } from "react";
import { AUTH_TOKEN_KEY } from "@/lib/auth";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

export type CartProduct = {
  _id: string;
  name: string;
  price: number;
  packSize?: string;
  images?: string[];
  tone?: string;
  legacyProductId?: string;
  slug?: string;
};

export type CartItem = {
  product: CartProduct;
  quantity: number;
  price: number;
};

export type Cart = {
  _id?: string;
  userId?: string;
  items: CartItem[];
  subtotal: number;
};

function authHeaders(): HeadersInit {
  const token =
    typeof window !== "undefined"
      ? window.localStorage.getItem(AUTH_TOKEN_KEY)
      : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export function useCart() {
  const [cart, setCart] = useState<Cart>({ items: [], subtotal: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCart = useCallback(async () => {
    const token =
      typeof window !== "undefined"
        ? window.localStorage.getItem(AUTH_TOKEN_KEY)
        : null;
    if (!token) {
      setCart({ items: [], subtotal: 0 });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/cart`, { headers: authHeaders() });
      if (res.status === 401) {
        setCart({ items: [], subtotal: 0 });
        return;
      }
      if (!res.ok) throw new Error("Failed to load cart");
      const data = await res.json();
      setCart(data.cart ?? { items: [], subtotal: 0 });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCart();
    const handler = () => fetchCart();
    window.addEventListener("fizzi-auth-change", handler);
    return () => window.removeEventListener("fizzi-auth-change", handler);
  }, [fetchCart]);

  const addItem = useCallback(
    async (productId: string, quantity = 1) => {
      try {
        const res = await fetch(`${API}/cart/items`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ productId, quantity }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "Could not add to cart");
        }
        const data = await res.json();
        setCart(data.cart);
        return data.cart as Cart;
      } catch (e: any) {
        setError(e.message);
        throw e;
      }
    },
    []
  );

  const updateItem = useCallback(
    async (productId: string, quantity: number) => {
      try {
        const res = await fetch(`${API}/cart/items/${productId}`, {
          method: "PATCH",
          headers: authHeaders(),
          body: JSON.stringify({ quantity }),
        });
        if (!res.ok) throw new Error("Could not update cart");
        const data = await res.json();
        setCart(data.cart);
      } catch (e: any) {
        setError(e.message);
        throw e;
      }
    },
    []
  );

  const removeItem = useCallback(
    async (productId: string) => {
      try {
        const res = await fetch(`${API}/cart/items/${productId}`, {
          method: "DELETE",
          headers: authHeaders(),
        });
        if (!res.ok) throw new Error("Could not remove item");
        const data = await res.json();
        setCart(data.cart);
      } catch (e: any) {
        setError(e.message);
        throw e;
      }
    },
    []
  );

  const clearCart = useCallback(async () => {
    try {
      await fetch(`${API}/cart`, { method: "DELETE", headers: authHeaders() });
      setCart({ items: [], subtotal: 0 });
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  const totalItems = cart.items.reduce((sum, i) => sum + i.quantity, 0);

  return {
    cart,
    totalItems,
    loading,
    error,
    fetchCart,
    addItem,
    updateItem,
    removeItem,
    clearCart,
  };
}
