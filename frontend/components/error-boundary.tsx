"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Calm, MusTape-toned label shown in the fallback. */
  label?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log only safe diagnostic information — never expose stack traces to users.
    if (process.env.NODE_ENV !== "production") {
      console.error("[MusTape ErrorBoundary]", error, info.componentStack);
    } else {
      // In production, log only the error name (not the full message or stack).
      console.error("[MusTape ErrorBoundary]", error.name);
    }
  }

  handleRetry = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const label = this.props.label ?? "Something slipped while opening the tape.";

    return (
      <main className="min-h-screen overflow-x-hidden text-ink-800">
        <section className="paper-grain cinematic-room grid min-h-screen place-items-center px-5 py-10">
          <div className="relative z-10 mx-auto max-w-xl rounded-[2rem] border border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.78)] p-8 text-center shadow-object shadow-insetpaper">
            <p className="font-display text-4xl text-ink-900">The reel skipped.</p>
            <p className="mt-4 leading-7 text-ink-500">{label}</p>
            <button
              type="button"
              onClick={this.handleRetry}
              className="button-lift touch-target mt-7 inline-flex items-center justify-center rounded-full bg-rosewood px-6 text-sm text-paper-100 hover:bg-ink-900"
            >
              Try Again
            </button>
          </div>
        </section>
      </main>
    );
  }
}
