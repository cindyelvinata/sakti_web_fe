export function DropdownMenu({ children }) {
  return <div className="group relative">{children}</div>;
}
export function DropdownMenuContent({ children }) {
  return (
    <div className="absolute right-0 top-full z-20 mt-2 hidden min-w-40 rounded-xl border bg-white p-2 shadow-lg group-focus-within:block">
      {children}
    </div>
  );
}
