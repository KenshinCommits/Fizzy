import {
  ArrowRight,
  Check,
  FileText,
  MessageSquare,
  Plus,
  ShoppingBag,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import type { Conversation } from "../data/models";
import { date, duration, money, time, useStore } from "../lib/store";
import { MiniChart } from "./Charts";
import { Avatar, Badge, Empty, Modal, Panel } from "./ui";
export function Transcript({
  conversation,
  onClose,
}: {
  conversation: Conversation;
  onClose: () => void;
}) {
  const { data } = useStore();
  const customer = (data.customers ?? []).find(
    (c) => c.userId === conversation.customerId,
  );
  if (!customer) {
    return (
      <Modal title="Conversation transcript" onClose={onClose} wide>
        <div style={{ padding: "2rem", textAlign: "center", color: "var(--muted)" }}>
          Loading…
        </div>
      </Modal>
    );
  };
  return (
    <Modal title="Conversation transcript" onClose={onClose} wide>
      <div className="transcript-layout">
        <aside>
          <Badge tone="blue">Demo conversation</Badge>
          <h3>{customer.customerName}</h3>
          <dl className="detail-list">
            <dt>Date</dt>
            <dd>{date(conversation.date)}</dd>
            <dt>Duration</dt>
            <dd>{duration(conversation.conversationDuration)}</dd>
            <dt>Trigger</dt>
            <dd>{conversation.triggerReason}</dd>
            <dt>Intent change</dt>
            <dd>
              {conversation.intentBefore} → {conversation.intentAfter}
            </dd>
            <dt>Outcome</dt>
            <dd>{conversation.conversationOutcome}</dd>
          </dl>
        </aside>
        <div className="messages">
          {conversation.transcript.map((m, i) => (
            <div key={i} className={`message ${m.role.toLowerCase()}`}>
              <div>
                <b>
                  {m.role === "Agent"
                    ? "FIZZI AGENT"
                    : customer.customerName.toUpperCase()}
                </b>
                <time>{m.time}</time>
              </div>
              <p>{m.text}</p>
            </div>
          ))}
        </div>
      </div>
      <Panel
        title="Conversation analysis"
        eyebrow="INFERRED FROM THIS TRANSCRIPT"
      >
        <div className="insight-grid">
          <div>
            <small>Primary interest</small>
            <b>
              {
                data.products.find((p) => p.id === customer.currentProduct)
                  ?.name
              }
            </b>
          </div>
          <div>
            <small>Price consideration</small>
            <b>
              {conversation.id === "conv1"
                ? "Asked for pack pricing"
                : "Not expressed"}
            </b>
          </div>
          <div>
            <small>Purchase readiness</small>
            <b>
              {conversation.id === "conv1"
                ? "Stated intention to add a pack"
                : "Still considering"}
            </b>
          </div>
          <div>
            <small>Suggested next action</small>
            <b>
              {conversation.id === "conv1"
                ? "Check order status before follow-up"
                : "Allow time to decide"}
            </b>
          </div>
        </div>
        <p className="fine-print">
          Model-assisted interpretation of seeded demo dialogue. A stated
          intention is not a confirmed purchase.
        </p>
      </Panel>
    </Modal>
  );
}
export function CustomerProfile({
  id,
  onClose,
  agent = false,
}: {
  id: string;
  onClose: () => void;
  agent?: boolean;
}) {
  const { data, update, toast, addEvent } = useStore();
  const c = (data.customers ?? []).find((x) => x.userId === id);
  const [tab, setTab] = useState(agent ? "Intelligence" : "Overview");
  const [note, setNote] = useState("");
  const [showNote, setShowNote] = useState(false);
  const [conv, setConv] = useState<Conversation | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [assignee, setAssignee] = useState(false);

  // Guard: customer not loaded yet — close the modal
  if (!c) {
    return (
      <Modal title="Customer profile" onClose={onClose} wide>
        <div style={{ padding: "2rem", textAlign: "center", color: "var(--muted)" }}>
          Loading customer data…
        </div>
      </Modal>
    );
  }

  const conversations = (data.conversations ?? []).filter((x) => x.customerId === id);
  const orders = (data.orders ?? []).filter((x) => x.customerId === id);
  const changes = (data.scoreHistory ?? []).filter((x) => x.customerId === id);
  const events = (data.events ?? []).filter((x) => x.customerId === id);
  return (
    <>
      <Modal
        title={agent ? "Customer intelligence profile" : "Customer profile"}
        onClose={onClose}
        wide
      >
        <div className="profile-heading">
          <Avatar name={c.customerName} size="large" />
          <div>
            <h1>{c.customerName}</h1>
            <p>{c.email}</p>
            <div className="inline">
              <Badge>{c.customerType}</Badge>
              <span className="muted">Customer since {date(c.since)}</span>
            </div>
          </div>
          <div className="profile-score">
            <span className="eyebrow">LEAD SCORE</span>
            <strong>
              {c.leadScore}
              <small>/100</small>
            </strong>
            <Badge tone="blue">{c.intent} intent</Badge>
          </div>
        </div>
        <div className="profile-actions">
          <button className="btn primary" onClick={() => setConfirm(true)}>
            <Sparkles size={15} />
            Start AI conversation
          </button>
          <button className="btn" onClick={() => setTab("Orders")}>
            <ShoppingBag size={15} />
            View orders
          </button>
          <button className="btn" onClick={() => setShowNote(!showNote)}>
            <Plus size={15} />
            Add note
          </button>
          <button className="btn" onClick={() => setAssignee(!assignee)}>
            <UserRound size={15} />
            Assign
          </button>
        </div>
        {confirm && (
          <div className="inline-notice">
            <div>
              <b>Queue a demo conversation?</b>
              <p>
                This records an internal simulation request. No customer will be
                contacted.
              </p>
            </div>
            <button
              className="btn primary"
              onClick={() => {
                addEvent({
                  customerId: id,
                  type: "AI conversation",
                  productId: c.currentProduct,
                  impact: 0,
                  description: "has a demo conversation request queued",
                });
                toast("Demo conversation request queued");
                setConfirm(false);
              }}
            >
              Queue request
            </button>
            <button
              className="icon-btn"
              onClick={() => setConfirm(false)}
              aria-label="Cancel request"
            >
              ×
            </button>
          </div>
        )}
        {assignee && (
          <label className="field">
            Assigned salesperson
            <select
              value={c.assignedTo}
              onChange={(e) => {
                update((d) => ({
                  ...d,
                  customers: d.customers.map((x) =>
                    x.userId === id ? { ...x, assignedTo: e.target.value } : x,
                  ),
                }));
                toast("Salesperson updated");
              }}
            >
              {data.salespeople.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        )}
        {showNote && (
          <form
            className="note-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (!note.trim()) return;
              update((d) => ({
                ...d,
                customers: d.customers.map((x) =>
                  x.userId === id
                    ? { ...x, notes: [note.trim(), ...x.notes] }
                    : x,
                ),
              }));
              setNote("");
              setShowNote(false);
              toast("Customer note saved");
            }}
          >
            <label className="field">
              Private customer note
              <textarea
                required
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add context for the team…"
              />
            </label>
            <button className="btn primary">Save note</button>
          </form>
        )}
        <div className="tabs">
          {[
            "Overview",
            "Intelligence",
            "Conversations",
            "Orders",
            "Activity",
          ].map((t) => (
            <button
              key={t}
              className={tab === t ? "active" : ""}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>
        {(tab === "Overview" || tab === "Intelligence") && (
          <>
            <div className="stat-strip">
              {(tab === "Overview"
                ? [
                    ["Total orders", c.totalOrders],
                    ["Lifetime value", money(c.totalSpent)],
                    [
                      "Avg. order value",
                      money(c.totalOrders ? c.totalSpent / c.totalOrders : 0),
                    ],
                    [
                      "Last order",
                      c.totalOrders ? date(c.lastOrder) : "No orders",
                    ],
                  ]
                : [
                    ["Website visits", c.visitCount],
                    ["Time on website", duration(c.totalTimeSpent)],
                    ["Average session", duration(c.averageSessionDuration)],
                    ["Products viewed", c.productViews],
                  ]
              ).map(([l, v]) => (
                <div key={String(l)}>
                  <small>{l}</small>
                  <strong>{v}</strong>
                </div>
              ))}
            </div>
            <div className="journey">
              <span>BEHAVIOR</span>
              <ArrowRight />
              <span>UNDERSTANDING</span>
              <ArrowRight />
              <b>{c.leadScore} SCORE</b>
              <ArrowRight />
              <span>{c.leadStage.toUpperCase()}</span>
            </div>
            <Panel
              title="Behavioral intelligence"
              eyebrow="PATTERNS → CONTEXT"
              className="intelligence-panel"
            >
              <div className="intelligence-copy">
                <Sparkles size={22} />
                <p>
                  {c.customerName.split(" ")[0]} has visited{" "}
                  <b>{c.visitCount} times</b> and repeatedly explored{" "}
                  <b>
                    {data.products.find((p) => p.id === c.currentProduct)?.name}
                  </b>
                  . Pricing was viewed {c.pricingViews} times
                  {c.totalOrders > 0
                    ? " and prior purchases are on record"
                    : ""}
                  . These signals suggest {c.intent.toLowerCase()} purchase
                  interest.
                </p>
              </div>
              <div className="insight-bottom">
                <span>Suggested next step</span>
                <b>{c.nextBestAction}</b>
              </div>
              <p className="fine-print">
                Demo interpretation of recorded behavior; interest does not
                guarantee a purchase.
              </p>
            </Panel>
            <div className="two-col">
              <Panel title="Product interest" eyebrow="MOST VIEWED">
                {c.mostViewedProducts.map((p, i) => (
                  <div className="interest-row" key={p.productId}>
                    <span>0{i + 1}</span>
                    <div>
                      <b>
                        {data.products.find((x) => x.id === p.productId)?.name}
                      </b>
                      <div className="bar-track">
                        <i
                          style={{
                            width: `${(p.views / Math.max(1, ...c.mostViewedProducts.map((p) => p.views))) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                    <small>{p.views} views</small>
                  </div>
                ))}
              </Panel>
              <Panel title="Visit frequency" eyebrow="RECENT SESSIONS">
                <MiniChart
                  data={[
                    { name: "Sep 26", value: 0 },
                    { name: "Sep 27", value: 1 },
                    { name: "Sep 28", value: 1 },
                    { name: "Sep 29", value: 0 },
                    { name: "Sep 30", value: Math.max(1, c.visitCount - 2) },
                  ]}
                />
              </Panel>
            </div>
            <Panel title="Customer behavior">
              <div className="insight-grid">
                {[
                  ["Unique products", c.mostViewedProducts.length],
                  ["Pricing views", c.pricingViews],
                  ["Cart interactions", c.cartInteractions],
                  ["Checkout attempts", c.checkoutAttempts],
                  [
                    "Favorite product",
                    data.products.find((p) => p.id === c.favoriteProducts[0])
                      ?.name,
                  ],
                  ["Visit frequency", `${c.visitCount} recorded visits`],
                ].map(([k, v]) => (
                  <div key={String(k)}>
                    <small>{k}</small>
                    <b>{v}</b>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel
              title="Score audit ledger"
              action={<Badge tone="blue">Current score · {c.leadScore}</Badge>}
            >
              {changes.length ? (
                changes.map((s) => (
                  <div className="ledger-row" key={s.id}>
                    <span className={s.delta >= 0 ? "positive" : "muted"}>
                      {s.delta > 0 ? "+" : ""}
                      {s.delta}
                    </span>
                    <div>
                      <b>{s.reason}</b>
                      <small>
                        {date(s.timestamp)} · {time(s.timestamp)}
                      </small>
                    </div>
                    <Check size={14} />
                  </div>
                ))
              ) : (
                <Empty
                  title="No score changes recorded"
                  text="Future changes will appear with their reason and timestamp."
                />
              )}
            </Panel>
            {c.notes.length > 0 && (
              <Panel title="Team notes">
                {c.notes.map((n, i) => (
                  <div className="note" key={i}>
                    <FileText size={16} />
                    <p>{n}</p>
                  </div>
                ))}
              </Panel>
            )}
          </>
        )}
        {tab === "Conversations" && (
          <Panel
            title="Agent interaction history"
            action={<Badge>{conversations.length} conversations</Badge>}
          >
            {conversations.length ? (
              conversations.map((v) => (
                <button
                  className="conversation-card"
                  key={v.id}
                  onClick={() => setConv(v)}
                >
                  <div className="inline">
                    <span className="round-icon">
                      <MessageSquare size={18} />
                    </span>
                    <div>
                      <b>{v.triggerReason}</b>
                      <small>
                        {date(v.date)} · {duration(v.conversationDuration)}
                      </small>
                    </div>
                    <ArrowRight className="push-right" size={17} />
                  </div>
                  <div className="conversation-meta">
                    <span>
                      Intent{" "}
                      <b>
                        {v.intentBefore} → {v.intentAfter}
                      </b>
                    </span>
                    <span>
                      Action <b>{v.recommendedAction}</b>
                    </span>
                    <Badge tone="sea">{v.conversationOutcome}</Badge>
                  </div>
                </button>
              ))
            ) : (
              <Empty
                title="No conversations yet"
                text="Recorded conversations and their outcomes will appear here."
              />
            )}
          </Panel>
        )}
        {tab === "Orders" && (
          <Panel title="Purchase history">
            {orders.length ? (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Date</th>
                      <th>Products</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id}>
                        <td className="strong">#{o.id}</td>
                        <td>{date(o.date)}</td>
                        <td>
                          {o.items
                            .map(
                              (i) =>
                                data.products.find((p) => p.id === i.productId)
                                  ?.name,
                            )
                            .join(", ")}
                        </td>
                        <td>{money(o.amount)}</td>
                        <td>
                          <Badge tone="sea">{o.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty
                title="No orders yet"
                text="This customer’s purchases will appear here."
              />
            )}
          </Panel>
        )}
        {tab === "Activity" && (
          <Panel title="Activity timeline">
            {events.length ? (
              <div className="timeline">
                {events.map((e) => (
                  <div className="timeline-item" key={e.id}>
                    <time>{time(e.timestamp)}</time>
                    <span className="timeline-dot" />
                    <div>
                      <b>{e.type}</b>
                      <p>{e.description}</p>
                    </div>
                    <Badge>
                      {e.impact > 0 ? "+" : ""}
                      {e.impact} score
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <Empty
                title="No activity recorded"
                text="Customer events will appear in chronological order."
              />
            )}
          </Panel>
        )}
      </Modal>
      {conv && <Transcript conversation={conv} onClose={() => setConv(null)} />}
    </>
  );
}
