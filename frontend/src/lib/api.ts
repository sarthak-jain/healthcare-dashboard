import axios from 'axios';
import type { Patient, PatientListResponse, Note, PatientSummary, PatientFormData } from './types';

const api = axios.create({
  baseURL: '/api',
});

export async function fetchPatients(params: {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: string;
  status?: string;
}): Promise<PatientListResponse> {
  const { data } = await api.get('/patients', { params });
  return data;
}

export async function fetchPatient(id: number): Promise<Patient> {
  const { data } = await api.get(`/patients/${id}`);
  return data;
}

export async function createPatient(patient: PatientFormData): Promise<Patient> {
  const { data } = await api.post('/patients', patient);
  return data;
}

export async function updatePatient(id: number, patient: PatientFormData): Promise<Patient> {
  const { data } = await api.put(`/patients/${id}`, patient);
  return data;
}

export async function deletePatient(id: number): Promise<void> {
  await api.delete(`/patients/${id}`);
}

export async function fetchNotes(patientId: number): Promise<Note[]> {
  const { data } = await api.get(`/patients/${patientId}/notes`);
  return data;
}

export async function createNote(patientId: number, content: string): Promise<Note> {
  const { data } = await api.post(`/patients/${patientId}/notes`, { content });
  return data;
}

export async function deleteNote(patientId: number, noteId: number): Promise<void> {
  await api.delete(`/patients/${patientId}/notes/${noteId}`);
}

export async function fetchPatientSummary(patientId: number): Promise<PatientSummary> {
  const { data } = await api.get(`/patients/${patientId}/summary`);
  return data;
}
