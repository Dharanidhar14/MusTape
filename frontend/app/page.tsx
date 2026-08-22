"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { useAuth } from "@/lib/auth-context";
import { GoogleLogin } from "@react-oauth/google";
import { Sparkles } from "lucide-react";
import { motionTokens } from "@/lib/design-tokens";
import { motion, useReducedMotion } from "framer-motion";

export default function LandingPage() {
  const { user, loading, login } = useAuth();
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!loading && user) {
      router.push("/workspace");
    }
  }, [user, loading, router]);

  if (loading || user) {
    return <div className="p-8 text-ink-500 min-h-screen bg-paper-100">Opening studio...</div>;
  }

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-paper-100 text-ink-800">
      <section className="paper-grain cinematic-room min-h-screen px-5 py-6 sm:px-8 sm:py-7 lg:px-10 flex flex-col">
        <header className="relative z-10 flex items-center justify-between gap-4 w-full max-w-[84rem] mx-auto">
          <BrandLogo />
        </header>

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center max-w-2xl mx-auto w-full py-20">
          <motion.p
            initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: motionTokens.durations.calm, ease: "easeOut" }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.58)] px-4 py-2 text-xs uppercase tracking-[0.18em] text-ink-500 shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5" />
            A keepsake for sound
          </motion.p>
          
          <motion.h1
            initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: motionTokens.durations.reveal, ease: "easeOut" }}
            className="font-display text-[clamp(3.75rem,8vw,5.5rem)] leading-[0.95] tracking-tight text-ink-900"
          >
            Make a tape that feels held.
          </motion.h1>
          
          <motion.p
            initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16, duration: motionTokens.durations.reveal, ease: "easeOut" }}
            className="mt-8 max-w-xl text-[1.15rem] leading-9 text-ink-500"
          >
            Compose a private cassette letter with songs, traces, and a link that opens like an envelope. Sign in to start your collection.
          </motion.p>
          
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24, duration: motionTokens.durations.reveal, ease: "easeOut" }}
            className="mt-12 scale-110"
          >
            <GoogleLogin
              onSuccess={(res) => { if (res.credential) login(res.credential) }}
              shape="pill"
              theme="filled_black"
              size="large"
              text="continue_with"
            />
          </motion.div>
        </div>
        
        <footer className="relative z-10 max-w-[84rem] mx-auto w-full text-center text-ink-400 text-sm pb-8">
          MusTape v4.0 &copy; {new Date().getFullYear()}
        </footer>
      </section>
    </main>
  );
}
