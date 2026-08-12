import { ErrorBoundary } from "@/components/error-boundary";
import { MusTapeApp } from "@/components/mustape-app";

export default function Home() {
  return (
    <ErrorBoundary label="Something slipped while opening the studio.">
      <MusTapeApp />
    </ErrorBoundary>
  );
}
