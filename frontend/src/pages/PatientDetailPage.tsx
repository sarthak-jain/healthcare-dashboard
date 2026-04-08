import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { usePatient, useDeletePatient } from '@/hooks/usePatients';
import { StatusBadge } from '@/components/patients/StatusBadge';
import { PatientNotes } from '@/components/patients/PatientNotes';
import { PatientSummaryView } from '@/components/patients/PatientSummary';
import { calculateAge, formatDate } from '@/lib/utils';

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const patientId = Number(id);
  const { data: patient, isLoading, error } = usePatient(patientId);
  const deleteMutation = useDeletePatient();
  const [tab, setTab] = useState<'details' | 'notes' | 'summary'>('details');

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded-md bg-muted" />
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="space-y-4">
        <Link to="/patients" className="flex items-center gap-1 text-sm text-muted-foreground no-underline hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to patients
        </Link>
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          Patient not found.
        </div>
      </div>
    );
  }

  function handleDelete() {
    if (!confirm('Are you sure you want to delete this patient?')) return;
    deleteMutation.mutate(patientId, {
      onSuccess: () => navigate('/patients'),
    });
  }

  const infoRows = [
    ['Date of Birth', `${formatDate(patient.date_of_birth)} (Age ${calculateAge(patient.date_of_birth)})`],
    ['Email', patient.email],
    ['Phone', patient.phone],
    ['Address', patient.address || '—'],
    ['Blood Type', patient.blood_type || '—'],
    ['Allergies', patient.allergies || 'None'],
    ['Conditions', patient.conditions || 'None'],
    ['Registered', formatDate(patient.created_at)],
  ];

  return (
    <div className="space-y-4">
      <Link to="/patients" className="flex items-center gap-1 text-sm text-muted-foreground no-underline hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to patients
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">
            {patient.first_name} {patient.last_name}
          </h1>
          <StatusBadge status={patient.status} />
        </div>
        <div className="flex gap-2">
          <Link
            to={`/patients/${patient.id}/edit`}
            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm no-underline hover:bg-accent"
          >
            <Edit className="h-3.5 w-3.5" /> Edit
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="flex items-center gap-1.5 rounded-md border border-destructive/30 px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {(['details', 'notes', 'summary'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`border-b-2 px-4 py-2 text-sm font-medium capitalize transition-colors ${
              tab === t
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'details' && (
        <div className="rounded-md border border-border">
          <table className="w-full text-sm">
            <tbody>
              {infoRows.map(([label, value]) => (
                <tr key={label} className="border-b border-border last:border-b-0">
                  <td className="w-40 px-4 py-2.5 font-medium text-muted-foreground">{label}</td>
                  <td className="px-4 py-2.5">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'notes' && <PatientNotes patientId={patientId} />}
      {tab === 'summary' && <PatientSummaryView patientId={patientId} />}
    </div>
  );
}
