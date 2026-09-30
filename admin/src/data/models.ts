export type Intent = "Very high" | "High" | "Medium" | "Low";
export type PipelineStage =
  | "New Lead"
  | "Qualified"
  | "High Intent"
  | "Cart Abandoned"
  | "Bulk Quote"
  | "Call Scheduled"
  | "Negotiation"
  | "Closed Won"
  | "Closed Lost";
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}
export interface ScoreChange {
  id: string;
  customerId: string;
  delta: number;
  reason: string;
  timestamp: string;
}
export interface Customer {
  userId: string;
  customerName: string;
  email: string;
  customerType: "D2C" | "Wholesale";
  company?: string;
  since: string;
  intent: Intent;
  leadScore: number;
  leadStage: PipelineStage;
  nextBestAction: string;
  currentProduct: string;
  visitCount: number;
  totalTimeSpent: number;
  averageSessionDuration: number;
  productViews: number;
  pricingViews: number;
  cartInteractions: number;
  checkoutAttempts: number;
  totalOrders: number;
  totalSpent: number;
  lastOrder: string;
  lastActive: string;
  favoriteProducts: string[];
  mostViewedProducts: { productId: string; views: number }[];
  recentlyViewedProducts: string[];
  repeatedProducts: string[];
  assignedTo: string;
  status: "Active" | "Dormant";
  notes: string[];
}
export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  compareAt: number;
  stock: number;
  sold: number;
  views: number;
  conversion: number;
  status: "Active" | "Draft";
  flavor: string;
  tone: string;
  description: string;
  ingredients: string;
  packSize: string;
  sku: string;
  wholesale: boolean;
  image?: string;
}
export interface Order {
  id: string;
  customerId: string;
  items: { productId: string; quantity: number; price: number }[];
  amount: number;
  discount: number;
  shipping: number;
  type: "D2C" | "Wholesale";
  payment: "Paid" | "Pending";
  status: "Processing" | "Shipped" | "Delivered" | "Cancelled";
  date: string;
  address: string;
}
export interface Lead {
  id: string;
  customerId: string;
  source: string;
  productId: string;
  value: number;
  stage: PipelineStage;
  sla: string;
  nextAction: string;
  lastActivity: string;
}
export interface Event {
  id: string;
  customerId: string;
  type: string;
  productId: string;
  impact: number;
  timestamp: string;
  description: string;
}
export interface Conversation {
  id: string;
  customerId: string;
  date: string;
  conversationDuration: number;
  triggerReason: string;
  intentBefore: number;
  intentAfter: number;
  recommendedAction: string;
  conversationOutcome: string;
  transcript: { role: "Customer" | "Agent"; text: string; time: string }[];
}
export interface Salesperson {
  id: string;
  name: string;
  role: string;
  email: string;
  responseTime: string;
  winRate: number;
  capacity: number;
}
export interface Cart {
  id: string;
  customerId: string;
  productId: string;
  value: number;
  items: number;
  abandonedAt: string;
  recovery: "Ready" | "Queued" | "Recovered";
}
export interface ScoringRule {
  event: string;
  weight: number;
  explanation: string;
}
export interface AppData {
  customers: Customer[];
  products: Product[];
  orders: Order[];
  leads: Lead[];
  events: Event[];
  conversations: Conversation[];
  scoreHistory: ScoreChange[];
  salespeople: Salesperson[];
  carts: Cart[];
  rules: ScoringRule[];
  settings: Record<string, string>;
  readNotifications: string[];
}
