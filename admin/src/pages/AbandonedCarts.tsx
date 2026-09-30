import { ArrowRight, Phone } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "../components/PageHeader";
import {
  Avatar,
  Badge,
  Can,
  Empty,
  Metric,
  Modal,
  Panel,
} from "../components/ui";
import { money, time, useStore } from "../lib/store";
type CustomerProps = { openCustomer: (id: string) => void };
export function AbandonedCarts({ openCustomer }: CustomerProps) {
  const { data, update, toast, addEvent } = useStore();
  const [view, setView] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const cart = data.carts.find((c) => c.id === view);
  return (
    <>
      <PageHeader
        title="A second chance at a first sip."
        description="Review abandoned carts and make the next interaction useful."
      >
        <Badge tone="sea">Recovery workspace</Badge>
      </PageHeader>
      <div className="three-col">
        <Metric
          label="Recoverable cart value"
          value={money(
            data.carts
              .filter((c) => c.recovery !== "Recovered")
              .reduce((s, c) => s + c.value, 0),
          )}
          featured
        />
        <Metric
          label="Ready for review"
          value={String(
            data.carts.filter((c) => c.recovery === "Ready").length,
          )}
        />
        <Metric
          label="Recovery queued"
          value={String(
            data.carts.filter((c) => c.recovery === "Queued").length,
          )}
        />
      </div>
      <Panel title="Abandoned carts">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                {[
                  "Customer",
                  "Cart value",
                  "Items",
                  "Last activity",
                  "Time since abandonment",
                  "Intent",
                  "Recovery status",
                  "Actions",
                ].map((t) => (
                  <th key={t}>{t}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.carts.map((cart, i) => {
                const c = data.customers.find(
                  (c) => c.userId === cart.customerId,
                )!;
                return (
                  <tr key={cart.id}>
                    <td>
                      <button
                        className="person-cell"
                        onClick={() => openCustomer(c.userId)}
                      >
                        <Avatar name={c.customerName} />
                        <b>{c.customerName}</b>
                      </button>
                    </td>
                    <td className="strong">{money(cart.value)}</td>
                    <td>{cart.items}</td>
                    <td>{time(cart.abandonedAt)}</td>
                    <td>{[18, 33, 93][i]} min · demo snapshot</td>
                    <td>
                      <Badge tone="blue">{c.intent}</Badge>
                    </td>
                    <td>
                      <Badge tone="sea">
                        {cart.recovery === "Ready"
                          ? "AI recovery ready"
                          : cart.recovery}
                      </Badge>
                    </td>
                    <td>
                      <div className="inline">
                        <button
                          className="text-link"
                          onClick={() => setView(cart.id)}
                        >
                          View cart
                        </button>
                        <button
                          className="btn small"
                          disabled={cart.recovery !== "Ready"}
                          onClick={() => setConfirm(cart.id)}
                        >
                          <Phone size={13} />
                          {cart.recovery === "Ready" ? "Recover" : "Queued"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!data.carts.length && (
          <Empty
            title="No abandoned carts"
            text="Carts ready for recovery will appear here."
          />
        )}
      </Panel>
      {cart && (
        <Modal title="Abandoned cart" onClose={() => setView(null)}>
          <div className="cart-preview">
            <Can
              name={data.products.find((p) => p.id === cart.productId)?.name}
            />
            <div>
              <h2>
                {data.products.find((p) => p.id === cart.productId)?.name}
              </h2>
              <p>{cart.items} item(s) · saved cart snapshot</p>
              <strong>{money(cart.value)}</strong>
            </div>
          </div>
          <button
            className="btn"
            onClick={() => {
              setView(null);
              openCustomer(cart.customerId);
            }}
          >
            View customer
            <ArrowRight size={15} />
          </button>
        </Modal>
      )}
      {confirm && (
        <Modal title="Queue AI recovery" onClose={() => setConfirm(null)}>
          <span className="round-icon">
            <Phone size={22} />
          </span>
          <h3>Give this cart a thoughtful follow-up.</h3>
          <p className="body-copy">
            This demo will queue a recovery request and record it in the
            activity stream. No call is placed and no customer is contacted.
          </p>
          <div className="form-footer">
            <button className="btn" onClick={() => setConfirm(null)}>
              Cancel
            </button>
            <button
              className="btn primary"
              onClick={() => {
                const c = data.carts.find((c) => c.id === confirm)!;
                update((d) => ({
                  ...d,
                  carts: d.carts.map((x) =>
                    x.id === confirm ? { ...x, recovery: "Queued" } : x,
                  ),
                }));
                addEvent({
                  customerId: c.customerId,
                  type: "AI conversation",
                  productId: c.productId,
                  impact: 0,
                  description: "has a demo recovery request queued",
                });
                toast("Demo recovery request queued");
                setConfirm(null);
              }}
            >
              Queue demo recovery
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
