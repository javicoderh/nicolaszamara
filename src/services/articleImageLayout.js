export function articleTextFlow(blocks, hasImage) {
  const flow = blocks.filter((block) => block.type !== 'image')
  if (hasImage && flow.length === 1 && flow[0].type === 'paragraph') {
    const words = flow[0].text.trim().split(/\s+/)
    if (words.length >= 2) {
      const middle = Math.min(words.length - 1, Math.ceil(words.length * .55))
      return [{ ...flow[0], text: words.slice(0, middle).join(' ') }, { ...flow[0], text: words.slice(middle).join(' ') }]
    }
  }
  return flow
}

export function articleImagePlacement(blocks, image = {}) {
  if (!blocks.length) return -1
  if (Number.isInteger(image.afterBlock)) return Math.min(Math.max(0, image.afterBlock), Math.max(0, blocks.length - 2))
  const words = (block) => (block.text || block.items?.join(' ') || '').trim().split(/\s+/).filter(Boolean).length
  const target = blocks.reduce((sum, block) => sum + words(block), 0) * .55
  let cumulative = 0
  for (let index = 0; index < blocks.length - 1; index += 1) {
    cumulative += words(blocks[index])
    if (cumulative >= target && ['paragraph', 'quote', 'list'].includes(blocks[index].type)) return index
  }
  // Reserve at least one following paragraph for text to flow beside the image.
  for (let index = blocks.length - 2; index >= 0; index -= 1) if (['paragraph', 'quote', 'list'].includes(blocks[index].type)) return index
  return 0
}

export function cropRectangle(width, height, { aspect = 1.5, zoom = 1, x = 50, y = 50 } = {}) {
  if (![width, height, aspect, zoom, x, y].every(Number.isFinite) || width <= 0 || height <= 0 || aspect <= 0 || zoom < 1 || zoom > 3 || x < 0 || x > 100 || y < 0 || y > 100) throw new Error('invalid_crop')
  const cropWidth = (width / height > aspect ? height * aspect : width) / zoom
  const cropHeight = cropWidth / aspect
  return { x: (width - cropWidth) * x / 100, y: (height - cropHeight) * y / 100, width: cropWidth, height: cropHeight }
}
