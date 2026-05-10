import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ChefHat, Eye, Loader2, Plus, Save, Trash2, Utensils, CalendarDays, Users, Clock, CheckCircle, XCircle, RefreshCw, BarChart2 } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import { useAuth } from '../hooks/useAuth'
import Spinner from '../components/common/Spinner'
import ImageUploader from '../components/common/ImageUploader'
import { adaptMenuItem, adaptRestaurant } from '../api/adapters'
import {
  createMenuItem, deleteMenuItem, getOwnerMenu,
  getOwnerRestaurants, updateMenuItem,
  getOwnerReservations, scanOwnerReservation, updateReservationStatus,
} from '../api/owner'
import OwnerStats from '../components/owner/OwnerStats'
import ReservationScanner from '../components/owner/ReservationScanner'

const EMPTY_FORM = { name: '', category: 'Principal', price: '', description: '', image_url: '', is_available: true }

const STATUS_BADGE = {
  confirmed: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  pending:   'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
  completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  cancelled: 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400',
}
const STATUS_LABEL = { confirmed: 'Confirmada', pending: 'Pendiente', completed: 'Completada', cancelled: 'Cancelada' }

export default function OwnerDashboard() {
  const { user, loading } = useAuth()
  const queryClient = useQueryClient()
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [activeTab, setActiveTab] = useState('menu')
  const [resFilter, setResFilter] = useState('')
  const [scanResult, setScanResult] = useState(null)

  const isOwner = user?.role === 'owner'

  const restaurantsQuery = useQuery({
    queryKey: ['owner-restaurants'],
    queryFn: () => getOwnerRestaurants().then(res => (res.data ?? res).map(adaptRestaurant)),
    enabled: !!isOwner,
  })
  const restaurants = restaurantsQuery.data ?? []

  useEffect(() => {
    if (!selectedRestaurantId && restaurants.length) setSelectedRestaurantId(restaurants[0].id)
  }, [restaurants, selectedRestaurantId])

  useEffect(() => {
    setScanResult(null)
  }, [selectedRestaurantId])

  const selectedRestaurant = useMemo(
    () => restaurants.find(r => r.id === Number(selectedRestaurantId)),
    [restaurants, selectedRestaurantId]
  )

  const menuQuery = useQuery({
    queryKey: ['owner-menu', selectedRestaurantId],
    queryFn: () => getOwnerMenu(selectedRestaurantId).then(res => (res.data ?? res).map(adaptMenuItem)),
    enabled: !!(isOwner && selectedRestaurantId),
  })
  const menuItems = menuQuery.data ?? []

  const reservationsQuery = useQuery({
    queryKey: ['owner-reservations', selectedRestaurantId, resFilter],
    queryFn: () => getOwnerReservations(selectedRestaurantId, resFilter).then(r => r.data ?? []),
    enabled: !!(isOwner && selectedRestaurantId && activeTab === 'reservations'),
  })
  const reservations = reservationsQuery.data ?? []

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => updateReservationStatus(id, status),
    onSuccess: () => {
      toast.success('Estado actualizado')
      queryClient.invalidateQueries({ queryKey: ['owner-reservations', selectedRestaurantId] })
    },
    onError: () => toast.error('No se pudo actualizar'),
  })

  const scanMutation = useMutation({
    mutationFn: ({ code, complete = false }) => scanOwnerReservation(selectedRestaurantId, code, complete),
    onSuccess: (data, variables) => {
      setScanResult(data)
      toast.success(variables.complete ? 'Llegada validada' : 'Reserva encontrada')
      queryClient.invalidateQueries({ queryKey: ['owner-reservations', selectedRestaurantId] })
      queryClient.invalidateQueries({ queryKey: ['owner-restaurants'] })
    },
    onError: (err) => {
      setScanResult(null)
      toast.error(err.response?.data?.message || 'No se pudo validar el codigo')
    },
  })

  const resetForm = () => { setEditingId(null); setForm(EMPTY_FORM) }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...form, price: Number(form.price) }
      return editingId ? updateMenuItem(editingId, payload) : createMenuItem(selectedRestaurantId, payload)
    },
    onSuccess: () => {
      toast.success(editingId ? 'Plato actualizado' : 'Plato agregado')
      queryClient.invalidateQueries({ queryKey: ['owner-menu', selectedRestaurantId] })
      queryClient.invalidateQueries({ queryKey: ['owner-restaurants'] })
      resetForm()
    },
    onError: (err) => toast.error(err.response?.data?.message || 'No se pudo guardar el plato'),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteMenuItem,
    onSuccess: () => {
      toast.success('Plato eliminado')
      queryClient.invalidateQueries({ queryKey: ['owner-menu', selectedRestaurantId] })
      queryClient.invalidateQueries({ queryKey: ['owner-restaurants'] })
      if (editingId) resetForm()
    },
    onError: () => toast.error('No se pudo eliminar el plato'),
  })

  const toggleAvailability = (item) => {
    updateMenuItem(item.id, { is_available: !item.disponible })
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['owner-menu', selectedRestaurantId] })
        queryClient.invalidateQueries({ queryKey: ['owner-restaurants'] })
      })
      .catch(() => toast.error('No se pudo cambiar la disponibilidad'))
  }

  const editItem = (item) => {
    setEditingId(item.id)
    setForm({ name: item.nombre, category: item.categoria, price: String(item.precio), description: item.descripcion, image_url: item.imagen, is_available: item.disponible })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!selectedRestaurantId) return toast.error('Selecciona un restaurante')
    if (!form.name.trim()) return toast.error('El nombre del plato es requerido')
    if (Number(form.price) < 0 || form.price === '') return toast.error('Ingresa un precio valido')
    saveMutation.mutate()
  }

  if (loading) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>

  if (!user) return (
    <div className="text-center py-24 px-4">
      <p className="text-stone-500 mb-4">Inicia sesion como propietario para administrar platos.</p>
      <Link to="/login" className="btn-primary">Iniciar sesion</Link>
    </div>
  )

  if (!isOwner) return (
    <div className="text-center py-24 px-4">
      <Utensils className="w-14 h-14 mx-auto text-stone-300 mb-4" />
      <h1 className="font-display text-2xl font-bold mb-2">Panel solo para propietarios</h1>
      <p className="text-stone-500">Esta seccion esta disponible unicamente para cuentas con rol owner.</p>
    </div>
  )

  if (restaurantsQuery.isLoading) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-primary-500 font-semibold text-sm mb-2">
            <ChefHat className="w-4 h-4" /> Panel propietario
          </div>
          <h1 className="font-display text-3xl font-bold">Mi restaurante</h1>
          <p className="text-stone-500 mt-1">Gestiona el menú y las reservas de tus restaurantes.</p>
        </div>
        {selectedRestaurant && (
          <Link to={`/restaurantes/${selectedRestaurant.id}`} className="btn-outline inline-flex items-center gap-2 justify-center text-sm">
            <Eye className="w-4 h-4" /> Ver público
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-stone-100 dark:bg-stone-800 rounded-2xl p-1 mb-6 w-fit">
        {[
          { id: 'menu',         label: 'Menú',         icon: ChefHat },
          { id: 'reservations', label: 'Reservas',     icon: CalendarDays },
          { id: 'stats',        label: 'Estadísticas', icon: BarChart2 },
        ].map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={clsx('flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all',
              activeTab === id ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm' : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300')}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {!restaurants.length ? (
        <div className="card p-8 text-center">
          <p className="text-stone-500">Tu cuenta no tiene restaurantes asignados todavia.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          {/* Sidebar */}
          <aside className="space-y-3">
            {restaurants.map(restaurant => (
              <button key={restaurant.id}
                onClick={() => { setSelectedRestaurantId(restaurant.id); resetForm() }}
                className={clsx('w-full text-left p-4 rounded-2xl border transition-all bg-white dark:bg-stone-800',
                  selectedRestaurantId === restaurant.id ? 'border-primary-500 shadow-lg shadow-primary-500/10' : 'border-stone-100 dark:border-stone-700 hover:border-primary-300')}>
                <p className="font-semibold text-stone-900 dark:text-stone-100">{restaurant.nombre}</p>
                <p className="text-xs text-stone-500 mt-1">{restaurant.zona || restaurant.direccion}</p>
                <p className="text-xs text-primary-500 mt-2">{restaurant.menu?.length ?? 0} platos visibles</p>
              </button>
            ))}
          </aside>

          {/* Tab: Menú */}
          {activeTab === 'menu' && (
            <section className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
              <div className="card p-6">
                <div className="flex items-center justify-between gap-3 mb-5">
                  <div>
                    <h2 className="font-display font-semibold text-xl">{selectedRestaurant?.nombre}</h2>
                    <p className="text-sm text-stone-500">Menu del restaurante</p>
                  </div>
                  {menuQuery.isFetching && <Loader2 className="w-5 h-5 animate-spin text-primary-500" />}
                </div>
                {!menuItems.length ? (
                  <div className="border border-dashed border-stone-200 dark:border-stone-700 rounded-2xl p-8 text-center text-stone-500">
                    Aun no hay platos. Agrega el primero desde el formulario.
                  </div>
                ) : (
                  <div className="divide-y divide-stone-100 dark:divide-stone-700">
                    {menuItems.map(item => (
                      <div key={item.id} className="py-4 flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-stone-900 dark:text-stone-100">{item.nombre}</h3>
                            <span className={clsx('text-[11px] font-semibold px-2 py-0.5 rounded-full',
                              item.disponible ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-stone-100 text-stone-500 dark:bg-stone-700 dark:text-stone-400')}>
                              {item.disponible ? 'Visible' : 'Oculto'}
                            </span>
                          </div>
                          <p className="text-xs text-stone-500 mt-1">{item.categoria}</p>
                          {item.descripcion && <p className="text-sm text-stone-500 mt-2 line-clamp-2">{item.descripcion}</p>}
                          <p className="font-semibold text-primary-500 mt-2">${Number(item.precio).toLocaleString('es-CO')}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button onClick={() => toggleAvailability(item)} className="btn-outline px-3 py-1.5 text-xs">
                            {item.disponible ? 'Ocultar' : 'Mostrar'}
                          </button>
                          <button onClick={() => editItem(item)} className="btn-primary px-3 py-1.5 text-xs">Editar</button>
                          <button onClick={() => deleteMutation.mutate(item.id)} disabled={deleteMutation.isPending}
                            className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" aria-label="Eliminar plato">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} className="card p-6 h-fit space-y-4">
                <div className="flex items-center gap-2">
                  {editingId ? <Save className="w-5 h-5 text-primary-500" /> : <Plus className="w-5 h-5 text-primary-500" />}
                  <h2 className="font-display font-semibold text-lg">{editingId ? 'Editar plato' : 'Nuevo plato'}</h2>
                </div>
                <label className="block">
                  <span className="text-sm font-medium text-stone-700 dark:text-stone-300">Nombre</span>
                  <input className="input-base mt-1.5" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Pizza margarita" />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-stone-700 dark:text-stone-300">Categoria</span>
                  <input className="input-base mt-1.5" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="Principal" />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-stone-700 dark:text-stone-300">Precio</span>
                  <input type="number" min="0" step="100" className="input-base mt-1.5" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="28000" />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-stone-700 dark:text-stone-300">Imagen del plato</span>
                  <ImageUploader
                    currentUrl={form.image_url}
                    onUpload={(url) => setForm({ ...form, image_url: url })}
                    label="Subir foto del plato"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-stone-700 dark:text-stone-300">Descripcion</span>
                  <textarea rows={3} className="input-base resize-none mt-1.5" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Ingredientes, preparacion, notas..." />
                </label>
                <label className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 dark:border-stone-700 p-3">
                  <span className="text-sm font-medium">Visible para clientes</span>
                  <input type="checkbox" checked={form.is_available} onChange={e => setForm({ ...form, is_available: e.target.checked })} />
                </label>
                <div className="flex gap-2">
                  {editingId && <button type="button" onClick={resetForm} className="btn-outline flex-1">Cancelar</button>}
                  <button type="submit" disabled={saveMutation.isPending} className="btn-primary flex-1 flex items-center justify-center gap-2">
                    {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Guardar
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* Tab: Reservas */}
          {activeTab === 'reservations' && (
            <section className="card p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                  <h2 className="font-display font-semibold text-xl">{selectedRestaurant?.nombre}</h2>
                  <p className="text-sm text-stone-500">
                    {reservations.length} {reservations.length === 1 ? 'reserva' : 'reservas'}
                    {resFilter ? ` · ${STATUS_LABEL[resFilter] ?? resFilter}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select value={resFilter} onChange={e => setResFilter(e.target.value)} className="input-base text-sm py-1.5">
                    <option value="">Todas</option>
                    <option value="confirmed">Confirmadas</option>
                    <option value="pending">Pendientes</option>
                    <option value="completed">Completadas</option>
                    <option value="cancelled">Canceladas</option>
                  </select>
                  <button onClick={() => reservationsQuery.refetch()} disabled={reservationsQuery.isFetching}
                    className="btn-outline p-2" aria-label="Actualizar">
                    <RefreshCw className={clsx('w-4 h-4', reservationsQuery.isFetching && 'animate-spin')} />
                  </button>
                </div>
              </div>

              <ReservationScanner
                restaurantName={selectedRestaurant?.nombre}
                loading={scanMutation.isPending}
                result={scanResult}
                onScan={(code) => scanMutation.mutate({ code })}
                onComplete={(reservation) => scanMutation.mutate({ code: reservation.code, complete: true })}
              />

              {reservationsQuery.isLoading ? (
                <div className="flex justify-center py-12"><Spinner size="lg" /></div>
              ) : !reservations.length ? (
                <div className="border border-dashed border-stone-200 dark:border-stone-700 rounded-2xl p-10 text-center text-stone-500">
                  <CalendarDays className="w-10 h-10 mx-auto mb-3 text-stone-300" />
                  <p className="font-medium">No hay reservas{resFilter ? ' con ese estado' : ''}</p>
                  <p className="text-sm mt-1">Las reservas de los clientes aparecerán aquí.</p>
                </div>
              ) : (
                <div className="divide-y divide-stone-100 dark:divide-stone-700">
                  {reservations.map(r => (
                    <div key={r.id} className="py-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-stone-900 dark:text-stone-100">{r.guest_name}</span>
                          <span className={clsx('text-[11px] font-semibold px-2 py-0.5 rounded-full', STATUS_BADGE[r.status] ?? 'bg-stone-100 text-stone-500')}>
                            {STATUS_LABEL[r.status] ?? r.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-stone-500">
                          {r.start_time && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {new Date(r.start_time).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}
                            </span>
                          )}
                          {r.guests && (
                            <span className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5" />
                              {r.guests} {r.guests === 1 ? 'persona' : 'personas'}
                            </span>
                          )}
                          {r.table && (
                            <span className="flex items-center gap-1">
                              <Utensils className="w-3.5 h-3.5" />
                              {r.table}
                            </span>
                          )}
                        </div>
                        {r.notes && <p className="text-sm text-stone-400 italic">"{r.notes}"</p>}
                        {r.guest_email && <p className="text-xs text-stone-400">{r.guest_email}</p>}
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {r.status === 'pending' && (
                          <button onClick={() => statusMutation.mutate({ id: r.id, status: 'confirmed' })} disabled={statusMutation.isPending}
                            className="btn-primary px-3 py-1.5 text-xs flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> Confirmar
                          </button>
                        )}
                        {r.status === 'confirmed' && (
                          <button onClick={() => statusMutation.mutate({ id: r.id, status: 'completed' })} disabled={statusMutation.isPending}
                            className="btn-outline px-3 py-1.5 text-xs flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> Completar
                          </button>
                        )}
                        {r.status !== 'cancelled' && r.status !== 'completed' && (
                          <button onClick={() => statusMutation.mutate({ id: r.id, status: 'cancelled' })} disabled={statusMutation.isPending}
                            className="px-3 py-1.5 text-xs rounded-lg text-red-500 border border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20 transition-colors flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" /> Cancelar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
          {/* Tab: Estadísticas */}
          {activeTab === 'stats' && (
            <section>
              <OwnerStats
                restaurantId={selectedRestaurantId}
                restaurantName={selectedRestaurant?.nombre}
              />
            </section>
          )}
        </div>
      )}
    </div>
  )
}
