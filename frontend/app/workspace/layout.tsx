import React from "react";
import { WorkspaceShell } from "@/components/workspace-shell";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Workspace - MusTape"
};

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return <WorkspaceShell>{children}</WorkspaceShell>;
}
