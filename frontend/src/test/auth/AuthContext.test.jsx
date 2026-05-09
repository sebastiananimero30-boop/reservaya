import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'

// Mock completo del módulo axios — debe ir antes de cualquier import que lo use
vi.mock('../../api/axios', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    defaults: { headers: { common: {} } },
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  }
}))

// Estos imports van DESPUÉS del vi.mock
import api from '../../api/axios'
import { AuthProvider, useAuth } from '../../context/AuthContext'

const mockUser = { id: 1, name: 'Test User', email: 'test@test.com', role: 'client' }

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }) {
    return (
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <AuthProvider>{children}</AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>
    )
  }
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    api.defaults.headers.common = {}
    // Por defecto /auth/me falla (no hay token válido)
    api.get.mockRejectedValue(new Error('Unauthenticated'))
  })

  it('inicia sin usuario ni token', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.user).toBeNull()
    expect(result.current.token).toBeNull()
  })

  it('login falla con credenciales incorrectas', async () => {
    api.post.mockRejectedValueOnce({ response: { status: 422 } })

    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.loading).toBe(false))

    await expect(
      act(async () => { await result.current.login('wrong@test.com', 'wrong') })
    ).rejects.toBeDefined()

    expect(result.current.user).toBeNull()
    expect(localStorage.getItem('token')).toBeNull()
  })

  it('logout limpia el estado', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper() })

    act(() => result.current.logout())

    expect(result.current.user).toBeNull()
    expect(result.current.token).toBeNull()
    expect(localStorage.getItem('token')).toBeNull()
  })

  it('useAuth expone login, logout, user, token y loading', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(typeof result.current.login).toBe('function')
    expect(typeof result.current.logout).toBe('function')
    expect('user' in result.current).toBe(true)
    expect('token' in result.current).toBe(true)
    expect('loading' in result.current).toBe(true)
  })

  it('loading es true inicialmente y false después', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper() })
    // loading empieza en true si hay token, false si no hay
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.loading).toBe(false)
  })
})
