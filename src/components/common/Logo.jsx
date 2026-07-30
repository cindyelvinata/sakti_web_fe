import logoSakti from '@/assets/images/logo_sakti.svg'
export default function Logo(){return <div className="flex items-center gap-3"><img src={logoSakti} alt="Logo SAKTI" className="h-10 w-auto object-contain"/><div><p className="text-lg font-bold leading-4 text-slate-950">SAKTI</p><p className="text-xs text-slate-500">Halaman Admin</p></div></div>}
