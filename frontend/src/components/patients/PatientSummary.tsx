import { usePatientSummary } from '@/hooks/useNotes';

export function PatientSummaryView({ patientId }: { patientId: number }) {
  const { data, isLoading, error } = usePatientSummary(patientId);

  if (isLoading) {
    return <div className="h-32 animate-pulse rounded-md bg-muted" />;
  }

  if (error) {
    return (
      <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
        Failed to load summary.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold">Patient Summary</h3>
      <div className="rounded-md border border-border bg-muted/30 p-4">
        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{data?.summary}</pre>
      </div>
    </div>
  );
}
