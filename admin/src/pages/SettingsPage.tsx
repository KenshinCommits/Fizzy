import { ArrowRight, Save, ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { Avatar, Badge, Panel } from "../components/ui";
import { stages } from "../data/seed";
import { useStore } from "../lib/store";
export function SettingsPage() {
  const { data, update, toast } = useStore();
  const [tab, setTab] = useState("General");
  const [draft, setDraft] = useState({ ...data.settings });
  const [rules, setRules] = useState(data.rules.map((r) => ({ ...r })));
  const field = (label: string, key: string, type = "text") => (
    <label className="field">
      {label}
      <input
        type={type}
        required
        value={draft[key] || ""}
        onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
      />
    </label>
  );
  const toggle = (label: string, key: string, description: string) => (
    <label className="setting-toggle">
      <span>
        <b>{label}</b>
        <small>{description}</small>
      </span>
      <input
        type="checkbox"
        checked={draft[key] === "true"}
        onChange={(e) =>
          setDraft({ ...draft, [key]: String(e.target.checked) })
        }
      />
    </label>
  );
  return (
    <>
      <PageHeader
        title="Make the workspace yours."
        description="Thoughtful controls for your store, people, and intelligence workflows."
      />
      <div className="settings-layout">
        <nav className="settings-nav" aria-label="Settings sections">
          {[
            "General",
            "Store",
            "Products",
            "CRM",
            "Lead Scoring",
            "Pipeline",
            "AI Agent",
            "Notifications",
            "Team",
            "Security",
          ].map((t) => (
            <button
              className={tab === t ? "active" : ""}
              key={t}
              onClick={() => setTab(t)}
            >
              {t}
              <ArrowRight size={14} />
            </button>
          ))}
        </nav>
        <Panel title={tab} eyebrow="WORKSPACE SETTINGS">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              update((d) => ({ ...d, settings: draft, rules }));
              toast("Workspace settings saved");
            }}
          >
            <div className="settings-content">
              {tab === "General" && (
                <>
                  <div className="settings-profile">
                    <Avatar name="Alex Morgan" size="large" />
                    <div>
                      <h3>Alex Morgan</h3>
                      <p>Workspace admin · alex@fizzi.in</p>
                    </div>
                  </div>
                  {field("Workspace name", "storeName")}
                  {field("Contact email", "email", "email")}
                  <label className="field">
                    Timezone
                    <select
                      value={draft.timezone}
                      onChange={(e) =>
                        setDraft({ ...draft, timezone: e.target.value })
                      }
                    >
                      <option value="Asia/Kolkata">
                        India Standard Time (UTC +05:30)
                      </option>
                    </select>
                  </label>
                </>
              )}
              {tab === "Store" && (
                <>
                  {field("Store name", "storeName")}
                  {field("Customer support email", "email", "email")}
                  <label className="field">
                    Currency
                    <select
                      value={draft.currency}
                      onChange={(e) =>
                        setDraft({ ...draft, currency: e.target.value })
                      }
                    >
                      <option value="INR">Indian rupee · INR</option>
                    </select>
                  </label>
                  <p className="fine-print">
                    These are admin workspace preferences. The customer
                    storefront is managed separately.
                  </p>
                </>
              )}
              {tab === "Products" && (
                <>
                  {field(
                    "Low-stock alert threshold (packs)",
                    "lowStock",
                    "number",
                  )}
                  <p className="body-copy">
                    Products below this inventory threshold should be reviewed
                    for replenishment. Product images and pack sizes are managed
                    in the product catalog.
                  </p>
                </>
              )}
              {tab === "CRM" && (
                <>
                  {toggle(
                    "Automatic assignment preference",
                    "autoAssign",
                    "Store the preferred assignment mode for your backend integration.",
                  )}
                  <div className="inline-notice">
                    <p>
                      Current leads use explicit ownership. Changes to
                      automation preferences require the backend assignment
                      service.
                    </p>
                  </div>
                </>
              )}
              {tab === "Lead Scoring" && (
                <>
                  <p className="body-copy">
                    Weights apply to future simulated events. Scores are capped
                    at 100 and cannot drop below zero. Existing audit history is
                    preserved.
                  </p>
                  {rules.map((r, i) => (
                    <label className="scoring-rule" key={r.event}>
                      <span>
                        <b>{r.event}</b>
                        <small>{r.explanation}</small>
                      </span>
                      <input
                        type="number"
                        min="-100"
                        max="100"
                        required
                        aria-label={`${r.event} weight`}
                        value={r.weight}
                        onChange={(e) =>
                          setRules(
                            rules.map((x, j) =>
                              j === i
                                ? { ...x, weight: Number(e.target.value) }
                                : x,
                            ),
                          )
                        }
                      />
                    </label>
                  ))}
                </>
              )}
              {tab === "Pipeline" && (
                <>
                  <p className="body-copy">
                    Nine shared stages keep customer and opportunity records
                    aligned.
                  </p>
                  <div className="stage-settings">
                    {stages.map((s, i) => (
                      <div key={s}>
                        <span>{String(i + 1).padStart(2, "0")}</span>
                        <b>{s}</b>
                        <Badge>
                          {data.leads.filter((l) => l.stage === s).length}{" "}
                          opportunities
                        </Badge>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {tab === "AI Agent" && (
                <>
                  {field("Agent display name", "agentName")}
                  {toggle(
                    "Allow agent requests",
                    "agentEnabled",
                    "Preference for the future voice-agent integration.",
                  )}
                  <div className="inline-notice">
                    <Sparkles size={20} />
                    <p>
                      The demo records internal requests only. Connect a
                      consent-aware voice service to contact customers.
                    </p>
                  </div>
                </>
              )}
              {tab === "Notifications" && (
                <>
                  {toggle(
                    "Email notifications",
                    "emailAlerts",
                    "Preference for pipeline and recovery updates.",
                  )}
                  {toggle(
                    "Desktop notifications",
                    "desktopAlerts",
                    "Preference for important customer activity.",
                  )}
                  <p className="fine-print">
                    Delivery channels require backend configuration. In-app
                    activity remains available.
                  </p>
                </>
              )}
              {tab === "Team" && (
                <>
                  {data.salespeople.map((s) => (
                    <div className="list-person" key={s.id}>
                      <Avatar name={s.name} />
                      <span>
                        <b>{s.name}</b>
                        <small>{s.email}</small>
                      </span>
                      <Badge>{s.role}</Badge>
                    </div>
                  ))}
                  <p className="fine-print">
                    Manage lead assignments and workload from Team.
                  </p>
                </>
              )}
              {tab === "Security" && (
                <>
                  <div className="inline-notice">
                    <ShieldCheck size={22} />
                    <p>
                      This is a local demo workspace. Authentication, roles, and
                      security enforcement must be implemented on your server
                      before deployment.
                    </p>
                  </div>
                  {toggle(
                    "Require multi-factor authentication",
                    "requireMfa",
                    "Saved policy preference; not enforced in this demo.",
                  )}
                  {field(
                    "Session timeout preference (minutes)",
                    "sessionTimeout",
                    "number",
                  )}
                </>
              )}
            </div>
            <div className="form-footer">
              <span className="fine-print">Saved locally in this browser</span>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setDraft({ ...data.settings });
                  setRules(data.rules.map((r) => ({ ...r })));
                  toast("Unsaved changes discarded");
                }}
              >
                Discard
              </button>
              <button className="btn primary">
                <Save size={15} />
                Save changes
              </button>
            </div>
          </form>
        </Panel>
      </div>
    </>
  );
}
