import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { KeyRound, Eye, EyeOff, Copy, Check, Loader2 } from 'lucide-react'
import { resetOwnerPassword } from '../../api/admin'
import toast from 'react-hot-toast'

export default function ResetOwnerPassword({ owners = [] }) {
  const [selectedId, setSelectedId] = useState('')
  const [customPassword, setCustomPassword] = useState('')
  const [useCustom, setUseCustom] = useState(false)
  const [result, setResult] = useState(null)
  const [showPass, setShowPass] = useState(false)
  const [copied, setCopied] = useState(false)

  const mutation = useMutation({
    mutationFn: () => resetOwnerPassword(selectedId, useCustom ? customPassword : null),
    onSuccess: (data) => {
      setResult(data)
      toast.success('Contraseña actualizada')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Error al cambiar contraseña'),
  })

  const copy = () => {
    navigator.clipboard.writeText(result.password)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const reset = () => {
    setResult(null)
    setSelectedId('')
    setCustomPassword('')
    setUseCustom(false)
  }

  if (result) return (
    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-5 space-y-3">
      <p className="font-semibold text-green-700 dark:text-green-400">✅ Contraseña actualizada</p>
      <p className="text-sm text-stone-600 dark:text-stone-400">{result.message}</p>
      <div className="bg-white dark:bg-stone-800 rounded-xl p-3 flex items-center justify-between gap-3">
        <p className="font-mono text-sm font-medium">
          {showPass ? result.password : '•'.repeat(result.password.length)}
        </p>
        <div className="flex gap-2">
          <button onClick={() => setShowPass(s => !s)} className="text-stone-400 hover:text-stone-600">
            {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          <button onClick={copy} className="text-stone-400 hover:text-primary-500">
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>
      <button onClick={reset} className="btn-outline text-sm w-full">Cambiar otra contraseña</button>
    </div>
  )

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-stone-700 dark:text-stone-300 block mb-1.5">
          Seleccionar propietario
        </label>
        <select
          value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
          className="input-base text-sm"
        >
          <option value="">-- Selecciona un propietario --</option>
          {owners.map(o => (
            <option key={o.id} value={o.id}>{o.name} ({o.email})</option>
          ))}
        </select>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={useCustom}
          onChange={e => setUseCustom(e.target.checked)}
          className="accent-primary-500"
        />
        <span className="text-sm text-stone-600 dark:text-stone-400">Establecer contraseña personalizada</span>
      </label>

      {useCustom && (
        <div>
          <label className="text-sm font-medium text-stone-700 dark:text-stone-300 block mb-1.5">
            Nueva contraseña (mín. 8 caracteres)
          </label>
          <input
            type="text"
            value={customPassword}
            onChange={e => setCustomPassword(e.target.value)}
            placeholder="MiNuevaPass123"
            className="input-base text-sm"
          />
        </div>
      )}

      {!useCustom && (
        <p className="text-xs text-stone-400 bg-stone-50 dark:bg-stone-700 rounded-xl p-3">
          🔐 Se generará una contraseña segura automáticamente de 12 caracteres.
        </p>
      )}

      <button
        onClick={() => mutation.mutate()}
        disabled={!selectedId || mutation.isPending || (useCustom && customPassword.length < 8)}
        className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
      >
        {mutation.isPending
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <KeyRound className="w-4 h-4" />
        }
        Cambiar contraseña
      </button>
    </div>
  )
}
