import * as React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null
  alt?: string
  fallback?: string
  size?: "sm" | "md" | "lg"
}

const sizes = { sm: 32, md: 40, lg: 56 }

export function Avatar({
  className,
  src,
  alt = "",
  fallback = "?",
  size = "md",
  ...props
}: AvatarProps) {
  const dim = sizes[size]
  const initial = fallback.slice(0, 1).toUpperCase()

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted font-medium text-muted-foreground",
        className
      )}
      style={{ width: dim, height: dim }}
      {...props}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          width={dim}
          height={dim}
          className="size-full object-cover"
          unoptimized
        />
      ) : (
        <span className="text-sm">{initial}</span>
      )}
    </div>
  )
}
