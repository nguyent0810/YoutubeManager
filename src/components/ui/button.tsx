import * as React from "react"
import { cn } from "@/lib/utils"

const variants = {
  default: "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80",
  secondary:
    "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/70",
  outline:
    "border border-input bg-background hover:bg-accent hover:text-accent-foreground active:bg-accent/80",
  ghost: "hover:bg-accent hover:text-accent-foreground active:bg-accent/80",
  destructive:
    "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80",
  link: "text-primary underline-offset-4 hover:underline",
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants
  size?: "sm" | "md" | "lg" | "icon"
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "md",
      type = "button",
      asChild,
      children,
      ...props
    },
    ref
  ) => {
    const classes = cn(
      "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none",
      variants[variant],
      size === "sm" && "h-8 px-3 text-xs",
      size === "md" && "h-10 px-4 py-2 text-sm",
      size === "lg" && "h-12 px-6 text-base",
      size === "icon" && "size-10 shrink-0",
      className
    )

    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<{ className?: string }>
      return React.cloneElement(child, {
        className: cn(classes, child.props.className),
      })
    }

    return (
      <button ref={ref} type={type} className={classes} {...props}>
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"
