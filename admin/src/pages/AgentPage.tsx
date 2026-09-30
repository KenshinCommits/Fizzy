import { ArrowUpRight, AudioLines } from "lucide-react";
import { useState } from "react";
import { Transcript } from "../components/CustomerProfile";
import { PageHeader } from "../components/PageHeader";
import { Avatar, Badge, Empty, Metric, Panel } from "../components/ui";
import type { Conversation } from "../data/models";
import { duration, useStore } from "../lib/store";
type CustomerProps = { openCustomer: (id: string) => void };
export function AgentPage({ openCustomer }: CustomerProps) {
  const { data } = useStore();
  const [conv, setConv] = useState<Conversation | null>(null);
  return (
    <>
      <PageHeader
        title="Your agent, in good company."
        description="Review conversations, outcomes, and queued customer assistance."
      >
        <Badge tone="sea">Simulation mode</Badge>
      </PageHeader>
      <div className="agent-command">
        <div className="agent-orb">
          <AudioLines size={32} />
        </div>
        <div>
          <span className="eyebrow">FIZZI ASSISTANT</span>
          <h2>Context before conversation.</h2>
          <p>Product guidance, checkout assistance, and wholesale handoffs.</p>
        </div>
        <div className="agent-command-status">
          <span className="live-dot" />
          <b>
            {data.settings.agentEnabled === "true"
              ? "Ready for demo requests"
              : "Requests disabled"}
          </b>
          <small>External voice service not connected</small>
        </div>
      </div>
      <div className="three-col">
        <Metric
          label="Recorded conversations"
          value={String(data.conversations.length)}
        />
        <Metric
          label="Average duration"
          value={duration(
            Math.round(
              data.conversations.reduce(
                (s, c) => s + c.conversationDuration,
                0,
              ) / Math.max(1, data.conversations.length),
            ),
          )}
        />
        <Metric
          label="Recovery queue"
          value={String(
            data.carts.filter((c) => c.recovery === "Queued").length,
          )}
        />
      </div>
      <Panel title="Conversation history">
        {data.conversations.length ? (
          data.conversations.map((v) => {
            const c = data.customers.find((c) => c.userId === v.customerId)!;
            return (
              <div className="agent-conversation" key={v.id}>
                <button
                  className="person-cell"
                  onClick={() => openCustomer(c.userId)}
                >
                  <Avatar name={c.customerName} />
                  <span>
                    <b>{c.customerName}</b>
                    <small>{v.triggerReason}</small>
                  </span>
                </button>
                <div>
                  <small>Duration</small>
                  <b>{duration(v.conversationDuration)}</b>
                </div>
                <div>
                  <small>Intent</small>
                  <b>
                    {v.intentBefore} → {v.intentAfter}
                  </b>
                </div>
                <Badge tone="sea">{v.conversationOutcome}</Badge>
                <button className="btn" onClick={() => setConv(v)}>
                  Read transcript
                  <ArrowUpRight size={15} />
                </button>
              </div>
            );
          })
        ) : (
          <Empty
            title="No conversations yet"
            text="Recorded agent interactions will appear here."
          />
        )}
      </Panel>
      {conv && <Transcript conversation={conv} onClose={() => setConv(null)} />}
    </>
  );
}
