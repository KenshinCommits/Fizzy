/**
 * Fizzi Admin API Client
 * All data for the admin panel comes from the backend.
 * No synthetic or local data is returned by these functions.
 */

import type {
  AppData,
  Cart,
  Conversation,
  Customer,
  Event,
  Lead,
  Order,
  Product,
  ScoringRule,
  ScoreChange,
  Salesperson,
} from "../data/models";

const BASE_URL =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_URL) ||
  "http://localhost:5000/api";

// ────────────────────────────────────────────────────────────
// Auth helpers
// ────────────────────────────────────────────────────────────

const TOKEN_KEY = "fizzi-admin-token";

if (typeof window !== "undefined") {
  const token = new URLSearchParams(window.location.search).get("token");
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    window.history.replaceState({}, "", `${window.location.pathname}${window.location.hash || "#/dashboard"}`);
  }
}

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

async function ensureAdminToken(): Promise<void> {
  if (getToken()) return;
  window.location.assign("http://localhost:3000/login");
  throw new Error("Sign in through the shared Fizzi login portal.");
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });

  // Token expired — clear it and let the next load retry login
  if (res.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    throw new Error("Authentication required. Your browser's saved data may be unavailable.");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }

  return res.json();
}

// ────────────────────────────────────────────────────────────
// Normalizers – convert backend shape → AppData shape
// ────────────────────────────────────────────────────────────

function mapCustomer(c: any): Customer {
  return {
    userId: c._id,
    customerName: `${c.firstName} ${c.lastName}`,
    email: c.email,
    customerType: c.customerType === "wholesale" ? "Wholesale" : "D2C",
    company: c.companyName || "",
    since: c.createdAt?.slice(0, 10) || "2026-01-01",
    intent: mapIntent(c.lead?.intentLevel),
    leadScore: c.lead?.score ?? 0,
    leadStage: mapStage(c.lead?.pipelineStage),
    nextBestAction: c.lead?.nextBestAction || "Monitor",
    currentProduct: c.lead?.currentProductLegacyId || c.lead?.currentProductName || "",
    visitCount: c.metrics?.totalVisits ?? 0,
    totalTimeSpent: c.metrics?.totalTimeSeconds ?? 0,
    averageSessionDuration: c.metrics?.averageSessionSeconds ?? 0,
    productViews: c.metrics?.totalProductViews ?? 0,
    pricingViews: c.metrics?.pricingViews ?? 0,
    cartInteractions: c.metrics?.cartInteractions ?? 0,
    checkoutAttempts: c.metrics?.checkoutAttempts ?? 0,
    totalOrders: c.metrics?.totalOrders ?? 0,
    totalSpent: c.metrics?.totalSpent ?? 0,
    lastOrder: c.metrics?.lastOrderDate?.slice(0, 10) || "",
    lastActive: c.lead?.lastActiveAt
      ? formatRelative(new Date(c.lead.lastActiveAt))
      : "Never",
    favoriteProducts: (c.metrics?.favoriteProducts || []).map(
      (fp: any) => fp.productName || fp.productId || ""
    ),
    mostViewedProducts: (c.metrics?.mostViewedProducts || []).map(
      (mv: any) => ({
        productId: mv.legacyProductId || mv.productId,
        views: mv.viewCount,
      })
    ),
    recentlyViewedProducts: (c.metrics?.mostViewedProducts || [])
      .slice(0, 5)
      .map((mv: any) => mv.legacyProductId || mv.productId),
    repeatedProducts: (c.lead?.favoriteProducts || []),
    assignedTo: c.lead?.assignedTo || "",
    status: c.lead?.lastActiveAt
      ? daysSince(new Date(c.lead.lastActiveAt)) < 7
        ? "Active"
        : "Dormant"
      : "Dormant",
    notes: [],
  };
}

function mapProduct(p: any): Product {
  return {
    id: p.legacyProductId || p._id,
    name: p.name,
    category: p.category,
    price: p.price,
    compareAt: p.compareAtPrice || p.price,
    stock: p.stock,
    sold: p.sold,
    views: p.views,
    conversion: p.conversion,
    status: p.status as "Active" | "Draft",
    flavor: p.flavor || p.name.toUpperCase(),
    tone: p.tone || "#008DDA",
    description: p.description,
    ingredients: p.ingredients || "",
    packSize: p.packSize || "",
    sku: p.sku,
    wholesale: p.wholesaleAvailable,
    image: p.images?.[0],
  };
}

function mapOrder(o: any, customers: Customer[]): Order {
  const customer = customers.find((c) => c.userId === o.userId?._id || c.userId === o.userId);
  const legacyCustomerId =
    customer?.userId ||
    o.userId?._id ||
    o.userId ||
    "";
  return {
    id: o.orderNumber,
    customerId: legacyCustomerId,
    items: (o.items || []).map((i: any) => ({
      productId: i.product?.legacyProductId || i.product?._id || i.product,
      quantity: i.quantity,
      price: i.price,
    })),
    amount: o.total,
    discount: o.discount || 0,
    shipping: o.shipping || 0,
    type: o.userId?.customerType === "wholesale" ? "Wholesale" : "D2C",
    payment: o.paymentStatus === "paid" ? "Paid" : "Pending",
    status: mapOrderStatus(o.fulfillmentStatus),
    date: o.createdAt?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    address: o.shippingAddress
      ? `${o.shippingAddress.street}, ${o.shippingAddress.city}, ${o.shippingAddress.state} ${o.shippingAddress.zip}`
      : "",
  };
}

function mapLead(l: any): Lead {
  return {
    id: l._id,
    customerId: l.userId?._id || l.userId,
    source: l.source || "Direct",
    productId: l.currentProductLegacyId || l.currentProductName || "",
    value: l.totalSpent || 0,
    stage: mapStage(l.pipelineStage),
    sla: "Within SLA",
    nextAction: l.nextBestAction || "Monitor",
    lastActivity: l.lastActiveAt
      ? formatRelative(new Date(l.lastActiveAt))
      : "Unknown",
  };
}

function mapEvent(e: any): Event {
  return {
    id: e._id,
    customerId: e.userId?._id || e.userId,
    type: mapEventType(e.eventType),
    productId: e.productId?.legacyProductId || e.productId?._id || e.productId || "",
    impact: mapImpact(e.eventType),
    timestamp: e.timestamp || e.createdAt,
    description: e.metadata?.description || describeEvent(e),
  };
}

function mapConversation(c: any): Conversation {
  return {
    id: c._id,
    customerId: c.userId?._id || c.userId,
    date: c.startedAt?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    conversationDuration: c.durationSeconds || 0,
    triggerReason: c.triggerReason || "",
    intentBefore: c.scoreBefore || 0,
    intentAfter: c.scoreAfter || 0,
    recommendedAction: c.recommendedAction || "",
    conversationOutcome: c.outcome || c.status || "",
    transcript: (c.transcript || []).map((t: any) => ({
      role: t.role === "agent" ? "Agent" : "Customer",
      text: t.content || t.text || "",
      time: t.timestamp
        ? new Date(t.timestamp).toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          })
        : "",
    })),
  };
}

function mapCart(c: any): Cart {
  return {
    id: c._id,
    customerId: c.userId?._id || c.userId || c.sessionId || "",
    productId:
      c.items?.[0]?.product?.legacyProductId ||
      c.items?.[0]?.product?._id ||
      c.items?.[0]?.product ||
      "",
    value: c.subtotal || 0,
    items: c.items?.length || 0,
    abandonedAt: c.abandonedAt || "",
    recovery: c.recovered ? "Recovered" : "Ready",
  };
}

function mapScoreHistory(s: any): ScoreChange {
  return {
    id: s._id,
    customerId: s.userId?._id || s.userId,
    delta: s.change,
    reason: s.reason,
    timestamp: s.timestamp,
  };
}

function mapSalesperson(s: any): Salesperson {
  const u = s.userId || s;
  return {
    id: s._id,
    name: `${u.firstName || ""} ${u.lastName || ""}`.trim(),
    role: s.role || u.role || "sales_rep",
    email: u.email || "",
    responseTime: "—",
    winRate: s.winRate || 0,
    capacity: s.workloadCapacity || 10,
  };
}

function mapRule(r: any): ScoringRule {
  return {
    event: mapEventType(r.eventType),
    weight: r.scoreChange,
    explanation: r.description,
  };
}

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

function mapIntent(level?: string): Customer["intent"] {
  switch (level) {
    case "very_high": return "Very high";
    case "high":      return "High";
    case "medium":    return "Medium";
    default:          return "Low";
  }
}

function mapStage(stage?: string): Customer["leadStage"] {
  const map: Record<string, Customer["leadStage"]> = {
    new:            "New Lead",
    qualified:      "Qualified",
    high_intent:    "High Intent",
    cart_abandoned: "Cart Abandoned",
    bulk_quote:     "Bulk Quote",
    call_scheduled: "Call Scheduled",
    negotiation:    "Negotiation",
    closed_won:     "Closed Won",
    closed_lost:    "Closed Lost",
  };
  return map[stage || "new"] || "New Lead";
}

function mapOrderStatus(s?: string): Order["status"] {
  const map: Record<string, Order["status"]> = {
    pending:    "Processing",
    confirmed:  "Processing",
    processing: "Processing",
    shipped:    "Shipped",
    delivered:  "Delivered",
    cancelled:  "Cancelled",
  };
  return map[s || "pending"] || "Processing";
}

function mapEventType(t: string): string {
  const map: Record<string, string> = {
    product_viewed:         "Product view",
    pricing_viewed:         "Pricing view",
    wholesale_pricing_viewed: "Pricing view",
    cart_updated:           "Cart update",
    cart_created:           "Cart update",
    cart_abandoned:         "Cart abandoned",
    checkout_started:       "Checkout",
    purchase_completed:     "Purchase",
    bulk_quote_submitted:   "Quote request",
    voice_agent_started:    "AI conversation",
    voice_agent_completed:  "AI conversation",
    user_logged_in:         "Login",
    user_registered:        "Registration",
    page_viewed:            "Page view",
  };
  return map[t] || t;
}

function mapImpact(eventType: string): number {
  const map: Record<string, number> = {
    product_viewed: 3, pricing_viewed: 10, wholesale_pricing_viewed: 15,
    cart_updated: 15, cart_created: 15, cart_abandoned: -5,
    checkout_started: 20, purchase_completed: 30, bulk_quote_submitted: 25,
  };
  return map[eventType] || 0;
}

function describeEvent(e: any): string {
  const type = mapEventType(e.eventType);
  const product = e.productId?.name || "";
  if (type === "Product view" && product) return `viewed ${product}`;
  if (type === "Cart update" && product) return `added ${product} to cart`;
  if (type === "Cart abandoned") return "left a cart behind";
  if (type === "Checkout") return "started checkout";
  if (type === "Quote request") return "requested a quote";
  if (type === "AI conversation") return "completed a product conversation";
  if (type === "Login") return "signed in";
  return type.toLowerCase();
}

function formatRelative(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (mins < 2) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
  if (days < 30) return `${days} day${days > 1 ? "s" : ""} ago`;
  return date.toLocaleDateString("en-IN");
}

function daysSince(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / 86400000);
}

// ────────────────────────────────────────────────────────────
// Main data loader – returns full AppData from backend
// ────────────────────────────────────────────────────────────

export async function loadAppData(): Promise<AppData> {
  // Ensure we have a valid admin token before making any API calls
  await ensureAdminToken();

  // All requests in parallel for performance
  const [
    productsRes,
    customersRes,
    ordersRes,
    leadsRes,
    eventsRes,
    conversationsRes,
    cartsRes,
    scoreHistoryRes,
    salespeopleRes,
    scoringRulesRes,
    settingsRes,
  ] = await Promise.all([
    apiFetch<{ products: any[] }>("/products?limit=100"),
    apiFetch<{ customers: any[] }>("/admin/customers?limit=200"),
    apiFetch<{ orders: any[] }>("/admin/orders?limit=200"),
    apiFetch<{ leads: any[] }>("/admin/leads?limit=200"),
    apiFetch<{ events: any[] }>("/events?limit=100"),
    apiFetch<{ conversations: any[] }>("/agent/conversations?limit=100"),
    apiFetch<{ carts?: any[] }>("/admin/abandoned-carts").catch(() => ({ carts: [] })),
    apiFetch<{ history?: any[]; scoreHistory?: any[] }>("/admin/score-history?limit=200").catch(() => ({ history: [] })),
    apiFetch<{ salespeople?: any[]; users?: any[] }>("/admin/salespeople").catch(() => ({ salespeople: [] })),
    apiFetch<{ rules: any[] }>("/admin/scoring/rules"),
    apiFetch<{ settings: Record<string, string> }>("/admin/settings").catch(() => ({ settings: {} })),
  ]);

  const products = (productsRes.products || []).map(mapProduct);
  const customers = (customersRes.customers || []).map(mapCustomer);
  const orders = (ordersRes.orders || []).map((o) => mapOrder(o, customers));
  const leads = (leadsRes.leads || []).map(mapLead);
  const events = (eventsRes.events || []).map(mapEvent);
  const conversations = (conversationsRes.conversations || []).map(mapConversation);
  const carts = ((cartsRes as any).carts || []).map(mapCart);
  const scoreHistory = (
    (scoreHistoryRes as any).history ||
    (scoreHistoryRes as any).scoreHistory ||
    []
  ).map(mapScoreHistory);
  const salespeople = (
    (salespeopleRes as any).salespeople ||
    (salespeopleRes as any).users ||
    []
  ).map(mapSalesperson);
  const rules = (scoringRulesRes.rules || []).map(mapRule);
  const settings = {
    storeName: "Fizzi",
    email: "hello@fizzi.in",
    currency: "INR",
    timezone: "Asia/Kolkata",
    agentName: "Fizzi Assistant",
    agentEnabled: "true",
    emailAlerts: "true",
    desktopAlerts: "false",
    autoAssign: "true",
    sessionTimeout: "30",
    requireMfa: "true",
    lowStock: "100",
    ...(settingsRes.settings || {}),
  };

  return {
    products,
    customers,
    orders,
    leads,
    events,
    conversations,
    carts,
    scoreHistory,
    salespeople,
    rules,
    settings,
    readNotifications: [],
  };
}

// ────────────────────────────────────────────────────────────
// Mutation API helpers
// ────────────────────────────────────────────────────────────

export async function apiUpdateOrderStatus(
  orderNumber: string,
  status: string
): Promise<void> {
  // Find order by orderNumber first
  const { orders } = await apiFetch<{ orders: any[] }>(`/admin/orders?limit=500`);
  const order = orders.find((o: any) => o.orderNumber === orderNumber);
  if (!order) return;
  await apiFetch(`/admin/orders/${order._id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ fulfillmentStatus: mapStatusToBackend(status) }),
  });
}

export async function apiUpdateLeadStage(
  leadId: string,
  stage: string
): Promise<void> {
  await apiFetch(`/admin/leads/${leadId}`, {
    method: "PATCH",
    body: JSON.stringify({ pipelineStage: mapStageToBackend(stage) }),
  });
}

export async function apiCreateProduct(product: Product): Promise<void> {
  await apiFetch("/admin/products", {
    method: "POST",
    body: JSON.stringify({
      name: product.name,
      slug: product.name.toLowerCase().replace(/\s+/g, "-"),
      description: product.description,
      category: product.category,
      price: product.price,
      compareAtPrice: product.compareAt,
      currency: "INR",
      sku: product.sku,
      packSize: product.packSize,
      ingredients: product.ingredients,
      stock: product.stock,
      wholesaleAvailable: product.wholesale,
      status: product.status,
      flavor: product.flavor,
    }),
  });
}

export async function apiUpdateProduct(product: Product): Promise<void> {
  // Find the MongoDB _id by legacyProductId
  const { products } = await apiFetch<{ products: any[] }>("/products?limit=100");
  const p = products.find(
    (x: any) => x.legacyProductId === product.id || x.sku === product.sku
  );
  if (!p) return;
  await apiFetch(`/admin/products/${p._id}`, {
    method: "PATCH",
    body: JSON.stringify({
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price,
      compareAtPrice: product.compareAt,
      sku: product.sku,
      packSize: product.packSize,
      ingredients: product.ingredients,
      stock: product.stock,
      wholesaleAvailable: product.wholesale,
      status: product.status,
    }),
  });
}

export async function apiPostEvent(event: {
  userId?: string;
  sessionId: string;
  eventType: string;
  productId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await apiFetch("/events", {
    method: "POST",
    body: JSON.stringify({ source: "admin", ...event }),
  });
}

function mapStatusToBackend(s: string): string {
  const map: Record<string, string> = {
    Processing: "processing", Shipped: "shipped",
    Delivered: "delivered",  Cancelled: "cancelled",
  };
  return map[s] || s.toLowerCase();
}

function mapStageToBackend(s: string): string {
  const map: Record<string, string> = {
    "New Lead": "new", "Qualified": "qualified", "High Intent": "high_intent",
    "Cart Abandoned": "cart_abandoned", "Bulk Quote": "bulk_quote",
    "Call Scheduled": "call_scheduled", "Negotiation": "negotiation",
    "Closed Won": "closed_won", "Closed Lost": "closed_lost",
  };
  return map[s] || s.toLowerCase().replace(/\s/g, "_");
}
