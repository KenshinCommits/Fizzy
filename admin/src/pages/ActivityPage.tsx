import { Activity, Download, Pause, Play, Radio } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { Avatar, Badge, Empty, Panel } from "../components/ui";
import { exportCsv, time, useStore } from "../lib/store";
type CustomerProps = { openCustomer: (id: string) => void };
export function ActivityPage({ openCustomer }: CustomerProps) {
  const { data, live, setLive } = useStore();
  const [filter, setFilter] = useState("All events");
  const events = data.events.filter(
    (e) => filter === "All events" || e.type === filter,
  );
  return (
    <>
      <PageHeader
        title="Every signal. In sequence."
        description="The operational record of customer behavior and CRM changes."
      >
        <button
          className={`btn ${live ? "primary" : ""}`}
          onClick={() => setLive(!live)}
        >
          {live ? <Pause size={15} /> : <Play size={15} />}{" "}
          {live ? "Pause live demo" : "Play live demo"}
        </button>
        <button
          className="btn"
          onClick={() =>
            exportCsv(
              "activity",
              events.map((e) => ({ ...e })),
            )
          }
        >
          <Download size={15} />
          Export
        </button>
      </PageHeader>
      <div className="inline-notice">
        <Radio size={19} />
        <p>
          {live
            ? "Simulated events arrive every nine seconds. Related customer scores and pipeline stages update together."
            : "Live demo is paused. Start playback to explore coordinated customer, score, and pipeline updates."}
        </p>
        <Badge tone="sea">{events.length} events</Badge>
      </div>
      <Panel>
        <div className="table-toolbar">
          <Activity size={17} />
          <h3>Event stream</h3>
          <select
            aria-label="Event type"
            className="push-right"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            {[
              "All events",
              "Login",
              "Page view",
              "Product view",
              "Pricing view",
              "Wishlist",
              "Cart update",
              "Checkout",
              "Purchase",
              "AI conversation",
              "Quote request",
              "Lead score change",
              "Cart abandoned",
            ].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Timestamp · IST</th>
                <th>Customer</th>
                <th>Event</th>
                <th>Product</th>
                <th>Impact</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => {
                const c = data.customers.find(
                  (c) => c.userId === e.customerId,
                )!;
                return (
                  <tr className="event-table-row" key={e.id}>
                    <td className="mono">{time(e.timestamp)}</td>
                    <td>
                      <button
                        className="person-cell"
                        onClick={() => openCustomer(c.userId)}
                      >
                        <Avatar name={c.customerName} size="small" />
                        <b>{c.company || c.customerName}</b>
                      </button>
                    </td>
                    <td>
                      {e.type}
                      <small className="cell-sub">{e.description}</small>
                    </td>
                    <td>
                      {data.products.find((p) => p.id === e.productId)?.name}
                    </td>
                    <td>
                      <Badge tone={e.impact > 0 ? "blue" : "neutral"}>
                        {e.impact > 0 ? "+" : ""}
                        {e.impact} score
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!events.length && (
          <Empty
            title="No events of this type"
            text="New matching activity will appear here."
          />
        )}
      </Panel>
    </>
  );
}
