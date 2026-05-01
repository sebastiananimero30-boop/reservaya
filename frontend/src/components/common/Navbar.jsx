import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Moon, Sun, Menu, X, User, CalendarDays, LogOut, Utensils, ShieldCheck } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'

export default function Navbar({ dark, setDark }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const handleSearch = (e) => {
    e.preventDefault()
    if (search.trim()) navigate(`/?search=${encodeURIComponent(search.trim())}`)
  }

  const handleLogout = () => {
    logout()
    toast.success('Sesión cerrada')
    navigate('/')
    setUserMenuOpen(false)
  }

  return (
    <nav className="sticky top-0 z-50 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border-b border-stone-200 dark:border-stone-700">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold text-primary-500 flex-shrink-0">
          <span className="w-2.5 h-2.5 rounded-full bg-primary-500 inline-block" />
          ReservaYa
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md hidden md:flex items-center relative">
          <Search className="absolute left-3 w-4 h-4 text-stone-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar restaurantes, cocinas, zonas..."
            className="input-base pl-10 h-10 text-sm"
          />
        </form>

        <div className="flex-1 md:hidden" />

        {/* Dark mode */}
        <button
          onClick={() => setDark(d => !d)}
          className="p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          aria-label="Cambiar tema"
        >
          {dark ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-stone-500" />}
        </button>

        {/* Auth buttons */}
        {user ? (
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(o => !o)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-primary-500 flex items-center justify-center text-white text-xs font-semibold">
                {(user.name ?? user.nombre)?.[0]?.toUpperCase() || 'U'}
              </div>
              <span className="hidden md:block text-sm font-medium">{(user.name ?? user.nombre)?.split(' ')[0]}</span>
            </button>
            <AnimatePresence>
              {userMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  className="absolute right-0 top-12 w-48 bg-white dark:bg-stone-800 rounded-2xl shadow-2xl border border-stone-100 dark:border-stone-700 overflow-hidden"
                >
                  <Link to="/mis-reservas" onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50 dark:hover:bg-stone-700 text-sm transition-colors">
                    <CalendarDays className="w-4 h-4 text-primary-500" /> Mis Reservas
                  </Link>
                  {user.role === 'owner' && (
                    <Link to="/propietario" onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50 dark:hover:bg-stone-700 text-sm transition-colors">
                      <Utensils className="w-4 h-4 text-primary-500" /> Panel propietario
                    </Link>
                  )}
                  {user.role === 'admin' && (
                    <Link to="/admin" onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50 dark:hover:bg-stone-700 text-sm transition-colors">
                      <ShieldCheck className="w-4 h-4 text-primary-500" /> Panel admin
                    </Link>
                  )}
                  <Link to="/perfil" onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50 dark:hover:bg-stone-700 text-sm transition-colors">
                    <User className="w-4 h-4 text-primary-500" /> Mi Perfil
                  </Link>
                  <button onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm text-red-500 transition-colors">
                    <LogOut className="w-4 h-4" /> Cerrar Sesión
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-2">
            <Link to="/login" className="btn-outline py-2 text-sm">Iniciar sesión</Link>
            <Link to="/registro" className="btn-primary py-2 text-sm">Registrarse</Link>
          </div>
        )}

        {/* Mobile menu */}
        <button onClick={() => setMenuOpen(o => !o)} className="md:hidden p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800">
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile search */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-t border-stone-200 dark:border-stone-700 overflow-hidden"
          >
            <div className="px-4 py-3 space-y-3">
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar..." className="input-base pl-10 h-10 text-sm" />
              </form>
              {!user && (
                <div className="flex gap-2">
                  <Link to="/login" onClick={() => setMenuOpen(false)} className="btn-outline py-2 text-sm flex-1 text-center">Iniciar sesión</Link>
                  <Link to="/registro" onClick={() => setMenuOpen(false)} className="btn-primary py-2 text-sm flex-1 text-center">Registrarse</Link>
                </div>
              )}
              {user?.role === 'owner' && (
                <Link to="/propietario" onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-center gap-2 btn-primary py-2 text-sm">
                  <Utensils className="w-4 h-4" /> Panel propietario
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
