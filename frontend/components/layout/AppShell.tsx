"use client";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useState } from "react";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return <div className="app-layout"><Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} /><div className="app-main"><Topbar sidebarOpen={sidebarOpen} onMenuClick={() => setSidebarOpen(true)} /><main className="page-content">{children}</main><footer className="page-footer"><span>RoutineOps <span className="footer-dot">&middot;</span> Department scheduling, made simpler.</span><span>Academic workspace</span></footer></div></div>;
}
