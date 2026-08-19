const photoOptions = { maxWidth: 1280, maxHeight: 1280, quality: 0.78, type: 'image/jpeg' }
const signatureOptions = { maxWidth: 900, maxHeight: 450, quality: 0.82, type: 'image/png' }

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    const url = URL.createObjectURL(file)

    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Gagal membaca file gambar.'))
    }
    image.src = url
  })
}

function targetSize(width, height, maxWidth, maxHeight) {
  const scale = Math.min(1, maxWidth / width, maxHeight / height)
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

function extension(type) {
  if (type === 'image/png') return 'png'
  if (type === 'image/webp') return 'webp'
  return 'jpg'
}

function outputName(name, type) {
  return `${String(name || 'image').replace(/\.[^.]+$/, '')}.${extension(type)}`
}

function canvasBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Gagal mengompres gambar.'))
    }, type, quality)
  })
}

export async function compressEmployeeUploadImage(file, kind) {
  if (!file?.type?.startsWith('image/')) return file

  const options = kind === 'signature' ? signatureOptions : photoOptions
  const image = await loadImage(file)
  const { width, height } = targetSize(image.naturalWidth || image.width, image.naturalHeight || image.height, options.maxWidth, options.maxHeight)
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  canvas.width = width
  canvas.height = height

  if (options.type !== 'image/png') {
    context.fillStyle = '#fff'
    context.fillRect(0, 0, width, height)
  }

  context.drawImage(image, 0, 0, width, height)

  const blob = await canvasBlob(canvas, options.type, options.quality)
  if (blob.size >= file.size) return file

  return new File([blob], outputName(file.name, options.type), { type: options.type, lastModified: Date.now() })
}
