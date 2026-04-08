import { PatientForm } from '@/components/patients/PatientForm';

export function PatientNewPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">New Patient</h1>
      <PatientForm />
    </div>
  );
}
