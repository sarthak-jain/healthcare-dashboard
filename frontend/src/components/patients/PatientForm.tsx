import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useCreatePatient, useUpdatePatient } from '@/hooks/usePatients';
import type { Patient } from '@/lib/types';
import { isAxiosError } from 'axios';

const schema = z.object({
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone is required').max(20),
  address: z.string().max(500),
  blood_type: z.string().max(5),
  status: z.enum(['active', 'inactive', 'critical']),
  allergies: z.string(),
  conditions: z.string(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  patient?: Patient;
}

export function PatientForm({ patient }: Props) {
  const navigate = useNavigate();
  const createMutation = useCreatePatient();
  const updateMutation = useUpdatePatient(patient?.id ?? 0);
  const isEdit = !!patient;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: patient
      ? {
          first_name: patient.first_name,
          last_name: patient.last_name,
          date_of_birth: patient.date_of_birth,
          email: patient.email,
          phone: patient.phone,
          address: patient.address,
          blood_type: patient.blood_type,
          status: patient.status,
          allergies: patient.allergies,
          conditions: patient.conditions,
        }
      : {
          status: 'active',
          address: '',
          blood_type: '',
          allergies: '',
          conditions: '',
        },
  });

  async function onSubmit(data: FormValues) {
    try {
      if (isEdit) {
        await updateMutation.mutateAsync(data);
        navigate(`/patients/${patient!.id}`);
      } else {
        const created = await createMutation.mutateAsync(data);
        navigate(`/patients/${created.id}`);
      }
    } catch (err) {
      if (isAxiosError(err) && err.response) {
        const detail = err.response.data?.detail;
        if (typeof detail === 'string') {
          setError('root', { message: detail });
        } else if (Array.isArray(detail)) {
          for (const e of detail) {
            const field = e.loc?.[e.loc.length - 1];
            if (field && field in schema.shape) {
              setError(field as keyof FormValues, { message: e.msg });
            }
          }
        }
      } else {
        setError('root', { message: 'An unexpected error occurred. Please try again.' });
      }
    }
  }

  const fieldClass =
    'w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary';
  const labelClass = 'block text-sm font-medium text-foreground mb-1';
  const errorClass = 'text-xs text-destructive mt-1';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
      {errors.root && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {errors.root.message}
        </div>
      )}

      {/* Personal Information */}
      <fieldset className="space-y-4">
        <legend className="text-base font-semibold">Personal Information</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>First Name *</label>
            <input {...register('first_name')} className={fieldClass} />
            {errors.first_name && <p className={errorClass}>{errors.first_name.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Last Name *</label>
            <input {...register('last_name')} className={fieldClass} />
            {errors.last_name && <p className={errorClass}>{errors.last_name.message}</p>}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Date of Birth *</label>
            <input type="date" {...register('date_of_birth')} className={fieldClass} />
            {errors.date_of_birth && <p className={errorClass}>{errors.date_of_birth.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Email *</label>
            <input type="email" {...register('email')} className={fieldClass} />
            {errors.email && <p className={errorClass}>{errors.email.message}</p>}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Phone *</label>
            <input {...register('phone')} className={fieldClass} />
            {errors.phone && <p className={errorClass}>{errors.phone.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Address</label>
            <input {...register('address')} className={fieldClass} />
          </div>
        </div>
      </fieldset>

      {/* Medical Information */}
      <fieldset className="space-y-4">
        <legend className="text-base font-semibold">Medical Information</legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className={labelClass}>Blood Type</label>
            <select {...register('blood_type')} className={fieldClass}>
              <option value="">Unknown</option>
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bt) => (
                <option key={bt} value={bt}>{bt}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <select {...register('status')} className={fieldClass}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>
        <div>
          <label className={labelClass}>Allergies</label>
          <input
            {...register('allergies')}
            placeholder="e.g. Penicillin, Sulfa drugs"
            className={fieldClass}
          />
        </div>
        <div>
          <label className={labelClass}>Conditions</label>
          <input
            {...register('conditions')}
            placeholder="e.g. Hypertension, Diabetes"
            className={fieldClass}
          />
        </div>
      </fieldset>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : isEdit ? 'Update Patient' : 'Create Patient'}
        </button>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-md border border-border px-6 py-2 text-sm font-medium hover:bg-accent"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
