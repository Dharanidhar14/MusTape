"use client";

import React from "react";
import { useAuth } from "@/lib/auth-context";
import { LogOut, LayoutGrid, Plus, Compass } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motionTokens } from "@/lib/design-tokens";
import { motion } from "framer-motion";

export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logoutUser } = useAuth();
  const pathname = usePathname();

  React.useEffect(() => {
    if (!loading && !user) {
      window.location.href = "/";
    }
  }, [loading, user]);

  if (loading || !user) return <div className="grid min-h-screen place-items-center bg-paper-100 font-sans text-ink-500">Opening workspace...</div>;

  const navItems = [
    { name: "Collections", href: "/workspace", icon: LayoutGrid, exact: true },
    { name: "New Collection", href: "/workspace/new", icon: Plus, exact: false },
    { name: "Import Tape", href: "/workspace/claim", icon: Compass, exact: false }
  ];

  return (
    <div className="flex min-h-screen bg-paper-100 font-sans text-ink-900">
      {/* Sidebar */}
      <aside className="sticky top-0 flex h-screen w-64 flex-col justify-between border-r border-[rgb(var(--border))] bg-paper-200/50 p-6">
        <div>
          <div className="mb-12 text-rosewood">
            <BrandLogo href="/workspace" />
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-[1rem] px-4 py-3 text-sm font-medium transition ${
                    isActive ? "bg-[rgb(var(--surface))] text-ink-900 shadow-sm border border-[rgb(var(--border))]" : "text-ink-600 hover:bg-paper-100 hover:text-ink-900 border border-transparent"
                  }`}
                >
                  <item.icon className={`h-5 w-5 ${isActive ? "text-rosewood" : "text-ink-400"}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Profile Footer */}
        <div className="border-t border-[rgb(var(--border))] pt-6 mt-6">
          <div className="flex items-center gap-3">
            <img src={user.picture} alt="Profile" className="h-9 w-9 rounded-full border border-[rgb(var(--border))]" />
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-ink-900">{user.name}</p>
              <p className="truncate text-xs text-ink-500">{user.email}</p>
            </div>
          </div>
          <button
            onClick={logoutUser}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-full border border-oxblood/20 bg-oxblood/5 px-4 py-2 text-xs font-medium text-oxblood hover:bg-oxblood/10 transition"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto px-8 py-12 lg:px-16 lg:py-16">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: motionTokens.durations.calm, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
