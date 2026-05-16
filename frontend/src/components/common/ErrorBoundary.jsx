import { Component } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

/**
 * Error Boundary — captura errores en componentes hijos y muestra
 * una UI de fallback en vez de romper toda la página.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    // En producción aquí iría Sentry o similar
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="w-14 h-14 bg-red-100 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mb-4">
            <AlertTriangle className="w-7 h-7 text-red-500" />
          </div>
          <h2 className="font-bold text-xl text-stone-800 dark:text-stone-100 mb-2">
            Algo salió mal
          </h2>
          <p className="text-stone-500 text-sm mb-6 max-w-sm">
            Ocurrió un error inesperado. Intenta recargar la página.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null })
              window.location.reload()
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Recargar página
          </button>
          {import.meta.env.DEV && this.state.error && (
            <details className="mt-6 text-left w-full max-w-lg">
              <summary className="text-xs text-stone-400 cursor-pointer">Ver detalles del error</summary>
              <pre className="mt-2 text-xs bg-stone-100 dark:bg-stone-800 p-3 rounded-xl overflow-auto text-red-500">
                {this.state.error.toString()}
              </pre>
            </details>
          )}
        </div>
      )
    }

    return this.props.children
  }
}
