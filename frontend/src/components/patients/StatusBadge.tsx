import type { PatientStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

const variants: Record<PatientStatus, string> = {
  active: 'bg-status-active/10 text-status-active',
  inactive: 'bg-status-inactive/10 text-status-inactive',
  critical: 'bg-status-critical/10 text-status-critical',
};

export function StatusBadge({ status }: { status: PatientStatus }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize', variants[status])}>
      {status}
    </span>
  );
}
