"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Boxes,
  CalendarCheck2,
  CalendarDays,
  CalendarPlus,
  Check,
  ChevronRight,
  CircleAlert,
  Clock3,
  Search,
  Sparkles,
  Users,
  WandSparkles,
} from "lucide-react";
import { getSections, getSubjects, getTeachers } from "@/lib/api";
import { useSchedule } from "@/hooks/useSchedule";

const fetchCounts = async () => {
  const [teachers, subjects, sections] = await Promise.all([
    getTeachers(),
    getSubjects(),
    getSections(),
  ]);
  return { teachers: teachers.length, subjects: subjects.length, sections: sections.length };
};

const shortcuts = [
  { title: "Add a teacher", description: "Grow your teaching team", href: "/teachers", icon: Users, tone: "violet" },
  { title: "Add a subject", description: "Set up a course offering", href: "/subjects", icon: BookOpen, tone: "blue" },
  { title: "Create a section", description: "Organize a student group", href: "/sections", icon: Boxes, tone: "amber" },
  { title: "Build a routine", description: "Generate a clash-aware plan", href: "/schedule/generate", icon: WandSparkles, tone: "mint" },
];

export default function DashboardPage() {
  const [query, setQuery] = useState("");
  const counts = useQuery({ queryKey: ["counts"], queryFn: fetchCounts });
  const schedule = useSchedule();
  const sections = schedule.list.data?.sections ?? [];
  const periods = schedule.list.data?.periodsPerDay ?? 0;
  const scheduledSlots = useMemo(
    () =>
      sections.reduce(
        (total: number, section: any) =>
          total +
          Object.values(section.timetable ?? {}).reduce(
            (dayTotal: number, day: any) =>
              dayTotal + (Array.isArray(day) ? day.filter(Boolean).length : 0),
            0,
          ),
        0,
      ),
    [sections],
  );

  const cards = [
    { label: "Teaching team", value: counts.data?.teachers, icon: Users, href: "/teachers", color: "violet", note: "teachers in your department" },
    { label: "Course catalog", value: counts.data?.subjects, icon: BookOpen, href: "/subjects", color: "blue", note: "subjects ready to assign" },
    { label: "Student groups", value: counts.data?.sections, icon: Boxes, href: "/sections", color: "amber", note: "sections across all years" },
    { label: "Classes placed", value: scheduledSlots || (schedule.list.isLoading ? undefined : 0), icon: CalendarCheck2, href: "/schedule/view", color: "mint", note: "periods in the current routine" },
  ];
  const filtered = shortcuts.filter((item) =>
    `${item.title} ${item.description}`.toLowerCase().includes(query.toLowerCase()),
  );
  const readyCount = [counts.data?.teachers, counts.data?.subjects, counts.data?.sections].filter(
    (count) => (count ?? 0) > 0,
  ).length;
  const routineExists = sections.length > 0;

  return (
    <div className="dashboard-page">
      <section className="welcome-banner">
        <div className="welcome-copy">
          <div className="eyebrow light"><span className="eyebrow-line" /> YOUR DEPARTMENT, IN SYNC</div>
          <h1>Make room for a<br /><em>better routine.</em></h1>
          <p>Plan the semester with your whole department in one place.</p>
          <div className="welcome-actions">
            <Link className="button-white" href="/schedule/generate"><Sparkles size={16} /> Build a routine <ArrowRight size={16} /></Link>
            <Link className="welcome-link" href="/schedule/view">Explore timetable <ArrowUpRight size={15} /></Link>
          </div>
        </div>
        <div className="welcome-art" aria-hidden="true">
          <div className="art-orbit orbit-one" />
          <div className="art-orbit orbit-two" />
          <div className="art-sun" />
          <div className="art-calendar">
            <div className="art-calendar-top"><span /><span /><span /></div>
            <div className="art-calendar-grid">
              {Array.from({ length: 15 }, (_, index) => (
                <i key={index} className={index === 2 || index === 6 || index === 9 || index === 13 ? "filled" : ""} />
              ))}
            </div>
            <div className="art-calendar-tag"><CalendarCheck2 size={13} /> schedule in sync</div>
          </div>
        </div>
        <div className="banner-grain" />
      </section>

      <div className="section-heading">
        <div><div className="eyebrow"><span className="eyebrow-line" /> AT A GLANCE</div><h2>Your department, today</h2></div>
        <span className="updated-label"><span className="live-dot" /> Live workspace data</span>
      </div>

      <section className="stats-grid" aria-label="Department statistics">
        {cards.map(({ label, value, icon: Icon, href, color, note }, index) => (
          <Link className={`stat-card stat-${color}`} href={href} key={label} style={{ animationDelay: `${index * 65}ms` }}>
            <div className="stat-card-top"><span className="stat-icon"><Icon size={18} /></span><ArrowUpRight size={16} className="stat-arrow" /></div>
            <div className="stat-value">
              {(counts.isLoading && label !== "Classes placed") || (schedule.list.isLoading && label === "Classes placed")
                ? <span className="skeleton-number" />
                : value ?? "—"}
            </div>
            <div className="stat-label">{label}</div>
            <div className="stat-note">{note}</div>
          </Link>
        ))}
      </section>

      <section className="dashboard-lower">
        <div className="panel setup-panel">
          <div className="panel-heading">
            <div><div className="eyebrow"><span className="eyebrow-line" /> YOUR NEXT STEPS</div><h2>Set up your semester</h2></div>
            <span className="setup-count">{readyCount}<span> / 3 ready</span></span>
          </div>
          <p className="panel-intro">A few essentials make schedule generation smoother.</p>
          <div className="progress-track"><span style={{ width: `${(readyCount / 3) * 100}%` }} /></div>
          <div className="setup-list">
            {[
              { label: "Teaching team", value: counts.data?.teachers ?? 0, href: "/teachers", icon: Users },
              { label: "Course catalog", value: counts.data?.subjects ?? 0, href: "/subjects", icon: BookOpen },
              { label: "Student groups", value: counts.data?.sections ?? 0, href: "/sections", icon: Boxes },
            ].map(({ label, value, href, icon: Icon }) => (
              <Link href={href} className="setup-row" key={label}>
                <span className={`setup-check ${value > 0 ? "is-done" : ""}`}>{value > 0 ? <Check size={13} /> : <Icon size={14} />}</span>
                <span className="setup-name">{label}</span>
                <span className="setup-status">{counts.isLoading ? "Loading" : value > 0 ? `${value} added` : "Add your first"}</span>
                <ChevronRight size={15} className="setup-chevron" />
              </Link>
            ))}
          </div>
          <Link className="panel-cta" href={routineExists ? "/schedule/view" : "/schedule/generate"}>
            {routineExists ? "Open your current timetable" : "Continue to routine builder"}<ArrowRight size={15} />
          </Link>
        </div>

        <div className="panel routine-panel">
          <div className="panel-heading">
            <div><div className="eyebrow"><span className="eyebrow-line" /> CURRENT ROUTINE</div><h2>{routineExists ? "Your timetable is ready" : "Your schedule starts here"}</h2></div>
            <div className={`routine-status ${routineExists ? "status-ready" : "status-empty"}`}><span />{routineExists ? "ACTIVE" : "NOT BUILT"}</div>
          </div>
          {schedule.list.isLoading ? (
            <div className="routine-preview-loading"><span /><span /><span /></div>
          ) : routineExists ? (
            <>
              <div className="routine-summary">
                <div className="routine-summary-icon"><CalendarDays size={21} /></div>
                <div><strong>{schedule.list.data?.department || "Department routine"}</strong><span>{sections.length} {sections.length === 1 ? "section" : "sections"} <i>·</i> {periods || "—"} periods per day</span></div>
              </div>
              <div className="routine-foot"><span><Clock3 size={14} /> Semester overview</span><Link href="/schedule/view">View timetable <ArrowRight size={14} /></Link></div>
            </>
          ) : (
            <>
              <div className="routine-empty-visual">
                <div className="empty-visual-calendar"><div /><div /><div /><div /><div /><div /></div>
                <div className="empty-visual-spark"><Sparkles size={16} /></div>
              </div>
              <p className="routine-empty-text">Bring teachers, subjects and sections together in a balanced weekly plan.</p>
              <Link className="routine-build-button" href="/schedule/generate"><CalendarPlus size={16} /> Start building <ArrowRight size={15} /></Link>
            </>
          )}
        </div>
      </section>

      <section className="quick-section">
        <div className="quick-heading">
          <div><div className="eyebrow"><span className="eyebrow-line" /> KEEP THINGS MOVING</div><h2>Quick actions</h2></div>
          <label className="quick-search">
            <Search size={15} />
            <input placeholder="Find an action" value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Find a quick action" />
            {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search">×</button>}
          </label>
        </div>
        <div className="quick-grid">
          {filtered.map(({ title, description, href, icon: Icon, tone }) => (
            <Link className="quick-card" href={href} key={title}>
              <span className={`quick-icon tone-${tone}`}><Icon size={18} /></span>
              <span className="quick-card-copy"><strong>{title}</strong><span>{description}</span></span>
              <span className="quick-arrow"><ArrowUpRight size={16} /></span>
            </Link>
          ))}
          {filtered.length === 0 && <div className="no-actions"><CircleAlert size={17} /> No actions match "{query}".</div>}
        </div>
      </section>

      <div className="dashboard-note">
        <span><Sparkles size={15} /> Built for the moving parts of a real department.</span>
        <Link href="/admin/diagnostics">System health <ArrowUpRight size={13} /></Link>
      </div>
    </div>
  );
}
