import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { usePatients } from '@/hooks/usePatients';

const COLORS: Record<string, string> = {
  Active: '#16a34a',
  Inactive: '#9ca3af',
  Critical: '#dc2626',
};

export function StatusChart() {
  const { data: all } = usePatients({ page: 1, page_size: 1 });
  const { data: active } = usePatients({ page: 1, page_size: 1, status: 'active' });
  const { data: inactive } = usePatients({ page: 1, page_size: 1, status: 'inactive' });
  const { data: critical } = usePatients({ page: 1, page_size: 1, status: 'critical' });

  const chartData = useMemo(() => {
    if (!all) return [];
    return [
      { name: 'Active', value: active?.total ?? 0 },
      { name: 'Inactive', value: inactive?.total ?? 0 },
      { name: 'Critical', value: critical?.total ?? 0 },
    ].filter((d) => d.value > 0);
  }, [all, active, inactive, critical]);

  if (chartData.length === 0) return null;

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h2 className="mb-3 text-lg font-semibold">Patient Status Distribution</h2>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={4}
            dataKey="value"
            label={({ name, value }) => `${name}: ${value}`}
          >
            {chartData.map((entry) => (
              <Cell key={entry.name} fill={COLORS[entry.name]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
