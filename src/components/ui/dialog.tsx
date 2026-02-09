import * as React from "react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "motion/react"

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md"
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className={cn(
              "relative z-50 w-full sm:w-[calc(100%-2rem)] sm:max-w-md max-h-[85dvh] overflow-y-auto",
              "rounded-t-3xl sm:rounded-3xl bg-[var(--bg-elevated)] p-6 pb-8",
              "border-t border-[var(--border-default)] sm:border",
              "shadow-[0_-8px_40px_rgba(0,0,0,0.4),0_0_0_1px_var(--border-subtle)]",
            )}
          >
            {/* Drag handle for mobile sheet feel */}
            <div className="flex justify-center mb-4 sm:hidden">
              <div className="w-9 h-1 rounded-full bg-white/20" />
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export function DialogTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h2 className={cn("text-lg font-bold mb-4 text-white", className)}>{children}</h2>
}

export function DialogClose({ onClose }: { onClose: () => void; children?: React.ReactNode }) {
  return (
    <button
      onClick={onClose}
      className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-[var(--text-secondary)] hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </button>
  )
}
