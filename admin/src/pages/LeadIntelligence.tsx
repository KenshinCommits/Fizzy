import { ArrowUpRight, Check } from "lucide-react";
import { useState } from "react";
import { MiniChart } from "../components/Charts";
import { PageHeader } from "../components/PageHeader";
import { Avatar, Badge, Empty, Panel } from "../components/ui";
import { time, useStore } from "../lib/store";
type CustomerProps = { openCustomer: (id: string) => void };
export function Intelligence({ openCustomer }: CustomerProps) {
  const { data } = useStore();
  const [selected, setSelected] = useState("ruthvik");
  const c = data.customers.find((c) => c.userId === selected)!;
  const ledger = data.scoreHistory.filter((s) => s.customerId === selected);
  const dist = ["Low", "Medium", "High", "Very high"].map((name) => ({
    name,
    value: data.customers.filter((c) => c.intent === name).length,
  }));
  return (
    <>
      <PageHeader
        title="Intent, with evidence."
        description="Understand what moves a score — and which opportunities need a human."
      >
        <Badge tone="blue">Explainable intelligence</Badge>
      </PageHeader>
      <div className="two-col">
        <Panel title="Lead score distribution" eyebrow="SIGNAL STRENGTH">
          <MiniChart data={dist} />
          <div className="chart-key">
            Low 0–30 · Medium 31–60 · High 61–80 · Very high 81–100
          </div>
        </Panel>
        <Panel title="Top buying signals" eyebrow="RECORDED CUSTOMER BEHAVIOR">
          {[
            [
              "Repeated product interest",
              data.customers.filter((c) => c.productViews > 10).length,
            ],
            [
              "Viewed pricing",
              data.customers.filter((c) => c.pricingViews > 0).length,
            ],
            [
              "Started checkout",
              data.customers.filter((c) => c.checkoutAttempts > 0).length,
            ],
            [
              "Wholesale quote",
              data.leads.filter((l) => l.stage === "Bulk Quote").length,
            ],
          ].map(([l, v]) => (
            <div className="signal-row" key={l}>
              <span>{l}</span>
              <div className="bar-track">
                <i
                  style={{
                    width: `${(Number(v) / data.customers.length) * 100}%`,
                  }}
                />
              </div>
              <b>{v}</b>
            </div>
          ))}
        </Panel>
      </div>
      <div className="intelligence-columns">
        <Panel
          title="Score audit ledger"
          eyebrow="EVERY CHANGE HAS A REASON"
          action={
            <select
              aria-label="Customer score ledger"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              {data.customers.map((c) => (
                <option value={c.userId} key={c.userId}>
                  {c.customerName}
                </option>
              ))}
            </select>
          }
        >
          <div className="ledger-summary">
            <Avatar name={c.customerName} />
            <div>
              <b>{c.customerName}</b>
              <small>{c.leadStage}</small>
            </div>
            <strong>
              {c.leadScore}
              <small>/100</small>
            </strong>
          </div>
          {ledger.length ? (
            ledger.map((s) => (
              <div className="ledger-row" key={s.id}>
                <span className={s.delta >= 0 ? "positive" : "muted"}>
                  {s.delta > 0 ? "+" : ""}
                  {s.delta}
                </span>
                <div>
                  <b>{s.reason}</b>
                  <small>{time(s.timestamp)} · Recorded event</small>
                </div>
                <Check size={14} />
              </div>
            ))
          ) : (
            <Empty
              title="No changes recorded"
              text="The current score was imported. New events create a traceable audit record."
            />
          )}
          <div className="panel-bottom-link">
            Current intent<Badge tone="blue">{c.intent}</Badge>
          </div>
        </Panel>
        <div className="stack">
          <Panel title="Stalled opportunities">
            {data.customers
              .filter(
                (c) =>
                  c.status === "Dormant" && !c.leadStage.startsWith("Closed"),
              )
              .map((c) => (
                <button
                  className="list-person"
                  key={c.userId}
                  onClick={() => openCustomer(c.userId)}
                >
                  <Avatar name={c.customerName} />
                  <span>
                    <b>{c.customerName}</b>
                    <small>
                      {c.lastActive} · {c.leadStage}
                    </small>
                  </span>
                  <ArrowUpRight size={15} />
                </button>
              ))}
          </Panel>
          <Panel title="Recently escalated">
            {data.customers
              .filter(
                (c) => c.leadScore > 80 && !c.leadStage.startsWith("Closed"),
              )
              .map((c) => (
                <button
                  className="list-person"
                  key={c.userId}
                  onClick={() => openCustomer(c.userId)}
                >
                  <Avatar name={c.customerName} />
                  <span>
                    <b>{c.company || c.customerName}</b>
                    <small>{c.nextBestAction}</small>
                  </span>
                  <Badge tone="blue">{c.leadScore}</Badge>
                </button>
              ))}
          </Panel>
        </div>
      </div>
      <div className="two-col">
        <Panel title="Products generating leads">
          <MiniChart
            horizontal
            data={data.products.slice(0, 5).map((p) => ({
              name: p.name.split(" ")[0],
              value: data.leads.filter((l) => l.productId === p.id).length,
            }))}
          />
        </Panel>
        <Panel title="Lead source quality">
          <MiniChart
            data={["Organic search", "Direct", "Instagram", "Referral"].map(
              (name) => ({
                name,
                value: Math.round(
                  data.leads
                    .filter((l) => l.source === name)
                    .reduce(
                      (s, l) =>
                        s +
                        (data.customers.find((c) => c.userId === l.customerId)
                          ?.leadScore ?? 0),
                      0,
                    ) /
                    Math.max(
                      1,
                      data.leads.filter((l) => l.source === name).length,
                    ),
                ),
              }),
            )}
          />
          <p className="chart-key">Average lead score by acquisition source</p>
        </Panel>
      </div>
    </>
  );
}
