"use client";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import { getAuthSession } from "@/lib/api";
import type { AuthSession } from "@/lib/types";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/login";
  const session = useQuery<AuthSession>({ queryKey: ["auth-session"], queryFn: getAuthSession, enabled: !isLoginPage, retry: false });

  useEffect(() => {
    if (!isLoginPage && session.isError) router.replace("/login");
  }, [isLoginPage, router, session.isError]);

  if (isLoginPage) return children;
  if (session.isPending || session.isError) return <main className="grid min-h-screen place-items-center bg-[#f6f8f5]" role="status"><div className="flex items-center gap-3 rounded-xl border border-[#e1e8e2] bg-white px-5 py-4 text-sm text-[#52645a] shadow-sm"><LoaderCircle size={18} className="animate-spin" aria-hidden="true" />Checking your account…</div></main>;

  return <div className="app-layout"><Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} /><div className="app-main"><Topbar sidebarOpen={sidebarOpen} onMenuClick={() => setSidebarOpen(true)} /><main className="page-content">{children}</main><footer className="page-footer"><span>Orchestrix <span className="footer-dot">&middot;</span> Cloud-native academic scheduling.</span><span>Academic workspace</span></footer></div></div>;
}
