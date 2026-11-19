"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, BookOpen, Boxes, CalendarPlus, CalendarDays, X, Sparkles, Settings2 } from "lucide-react";
import { cn } from "@/lib/helpers";

const nav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/teachers", label: "Teachers", icon: Users },
  { href: "/subjects", label: "Subjects", icon: BookOpen },
  { href: "/sections", label: "Sections", icon: Boxes },
  { href: "/schedule/generate", label: "Build a routine", icon: CalendarPlus },
  { href: "/schedule/view", label: "Timetable", icon: CalendarDays },
];

export default function Sidebar({ open, onClose }: { open?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  return <>
    {open && <button aria-label="Close navigation" className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm md:hidden" onClick={onClose} />}
    <aside aria-label="Main navigation" className={cn("app-sidebar", open ? "app-sidebar-open" : "")}>
      <div className="sidebar-brand">
        <div className="brand-mark"><span>R</span><i /></div>
        <div><div className="brand-name">routine<span>ops</span></div><div className="brand-caption">ACADEMIC PLANNER</div></div>
        <button className="sidebar-close" aria-label="Close navigation" onClick={onClose}><X size={18} /></button>
      </div>
      <div className="workspace-switch"><div className="workspace-avatar">CS</div><div className="min-w-0"><div className="workspace-name">Computer Science</div><div className="workspace-sub">Department workspace</div></div><Settings2 size={16} className="ml-auto text-slate-400" /></div>
      <div className="nav-label">WORKSPACE</div>
      <nav className="sidebar-nav">{nav.map(({ href, label, icon: Icon }) => {
        const active = href === "/dashboard" ? pathname === href || pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
        return <Link key={href} href={href} onClick={onClose} className={cn("nav-link", active && "nav-link-active")}><Icon size={18} strokeWidth={active ? 2.2 : 1.8} /><span>{label}</span>{label === "Build a routine" && <span className="nav-new">NEW</span>}</Link>;
      })}</nav>
      <div className="sidebar-bottom"><div className="sidebar-tip"><div className="tip-icon"><Sparkles size={16} /></div><div className="tip-title">A smoother semester</div><p>Keep your teaching team and course list up to date before building a routine.</p><Link href="/schedule/generate" onClick={onClose}>Get started <span>↗</span></Link></div><div className="sidebar-footer"><div className="online-dot" /> All systems ready <span>v1.0</span></div></div>
    </aside>
  </>;
}
