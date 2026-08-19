import { cn } from "@/lib/utils";
export function Button({ className, children, ...props }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#1E93AB]/40",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
