"use client";

import React from "react";
import { useAuth } from "@/lib/auth-context";
import { LogOut, LayoutGrid, Plus } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";

export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logoutUser } = useAuth();

  React.useEffect(() => {
    if (!loading && !user) {
      window.location.href = "/";
    }
  }, [loading, user]);

  if (loading || !user) return <div className="p-8 font-sans text-ink-500">Opening workspace...</div>;

  return (
    <div className="flex min-h-screen bg-paper-100 font-sans text-ink-900">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col justify-between border-r border-[rgb(var(--border))] bg-paper-200/50 p-6">
        <div>
          <div className="mb-10 text-rosewood">
            <BrandLogo href="/workspace" />
          </div>

          <nav className="space-y-4">
            <a href="/workspace" className="flex items-center gap-3 text-sm font-medium hover:text-rosewood">
              <LayoutGrid className="h-4 w-4" />
              Collections
            </a>
            <a href="/workspace/new" className="flex items-center gap-3 text-sm font-medium hover:text-rosewood">
              <Plus className="h-4 w-4" />
              New Collection
            </a>
          </nav>
        </div>

        <div className="mt-8 border-t border-[rgb(var(--border))] pt-6">
          <div className="flex items-center gap-3">
            <img src={user.picture} alt={user.name} className="h-8 w-8 rounded-full" referrerPolicy="no-referrer" />
            <div className="flex flex-col min-w-0">
              <span className="truncate text-sm font-medium">{user.name}</span>
            </div>
          </div>
          <button
            onClick={() => logoutUser()}
            className="mt-4 flex w-full items-center gap-2 rounded-lg py-2 text-left text-sm text-ink-500 hover:text-rosewood"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-10">
        {children}
      </main>
    </div>
  );
}
