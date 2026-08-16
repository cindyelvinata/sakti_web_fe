import logoSakti from '@/assets/images/logo_sakti.svg'
export default function Logo(){return <div className="flex items-center gap-5"><img src={logoSakti} alt="Logo SAKTI" className="h-16 w-auto object-contain"/><div><p className="text-lg font-bold leading-7 text-slate-950">SAKTI</p><p className="text-xs text-slate-500">Halaman Admin</p></div></div>}
