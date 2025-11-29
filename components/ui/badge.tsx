import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-[2px] border border-dashed px-2 py-0.5 text-xs font-medium uppercase tracking-wide w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-[var(--accent-100)] bg-transparent text-[var(--accent-100)] [a&]:hover:bg-[var(--accent-100)] [a&]:hover:text-[var(--color-dark-base-primary)]",
        secondary:
          "border-[var(--color-base-500)] bg-transparent text-[var(--color-base-400)] [a&]:hover:border-[var(--accent-100)] [a&]:hover:text-[var(--accent-100)]",
        destructive:
          "border-destructive bg-transparent text-destructive [a&]:hover:bg-destructive [a&]:hover:text-white focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        outline:
          "border-[var(--color-base-500)] text-foreground [a&]:hover:border-[var(--accent-100)] [a&]:hover:text-[var(--accent-100)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
