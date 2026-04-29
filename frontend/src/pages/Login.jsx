import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await login(data.email, data.password)
      toast.success('¡Bienvenido de vuelta! 🎉')
      navigate('/')
    } catch {
      toast.error('Email o contraseña incorrectos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 font-display text-3xl font-bold text-primary-500 mb-2">
            <span className="w-3 h-3 rounded-full bg-primary-500 inline-block" />
            ReservaYa
          </div>
          <p className="text-stone-500">Inicia sesión para reservar tu mesa</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input type="email" placeholder="tu@email.com"
                  {...register('email', { required: 'El email es requerido' })}
                  className="input-base pl-10"
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input type="password" placeholder="••••••••"
                  {...register('password', { required: 'La contraseña es requerida', minLength: { value: 6, message: 'Mínimo 6 caracteres' } })}
                  className="input-base pl-10"
                />
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Ingresando...</> : 'Iniciar sesión'}
            </button>
          </form>

          <p className="text-center text-sm text-stone-500 mt-6">
            ¿No tienes cuenta?{' '}
            <Link to="/registro" className="text-primary-500 font-semibold hover:underline">
              Regístrate gratis
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
