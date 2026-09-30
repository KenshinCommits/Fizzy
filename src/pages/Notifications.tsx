import { ArrowUpRight, Bell, CheckCheck } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { Empty, Panel } from "../components/ui";
import { time, useStore } from "../lib/store";
type CustomerProps = { openCustomer: (id: string) => void };
export function Notifications({ openCustomer }: CustomerProps) {
  const { data, update, toast } = useStore();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const rows = data.events.filter(
    (e) => !unreadOnly || !data.readNotifications.includes(e.id),
  );
  return (
    <>
      <PageHeader
        title="Stay in the know."
        description="Important activity, ready when you are."
      >
        <button
          className="btn"
          onClick={() => {
            update((d) => ({
              ...d,
              readNotifications: d.events.map((e) => e.id),
            }));
            toast("All notifications marked as read");
          }}
        >
          <CheckCheck size={16} />
          Mark all as read
        </button>
      </PageHeader>
      <Panel>
        <div className="tabs table-tabs">
          {["All activity", "Unread"].map((t, i) => (
            <button
              key={t}
              className={unreadOnly === Boolean(i) ? "active" : ""}
              onClick={() => setUnreadOnly(Boolean(i))}
            >
              {t}
            </button>
          ))}
        </div>
        {rows.length ? (
          rows.map((e) => {
            const c = data.customers.find((c) => c.userId === e.customerId)!;
            return (
              <button
                className={`notification-row ${data.readNotifications.includes(e.id) ? "read" : ""}`}
                key={e.id}
                onClick={() => {
                  update((d) => ({
                    ...d,
                    readNotifications: [
                      ...new Set([...d.readNotifications, e.id]),
                    ],
                  }));
                  openCustomer(c.userId);
                }}
              >
                <span className="event-icon">
                  <Bell size={17} />
                </span>
                <span>
                  <b>{c.company || c.customerName}</b>
                  <p>{e.description}</p>
                  <small>
                    {time(e.timestamp)} · {e.type}
                  </small>
                </span>
                {!data.readNotifications.includes(e.id) && (
                  <span className="nav-dot" />
                )}
                <ArrowUpRight size={16} />
              </button>
            );
          })
        ) : (
          <Empty
            title="You’re all caught up"
            text="New customer signals and operational updates will appear here."
          />
        )}
      </Panel>
    </>
  );
}
