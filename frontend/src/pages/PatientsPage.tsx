import { Link } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { PatientList } from '@/components/patients/PatientList';

export function PatientsPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Patients</h1>
        <Link
          to="/patients/new"
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground no-underline hover:bg-primary/90"
        >
          <UserPlus className="h-4 w-4" />
          Add Patient
        </Link>
      </div>
      <PatientList />
    </div>
  );
}
