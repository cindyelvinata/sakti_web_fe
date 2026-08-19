import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
export default function SidebarMenu({ items, onNavigate }) {
  return (
    <nav className="space-y-1">
      {items.map(({ label, icon, to, onClick }) =>
        onClick ? (
          <button
            key={label}
            type="button"
            onClick={() => {
              onClick();
              onNavigate?.();
            }}
            className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium text-slate-800 transition hover:bg-red-50"
          >
            <img src={icon} alt="" className="size-5 object-contain" />
            <span>{label}</span>
          </button>
        ) : (
          <NavLink
            key={label}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium text-slate-800 transition hover:bg-red-50",
                isActive && "bg-[#FBC0C0] text-slate-950",
              )
            }
          >
            <img src={icon} alt="" className="size-5 object-contain" />
            <span>{label}</span>
          </NavLink>
        ),
      )}
    </nav>
  );
}
