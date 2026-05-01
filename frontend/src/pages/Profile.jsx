import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Building2, CalendarDays, Mail, Phone, Shield, User, Utensils } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import Spinner from '../components/common/Spinner'
import { getMyReservations } from '../api/reservations'
import { getOwnerRestaurants } from '../api/owner'
import { getCategories, getRestaurants } from '../api/restaurants'
import { adaptRestaurant } from '../api/adapters'

const ROLE_LABELS = {
  client: 'Cliente',
  owner: 'Propietario',
  admin: 'Administrador',
}

const ROLE_STYLES = {
  client: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
  owner: 'bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300',
  admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300',
}

export default function Profile() {
  const { user, loading } = useAuth()
  const role = user?.role ?? 'client'

  const reservationsQuery = useQuery({
    queryKey: ['profile-reservations'],
    queryFn: () => getMyReservations().then(res => res.data ?? []),
    enabled: !!user && role === 'client',
  })

  const ownerRestaurantsQuery = useQuery({
    queryKey: ['profile-owner-restaurants'],
    queryFn: () => getOwnerRestaurants().then(res => (res.data ?? res).map(adaptRestaurant)),
    enabled: !!user && role === 'owner',
  })

  const adminRestaurantsQuery = useQuery({
    queryKey: ['profile-admin-restaurants'],
    queryFn: () => getRestaurants({ per_page: 1 }),
    enabled: !!user && role === 'admin',
  })

  const adminCategoriesQuery = useQuery({
    queryKey: ['profile-admin-categories'],
    queryFn: () => getCategories(),
    enabled: !!user && role === 'admin',
  })

  if (loading) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>

  if (!user) return (
    <div className="text-center py-24 px-4">
      <User className="w-14 h-14 mx-auto text-stone-300 mb-4" />
      <h1 className="font-display text-2xl font-bold mb-2">Perfil</h1>
      <p className="text-stone-500 mb-4">Inicia sesion para ver la informacion de tu cuenta.</p>
      <Link to="/login" className="btn-primary">Iniciar sesion</Link>
    </div>
  )

  const displayName = user.name ?? user.nombre ?? 'Usuario'
  const reservations = reservationsQuery.data ?? []
  const ownerRestaurants = ownerRestaurantsQuery.data ?? []
  const adminTotalRestaurants = adminRestaurantsQuery.data?.meta?.total ?? adminRestaurantsQuery.data?.total ?? 0
  const adminCategories = adminCategoriesQuery.data ?? []

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        <aside className="card p-6 h-fit">
          <div className="w-16 h-16 rounded-2xl bg-primary-500 text-white flex items-center justify-center text-2xl font-bold mb-5">
            {displayName[0]?.toUpperCase()}
          </div>
          <h1 className="font-display text-2xl font-bold">{displayName}</h1>
          <span className={`inline-flex mt-3 text-xs font-semibold px-3 py-1 rounded-full ${ROLE_STYLES[role] ?? ROLE_STYLES.client}`}>
            {ROLE_LABELS[role] ?? role}
          </span>

          <div className="space-y-3 mt-6 text-sm">
            <div className="flex items-center gap-3 text-stone-600 dark:text-stone-300">
              <Mail className="w-4 h-4 text-primary-500" />
              <span className="break-all">{user.email}</span>
            </div>
            <div className="flex items-center gap-3 text-stone-600 dark:text-stone-300">
              <Phone className="w-4 h-4 text-primary-500" />
              <span>{user.phone || 'Sin telefono registrado'}</span>
            </div>
            <div className="flex items-center gap-3 text-stone-600 dark:text-stone-300">
              <Shield className="w-4 h-4 text-primary-500" />
              <span>ID de usuario #{user.id}</span>
            </div>
          </div>
        </aside>

        <main className="space-y-6">
          {role === 'client' && (
            <section className="card p-6">
              <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                  <h2 className="font-display text-xl font-semibold">Actividad de cliente</h2>
                  <p className="text-sm text-stone-500">Tus reservas y accesos rapidos.</p>
                </div>
                <Link to="/mis-reservas" className="btn-outline text-sm">Ver reservas</Link>
              </div>
              {reservationsQuery.isLoading ? <Spinner /> : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Stat icon={CalendarDays} label="Reservas registradas" value={reservations.length} />
                  <Stat icon={Utensils} label="Rol activo" value="Cliente" />
                </div>
              )}
            </section>
          )}

          {role === 'owner' && (
            <section className="card p-6">
              <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                  <h2 className="font-display text-xl font-semibold">Informacion de propietario</h2>
                  <p className="text-sm text-stone-500">Restaurantes asociados a tu cuenta.</p>
                </div>
                <Link to="/propietario" className="btn-primary text-sm">Administrar platos</Link>
              </div>
              {ownerRestaurantsQuery.isLoading ? <Spinner /> : (
                <div className="space-y-3">
                  <Stat icon={Building2} label="Restaurantes asignados" value={ownerRestaurants.length} />
                  {ownerRestaurants.map(restaurant => (
                    <Link key={restaurant.id} to={`/restaurantes/${restaurant.id}`}
                      className="block rounded-2xl border border-stone-100 dark:border-stone-700 p-4 hover:border-primary-300 transition-colors">
                      <p className="font-semibold">{restaurant.nombre}</p>
                      <p className="text-sm text-stone-500 mt-1">{restaurant.direccion}</p>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          )}

          {role === 'admin' && (
            <section className="card p-6">
              <div className="mb-5">
                <h2 className="font-display text-xl font-semibold">Resumen de administrador</h2>
                <p className="text-sm text-stone-500">Vista general de datos publicos de la plataforma.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Stat icon={Building2} label="Restaurantes" value={adminTotalRestaurants} loading={adminRestaurantsQuery.isLoading} />
                <Stat icon={Utensils} label="Categorias" value={adminCategories.length} loading={adminCategoriesQuery.isLoading} />
                <Stat icon={Shield} label="Rol activo" value="Admin" />
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  )
}

function Stat({ icon: Icon, label, value, loading }) {
  return (
    <div className="rounded-2xl border border-stone-100 dark:border-stone-700 p-4 bg-white dark:bg-stone-800">
      <div className="flex items-center gap-2 text-stone-500 text-sm mb-3">
        <Icon className="w-4 h-4 text-primary-500" />
        {label}
      </div>
      <div className="font-display text-2xl font-bold">
        {loading ? <LoaderText /> : value}
      </div>
    </div>
  )
}

function LoaderText() {
  return <span className="inline-block h-7 w-16 rounded-lg bg-stone-200 dark:bg-stone-700 animate-pulse" />
}
