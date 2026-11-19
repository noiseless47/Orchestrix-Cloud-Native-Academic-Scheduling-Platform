"use client";
import { Skeleton } from "@/components/common/Skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { Search, X, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { useMemo, useState } from "react";

type Column<T> = { key: string; label: string; sortable?: boolean; value?: (row: T) => string | number | null | undefined };
export default function DataTable<T>({
  columns, rows, renderCell, loading, emptyTitle = "No data", emptyDescription,
}: {
  columns: Column<T>[]; rows: T[]; renderCell: (item: T, columnKey: string) => React.ReactNode;
  loading?: boolean; emptyTitle?: string; emptyDescription?: string;
}) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const pageSize = 10;
  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    const matches = term ? rows.filter((row) => columns.some((column) => String(column.value?.(row) ?? (row as Record<string, unknown>)[column.key] ?? "").toLocaleLowerCase().includes(term)) || JSON.stringify(row).toLocaleLowerCase().includes(term)) : rows;
    if (!sort) return matches;
    const column = columns.find((item) => item.key === sort.key);
    return [...matches].sort((a, b) => {
      const av = column?.value?.(a) ?? (a as Record<string, unknown>)[sort.key]; const bv = column?.value?.(b) ?? (b as Record<string, unknown>)[sort.key];
      const compared = typeof av === "number" && typeof bv === "number" ? av - bv : String(av ?? "").localeCompare(String(bv ?? ""), undefined, { numeric: true, sensitivity: "base" });
      return sort.direction === "asc" ? compared : -compared;
    });
  }, [rows, columns, search, sort]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pages - 1);
  const visible = filtered.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  const rowId = (row: T, index: number) => { const item = row as Record<string, unknown>; return String(item._id ?? item.id ?? index); };
  const pageIds = visible.map((row, index) => rowId(row, currentPage * pageSize + index));
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const toggle = (id: string) => setSelected((previous) => { const next = new Set(previous); next.has(id) ? next.delete(id) : next.add(id); return next; });
  const toggleAll = () => setSelected((previous) => { const next = new Set(previous); if (allSelected) pageIds.forEach((id) => next.delete(id)); else pageIds.forEach((id) => next.add(id)); return next; });
  return <section className="data-table" aria-label="Records">
    <div className="data-toolbar"><div><strong>{loading ? "Loading records" : `${filtered.length} ${filtered.length === 1 ? "record" : "records"}`}</strong>{search && !loading && <span> matching “{search}”</span>}{selected.size > 0 && <span className="selection-count">{selected.size} selected</span>}</div>
      <label className="table-search"><Search size={16} aria-hidden="true"/><span className="sr-only">Search records</span><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} placeholder="Search records" />{search && <button type="button" onClick={() => { setSearch(""); setPage(0); }} aria-label="Clear search"><X size={15}/></button>}</label>
    </div>
    <div className="table-overflow"><table><thead><tr><th className="select-cell"><input type="checkbox" aria-label="Select all rows on this page" checked={allSelected} onChange={toggleAll} /></th>{columns.map((column) => <th key={column.key} aria-sort={sort?.key === column.key ? sort.direction === "asc" ? "ascending" : "descending" : "none"}>{column.sortable === false || column.key === "actions" ? column.label : <button className="sort-button" onClick={() => setSort((old) => ({ key: column.key, direction: old?.key === column.key && old.direction === "asc" ? "desc" : "asc" }))}>{column.label}{sort?.key === column.key ? sort.direction === "asc" ? <ArrowUp size={14}/> : <ArrowDown size={14}/> : <ArrowUpDown size={13}/>}</button>}</th>)}</tr></thead>
      <tbody>{loading ? <tr><td colSpan={columns.length + 1}><div className="table-loading"><Skeleton className="h-10 w-full"/><Skeleton className="h-10 w-full"/><Skeleton className="h-10 w-full"/></div></td></tr> : rows.length === 0 ? <tr><td colSpan={columns.length + 1}><EmptyState title={emptyTitle} description={emptyDescription} className="border-0"/></td></tr> : filtered.length === 0 ? <tr><td colSpan={columns.length + 1}><EmptyState title="No matching records" description={`No records match “${search}”. Try a different search.`} className="border-0"/></td></tr> : visible.map((row, index) => { const id = rowId(row, currentPage * pageSize + index); return <tr key={id} className={selected.has(id) ? "row-selected" : undefined}><td className="select-cell"><input type="checkbox" aria-label={`Select row ${id}`} checked={selected.has(id)} onChange={() => toggle(id)}/></td>{columns.map((column) => <td key={column.key}>{renderCell(row, column.key)}</td>)}</tr>; })}</tbody></table></div>
    <div className="table-pagination"><span>Showing {filtered.length ? currentPage * pageSize + 1 : 0}–{Math.min((currentPage + 1) * pageSize, filtered.length)} of {filtered.length}</span><div><button aria-label="Previous page" disabled={currentPage === 0 || loading} onClick={() => setPage((value) => Math.max(0, value - 1))}><ChevronLeft size={16}/></button><span>Page {currentPage + 1} of {pages}</span><button aria-label="Next page" disabled={currentPage + 1 >= pages || loading} onClick={() => setPage((value) => Math.min(pages - 1, value + 1))}><ChevronRight size={16}/></button></div></div>
  </section>;
}
