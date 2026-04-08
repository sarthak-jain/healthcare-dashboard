import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchNotes, createNote, deleteNote, fetchPatientSummary } from '@/lib/api';

export function useNotes(patientId: number) {
  return useQuery({
    queryKey: ['notes', patientId],
    queryFn: () => fetchNotes(patientId),
  });
}

export function useCreateNote(patientId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => createNote(patientId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', patientId] });
      queryClient.invalidateQueries({ queryKey: ['summary', patientId] });
    },
  });
}

export function useDeleteNote(patientId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (noteId: number) => deleteNote(patientId, noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', patientId] });
      queryClient.invalidateQueries({ queryKey: ['summary', patientId] });
    },
  });
}

export function usePatientSummary(patientId: number) {
  return useQuery({
    queryKey: ['summary', patientId],
    queryFn: () => fetchPatientSummary(patientId),
  });
}
