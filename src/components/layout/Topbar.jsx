import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import personIcon from "@/assets/icons/person_icons.svg";
import { authStorage } from "@/lib/authStorage";

function displayName(user) {
  return user?.nama_lengkap || user?.name || user?.email || "Admin";
}

export default function Topbar({ onMenuClick }) {
  const date = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
  const [user, setUser] = useState(() => authStorage.getUser());

  useEffect(() => {
    const refreshUser = () => setUser(authStorage.getUser());
    window.addEventListener("admin-auth:session-changed", refreshUser);
    window.addEventListener("storage", refreshUser);

    return () => {
      window.removeEventListener("admin-auth:session-changed", refreshUser);
      window.removeEventListener("storage", refreshUser);
    };
  }, []);

  return (
    <header className="flex h-[77px] items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 sm:px-8 lg:px-12">
      <div className="flex min-w-0 items-center">
        <Button
          className="mr-3 p-2 lg:hidden"
          onClick={onMenuClick}
          aria-label="Buka menu"
        >
          <Menu />
        </Button>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold leading-11 text-slate-900 sm:text-2xl">
            Monitoring SAKTI
          </h1>
          <p className="text-xs text-slate-500">{date}</p>
        </div>
      </div>
      <div className="flex min-w-0 shrink items-center gap-3">
        <Avatar className="size-10 bg-[#E62727]">
          {user?.foto_url ? (
            <img
              src={user.foto_url}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            <img
              src={personIcon}
              alt=""
              className="size-[18px] brightness-0 invert"
            />
          )}
        </Avatar>
        <p className="hidden max-w-[220px] truncate text-sm font-semibold text-slate-900 sm:block">
          {displayName(user)}
        </p>
      </div>
    </header>
  );
}
