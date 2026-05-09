import { useState } from 'react'

const CLOUD_NAME   = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
const UPLOAD_URL   = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`

/**
 * Hook para subir imágenes a Cloudinary directamente desde el frontend.
 * Usa un upload preset unsigned — no expone credenciales secretas.
 *
 * @returns {{ upload, uploading, progress }}
 */
export function useCloudinaryUpload() {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress]   = useState(0)

  const upload = (file) => {
    return new Promise((resolve, reject) => {
      if (!file) return reject(new Error('No se seleccionó ningún archivo'))

      // Validaciones básicas
      if (!file.type.startsWith('image/')) {
        return reject(new Error('Solo se permiten imágenes'))
      }
      if (file.size > 10 * 1024 * 1024) {
        return reject(new Error('La imagen no puede superar 10MB'))
      }

      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', UPLOAD_PRESET)
      formData.append('folder', 'reservaya')

      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100))
        }
      })

      xhr.addEventListener('load', () => {
        setUploading(false)
        setProgress(0)
        if (xhr.status === 200) {
          const data = JSON.parse(xhr.responseText)
          resolve(data.secure_url)
        } else {
          const err = JSON.parse(xhr.responseText)
          reject(new Error(err.error?.message || 'Error al subir la imagen'))
        }
      })

      xhr.addEventListener('error', () => {
        setUploading(false)
        setProgress(0)
        reject(new Error('Error de conexión al subir la imagen'))
      })

      setUploading(true)
      setProgress(0)
      xhr.open('POST', UPLOAD_URL)
      xhr.send(formData)
    })
  }

  return { upload, uploading, progress }
}
