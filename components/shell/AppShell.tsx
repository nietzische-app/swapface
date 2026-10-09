"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { LoginScreen } from "@/components/shell/LoginScreen";
import { Sidebar } from "@/components/shell/Sidebar";
import { TopBar } from "@/components/shell/TopBar";
import { useStudio } from "@/components/providers/StudioProvider";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { authed, toast } = useStudio();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const studio = pathname === "/";

  if (!authed) return <LoginScreen />;

  return (
    <div className="flex h-screen overflow-hidden bg-[#0e0c18] text-white">
      <Sidebar open={open} onNavigate={() => setOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onMenu={() => setOpen(true)} />
        <main className={cn("min-h-0 flex-1 overflow-y-auto px-3 pb-4 sm:px-4", studio && "xl:overflow-hidden")}>
          <motion.div
            key={pathname}
            className={cn(studio ? "h-full min-h-[860px] xl:min-h-0" : "min-h-full pb-6")}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
      <AnimatePresence>
        {toast ? (
          <motion.div
            key={toast.id}
            data-testid="toast"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full border border-white/10 bg-[#221c38] px-4 py-2 text-[13px] text-white shadow-2xl"
          >
            {toast.message}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
