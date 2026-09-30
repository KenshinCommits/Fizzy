import {
  ArrowRight,
  ArrowUpRight,
  AudioLines,
  CalendarDays,
  ChevronDown,
  CircleDot,
  Download,
  Eye,
  ShoppingBag,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import type { Navigate } from "../App";
import { RevenueChart, Sparkline } from "../components/Charts";
import { PageHeader } from "../components/PageHeader";
import {
  Avatar,
  Badge,
  Can,
  Metric,
  Panel,
  Score,
  TextLink,
} from "../components/ui";
import { revenueSeries } from "../data/seed";
import { exportCsv, money, shortMoney, time, useStore } from "../lib/store";
type CustomerProps = { openCustomer: (id: string) => void };
export function Dashboard({
  navigate,
  openCustomer,
}: CustomerProps & { navigate: Navigate }) {
  const { data, live } = useStore();
  const [days, setDays] = useState(30);
  const [chart, setChart] = useState("Revenue");
  const total = revenueSeries.slice(-days).reduce((s, r) => s + r.revenue, 0);
  const previousTotal = revenueSeries
    .slice(-days)
    .reduce((sum, row) => sum + row.previous, 0);
  const revenueChange = ((total / previousTotal - 1) * 100).toFixed(1);
  const active = data.leads.filter((l) => !l.stage.startsWith("Closed"));
  const high = data.customers.filter((c) => c.leadScore > 60);
  const pipeline = active.reduce((s, l) => s + l.value, 0);
  const priority = [...data.customers]
    .filter((c) => !c.leadStage.startsWith("Closed"))
    .sort((a, b) => b.leadScore - a.leadScore)
    .slice(0, 5);
  return (
    <>
      <PageHeader
        title="A fresh look at your business."
        description="Good morning, Alex. Here’s what’s happening across Fizzi today."
      >
        <label className="date-select">
          <CalendarDays size={15} />
          <select
            aria-label="Dashboard date range"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          >
            <option value={30}>Sep 1 – Sep 30, 2026</option>
            <option value={7}>Sep 24 – Sep 30, 2026</option>
          </select>
          <ChevronDown size={14} />
        </label>
        <button
          className="btn"
          onClick={() => exportCsv("revenue", revenueSeries.slice(-days))}
        >
          <Download size={15} />
          Export report
        </button>
      </PageHeader>
      <div className="overview-strip">
        <div className="overview-kicker">
          <span className="live-dot" />
          <b>Your business, in focus</b>
          <span>Last {days} days</span>
        </div>
        <span>Compared with the previous period</span>
      </div>
      <div className="kpi-grid">
        <Metric
          label="Total revenue"
          value={shortMoney(total)}
          featured
          change={`↗ ${revenueChange}%`}
        >
          <small>vs. previous period</small>
          <Sparkline />
        </Metric>
        <Metric
          label="Active leads"
          value={String(active.length)}
          change="Open opportunities"
        >
          <span className="mini-avatars">
            {["R R", "M N", "P S"].map((n) => (
              <Avatar key={n} name={n} size="tiny" />
            ))}
          </span>
        </Metric>
        <Metric
          label="High intent customers"
          value={String(high.length)}
          change={`${data.customers.length} customers tracked`}
        >
          <div className="segment-meter">
            {Array.from({ length: 12 }, (_, i) => (
              <i className={i < high.length ? "filled" : ""} key={i} />
            ))}
          </div>
        </Metric>
        <Metric
          label="Pipeline value"
          value={shortMoney(pipeline)}
          change={`${active.filter((l) => l.value > 10000).length} wholesale opportunities`}
        >
          <span className="metric-caption">Opportunity, in motion</span>
        </Metric>
        <Metric label="Conversion rate" value="4.83%" change="↗ 0.64 pp">
          <small>vs. previous period</small>
          <Sparkline />
        </Metric>
      </div>
      <div className="dashboard-primary">
        <Panel
          title="Revenue overview"
          eyebrow="THE BIG PICTURE"
          action={
            <div className="segmented">
              {["Revenue", "Orders"].map((t) => (
                <button
                  key={t}
                  className={chart === t ? "active" : ""}
                  onClick={() => setChart(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          }
        >
          <div className="chart-summary">
            <strong>
              {chart === "Revenue"
                ? money(total)
                : revenueSeries
                    .slice(-days)
                    .reduce((s, r) => s + r.orders, 0)
                    .toLocaleString("en-IN")}
            </strong>
            <Badge tone="sea">
              ↗ {chart === "Revenue" ? `${revenueChange}%` : `${days} days`}
            </Badge>
            <div className="chart-legend">
              <span>
                <i />
                This period
              </span>
              <span>
                <i />
                Previous period
              </span>
            </div>
          </div>
          <RevenueChart days={days} orders={chart === "Orders"} />
          <div className="chart-note">
            <span className="round-icon tiny">
              <TrendingUp size={14} />
            </span>
            <span>Yuzu Citrus leads product revenue this month.</span>
            <button
              onClick={() => navigate("analytics")}
              aria-label="View analytics"
            >
              <ArrowUpRight size={16} />
            </button>
          </div>
        </Panel>
        <Panel
          title="Live intelligence"
          action={
            <span className="live-status">
              <span className="live-dot" />
              {live ? "LIVE DEMO" : "DEMO"}
            </span>
          }
          className="live-panel"
        >
          <p className="section-description">
            The signals worth paying attention to.
          </p>
          <div className="live-events">
            {data.events.slice(0, 4).map((e, i) => {
              const c = data.customers.find((c) => c.userId === e.customerId)!;
              const Icon =
                e.type === "Quote request"
                  ? ShoppingBag
                  : e.type === "AI conversation"
                    ? AudioLines
                    : e.type === "Cart abandoned"
                      ? ShoppingBag
                      : Eye;
              return (
                <button
                  className="live-event"
                  key={e.id}
                  onClick={() => openCustomer(c.userId)}
                >
                  <span className={`event-icon tone-${i % 3}`}>
                    <Icon size={16} />
                  </span>
                  <span className="event-copy">
                    <b>{c.company || c.customerName.split(" ")[0]}</b>
                    <span>{e.description}</span>
                    <small>
                      {time(e.timestamp)} <span>·</span> {e.type}
                    </small>
                  </span>
                  <ArrowUpRight size={13} />
                </button>
              );
            })}
          </div>
          <button
            className="panel-bottom-link"
            onClick={() => navigate("activity")}
          >
            View all activity
            <ArrowRight size={15} />
          </button>
        </Panel>
      </div>
      <Panel
        title="Priority customers"
        eyebrow="THE NEXT CONVERSATION MATTERS"
        action={
          <TextLink onClick={() => navigate("customers")}>
            All customers
          </TextLink>
        }
      >
        <div className="table-scroll">
          <table className="priority-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Intent / score</th>
                <th>Product interest</th>
                <th>Last activity</th>
                <th>Recommended action</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {priority.map((c) => (
                <tr key={c.userId}>
                  <td>
                    <button
                      className="person-cell"
                      onClick={() => openCustomer(c.userId)}
                    >
                      <Avatar name={c.customerName} />
                      <span>
                        <b>{c.company || c.customerName}</b>
                        <small>
                          {c.company
                            ? c.customerName
                            : "Returning customer · D2C"}
                        </small>
                      </span>
                    </button>
                  </td>
                  <td>
                    <div className="intent-cell">
                      <Badge tone="blue">{c.intent}</Badge>
                      <Score value={c.leadScore} />
                    </div>
                  </td>
                  <td>
                    {data.products.find((p) => p.id === c.currentProduct)?.name}
                  </td>
                  <td className="muted">{c.lastActive}</td>
                  <td>
                    <button
                      className="action-text"
                      onClick={() => openCustomer(c.userId)}
                    >
                      {c.nextBestAction}
                      <ArrowUpRight size={13} />
                    </button>
                  </td>
                  <td>
                    <button
                      className="icon-btn"
                      onClick={() => openCustomer(c.userId)}
                      aria-label={`Open ${c.customerName}`}
                    >
                      <ArrowRight size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <div className="dashboard-bottom">
        <Panel
          title="From signal to sale"
          eyebrow="THE FIZZI INTELLIGENCE LOOP"
          action={
            <TextLink onClick={() => navigate("intelligence")}>
              Explore intelligence
            </TextLink>
          }
        >
          <div className="flow-track">
            {[
              {
                label: "Customer behavior",
                value: "1,284",
                sub: "sessions",
                icon: Eye,
              },
              {
                label: "AI understanding",
                value: "126",
                sub: "conversations",
                icon: Sparkles,
              },
              {
                label: "Qualified intent",
                value: String(high.length),
                sub: "priority customers",
                icon: CircleDot,
              },
              {
                label: "Agent action",
                value: "42",
                sub: "recommendations",
                icon: AudioLines,
              },
              {
                label: "Conversion",
                value: "28",
                sub: "assisted orders",
                icon: ShoppingBag,
              },
            ].map((s, i) => (
              <div className="flow-step" key={s.label}>
                <span className="flow-label">
                  <s.icon size={14} />
                  {s.label}
                </span>
                <strong>{s.value}</strong>
                <small>{s.sub}</small>
                {i < 4 && <ArrowRight className="flow-arrow" size={15} />}
              </div>
            ))}
          </div>
          <div className="fine-print flow-note">
            Monthly demo funnel · agent actions lead into the CRM pipeline
            before conversion.
          </div>
        </Panel>
        <div className="product-spotlight">
          <div>
            <span className="eyebrow">THIS MONTH’S FAVORITE</span>
            <h2>
              A little citrus.
              <br />A lot of love.
            </h2>
            <p>Yuzu Citrus</p>
            <button className="text-link" onClick={() => navigate("products")}>
              Explore product <ArrowUpRight size={15} />
            </button>
          </div>
          <Can name="Yuzu Citrus" />
        </div>
      </div>
    </>
  );
}
