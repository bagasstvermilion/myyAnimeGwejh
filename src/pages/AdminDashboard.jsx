import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Spinner from '../components/Spinner'
import AdminSidebar from '../components/AdminSidebar'

export default function AdminDashboard() {
  const { user, isAdmin, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1440px] px-8 lg:px-14">
        <Spinner label="Memuat..." />
      </div>
    )
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />
  }

  return (
    <div>
      <AdminSidebar />
      <div className="pl-14">
        <div className="px-8 py-12 lg:px-14">
          <h1 className="font-display text-2xl font-semibold text-zinc-900">
            Dashboard Admin
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Kelola akses dan pengaturan aplikasi.
          </p>

          <div className="mt-8">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}
