import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { usePatient } from '@/hooks/usePatients';
import { PatientForm } from '@/components/patients/PatientForm';

export function PatientEditPage() {
  const { id } = useParams<{ id: string }>();
  const { data: patient, isLoading, error } = usePatient(Number(id));

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-md bg-muted" />;
  }

  if (error || !patient) {
    return (
      <div className="space-y-4">
        <Link to="/patients" className="flex items-center gap-1 text-sm text-muted-foreground no-underline hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          Patient not found.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Edit Patient</h1>
      <PatientForm patient={patient} />
    </div>
  );
}
