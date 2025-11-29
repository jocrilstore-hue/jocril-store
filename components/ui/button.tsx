import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[4px] text-xs font-medium uppercase tracking-wide transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        // Primary CTA - accent color
        default:
          "bg-[var(--accent-100)] text-[var(--color-dark-base-primary)] border border-dashed border-[var(--accent-100)] hover:bg-transparent hover:text-[var(--accent-100)]",
        // Destructive
        destructive:
          "bg-destructive text-white border border-dashed border-destructive/80 hover:bg-transparent hover:text-destructive focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        // Outline - dashed border style
        outline:
          "bg-transparent text-foreground border border-dashed border-[var(--color-base-500)] hover:border-[var(--accent-100)] hover:text-[var(--accent-100)]",
        // Secondary
        secondary:
          "bg-[var(--color-base-1000)] text-[var(--color-light-base-primary)] border border-dashed border-[var(--color-base-500)] hover:bg-transparent hover:text-foreground dark:bg-transparent dark:text-[var(--color-light-base-primary)] dark:hover:bg-white dark:hover:text-[var(--color-dark-base-primary)]",
        // Ghost - minimal
        ghost: "bg-transparent text-foreground hover:text-[var(--accent-100)]",
        // Link-style
        link: "bg-transparent text-[var(--accent-100)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-[31px] px-[14px] has-[>svg]:px-3",
        sm: "h-[25px] px-3 gap-1.5",
        lg: "h-9 px-6",
        icon: "size-8",
        "icon-sm": "size-7",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
