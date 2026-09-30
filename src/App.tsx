import {
  Activity,
  ArrowUpRight,
  AudioLines,
  Bell,
  Bot,
  ChartNoAxesCombined,
  Check,
  ChevronDown,
  CircleHelp,
  Columns3,
  Command,
  ContactRound,
  LayoutDashboard,
  Menu,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  ScanLine,
  Search,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Users,
  UsersRound,
  X,
} from "lucide-react";
import { Component, useEffect, useState, type ReactNode } from "react";
import { CustomerProfile } from "./components/CustomerProfile";
import {
  Avatar,
  Badge,
  Empty,
  ErrorState,
  Modal,
  Skeleton,
} from "./components/ui";
import { StoreProvider, useStore } from "./lib/store";
import {
  ActivityPage,
  AgentAnalysis,
  Analytics,
  Customers,
  Dashboard,
  Intelligence,
} from "./pages/Intelligence";
import {
  AbandonedCarts,
  AgentPage,
  Leads,
  Notifications,
  Orders,
  Pipeline,
  Products,
  SettingsPage,
  Team,
} from "./pages/Operations";
const navigation: {
  section: string;
  items: [string, string, typeof LayoutDashboard][];
}[] = [
  { section: "OVERVIEW", items: [["dashboard", "Dashboard", LayoutDashboard]] },
  {
    section: "CUSTOMERS",
    items: [
      ["customers", "Customers", Users],
      ["agent-analysis", "Agent Analysis", AudioLines],
    ],
  },
  {
    section: "COMMERCE",
    items: [
      ["products", "Products", Package],
      ["orders", "Orders", ShoppingBag],
      ["abandoned-carts", "Abandoned Carts", ShoppingCart],
    ],
  },
  {
    section: "CRM",
    items: [
      ["leads", "Leads", ContactRound],
      ["pipeline", "Pipeline", Columns3],
      ["activity", "Activity", Activity],
    ],
  },
  {
    section: "INTELLIGENCE",
    items: [
      ["intelligence", "Lead Intelligence", ScanLine],
      ["ai-agent", "AI Agent", Bot],
      ["analytics", "Analytics", ChartNoAxesCombined],
    ],
  },
  {
    section: "OPERATIONS",
    items: [
      ["team", "Team", UsersRound],
      ["notifications", "Notifications", Bell],
      ["settings", "Settings", Settings],
    ],
  },
];
export type Navigate = (page: string) => void;
class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="app-error">
        <ErrorState
          message="The interface encountered an unexpected error."
          retry={() => window.location.reload()}
        />
      </div>
    ) : (
      this.props.children
    );
  }
}
function Workspace() {
  const { data, loading, error, retry, message, live, setLive } = useStore();
  const [page, setPage] = useState(location.hash.slice(2) || "dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [customer, setCustomer] = useState<string | null>(null);
  const [help, setHelp] = useState(false);
  const navigate: Navigate = (p) => {
    location.hash = `/${p}`;
    setPage(p);
    setMobile(false);
  };
  useEffect(() => {
    const handler = () => setPage(location.hash.slice(2) || "dashboard");
    window.addEventListener("hashchange", handler);
    const keys = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", keys);
    return () => {
      window.removeEventListener("hashchange", handler);
      window.removeEventListener("keydown", keys);
    };
  }, []);
  const nav = navigation.flatMap((s) => s.items).find((x) => x[0] === page);
  const title = nav?.[1] || "Dashboard";
  const section = navigation.find((s) =>
    s.items.some((i) => i[0] === page),
  )?.section;
  const unread = data.events.filter(
    (e) => !data.readNotifications.includes(e.id),
  ).length;
  const searchResults = query.trim()
    ? [
        ...data.customers
          .filter((c) =>
            `${c.customerName} ${c.email} ${c.company}`
              .toLowerCase()
              .includes(query.toLowerCase()),
          )
          .map((c) => ({
            id: c.userId,
            name: c.company || c.customerName,
            kind: "Customer",
            action: () => setCustomer(c.userId),
          })),
        ...data.products
          .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
          .map((p) => ({
            id: p.id,
            name: p.name,
            kind: "Product",
            action: () => navigate("products"),
          })),
        ...data.orders
          .filter((o) => o.id.toLowerCase().includes(query.toLowerCase()))
          .map((o) => ({
            id: o.id,
            name: `#${o.id}`,
            kind: "Order",
            action: () => navigate("orders"),
          })),
        ...data.leads
          .filter((l) =>
            data.customers
              .find((c) => c.userId === l.customerId)
              ?.customerName.toLowerCase()
              .includes(query.toLowerCase()),
          )
          .map((l) => ({
            id: l.id,
            name: data.customers.find((c) => c.userId === l.customerId)!
              .customerName,
            kind: "Lead",
            action: () => navigate("leads"),
          })),
      ].slice(0, 12)
    : [];
  let content: ReactNode;
  switch (page) {
    case "customers":
      content = <Customers openCustomer={setCustomer} />;
      break;
    case "agent-analysis":
      content = <AgentAnalysis openCustomer={setCustomer} />;
      break;
    case "products":
      content = <Products />;
      break;
    case "orders":
      content = <Orders />;
      break;
    case "leads":
      content = <Leads openCustomer={setCustomer} />;
      break;
    case "pipeline":
      content = <Pipeline openCustomer={setCustomer} />;
      break;
    case "abandoned-carts":
      content = <AbandonedCarts openCustomer={setCustomer} />;
      break;
    case "analytics":
      content = <Analytics />;
      break;
    case "intelligence":
      content = <Intelligence openCustomer={setCustomer} />;
      break;
    case "activity":
      content = <ActivityPage openCustomer={setCustomer} />;
      break;
    case "team":
      content = <Team openCustomer={setCustomer} />;
      break;
    case "settings":
      content = <SettingsPage />;
      break;
    case "notifications":
      content = <Notifications openCustomer={setCustomer} />;
      break;
    case "ai-agent":
      content = <AgentPage openCustomer={setCustomer} />;
      break;
    default:
      content = <Dashboard navigate={navigate} openCustomer={setCustomer} />;
  }
  return (
    <div className={`app ${collapsed ? "is-collapsed" : ""}`}>
      <a
        className="skip-link"
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main")?.focus();
        }}
      >
        Skip to content
      </a>
      {mobile && (
        <button
          className="mobile-backdrop"
          aria-label="Close navigation"
          onClick={() => setMobile(false)}
        />
      )}
      <aside className={`sidebar ${mobile ? "mobile-open" : ""}`}>
        <div className="brand-row">
          <a
            href="#/dashboard"
            aria-label="Fizzi dashboard"
            className="wordmark"
          >
            fizzi<span>®</span>
            <i />
          </a>
          <button
            className="icon-btn collapse"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <PanelLeftOpen size={17} />
            ) : (
              <PanelLeftClose size={17} />
            )}
          </button>
          <button
            className="icon-btn mobile-close"
            aria-label="Close navigation"
            onClick={() => setMobile(false)}
          >
            <X size={18} />
          </button>
        </div>
        <div className="workspace-switch">
          <span className="workspace-icon">F</span>
          <div>
            <b>Fizzi workspace</b>
            <small>Commerce & intelligence</small>
          </div>
          <Badge>PRO</Badge>
        </div>
        <nav aria-label="Main navigation">
          {navigation.map((s) => (
            <div className="nav-section" key={s.section}>
              <span className="nav-label">{s.section}</span>
              {s.items.map(([id, label, Icon]) => (
                <a
                  key={id}
                  href={`#/${id}`}
                  aria-label={label}
                  className={`nav-item ${page === id ? "active" : ""}`}
                  aria-current={page === id ? "page" : undefined}
                  title={collapsed ? label : undefined}
                  onClick={() => setMobile(false)}
                >
                  <Icon size={17} />
                  <span>{label}</span>
                  {id === "leads" && (
                    <b className="nav-count">
                      {
                        data.leads.filter((l) => !l.stage.startsWith("Closed"))
                          .length
                      }
                    </b>
                  )}
                  {id === "agent-analysis" && <i className="nav-dot" />}
                </a>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button className="workspace-health" onClick={() => setHelp(true)}>
            <span className="live-dot" />
            <span>Workspace guide</span>
            <CircleHelp size={14} />
          </button>
          <button
            className="admin-profile"
            onClick={() => navigate("settings")}
          >
            <Avatar name="Alex Morgan" />
            <span>
              <b>Alex Morgan</b>
              <small>Workspace admin</small>
            </span>
            <ChevronDown size={15} />
          </button>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-btn mobile-menu"
              aria-label="Open navigation"
              onClick={() => setMobile(true)}
            >
              <Menu size={19} />
            </button>
            <span>Workspace</span>
            <span className="slash">/</span>
            <b>{title}</b>
          </div>
          <div className="top-actions">
            <button
              className="search-trigger"
              onClick={() => setSearchOpen(true)}
            >
              <Search size={16} />
              <span>Search anything...</span>
              <kbd>⌘ K</kbd>
            </button>
            <button
              className={`live-toggle ${live ? "playing" : ""}`}
              onClick={() => setLive(!live)}
              title="Toggle simulated live events"
            >
              <span className="live-dot" />
              {live ? "Live demo" : "Demo paused"}
            </button>
            <div className="top-divider" />
            <button
              className="icon-btn notification-btn"
              aria-label={`${unread} notifications`}
              onClick={() => navigate("notifications")}
            >
              <Bell size={18} />
              {unread > 0 && <i />}
            </button>
            <button
              className="icon-btn settings-shortcut"
              aria-label="Settings"
              onClick={() => navigate("settings")}
            >
              <Settings size={18} />
            </button>
            <button
              className="avatar-button"
              aria-label="Admin account settings"
              onClick={() => navigate("settings")}
            >
              <Avatar name="Alex Morgan" size="small" />
            </button>
          </div>
        </header>
        <main id="main" className="main" tabIndex={-1}>
          <div className="page-context">
            <span>FIZZI ADMIN</span>
            <span>/</span>
            <span>{section}</span>
          </div>
          {loading ? (
            <Skeleton />
          ) : error ? (
            <ErrorState message={error} retry={retry} />
          ) : (
            <div className="page-enter" key={page}>
              {content}
            </div>
          )}
          <footer className="workspace-footer">
            <span>
              <span className="tiny-dot" />
              Fizzi intelligence workspace
            </span>
            <span>
              Demo data · September 2026{" "}
              <span className="footer-separator">/</span> All times IST
            </span>
          </footer>
        </main>
      </div>
      {message && (
        <div className="toast" role="status">
          <Check size={17} />
          {message}
        </div>
      )}
      {customer && (
        <CustomerProfile
          id={customer}
          agent={page === "agent-analysis"}
          onClose={() => setCustomer(null)}
        />
      )}{" "}
      {searchOpen && (
        <Modal title="Search workspace" onClose={() => setSearchOpen(false)}>
          <label className="search-field large-search">
            <Search size={20} />
            <input
              autoFocus
              placeholder="Customers, orders, products, leads…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <kbd>ESC</kbd>
          </label>
          {query.trim() ? (
            searchResults.length ? (
              <div className="search-results">
                {searchResults.map((r) => (
                  <button
                    key={`${r.kind}${r.id}`}
                    onClick={() => {
                      setSearchOpen(false);
                      r.action();
                    }}
                  >
                    <span>
                      <b>{r.name}</b>
                      <small>{r.kind}</small>
                    </span>
                    <ArrowUpRight size={16} />
                  </button>
                ))}
              </div>
            ) : (
              <Empty
                title="No matches found"
                text="Try a customer name, product, or order number."
              />
            )
          ) : (
            <div className="search-hint">
              <Command size={18} />
              <p>
                Your whole workspace, one search away.
                <br />
                <small>Try “Ruthvik”, “Yuzu”, or “FZ-2048”.</small>
              </p>
            </div>
          )}
        </Modal>
      )}
      {help && (
        <Modal
          title="Your intelligence workspace"
          onClose={() => setHelp(false)}
        >
          <p className="body-copy">
            Follow customer behavior from the first product view to a qualified
            opportunity and an order. Customers and Agent Analysis bring all the
            context into one profile.
          </p>
          <div className="guide-list">
            <p>
              <b>Explore</b> Open any customer to see behavior, orders, notes,
              and score history.
            </p>
            <p>
              <b>Operate</b> Move pipeline cards, assign leads, manage products,
              and update fulfillment.
            </p>
            <p>
              <b>Observe</b> Switch on Live demo to play simulated events every
              nine seconds.
            </p>
            <p>
              <b>Connect</b> The repository adapter is ready to replace with
              your authenticated backend.
            </p>
          </div>
          <Badge tone="sea">Local demo · changes stay in this browser</Badge>
        </Modal>
      )}
    </div>
  );
}
export default function App() {
  return (
    <Boundary>
      <StoreProvider>
        <Workspace />
      </StoreProvider>
    </Boundary>
  );
}
