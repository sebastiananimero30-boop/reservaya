import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, User, Loader2 } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import api from '../api/axios'

export default function Register() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, watch, formState: { errors } } = useForm()
  const password = watch('password')

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await api.post('/auth/register', {
        name: data.nombre,
        email: data.email,
        password: data.password,
        password_confirmation: data.password_confirmation,
      })
      toast.success('¡Cuenta creada! Ahora inicia sesión 🎉')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al registrarse')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 font-display text-3xl font-bold text-primary-500 mb-2">
            <span className="w-3 h-3 rounded-full bg-primary-500 inline-block" />
            ReservaYa
          </div>
          <p className="text-stone-500">Crea tu cuenta y empieza a reservar</p>
        </div>
        <div className="card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">Nombre completo</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input placeholder="Tu nombre" {...register('nombre', { required: 'El nombre es requerido' })} className="input-base pl-10" />
              </div>
              {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input type="email" placeholder="tu@email.com" {...register('email', { required: 'El email es requerido' })} className="input-base pl-10" />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input type="password" placeholder="Mínimo 8 caracteres" {...register('password', { required: true, minLength: { value: 8, message: 'Mínimo 8 caracteres' } })} className="input-base pl-10" />
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">Confirmar contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input type="password" placeholder="Repite tu contraseña"
                  {...register('password_confirmation', { validate: v => v === password || 'Las contraseñas no coinciden' })}
                  className="input-base pl-10" />
              </div>
              {errors.password_confirmation && <p className="text-red-500 text-xs mt-1">{errors.password_confirmation.message}</p>}
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creando cuenta...</> : 'Crear cuenta gratis'}
            </button>
          </form>
          <p className="text-center text-sm text-stone-500 mt-6">
            ¿Ya tienes cuenta? <Link to="/login" className="text-primary-500 font-semibold hover:underline">Inicia sesión</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
