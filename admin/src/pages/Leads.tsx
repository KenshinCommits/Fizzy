import { ArrowUpRight, Search } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { Avatar, Badge, Empty, Panel, Score } from "../components/ui";
import type { PipelineStage } from "../data/models";
import { stages } from "../data/seed";
import { useStore } from "../lib/store";
type CustomerProps = { openCustomer: (id: string) => void };
export function Leads({ openCustomer }: CustomerProps) {
  const { data, moveLead } = useStore();
  const [q, setQ] = useState("");
  const [intent, setIntent] = useState("All intent");
  const rows = [...data.leads]
    .filter((l) => {
      const c = data.customers.find((c) => c.userId === l.customerId)!;
      return (
        `${c.customerName} ${c.company}`
          .toLowerCase()
          .includes(q.toLowerCase()) &&
        (intent === "All intent" || c.intent === intent)
      );
    })
    .sort(
      (a, b) =>
        data.customers.find((c) => c.userId === b.customerId)!.leadScore -
        data.customers.find((c) => c.userId === a.customerId)!.leadScore,
    );
  return (
    <>
      <PageHeader
        title="The right conversation, next."
        description="A prioritized queue of opportunities, with the context to act confidently."
      >
        <Badge tone="sea">Sorted by intent score</Badge>
      </PageHeader>
      <Panel>
        <div className="table-toolbar">
          <label className="search-field">
            <Search size={15} />
            <input
              aria-label="Search leads"
              placeholder="Find a lead…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </label>
          <select
            aria-label="Lead intent"
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
          >
            {["All intent", "Very high", "High", "Medium", "Low"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
          <span className="push-right muted">{rows.length} opportunities</span>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                {[
                  "Lead",
                  "Source",
                  "Score / intent",
                  "Product",
                  "Stage",
                  "Last activity",
                  "SLA",
                  "Next best action",
                ].map((t) => (
                  <th key={t}>{t}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((l) => {
                const c = data.customers.find(
                  (c) => c.userId === l.customerId,
                )!;
                return (
                  <tr key={l.id}>
                    <td>
                      <button
                        className="person-cell"
                        onClick={() => openCustomer(c.userId)}
                      >
                        <Avatar name={c.customerName} />
                        <span>
                          <b>{c.company || c.customerName}</b>
                          <small>{c.customerType}</small>
                        </span>
                      </button>
                    </td>
                    <td>{l.source}</td>
                    <td>
                      <Score value={c.leadScore} />
                      <small className="cell-sub">{c.intent}</small>
                    </td>
                    <td>
                      {data.products.find((p) => p.id === l.productId)?.name}
                    </td>
                    <td>
                      <select
                        aria-label={`Stage for ${c.customerName}`}
                        value={l.stage}
                        onChange={(e) =>
                          moveLead(l.id, e.target.value as PipelineStage)
                        }
                      >
                        {stages.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="muted">{l.lastActivity}</td>
                    <td>
                      <Badge
                        tone={l.sla.startsWith("Due") ? "sand" : "neutral"}
                      >
                        {l.sla}
                      </Badge>
                    </td>
                    <td>
                      <button
                        className="action-text"
                        onClick={() => openCustomer(c.userId)}
                      >
                        {l.nextAction}
                        <ArrowUpRight size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!rows.length && (
          <Empty
            title="No leads match your search"
            text="Adjust your filters to explore other opportunities."
          />
        )}
      </Panel>
      <p className="fine-print padded">
        Score guide: 0–30 Low · 31–60 Medium · 61–80 High · 81–100 Very high
      </p>
    </>
  );
}
