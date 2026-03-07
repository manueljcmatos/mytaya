import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface DataPoint {
  date: string;
  cumProfit: number;
  pickCount: number;
}

interface Props {
  data: DataPoint[];
  emptyMessage?: string;
}

export default function ProfitChart({ data, emptyMessage = 'No data yet' }: Props) {
  if (!data || data.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 300,
          color: 'var(--t-text-sec, #9ca3af)',
          flexDirection: 'column',
          gap: '0.5rem',
        }}
      >
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--t-border, #374151)" />
        <XAxis
          dataKey="date"
          tick={{ fill: 'var(--t-text-sec, #9ca3af)', fontSize: 12 }}
          tickFormatter={(d: string) =>
            new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
          }
        />
        <YAxis
          tick={{ fill: 'var(--t-text-sec, #9ca3af)', fontSize: 12 }}
          tickFormatter={(v: number) => `${v > 0 ? '+' : ''}${v}u`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--t-bg-card, #1f2937)',
            border: '1px solid var(--t-border, #374151)',
            borderRadius: '8px',
            color: 'var(--t-text, #f9fafb)',
          }}
          formatter={(value: number) => [`${value > 0 ? '+' : ''}${value} units`, 'Profit']}
          labelFormatter={(label: string) =>
            new Date(label).toLocaleDateString('en-PH', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })
          }
        />
        <Line
          type="monotone"
          dataKey="cumProfit"
          stroke="var(--brand-primary, #0F766E)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 5, fill: 'var(--brand-primary, #0F766E)' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
