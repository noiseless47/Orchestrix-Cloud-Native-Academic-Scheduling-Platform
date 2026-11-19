"use client";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useState } from "react";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return <div className="app-layout"><Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} /><div className="app-main"><Topbar onMenuClick={() => setSidebarOpen(true)} /><main className="page-content">{children}</main><footer className="page-footer"><span>RoutineOps <span className="footer-dot">·</span> Department scheduling, made simpler.</span><span>Academic workspace <span className="footer-dot">·</span> 2025–26</span></footer></div></div>;
}
