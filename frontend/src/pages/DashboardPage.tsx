import { Link } from 'react-router-dom';
import { Users, UserPlus, Activity, AlertTriangle } from 'lucide-react';
import { usePatients } from '@/hooks/usePatients';
import { StatusChart } from '@/components/patients/StatusChart';

export function DashboardPage() {
  const { data: all } = usePatients({ page: 1, page_size: 1 });
  const { data: critical } = usePatients({ page: 1, page_size: 1, status: 'critical' });
  const { data: active } = usePatients({ page: 1, page_size: 1, status: 'active' });

  const stats = [
    { label: 'Total Patients', value: all?.total ?? '—', icon: Users, color: 'text-primary' },
    { label: 'Active', value: active?.total ?? '—', icon: Activity, color: 'text-status-active' },
    { label: 'Critical', value: critical?.total ?? '—', icon: AlertTriangle, color: 'text-status-critical' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link
          to="/patients/new"
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground no-underline hover:bg-primary/90"
        >
          <UserPlus className="h-4 w-4" />
          Add Patient
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{label}</p>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <p className="mt-2 text-3xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      <StatusChart />

      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="mb-3 text-lg font-semibold">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/patients"
            className="rounded-md border border-border px-4 py-2 text-sm no-underline hover:bg-accent"
          >
            View All Patients
          </Link>
          <Link
            to="/patients/new"
            className="rounded-md border border-border px-4 py-2 text-sm no-underline hover:bg-accent"
          >
            Register New Patient
          </Link>
        </div>
      </div>
    </div>
  );
}
