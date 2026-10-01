import { ArrowUpRight, Search, Sparkles } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { Avatar, Badge, Empty, Panel, Score } from "../components/ui";
import { useStore } from "../lib/store";
type CustomerProps = { openCustomer: (id: string) => void };
export function AgentAnalysis({ openCustomer }: CustomerProps) {
  const { data } = useStore();
  const [q, setQ] = useState("");
  const rows = data.customers.filter((c) =>
    `${c.customerName} ${c.company}`.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <>
      <PageHeader
        title="Understand every conversation."
        description="See the behavior, reasoning, and actions behind your AI agent."
        eyebrow="AGENT INTELLIGENCE"
      >
        <Badge tone="sea">
          <span className="live-dot" />
          Demo workspace
        </Badge>
      </PageHeader>
      <div className="agent-stats">
        {[
          ["Active conversations", "0"],
          [
            "Conversations today",
            String(
              data.conversations.filter((c) => c.date === "2026-09-30").length,
            ),
          ],
          [
            "High-intent conversations",
            String(data.conversations.filter((c) => c.intentAfter > 60).length),
          ],
          ["Verified assisted orders", "0"],
          [
            "Recovery requests",
            String(data.carts.filter((c) => c.recovery === "Queued").length),
          ],
          ["B2B conversations", "0"],
        ].map(([l, v]) => (
          <div key={l}>
            <small>{l}</small>
            <strong>{v}</strong>
          </div>
        ))}
      </div>
      <div className="explain-banner">
        <span className="round-icon">
          <Sparkles size={20} />
        </span>
        <div>
          <b>The reasoning is as important as the result.</b>
          <p>
            Open a customer to trace behavior → intent → agent action → pipeline
            outcome.
          </p>
        </div>
        <ArrowUpRight size={20} />
      </div>
      <Panel
        title="Customer intelligence"
        action={
          <label className="search-field">
            <Search size={15} />
            <input
              aria-label="Search agent customers"
              placeholder="Find a customer…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </label>
        }
      >
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                {[
                  "Customer",
                  "Current product",
                  "Visits",
                  "Product views",
                  "Intent",
                  "Lead score",
                  "Last interaction",
                  "Agent action",
                ].map((x) => (
                  <th key={x}>{x}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const v = data.conversations.find(
                  (v) => v.customerId === c.userId,
                );
                return (
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
                            {c.customerType} · {c.leadStage}
                          </small>
                        </span>
                      </button>
                    </td>
                    <td>
                      {
                        data.products.find((p) => p.id === c.currentProduct)
                          ?.name
                      }
                    </td>
                    <td>{c.visitCount}</td>
                    <td>{c.productViews}</td>
                    <td>
                      <Badge tone="blue">{c.intent}</Badge>
                    </td>
                    <td>
                      <Score value={c.leadScore} />
                    </td>
                    <td className="muted">{v ? v.date : "No interaction"}</td>
                    <td>
                      <button
                        className="action-text"
                        onClick={() => openCustomer(c.userId)}
                      >
                        {v ? v.recommendedAction : "Review customer"}
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
            title="No customer intelligence found"
            text="Try a different customer name."
          />
        )}
      </Panel>
    </>
  );
}
