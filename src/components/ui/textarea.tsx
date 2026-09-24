import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[120px] w-full rounded-3xl border border-transparent bg-muted px-4 py-3 font-sans text-sm text-foreground ring-offset-background placeholder:text-muted-foreground transition-colors duration-300 focus-visible:border-sage focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/40 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
