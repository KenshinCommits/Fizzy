import { Download } from "lucide-react";
import { useState } from "react";
import { MiniChart, RevenueChart } from "../components/Charts";
import { PageHeader } from "../components/PageHeader";
import { Metric, Panel } from "../components/ui";
import { revenueSeries } from "../data/seed";
import { exportCsv, shortMoney, useStore } from "../lib/store";
export function Analytics() {
  const { data } = useStore();
  const [days, setDays] = useState(30);
  return (
    <>
      <PageHeader
        title="A clearer picture of growth."
        description="Commerce performance, customer engagement, and the impact of intelligence."
      >
        <select
          aria-label="Analytics period"
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
        >
          <option value={30}>Last 30 days</option>
          <option value={7}>Last 7 days</option>
        </select>
        <button
          className="btn"
          onClick={() => exportCsv("analytics", revenueSeries.slice(-days))}
        >
          <Download size={15} />
          Export
        </button>
      </PageHeader>
      <div className="kpi-grid analytics-kpis">
        {[
          [
            "Revenue",
            shortMoney(
              revenueSeries.slice(-days).reduce((s, r) => s + r.revenue, 0),
            ),
          ],
          [
            "Orders",
            String(
              revenueSeries.slice(-days).reduce((s, r) => s + r.orders, 0),
            ),
          ],
          ["Conversion", "4.83%"],
          ["Avg. order value", "₹1,842"],
          ["Retention", "38.6%"],
        ].map(([l, v], i) => (
          <Metric
            key={l}
            label={l}
            value={v}
            featured={i === 0}
            change="September demo aggregate"
          />
        ))}
      </div>
      <div className="two-col">
        <Panel title="Revenue over time">
          <RevenueChart days={days} />
        </Panel>
        <Panel title="Orders over time">
          <RevenueChart days={days} orders />
        </Panel>
        <Panel title="Lead source quality">
          <MiniChart
            data={["Organic", "Direct", "Instagram", "Referral"].map(
              (name, i) => ({ name, value: [78, 71, 58, 82][i] }),
            )}
          />
          <p className="chart-key">Average score · monthly demo cohort</p>
        </Panel>
        <Panel title="Product popularity">
          <MiniChart
            data={data.products
              .slice(0, 5)
              .map((p) => ({ name: p.name.split(" ")[0], value: p.views }))}
          />
        </Panel>
        <Panel title="Lead score distribution">
          <MiniChart
            data={["Low", "Medium", "High", "Very high"].map((name) => ({
              name,
              value: data.customers.filter((c) => c.intent === name).length,
            }))}
          />
        </Panel>
        <Panel title="Conversion funnel">
          <div className="funnel">
            {[
              ["Sessions", 1284],
              ["Product views", 842],
              ["Cart additions", 264],
              ["Checkout", 126],
              ["Purchase", 62],
            ].map(([l, v], i) => (
              <div key={l}>
                <span>{l}</span>
                <div
                  style={{
                    width: `${Math.max(20, (Number(v) / 1284) * 70)}%`,
                    opacity: 1 - i * 0.1,
                  }}
                />
                <b>{v}</b>
              </div>
            ))}
          </div>
          <p className="chart-key">
            Monthly demo cohort · session-to-purchase rate 4.83%
          </p>
        </Panel>
        <Panel title="Customer engagement">
          <MiniChart
            data={data.customers.slice(0, 6).map((c) => ({
              name: c.customerName.split(" ")[0],
              value: c.visitCount,
            }))}
          />
          <p className="chart-key">Visits per tracked customer</p>
        </Panel>
        <Panel title="AI agent conversion impact">
          <div className="impact-comparison">
            <div>
              <small>Agent-assisted cohort</small>
              <strong>
                6.2<em>%</em>
              </strong>
              <span>28 / 452 sessions</span>
            </div>
            <div>
              <small>Unassisted cohort</small>
              <strong>
                4.1<em>%</em>
              </strong>
              <span>34 / 832 sessions</span>
            </div>
          </div>
          <p className="fine-print padded">
            Illustrative September cohorts. Association does not establish
            causal uplift. No verified attribution is available for the
            individual demo conversations.
          </p>
        </Panel>
      </div>
    </>
  );
}
