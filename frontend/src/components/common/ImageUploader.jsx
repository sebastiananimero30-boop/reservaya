import { useRef, useState } from 'react'
import { Upload, X, ImagePlus, Loader2 } from 'lucide-react'
import { useCloudinaryUpload } from '../../hooks/useCloudinaryUpload'
import toast from 'react-hot-toast'
import clsx from 'clsx'

/**
 * Componente de subida de imágenes con Cloudinary.
 * Soporta drag & drop, click para seleccionar y preview.
 *
 * Props:
 * - onUpload(url): callback con la URL de Cloudinary
 * - currentUrl: URL actual para mostrar preview
 * - label: texto del botón
 */
export default function ImageUploader({ onUpload, currentUrl = '', label = 'Subir foto' }) {
  const { upload, uploading, progress } = useCloudinaryUpload()
  const [preview, setPreview] = useState(currentUrl)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)

  const handleFile = async (file) => {
    if (!file) return

    // Preview local inmediato
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target.result)
    reader.readAsDataURL(file)

    try {
      const url = await upload(file)
      onUpload(url)
      toast.success('Imagen subida correctamente')
    } catch (err) {
      toast.error(err.message || 'Error al subir la imagen')
      setPreview(currentUrl) // revertir preview si falla
    }
  }

  const handleChange = (e) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  const handleDragOver = (e) => { e.preventDefault(); setDragging(true) }
  const handleDragLeave = () => setDragging(false)

  const clearImage = (e) => {
    e.stopPropagation()
    setPreview('')
    onUpload('')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div
      onClick={() => !uploading && inputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={clsx(
        'relative w-full rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden',
        dragging
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
          : 'border-stone-200 dark:border-stone-600 hover:border-primary-400 bg-stone-50 dark:bg-stone-700/50',
        uploading && 'cursor-not-allowed opacity-80'
      )}
      style={{ minHeight: '160px' }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
        disabled={uploading}
      />

      {preview ? (
        // Preview de la imagen
        <div className="relative w-full h-40">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-full object-cover"
            onError={() => setPreview('')}
          />
          <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <span className="text-white text-sm font-semibold bg-black/50 px-3 py-1.5 rounded-full">
              Cambiar foto
            </span>
          </div>
          {!uploading && (
            <button
              type="button"
              onClick={clearImage}
              className="absolute top-2 right-2 w-7 h-7 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors shadow-lg"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : (
        // Estado vacío
        <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
          <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center mb-3">
            <ImagePlus className="w-6 h-6 text-primary-500" />
          </div>
          <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">{label}</p>
          <p className="text-xs text-stone-400 mt-1">Arrastra una imagen o haz clic para seleccionar</p>
          <p className="text-xs text-stone-300 mt-0.5">JPG, PNG, WebP · Máx 10MB</p>
        </div>
      )}

      {/* Barra de progreso */}
      {uploading && (
        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
          <div className="w-32 bg-white/20 rounded-full h-1.5">
            <div
              className="bg-white h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-white text-xs font-semibold">{progress}%</p>
        </div>
      )}
    </div>
  )
}
