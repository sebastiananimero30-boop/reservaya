import '@testing-library/jest-dom'
import { vi, beforeAll, afterAll, afterEach } from 'vitest'
import { server } from './mocks/server'

// Inicia el servidor MSW antes de todos los tests
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// Mock de variables de entorno
vi.stubEnv('VITE_API_URL', 'http://localhost:8000/api')
vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-client-id')
vi.stubEnv('VITE_GROQ_KEY', 'test-groq-key')

// Mock de localStorage
const localStorageMock = (() => {
  let store = {}
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => { store[key] = String(value) },
    removeItem: (key) => { delete store[key] },
    clear: () => { store = {} },
  }
})()
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock de window.location
delete window.location
window.location = { href: '', assign: vi.fn(), reload: vi.fn() }

// Silencia warnings de React en tests
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('Warning:')) return
    originalError(...args)
  }
})
afterAll(() => { console.error = originalError })
