import { X } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import Logo from "@/components/common/Logo";
import SidebarMenu from "./SidebarMenu";
import { Button } from "@/components/ui/button";
import dashboardIcon from "@/assets/icons/dashboard_icons.svg";
import presensiIcon from "@/assets/icons/presensi_icon.svg";
import cutiIcon from "@/assets/icons/cuti_icons.svg";
import karyawanIcon from "@/assets/icons/kelolakaryawan_icons.svg";
import pengaturanIcon from "@/assets/icons/pengaturan_icons.svg";
import logoutIcon from "@/assets/icons/logout_icons.svg";

const main = [
  { label: "Dashboard", icon: dashboardIcon, to: ROUTES.dashboard },
  { label: "Laporan Presensi", icon: presensiIcon, to: ROUTES.laporanPresensi },
  { label: "Laporan Cuti", icon: cutiIcon, to: ROUTES.laporanCuti },
  { label: "Kelola Karyawan", icon: karyawanIcon, to: ROUTES.kelolaKaryawan },
];

export default function Sidebar({ open, onClose, onLogout }) {
  const system = [
    { label: "Pengaturan", icon: pengaturanIcon, to: ROUTES.pengaturan },
    { label: "Log Out", icon: logoutIcon, onClick: onLogout },
  ];

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-slate-950/40 transition lg:hidden ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={onClose}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[280px] flex-col border-r border-slate-200 bg-[#F9FAFC] transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-[77px] items-center justify-between border-b border-slate-200 px-10">
          <Logo />
          <Button
            className="p-1 lg:hidden"
            onClick={onClose}
            aria-label="Tutup menu"
          >
            <X />
          </Button>
        </div>
        <div className="flex flex-1 flex-col overflow-y-auto px-10 py-8">
          <p className="mb-3 text-sm font-bold uppercase">Menu Utama</p>
          <SidebarMenu items={main} onNavigate={onClose} />
          <p className="mb-3 mt-6 text-sm font-bold uppercase">Sistem</p>
          <SidebarMenu items={system} onNavigate={onClose} />
        </div>
      </aside>
    </>
  );
}
