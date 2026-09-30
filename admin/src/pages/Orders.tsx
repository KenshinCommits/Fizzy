import { Check, Clock, Download, MapPin, Search } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { Badge, Can, Empty, Modal, Panel } from "../components/ui";
import type { Order } from "../data/models";
import { date, exportCsv, money, shortMoney, useStore } from "../lib/store";
export function Orders() {
  const { data, update, toast } = useStore();
  const [filter, setFilter] = useState("All");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const order = data.orders.find((o) => o.id === selected);
  const rows = data.orders.filter(
    (o) =>
      (filter === "All" ||
        o.status === filter ||
        (filter === "Wholesale" && o.type === "Wholesale")) &&
      `${o.id} ${data.customers.find((c) => c.userId === o.customerId)?.customerName}`
        .toLowerCase()
        .includes(q.toLowerCase()),
  );
  return (
    <>
      <PageHeader
        title="Every order, taken care of."
        description="Track fulfillment, payments, and the details that make delivery seamless."
      >
        <button
          className="btn"
          onClick={() =>
            exportCsv(
              "orders",
              rows.map((o) => ({
                order: o.id,
                customer: o.customerId,
                total: o.amount,
                payment: o.payment,
                status: o.status,
                date: o.date,
              })),
            )
          }
        >
          <Download size={15} />
          Export orders
        </button>
      </PageHeader>
      <div className="summary-line">
        <span>
          <b>{data.orders.length}</b> orders
        </span>
        <span>
          <b>{data.orders.filter((o) => o.status === "Processing").length}</b>{" "}
          to fulfill
        </span>
        <span>
          <b>
            {shortMoney(
              data.orders
                .filter((o) => o.payment === "Paid" && o.status !== "Cancelled")
                .reduce((s, o) => s + o.amount, 0),
            )}
          </b>{" "}
          paid order value
        </span>
      </div>
      <Panel>
        <div className="tabs table-tabs">
          {[
            "All",
            "Processing",
            "Shipped",
            "Delivered",
            "Cancelled",
            "Wholesale",
          ].map((t) => (
            <button
              className={filter === t ? "active" : ""}
              key={t}
              onClick={() => setFilter(t)}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="table-toolbar">
          <label className="search-field">
            <Search size={16} />
            <input
              aria-label="Search orders"
              placeholder="Search order or customer…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </label>
          <Badge>{rows.length} orders</Badge>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                {[
                  "Order ID",
                  "Customer",
                  "Items",
                  "Amount",
                  "Order type",
                  "Payment",
                  "Status",
                  "Date",
                ].map((t) => (
                  <th key={t}>{t}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id}>
                  <td>
                    <button
                      className="text-link"
                      onClick={() => setSelected(o.id)}
                    >
                      #{o.id}
                    </button>
                  </td>
                  <td>
                    {
                      data.customers.find((c) => c.userId === o.customerId)
                        ?.customerName
                    }
                  </td>
                  <td>{o.items.reduce((s, i) => s + i.quantity, 0)} packs</td>
                  <td className="strong">{money(o.amount)}</td>
                  <td>{o.type}</td>
                  <td>
                    <Badge tone={o.payment === "Paid" ? "sea" : "neutral"}>
                      {o.payment}
                    </Badge>
                  </td>
                  <td>
                    <Badge
                      tone={o.status === "Processing" ? "blue" : "neutral"}
                    >
                      {o.status}
                    </Badge>
                  </td>
                  <td className="muted">{date(o.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!rows.length && (
          <Empty
            title="No orders in this view"
            text="Try another status or a different search."
          />
        )}
      </Panel>
      {order && (
        <Modal
          title={`Order #${order.id}`}
          onClose={() => setSelected(null)}
          wide
        >
          <div className="order-meta">
            <Badge tone="blue">{order.status}</Badge>
            <span>Placed {date(order.date)}</span>
            <label>
              Fulfillment
              <select
                aria-label="Order fulfillment status"
                value={order.status}
                onChange={(e) => {
                  update((d) => ({
                    ...d,
                    orders: d.orders.map((o) =>
                      o.id === order.id
                        ? { ...o, status: e.target.value as Order["status"] }
                        : o,
                    ),
                  }));
                  toast("Order fulfillment updated");
                }}
              >
                {["Processing", "Shipped", "Delivered", "Cancelled"].map(
                  (s) => (
                    <option key={s}>{s}</option>
                  ),
                )}
              </select>
            </label>
          </div>
          <div className="two-col">
            <Panel title="Customer">
              <div className="padded">
                <h3>
                  {
                    data.customers.find((c) => c.userId === order.customerId)
                      ?.customerName
                  }
                </h3>
                <p>
                  {
                    data.customers.find((c) => c.userId === order.customerId)
                      ?.email
                  }
                </p>
                <Badge>{order.type}</Badge>
              </div>
            </Panel>
            <Panel title="Shipping details">
              <div className="padded inline">
                <MapPin size={20} />
                <p>{order.address}</p>
              </div>
            </Panel>
          </div>
          <Panel title="Order items">
            {order.items.map((i) => {
              const p = data.products.find((p) => p.id === i.productId)!;
              return (
                <div className="order-item" key={p.id}>
                  <Can small tone={p.tone} name={p.name} />
                  <div>
                    <b>{p.name}</b>
                    <small>
                      {i.quantity} × {money(i.price)}
                    </small>
                  </div>
                  <strong>{money(i.quantity * i.price)}</strong>
                </div>
              );
            })}
            <dl className="order-totals">
              <dt>Subtotal</dt>
              <dd>
                {money(
                  order.items.reduce((s, i) => s + i.quantity * i.price, 0),
                )}
              </dd>
              <dt>Discount</dt>
              <dd>−{money(order.discount)}</dd>
              <dt>Shipping</dt>
              <dd>
                {order.shipping ? money(order.shipping) : "Complimentary"}
              </dd>
              <dt>
                <b>Total</b>
              </dt>
              <dd>
                <b>{money(order.amount)}</b>
              </dd>
            </dl>
          </Panel>
          <Panel title="Order timeline">
            <div className="fulfillment-timeline">
              {[
                "Order placed",
                "Payment confirmed",
                "Processing",
                "Shipped",
                "Delivered",
              ].map((s, i) => {
                const reached =
                  order.status !== "Cancelled" &&
                  (i === 0 || i === 1
                    ? i === 0 || order.payment === "Paid"
                    : i <=
                      ["Processing", "Shipped", "Delivered"].indexOf(
                        order.status,
                      ) +
                        2);
                return (
                  <div className={reached ? "done" : ""} key={s}>
                    <span>
                      {reached ? <Check size={16} /> : <Clock size={16} />}
                    </span>
                    <b>{s}</b>
                  </div>
                );
              })}
            </div>
            {order.status === "Cancelled" && (
              <p className="padded">
                This order was cancelled. Fulfillment has stopped.
              </p>
            )}
          </Panel>
        </Modal>
      )}
    </>
  );
}
