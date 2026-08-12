import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import LogoutDialog from '@/components/dialogs/LogoutDialog'
import { ROUTES } from '@/constants/routes'
import { authStorage } from '@/lib/authStorage'
export default function AdminLayout(){const [open,setOpen]=useState(false);const [logoutOpen,setLogoutOpen]=useState(false);const navigate=useNavigate();useEffect(()=>{const handleUnauthorized=()=>navigate(ROUTES.login,{replace:true});window.addEventListener('admin-auth:unauthorized',handleUnauthorized);return()=>window.removeEventListener('admin-auth:unauthorized',handleUnauthorized)},[navigate]);const confirmLogout=()=>{authStorage.clearSession();setLogoutOpen(false);navigate(ROUTES.login,{replace:true})};return <div className="min-h-screen bg-white"><Sidebar open={open} onClose={()=>setOpen(false)} onLogout={()=>setLogoutOpen(true)}/><div className="lg:pl-[280px]"><Topbar onMenuClick={()=>setOpen(true)}/><main className="p-5 sm:p-8 lg:p-12"><Outlet/></main></div><LogoutDialog open={logoutOpen} onClose={()=>setLogoutOpen(false)} onConfirm={confirmLogout}/></div>}
