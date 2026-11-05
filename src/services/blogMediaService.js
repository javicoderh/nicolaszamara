import { cropRectangle } from './articleImageLayout.js'

export async function decodeEditorialImage(file) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 8 * 1024 * 1024) throw new Error('invalid_image')
  const image = await createImageBitmap(file)
  if (image.width * image.height > 20_000_000 || !image.width || !image.height) { image.close(); throw new Error('image_too_large') }
  return image
}

export function drawEditorialImage(canvas, image, edits, maxWidth = 1440) {
  const rect = cropRectangle(image.width, image.height, edits)
  canvas.width = Math.max(1, Math.min(maxWidth, Math.round(rect.width)))
  canvas.height = Math.max(1, Math.round(canvas.width / (edits?.aspect || 1.5)))
  const context = canvas.getContext('2d')
  if (!context) throw new Error('unsupported_image')
  context.drawImage(image, rect.x, rect.y, rect.width, rect.height, 0, 0, canvas.width, canvas.height)
}

export async function uploadBlogImage(file, signal, edits = {}) {
  const image = await decodeEditorialImage(file)
  try {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
    const canvas = document.createElement('canvas')
    drawEditorialImage(canvas, image, edits)
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', .84))
    if (!blob || blob.type !== 'image/webp') throw new Error('unsupported_image')
    if (blob.size > 2500000) throw new Error('image_payload_too_large')
    const content = await new Promise((resolve, reject) => {
      const reader = new FileReader(); reader.onerror = reject; reader.onload = () => resolve(reader.result.split(',')[1]); reader.readAsDataURL(blob)
    })
    const variants={}
    for(const width of [480,960,1440]){
      drawEditorialImage(canvas,image,edits,width)
      const variant=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',.84))
      if(!variant||variant.type!=='image/webp')throw new Error('unsupported_image')
      variants[width]=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onerror=reject;reader.onload=()=>resolve(reader.result.split(',')[1]);reader.readAsDataURL(variant)})
    }
    const body=JSON.stringify({content,variants})
    if(new Blob([body]).size>4_000_000)throw new Error('image_payload_too_large')
    const response = await fetch('/api/admin/media', { method: 'POST', signal, credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Request': '1' }, body })
    const result = await response.json()
    if (!response.ok) throw new Error(result.status)
    return result
  } finally { image.close() }
}

export const uploadBlogCover = (file, signal) => uploadBlogImage(file, signal)

export function editorialMediaUrl(src, privateMedia = false) {
  return privateMedia && src?.startsWith('/blog-media/') ? `/api/admin/media?id=${src.slice(12)}&preview=1` : src
}

export function editorialSrcSet(src,privateMedia=false){return !privateMedia&&src?.startsWith('/blog-media/')?[480,960,1440].map(width=>`${src}?width=${width} ${width}w`).join(', '):undefined}
