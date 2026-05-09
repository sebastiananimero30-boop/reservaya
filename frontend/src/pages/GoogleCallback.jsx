import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../api/axios'
import Spinner from '../components/common/Spinner'

/**
 * Página que Google llama después de que el usuario autoriza.
 * URL: http://localhost:5173/auth/google/callback?code=xxx
 * Toma el código de la URL, lo manda al backend y redirige al home.
 */
export default function GoogleCallback() {
  const navigate = useNavigate()
  const called = useRef(false)

  useEffect(() => {
    // useRef evita que se llame dos veces en StrictMode
    if (called.current) return
    called.current = true

    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const error = params.get('error')

    if (error || !code) {
      toast.error('Autenticación cancelada')
      navigate('/login')
      return
    }

    api.post('/auth/google/callback', { code })
      .then(({ data }) => {
        localStorage.setItem('token', data.token)
        api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
        toast.success(`¡Bienvenido, ${data.user.name?.split(' ')[0]}! 🎉`)
        // Recarga completa para que AuthContext lea el token del localStorage
        window.location.href = '/'
      })
      .catch(err => {
        const msg = err.response?.data?.message || 'Error al iniciar sesión con Google'
        toast.error(msg)
        navigate('/login')
      })
  }, [navigate])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Spinner size="lg" />
      <p className="text-stone-500 text-sm">Verificando tu cuenta de Google...</p>
    </div>
  )
}
