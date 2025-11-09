import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        // Solid primary pill
        default:
          'bg-primary text-primary-foreground border border-primary/70 hover:bg-primary/90',
        // Destructive pill
        destructive:
          'bg-destructive text-white border border-destructive/80 hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        // Outline pill (company style: dark surface, subtle border)
        outline:
          'bg-background text-foreground border border-border hover:bg-muted',
        // Soft secondary pill
        secondary:
          'bg-secondary text-secondary-foreground border border-secondary-foreground/10 hover:bg-secondary/80',
        // Ghost still minimal but with pill shape
        ghost:
          'bg-transparent text-foreground hover:bg-muted dark:hover:bg-accent/50',
        // Link-style, no pill background
        link: 'bg-transparent text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-6 has-[>svg]:px-4',
        sm: 'h-8 px-4 gap-1.5',
        lg: 'h-11 px-8',
        icon: 'size-9',
        'icon-sm': 'size-8',
        'icon-lg': 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
