import { useEffect, useRef, useState } from 'react'
import { Camera, CheckCircle, Keyboard, Loader2, Search, Square, Upload } from 'lucide-react'
import { BrowserQRCodeReader } from '@zxing/browser'
import clsx from 'clsx'

const STATUS_LABEL = { confirmed: 'Confirmada', pending: 'Pendiente', completed: 'Completada', cancelled: 'Cancelada', no_show: 'No se presentó' }
const STATUS_BADGE = {
  confirmed: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
  completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  cancelled: 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400',
  no_show: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300',
}

export default function ReservationScanner({ restaurantName, onScan, onComplete, loading = false, result }) {
  const videoRef = useRef(null)
  const readerRef = useRef(null)
  const controlsRef = useRef(null)
  const lastCodeRef = useRef('')
  const [manualCode, setManualCode] = useState('')
  const [cameraOn, setCameraOn] = useState(false)
  const [cameraError, setCameraError] = useState('')

  useEffect(() => {
    return () => stopCamera()
  }, [])

  const stopCamera = () => {
    try { controlsRef.current?.stop() } catch (_) {}
    controlsRef.current = null
    readerRef.current = null
    setCameraOn(false)
  }

  const handleDetectedCode = (rawCode) => {
    const code = rawCode?.trim()
    if (code && code !== lastCodeRef.current) {
      lastCodeRef.current = code
      onScan(code)
    }
  }

  const startCamera = async () => {
    setCameraError('')
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError('Este navegador no permite abrir la cámara. Usa el código manual.')
        return
      }

      lastCodeRef.current = ''
      readerRef.current = new BrowserQRCodeReader()

      const controls = await readerRef.current.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        (result) => {
          if (result) handleDetectedCode(result.getText())
        }
      )
      controlsRef.current = controls
      setCameraOn(true)
    } catch (err) {
      setCameraError('No se pudo abrir la cámara. Revisa los permisos o usa el código manual.')
      setCameraOn(false)
    }
  }

  const submitManual = (event) => {
    event.preventDefault()
    const code = manualCode.trim()
    if (!code) return
    lastCodeRef.current = code
    onScan(code)
  }

  const scanImageFile = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setCameraError('')
    const imageUrl = URL.createObjectURL(file)

    try {
      const reader = readerRef.current ?? new BrowserQRCodeReader()
      const result = await reader.decodeFromImageUrl(imageUrl)
      handleDetectedCode(result.getText())
    } catch (err) {
      setCameraError('No pude leer un QR en esa imagen. Prueba con una foto mas nitida o usa el codigo manual.')
    } finally {
      URL.revokeObjectURL(imageUrl)
      event.target.value = ''
    }
  }

  const scanned = result?.reservation

  return (
    <div className="border border-stone-200 dark:border-stone-700 rounded-2xl p-4 mb-6 bg-stone-50 dark:bg-stone-900/40">
      <div className="flex flex-col xl:flex-row gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <Camera className="w-5 h-5 text-primary-500" />
            <div>
              <h3 className="font-semibold text-stone-900 dark:text-stone-100">Escanear reserva</h3>
              <p className="text-xs text-stone-500">{restaurantName}</p>
            </div>
          </div>

          <div className="aspect-video rounded-xl overflow-hidden bg-stone-900 relative flex items-center justify-center">
            <video ref={videoRef} muted playsInline className="absolute inset-0 h-full w-full object-cover" />
            {!cameraOn && (
              <div className="text-center text-stone-300 px-4">
                <Camera className="w-9 h-9 mx-auto mb-2 opacity-70" />
                <p className="text-sm">Cámara lista para leer el QR del cliente</p>
              </div>
            )}
          </div>

          {cameraError && <p className="text-xs text-red-500 mt-2">{cameraError}</p>}

          <div className="flex gap-2 mt-3">
            {cameraOn ? (
              <button type="button" onClick={stopCamera} className="btn-outline px-3 py-2 text-xs inline-flex items-center gap-2">
                <Square className="w-3.5 h-3.5" /> Detener
              </button>
            ) : (
              <button type="button" onClick={startCamera} className="btn-primary px-3 py-2 text-xs inline-flex items-center gap-2">
                <Camera className="w-3.5 h-3.5" /> Activar cámara
              </button>
            )}
            <label className="btn-outline px-3 py-2 text-xs inline-flex items-center gap-2 cursor-pointer">
              <Upload className="w-3.5 h-3.5" /> Subir QR
              <input type="file" accept="image/*" onChange={scanImageFile} className="sr-only" />
            </label>
          </div>
        </div>

        <div className="xl:w-96 space-y-4">
          <form onSubmit={submitManual} className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-stone-700 dark:text-stone-300">
              <Keyboard className="w-4 h-4" /> Código manual
            </label>
            <div className="flex gap-2">
              <input
                className="input-base text-sm"
                value={manualCode}
                onChange={e => setManualCode(e.target.value)}
                placeholder="RYA-000001 o reservaya-..."
              />
              <button type="submit" disabled={loading} className="btn-outline px-3 py-2" aria-label="Validar código">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </button>
            </div>
          </form>

          <div className="rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 p-4 min-h-40">
            {!scanned ? (
              <div className="text-sm text-stone-500">
                Escanea el QR enviado al cliente o escribe el código de reserva para validar su llegada.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-stone-900 dark:text-stone-100">{scanned.guest_name}</p>
                    <p className="text-xs text-stone-500">{scanned.code}</p>
                  </div>
                  <span className={clsx('text-[11px] font-semibold px-2 py-0.5 rounded-full', STATUS_BADGE[scanned.status] ?? 'bg-stone-100 text-stone-500')}>
                    {STATUS_LABEL[scanned.status] ?? scanned.status}
                  </span>
                </div>

                <div className="text-sm text-stone-500 space-y-1">
                  {scanned.start_time && <p>{new Date(scanned.start_time).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short', hour12: true })}</p>}
                  <p>{scanned.guests} {scanned.guests === 1 ? 'persona' : 'personas'} - {scanned.table}</p>
                  {scanned.guest_email && <p className="text-xs">{scanned.guest_email}</p>}
                </div>

                {scanned.status === 'completed' ? (
                  <div className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-300">
                    <CheckCircle className="w-4 h-4" /> Reserva completada
                  </div>
                ) : scanned.status === 'cancelled' ? (
                  <p className="text-sm font-medium text-red-500">Esta reserva fue cancelada.</p>
                ) : scanned.status === 'no_show' ? (
                  <p className="text-sm font-medium text-orange-600 dark:text-orange-300">Esta reserva fue marcada como no presentada.</p>
                ) : (
                  <button type="button" onClick={() => onComplete(scanned)} disabled={loading} className="btn-primary w-full text-sm flex items-center justify-center gap-2">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Validar llegada
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
