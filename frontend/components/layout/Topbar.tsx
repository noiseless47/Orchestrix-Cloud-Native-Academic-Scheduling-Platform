"use client";
import { Menu, Search, Bell, ChevronRight, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

const titles: Record<string, string> = { "/dashboard": "Overview", "/teachers": "Teachers", "/subjects": "Subjects", "/sections": "Sections", "/schedule/generate": "Build a routine", "/schedule/view": "Timetable", "/admin/diagnostics": "System health" };
const destinations = [
  { label: "Overview", href: "/dashboard", terms: "dashboard home overview" },
  { label: "Teachers", href: "/teachers", terms: "teachers staff faculty" },
  { label: "Subjects", href: "/subjects", terms: "subjects courses catalog" },
  { label: "Sections", href: "/sections", terms: "sections classes groups" },
  { label: "Build a routine", href: "/schedule/generate", terms: "build generate routine schedule" },
  { label: "Timetable", href: "/schedule/view", terms: "timetable schedule view" },
  { label: "System health", href: "/admin/diagnostics", terms: "system health diagnostics" },
];
export default function Topbar({ onMenuClick, sidebarOpen = false }: { onMenuClick?: () => void; sidebarOpen?: boolean }) {
  const pathname = usePathname(); const router = useRouter(); const [search, setSearch] = useState(""); const [focused, setFocused] = useState(false); const [mobileSearchOpen, setMobileSearchOpen] = useState(false); const inputRef = useRef<HTMLInputElement>(null);
  const title = titles[pathname] ?? Object.entries(titles).find(([path]) => path !== "/dashboard" && pathname.startsWith(`${path}/`))?.[1] ?? "Workspace";
  const matches = useMemo(() => { const term = search.trim().toLowerCase(); return term ? destinations.filter((item) => `${item.label} ${item.terms}`.includes(term)) : []; }, [search]);
  const go = (event: React.FormEvent) => { event.preventDefault(); if (matches[0]) { router.push(matches[0].href); setSearch(""); setFocused(false); } };
  useEffect(() => { const onKey = (event: KeyboardEvent) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setMobileSearchOpen(true); window.setTimeout(() => inputRef.current?.focus(), 0); } if (event.key === "Escape") { setFocused(false); setMobileSearchOpen(false); inputRef.current?.blur(); } }; window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey); }, []);
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="menu-button" aria-label="Open menu" aria-expanded={sidebarOpen} aria-controls="main-navigation" onClick={onMenuClick}>
          <Menu size={20} />
        </button>
        <div className="breadcrumb"><span>Workspace</span><ChevronRight size={14} /><strong>{title}</strong></div>
      </div>
      <div className="topbar-right">
        <button className="icon-button mobile-search-toggle" aria-label="Open search" onClick={() => { setMobileSearchOpen(true); window.setTimeout(() => inputRef.current?.focus(), 0); }}>
          <Search size={18} />
        </button>
        <div className={`search-wrap ${mobileSearchOpen ? "search-wrap-mobile-open" : ""}`}>
          {mobileSearchOpen && (
            <button type="button" className="mobile-search-close" aria-label="Close search" onClick={() => { setMobileSearchOpen(false); setSearch(""); setFocused(false); }}>
              <X size={17} />
            </button>
          )}
          <form className="top-search" role="search" onSubmit={go}>
            <Search size={16} aria-hidden="true" />
            <input ref={inputRef} value={search} onFocus={() => setFocused(true)} onBlur={() => window.setTimeout(() => setFocused(false), 120)} onChange={(event) => setSearch(event.target.value)} placeholder="Search workspace" aria-label="Search workspace" role="combobox" aria-autocomplete="list" aria-expanded={focused && !!search} aria-haspopup="listbox" aria-controls="global-search-results" />
            <kbd>Ctrl K</kbd>
            {search && <button type="button" aria-label="Clear search" onClick={() => { setSearch(""); inputRef.current?.focus(); }}><X size={14} /></button>}
          </form>
          {focused && !!search && (
            <div id="global-search-results" className="search-results" role="listbox" aria-label="Search destinations">
              {matches.length ? matches.map((item) => (
                <button key={item.href} type="button" role="option" aria-selected={false} onMouseDown={(event) => event.preventDefault()} onClick={() => { router.push(item.href); setSearch(""); setFocused(false); setMobileSearchOpen(false); }}>
                  <Search size={14} /><span>{item.label}</span><small>Go to page</small>
                </button>
              )) : <p role="status">No pages match &quot;{search}&quot;. Try teachers, subjects, or timetable.</p>}
            </div>
          )}
        </div>
        <div className="top-divider" />
        <button className="icon-button" aria-label="Notifications" title="You are all caught up"><Bell size={18} /><i /></button>
        <div className="user-chip"><div className="user-avatar">AD</div><div className="user-info"><strong>Admin</strong><span>Department admin</span></div></div>
      </div>
    </header>
  );
}
