import { Download, Search, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { Avatar, Badge, Empty, Panel, Score } from "../components/ui";
import { exportCsv, money, useStore } from "../lib/store";
type CustomerProps = { openCustomer: (id: string) => void };
export function Customers({ openCustomer }: CustomerProps) {
  const { data } = useStore();
  const [q, setQ] = useState("");
  const [type, setType] = useState("All types");
  const [intent, setIntent] = useState("All intent");
  const [advanced, setAdvanced] = useState(false);
  const [count, setCount] = useState("all");
  const [range, setRange] = useState("all");
  const rows = data.customers.filter(
    (c) =>
      `${c.customerName} ${c.email} ${c.company}`
        .toLowerCase()
        .includes(q.toLowerCase()) &&
      (type === "All types" || c.customerType === type) &&
      (intent === "All intent" || c.intent === intent) &&
      (count === "all" ||
        (count === "returning" ? c.totalOrders > 1 : c.totalOrders === 0)) &&
      (range === "all" || (c.totalOrders > 0 && c.lastOrder >= "2026-09-01")),
  );
  return (
    <>
      <PageHeader
        title="People behind every purchase."
        description="A complete view of your customers, their interests, and what comes next."
      >
        <button
          className="btn"
          onClick={() =>
            exportCsv(
              "customers",
              rows.map((c) => ({
                name: c.customerName,
                email: c.email,
                type: c.customerType,
                orders: c.totalOrders,
                spend: c.totalSpent,
                score: c.leadScore,
              })),
            )
          }
        >
          <Download size={15} />
          Export customers
        </button>
      </PageHeader>
      <div className="summary-line">
        <span>
          <b>{data.customers.length}</b> customers
        </span>
        <span>
          <b>
            {
              data.customers.filter((c) => c.customerType === "Wholesale")
                .length
            }
          </b>{" "}
          wholesale partners
        </span>
        <span>
          <b>{data.customers.filter((c) => c.totalOrders > 1).length}</b>{" "}
          returning customers
        </span>
      </div>
      <Panel>
        <div className="table-toolbar">
          <label className="search-field">
            <Search size={16} />
            <input
              placeholder="Search customers…"
              aria-label="Search customers"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </label>
          <select
            aria-label="Customer type"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            {["All types", "D2C", "Wholesale"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
          <select
            aria-label="Intent level"
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
          >
            {["All intent", "Very high", "High", "Medium", "Low"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
          <button
            className={`btn ${advanced ? "selected" : ""}`}
            onClick={() => setAdvanced(!advanced)}
          >
            <SlidersHorizontal size={14} />
            Filters
          </button>
        </div>
        {advanced && (
          <div className="advanced-filters">
            <label>
              Order count
              <select value={count} onChange={(e) => setCount(e.target.value)}>
                <option value="all">Any order count</option>
                <option value="returning">More than one order</option>
                <option value="new">No orders</option>
              </select>
            </label>
            <label>
              Last order
              <select value={range} onChange={(e) => setRange(e.target.value)}>
                <option value="all">All time</option>
                <option value="month">September 2026</option>
              </select>
            </label>
            <button
              className="text-link"
              onClick={() => {
                setQ("");
                setType("All types");
                setIntent("All intent");
                setCount("all");
                setRange("all");
              }}
            >
              Reset filters
            </button>
          </div>
        )}
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                {[
                  "Customer",
                  "Type",
                  "Orders",
                  "Total spend",
                  "Last active",
                  "Intent",
                  "Lead score",
                  "Status",
                ].map((t) => (
                  <th key={t}>{t}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.userId}>
                  <td>
                    <button
                      className="person-cell"
                      onClick={() => openCustomer(c.userId)}
                    >
                      <Avatar name={c.customerName} />
                      <span>
                        <b>{c.customerName}</b>
                        <small>{c.email}</small>
                      </span>
                    </button>
                  </td>
                  <td>
                    <Badge>{c.customerType}</Badge>
                  </td>
                  <td>{c.totalOrders}</td>
                  <td className="strong">{money(c.totalSpent)}</td>
                  <td className="muted">{c.lastActive}</td>
                  <td>
                    <Badge tone={c.leadScore > 60 ? "blue" : "neutral"}>
                      {c.intent}
                    </Badge>
                  </td>
                  <td>
                    <Score value={c.leadScore} />
                  </td>
                  <td>
                    <span className="status-label">
                      <i className={c.status === "Active" ? "on" : ""} />
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!rows.length && (
          <Empty
            title="No customers match these filters"
            text="Try broadening your search or resetting the filters."
          />
        )}
        <div className="table-footer">
          <span>
            Showing {rows.length} of {data.customers.length} customers
          </span>
          <span>Customer intelligence, always in context.</span>
        </div>
      </Panel>
    </>
  );
}
