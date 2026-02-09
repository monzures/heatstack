import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-35 cursor-pointer active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: [
          "bg-white text-[#0a0a0a] rounded-lg",
          "hover:bg-white/90",
          "shadow-[0_0_0_1px_rgba(255,255,255,0.15)]",
        ],
        outline: [
          "border border-white/12 bg-white/[0.03] text-white/90 rounded-lg",
          "hover:bg-white/[0.07] hover:border-white/20",
        ],
        ghost: [
          "text-white/50 rounded-lg",
          "hover:text-white hover:bg-white/[0.05]",
        ],
        game: [
          "bg-[var(--bg-surface)] border border-white/10 text-white rounded-lg",
          "hover:bg-white/[0.06] hover:border-white/18",
        ],
        submit: [
          "bg-white text-[#0a0a0a] font-semibold rounded-lg",
          "shadow-[0_0_0_1px_rgba(255,255,255,0.2),0_2px_12px_rgba(255,255,255,0.1)]",
          "hover:shadow-[0_0_0_1px_rgba(255,255,255,0.3),0_4px_20px_rgba(255,255,255,0.15)]",
        ],
      },
      size: {
        default: "h-10 px-4 text-[13px]",
        sm: "h-9 px-3.5 text-xs",
        lg: "h-12 px-6 text-sm",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
