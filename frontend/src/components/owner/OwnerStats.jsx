import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Cell
} from 'recharts'
import { TrendingUp, Users, CalendarCheck, XCircle, CheckCircle, Star, UserX } from 'lucide-react'
import Spinner from '../common/Spinner'
import { getOwnerStats } from '../../api/owner'

const COLORS = ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5', '#fff7ed', '#ea580c', '#c2410c']

function StatCard({ icon: Icon, label, value, sub, color = 'primary' }) {
  const colors = {
    primary:  'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400',
    green:    'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    red:      'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400',
    blue:     'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    orange:   'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-300',
  }
  return (
    <div className="bg-white dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-2xl p-5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold text-stone-900 dark:text-stone-100">{value}</p>
      <p className="text-sm font-medium text-stone-600 dark:text-stone-400 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-stone-400 mt-1">{sub}</p>}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 shadow-lg text-sm">
      <p className="font-semibold text-stone-700 dark:text-stone-300">{label}</p>
      <p className="text-primary-500 font-bold">{payload[0].value} reservas</p>
    </div>
  )
}

export default function OwnerStats({ restaurantId, restaurantName }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['owner-stats', restaurantId],
    queryFn: () => getOwnerStats(restaurantId),
    enabled: !!restaurantId,
    staleTime: 1000 * 60 * 5, // 5 min cache
  })

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>

  if (error) return (
    <div className="text-center py-12 text-stone-400">
      <p>No se pudieron cargar las estadísticas.</p>
    </div>
  )

  const { summary, by_hour, by_day, menu_items } = data

  // Filtrar horas con actividad para el gráfico
  const activeHours = by_hour?.filter(h => h.reservas > 0) ?? []
  const peakHour = by_hour?.reduce((a, b) => b.reservas > a.reservas ? b : a, { hora: '-', reservas: 0 })
  const peakDay  = by_day?.reduce((a, b) => b.total > a.total ? b : a, { day: '-', total: 0 })

  return (
    <div className="space-y-6">
      {/* Tarjetas resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={CalendarCheck} label="Total reservas"   value={summary.total_reservations} color="primary" />
        <StatCard icon={CheckCircle}   label="Confirmadas"      value={summary.confirmed}  color="green" />
        <StatCard icon={XCircle}       label="Canceladas"       value={summary.cancelled}  color="red" />
        <StatCard icon={UserX}         label="No se presentaron" value={summary.no_show ?? 0} color="orange" />
        <StatCard icon={Users}         label="Comensales"       value={summary.total_guests} sub={`Promedio ${summary.avg_guests} por reserva`} color="blue" />
      </div>

      {/* Highlights */}
      {(peakHour.reservas > 0 || peakDay.total > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {peakHour.reservas > 0 && (
            <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-5 text-white">
              <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1">Hora pico</p>
              <p className="text-3xl font-bold">{peakHour.hora}</p>
              <p className="text-white/80 text-sm mt-1">{peakHour.reservas} reservas en ese horario</p>
            </div>
          )}
          {peakDay.total > 0 && (
            <div className="bg-gradient-to-br from-stone-700 to-stone-900 rounded-2xl p-5 text-white">
              <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1">Día más activo</p>
              <p className="text-3xl font-bold">{peakDay.day}</p>
              <p className="text-white/80 text-sm mt-1">{peakDay.total} reservas ese día</p>
            </div>
          )}
        </div>
      )}

      {/* Gráfica por hora */}
      <div className="bg-white dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp className="w-4 h-4 text-primary-500" />
          <h3 className="font-semibold">Reservas por hora del día</h3>
        </div>
        {activeHours.length === 0 ? (
          <p className="text-center text-stone-400 py-8 text-sm">Sin datos suficientes aún</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={by_hour} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
              <XAxis dataKey="hora" tick={{ fontSize: 11, fill: '#a8a29e' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#a8a29e' }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f97316', opacity: 0.08 }} />
              <Bar dataKey="reservas" radius={[6, 6, 0, 0]} maxBarSize={40}>
                {by_hour.map((entry, i) => (
                  <Cell key={i} fill={entry.reservas === peakHour.reservas && entry.reservas > 0 ? '#f97316' : '#fed7aa'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Gráfica por día */}
      <div className="bg-white dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <CalendarCheck className="w-4 h-4 text-primary-500" />
          <h3 className="font-semibold">Reservas por día de la semana</h3>
        </div>
        {by_day?.every(d => d.total === 0) ? (
          <p className="text-center text-stone-400 py-8 text-sm">Sin datos suficientes aún</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={by_day} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#a8a29e' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#a8a29e' }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f97316', opacity: 0.08 }} />
              <Bar dataKey="total" radius={[6, 6, 0, 0]} maxBarSize={48}>
                {by_day?.map((entry, i) => (
                  <Cell key={i} fill={entry.total === peakDay.total && entry.total > 0 ? '#f97316' : '#fed7aa'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Platos del menú */}
      {menu_items?.length > 0 && (
        <div className="bg-white dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Star className="w-4 h-4 text-primary-500" />
            <h3 className="font-semibold">Platos disponibles en carta</h3>
            <span className="ml-auto text-xs text-stone-400">{menu_items.length} platos</span>
          </div>
          <div className="space-y-3">
            {menu_items.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-stone-800 dark:text-stone-200 truncate">{item.nombre}</p>
                    <p className="text-sm font-bold text-primary-500 flex-shrink-0">${Number(item.precio).toLocaleString('es-CO')}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 bg-stone-100 dark:bg-stone-700 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${Math.max(15, 100 - i * 12)}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                    </div>
                    <span className="text-xs text-stone-400 flex-shrink-0">{item.categoria}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
