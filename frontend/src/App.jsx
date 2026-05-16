import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Suspense, lazy, useState, useEffect } from 'react'
import Navbar from './components/common/Navbar'
import ChatBot from './components/chatbot/ChatBot'
import Spinner from './components/common/Spinner'
import ErrorBoundary from './components/common/ErrorBoundary'
import { AuthProvider } from './context/AuthContext'

const Home             = lazy(() => import('./pages/Home'))
const RestaurantDetail = lazy(() => import('./pages/RestaurantDetail'))
const Login            = lazy(() => import('./pages/Login'))
const Register         = lazy(() => import('./pages/Register'))
const MyReservations   = lazy(() => import('./pages/MyReservations'))
const OwnerDashboard   = lazy(() => import('./pages/OwnerDashboard'))
const AdminDashboard   = lazy(() => import('./pages/AdminDashboard'))
const Profile          = lazy(() => import('./pages/Profile'))
const GoogleCallback   = lazy(() => import('./pages/GoogleCallback'))

export default function App() {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="min-h-screen flex flex-col">
          <Navbar dark={dark} setDark={setDark} />
          <main className="flex-1">
            <ErrorBoundary>
              <Suspense fallback={<div className="flex items-center justify-center h-96"><Spinner size="lg" /></div>}>
                <Routes>
                  <Route path="/"                    element={<Home />} />
                  <Route path="/restaurantes/:id"    element={<RestaurantDetail />} />
                  <Route path="/login"               element={<Login />} />
                  <Route path="/registro"            element={<Register />} />
                  <Route path="/mis-reservas"        element={<MyReservations />} />
                  <Route path="/propietario"         element={<OwnerDashboard />} />
                  <Route path="/admin"               element={<AdminDashboard />} />
                  <Route path="/perfil"              element={<Profile />} />
                  <Route path="/auth/google/callback" element={<GoogleCallback />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </main>
          <ChatBot />
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}
