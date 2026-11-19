"use client";
import { Menu, Search, Bell, ChevronRight } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const titles: Record<string, string> = { "/dashboard": "Overview", "/teachers": "Teachers", "/subjects": "Subjects", "/sections": "Sections", "/schedule/generate": "Build a routine", "/schedule/view": "Timetable", "/admin/diagnostics": "System health" };
export default function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const pathname = usePathname(); const router = useRouter(); const [search, setSearch] = useState("");
  const title = titles[pathname] ?? Object.entries(titles).find(([path]) => path !== "/dashboard" && pathname.startsWith(`${path}/`))?.[1] ?? "Workspace";
  const go = (event: React.FormEvent) => { event.preventDefault(); const term = search.toLowerCase(); const path = term.includes("teacher") ? "/teachers" : term.includes("subject") || term.includes("course") ? "/subjects" : term.includes("section") || term.includes("class") ? "/sections" : term.includes("routine") || term.includes("generate") || term.includes("build") ? "/schedule/generate" : term.includes("timetable") || term.includes("schedule") ? "/schedule/view" : "/dashboard"; router.push(path); setSearch(""); };
  return <header className="topbar"><div className="topbar-left"><button className="menu-button" aria-label="Open menu" onClick={onMenuClick}><Menu size={20} /></button><div className="breadcrumb"><span>Workspace</span><ChevronRight size={14} /><strong>{title}</strong></div></div><div className="topbar-right"><form className="top-search" onSubmit={go}><Search size={16} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Jump to…" aria-label="Quick navigation" /><kbd>↵</kbd></form><div className="top-divider" /><button className="icon-button" aria-label="Notifications" title="You're all caught up"><Bell size={18} /><i /></button><div className="user-chip"><div className="user-avatar">AD</div><div className="user-info"><strong>Admin</strong><span>Department admin</span></div></div></div></header>;
}
