import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2, RotateCcw, X, PackageX } from 'lucide-react'
import { getTrashedMenuItems, restoreMenuItem, forceDeleteMenuItem } from '../../api/owner'
import toast from 'react-hot-toast'
import PropTypes from 'prop-types'

export default function TrashedMenuItems({ restaurantId }) {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['menu-trashed', restaurantId],
    queryFn: () => getTrashedMenuItems(restaurantId).then(r => r.data ?? []),
    enabled: !!restaurantId,
  })

  const restoreMutation = useMutation({
    mutationFn: restoreMenuItem,
    onSuccess: () => {
      toast.success('Plato restaurado')
      qc.invalidateQueries(['menu-trashed', restaurantId])
      qc.invalidateQueries(['owner-menu', restaurantId])
    },
    onError: () => toast.error('No se pudo restaurar'),
  })

  const forceMutation = useMutation({
    mutationFn: forceDeleteMenuItem,
    onSuccess: () => {
      toast.success('Plato eliminado permanentemente')
      qc.invalidateQueries(['menu-trashed', restaurantId])
    },
    onError: () => toast.error('No se pudo eliminar'),
  })

  const items = data ?? []

  if (isLoading) return <p className="text-sm text-stone-400 py-4">Cargando papelera...</p>

  if (!items.length) return (
    <div className="text-center py-10 text-stone-400">
      <PackageX className="w-10 h-10 mx-auto mb-2 opacity-40" />
      <p className="text-sm">La papelera está vacía</p>
    </div>
  )

  return (
    <div className="space-y-3">
      {items.map(item => (
        <div key={item.id} className="flex items-center justify-between gap-4 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-stone-700 dark:text-stone-300 truncate">{item.name}</p>
            <p className="text-xs text-stone-400">{item.category} · ${Number(item.price).toLocaleString('es-CO')}</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => restoreMutation.mutate(item.id)}
              disabled={restoreMutation.isPending}
              className="flex items-center gap-1.5 text-xs bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1.5 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Restaurar
            </button>
            <button
              onClick={() => {
                if (confirm('¿Eliminar permanentemente? Esta acción no se puede deshacer.')) {
                  forceMutation.mutate(item.id)
                }
              }}
              disabled={forceMutation.isPending}
              className="flex items-center gap-1.5 text-xs bg-red-100 hover:bg-red-200 text-red-600 px-3 py-1.5 rounded-lg transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Eliminar
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

TrashedMenuItems.propTypes = {
  restaurantId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
}
