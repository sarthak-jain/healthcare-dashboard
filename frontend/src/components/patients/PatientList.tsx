import { useState, useRef, useMemo, useCallback, memo } from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { usePatients } from '@/hooks/usePatients';
import { StatusBadge } from './StatusBadge';
import { calculateAge, formatDate } from '@/lib/utils';
import type { Patient } from '@/lib/types';

const ROW_HEIGHT = 48;

const PatientRow = memo(function PatientRow({ patient }: { patient: Patient }) {
  return (
    <tr className="border-b border-border transition-colors hover:bg-muted/50">
      <td className="px-4 py-3">
        <Link
          to={`/patients/${patient.id}`}
          className="font-medium text-foreground no-underline hover:text-primary"
        >
          {patient.last_name}, {patient.first_name}
        </Link>
      </td>
      <td className="px-4 py-3 text-muted-foreground">
        {calculateAge(patient.date_of_birth)}
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={patient.status} />
      </td>
      <td className="px-4 py-3 text-muted-foreground">{patient.email}</td>
      <td className="px-4 py-3 text-muted-foreground">
        {patient.last_visit ? formatDate(patient.last_visit) : '—'}
      </td>
    </tr>
  );
});

export function PatientList() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('last_name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [statusFilter, setStatusFilter] = useState('');
  const pageSize = 10;
  const parentRef = useRef<HTMLDivElement>(null);

  const debounceTimer = useMemo(() => {
    let timer: ReturnType<typeof setTimeout>;
    return (value: string) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        setDebouncedSearch(value);
        setPage(1);
      }, 300);
    };
  }, []);

  const { data, isLoading, error } = usePatients({
    page,
    page_size: pageSize,
    search: debouncedSearch,
    sort_by: sortBy,
    sort_order: sortOrder,
    status: statusFilter || undefined,
  });

  const items = useMemo(() => data?.items ?? [], [data?.items]);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 5,
  });

  const handleSort = useCallback((field: string) => {
    setSortBy((prev) => {
      if (prev === field) {
        setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
        return prev;
      }
      setSortOrder('asc');
      return field;
    });
    setPage(1);
  }, []);

  const SortIcon = useCallback(
    ({ field }: { field: string }) => {
      if (sortBy !== field) return null;
      return sortOrder === 'asc' ? (
        <ChevronUp className="inline h-3 w-3" />
      ) : (
        <ChevronDown className="inline h-3 w-3" />
      );
    },
    [sortBy, sortOrder],
  );

  if (error) {
    return (
      <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-destructive">
        Failed to load patients. Please try again.
      </div>
    );
  }

  const useVirtual = items.length > 50;

  return (
    <div className="space-y-4">
      {/* Search and filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search patients..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              debounceTimer(e.target.value);
            }}
            className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="h-9 rounded-md border border-border bg-background px-3 text-sm"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      {/* Table */}
      <div
        ref={parentRef}
        className="overflow-x-auto rounded-md border border-border"
        style={useVirtual ? { maxHeight: '600px', overflow: 'auto' } : undefined}
      >
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 border-b border-border bg-muted/50">
            <tr>
              <th
                className="cursor-pointer px-4 py-3 text-left font-medium text-muted-foreground"
                onClick={() => handleSort('last_name')}
              >
                Name <SortIcon field="last_name" />
              </th>
              <th
                className="cursor-pointer px-4 py-3 text-left font-medium text-muted-foreground"
                onClick={() => handleSort('date_of_birth')}
              >
                Age <SortIcon field="date_of_birth" />
              </th>
              <th
                className="cursor-pointer px-4 py-3 text-left font-medium text-muted-foreground"
                onClick={() => handleSort('status')}
              >
                Status <SortIcon field="status" />
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Contact</th>
              <th
                className="cursor-pointer px-4 py-3 text-left font-medium text-muted-foreground"
                onClick={() => handleSort('last_visit')}
              >
                Last Visit <SortIcon field="last_visit" />
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                    </td>
                  ))}
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No patients found.
                </td>
              </tr>
            ) : useVirtual ? (
              <>
                <tr style={{ height: virtualizer.getVirtualItems()[0]?.start ?? 0 }}>
                  <td colSpan={5} />
                </tr>
                {virtualizer.getVirtualItems().map((virtualRow) => {
                  const patient = items[virtualRow.index];
                  return <PatientRow key={patient.id} patient={patient} />;
                })}
                <tr
                  style={{
                    height:
                      virtualizer.getTotalSize() -
                      (virtualizer.getVirtualItems().at(-1)?.end ?? 0),
                  }}
                >
                  <td colSpan={5} />
                </tr>
              </>
            ) : (
              items.map((patient) => <PatientRow key={patient.id} patient={patient} />)
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, data.total)} of{' '}
            {data.total}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-md border border-border p-1.5 text-muted-foreground hover:bg-accent disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: data.pages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`h-8 w-8 rounded-md text-sm ${
                  p === page
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border text-muted-foreground hover:bg-accent'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
              disabled={page === data.pages}
              className="rounded-md border border-border p-1.5 text-muted-foreground hover:bg-accent disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
