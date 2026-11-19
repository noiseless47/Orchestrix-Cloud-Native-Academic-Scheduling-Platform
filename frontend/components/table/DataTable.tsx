"use client";
import { Skeleton } from "@/components/common/Skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";
export default function DataTable<T>({
  columns,
  rows,
  renderCell,
  loading,
  emptyTitle = "No data",
  emptyDescription,
}: {
  columns: { key: string; label: string }[];
  rows: T[];
  renderCell: (item: T, columnKey: string) => React.ReactNode;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const [search, setSearch] = useState("");
  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((row) => JSON.stringify(row).toLowerCase().includes(term));
  }, [rows, search]);
  return (
    <div className="overflow-hidden rounded-md border bg-white table-sticky">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-white px-4 py-3">
        <div className="text-xs font-medium text-gray-500">{loading ? "Loading records…" : `${filteredRows.length} ${filteredRows.length === 1 ? "record" : "records"}`}{search && ` matching “${search}”`}</div>
        <label className="flex min-w-[190px] items-center gap-2 rounded-md border bg-gray-50 px-3 py-2 text-gray-400 focus-within:border-emerald-300 focus-within:bg-white">
          <Search size={14} />
          <input className="w-full border-0 bg-transparent text-xs text-gray-700 outline-none placeholder:text-gray-400" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search records" aria-label="Search records" />
          {search && <button type="button" onClick={() => setSearch("")} className="text-gray-400 hover:text-gray-700" aria-label="Clear search"><X size={13} /></button>}
        </label>
      </div>
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 sticky top-0 z-10">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className="text-left font-medium text-gray-700 p-2 border-b">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan={columns.length} className="p-3">
                <div className="space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-[90%]" />
                  <Skeleton className="h-8 w-[80%]" />
                </div>
              </td>
            </tr>
          )}
          {!loading && rows.length === 0 && (
            <tr>
              <td className="p-0" colSpan={columns.length}>
                <EmptyState title={emptyTitle} description={emptyDescription} className="border-0" />
              </td>
            </tr>
          )}
          {!loading && rows.length > 0 && filteredRows.length === 0 && (
            <tr><td colSpan={columns.length} className="p-8 text-center text-xs text-gray-500">No records match “{search}”. Try a different search.</td></tr>
          )}
          {filteredRows.map((r: any, idx) => (
            <tr key={r.id ?? r._id ?? idx} className="border-t transition-colors hover:bg-gray-50/80">
              {columns.map((c) => (
                <td key={c.key} className="p-2 align-top">
                  {renderCell(r, c.key)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
