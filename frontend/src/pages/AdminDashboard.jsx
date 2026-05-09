import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Store, Plus, Trash2, Copy, Check, Eye, EyeOff,
  Loader2, ShieldCheck, X, ChevronDown, Building2, ImagePlus, BarChart2
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Spinner from '../components/common/Spinner'
import ImageUploader from '../components/common/ImageUploader'
import {
  getOwners, createOwner, deleteOwner,
  getAdminRestaurants, createRestaurant, assignOwnerToRestaurant,
  getAdminCategories, updateRestaurantCover,
} from '../api/admin'
import { adaptRestaurant } from '../api/adapters'
import AdminStats from '../components/admin/AdminStats'

const TABS = [
  { id: 'owners',      label: 'Propietarios', icon: Users },
  { id: 'restaurants', label: 'Restaurantes', icon: Store },
  { id: 'stats',       label: 'Estadísticas', icon: BarChart2 },
]

function Modal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white dark:bg-stone-800 rounded-3xl shadow-2xl w-full max-w-md p-6 z-10"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-xl">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  )
}

function CredentialsCard({ email, password, onClose }) {
  const [copied, setCopied] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const copyAll = () => {
    navigator.clipboard.writeText(`Email: ${email}\nContraseña: ${password}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-white dark:bg-stone-800 rounded-3xl shadow-2xl w-full max-w-sm p-6 z-10"
      >
        <div className="text-center mb-5">
          <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-7 h-7 text-green-600" />
          </div>
          <h2 className="font-bold text-xl">¡Propietario creado!</h2>
          <p className="text-stone-500 text-sm mt-1">Guarda estas credenciales. La contraseña no se mostrará de nuevo.</p>
        </div>
        <div className="space-y-3 mb-5">
          <div className="bg-stone-50 dark:bg-stone-700 rounded-xl p-3">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1">Email</p>
            <p className="font-mono text-sm font-medium text-stone-800 dark:text-stone-200">{email}</p>
          </div>
          <div className="bg-stone-50 dark:bg-stone-700 rounded-xl p-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Contraseña</p>
              <button onClick={() => setShowPass(s => !s)} className="text-stone-400 hover:text-stone-600">
                {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="font-mono text-sm font-medium text-stone-800 dark:text-stone-200">
              {showPass ? password : '•'.repeat(password.length)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={copyAll}
            className="flex-1 flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copiado' : 'Copiar todo'}
          </button>
          <button onClick={onClose}
            className="flex-1 border-2 border-stone-200 dark:border-stone-600 rounded-xl py-2.5 text-sm font-semibold hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors">
            Cerrar
          </button>
          
        </div>
      </motion.div>
    </div>
  )
}
function OwnersTab() {
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [credentials, setCredentials] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['admin-owners'],
    queryFn: () => getOwners().then(r => r.data),
  })
  const owners = data ?? []

  const createMutation = useMutation({
    mutationFn: () => createOwner(form),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['admin-owners'] })
      setShowModal(false)
      setForm({ name: '', email: '', phone: '' })
      setCredentials({ email: res.owner.email, password: res.password })
      toast.success('Propietario creado')
    },
    onError: (err) => {
      const msg = err.response?.data?.errors?.email?.[0] || err.response?.data?.message || 'Error al crear propietario'
      toast.error(msg)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteOwner,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-owners'] }); toast.success('Propietario eliminado') },
    onError: () => toast.error('No se pudo eliminar'),
  })

  if (isLoading) return <div className="flex justify-center py-16"><Spinner /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-stone-500 text-sm"><strong className="text-stone-800 dark:text-stone-200">{owners.length}</strong> propietarios registrados</p>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> Nuevo propietario
        </button>
      </div>

      {!owners.length ? (
        <div className="border-2 border-dashed border-stone-200 dark:border-stone-700 rounded-2xl p-12 text-center text-stone-400">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>No hay propietarios aún. Crea el primero.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {owners.map(owner => (
            <div key={owner.id} className="bg-white dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-2xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-600 font-bold text-sm">{owner.name?.charAt(0).toUpperCase()}</span>
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-stone-900 dark:text-stone-100 truncate">{owner.name}</p>
                  <p className="text-xs text-stone-500 truncate">{owner.email}</p>
                  {owner.phone && <p className="text-xs text-stone-400">{owner.phone}</p>}
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-xs bg-stone-100 dark:bg-stone-700 text-stone-500 px-2.5 py-1 rounded-full">
                  {owner.restaurants_count ?? 0} restaurante{owner.restaurants_count !== 1 ? 's' : ''}
                </span>
                <button
                  onClick={() => { if (confirm(`¿Eliminar a ${owner.name}?`)) deleteMutation.mutate(owner.id) }}
                  disabled={deleteMutation.isPending}
                  className="p-2 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <Modal open={showModal} onClose={() => setShowModal(false)} title="Nuevo propietario">
            <form onSubmit={e => { e.preventDefault(); if (!form.name.trim() || !form.email.trim()) return toast.error('Nombre y email requeridos'); createMutation.mutate() }} className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-stone-700 dark:text-stone-300">Nombre completo *</span>
                <input className="input-base mt-1.5" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Carlos Rodríguez" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-stone-700 dark:text-stone-300">Email *</span>
                <input type="email" className="input-base mt-1.5" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="carlos@mirestaurante.com" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-stone-700 dark:text-stone-300">Teléfono</span>
                <input className="input-base mt-1.5" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+57 310 000 0000" />
              </label>
              <p className="text-xs text-stone-400 bg-stone-50 dark:bg-stone-700 rounded-xl p-3">
                🔐 Se generará una contraseña automáticamente. Podrás copiarla al crear la cuenta.
              </p>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowModal(false)} className="btn-outline flex-1">Cancelar</button>
                <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Crear
                </button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      {credentials && <CredentialsCard email={credentials.email} password={credentials.password} onClose={() => setCredentials(null)} />}
    </div>
  )
}

function RestaurantsTab() {
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [coverModal, setCoverModal] = useState(null)
  const [coverUrl, setCoverUrl] = useState('')
  const [form, setForm] = useState({ name: '', description: '', address: '', zone: '', phone: '', category_id: '', owner_id: '', latitude: '', longitude: '', capacity: '40' })

  const { data: restData, isLoading: restLoading } = useQuery({
    queryKey: ['admin-restaurants'],
    queryFn: () => getAdminRestaurants().then(r => r.data.map(adaptRestaurant)),
  })
  const { data: ownersData } = useQuery({ queryKey: ['admin-owners'], queryFn: () => getOwners().then(r => r.data) })
  const { data: catsData }   = useQuery({ queryKey: ['admin-categories'], queryFn: () => getAdminCategories().then(r => r.data) })

  const restaurants = restData ?? []
  const owners      = ownersData ?? []
  const categories  = catsData ?? []

  const createMutation = useMutation({
    mutationFn: () => createRestaurant({ ...form, category_id: Number(form.category_id), owner_id: form.owner_id ? Number(form.owner_id) : null, latitude: form.latitude ? Number(form.latitude) : null, longitude: form.longitude ? Number(form.longitude) : null, capacity: Number(form.capacity) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-restaurants'] })
      setShowModal(false)
      setForm({ name: '', description: '', address: '', zone: '', phone: '', category_id: '', owner_id: '', latitude: '', longitude: '', capacity: '40' })
      toast.success('Restaurante creado')
    },
    onError: (err) => {
      const errors = err.response?.data?.errors
      toast.error(errors ? Object.values(errors).flat()[0] : (err.response?.data?.message || 'Error al crear'))
    },
  })

  const assignMutation = useMutation({
    mutationFn: ({ restaurantId, ownerId }) => assignOwnerToRestaurant(restaurantId, ownerId || null),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-restaurants'] }); toast.success('Asignación actualizada') },
    onError: () => toast.error('No se pudo asignar'),
  })

  const coverMutation = useMutation({
    mutationFn: () => updateRestaurantCover(coverModal.id, coverUrl),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-restaurants'] })
      toast.success('Foto actualizada')
      setCoverModal(null); setCoverUrl('')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'URL inválida'),
  })

  if (restLoading) return <div className="flex justify-center py-16"><Spinner /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-stone-500 text-sm"><strong className="text-stone-800 dark:text-stone-200">{restaurants.length}</strong> restaurantes registrados</p>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> Nuevo restaurante
        </button>
      </div>

      {!restaurants.length ? (
        <div className="border-2 border-dashed border-stone-200 dark:border-stone-700 rounded-2xl p-12 text-center text-stone-400">
          <Building2 className="w-10 h-10 mx-auto mb-3 opacity-40" /><p>No hay restaurantes aún.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {restaurants.map(r => (
            <div key={r.id} className="bg-white dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Miniatura */}
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-700 flex-shrink-0">
                {r.foto_portada
                  ? <img src={r.foto_portada} alt={r.nombre} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-stone-900 dark:text-stone-100">{r.nombre}</p>
                  <span className="text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 px-2 py-0.5 rounded-full">{r.categoria}</span>
                </div>
                <p className="text-xs text-stone-500 mt-0.5">{r.direccion} · {r.zona}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => { setCoverModal({ id: r.id, nombre: r.nombre }); setCoverUrl(r.foto_portada || '') }}
                  className="p-2 rounded-lg text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700 hover:text-primary-500 transition-colors" title="Cambiar foto">
                  <ImagePlus className="w-4 h-4" />
                </button>
                <div className="relative">
                  <select defaultValue={r.owner_id ?? ''} onChange={e => assignMutation.mutate({ restaurantId: r.id, ownerId: e.target.value })}
                    className="appearance-none bg-stone-50 dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-xl pl-3 pr-8 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-400 cursor-pointer">
                    <option value="">Sin propietario</option>
                    {owners.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400 pointer-events-none" />
                </div>
                <Link to={`/restaurantes/${r.id}`} className="p-2 rounded-lg text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700 hover:text-stone-600 transition-colors" title="Ver">
                  <Eye className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal foto portada */}
      <AnimatePresence>
        {coverModal && (
          <Modal open={!!coverModal} onClose={() => { setCoverModal(null); setCoverUrl('') }} title="Foto de portada">
            <div className="space-y-4">
              <p className="text-sm text-stone-500">Restaurante: <strong className="text-stone-800 dark:text-stone-200">{coverModal.nombre}</strong></p>

              <ImageUploader
                currentUrl={coverUrl}
                onUpload={(url) => setCoverUrl(url)}
                label="Subir foto de portada"
              />

              {/* También permite pegar URL manualmente */}
              <div>
                <p className="text-xs text-stone-400 mb-1.5">O pega una URL directamente:</p>
                <input
                  className="input-base text-sm"
                  value={coverUrl}
                  onChange={e => setCoverUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                />
              </div>

              <div className="flex gap-2">
                <button type="button" onClick={() => { setCoverModal(null); setCoverUrl('') }} className="btn-outline flex-1">Cancelar</button>
                <button onClick={() => coverMutation.mutate()} disabled={!coverUrl.trim() || coverMutation.isPending}
                  className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {coverMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />} Guardar
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Modal crear restaurante */}
      <AnimatePresence>
        {showModal && (
          <Modal open={showModal} onClose={() => setShowModal(false)} title="Nuevo restaurante">
            <form onSubmit={e => { e.preventDefault(); if (!form.name.trim() || !form.address.trim() || !form.zone.trim() || !form.category_id) return toast.error('Nombre, dirección, zona y categoría son requeridos'); createMutation.mutate() }}
              className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              <label className="block">
                <span className="text-sm font-medium text-stone-700 dark:text-stone-300">Nombre *</span>
                <input className="input-base mt-1" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="La Ricotta Trattoria" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-sm font-medium text-stone-700 dark:text-stone-300">Zona *</span>
                  <input className="input-base mt-1" value={form.zone} onChange={e => setForm({ ...form, zone: e.target.value })} placeholder="El Vergel" />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-stone-700 dark:text-stone-300">Teléfono</span>
                  <input className="input-base mt-1" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+57 315..." />
                </label>
              </div>
              <label className="block">
                <span className="text-sm font-medium text-stone-700 dark:text-stone-300">Dirección *</span>
                <input className="input-base mt-1" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Calle 45 #12-34, El Vergel" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-sm font-medium text-stone-700 dark:text-stone-300">Categoría *</span>
                  <select className="input-base mt-1" value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}>
                    <option value="">Seleccionar...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-stone-700 dark:text-stone-300">Propietario</span>
                  <select className="input-base mt-1" value={form.owner_id} onChange={e => setForm({ ...form, owner_id: e.target.value })}>
                    <option value="">Sin asignar</option>
                    {owners.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-sm font-medium text-stone-700 dark:text-stone-300">Latitud</span>
                  <input type="number" step="any" className="input-base mt-1" value={form.latitude} onChange={e => setForm({ ...form, latitude: e.target.value })} placeholder="4.4389" />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-stone-700 dark:text-stone-300">Longitud</span>
                  <input type="number" step="any" className="input-base mt-1" value={form.longitude} onChange={e => setForm({ ...form, longitude: e.target.value })} placeholder="-75.2321" />
                </label>
              </div>
              <label className="block">
                <span className="text-sm font-medium text-stone-700 dark:text-stone-300">Descripción</span>
                <textarea rows={2} className="input-base resize-none mt-1" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Descripción del restaurante..." />
              </label>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowModal(false)} className="btn-outline flex-1">Cancelar</button>
                <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Crear
                </button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function AdminDashboard() {
  const { user, loading } = useAuth()
  const [tab, setTab] = useState('owners')

  if (loading) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>

  if (user?.role !== 'admin') return (
    <div className="text-center py-24 px-4">
      <ShieldCheck className="w-14 h-14 mx-auto text-stone-300 mb-4" />
      <h1 className="font-bold text-2xl mb-2">Acceso restringido</h1>
      <p className="text-stone-500">Esta sección es solo para administradores.</p>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-primary-500 font-semibold text-sm mb-2">
          <ShieldCheck className="w-4 h-4" /> Panel de administración
        </div>
        <h1 className="font-bold text-3xl">Gestión de la plataforma</h1>
        <p className="text-stone-500 mt-1">Administra propietarios y restaurantes de ReservaYa.</p>
      </div>

      <div className="flex gap-1 bg-stone-100 dark:bg-stone-800 rounded-2xl p-1 mb-6 w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === id ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm' : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
            }`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
          {tab === 'owners'      && <OwnersTab />}
          {tab === 'restaurants' && <RestaurantsTab />}
          {tab === 'stats'       && <AdminStats />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
