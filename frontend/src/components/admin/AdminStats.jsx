import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import { Store, Users, CalendarCheck, UserCheck, XCircle, TrendingUp } from 'lucide-react'
import Spinner from '../common/Spinner'
import { getAdminStats } from '../../api/admin'

const STATUS_COLORS = {
  confirmed:  '#22c55e',
  pending:    '#eab308',
  completed:  '#3b82f6',
  cancelled:  '#ef4444',
  no_show:    '#f97316',
}
const STATUS_LABELS = {
  confirmed: 'Confirmadas',
  pending:   'Pendientes',
  completed: 'Completadas',
  cancelled: 'Canceladas',
  no_show:   'No se presentaron',
}
const CAT_COLORS = ['#f97316','#fb923c','#fdba74','#fed7aa','#ea580c','#c2410c']

function StatCard({ icon: Icon, label, value, color = 'primary' }) {
  const colors = {
    primary: 'bg-primary-50 dark:bg-primary-900/20 text-primary-600',
    green:   'bg-green-50 dark:bg-green-900/20 text-green-600',
    blue:    'bg-blue-50 dark:bg-blue-900/20 text-blue-600',
    purple:  'bg-purple-50 dark:bg-purple-900/20 text-purple-600',
  }
  return (
    <div className="bg-white dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-2xl p-5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold text-stone-900 dark:text-stone-100">{value}</p>
      <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">{label}</p>
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

export default function AdminStats() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: getAdminStats,
    staleTime: 1000 * 60 * 5,
  })

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>
  if (error) return <p className="text-center text-stone-400 py-12">No se pudieron cargar las estadísticas.</p>

  const { summary, by_month, by_status, by_category } = data

  const pieData = by_status?.map(s => ({
    name:  STATUS_LABELS[s.estado] ?? s.estado,
    value: s.total,
    color: STATUS_COLORS[s.estado] ?? '#a8a29e',
  })) ?? []

  return (
    <div className="space-y-6">
      {/* Tarjetas resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Store}        label="Restaurantes"  value={summary.total_restaurants}  color="primary" />
        <StatCard icon={UserCheck}    label="Propietarios"  value={summary.total_owners}        color="green" />
        <StatCard icon={Users}        label="Clientes"      value={summary.total_clients}       color="blue" />
        <StatCard icon={CalendarCheck}label="Reservas"      value={summary.total_reservations}  color="purple" />
      </div>

      {/* Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-5 text-white">
          <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1">Reservas confirmadas</p>
          <p className="text-3xl font-bold">{summary.total_confirmed}</p>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-5 text-white">
          <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1">Reservas canceladas</p>
          <p className="text-3xl font-bold">{summary.total_cancelled}</p>
        </div>
        <div className="bg-gradient-to-br from-stone-700 to-stone-900 rounded-2xl p-5 text-white">
          <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1">Total comensales</p>
          <p className="text-3xl font-bold">{summary.total_guests}</p>
        </div>
      </div>

      {/* Reservas por mes */}
      <div className="bg-white dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp className="w-4 h-4 text-primary-500" />
          <h3 className="font-semibold">Reservas últimos 6 meses</h3>
        </div>
        {!by_month?.length ? (
          <p className="text-center text-stone-400 py-8 text-sm">Sin datos aún</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={by_month} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#a8a29e' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#a8a29e' }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f97316', opacity: 0.08 }} />
              <Bar dataKey="total" fill="#f97316" radius={[6, 6, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reservas por estado — Pie */}
        <div className="bg-white dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <CalendarCheck className="w-4 h-4 text-primary-500" />
            <h3 className="font-semibold">Reservas por estado</h3>
          </div>
          {!pieData.length ? (
            <p className="text-center text-stone-400 py-8 text-sm">Sin datos aún</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                  paddingAngle={3} dataKey="value">
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n]} />
                <Legend iconType="circle" iconSize={8} formatter={(v) => <span className="text-xs text-stone-600 dark:text-stone-400">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Restaurantes por categoría */}
        <div className="bg-white dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Store className="w-4 h-4 text-primary-500" />
            <h3 className="font-semibold">Restaurantes por categoría</h3>
          </div>
          {!by_category?.length ? (
            <p className="text-center text-stone-400 py-8 text-sm">Sin datos aún</p>
          ) : (
            <div className="space-y-3">
              {by_category.map((cat, i) => {
                const max = by_category[0]?.total ?? 1
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-lg w-7 flex-shrink-0">{cat.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-stone-700 dark:text-stone-300 truncate">{cat.categoria}</p>
                        <p className="text-sm font-bold text-stone-900 dark:text-stone-100 ml-2">{cat.total}</p>
                      </div>
                      <div className="h-2 bg-stone-100 dark:bg-stone-700 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${(cat.total / max) * 100}%`, backgroundColor: CAT_COLORS[i % CAT_COLORS.length] }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
