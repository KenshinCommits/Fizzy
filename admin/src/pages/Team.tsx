import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { Avatar, Modal, Panel, Score } from "../components/ui";
import { shortMoney, useStore } from "../lib/store";
type CustomerProps = { openCustomer: (id: string) => void };
export function Team({ openCustomer }: CustomerProps) {
  const { data, update, toast } = useStore();
  const [selected, setSelected] = useState<string | null>(null);
  const person = data.salespeople.find((s) => s.id === selected);
  return (
    <>
      <PageHeader
        title="A team, in rhythm."
        description="Balanced workloads, clear ownership, and room for better customer conversations."
      />
      <div className="team-grid">
        {data.salespeople.map((s) => {
          const cs = data.customers.filter((c) => c.assignedTo === s.id);
          const ls = data.leads.filter(
            (l) =>
              cs.some((c) => c.userId === l.customerId) &&
              !l.stage.startsWith("Closed"),
          );
          return (
            <Panel key={s.id}>
              <div className="team-head">
                <Avatar name={s.name} size="large" />
                <h2>{s.name}</h2>
                <p>{s.role}</p>
              </div>
              <div className="team-stats">
                <div>
                  <small>Active leads</small>
                  <b>{cs.length}</b>
                </div>
                <div>
                  <small>Open opportunities</small>
                  <b>{ls.length}</b>
                </div>
                <div>
                  <small>Pipeline value</small>
                  <b>{shortMoney(ls.reduce((a, l) => a + l.value, 0))}</b>
                </div>
                <div>
                  <small>Response time</small>
                  <b>{s.responseTime}</b>
                </div>
                <div>
                  <small>Win rate</small>
                  <b>{s.winRate}%</b>
                </div>
                <div>
                  <small>Capacity</small>
                  <b>
                    {cs.length} / {s.capacity}
                  </b>
                </div>
              </div>
              <div className="team-workload">
                <span>
                  Current workload
                  <b>{Math.round((cs.length / s.capacity) * 100)}%</b>
                </span>
                <div className="bar-track">
                  <i
                    style={{
                      width: `${Math.min(100, (cs.length / s.capacity) * 100)}%`,
                    }}
                  />
                </div>
              </div>
              <button
                className="panel-bottom-link"
                onClick={() => setSelected(s.id)}
              >
                View workload & assign
                <ArrowRight size={15} />
              </button>
            </Panel>
          );
        })}
      </div>
      <Panel title="Lead ownership">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Stage</th>
                <th>Assigned salesperson</th>
                <th>Recorded conversations</th>
              </tr>
            </thead>
            <tbody>
              {data.customers.map((c) => (
                <tr key={c.userId}>
                  <td>
                    <button
                      className="person-cell"
                      onClick={() => openCustomer(c.userId)}
                    >
                      <Avatar name={c.customerName} size="small" />
                      <b>{c.company || c.customerName}</b>
                    </button>
                  </td>
                  <td>{c.leadStage}</td>
                  <td>
                    <select
                      aria-label={`Assign ${c.customerName}`}
                      value={c.assignedTo}
                      onChange={(e) => {
                        update((d) => ({
                          ...d,
                          customers: d.customers.map((x) =>
                            x.userId === c.userId
                              ? { ...x, assignedTo: e.target.value }
                              : x,
                          ),
                        }));
                        toast("Lead ownership updated");
                      }}
                    >
                      {data.salespeople.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    {
                      data.conversations.filter(
                        (x) => x.customerId === c.userId,
                      ).length
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      {person && (
        <Modal
          title={`${person.name} · workload`}
          onClose={() => setSelected(null)}
        >
          <p className="body-copy">
            {person.role} · {person.email}
          </p>
          {data.customers
            .filter((c) => c.assignedTo === person.id)
            .map((c) => (
              <button
                className="list-person"
                key={c.userId}
                onClick={() => {
                  setSelected(null);
                  openCustomer(c.userId);
                }}
              >
                <Avatar name={c.customerName} />
                <span>
                  <b>{c.company || c.customerName}</b>
                  <small>{c.leadStage}</small>
                </span>
                <Score value={c.leadScore} />
              </button>
            ))}
          <p className="fine-print">
            Use the Lead ownership table to reassign customers between
            teammates.
          </p>
        </Modal>
      )}
    </>
  );
}
