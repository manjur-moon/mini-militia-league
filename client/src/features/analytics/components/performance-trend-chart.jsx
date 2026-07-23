import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function TooltipContent({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-xl dark:border-slate-700 dark:bg-slate-900">
      <p className="font-black">{label}</p>
      <div className="mt-2 grid gap-1">
        {payload.map((item) => (
          <p key={item.dataKey} className="flex justify-between gap-5">
            <span className="text-slate-500">{item.name}</span>
            <strong>
              {Number(item.value ?? 0).toFixed(item.dataKey === "kdr" ? 2 : 0)}
            </strong>
          </p>
        ))}
      </div>
    </div>
  );
}

export default function PerformanceTrendChart({ data }) {
  return (
    <div className="h-80 w-full" aria-label="Player performance trend chart">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 12, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="4 4" opacity={0.25} />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} minTickGap={22} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip content={<TooltipContent />} />
          <Legend />
          <Line
            type="monotone"
            dataKey="kills"
            name="Kills"
            stroke="#22c55e"
            strokeWidth={3}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="deaths"
            name="Deaths"
            stroke="#ef4444"
            strokeWidth={3}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="kdr"
            name="KDR"
            stroke="#f59e0b"
            strokeWidth={3}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="averageRank"
            name="Average rank"
            stroke="#6366f1"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
