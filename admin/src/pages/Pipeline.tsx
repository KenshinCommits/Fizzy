import { GripVertical, Plus } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { Badge, Score } from "../components/ui";
import type { PipelineStage } from "../data/models";
import { stages } from "../data/seed";
import { money, shortMoney, useStore } from "../lib/store";
type CustomerProps = { openCustomer: (id: string) => void };
export function Pipeline({ openCustomer }: CustomerProps) {
  const { data, moveLead } = useStore();
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [filter, setFilter] = useState("All opportunities");
  const leads = data.leads.filter(
    (l) =>
      filter === "All opportunities" ||
      data.customers.find((c) => c.userId === l.customerId)?.customerType ===
        filter,
  );
  return (
    <>
      <PageHeader
        title="Good things, moving forward."
        description="A shared view of every opportunity, from first interest to a lasting partnership."
      >
        <select
          aria-label="Pipeline customer type"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          {["All opportunities", "D2C", "Wholesale"].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </PageHeader>
      <div className="summary-line">
        <span>
          <b>{leads.filter((l) => !l.stage.startsWith("Closed")).length}</b>{" "}
          open opportunities
        </span>
        <span>
          <b>
            {shortMoney(
              leads
                .filter((l) => !l.stage.startsWith("Closed"))
                .reduce((s, l) => s + l.value, 0),
            )}
          </b>{" "}
          pipeline value
        </span>
        <span className="push-right">
          Drag cards to move · or use the stage menu
        </span>
      </div>
      <div
        className="pipeline-board"
        tabIndex={0}
        aria-label="Pipeline board, scroll horizontally for more stages"
      >
        {stages.map((stage, index) => {
          const cards = leads.filter((l) => l.stage === stage);
          return (
            <section
              className={`pipeline-column ${over === stage ? "drag-over" : ""}`}
              key={stage}
              onDragOver={(e) => {
                e.preventDefault();
                setOver(stage);
              }}
              onDragLeave={() => setOver(null)}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("text/plain");
                if (data.leads.some((l) => l.id === id)) moveLead(id, stage);
                setDragging(null);
                setOver(null);
              }}
            >
              <div className="column-head">
                <span
                  className="stage-marker"
                  style={{ opacity: 0.4 + index * 0.07 }}
                />
                <h2>{stage}</h2>
                <b>{cards.length}</b>
              </div>
              <div className="column-value">
                {money(cards.reduce((s, l) => s + l.value, 0))}
              </div>
              {cards.length ? (
                cards.map((l) => {
                  const c = data.customers.find(
                    (c) => c.userId === l.customerId,
                  )!;
                  return (
                    <article
                      className={`pipeline-card ${dragging === l.id ? "dragging" : ""}`}
                      draggable
                      key={l.id}
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", l.id);
                        setDragging(l.id);
                      }}
                      onDragEnd={() => {
                        setDragging(null);
                        setOver(null);
                      }}
                    >
                      <div className="inline">
                        <Badge>{c.customerType}</Badge>
                        <GripVertical size={15} className="push-right muted" />
                      </div>
                      <button
                        className="pipeline-person"
                        onClick={() => openCustomer(c.userId)}
                      >
                        <b>{c.company || c.customerName}</b>
                        <small>
                          {c.company ? c.customerName : "Direct customer"}
                        </small>
                      </button>
                      <p>
                        {data.products.find((p) => p.id === l.productId)?.name}
                      </p>
                      <strong>{money(l.value)}</strong>
                      <div className="pipeline-score">
                        <Score value={c.leadScore} />
                        <span>{c.lastActive}</span>
                      </div>
                      <div className="next-action">
                        <span>NEXT ACTION</span>
                        <p>{l.nextAction}</p>
                      </div>
                      <select
                        aria-label={`Move ${c.company || c.customerName}`}
                        value={stage}
                        onChange={(e) =>
                          moveLead(l.id, e.target.value as PipelineStage)
                        }
                      >
                        {stages.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </article>
                  );
                })
              ) : (
                <div className="pipeline-empty">
                  <Plus size={19} />
                  <b>Room for what’s next</b>
                  <span>Move an opportunity here.</span>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}
