import * as React from "react"
import { cn } from "@/lib/utils"

export function Marquee({
  children,
  direction = "left",
  repeat = 4,
  duration = 60,
  className,
  ...props
}: {
  children: React.ReactNode
  direction?: "left" | "right"
  repeat?: number
  duration?: number
  className?: string
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn(
        "group flex [gap:var(--gap)] overflow-hidden [--gap:1rem]",
        className
      )}
      style={{ "--duration": `${duration}s` } as React.CSSProperties}
    >
      {Array(repeat)
        .fill(0)
        .map((_, i) => (
          <div
            key={i}
            className={cn("flex shrink-0 justify-around [gap:var(--gap)]", {
              "animate-marquee-left": direction === "left",
              "animate-marquee-right": direction === "right",
              "group-hover:[animation-play-state:paused]": true,
            })}
          >
            {React.Children.toArray(children).map((child, index) => {
              if (React.isValidElement(child)) {
                return React.cloneElement(child, {
                  key: `marquee-child-${i}-${index}-${child.key || index}`
                } as any)
              }
              return child
            })}
          </div>
        ))}
    </div>
  )
}

