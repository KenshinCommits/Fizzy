import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { revenueSeries } from "../data/seed";
import { money } from "../lib/store";
import { useReducedMotion } from "../lib/useReducedMotion";
const tooltip = {
  background: "#FFFDF9",
  border: "1px solid #EADBC8",
  borderRadius: 8,
  fontSize: 12,
  color: "#0C2D48",
};
export function RevenueChart({
  days = 30,
  orders = false,
}: {
  days?: number;
  orders?: boolean;
}) {
  const reducedMotion = useReducedMotion();
  return (
    <div
      className="chart-wrap"
      role="img"
      aria-label={
        orders
          ? "Daily orders trend for September"
          : "Revenue trend for September, compared with the previous period"
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={revenueSeries.slice(-days)}
          margin={{ top: 12, right: 14, left: -8, bottom: 0 }}
        >
          <defs>
            <linearGradient
              id={orders ? "orderFill" : "revenueFill"}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor="#41C9E2" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#41C9E2" stopOpacity={0.015} />
            </linearGradient>
          </defs>
          <CartesianGrid
            vertical={false}
            stroke="#EADBC8"
            strokeDasharray="3 5"
          />
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            minTickGap={65}
            tick={{ fill: "#4B6E82", fontSize: 11 }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#4B6E82", fontSize: 11 }}
            tickFormatter={(v) => (orders ? String(v) : `₹${v / 1000}k`)}
          />
          <Tooltip
            contentStyle={tooltip}
            formatter={(v) => (orders ? `${v} orders` : money(Number(v)))}
          />
          {!orders && (
            <Area
              isAnimationActive={!reducedMotion}
              type="monotone"
              dataKey="previous"
              name="Previous period"
              stroke="#B4C7CD"
              fill="none"
              strokeDasharray="4 5"
              strokeWidth={1.5}
            />
          )}
          <Area
            isAnimationActive={!reducedMotion}
            type="monotone"
            dataKey={orders ? "orders" : "revenue"}
            name={orders ? "Orders" : "Revenue"}
            stroke="#008DDA"
            strokeWidth={2.5}
            fill={`url(#${orders ? "orderFill" : "revenueFill"})`}
            animationDuration={650}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
export function MiniChart({
  data,
  dataKey = "value",
  horizontal = false,
}: {
  data: { name: string; [k: string]: string | number }[];
  dataKey?: string;
  horizontal?: boolean;
}) {
  const reducedMotion = useReducedMotion();
  return (
    <div
      className="mini-chart"
      role="img"
      aria-label={`Chart: ${data.map((d) => `${d.name}: ${d[dataKey]}`).join(", ")}`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout={horizontal ? "vertical" : "horizontal"}
          margin={{ left: horizontal ? 22 : -18, right: 18, bottom: 5 }}
        >
          <CartesianGrid
            vertical={false}
            stroke="#EADBC8"
            strokeDasharray="3 5"
          />
          <XAxis
            type={horizontal ? "number" : "category"}
            dataKey={horizontal ? undefined : "name"}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: "#4B6E82" }}
          />
          <YAxis
            type={horizontal ? "category" : "number"}
            dataKey={horizontal ? "name" : undefined}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: "#4B6E82" }}
          />
          <Tooltip contentStyle={tooltip} cursor={{ fill: "#ACE2E133" }} />
          <Bar
            isAnimationActive={!reducedMotion}
            dataKey={dataKey}
            fill="#008DDA"
            radius={horizontal ? [0, 3, 3, 0] : [3, 3, 0, 0]}
            maxBarSize={25}
            animationDuration={550}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
export function Sparkline() {
  const reducedMotion = useReducedMotion();
  return (
    <svg className="sparkline" viewBox="0 0 120 35" aria-hidden="true">
      <path
        d="M0 29L10 27L20 29L30 21L40 24L50 16L60 19L70 11L80 14L90 6L100 9L110 2L120 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}
